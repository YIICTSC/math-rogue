import {DedicatedConnection,onlineServerUrl} from '../../services/dedicatedConnection';
import { defaultAvatar, validAvatar, type KartAvatar } from './avatar';
import { validLesson, type KartLesson } from './learning';
import Peer, { type DataConnection, type PeerOptions } from 'peerjs';
import { addRacer, command, createRace, MAX_RACERS, setRaceLaps, startRace, tick, type Command, type Race } from './engine';
import { acceptRoster, decodeSnapshot, encodeSnapshot, PROTOCOL, roster, type Roster } from './protocol';

/** Host-authoritative 60 Hz simulation, 20 Hz controls, 10 Hz compact snapshots. */
export class KartRoom {
  selfId = 'local'; code = ''; host = false; world: Race | null = null;
  private dedicated: DedicatedConnection | null = null;
  private peer: Peer | null = null;
  private channels = new Map<string, DataConnection>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private closed = false; private sequence = 0; private lastSequence = -1; private lastRoster = -1;
  private lastPacketAt = 0; private paused = false;
  private rates = new Map<string, { at: number; count: number }>();
  private pending = new Set<ReturnType<typeof setTimeout>>();
  constructor(private update: (world: Race | null) => void, private status: (message: string) => void) {}
  private sendTo(c: DataConnection, data: object | ArrayBuffer) {
    if (!c.open) return;
    try { c.send(data instanceof ArrayBuffer ? data : JSON.stringify(data)); } catch { c.close(); }
  }
  private emit() {
    if (this.closed || !this.world) return;
    this.update(structuredClone(this.world));
    const metadata = this.lastRoster !== this.world.revision ? roster(this.world) : null;
    const packet = encodeSnapshot(this.world, ++this.sequence);
    for (const c of this.channels.values()) if (c.open && this.world.players[c.peer]) {
      if (metadata) this.sendTo(c, metadata);
      // Drop superseded snapshots instead of building up seconds of latency.
      if ((c.dataChannel?.bufferedAmount || 0) < 16384) this.sendTo(c, packet);
    }
    this.lastRoster = this.world.revision;
  }
  private visibility = () => {
    if (!this.host || this.closed) return;
    this.paused = document.hidden;
    if (this.world) this.world.paused = this.paused;
    for (const c of this.channels.values()) this.sendTo(c, { type: 'pause', value: this.paused });
    this.status(this.paused ? 'ホストの画面が戻るまで一時停止しています。' : '');
  };
  private run() {
    let previous = performance.now(), accumulator = 0, broadcast = 0;
    document.addEventListener('visibilitychange', this.visibility);
    this.visibility();
    this.timer = setInterval(() => {
      const now = performance.now(), elapsed = Math.min(.15, (now - previous) / 1000); previous = now;
      if (this.world && !this.paused) {
        accumulator += elapsed;
        while (accumulator >= 1 / 60) { tick(this.world, 1 / 60); accumulator -= 1 / 60; }
      }
      broadcast += elapsed;
      if (broadcast >= .1 || this.world?.revision !== this.lastRoster) { broadcast = 0; this.emit(); }
    }, 1000 / 60);
    this.emit();
  }
  practice(name: string, hero: number, course: number) {
    this.host = true; this.world = createRace(course, crypto.getRandomValues(new Uint32Array(1))[0]);
    addRacer(this.world, this.selfId, name, hero); this.run();
  }
  private async open(id?: string) {
    const env = import.meta.env;
    const options: PeerOptions = env.VITE_RPG_PEER_HOST ? { host: env.VITE_RPG_PEER_HOST, port: Number(env.VITE_RPG_PEER_PORT || 443), path: env.VITE_RPG_PEER_PATH || '/', secure: env.VITE_RPG_PEER_SECURE !== 'false' } : {};
    if (env.VITE_KART_ICE_SERVERS) {
      const iceServers = JSON.parse(env.VITE_KART_ICE_SERVERS);
      if (!Array.isArray(iceServers)) throw new Error('ICE server configuration is invalid.');
      options.config = { iceServers };
    }
    const peer = id ? new Peer(id, options) : new Peer(options); this.peer = peer;
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => { this.pending.delete(t); reject(new Error('接続がタイムアウトしました。')); }, 15000); this.pending.add(t);
      const done = () => { clearTimeout(t); this.pending.delete(t); };
      peer.once('open', () => { done(); resolve(); });
      peer.once('error', e => { done(); reject(new Error(`Connection failed: ${e.type}`)); });
    });
    if (this.closed) { peer.destroy(); throw new Error('接続を終了しました。'); }
    peer.on('error', e => { if (!this.closed) this.status(`Network: ${e.type}`); });
    peer.on('disconnected', () => { if (!this.closed && !peer.destroyed) peer.reconnect(); });
    this.selfId = peer.id; return peer;
  }
  private reject(c: DataConnection, message: string) {
    const deliver = () => {
      this.sendTo(c, { type: 'error', message });
      const t = setTimeout(() => { c.close(); this.pending.delete(t); }, 500); this.pending.add(t);
    };
    if (c.open) deliver(); else c.once('open', deliver);
  }
  async create(name: string, hero: number, course: number) {
    if(onlineServerUrl()){await this.connectDedicated({create:true,name,hero,course,avatar:defaultAvatar(hero)});return;}
    this.host = true;
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    this.code = Array.from(crypto.getRandomValues(new Uint8Array(6)), n => alphabet[n % alphabet.length]).join('');
    const peer = await this.open(`gakuro-apex-v${PROTOCOL}-${this.code}`);
    this.world = createRace(course, crypto.getRandomValues(new Uint32Array(1))[0]); addRacer(this.world, this.selfId, name, hero);
    peer.on('connection', c => {
      if (this.closed) { c.close(); return; }
      if (this.channels.size >= MAX_RACERS - 1 || this.world?.phase !== 'lobby' || this.channels.has(c.peer)) { this.reject(c, '満員、またはレース開始済みです。'); return; }
      this.channels.set(c.peer, c);
      const timeout = setTimeout(() => { if (!this.world?.players[c.peer]) c.close(); this.pending.delete(timeout); }, 10000); this.pending.add(timeout);
      c.on('data', raw => {
        if (this.closed || !this.world || typeof raw !== 'string' || raw.length > 512) return;
        let d: any; try { d = JSON.parse(raw); } catch { return; } if (!d || typeof d !== 'object') return;
        const now = performance.now(), rate = this.rates.get(c.peer);
        if (!rate || now - rate.at > 1000) this.rates.set(c.peer, { at: now, count: 1 }); else if (++rate.count > 35) return;
        if (d.type === 'hello') {
          if (d.version !== PROTOCOL || !validAvatar(d.avatar) || typeof d.name !== 'string' || !Number.isInteger(d.hero) || !addRacer(this.world, c.peer, d.name, d.hero)) { this.reject(c, '参加できません。レース開始前に入り直してください。'); return; }
          this.world.players[c.peer].avatar = { ...d.avatar }; clearTimeout(timeout); this.pending.delete(timeout); this.emit();
        } else if (d.type === 'avatar') this.applyAvatar(c.peer, d.avatar);
        else if (d.type === 'command') command(this.world, c.peer, d.command);
      });
      let dropped = false;
      const drop = () => {
        if (dropped) return; dropped = true;
        clearTimeout(timeout); this.pending.delete(timeout); this.channels.delete(c.peer); this.rates.delete(c.peer);
        if (this.world?.players[c.peer]) {
          if (this.world.phase === 'lobby') delete this.world.players[c.peer];
          else { const p = this.world.players[c.peer]; p.cpu = true; p.name = `${p.name.slice(0, 10)} [BOT]`; }
          this.world.revision++; this.emit();
        }
      };
      c.on('close', drop); c.on('error', drop);
    }); this.run();
  }
  async join(code: string, name: string, hero: number, avatar: KartAvatar = defaultAvatar(hero)) {
    this.code = code.trim().toUpperCase();
    if (!/^[A-Z2-9]{6}$/.test(this.code)) throw new Error('6文字のルームコードを入力してください。');
    if(onlineServerUrl()){await this.connectDedicated({code:this.code,name,hero,avatar});return;}
    const peer = await this.open();
    const c = peer.connect(`gakuro-apex-v${PROTOCOL}-${this.code}`, { reliable: true, serialization: 'raw' }); this.channels.set('host', c);
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => { this.pending.delete(timeout); reject(new Error('部屋が見つからないか、接続できません。')); }, 15000); this.pending.add(timeout);
      const done = () => { clearTimeout(timeout); this.pending.delete(timeout); };
      c.on('open', () => this.sendTo(c, { type: 'hello', version: PROTOCOL, name: name.slice(0, 16), hero, avatar }));
      c.on('data', raw => {
        if (this.closed) return;
        if (raw instanceof ArrayBuffer && this.world) {
          const decoded = decodeSnapshot(raw, this.world, this.lastSequence);
          if (decoded && decoded.world.players[this.selfId]) {
            this.world = decoded.world; this.lastSequence = decoded.sequence; this.lastPacketAt = performance.now(); this.update(this.world); done(); resolve();
          } return;
        }
        if (typeof raw !== 'string' || raw.length > 120000) return;
        let d: any; try { d = JSON.parse(raw); } catch { return; } if (!d || typeof d !== 'object') return;
        if (d.type === 'error') { done(); reject(new Error(typeof d.message === 'string' ? d.message : 'Connection rejected')); }
        if (d.type === 'roster') { const next = acceptRoster(d as Roster, this.world); if (next) this.world = next; }
        if (d.type === 'pause') this.status(d.value ? 'ホストの画面が戻るまで一時停止しています。' : '');
      });
      const lost = () => { done(); reject(new Error('ホストとの接続が終了しました。')); if (!this.closed) { this.close(); this.update(null); this.status('ホストとの接続が終了しました。部屋に入り直してください。'); } };
      c.on('close', lost); c.on('error', lost);
    });
    this.timer = setInterval(() => { if (performance.now() - this.lastPacketAt > 12000) { this.close(); this.update(null); this.status('通信が途切れました。部屋に入り直してください。'); } }, 1000);
  }
  private async connectDedicated(packet: object) {
    this.dedicated=new DedicatedConnection(d=>{
      if(d instanceof ArrayBuffer && this.world){const next=decodeSnapshot(d,this.world,this.lastSequence);if(next){this.world=next.world;this.lastSequence=next.sequence;this.update(this.world);return !!this.world.players[this.selfId];}}
      if(d.type==='connected'){this.selfId=d.id;this.code=d.code;this.host=d.host;}
      if(d.type==='host')this.host=!!d.host;
      if(d.type==='roster'){const next=acceptRoster(d,this.world);if(next)this.world=next;}
      return false;
    },()=>{this.close();this.update(null);this.status('専用サーバーとの接続が終了しました。');});
    this.status('専用サーバーに接続しています。');await this.dedicated.open('kart',packet);this.status('');
  }
  private applyAvatar(id: string, avatar: unknown) {
    if (this.world?.phase !== 'lobby' || !this.world.players[id] || !validAvatar(avatar)) return;
    this.world.players[id].avatar = { ...avatar }; this.world.revision++; this.emit();
  }
  setAvatar(avatar: KartAvatar) {
    if (this.closed || this.world?.phase !== 'lobby' || !validAvatar(avatar)) return;
    if(this.dedicated){this.dedicated.send({type:'avatar',avatar});return;}
    if (this.host) this.applyAvatar(this.selfId, avatar);
    else { const host = this.channels.get('host'); if (host) this.sendTo(host, { type: 'avatar', avatar }); }
  }
  setLesson(lesson: KartLesson) {
    if (!this.host || this.world?.phase !== 'lobby' || !validLesson(lesson)) return;
    if(this.dedicated){this.dedicated.send({type:'lesson',lesson});return;}
    this.world.lesson = structuredClone(lesson); this.world.revision++; this.emit();
  }
  setLaps(laps: number) {
    if (!this.host || !this.world) return;
    if(this.dedicated){this.dedicated.send({type:'laps',laps});return;}
    if(!setRaceLaps(this.world,laps))return;
    this.emit();
  }
  start(fill = true) { if(this.dedicated){if(this.host)this.dedicated.send({type:'start',fill});return;} if (this.host && this.world) { startRace(this.world, fill); this.emit(); } }
  rematch(lesson?: KartLesson, course = this.world?.course ?? 0, laps = this.world?.laps ?? 3) {
    if (!this.host || this.world?.phase !== 'result') return;
    if(this.dedicated){this.dedicated.send({type:'rematch',lesson,course,laps});return;}
    const old = this.world, previousRevision = old.revision; this.world = createRace(course, old.seed + 1, laps);
    this.world.lesson = lesson && validLesson(lesson) ? structuredClone(lesson) : old.lesson;
    this.world.revision = previousRevision;
    for (const p of Object.values(old.players)) { addRacer(this.world, p.id, p.name, p.hero, p.cpu); this.world.players[p.id].avatar = { ...p.avatar }; }
    startRace(this.world); this.emit();
  }
  send(c: Command) {
    if (this.closed) return;
    if(this.dedicated){this.dedicated.send({type:'command',command:c});return;}
    if (this.host && this.world) command(this.world, this.selfId, c);
    else { const host = this.channels.get('host'); if (host?.open && (host.dataChannel?.bufferedAmount || 0) < 4096) this.sendTo(host, { type: 'command', command: c }); }
  }
  close() {
    if (this.closed) return; this.closed = true;
    this.dedicated?.close();
    if (this.timer) clearInterval(this.timer); document.removeEventListener('visibilitychange', this.visibility);
    this.pending.forEach(clearTimeout); this.pending.clear(); this.channels.forEach(c => c.close()); this.channels.clear(); this.peer?.destroy(); this.world = null;
  }
}
