import { RaceStartSync } from './startSync';
import {KartConnectionHealth} from './performance';
import {createHostRoomCode,roomAddress,type OnlineTransport} from '../../services/onlineTransport';
import {type CustomCourse} from './track';
import {DedicatedConnection,onlineServerUrl} from '../../services/dedicatedConnection';
import { defaultAvatar, validAvatar, type KartAvatar } from './avatar';
import { validLesson, type KartLesson } from './learning';
import Peer, { type DataConnection, type PeerOptions } from 'peerjs';
import { addRacer, command, createRace, MAX_RACERS, setRaceLaps, setSpectator, startRace, tick, type Command, type Race } from './engine';
import { acceptRoster, decodeSnapshot, encodeSnapshot, PROTOCOL, roster, type Roster } from './protocol';

/** Host-authoritative 60 Hz simulation, 20 Hz controls, 10 Hz compact snapshots. */
import {sessionResult} from '../../services/sessionResults';
import {SessionEnd, sendFinalResult} from '../../services/sessionResultDisplay';
export class KartRoom {
  readonly connectionHealth=new KartConnectionHealth();
  isSlowConnection(now=performance.now()){
    const backlog=Math.max(this.dedicated?.bufferedAmount??0,...Array.from(this.channels.values(),c=>c.dataChannel?.bufferedAmount??0));
    return this.connectionHealth.sample(now,backlog,true);
  }
  private sessionEnd = new SessionEnd('kart', () => this.close(false));
  transport:OnlineTransport='host';
  selfId = 'local'; code = ''; host = false; world: Race | null = null;
  private dedicated: DedicatedConnection | null = null;
  private sessionToken = crypto.randomUUID();
  private dedicatedHello: object | null = null;
  private reconnecting = false;
  private startSync = new RaceStartSync();
  private readySeed: number | null = null;
  private readyFrame = 0;
  private notify(world: Race) {
    if(document.hidden)this.connectionHealth.resume(performance.now());else this.connectionHealth.packet(performance.now());
    this.update(world);
    if (world.phase !== 'countdown' || !world.paused || this.readySeed === world.seed) return;
    this.readySeed = world.seed;
    // Let React commit the new course and the canvas draw before acknowledging it.
    this.readyFrame = requestAnimationFrame(() => {
      this.readyFrame = requestAnimationFrame(() => {
        if (this.closed || this.world?.seed !== world.seed) return;
        if (this.dedicated) this.dedicated.send({ type: 'ready', seed: world.seed });
        else if (this.host) this.startSync.ready(this.world, this.selfId, world.seed);
        else { const host = this.channels.get('host'); if (host) this.sendTo(host, { type: 'ready', seed: world.seed }); }
      });
    });
  }
  private peer: Peer | null = null;
  private channels = new Map<string, DataConnection>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private closed = false; private sequence = 0; private lastSequence = -1; private lastRoster = -1;
  private lastPacketAt = 0; private paused = false;
  private rates = new Map<string, { at: number; count: number }>();
  private pending = new Set<ReturnType<typeof setTimeout>>();
  private abort=new AbortController();
  constructor(private update: (world: Race | null) => void, private status: (message: string) => void) {}
  private sendTo(c: DataConnection, data: object | ArrayBuffer) {
    if (!c.open) return;
    try { c.send(data instanceof ArrayBuffer ? data : JSON.stringify(data)); } catch { c.close(); }
  }
  private emit() {
    if (this.closed || !this.world) return;
    this.notify(structuredClone(this.world));
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
    if (this.world) this.world.paused = this.paused || this.startSync.waiting;
    for (const c of this.channels.values()) this.sendTo(c, { type: 'pause', value: this.paused });
    this.status(this.paused ? 'ホストの画面が戻るまで一時停止しています。' : '');
  };
  private run() {
    let previous = performance.now(), accumulator = 0, broadcast = 0;
    document.addEventListener('visibilitychange', this.visibility);
    this.visibility();
    this.timer = setInterval(() => {
      const now = performance.now(), elapsed = Math.min(.15, (now - previous) / 1000); previous = now;
      if (this.world && this.startSync.advance(this.world)) this.world.paused = this.paused;
      if (this.world && !this.paused) {
        accumulator += elapsed;
        while (accumulator >= 1 / 60) { tick(this.world, 1 / 60); accumulator -= 1 / 60; }
      }
      broadcast += elapsed;
      if (broadcast >= .1 || this.world?.revision !== this.lastRoster) { broadcast = 0; this.emit(); }
    }, 1000 / 60);
    this.emit();
  }
  practice(name: string, hero: number, course: number, customCourse?:CustomCourse) {
    this.host = true; this.world = createRace(course, crypto.getRandomValues(new Uint32Array(1))[0],3,customCourse);
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
    for(let attempt=0;;attempt++){
    if(this.closed)throw new Error('接続を終了しました。');
    const peer = id ? new Peer(id, options) : new Peer(options); this.peer = peer;
    try{await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => { done(); reject(new Error('接続がタイムアウトしました。')); }, 15000); this.pending.add(t);
      const abort=()=>{done();reject(new Error('接続を終了しました。'));};
      const done = () => { clearTimeout(t); this.pending.delete(t);this.abort.signal.removeEventListener('abort',abort); };
      this.abort.signal.addEventListener('abort',abort,{once:true});
      peer.once('open', () => { done(); resolve(); });
      peer.once('error', e => { done(); reject(new Error(`Connection failed: ${e.type}`)); });
    });}catch(error){
      peer.destroy();
      if(this.closed||attempt>=2||/invalid-id|unavailable-id|browser-incompatible|ssl-unavailable/.test(String(error)))throw error;
      // Signalling can fail transiently on a crowded school network. Retry
      // before admission, so a retry cannot create duplicate participants.
      await new Promise(resolve=>setTimeout(resolve,750+Math.random()*750));continue;
    }
    if (this.closed) { peer.destroy(); throw new Error('接続を終了しました。'); }
    peer.on('error', e => { if (!this.closed) this.status(`Network: ${e.type}`); });
    peer.on('disconnected', () => { if (!this.closed && !peer.destroyed) peer.reconnect(); });
    this.selfId = peer.id; return peer;
    }
  }
  private reject(c: DataConnection, message: string) {
    const deliver = () => {
      this.sendTo(c, { type: 'error', message });
      const t = setTimeout(() => { c.close(); this.pending.delete(t); }, 500); this.pending.add(t);
    };
    if (c.open) deliver(); else c.once('open', deliver);
  }
  async create(name: string, hero: number, course: number, customCourse?:CustomCourse) {
    if(this.transport==='server'){await this.connectDedicated({create:true,name,hero,course,customCourse,avatar:defaultAvatar(hero)});return;}
    this.host = true;
    this.code = createHostRoomCode();
    const peer = await this.open(`gakuro-apex-v${PROTOCOL}-${this.code}`);
    this.world = createRace(course, crypto.getRandomValues(new Uint32Array(1))[0],3,customCourse); addRacer(this.world, this.selfId, name, hero);
    peer.on('connection', c => {
      if (this.closed) { c.close(); return; }
      if (this.channels.size >= MAX_RACERS - 1 || this.world?.phase === 'result' || this.channels.has(c.peer)) { this.reject(c, '満員、またはレース終了済みです。'); return; }
      this.channels.set(c.peer, c);
      const timeout = setTimeout(() => { if (!this.world?.players[c.peer]) c.close(); this.pending.delete(timeout); }, 10000); this.pending.add(timeout);
      c.on('data', raw => {
        if (this.closed || !this.world || typeof raw !== 'string' || raw.length > 512) return;
        let d: any; try { d = JSON.parse(raw); } catch { return; } if (!d || typeof d !== 'object') return;
        const now = performance.now(), rate = this.rates.get(c.peer);
        if (!rate || now - rate.at > 1000) this.rates.set(c.peer, { at: now, count: 1 }); else if (++rate.count > 35) return;
        if (d.type === 'hello') {
          if (d.version !== PROTOCOL || !validAvatar(d.avatar) || typeof d.name !== 'string' || !Number.isInteger(d.hero) || !addRacer(this.world, c.peer, d.name, d.hero)) { this.reject(c, '参加できません。部屋の空き人数を確認してください。'); return; }
          this.world.players[c.peer].avatar = { ...d.avatar }; clearTimeout(timeout); this.pending.delete(timeout); this.emit();
        } else if (d.type === 'ready') this.startSync.ready(this.world, c.peer, d.seed);
        else if (d.type === 'avatar') this.applyAvatar(c.peer, d.avatar);
        else if (d.type === 'command') command(this.world, c.peer, d.command);
      });
      let dropped = false;
      const drop = () => {
        if (dropped) return; dropped = true;
        clearTimeout(timeout); this.pending.delete(timeout); this.channels.delete(c.peer); this.rates.delete(c.peer);
        if (this.world?.players[c.peer]) {
          delete this.world.players[c.peer];
          this.startSync.remove(c.peer);
          this.world.revision++; this.emit();
        }
      };
      c.on('close', drop); c.on('error', drop);
    }); this.run();
  }
  async join(code: string, name: string, hero: number, avatar: KartAvatar = defaultAvatar(hero)) {
    const address=roomAddress(code,this.transport);this.transport=address.transport;this.code=address.code;
    if (!/^[A-Z0-9]{6}$/.test(this.code)) throw new Error('6桁の数字の招待コードを入力してください。');
    if(this.transport==='server'){await this.connectDedicated({code:this.code,name,hero,avatar});return;}
    const peer = await this.open();
    const c = peer.connect(`gakuro-apex-v${PROTOCOL}-${this.code}`, { reliable: true, serialization: 'raw' }); this.channels.set('host', c);
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => { done(); reject(new Error('部屋が見つからないか、接続できません。')); }, 15000); this.pending.add(timeout);
      const abort=()=>{done();reject(new Error('接続を終了しました。'));};
      const done = () => { clearTimeout(timeout); this.pending.delete(timeout);this.abort.signal.removeEventListener('abort',abort); };
      this.abort.signal.addEventListener('abort',abort,{once:true});
      c.on('open', () => this.sendTo(c, { type: 'hello', version: PROTOCOL, name: name.slice(0, 16), hero, avatar }));
      c.on('data', raw => {
        if (this.closed) return;
        if (raw instanceof ArrayBuffer && this.world) {
          const decoded = decodeSnapshot(raw, this.world, this.lastSequence);
          if (decoded && decoded.world.players[this.selfId]) {
            this.world = decoded.world; this.lastSequence = decoded.sequence; this.lastPacketAt = performance.now(); this.notify(this.world); done(); resolve();
          } return;
        }
        if (typeof raw !== 'string' || raw.length > 600000) return;
        let d: any; try { d = JSON.parse(raw); } catch { return; } if (!d || typeof d !== 'object') return;
        if (this.sessionEnd.receive(d)) { done(); resolve(); return; }
        if (d.type === 'error') { done(); reject(new Error(typeof d.message === 'string' ? d.message : 'Connection rejected')); }
        if (d.type === 'roster') { const next = acceptRoster(d as Roster, this.world); if (next) this.world = next; }
        if (d.type === 'pause') this.status(d.value ? 'ホストの画面が戻るまで一時停止しています。' : '');
      });
      const lost = () => { done(); reject(new Error('ホストとの接続が終了しました。')); if (!this.closed) { this.close(); this.update(null); this.status('ホストとの接続が終了しました。部屋に入り直してください。'); } };
      c.on('close', lost); c.on('error', lost);
    });
    this.timer = setInterval(() => { if (performance.now() - this.lastPacketAt > 12000) { this.close(); this.update(null); this.status('通信が途切れました。部屋に入り直してください。'); } }, 1000);
  }
  private async connectDedicated(packet: object, resuming = false) {
    if (!resuming) this.dedicatedHello = { ...packet, sessionToken: this.sessionToken };
    this.lastSequence = -1;
    this.readySeed = null;
    this.dedicated=new DedicatedConnection(d=>{
      if (this.sessionEnd.receive(d)) return true;
      if(d instanceof ArrayBuffer && this.world){const next=decodeSnapshot(d,this.world,this.lastSequence);if(next){this.world=next.world;this.lastSequence=next.sequence;this.notify(this.world);return !!this.world.players[this.selfId];}}
      if(d.type==='connected'){this.selfId=d.id;this.code=d.code;this.host=d.host;Object.assign(this.dedicatedHello!,{create:false,code:this.code});}
      if(d.type==='host')this.host=!!d.host;
      if(d.type==='roster'){const next=acceptRoster(d,this.world);if(next)this.world=next;}
      return false;
    },()=>{ void this.resumeDedicated(); });
    this.status('専用サーバーに接続しています。');await this.dedicated.open('kart',this.dedicatedHello!,resuming ? 20000 : 180000);this.status('');
  }
  private async resumeDedicated() {
    if (this.closed || this.reconnecting || !this.dedicatedHello) return;
    this.reconnecting = true;
    this.dedicated?.close();
    try { await this.connectDedicated({}, true); }
    catch { if (!this.closed) { this.close(); this.update(null); this.status('専用サーバーとの接続が終了しました。'); } }
    finally { this.reconnecting = false; }
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
  setSpectator(enabled: boolean) {
    if (!this.host || !this.world || !['lobby', 'result'].includes(this.world.phase)) return;
    if (this.dedicated) { this.dedicated.send({ type: 'spectator', enabled }); return; }
    if (setSpectator(this.world, this.selfId, enabled)) this.emit();
  }
  start(fill = true) { if(this.dedicated){if(this.host)this.dedicated.send({type:'start',fill});return;} if (this.host && this.world?.phase === 'lobby') { startRace(this.world, fill); this.startSync.begin(this.world, Object.values(this.world.players).filter(p => !p.cpu).map(p => p.id)); this.emit(); } }
  rematch(lesson?: KartLesson, course = this.world?.course ?? 0, laps = this.world?.laps ?? 3, customCourse?:CustomCourse) {
    if (!this.host || this.world?.phase !== 'result') return;
    if(this.dedicated){this.dedicated.send({type:'rematch',lesson,course,laps,customCourse});return;}
    const old = this.world, previousRevision = old.revision; this.world = createRace(course, old.seed + 1, laps,customCourse);
    this.world.lesson = lesson && validLesson(lesson) ? structuredClone(lesson) : old.lesson;
    this.world.revision = previousRevision;
    for (const p of Object.values(old.players).filter(p => p.cpu ? p.id.startsWith('cpu-') : p.id === this.selfId || this.channels.get(p.id)?.open)) { addRacer(this.world, p.id, p.name, p.hero, p.cpu); this.world.players[p.id].avatar = { ...p.avatar }; this.world.players[p.id].spectator = p.spectator; }
    startRace(this.world); this.startSync.begin(this.world, Object.values(this.world.players).filter(p => !p.cpu).map(p => p.id)); this.emit();
  }
  send(c: Command) {
    if (this.closed) return;
    if(this.dedicated){this.dedicated.send({type:'command',command:c});return;}
    if (this.host && this.world) command(this.world, this.selfId, c);
    else { const host = this.channels.get('host'); if (host?.open && (host.dataChannel?.bufferedAmount || 0) < 4096) this.sendTo(host, { type: 'command', command: c }); }
  }
  close(results = true) {
    if (this.closed) return;
    if (results && this.host && this.code && this.sessionEnd.end(this.world ? sessionResult('kart', this.world) : null, this.dedicated, packet => sendFinalResult(this.channels.values(), packet))) return;
    if (this.closed) return; this.closed = true;this.abort.abort();
    this.dedicated?.send({type:'leave'});
    this.dedicated?.close();
    cancelAnimationFrame(this.readyFrame);
    if (this.timer) clearInterval(this.timer); document.removeEventListener('visibilitychange', this.visibility);
    this.pending.forEach(clearTimeout); this.pending.clear(); this.channels.forEach(c => c.close()); this.channels.clear(); this.peer?.destroy(); this.world = null;
  }
}
