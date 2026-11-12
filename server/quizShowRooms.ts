import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { randomInt } from 'node:crypto';
import { WebSocket, WebSocketServer } from 'ws';
import { ShowAuthority } from '../src/quiz-show/authority';
import type { Actor } from '../src/quiz-show/types';

interface Member { socket: WebSocket; actor?: Actor; room?: Room; alive: boolean; count: number; at: number; revision: number }
interface Room { code: string; authority: ShowAuthority; members: Map<string, Member>; lastActive: number; hostLeft: number }
export function createQuizShowServer({ maxRooms = 4, idleMs = 30 * 60000 }: { maxRooms?: number; idleMs?: number } = {}) {
  const rooms = new Map<string, Room>(), members = new Set<Member>();
  const sockets = new WebSocketServer({ noServer: true, maxPayload: 280000, perMessageDeflate: false });
  function send(m: Member, packet: unknown) {
    if (m.socket.readyState !== WebSocket.OPEN || m.socket.bufferedAmount > 128000) return false;
    m.socket.send(JSON.stringify(packet)); return true;
  }
  function emit(room: Room) {
    for (const m of room.members.values()) if (m.actor && m.revision !== room.authority.world.revision && send(m, { type: 'state', view: room.authority.view(m.actor) })) m.revision = room.authority.world.revision;
  }
  sockets.on('connection', socket => {
    if (members.size >= maxRooms * 48) { socket.close(1013, 'Full'); return; }
    const m: Member = { socket, alive: true, count: 0, at: Date.now(), revision: -1 }; members.add(m);
    const admission = setTimeout(() => { if (!m.actor) socket.close(1008, 'Hello required'); }, 15000); admission.unref();
    socket.on('pong', () => { m.alive = true; });
    socket.on('message', data => {
      const now = Date.now();
      if (now - m.at >= 1000) { m.at = now; m.count = 0; }
      if (++m.count > 35) { if (m.count === 36) send(m, { type: 'error', code: 'RATE' }); return; }
      let p: any; try { p = JSON.parse(String(data)); } catch { return; }
      if (!p || typeof p !== 'object') return;
      if (!m.actor) {
        if (p.type !== 'connect') return;
        let room: Room | undefined;
        if (p.create === true && p.role === 'host' && typeof p.key === 'string' && /^[a-zA-Z0-9_-]{16,128}$/.test(p.key)) {
          if (rooms.size >= maxRooms) { send(m, { type: 'error', code: 'FULL', message: 'Room capacity reached' }); return; }
          let code: string; do { code = String(randomInt(100000, 1000000)); } while (rooms.has(code));
          room = { code, authority: new ShowAuthority(p.key), members: new Map(), lastActive: now, hostLeft: 0 }; rooms.set(code, room);
        } else if (typeof p.code === 'string' && /^\d{6}$/.test(p.code)) room = rooms.get(p.code);
        if (!room) { send(m, { type: 'error', code: 'NOT_FOUND', message: 'Room not found' }); return; }
        const joined = room.authority.join(p);
        if ('error' in joined) { send(m, { type: 'error', code: joined.error, message: joined.error }); return; }
        m.actor = joined.actor; m.room = room; clearTimeout(admission);
        const old = room.members.get(m.actor.id); if (old && old !== m) old.socket.close(1000, 'Reconnected');
        room.members.set(m.actor.id, m); room.lastActive = now;
        if (m.actor.role === 'host') room.hostLeft = 0;
        send(m, { type: 'welcome', code: room.code, actor: m.actor }); emit(room); return;
      }
      const room = m.room!;
      if (room.members.get(m.actor.id) !== m) return;
      if (m.actor.role === 'player' && !room.authority.world.players[m.actor.id]) { socket.close(1008, 'Removed'); return; }
      const result = room.authority.packet(m.actor, p); if (result) send(m, result);
      if (p.type === 'action') room.lastActive = now;
      emit(room);
    });
    socket.on('close', () => {
      clearTimeout(admission); members.delete(m);
      const room = m.room;
      if (!room || !m.actor || room.members.get(m.actor.id) !== m) return;
      room.members.delete(m.actor.id); room.authority.leave(m.actor);
      if (m.actor.role === 'host') room.hostLeft = Date.now();
      emit(room);
    });
    socket.on('error', () => {});
  });
  const simulation = setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
      if (now - room.lastActive > idleMs || now - room.authority.world.createdAt > 4 * 3600000 || (room.hostLeft && now - room.hostLeft > 5 * 60000)) {
        rooms.delete(code); for (const m of room.members.values()) { send(m, { type: 'ended' }); m.socket.close(1000, 'Room expired'); } continue;
      }
      room.authority.tick(now); emit(room);
    }
  }, 200); simulation.unref();
  const heartbeat = setInterval(() => { for (const m of members) { if (!m.alive) { m.socket.terminate(); continue; } m.alive = false; if (m.socket.readyState === WebSocket.OPEN) m.socket.ping(); } }, 30000); heartbeat.unref();
  return { rooms, sockets, close() { clearInterval(simulation); clearInterval(heartbeat); for (const m of members) m.socket.close(1001, 'Restarting'); rooms.clear(); sockets.close(); } };
}
let shared: ReturnType<typeof createQuizShowServer> | undefined;
export function quizShowUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer, allowed: Set<string>) {
  if (req.url !== '/quiz-show') return false;
  if (allowed.size && (!req.headers.origin || !allowed.has(req.headers.origin))) { socket.destroy(); return true; }
  shared ??= createQuizShowServer();
  if (shared.sockets.clients.size >= 192) { socket.destroy(); return true; }
  shared.sockets.handleUpgrade(req, socket, head, ws => shared!.sockets.emit('connection', ws, req)); return true;
}
export function closeQuizShowRooms() { shared?.close(); }
