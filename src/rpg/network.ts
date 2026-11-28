import {DedicatedConnection} from '../services/dedicatedConnection';
import {createHostRoomCode,roomAddress,type OnlineTransport} from '../services/onlineTransport';
import {changedResidentAssets,stripResidentAssets,type ResidentAssets} from './town/residentTransport';
import {applyWorldDelta,WorldDeltaWriter,type DeltaPacket,type SharedWorldState} from './worldDelta';
import type {CreatedResident} from './town/residents';
import { openCreativeWorld } from './creative';
import type { P2PEvent } from "../services/p2pService";
import Peer, { type DataConnection, type PeerOptions } from "peerjs";
import {
  validProfile,
  addPlayer,
  applyAction,
  setSpectator,
  createWorld,
  advanceWorld,
  removePlayer,
  type Action,
  type NativeProfile,
  type World,
} from "./engine";
import {
  normalizeRpgAdventureSetup,
  type RpgAdventureSetup,
} from "./setup";

// Host worlds share equipment and signal state with participants on the same schema.
const RPG_PROTOCOL_VERSION = 28;
const PEER_REJOIN_MS=120_000;
// Avoid BinaryPack's recursive encoding of 16,896 individual terrain cells.
// Retain binary transport so PeerJS can still chunk large room snapshots.
type WireWorld = Omit<World, "tiles"> & { tiles: World["tiles"] | string };
type ServerHello = {name:string}&(
  {create:true;setup:RpgAdventureSetup|null;minutes:number;gameMode:World['gameMode']} |
  {code:string;prepare?:true;resumeToken?:string}
);
function unpackWorld(world: WireWorld): World {
  return {...world,tiles:typeof world.tiles === "string" ? world.tiles.split(",") as World["tiles"] : world.tiles};
}

function isNativeProfile(value: unknown): value is NativeProfile {
  if (!value || typeof value !== "object") return false;
  return validProfile(value as NativeProfile);
}

/** A single room owner validates commands and broadcasts authoritative state. */
import {sessionResult} from '../services/sessionResults';
import {SessionEnd, sendFinalResult} from '../services/sessionResultDisplay';
export class RpgRoom {
  private sessionEnd = new SessionEnd('rpg', () => this.close(false));
  transport:OnlineTransport='host';
  onDungeonEvent: ((event: P2PEvent, from: string) => void) | null = null;
  private receiveDungeon(raw: unknown): boolean {
    const packet = raw as { type?: string; event?: P2PEvent; from?: string };
    if (packet?.type !== 'dungeon-event') return false;
    if (packet.event && typeof packet.from === 'string') this.onDungeonEvent?.(packet.event,packet.from);
    return true;
  }
  private relayDungeon(from: string, event: P2PEvent, target?: string): boolean {
    const dungeon = this.world?.activities.dungeons.find(d => d.status === 'active' && d.members.includes(from));
    if (!dungeon || !event || typeof event.type !== 'string' || !event.type.startsWith('COOP_')) return false;
    const guestEvents = ['COOP_SELF_STATE','COOP_PLAYER_SNAPSHOT','COOP_STATE_SYNC_REQUEST','COOP_REWARD_SYNC_REQUEST','COOP_QUIZ_RESULT','COOP_BATTLE_SELECT_ENEMY','COOP_BATTLE_PLAY_CARD','COOP_BATTLE_USE_POTION','COOP_BATTLE_TURN_START','COOP_BATTLE_SELECTION_STATE','COOP_BATTLE_MODAL_RESOLVE','COOP_BATTLE_CODEX_SELECT','COOP_END_TURN','COOP_NODE_SELECT','COOP_REWARD_SELECT','COOP_REWARD_SKIP','COOP_TREASURE_OPEN','COOP_TREASURE_CLAIM','COOP_EVENT_OPTION','COOP_EVENT_CONTINUE','COOP_REST_ACTION','COOP_SHOP_ACTION','COOP_SUPPORT_USE'];
    if (from !== dungeon.leader && !guestEvents.includes(event.type)) return false;
    const recipients = from === dungeon.leader ? dungeon.members.filter(id=>id!==from && (!target || target===id)) : [dungeon.leader];
    for (const id of recipients) {
      if (id === this.selfId) this.onDungeonEvent?.(event,from);
      else this.connections.get(id)?.send({type:'dungeon-event',event,from});
    }
    return true;
  }
  sendDungeonEvent(event: P2PEvent, target?: string): boolean {
    if (this.closed) return false;
    if(this.serverConnection)return this.serverSend({type:'dungeon-event',event,target});
    if (this.host) return this.relayDungeon(this.selfId,event,target);
    const conn=this.connections.get('host');
    if (!conn?.open) return false;
    conn.send({type:'dungeon-event',event,target});return true;
  }
  peer: Peer | null = null;
  connections = new Map<string, DataConnection>();
  world: World | null = null;
  selfId = "local";
  code = "";
  host = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastRevision = -1;
  private closed = false;
  private hostingCandidate:Peer|null=null;
  private reconnecting=false;
  private peerReservations=new Map<string,{player:World['players'][string];expires:number}>();
  private serverSocket: WebSocket | null = null;
  private serverConnection:DedicatedConnection|null=null;
  private resumeToken?:string;
  private serverSend(packet: unknown) {
    if(this.serverConnection)return this.serverConnection.send(packet);
    if(this.serverSocket?.readyState!==WebSocket.OPEN)return false;
    this.serverSocket.send(JSON.stringify(packet));return true;
  }
  private serverUrl() {return import.meta.env.VITE_ONLINE_SERVER_URL as string | undefined;}
  private async connectServer(packet:ServerHello,onSetup?:(setup:RpgAdventureSetup)=>void,reconnecting=false){
    this.status(reconnecting?'部屋に再接続しています。':'サーバーを起動しています。初回は最大3分お待ちください。');
    const connection=new DedicatedConnection(d=>{
      if(this.sessionEnd.receive(d))return true;
      if(d.type==='connected'){this.selfId=d.id;this.code=d.code;this.host=d.host;}
      if(d.type==='error'){this.status(d.message);return false;}
      if(this.receiveDungeon(d))return false;
      if(d.type==='lobby'){const setup=normalizeRpgAdventureSetup(d.setup);if(!setup)throw new Error('冒険設定を受け取れませんでした。');onSetup?.(setup);this.status('');return true;}
      if(d.type==='init'&&d.world){
        this.resumeToken=typeof d.resumeToken==='string'?d.resumeToken:undefined;
        this.world=unpackWorld(d.world);this.emit();this.status('');return true;
      }
      if(this.receiveResidentAssets(d)||this.receiveHeroAssets(d))return false;
      this.receiveSharedWorld(d,()=>this.serverSend({type:'state-resync'}));return false;
    },()=>{
      if(this.closed)return;
      const token=this.resumeToken;
      if(token&&this.code){
        void this.connectServer({name:packet.name,code:this.code,resumeToken:token},undefined,true).catch(()=>{
          if(this.closed)return;
          this.world=null;this.resumeToken=undefined;this.status('通信が切断されました。部屋に入り直してください。');
        });
      }else{this.world=null;this.status('通信が切断されました。部屋に入り直してください。');}
    });
    this.serverConnection=connection;await connection.open('online',{...packet,machineryProtocol:1,sandboxDeltas:1},reconnecting?20_000:180_000);
  }
  private residentAssets=new Map<string,ResidentAssets>();
  private receiveResidentAssets(packet:{type?:string;residents?:ResidentAssets[]}){if(packet.type!=='resident-assets'||!Array.isArray(packet.residents))return false;for(const r of packet.residents){this.residentAssets.set(r.id,r);const target=this.world?.town?.customResidents?.find(x=>x.id===r.id);if(target)Object.assign(target,r);}this.emit();return true;}
  private heroAssets = new Map<string,World['players'][string]['hero']>();
  private receiveHeroAssets(packet: {type?:string;heroes?:Record<string,World['players'][string]['hero']|null>}){if(packet.type!=='heroes'||!packet.heroes)return false;for(const [id,hero]of Object.entries(packet.heroes)){this.heroAssets.set(id,hero||undefined);if(this.world?.players[id])this.world.players[id].hero=hero||undefined;}this.emit();return true;}
  private restoreHeroAssets(state:Omit<World,'tiles'>){for(const r of state.town?.customResidents||[]){const old=this.world?.town?.customResidents?.find(x=>x.id===r.id),assets=this.residentAssets.get(r.id)||old;if(assets){r.portrait=assets.portrait;r.hero=assets.hero;}}for(const [id,p]of Object.entries(state.players)){if('hero' in p)this.heroAssets.set(id,p.hero);else p.hero=this.heroAssets.has(id)?this.heroAssets.get(id):this.world?.players[id]?.hero;}for(const id of this.heroAssets.keys())if(!state.players[id])this.heroAssets.delete(id);}
  private receiveSharedWorld(raw:unknown,resync:()=>void){
    const current=this.world;
    if(!current||!raw||typeof raw!=='object')return;
    const packet=raw as DeltaPacket|{type:'state';state:SharedWorldState};
    if(packet.type!=='state'&&packet.type!=='state-delta')return;
    const state=packet.type==='state-delta'?applyWorldDelta(current,packet):packet.state;
    if(!state){resync();return;}
    if(state.revision<current.revision)return;
    this.restoreHeroAssets(state);
    this.world={...state,tiles:current.tiles};
    this.emit();
  }
  private commands = new Map<string, { time: number; count: number }>();
  constructor(
    private update: (world: World) => void,
    private notifyStatus: (message: string) => void,
  ) {}
  private status(message: string) {
    if (!this.closed) this.notifyStatus(message);
  }
  practice(name: string, setup?: RpgAdventureSetup, timeLimitMinutes = 30, gameMode: World["gameMode"] = "COOP", creative=false) {
    this.host = true;
    this.world = createWorld(
      crypto.getRandomValues(new Uint32Array(1))[0],
      setup,
      creative?0:timeLimitMinutes,
      Date.now(),
      creative?'COOP':gameMode,
    );
    addPlayer(this.world, this.selfId, name);
    if(creative){
      openCreativeWorld(this.world,this.world.players[this.selfId]);
      applyAction(this.world,this.selfId,{type:'rpg-start'});
    }
    this.timer = setInterval(() => {
      if (!this.world) return;
      advanceWorld(this.world);
      if (this.world.revision !== this.lastRevision) {this.lastRevision=this.world.revision;this.emit();}
    }, 250);
    this.emit();
  }
  resume(world:World,selfId:string) {
    if(!world.players[selfId]||world.ended)throw new Error('保存データを読み込めませんでした。');
    this.host=true;this.selfId=selfId;this.world=structuredClone(world);
    this.timer=setInterval(()=>{if(!this.world)return;advanceWorld(this.world);if(this.world.revision!==this.lastRevision){this.lastRevision=this.world.revision;this.emit();}},250);
    this.emit();
  }
  private emit() {
    if (this.world && !this.closed) this.update(structuredClone(this.world));
  }
  private async open(id?: string,waitMs=15_000,silent=false): Promise<Peer> {
    const env = import.meta.env;
    const options: PeerOptions = env.VITE_RPG_PEER_HOST
      ? {
          host: env.VITE_RPG_PEER_HOST,
          port: Number(env.VITE_RPG_PEER_PORT || 443),
          path: env.VITE_RPG_PEER_PATH || "/",
          secure: env.VITE_RPG_PEER_SECURE !== "false",
        }
      : {};
    const ice=env.VITE_RPG_ICE_SERVERS||env.VITE_KART_ICE_SERVERS;if(ice){const iceServers=JSON.parse(ice);if(!Array.isArray(iceServers))throw new Error('ICE server configuration is invalid.');options.config={iceServers};}
    const peer = id ? new Peer(id, options) : new Peer(options);
    if(silent)this.hostingCandidate=peer;
    else this.peer=peer;
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () =>
          reject(
            new Error(
              "接続がタイムアウトしました。ネットワークを確認してください。",
            ),
          ),
        waitMs,
      );
      peer.once("open", () => {
        clearTimeout(timeout);
        resolve();
      });
      peer.once("error", (err) => {
        clearTimeout(timeout);
        reject(new Error(`接続できませんでした（${err.type}）。`));
      });
    }).catch(error=>{peer.destroy();throw error;}).finally(()=>{
      if(this.hostingCandidate===peer)this.hostingCandidate=null;
    });
    if (this.closed) {
      peer.destroy();
      throw new Error("接続を終了しました。");
    }
    peer.on('error',err=>{
      if(!this.reconnecting)this.status(`通信エラー（${err.type}）。部屋に入り直してください。`);
    });
    peer.on("disconnected", () =>
      this.status(
        "接続サービスから切断されました。新しい参加者を受け入れられません。",
      ),
    );
    return peer;
  }
  async create(name: string, setup?: RpgAdventureSetup, timeLimitMinutes = 30, gameMode: World["gameMode"] = "COOP") {
    if(this.transport==='server'){await this.connectServer({create:true,name,setup:normalizeRpgAdventureSetup(setup)||normalizeRpgAdventureSetup({}),minutes:timeLimitMinutes,gameMode});return;}
    this.host = true;
    this.code = createHostRoomCode();
    const peer = await this.open(`learning-rogue-rpg-${this.code}`);
    this.selfId = peer.id;
    this.world = createWorld(
      crypto.getRandomValues(new Uint32Array(1))[0],
      setup,
      timeLimitMinutes,
      Date.now(),
      gameMode,
    );
    this.world.started = false;
    addPlayer(this.world, this.selfId, name);
    this.world.hostId=this.selfId;
    this.listenAsPeerHost(peer);
  }

  private listenAsPeerHost(peer:Peer) {
    const sent=new Map<string,number>();
    const deltas=new WorldDeltaWriter();
    const init=(conn:DataConnection)=>{
      const world=this.world;
      if(!world)return;
      conn.send({type:'init',world:{...world,tiles:world.tiles.join(',')}});
      sent.set(conn.peer,world.revision);
    };
    peer.on("connection", (conn) => {
      // Bound even unauthenticated/pending channels.
      if (this.connections.size >= 39) {
        conn.on("open", () => {
          conn.send({ type: "error", message: "部屋は満員です（最大40人）。" });
          setTimeout(() => conn.close(), 300);
        });
        return;
      }
      this.connections.set(conn.peer, conn);
      let admitted=false, left=false;
      let handshake = setTimeout(() => {
        if (!admitted) conn.close();
      }, 10000);
      const admit=()=>{
        clearTimeout(handshake);
        admitted=true;
        init(conn);
        this.emit();
      };
      conn.on("data", (raw: unknown) => {
        if (!raw || typeof raw !== "object" || !this.world || this.closed || left) return;
        const dungeonPacket = raw as {type?: string;event?: P2PEvent;target?: string};
        if (dungeonPacket.type === 'dungeon-event') {
          if (admitted&&dungeonPacket.event) this.relayDungeon(conn.peer,dungeonPacket.event,dungeonPacket.target);
          return;
        }
        const data = raw as {
          type?: string;
          name?: string;
          action?: Action;
          version?: number;
          admission?: string;
          profile?: unknown;
          seed?:number;
        };
        if ((data.type === "hello"||data.type==='resume') && data.version !== RPG_PROTOCOL_VERSION) {
          conn.send({
            type: "error",
            message: "同じバージョンのRPGオンラインで参加してください。",
          });
          return;
        }
        if(data.type==='resume'&&!admitted){
          const saved=this.peerReservations.get(conn.peer);
          if(data.seed!==this.world.seed||this.world.ended||(!this.world.players[conn.peer]&&(!saved||saved.expires<Date.now()||Object.keys(this.world.players).length>=40))){
            conn.send({type:'error',message:'参加者の状態を復元できませんでした。'});
            return;
          }
          if(!this.world.players[conn.peer]&&saved){
            this.world.players[conn.peer]=saved.player;
            this.world.revision++;
          }
          this.peerReservations.delete(conn.peer);
          admit();
          return;
        }
        if(data.type==='leave'&&admitted){
          left=true;
          this.peerReservations.delete(conn.peer);
          removePlayer(this.world,conn.peer);
          this.emit();
          return;
        }
        if (
          data.type === "hello" &&
          typeof data.name === "string" &&
          !this.world.players[conn.peer] &&
          !this.pendingInviteNames.has(conn.peer)
        ) {
          clearTimeout(handshake);
          if (this.world.ended) {
            conn.send({ type: "error", message: "冒険は終了しています。" });
            setTimeout(() => conn.close(), 300);
            return;
          }
          const name = data.name.trim().slice(0, 16) || "冒険者";
          if (data.admission === "prepare") {
            if (!this.world.setup) {
              conn.send({
                type: "error",
                message: "ホストの冒険設定を受け取れませんでした。",
              });
              return;
            }
            this.pendingInviteNames.set(conn.peer, name);
            handshake = setTimeout(() => {
              if (!admitted) conn.close();
            }, 5 * 60 * 1000);
            conn.send({
              type: "lobby",
              setup: this.world.setup,
            });
            return;
          }
          if (!addPlayer(this.world, conn.peer, data.name)) {
            conn.send({ type: "error", message: "部屋が満員です。" });
            return;
          }
          admit();
        } else if (
          data.type === "enter" &&
          this.pendingInviteNames.has(conn.peer) &&
          isNativeProfile(data.profile)
        ) {
          clearTimeout(handshake);
          if (this.world.ended) {
            this.pendingInviteNames.delete(conn.peer);
            conn.send({ type: "error", message: "冒険は終了しています。" });
            setTimeout(() => conn.close(), 300);
            return;
          }
          const name = this.pendingInviteNames.get(conn.peer)!;
          if (!addPlayer(this.world, conn.peer, name)) {
            conn.send({ type: "error", message: "部屋が満員です。" });
            return;
          }
          this.pendingInviteNames.delete(conn.peer);
          const participant = this.world.players[conn.peer];
          participant.profile = data.profile;
          participant.hp = data.profile.hp;
          participant.maxHp = data.profile.maxHp;
          participant.gold = data.profile.gold;
          admit();
        } else if(data.type==='state-resync'&&admitted&&this.world.players[conn.peer]) {
          sent.delete(conn.peer);
        } else if (
          data.type === "action" &&
          data.action &&
          admitted &&
          this.world.players[conn.peer]
        ) {
          const now = Date.now(),
            rate = this.commands.get(conn.peer);
          if (!rate || now - rate.time > 1000)
            this.commands.set(conn.peer, { time: now, count: 1 });
          else if (++rate.count > 24) return;
          if (applyAction(this.world, conn.peer, data.action)) this.emit();
        }
      });
      const drop = () => {
        clearTimeout(handshake);
        if(this.connections.get(conn.peer)!==conn)return;
        this.pendingInviteNames.delete(conn.peer);
        this.connections.delete(conn.peer);
        sent.delete(conn.peer);
        this.commands.delete(conn.peer);
        if (this.world&&admitted&&!left&&!this.closed) {
          const player=this.world.players[conn.peer];
          if(player&&this.world.started&&!this.world.ended){
            const resume=structuredClone(player);
            delete resume.duelId;delete resume.dungeonId;resume.team=null;
            this.peerReservations.set(conn.peer,{player:resume,expires:Date.now()+PEER_REJOIN_MS});
          }
          removePlayer(this.world, conn.peer);
          this.emit();
        }
      };
      conn.on("close", drop);
      conn.on("error", drop);
    });
    const residentCache=new Map<string,CreatedResident>();
    const heroCache=new Map<string,World['players'][string]['hero']>();
    this.timer = setInterval(() => {
      if (!this.world) return;
      for(const [id,entry] of this.peerReservations)if(entry.expires<Date.now())this.peerReservations.delete(id);
      advanceWorld(this.world);
      const revision=this.world.revision;
      if(revision===this.lastRevision&&[...this.connections.values()].every(conn=>!conn.open||!this.world?.players[conn.peer]||sent.get(conn.peer)===revision))return;
      this.lastRevision = this.world.revision;
      this.emit();
      const { tiles, ...rest } = this.world;
      const heroes:Record<string,World['players'][string]['hero']|null>={};
      for(const p of Object.values(this.world.players))if(heroCache.get(p.id)!==p.hero){heroes[p.id]=p.hero||null;heroCache.set(p.id,p.hero);}
      for(const id of heroCache.keys())if(!this.world.players[id])heroCache.delete(id);
      const residents=changedResidentAssets(this.world,residentCache);
      const state=stripResidentAssets({...rest,players:Object.fromEntries(Object.entries(rest.players).map(([id,p])=>{const {hero,...player}=p;return [id,player];}))});
      const delta=deltas.capture(state);
      for(const conn of this.connections.values()){
        if(!conn.open||!this.world.players[conn.peer])continue;
        if(residents.length)conn.send({type:'resident-assets',residents});
        if(Object.keys(heroes).length)conn.send({type:'heroes',heroes});
        if(conn.dataChannel.bufferedAmount>131072||sent.get(conn.peer)===revision)continue;
        conn.send(delta&&sent.get(conn.peer)===delta.base?delta:{type:'state',state});
        sent.set(conn.peer,revision);
      }
    }, 250);
    this.emit();
  }
  async join(code: string, name: string) {
    const address=roomAddress(code,this.transport);this.transport=address.transport;this.code=address.code;
    if (!/^[A-Z0-9]{6}$/.test(this.code))
      throw new Error("6桁の数字の招待コードを入力してください。");
    if(this.transport==='server'){await this.connectServer({code:this.code,name});return;}
    await this.connectPeerGuest(name);
  }

  private pendingInviteNames = new Map<string, string>();
  async prepareInviteJoin(
    code: string,
    name: string,
    onSetup: (setup: RpgAdventureSetup) => void,
  ) {
    const address=roomAddress(code,this.transport);this.transport=address.transport;this.code=address.code;
    if (!/^[A-Z0-9]{6}$/.test(this.code))
      throw new Error("6桁の数字の招待コードを入力してください。");
    if(this.transport==='server'){await this.connectServer({code:this.code,name,prepare:true},onSetup);return;}
    await this.connectPeerGuest(name,onSetup);
  }

  private async connectPeerGuest(name:string,onSetup?:(setup:RpgAdventureSetup)=>void,resume=false) {
    const peer=resume?this.peer:await this.open();
    if(!peer||peer.destroyed||peer.disconnected||this.closed)throw new Error('接続サービスから切断されました。');
    if(!resume)this.selfId=peer.id;
    const target='learning-rogue-rpg-'+this.code;
    const conn=peer.connect(target,{reliable:true});
    if(!conn)throw new Error('部屋への接続に失敗しました。');
    this.connections.set('host',conn);
    await new Promise<void>((resolve,reject)=>{
      let settled=false,active=false;
      const finish=(error?:Error)=>{
        clearTimeout(timer);
        if(settled)return;
        settled=true;
        if(error)reject(error);else resolve();
      };
      const timer=setTimeout(()=>{
        finish(new Error('部屋が見つからないか、接続できません。ホストとコードを確認してください。'));
        conn.close();
      },resume?2300:15_000);
      const lost=()=>{
        if(this.connections.get('host')!==conn)return;
        this.connections.delete('host');
        finish(new Error('ホストとの接続が途切れました。'));
        if(this.closed||this.host)return;
        if(active&&this.world&&!this.world.ended)void this.recoverPeerHost();
        else if(!resume)this.status('ホストとの接続が途切れました。');
      };
      conn.on('open',()=>conn.send(resume
        ? {type:'resume',version:RPG_PROTOCOL_VERSION,seed:this.world?.seed}
        : {type:'hello',version:RPG_PROTOCOL_VERSION,name:name.slice(0,16),...(onSetup?{admission:'prepare'}:{})}));
      conn.on('data',(raw:unknown)=>{
        if(!raw||typeof raw!=='object'||this.connections.get('host')!==conn)return;
        if(this.sessionEnd.receive(raw)||this.receiveDungeon(raw))return;
        const data=raw as {type:string;world?:WireWorld;setup?:unknown;message?:string};
        if(data.type==='error'){
          const error=new Error(data.message??'通信エラー');
          finish(error);
          if(!resume)this.status(error.message);
          conn.close();
          return;
        }
        if(data.type==='lobby'&&onSetup){
          const setup=normalizeRpgAdventureSetup(data.setup);
          if(!setup){finish(new Error('ホストの冒険設定を読み込めませんでした。'));return;}
          onSetup(setup);finish();return;
        }
        if(data.type==='init'){
          if(!data.world?.nativeMode||!data.world.players[this.selfId]||resume&&data.world.seed!==this.world?.seed){
            finish(new Error('冒険の状態を復元できませんでした。'));conn.close();return;
          }
          this.world=unpackWorld(data.world);
          active=true;
          this.emit();
          if(resume)this.status('');
          finish();
          return;
        }
        if(!active)return;
        if(this.receiveResidentAssets(data)||this.receiveHeroAssets(data))return;
        this.receiveSharedWorld(data,()=>conn.send({type:'state-resync'}));
      });
      conn.on('close',lost);
      conn.on('error',lost);
    });
  }

  private async recoverPeerHost() {
    if(this.closed||this.host||this.reconnecting||!this.world)return;
    const snapshot=this.world, former=snapshot.hostId??'learning-rogue-rpg-'+this.code;
    const candidates=Object.values(snapshot.players).filter(player=>player.id!==former&&!player.spectator)
      .map(player=>player.id).sort();
    const rank=candidates.indexOf(this.selfId), started=Date.now();
    this.reconnecting=true;
    this.status('接続を復旧しています。');
    try {
      while(!this.closed&&Date.now()-started<35_000){
        if(rank>=0&&Date.now()-started>=1100+rank*180){
          // The signaling service grants the public room ID to just one live peer.
          const replacement=await this.open('learning-rogue-rpg-'+this.code,2400,true).catch(()=>null);
          if(replacement&&!this.closed){
            const previous=this.peer;
            this.peer=replacement;
            this.host=true;
            removePlayer(snapshot,former);
            snapshot.hostId=this.selfId;
            snapshot.revision++;
            this.world=snapshot;
            previous?.destroy();
            this.listenAsPeerHost(replacement);
            this.status('');
            return;
          }
          replacement?.destroy();
        }
        try {
          if(this.peer?.disconnected&&!this.peer.destroyed){
            await new Promise<void>(resolve=>{
              const old=this.peer!;
              const ready=()=>{clearTimeout(timeout);old.off('open',ready);resolve();};
              const timeout=setTimeout(ready,650);
              old.on('open',ready);old.reconnect();
            });
          }
          await this.connectPeerGuest('',undefined,true);
          return;
        } catch {
          if(!this.closed)await new Promise(resolve=>setTimeout(resolve,320));
        }
      }
      if(!this.closed)this.status('部屋に再接続できませんでした。招待から入り直してください。');
    } finally {this.reconnecting=false;}
  }
  enterWorld(profile: NativeProfile) {
    if (this.closed) return;
    if(this.serverConnection){this.serverSend({type:'enter',profile});return;}
    this.connections.get("host")?.send({ type: "enter", profile });
  }
  setSpectator(enabled: boolean) {
    if (this.closed || !this.host || !this.world || this.world.started) return;
    if (this.serverConnection) { this.serverSend({ type: 'spectator', enabled }); return; }
    if (setSpectator(this.world, this.selfId, enabled)) this.emit();
  }
  send(action: Action) {
    if (this.closed) return;
    if(this.serverConnection){this.serverSend({type:'action',action});return;}
    if (this.host && this.world) {
      const revision=this.world.revision;
      applyAction(this.world, this.selfId, action);
      if(this.world.revision!==revision)this.emit();
    } else this.connections.get("host")?.send({ type: "action", action });
  }
  close(results = true) {
    if (this.closed) return;
    if (results && this.host && this.code && this.sessionEnd.end(this.world ? sessionResult('rpg', this.world) : null, this.serverConnection, packet => sendFinalResult(this.connections.values(), packet, true))) return;
    this.closed = true;
    const host=this.connections.get('host');
    if(!this.host&&host?.open)host.send({type:'leave'});
    this.hostingCandidate?.destroy();this.hostingCandidate=null;
    this.serverConnection?.close();
    this.serverSocket?.close();this.serverSocket=null;
    if (this.timer) clearInterval(this.timer);
    this.connections.forEach((c) => c.close());
    this.connections.clear();
    this.pendingInviteNames.clear();
    this.peerReservations.clear();
    this.peer?.destroy();
    this.world = null;
    this.heroAssets.clear();this.residentAssets.clear();
  }
}
