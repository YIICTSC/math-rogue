import {DedicatedConnection,onlineServerUrl} from '../../services/dedicatedConnection';
import {MAP_WIDTH,MAP_HEIGHT,MAP_TILES} from './map';
import {roomTile,homeAt,publicHome} from './homeSocial';
import Peer, { type DataConnection, type PeerOptions } from 'peerjs';
import { addPlayer, applyCommand, CAPACITY, createWorld, MATERIALS, QuizBank, tick, type Command, type Player, type Reply, type Tile, type World } from './engine';
import type { KartQuestion } from '../gakuro-kart/learning';
import { normalizeCraftCode } from './invite';
import { avatarOf, type Avatar } from './avatar';
import { migrateProgress } from './progression';
import {loadIsland,SAVE_KEY,type Saved} from './save';
export {loadIsland,SAVE_KEY} from './save';
export const CRAFT_PROTOCOL = 8;
type Link = { channel: DataConnection; revision: number; admitted: boolean; rateAt: number; count: number };
export class CraftRoom {
  profileId:string=crypto.randomUUID();selfId = 'local'; code = ''; host = false; world: World | null = null; title = '';
  private dedicated: DedicatedConnection | null = null;
  private checkpoint: Saved | null = null;
  private peer: Peer | null = null; private links = new Map<string, Link>(); private bank: QuizBank | null = null;
  private timer: ReturnType<typeof setInterval> | null = null; private closed = false; private lastPacket = 0; private pending = new Set<ReturnType<typeof setTimeout>>();
  private loading: World | null = null; private renderedWorld:World|null=null; private renderedTiles:Tile[]=[]; private renderedRevision=-1; private savedAt = 0;
  constructor(private update: (w: World | null) => void, private event: (reply: Reply) => void, private status: (text: string) => void) {}
  private send(c: DataConnection, data: unknown) { if (!c.open) return false; try { c.send(JSON.stringify(data)); return true; } catch { c.close(); return false; } }
  private later(fn: () => void, ms: number) { const t = setTimeout(() => { this.pending.delete(t); fn(); }, ms); this.pending.add(t); return t; }
  private cancel(t: ReturnType<typeof setTimeout>) { clearTimeout(t); this.pending.delete(t); }
  private snapshot(id: string) {
    const w = this.world!;
    const player=w.players[id],tile=player?roomTile(player):-1,home=player?.indoors?homeAt(w,tile):undefined;
    return { games:Object.fromEntries(Object.entries(w.games||{}).filter(([,g])=>g.homeTile===tile&&player?.indoors)),roomHome:home?publicHome(home):null, type: 'state', time: w.time, paused: w.paused, revision: w.revision, donated: w.donated, harvested: w.harvested, built: w.built,villageLevel:w.villageLevel,builtSites:w.builtSites,progress:w.players[id]?.progress,
      players: Object.values(w.players).map(p => [p.id, p.name, p.color, +p.x.toFixed(3), +p.z.toFixed(3), +p.energy.toFixed(2), p.correct, p.actions, p.avatar, p.lastAction, p.buffUntil, p.fishing,p.indoors,p.homeTile]), coins: w.players[id]?.coins, bag: w.players[id]?.bag };
  }
  private publish(world:World){
    if(this.renderedWorld!==world){this.renderedWorld=world;this.renderedTiles=world.tiles.map(t=>structuredClone(t));}
    else if(this.renderedRevision!==world.revision){let next:Tile[]|undefined;for(let i=0;i<world.tiles.length;i++)if(this.renderedTiles[i]?.revision!==world.tiles[i].revision){next??=this.renderedTiles.slice();next[i]=structuredClone(world.tiles[i]);}if(next)this.renderedTiles=next;}
    this.renderedRevision=world.revision;
    const view=structuredClone({...world,tiles:[]});view.tiles=this.renderedTiles;this.update(view);
  }
  private emit() {
    if (!this.world || this.closed) return;
    this.publish(this.world);
    const patches=new Map<number,unknown[][]>();
    for (const [id, link] of this.links) {
      if (!link.admitted || !link.channel.open || (link.channel.dataChannel?.bufferedAmount || 0) > 65536) continue;
      let changed=patches.get(link.revision);if(!changed){changed=this.world.tiles.flatMap((t,i)=>t.revision>link.revision?[[i,t]]:[]);patches.set(link.revision,changed);}
      let sent = true;
      for (let i = 0; i < changed.length; i += 64) if (!this.send(link.channel, { type: 'tiles', entries: changed.slice(i, i + 64) })) sent = false;
      if (sent && this.send(link.channel, this.snapshot(id))) link.revision = this.world.revision;
    }
    if (this.world.time - this.savedAt > 5) { this.save(); this.savedAt = this.world.time; }
  }
  private visibility = () => { if (this.host && this.world) { this.world.paused = document.hidden; for (const p of Object.values(this.world.players)) p.dx = p.dz = 0; this.emit(); } };
  private run() {
    let previous = performance.now(), broadcast = 0;
    document.addEventListener('visibilitychange', this.visibility); this.visibility();
    this.timer = setInterval(() => { const now = performance.now(), dt = Math.min(.1, (now - previous) / 1000); previous = now;
      if (this.world) tick(this.world, dt); broadcast += dt;
      if (broadcast >= .15) { broadcast = 0; this.emit(); }
    }, 50); this.emit();
  }
  private setup(name: string, color: number, questions: KartQuestion[], title: string, resume: boolean, avatar?: Avatar) {
    const saved = resume ? loadIsland() : null;if(saved?.player.profileId&& /^[A-Za-z0-9-]{8,64}$/.test(saved.player.profileId))this.profileId=saved.player.profileId;
    this.world = saved ? { ...saved.world, players: {}, paused: false } : createWorld(crypto.getRandomValues(new Uint32Array(1))[0]);
    this.title = title; this.bank = new QuizBank(questions); addPlayer(this.world, this.selfId, name, color, avatar,this.profileId);
    if (saved) {
      const p = this.world.players[this.selfId]; p.bag = { ...saved.player.bag }; p.energy = Math.max(0, Math.min(100, saved.player.energy || 0)); p.correct = saved.player.correct || 0; p.coins=saved.player.coins||0;p.progress=migrateProgress(saved.player.progress);
      // Reopened islands retain buildings; the new room owner can maintain them.
      if(!Object.keys(saved.world.residents).length)for (const t of this.world.tiles) if (t.owner) t.owner = this.selfId;
    }
    this.run();
  }
  practice(name: string, color: number, questions: KartQuestion[], title: string, resume = false, avatar?: Avatar) { this.host = true; this.setup(name, color, questions, title, resume, avatar); }
  private async open(id?: string) {
    const env = import.meta.env;
    const options: PeerOptions = env.VITE_RPG_PEER_HOST ? { host: env.VITE_RPG_PEER_HOST, port: Number(env.VITE_RPG_PEER_PORT || 443), path: env.VITE_RPG_PEER_PATH || '/', secure: env.VITE_RPG_PEER_SECURE !== 'false' } : {};
    const ice = env.VITE_CRAFT_ICE_SERVERS || env.VITE_KART_ICE_SERVERS;
    if (ice) { const iceServers = JSON.parse(ice); if (!Array.isArray(iceServers)) throw new Error('Invalid ICE configuration'); options.config = { iceServers }; }
    const peer = id ? new Peer(id, options) : new Peer(options); this.peer = peer;
    await new Promise<void>((resolve, reject) => { const t = this.later(() => reject(new Error('接続がタイムアウトしました。')), 15000);
      peer.once('open', () => { this.cancel(t); resolve(); }); peer.once('error', () => { this.cancel(t); reject(new Error('接続できませんでした。もう一度お試しください。')); });
    });
    if (this.closed) { peer.destroy(); throw new Error('接続を終了しました。'); }
    peer.on('error', () => { if (!this.closed) this.status('通信エラーが発生しました。'); });
    peer.on('disconnected', () => { if (!this.closed && !peer.destroyed) peer.reconnect(); }); this.selfId = peer.id; return peer;
  }
  async create(name: string, color: number, questions: KartQuestion[], title: string, resume = false, avatar?: Avatar) {
    if(onlineServerUrl()){const saved=resume?loadIsland():null;if(saved?.player.profileId)this.profileId=saved.player.profileId;await this.connectDedicated({create:true,name,color,questions,title,avatar,profileId:this.profileId,saved});return;}
    this.host = true; const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; this.code = Array.from(crypto.getRandomValues(new Uint8Array(6)), n => alphabet[n % alphabet.length]).join('');
    const peer = await this.open(`gakuro-craft-v${CRAFT_PROTOCOL}-${this.code}`); this.setup(name, color, questions, title, resume, avatar);
    peer.on('connection', channel => {
      const reject = () => { const send = () => { this.send(channel, { type: 'error', text: '部屋が満員か、参加できません。' }); this.later(() => channel.close(), 300); }; if (channel.open) send(); else channel.once('open', send); };
      if (this.closed || this.links.size >= CAPACITY - 1 || this.links.has(channel.peer)) { reject(); return; }
      const link: Link = { channel, revision: -1, admitted: false, rateAt: 0, count: 0 }; this.links.set(channel.peer, link);
      const deadline = this.later(() => { if (!link.admitted) channel.close(); }, 15000);
      channel.on('data', raw => {
        if (this.closed || !this.world || typeof raw !== 'string' || raw.length > 1024) return;
        let d: any; try { d = JSON.parse(raw); } catch { return; } if (!d || typeof d !== 'object') return;
        const now = performance.now(); if (now - link.rateAt > 1000) { link.rateAt = now; link.count = 0; } if (++link.count > 35) return;
        if (d.type === 'hello' && !link.admitted) {
          if (d.version !== CRAFT_PROTOCOL || typeof d.name !== 'string'||typeof d.profileId!=='string'||! /^[A-Za-z0-9-]{8,64}$/.test(d.profileId) || !addPlayer(this.world, channel.peer, d.name, d.color, avatarOf(d.avatar,d.color),d.profileId)) { reject(); return; }
          this.cancel(deadline); link.admitted = true;
          this.send(channel, { type: 'init', version: CRAFT_PROTOCOL, seed: this.world.seed,width:MAP_WIDTH,height:MAP_HEIGHT, title: this.title });
          const patches=this.world.tiles.flatMap((t,i)=>t.revision>0?[[i,t]]:[]);for(let start=0;start<patches.length;start+=64)this.send(channel,{type:'tiles',entries:patches.slice(start,start+64)});
          link.revision = this.world.revision; this.send(channel, this.snapshot(channel.peer)); this.emit();
        } else if (d.type === 'command' && link.admitted) { const reply = this.execute(channel.peer, d.command); if (reply) this.send(channel, { type: 'reply', reply }); }
      });
      let dropped = false; const drop = () => { if (dropped) return; dropped = true; this.cancel(deadline); this.links.delete(channel.peer); this.bank?.forget(channel.peer); if (this.world) { this.remember(channel.peer);delete this.world.players[channel.peer]; this.emit(); } };
      channel.on('close', drop); channel.on('error', drop);
    });
  }
  async join(code: string, name: string, color: number, avatar?: Avatar) {
    this.code = normalizeCraftCode(code); if (!this.code) throw new Error('6文字の招待コードを入力してください。');
    if(onlineServerUrl()){await this.connectDedicated({code:this.code,name,color,avatar,profileId:this.profileId});return;}
    const peer = await this.open(), channel = peer.connect(`gakuro-craft-v${CRAFT_PROTOCOL}-${this.code}`, { reliable: true, serialization: 'raw' });
    this.links.set('host', { channel, revision: -1, admitted: true, rateAt: 0, count: 0 });
    await new Promise<void>((resolve, reject) => {
      let joined = false; const deadline = this.later(() => reject(new Error('部屋が見つからないか、接続できません。')), 20000);
      channel.on('open', () => this.send(channel, { type: 'hello', version: CRAFT_PROTOCOL, name: name.slice(0, 16), color, avatar,profileId:this.profileId }));
      channel.on('data', raw => {
        if (this.closed || typeof raw !== 'string' || raw.length > 100000) return;
        let d: any; try { d = JSON.parse(raw); } catch { return; } if (!d || typeof d !== 'object') return;
        if (d.type === 'error') { this.cancel(deadline); reject(new Error(d.text)); return; }
        if (d.type === 'init' && d.version === CRAFT_PROTOCOL&&d.width===MAP_WIDTH&&d.height===MAP_HEIGHT) { this.loading = createWorld(d.seed);  this.title = String(d.title || '').slice(0, 160); }
        if (d.type === 'tiles' && Array.isArray(d.entries)) {
          const world = this.loading || this.world; if (!world) return;
          for (const entry of d.entries) if (Array.isArray(entry) && Number.isInteger(entry[0]) && entry[0] >= 0 && entry[0] < MAP_TILES && entry[1] && Array.isArray(entry[1].blocks)) { world.tiles[entry[0]] = entry[1] as Tile; }
        }
        if (d.type === 'state' && Array.isArray(d.players) && d.players.length <= CAPACITY && (this.loading||this.world)) {
          const world = this.loading || this.world; if (!world || !Number.isFinite(d.time) || !d.players.some((p: any) => p[0] === this.selfId)) return;
          world.time = d.time; world.paused = !!d.paused; world.revision = d.revision; world.donated = d.donated; world.harvested = d.harvested; world.built = d.built;world.villageLevel=d.villageLevel||0;world.builtSites=Array.isArray(d.builtSites)?d.builtSites:[];
          const players: Record<string, Player> = {};
          for (const row of d.players) { const [id, name, color, x, z, energy, correct, actions, avatar, lastAction, buffUntil, fishing,indoors,homeTile] = row; if (typeof id !== 'string' || ![x, z, energy].every(Number.isFinite)) return;
            players[id] = { id,profileId:id===this.selfId?this.profileId:'',progress:id===this.selfId?migrateProgress(d.progress):migrateProgress(null),indoors:!!indoors,homeTile:Number.isInteger(homeTile)?homeTile:undefined, name: String(name).slice(0, 16), color, x, z, energy, correct, actions, avatar:avatarOf(avatar,color),lastAction,fishing,buffUntil:buffUntil||0,coins:id===this.selfId?d.coins||0:0, bag: id === this.selfId ? d.bag : Object.fromEntries(MATERIALS.map(k => [k, 0])), dx: 0, dz: 0, actionAt: 0, inputAt: 0 } as Player;
          }
          world.games=d.games&&typeof d.games==='object'?d.games:{};world.homeViews={};if(d.roomHome&&Number.isInteger(d.roomHome.tile))world.homeViews[d.roomHome.tile]=d.roomHome;world.players = players; this.world = world; this.loading = null; this.lastPacket = performance.now(); this.publish(world); this.cancel(deadline); joined = true; resolve();
        }
        if (d.type === 'reply' && d.reply && ['notice', 'quiz', 'answer'].includes(d.reply.type)) this.event(d.reply);
      });
      const lost = () => { this.cancel(deadline); if (!joined) reject(new Error('ホストとの接続が終了しました。')); if (!this.closed) { this.close(); this.update(null); this.status('ホストとの接続が終了しました。'); } };
      channel.on('close', lost); channel.on('error', lost);
    });
    this.timer = setInterval(() => { if (performance.now() - this.lastPacket > 15000) { this.close(); this.update(null); this.status('通信が途切れました。部屋に入り直してください。'); } }, 1000);
  }
  private receiveDedicated(d: any) {
    let joined=false;
    if(d.type==='connected'){this.selfId=d.id;this.code=d.code;this.host=d.host;}
    if(d.type==='host')this.host=!!d.host;
    if(d.type==='checkpoint'&&this.world&&d.saved?.world?.revision===this.world.revision){this.checkpoint={...d.saved,world:{...d.saved.world,tiles:structuredClone(this.world.tiles)}};this.save();return false;}
        if (d.type === 'init' && d.version === CRAFT_PROTOCOL&&d.width===MAP_WIDTH&&d.height===MAP_HEIGHT) { this.loading = createWorld(d.seed);  this.title = String(d.title || '').slice(0, 160); }
        if (d.type === 'tiles' && Array.isArray(d.entries)) {
          const world = this.loading || this.world; if (!world) return;
          for (const entry of d.entries) if (Array.isArray(entry) && Number.isInteger(entry[0]) && entry[0] >= 0 && entry[0] < MAP_TILES && entry[1] && Array.isArray(entry[1].blocks)) { world.tiles[entry[0]] = entry[1] as Tile; }
        }
        if (d.type === 'state' && Array.isArray(d.players) && d.players.length <= CAPACITY && (this.loading||this.world)) {
          const world = this.loading || this.world; if (!world || !Number.isFinite(d.time) || !d.players.some((p: any) => p[0] === this.selfId)) return;
          world.time = d.time; world.paused = !!d.paused; world.revision = d.revision; world.donated = d.donated; world.harvested = d.harvested; world.built = d.built;world.villageLevel=d.villageLevel||0;world.builtSites=Array.isArray(d.builtSites)?d.builtSites:[];
          const players: Record<string, Player> = {};
          for (const row of d.players) { const [id, name, color, x, z, energy, correct, actions, avatar, lastAction, buffUntil, fishing,indoors,homeTile] = row; if (typeof id !== 'string' || ![x, z, energy].every(Number.isFinite)) return;
            players[id] = { id,profileId:id===this.selfId?this.profileId:'',progress:id===this.selfId?migrateProgress(d.progress):migrateProgress(null),indoors:!!indoors,homeTile:Number.isInteger(homeTile)?homeTile:undefined, name: String(name).slice(0, 16), color, x, z, energy, correct, actions, avatar:avatarOf(avatar,color),lastAction,fishing,buffUntil:buffUntil||0,coins:id===this.selfId?d.coins||0:0, bag: id === this.selfId ? d.bag : Object.fromEntries(MATERIALS.map(k => [k, 0])), dx: 0, dz: 0, actionAt: 0, inputAt: 0 } as Player;
          }
          world.games=d.games&&typeof d.games==='object'?d.games:{};world.homeViews={};if(d.roomHome&&Number.isInteger(d.roomHome.tile))world.homeViews[d.roomHome.tile]=d.roomHome;world.players = players; this.world = world; this.loading = null; this.lastPacket = performance.now(); this.publish(world); joined = true;
        }
        if (d.type === 'reply' && d.reply && ['notice', 'quiz', 'answer'].includes(d.reply.type)) this.event(d.reply);
    return joined;
  }
  private async connectDedicated(packet: object) {
    this.dedicated=new DedicatedConnection(d=>this.receiveDedicated(d),()=>{this.close();this.update(null);this.status('専用サーバーとの接続が終了しました。');});
    this.status('専用サーバーに接続しています。');
    await this.dedicated.open('craft',packet);this.status('');
  }
  private execute(id: string, raw: any) {
    if (!this.world || !raw || typeof raw !== 'object') return;
    if (this.world.paused && raw.type !== 'move') return { type: 'notice', text: 'ホストが戻るまで一時停止中です。' } as Reply;
    if (raw.type === 'quiz') return this.bank?.ask(this.world, id);
    if (raw.type === 'answer') return this.bank?.answer(this.world, id, raw.token, raw.option);
    return applyCommand(this.world, id, raw);
  }
  sendCommand(command: Command) {
    if (this.closed) return;
    if(this.dedicated){this.dedicated.send({type:'command',command});return;}
    if (this.host) { const reply = this.execute(this.selfId, command); if (reply) this.event(reply); }
    else { const link = this.links.get('host'); if (link && (link.channel.dataChannel?.bufferedAmount || 0) < 8192) this.send(link.channel, { type: 'command', command }); }
  }
  private remember(id:string){const p=this.world?.players[id];if(p&&this.world)this.world.residents[p.profileId]={id:p.id,bag:{...p.bag},coins:p.coins,energy:p.energy,correct:p.correct,progress:structuredClone(p.progress)};}
  save() {
    if(this.dedicated){if(!this.host||!this.checkpoint)return false;try{localStorage.setItem(SAVE_KEY,JSON.stringify(this.checkpoint));return true;}catch{this.status('島を保存できませんでした。');return false;}}
    if (!this.host || !this.world || !this.world.players[this.selfId]) return false;
    try {for(const id of Object.keys(this.world.players))this.remember(id); localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1, world: { ...this.world, players: {},games:{},homeViews:{} }, owner: this.selfId, player: this.world.players[this.selfId] })); return true; }
    catch { this.status('島を保存できませんでした。端末の空き容量を確認してください。'); return false; }
  }
  close() {
    if (this.closed) return; this.save(); this.closed = true;
    this.dedicated?.close();
    if (this.timer) clearInterval(this.timer); document.removeEventListener('visibilitychange', this.visibility); this.pending.forEach(clearTimeout); this.pending.clear();
    this.links.forEach(l => l.channel.close()); this.links.clear(); this.peer?.destroy(); this.world = null;
  }
}
