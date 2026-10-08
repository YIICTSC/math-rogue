import {validAvatar,defaultAvatar,type KartAvatar} from '../gakuro-kart/avatar';
import Peer, { type DataConnection, type PeerOptions } from 'peerjs';
import { validLesson, type KartLesson } from '../gakuro-kart/learning';
import { addPlayer, answer, createWorld, startWorld, retryCoop, tickWorld, validInput, type OnlineMode, type OnlineWorld } from './onlineEngine';
import type { Input } from './engine';
export class VrRoom {
  host = false; selfId = ''; code = ''; world: OnlineWorld | null = null;
  private peer: Peer | null = null; private connections = new Map<string, DataConnection>(); private timer: ReturnType<typeof setInterval> | null = null;
  private controls: Record<string, Input & { reload?: boolean }> = {}; private lastInput: Record<string, number> = {}; private closed = false;
  constructor(private update: (w: OnlineWorld) => void, private status: (s: string) => void) {}
  private send(c: DataConnection, data: unknown) { if (c.open && (c.dataChannel?.bufferedAmount ?? 0) < 200000) c.send(JSON.stringify(data)); }
  private emit() { if (!this.world || this.closed) return; this.update(structuredClone(this.world)); this.connections.forEach(c => this.send(c, { type: 'world', world: this.world, self: c.peer })); }
  private visibility = () => { if (this.host && this.world) { this.world.paused = document.hidden; this.emit(); } };
  private async open(id?: string) {
    const env = import.meta.env;
    const options: PeerOptions = env.VITE_RPG_PEER_HOST ? { host: env.VITE_RPG_PEER_HOST, port: Number(env.VITE_RPG_PEER_PORT || 443), path: env.VITE_RPG_PEER_PATH || '/', secure: env.VITE_RPG_PEER_SECURE !== 'false' } : {};
    const peer = this.peer = id ? new Peer(id, options) : new Peer(options);
    await new Promise<void>((resolve, reject) => { const timeout = setTimeout(() => reject(new Error('Connection timeout')), 15000); peer.once('open', () => { clearTimeout(timeout); resolve(); }); peer.once('error', e => { clearTimeout(timeout); reject(new Error(e.type)); }); });
    if (this.closed) { peer.destroy(); throw new Error('Closed'); } this.selfId = peer.id;
    peer.on('error', e => this.status(`Network: ${e.type}`)); return peer;
  }
  async create(name: string, mode: OnlineMode, missionId: number, lesson: KartLesson, limit: number, avatar: KartAvatar = defaultAvatar()) {
    this.host = true; const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; this.code = Array.from(crypto.getRandomValues(new Uint8Array(6)), n => alphabet[n % alphabet.length]).join('');
    const peer = await this.open(`gakuro-vr-v1-${this.code}`); this.world = createWorld(mode, missionId, lesson, limit); addPlayer(this.world, this.selfId, name); this.world.players[this.selfId].avatar = avatar;
    peer.on('connection', c => {
      c.on('data', raw => { if (typeof raw !== 'string' || raw.length > 2000 || !this.world) return; let d: any; try { d = JSON.parse(raw); } catch { return; }
        if (d.type === 'hello' && d.version === 1 && validAvatar(d.avatar) && typeof d.name === 'string' && addPlayer(this.world, c.peer, d.name)) { this.world.players[c.peer].avatar = d.avatar; this.connections.set(c.peer, c); this.emit(); }
        else if (this.world.players[c.peer]) this.receive(c.peer, d);
        else { this.send(c, { type: 'error', text: 'Room full or already started' }); c.close(); }
      });
      c.on('close', () => { this.connections.delete(c.peer); delete this.controls[c.peer]; if (this.world?.players[c.peer]) { if (this.world.phase === 'lobby') delete this.world.players[c.peer]; else this.world.players[c.peer].connected = false; this.emit(); } });
    });
    let pulses = 0; document.addEventListener('visibilitychange', this.visibility);
    this.timer = setInterval(() => { if (!this.world) return; for (const id of Object.keys(this.controls)) if (Date.now() - (this.lastInput[id] ?? 0) > 600) delete this.controls[id]; tickWorld(this.world, this.controls, .05); Object.values(this.controls).forEach(i => { i.shoot = false; i.decoy = false; i.reload = false; }); if (++pulses % 2 === 0) this.emit(); }, 50); this.emit();
  }
  async join(name: string, code: string, avatar: KartAvatar = defaultAvatar()) {
    this.code = code.trim().toUpperCase().replace(/^H-/, ''); if (!/^[A-Z2-9]{6}$/.test(this.code)) throw new Error('Invalid room code');
    const peer = await this.open(); const c = peer.connect(`gakuro-vr-v1-${this.code}`, { reliable: true }); this.connections.set('host', c);
    await new Promise<void>((resolve, reject) => { const timeout = setTimeout(() => reject(new Error('Room connection timeout')), 20000); c.on('open', () => this.send(c, { type: 'hello', version: 1, name, avatar })); c.on('data', raw => { let d: any; try { d = JSON.parse(String(raw)); } catch { return; } if (d.type === 'error') { clearTimeout(timeout); reject(new Error(d.text)); } if (d.type === 'world' && d.world && validLesson(d.world.lesson) && d.world.players?.[this.selfId]) { clearTimeout(timeout); this.world = d.world; this.update(d.world); resolve(); } }); c.on('error', e => { clearTimeout(timeout); reject(e); }); c.on('close', () => this.status('Host disconnected. Return to title to reconnect.')); });
  }
  private receive(id: string, d: any) { if (!this.world) return; if (d.type === 'input' && validInput(d.input)) { this.controls[id] = { ...d.input, reload: d.input.reload === true }; this.lastInput[id] = Date.now(); } if(d.type==='retry')retryCoop(this.world,id); if (d.type === 'answer') answer(this.world, id, d.choice); }
  input(input: Input & { reload?: boolean }) { if (this.host) this.receive(this.selfId, { type: 'input', input }); else { const c = this.connections.get('host'); if (c) this.send(c, { type: 'input', input }); } }
  answer(choice: number) { if (this.host && this.world) answer(this.world, this.selfId, choice); else { const c = this.connections.get('host'); if (c) this.send(c, { type: 'answer', choice }); } }
  retry() { if(this.host&&this.world)retryCoop(this.world,this.selfId);else{const c=this.connections.get('host');if(c)this.send(c,{type:'retry'});} }
  start() { if (this.host && this.world) { startWorld(this.world, crypto.getRandomValues(new Uint32Array(1))[0]); this.emit(); } }
  close() { this.closed = true; if (this.timer) clearInterval(this.timer); document.removeEventListener('visibilitychange', this.visibility); this.connections.forEach(c => c.close()); this.peer?.destroy(); }
}
