import { randomInt, randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocket, WebSocketServer } from 'ws';
import { GameMode } from '../src/types';
import { buildLesson, type LessonSelection } from '../src/mini-games/gakuro-kart/questions';
import { addPlayer, command, createGolf, disconnectPlayer, MAX_PLAYERS, setHoleCount, setSpectator, startGolf, tick, viewFor, type GolfWorld } from '../src/mini-games/gakuro-golf/engine';

export const GOLF_SERVER_PROTOCOL = 2;
export const GOLF_ENDPOINT = '/golf';
const MAX_SETUP_BYTES = 512 * 1024;
const modes = new Set<string>(Object.values(GameMode));
export function validGolfSelection(raw: unknown): raw is LessonSelection {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
  const s = raw as LessonSelection;
  if (!modes.has(s.mode) || (s.title !== undefined && (typeof s.title !== 'string' || s.title.length > 160))) return false;
  const validModes = (v: unknown) => Array.isArray(v) && v.length > 0 && v.length <= 200 && v.every(m => typeof m === 'string' && modes.has(m));
  if (s.modes !== undefined && !validModes(s.modes)) return false;
  if (s.assignment !== undefined) {
    const a = s.assignment;
    if (!a || typeof a !== 'object' || typeof a.title !== 'string' || a.title.length > 160 || !Array.isArray(a.units) || a.units.length > 200 || !a.units.every(u => u && typeof u.name === 'string' && u.name.length <= 160 && validModes(u.modes))) return false;
    if (a.customProblems !== undefined && (!Array.isArray(a.customProblems) || a.customProblems.length > 1000 || !a.customProblems.every(p => p && typeof p.id === 'string' && p.id.length <= 300 && typeof p.question === 'string' && p.question.length > 0 && p.question.length <= 12000 && typeof p.answer === 'string' && p.answer.trim().length > 0 && p.answer.length <= 3000 && Array.isArray(p.options) && p.options.length <= 20 && p.options.every(o => typeof o === 'string' && o.length <= 3000)))) return false;
  }
  return JSON.stringify(raw).length <= MAX_SETUP_BYTES;
}
interface Member { observedId?: string; socket: WebSocket; id: string; alive: boolean; at: number; count: number }
interface Room { code: string; world: GolfWorld; host: string; members: Map<string, Member>; selection: LessonSelection | null; sequence: number; lastActive: number }
export interface GolfServerOptions { allowedOrigins?: ReadonlySet<string>; maxRooms?: number; maxClients?: number; idleMs?: number }
/** Router-neutral adapter. The shared server routes /golf upgrades to `sockets`. */
export function createGolfServer(options: GolfServerOptions = {}) {
  const sockets = new WebSocketServer({ noServer: true, maxPayload: MAX_SETUP_BYTES, perMessageDeflate: false });
  const rooms = new Map<string, Room>(), members = new Map<WebSocket, Member>();
  const maxRooms = options.maxRooms ?? 4, maxClients = options.maxClients ?? 160, idleMs = options.idleMs ?? 30 * 60 * 1000;
  let closed = false;
  function send(m: Member, packet: object) {
    if (m.socket.readyState === WebSocket.OPEN && m.socket.bufferedAmount < 65536) m.socket.send(JSON.stringify(packet));
  }
  function emit(room: Room, init?: Member) {
    const sequence = ++room.sequence;
    for (const m of room.members.values()) send(m, { type: m === init ? 'init' : 'state', version: GOLF_SERVER_PROTOCOL, sequence, state: viewFor(room.world, m.id, m.id === room.host ? m.observedId : undefined) });
  }
  function acknowledge(room: Room, m: Member) {
    // Answer/shot feedback goes to the actor immediately. Other players receive
    // the next shared tick instead of 40 full broadcasts for 40 simultaneous inputs.
    send(m, {type:'state', version:GOLF_SERVER_PROTOCOL, sequence:++room.sequence, state:viewFor(room.world,m.id,m.id === room.host ? m.observedId : undefined)});
  }
  function fail(m: Member, message: string, fatal = false) {
    send(m, { type: 'error', message });
    if (fatal) m.socket.close(1008, 'Golf connection rejected');
  }
  function rotateHost(room: Room) {
    if (room.members.has(room.host)) return;
    room.host = room.members.keys().next().value || '';
    for (const m of room.members.values()) send(m, { type: 'connected', id: m.id, code: room.code, host: m.id === room.host });
  }
  sockets.on('connection', (socket: WebSocket, request: IncomingMessage) => {
    if (closed || (options.allowedOrigins?.size && (!request.headers.origin || !options.allowedOrigins.has(request.headers.origin)))) { socket.close(1008, 'Origin denied'); return; }
    if (members.size >= maxClients) { socket.close(1013, 'Server busy'); return; }
    const m: Member = { socket, id: randomUUID(), alive: true, at: Date.now(), count: 0 }; members.set(socket, m);
    let room: Room | null = null;
    const timeout = setTimeout(() => { if (!room) socket.close(1008, 'Handshake timeout'); }, 15000); timeout.unref();
    socket.on('pong', () => { m.alive = true; });
    socket.on('message', raw => {
      let d: any; try { d = JSON.parse(raw.toString()); } catch { fail(m, '操作データが不正です。'); return; }
      if (!d || typeof d !== 'object' || Array.isArray(d)) return;
      const now = Date.now(); if (now - m.at >= 1000) { m.at = now; m.count = 0; } if (++m.count > 30) return;
      if (d.type === 'ping') { send(m, { type: 'pong', at: d.at }); return; }
      if (!room) {
        if (d.type !== 'connect' || d.protocol !== GOLF_SERVER_PROTOCOL || typeof d.name !== 'string' || typeof d.create !== 'boolean') { fail(m, '接続設定が不正です。', true); return; }
        let candidate: Room | undefined;
        if (d.create) {
          if (rooms.size >= maxRooms) { fail(m, 'サーバーの部屋数上限です。', true); return; }
          const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let code: string;
          do { code = Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join(''); } while (rooms.has(code));
          candidate = { code, world: createGolf(randomInt(1, 0x100000000)), host: m.id, members: new Map(), selection: null, sequence: 0, lastActive: now };
        } else {
          const code = typeof d.code === 'string' ? d.code.trim().toUpperCase() : '';
          if (!/^[A-Z2-9]{6}$/.test(code)) { fail(m, '6文字のルームコードを入力してください。', true); return; }
          candidate = rooms.get(code);
          if (!candidate) { fail(m, '部屋が見つかりません。', true); return; }
        }
        if (candidate.members.size >= MAX_PLAYERS || !addPlayer(candidate.world, m.id, d.name)) { fail(m, '満員、またはラウンド終了済みです。', true); return; }
        room = candidate; rooms.set(room.code, room); room.members.set(m.id, m); room.lastActive = now; clearTimeout(timeout);
        send(m, { type: 'connected', id: m.id, code: room.code, host: m.id === room.host }); emit(room, m); return;
      }
      room.lastActive = now;
      try {
        if (d.type === 'spectator') {
          if (m.id === room.host && setSpectator(room.world, m.id, d.enabled)) { m.observedId = undefined; emit(room); }
          return;
        }
        if (d.type === 'observe') {
          if (m.id !== room.host || !room.world.players[m.id]?.spectator) return;
          m.observedId = typeof d.id === 'string' && room.world.players[d.id]?.connected && !room.world.players[d.id]?.spectator ? d.id : undefined;
          acknowledge(room, m); return;
        }
        if (d.type === 'lesson') {
          if (m.id !== room.host || room.world.phase !== 'lobby') { fail(m, 'ホストだけが問題を設定できます。'); return; }
          if (!validGolfSelection(d.selection)) { fail(m, '問題の設定が不正です。'); return; }
          const selection = structuredClone(d.selection), sample = buildLesson(selection);
          room.selection = selection; room.world.title = sample.title; emit(room); return;
        }
        if (d.type === 'holes') {
          if (m.id === room.host && setHoleCount(room.world, d.count)) emit(room);
          return;
        }
        if (d.type === 'start') {
          if (m.id !== room.host || !room.selection) { fail(m, 'ホストだけがラウンドを開始できます。'); return; }
          if (startGolf(room.world, room.world.title)) emit(room); return;
        }
        if (d.type === 'command') {
          // Clients send only their input. Results, answer keys and ball positions stay authoritative.
          if (command(room.world, m.id, d.command, room.selection ? () => buildLesson(room!.selection!) : undefined)) acknowledge(room,m);
        }
      } catch { fail(m, '問題を準備できませんでした。'); }
    });
    socket.on('error', () => {});
    socket.on('close', () => {
      clearTimeout(timeout); members.delete(socket);
      if (!room) return;
      room.members.delete(m.id); disconnectPlayer(room.world, m.id);
      if (!room.members.size) { rooms.delete(room.code); return; }
      // The owner controls the lobby, not physics. Render keeps simulating after the owner leaves.
      rotateHost(room); emit(room);
    });
  });
  let previous = performance.now(), accumulator = 0, broadcast = 0;
  const simulation = setInterval(() => {
    const now = performance.now(), elapsed = Math.min(.25, (now - previous) / 1000); previous = now;
    accumulator += elapsed;
    while (accumulator >= 1 / 30) { for (const room of rooms.values()) tick(room.world, 1 / 30); accumulator -= 1 / 30; }
    broadcast += elapsed;
    if (broadcast < .2) return; broadcast = 0;
    for (const [code, room] of rooms) {
      if (Date.now() - room.lastActive > idleMs && !Object.values(room.world.players).some(p => p.phase === 'moving')) {
        rooms.delete(code); for (const m of room.members.values()) { send(m, { type: 'error', message: '部屋の有効時間が終了しました。' }); m.socket.close(1001, 'Room expired'); } continue;
      }
      emit(room);
    }
  }, 1000 / 30); simulation.unref();
  const heartbeat = setInterval(() => { for (const m of members.values()) { if (!m.alive) { m.socket.terminate(); continue; } m.alive = false; if (m.socket.readyState === WebSocket.OPEN) m.socket.ping(); } }, 30000); heartbeat.unref();
  function close() {
    if (closed) return; closed = true; clearInterval(simulation); clearInterval(heartbeat);
    for (const m of members.values()) m.socket.close(1001, 'Server restarting'); rooms.clear(); sockets.close();
  }
  return { sockets, rooms, close, get roomCount() { return rooms.size; } };
}

let sharedGolf: ReturnType<typeof createGolfServer> | undefined;
export function golfUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer, allowed: Set<string>) {
  if (req.url !== GOLF_ENDPOINT) return false;
  if (allowed.size && (!req.headers.origin || !allowed.has(req.headers.origin))) { socket.destroy(); return true; }
  sharedGolf ??= createGolfServer({ allowedOrigins: allowed });
  if (sharedGolf.sockets.clients.size >= 160) { socket.destroy(); return true; }
  sharedGolf.sockets.handleUpgrade(req, socket, head, ws => sharedGolf!.sockets.emit('connection', ws, req));
  return true;
}
export function closeGolfRooms() { sharedGolf?.close(); }
