import Peer, { type DataConnection, type PeerOptions } from 'peerjs';
import { addPlayer, command, createGolf, disconnectPlayer, MAX_PLAYERS, setSpectator, startGolf, tick, viewFor, type GolfCommand, type GolfView, type GolfWorld } from './engine';
import { validLesson, type KartLesson } from '../gakuro-kart/learning';
import { HOLES } from './course';
import { GOLF_PROTOCOL, validView } from './protocol';
import { DedicatedConnection, onlineServerUrl } from '../../services/dedicatedConnection';
import type { LessonSelection } from '../gakuro-kart/questions';
export { GOLF_PROTOCOL, validView } from './protocol';
const prefix = `gakuro-golf-v${GOLF_PROTOCOL}-`;
/** Star topology: one authoritative host + 39 guests. 30 Hz physics, 5 Hz private snapshots. */
export class GolfRoom {
  selfId = 'local'; code = ''; host = false; private observedId: string | null = null;
  private world: GolfWorld | null = null;
  private dedicated: DedicatedConnection | null = null;
  get serverHosted() { return !!this.dedicated; }
  private peer: Peer | null = null;
  private channels = new Map<string, DataConnection>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private closed = false;
  private sequence = 0;
  private lastSequence = -1;
  private lastPacket = 0;
  private factory: (() => KartLesson) | undefined;
  private pending = new Set<ReturnType<typeof setTimeout>>();
  private cancellations = new Set<() => void>();
  private rates = new Map<string, { at: number; count: number }>();
  constructor(private update: (view: GolfView | null) => void, private status: (message: string) => void) {}
  private sendTo(c: DataConnection, data: object) {
    if (c.open && (c.dataChannel?.bufferedAmount || 0) < 65536) { try { c.send(JSON.stringify(data)); } catch { c.close(); } }
  }
  private emit() {
    if (this.closed || !this.world) return;
    this.update(viewFor(this.world, this.selfId, this.observedId || undefined)); const sequence = ++this.sequence;
    for (const c of this.channels.values()) if (this.world.players[c.peer]?.connected) this.sendTo(c, { type: 'state', version: GOLF_PROTOCOL, sequence, view: viewFor(this.world, c.peer) });
  }
  private visibility = () => { if (this.world) { this.world.paused = document.hidden; this.emit(); } };
  private run() {
    let previous = performance.now(), accumulator = 0, broadcast = 0;
    document.addEventListener('visibilitychange', this.visibility); this.visibility();
    this.timer = setInterval(() => {
      const now = performance.now(), elapsed = Math.min(.25, (now - previous) / 1000); previous = now;
      if (this.world && !this.world.paused) { accumulator += elapsed; while (accumulator >= 1 / 30) { tick(this.world, 1 / 30); accumulator -= 1 / 30; } }
      broadcast += elapsed; if (broadcast >= .2) { broadcast = 0; this.emit(); }
    }, 1000 / 30);
  }
  practice(name: string) { this.host = true; this.world = createGolf(crypto.getRandomValues(new Uint32Array(1))[0]); addPlayer(this.world, this.selfId, name); this.run(); }
  private async open(id?: string) {
    const env = import.meta.env;
    const options: PeerOptions = env.VITE_RPG_PEER_HOST ? { host: env.VITE_RPG_PEER_HOST, port: Number(env.VITE_RPG_PEER_PORT || 443), path: env.VITE_RPG_PEER_PATH || '/', secure: env.VITE_RPG_PEER_SECURE !== 'false' } : {};
    const ice = env.VITE_GOLF_ICE_SERVERS || env.VITE_KART_ICE_SERVERS;
    if (ice) { const iceServers = JSON.parse(ice); if (!Array.isArray(iceServers)) throw new Error('ICE server configuration is invalid.'); options.config = { iceServers }; }
    const peer = id ? new Peer(id, options) : new Peer(options); this.peer = peer;
    await new Promise<void>((resolve, reject) => {
      const cancel = () => fail(new Error('接続を終了しました。'));
      const done = () => { clearTimeout(timeout); this.pending.delete(timeout); this.cancellations.delete(cancel); };
      const fail = (error: Error) => { done(); reject(error); };
      const timeout = setTimeout(() => fail(new Error('接続がタイムアウトしました。')), 15000); this.pending.add(timeout); this.cancellations.add(cancel);
      peer.once('open', () => { done(); resolve(); }); peer.once('error', e => fail(new Error(`Network: ${e.type}`)));
    });
    if (this.closed) { peer.destroy(); throw new Error('接続を終了しました。'); }
    peer.on('error', e => { if (!this.closed) this.status(`Network: ${e.type}`); });
    peer.on('disconnected', () => { if (!this.closed && !peer.destroyed) peer.reconnect(); });
    this.selfId = peer.id; return peer;
  }
  private reject(c: DataConnection, message: string) {
    const deliver = () => { this.sendTo(c, { type: 'error', message }); const t = setTimeout(() => { c.close(); this.pending.delete(t); }, 300); this.pending.add(t); };
    if (c.open) deliver(); else c.once('open', deliver);
  }
  private async openDedicated(hello: object) {
    const connection = new DedicatedConnection(packet => {
      if (this.closed) return false;
      if (packet.type === 'connected' && typeof packet.id === 'string' && packet.id.length <= 100 && typeof packet.code === 'string' && /^[A-Z2-9]{6}$/.test(packet.code) && typeof packet.host === 'boolean') { this.selfId = packet.id; this.code = packet.code; this.host = packet.host; }
      if (packet.type === 'error' && typeof packet.message === 'string') this.status(packet.message);
      if (['init', 'state'].includes(packet.type) && packet.version === GOLF_PROTOCOL && Number.isInteger(packet.sequence) && packet.sequence > this.lastSequence && validView(packet.state) && packet.state.players.some(p => p.id === this.selfId)) { this.lastSequence = packet.sequence; this.update(packet.state); return true; }
      return false;
    }, () => { if (!this.closed) { this.close(); this.update(null); this.status('サーバーとの接続が終了しました。部屋に入り直してください。'); } });
    this.dedicated = connection; await connection.open('golf', hello);
  }
  async create(name: string) {
    if (onlineServerUrl()) { await this.openDedicated({ create: true, name: name.slice(0, 16) }); return; }
    this.host = true; const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    this.code = Array.from(crypto.getRandomValues(new Uint8Array(6)), n => alphabet[n % alphabet.length]).join('');
    const peer = await this.open(prefix + this.code);
    this.world = createGolf(crypto.getRandomValues(new Uint32Array(1))[0]); addPlayer(this.world, this.selfId, name);
    peer.on('connection', c => {
      if (this.closed) { c.close(); return; }
      if (this.channels.size >= MAX_PLAYERS - 1 || this.world?.phase !== 'lobby' || this.channels.has(c.peer)) { this.reject(c, '満員、またはラウンド開始済みです。'); return; }
      this.channels.set(c.peer, c);
      const timeout = setTimeout(() => { if (!this.world?.players[c.peer]) c.close(); this.pending.delete(timeout); }, 10000); this.pending.add(timeout);
      c.on('data', raw => {
        if (this.closed || !this.world || typeof raw !== 'string' || raw.length > 1024) return;
        let d: any; try { d = JSON.parse(raw); } catch { return; } if (!d || typeof d !== 'object') return;
        const now = performance.now(), rate = this.rates.get(c.peer);
        if (!rate || now - rate.at > 1000) this.rates.set(c.peer, { at: now, count: 1 }); else if (++rate.count > 15) return;
        if (d.type === 'hello') {
          if (d.version !== GOLF_PROTOCOL || typeof d.name !== 'string' || !addPlayer(this.world, c.peer, d.name)) { this.reject(c, '参加できません。開始前に入り直してください。'); return; }
          clearTimeout(timeout); this.pending.delete(timeout); this.emit();
        } else if (d.type === 'command') this.apply(c.peer, d.command);
      });
      let dropped = false;
      const drop = () => { if (dropped) return; dropped = true; clearTimeout(timeout); this.pending.delete(timeout); this.channels.delete(c.peer); this.rates.delete(c.peer); if (this.world) disconnectPlayer(this.world, c.peer); this.emit(); };
      c.on('close', drop); c.on('error', drop);
    }); this.run();
  }
  async join(code: string, name: string) {
    this.code = code.trim().toUpperCase(); if (!/^[A-Z2-9]{6}$/.test(this.code)) throw new Error('6文字のルームコードを入力してください。');
    if (onlineServerUrl()) { await this.openDedicated({ create: false, code: this.code, name: name.slice(0, 16) }); return; }
    const peer = await this.open(); const c = peer.connect(prefix + this.code, { reliable: true, serialization: 'raw' }); this.channels.set('host', c);
    await new Promise<void>((resolve, reject) => {
      const cancel = () => fail(new Error('接続を終了しました。'));
      const done = () => { clearTimeout(timeout); this.pending.delete(timeout); this.cancellations.delete(cancel); };
      const fail = (error: Error) => { done(); reject(error); };
      const timeout = setTimeout(() => fail(new Error('部屋が見つからないか、接続できません。')), 15000); this.pending.add(timeout); this.cancellations.add(cancel);
      c.on('open', () => this.sendTo(c, { type: 'hello', version: GOLF_PROTOCOL, name: name.slice(0, 16) }));
      c.on('data', raw => {
        if (this.closed || typeof raw !== 'string' || raw.length > 200000) return;
        let d: any; try { d = JSON.parse(raw); } catch { return; } if (!d || typeof d !== 'object') return;
        if (d.type === 'error') { const message = typeof d.message === 'string' ? d.message : 'Connection rejected'; this.status(message); fail(new Error(message)); }
        if (d.type === 'state' && d.version === GOLF_PROTOCOL && Number.isInteger(d.sequence) && d.sequence > this.lastSequence && validView(d.view) && d.view.players.some(p => p.id === this.selfId)) {
          this.lastSequence = d.sequence; this.lastPacket = performance.now(); this.update(d.view); done(); resolve();
        }
      });
      const lost = () => { fail(new Error('ホストとの接続が終了しました。')); if (!this.closed) { this.close(); this.update(null); this.status('ホストとの接続が終了しました。部屋に入り直してください。'); } };
      c.on('close', lost); c.on('error', lost);
    });
    this.timer = setInterval(() => { if (performance.now() - this.lastPacket > 15000) { this.close(); this.update(null); this.status('通信が途切れました。部屋に入り直してください。'); } }, 1000);
  }
  setLesson(factory: () => KartLesson, selection?: LessonSelection) {
    if (this.dedicated) { if (!this.host || !selection) return; this.dedicated.send({ type: 'lesson', selection }); return; }
    if (!this.host || this.world?.phase !== 'lobby') return;
    const sample = factory(); if (!validLesson(sample)) throw new Error('問題を準備できませんでした。');
    this.factory = factory; this.world.title = sample.title; this.emit();
  }
  setSpectator(enabled: boolean) {
    if (this.closed || !this.host) return;
    if (this.dedicated) { this.dedicated.send({ type: 'spectator', enabled }); return; }
    if (this.world && setSpectator(this.world, this.selfId, enabled)) this.emit();
  }
  observe(id: string | null) {
    if (this.closed || !this.host) return;
    this.observedId = id;
    if (this.dedicated) this.dedicated.send({ type: 'observe', id });
    else this.emit();
  }
  start() { if (this.dedicated) { if (this.host) this.dedicated.send({ type: 'start' }); return; } if (this.host && this.world && this.factory && startGolf(this.world, this.world.title)) this.emit(); }
  private apply(id: string, c: unknown) {
    if (!this.world || this.closed) return;
    try { if (command(this.world, id, c, this.factory)) this.emit(); }
    catch { const message = '問題を準備できませんでした。'; if (id === this.selfId) this.status(message); else { const channel = this.channels.get(id); if (channel) this.sendTo(channel, { type: 'error', message }); } }
  }
  send(c: GolfCommand) { if (this.closed) return; if (this.dedicated) { this.dedicated.send({ type: 'command', command: c }); return; } if (this.host) this.apply(this.selfId, c); else { const host = this.channels.get('host'); if (host) this.sendTo(host, { type: 'command', command: c }); } }
  close() {
    if (this.closed) return; this.closed = true;
    this.dedicated?.close(); this.dedicated = null;
    this.cancellations.forEach(cancel => cancel()); this.cancellations.clear();
    if (this.timer) clearInterval(this.timer); this.pending.forEach(clearTimeout); this.pending.clear();
    document.removeEventListener('visibilitychange', this.visibility); this.channels.forEach(c => c.close()); this.channels.clear(); this.peer?.destroy(); this.world = null;
  }
}
