import Peer, { type DataConnection, type PeerOptions } from 'peerjs';
import { addRacer, command, createRace, startRace, tick, type Command, type Race, type Subject } from './engine';

/** The room owner simulates every kart and measures answer time. Clients only send controls. */
export class KartRoom {
  selfId = 'local'; code = ''; host = false; world: Race | null = null;
  private peer: Peer | null = null;
  private channels = new Map<string, DataConnection>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private closed = false;
  private rates = new Map<string, { at: number; count: number }>();
  private pending = new Set<ReturnType<typeof setTimeout>>();
  constructor(private update: (world: Race | null) => void, private status: (message: string) => void) {}
  private emit() {
    if (this.closed || !this.world) return;
    this.update(structuredClone(this.world));
    for (const c of this.channels.values()) if (c.open && this.world.players[c.peer]) c.send({ type: 'state', world: this.world });
  }
  private run() {
    let previous = performance.now();
    this.timer = setInterval(() => {
      const now = performance.now(), dt = (now - previous) / 1000; previous = now;
      if (this.world) { tick(this.world, dt); this.emit(); }
    }, 50);
    this.emit();
  }
  practice(name: string, hero: number, course: number, subject: Subject) {
    this.host = true; this.world = createRace(course, subject, crypto.getRandomValues(new Uint32Array(1))[0]);
    addRacer(this.world, this.selfId, name, hero);
    for (let i = 0; i < 3; i++) addRacer(this.world, `cpu-${i}`, `CPU ${i + 1}`, i, true);
    this.run();
  }
  private async open(id?: string) {
    const env = import.meta.env;
    const options: PeerOptions = env.VITE_RPG_PEER_HOST ? { host: env.VITE_RPG_PEER_HOST, port: Number(env.VITE_RPG_PEER_PORT || 443), path: env.VITE_RPG_PEER_PATH || '/', secure: env.VITE_RPG_PEER_SECURE !== 'false' } : {};
    const peer = id ? new Peer(id, options) : new Peer(options); this.peer = peer;
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('接続がタイムアウトしました。')), 15000);
      this.pending.add(timer);
      const done = () => { clearTimeout(timer); this.pending.delete(timer); };
      peer.once('open', () => { done(); resolve(); });
      peer.once('error', e => { done(); reject(new Error(`接続できませんでした (${e.type})`)); });
    });
    if (this.closed) { peer.destroy(); throw new Error('接続を終了しました。'); }
    peer.on('error', e => { if (!this.closed) this.status(`通信エラー (${e.type})。部屋に入り直してください。`); });
    peer.on('disconnected', () => { if (!this.closed) this.status('接続サービスから切断されました。新規参加を受け付けられません。'); });
    this.selfId = peer.id; return peer;
  }
  async create(name: string, hero: number, course: number, subject: Subject) {
    this.host = true;
    this.code = Array.from(crypto.getRandomValues(new Uint8Array(6)), n => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n % 31]).join('');
    const peer = await this.open(`gakuro-kart-${this.code}`);
    this.world = createRace(course, subject, crypto.getRandomValues(new Uint32Array(1))[0]);
    addRacer(this.world, this.selfId, name, hero);
    peer.on('connection', c => {
      if (this.closed) { c.close(); return; }
      if (this.channels.size >= 7 || this.world?.phase !== 'lobby') {
        c.on('open', () => { c.send({ type: 'error', message: '満員、またはレース開始済みです。' }); const t = setTimeout(() => { c.close(); this.pending.delete(t); }, 400); this.pending.add(t); }); return;
      }
      this.channels.set(c.peer, c);
      const t = setTimeout(() => { if (!this.world?.players[c.peer]) c.close(); this.pending.delete(t); }, 10000); this.pending.add(t);
      c.on('data', (raw: unknown) => {
        if (!this.world || this.closed || !raw || typeof raw !== 'object') return;
        const d = raw as { type?: string; name?: string; hero?: number; command?: unknown };
        const now = Date.now(), rate = this.rates.get(c.peer);
        if (!rate || now - rate.at > 1000) this.rates.set(c.peer, { at: now, count: 1 });
        else if (++rate.count > 40) return;
        if (d.type === 'hello' && typeof d.name === 'string' && Number.isInteger(d.hero)) {
          if (!addRacer(this.world, c.peer, d.name, d.hero)) { c.send({ type: 'error', message: '参加できません。レース開始前に入り直してください。' }); return; }
          clearTimeout(t); this.pending.delete(t); this.emit();
        } else if (d.type === 'command') command(this.world, c.peer, d.command);
      });
      const drop = () => { clearTimeout(t); this.pending.delete(t); this.channels.delete(c.peer); this.rates.delete(c.peer); if (this.world) delete this.world.players[c.peer]; this.emit(); };
      c.on('close', drop); c.on('error', drop);
    });
    this.run();
  }
  async join(code: string, name: string, hero: number) {
    this.code = code.trim().toUpperCase();
    if (!/^[A-Z2-9]{6}$/.test(this.code)) throw new Error('6文字のルームコードを入力してください。');
    const peer = await this.open();
    const c = peer.connect(`gakuro-kart-${this.code}`, { reliable: true }); this.channels.set('host', c);
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('部屋が見つからないか、接続できません。')), 15000); this.pending.add(t);
      const done = () => { clearTimeout(t); this.pending.delete(t); };
      c.on('open', () => c.send({ type: 'hello', name: name.slice(0, 16), hero }));
      c.on('data', (raw: unknown) => {
        if (this.closed || !raw || typeof raw !== 'object') return;
        const d = raw as { type: string; world?: Race; message?: string };
        if (d.type === 'error') { done(); reject(new Error(d.message)); this.status(d.message || '参加できません。'); }
        if (d.type === 'state' && d.world?.players?.[this.selfId]) { done(); this.world = d.world; this.update(d.world); resolve(); }
      });
      const lost = () => { done(); reject(new Error('ホストとの接続が終了しました。')); if (!this.closed) { this.world = null; this.update(null); this.status('ホストとの接続が終了しました。部屋に入り直してください。'); } };
      c.on('close', lost); c.on('error', lost);
    });
  }
  start() { if (this.host && this.world) { startRace(this.world); this.emit(); } }
  send(c: Command) {
    if (this.closed) return;
    if (this.host && this.world) command(this.world, this.selfId, c);
    else { const host = this.channels.get('host'); if (host?.open) host.send({ type: 'command', command: c }); }
  }
  close() {
    this.closed = true; if (this.timer) clearInterval(this.timer);
    this.pending.forEach(clearTimeout); this.pending.clear();
    this.channels.forEach(c => c.close()); this.channels.clear(); this.peer?.destroy(); this.world = null;
  }
}
