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

// Arcade result presentation requires the authoritative outcome payload.
const RPG_PROTOCOL_VERSION = 15;
// Avoid BinaryPack's recursive encoding of 16,896 individual terrain cells.
// Retain binary transport so PeerJS can still chunk large room snapshots.
type WireWorld = Omit<World, "tiles"> & { tiles: World["tiles"] | string };
function unpackWorld(world: WireWorld): World {
  return {...world,tiles:typeof world.tiles === "string" ? world.tiles.split(",") as World["tiles"] : world.tiles};
}

function isNativeProfile(value: unknown): value is NativeProfile {
  if (!value || typeof value !== "object") return false;
  return validProfile(value as NativeProfile);
}

/** A single room owner validates commands and broadcasts authoritative state. */
export class RpgRoom {
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
    if(this.serverSocket)return this.serverSend({type:'dungeon-event',event,target});
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
  private serverSocket: WebSocket | null = null;
  private serverSend(packet: unknown) {
    if(this.serverSocket?.readyState!==WebSocket.OPEN)return false;
    this.serverSocket.send(JSON.stringify(packet));return true;
  }
  private serverUrl() {return import.meta.env.VITE_ONLINE_SERVER_URL as string | undefined;}
  private async connectServer(packet: object, onSetup?: (setup:RpgAdventureSetup)=>void) {
    const base=this.serverUrl()!;
    const url=new URL(base);url.protocol=url.protocol==='http:'?'ws:':url.protocol==='https:'?'wss:':url.protocol;url.pathname='/online';url.search='';url.hash='';
    this.status('専用サーバーに接続しています。初回は約1分かかる場合があります。');
    const health=new URL(url);health.protocol=url.protocol==='ws:'?'http:':'https:';health.pathname='/health';
    // An HTTP request wakes Render Free before attempting the WebSocket upgrade.
    try {await fetch(health,{mode:'no-cors',signal:AbortSignal.timeout(90000)});}catch{throw new Error('専用サーバーを起動できませんでした。少し待って入り直してください。');}
    if(this.closed)throw new Error('接続を終了しました。');
    const socket=new WebSocket(url);this.serverSocket=socket;
    await new Promise<void>((resolve,reject)=>{
      let settled=false;
      const timeout=setTimeout(()=>finish(new Error('専用サーバーに接続できませんでした。')),90000);
      const finish=(error?:Error)=>{if(settled)return;settled=true;clearTimeout(timeout);if(error){socket.close();reject(error);}else{this.status('');resolve();}};
      socket.onopen=()=>this.serverSend({type:'connect',protocol:1,...packet});
      socket.onmessage=e=>{
        let d:any;try{d=JSON.parse(e.data);}catch{return;}
        if(this.closed)return;
        if(d.type==='connected'){this.selfId=d.id;this.code=d.code;this.host=d.host;}
        if(d.type==='error'){this.status(d.message);if(!settled)finish(new Error(d.message));return;}
        if(this.receiveDungeon(d))return;
        if(d.type==='lobby'){const setup=normalizeRpgAdventureSetup(d.setup);if(!setup){finish(new Error('冒険設定を受け取れませんでした。'));return;}onSetup?.(setup);finish();}
        if(d.type==='init' && d.world){this.world=unpackWorld(d.world);this.emit();finish();}
        if(d.type==='state' && d.state && this.world){this.world={...d.state,tiles:this.world.tiles};this.emit();}
      };
      socket.onerror=()=>finish(new Error('専用サーバーへの接続に失敗しました。'));
      socket.onclose=()=>{finish(new Error('専用サーバーとの接続が終了しました。'));if(!this.closed){this.world=null;this.status('通信が切断されました。部屋に入り直してください。');}if(this.timer)clearInterval(this.timer);};
    });
    this.timer=setInterval(()=>this.serverSend({type:'ping',at:Date.now()}),20000);
  }
  private commands = new Map<string, { time: number; count: number }>();
  constructor(
    private update: (world: World) => void,
    private notifyStatus: (message: string) => void,
  ) {}
  private status(message: string) {
    if (!this.closed) this.notifyStatus(message);
  }
  practice(name: string, setup?: RpgAdventureSetup, timeLimitMinutes = 30, gameMode: World["gameMode"] = "COOP") {
    this.host = true;
    this.world = createWorld(
      crypto.getRandomValues(new Uint32Array(1))[0],
      setup,
      timeLimitMinutes,
      Date.now(),
      gameMode,
    );
    addPlayer(this.world, this.selfId, name);
    this.timer = setInterval(() => {
      if (!this.world) return;
      advanceWorld(this.world);
      if (this.world.revision !== this.lastRevision) {this.lastRevision=this.world.revision;this.emit();}
    }, 250);
    this.emit();
  }
  private emit() {
    if (this.world && !this.closed) this.update(structuredClone(this.world));
  }
  private async open(id?: string): Promise<Peer> {
    const env = import.meta.env;
    const options: PeerOptions = env.VITE_RPG_PEER_HOST
      ? {
          host: env.VITE_RPG_PEER_HOST,
          port: Number(env.VITE_RPG_PEER_PORT || 443),
          path: env.VITE_RPG_PEER_PATH || "/",
          secure: env.VITE_RPG_PEER_SECURE !== "false",
        }
      : {};
    const peer = id ? new Peer(id, options) : new Peer(options);
    this.peer = peer;
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () =>
          reject(
            new Error(
              "接続がタイムアウトしました。ネットワークを確認してください。",
            ),
          ),
        15000,
      );
      peer.once("open", () => {
        clearTimeout(timeout);
        resolve();
      });
      peer.once("error", (err) => {
        clearTimeout(timeout);
        reject(new Error(`接続できませんでした（${err.type}）。`));
      });
    });
    if (this.closed) {
      peer.destroy();
      throw new Error("接続を終了しました。");
    }
    peer.on("error", (err) =>
      this.status(`通信エラー（${err.type}）。部屋に入り直してください。`),
    );
    peer.on("disconnected", () =>
      this.status(
        "接続サービスから切断されました。新しい参加者を受け入れられません。",
      ),
    );
    return peer;
  }
  async create(name: string, setup?: RpgAdventureSetup, timeLimitMinutes = 30, gameMode: World["gameMode"] = "COOP") {
    if(this.serverUrl()){await this.connectServer({create:true,name,setup:normalizeRpgAdventureSetup(setup)||normalizeRpgAdventureSetup({}),minutes:timeLimitMinutes,gameMode});return;}
    this.host = true;
    this.code = Array.from(
      crypto.getRandomValues(new Uint8Array(6)),
      (n) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[n % 31],
    ).join("");
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
      let handshake = setTimeout(() => {
        if (!this.world?.players[conn.peer]) conn.close();
      }, 10000);
      conn.on("data", (raw: unknown) => {
        if (!raw || typeof raw !== "object" || !this.world) return;
        const dungeonPacket = raw as {type?: string;event?: P2PEvent;target?: string};
        if (dungeonPacket.type === 'dungeon-event') {
          if (dungeonPacket.event) this.relayDungeon(conn.peer,dungeonPacket.event,dungeonPacket.target);
          return;
        }
        const data = raw as {
          type?: string;
          name?: string;
          action?: Action;
          version?: number;
          admission?: string;
          profile?: unknown;
        };
        if (data.type === "hello" && data.version !== RPG_PROTOCOL_VERSION) {
          conn.send({
            type: "error",
            message: "同じバージョンのRPGオンラインで参加してください。",
          });
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
              if (!this.world?.players[conn.peer]) conn.close();
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
          conn.send({ type: "init", world: {...this.world,tiles:this.world.tiles.join(",")} });
          this.emit();
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
          conn.send({ type: "init", world: {...this.world,tiles:this.world.tiles.join(",")} });
          this.emit();
        } else if (
          data.type === "action" &&
          data.action &&
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
        this.pendingInviteNames.delete(conn.peer);
        this.connections.delete(conn.peer);
        this.commands.delete(conn.peer);
        if (this.world) {
          removePlayer(this.world, conn.peer);
          this.emit();
        }
      };
      conn.on("close", drop);
      conn.on("error", drop);
    });
    this.timer = setInterval(() => {
      if (!this.world) return;
      advanceWorld(this.world);
      if (this.world.revision === this.lastRevision) return;
      this.lastRevision = this.world.revision;
      this.emit();
      const { tiles, ...state } = this.world;
      for (const conn of this.connections.values())
        if (conn.open && this.world.players[conn.peer])
          conn.send({ type: "state", state });
    }, 250);
    this.emit();
  }
  async join(code: string, name: string) {
    this.code = code.trim().toUpperCase();
    if (!/^[A-Z2-9]{6}$/.test(this.code))
      throw new Error("6文字のルームコードを入力してください。");
    if(this.serverUrl()){await this.connectServer({code:this.code,name});return;}
    const peer = await this.open();
    this.selfId = peer.id;
    const conn = peer.connect(`learning-rogue-rpg-${this.code}`, {
      reliable: true,
    });
    this.connections.set("host", conn);
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () =>
          reject(
            new Error(
              "部屋が見つからないか、接続できません。ホストとコードを確認してください。",
            ),
          ),
        15000,
      );
      conn.on("open", () =>
        conn.send({
          type: "hello",
          version: RPG_PROTOCOL_VERSION,
          name: name.slice(0, 16),
        }),
      );
      conn.on("data", (raw: unknown) => {
        if (!raw || typeof raw !== "object") return;
        if (this.receiveDungeon(raw)) return;
        const data = raw as {
          type: string;
          world?: WireWorld;
          state?: Omit<World, "tiles">;
          message?: string;
        };
        if (data.type === "error") {
          clearTimeout(timeout);
          reject(new Error(data.message));
          this.status(data.message || "接続エラー");
          return;
        }
        if (data.type === "init" && data.world) {
          if (!data.world.nativeMode) {
            clearTimeout(timeout);
            reject(
              new Error("同じバージョンのRPGオンラインで参加してください。"),
            );
            return;
          }
          clearTimeout(timeout);
          this.world = unpackWorld(data.world);
          this.emit();
          resolve();
        }
        if (data.type === "state" && data.state && this.world) {
          this.world = { ...data.state, tiles: this.world.tiles };
          this.emit();
        }
      });
      conn.on("close", () => {
        clearTimeout(timeout);
        reject(new Error("ホストとの接続が終了しました。"));
        this.status("ホストとの接続が終了しました。この部屋の冒険は終了です。");
        this.world = null;
      });
      conn.on("error", () => {
        clearTimeout(timeout);
        reject(new Error("部屋への接続に失敗しました。"));
        this.status("ホストとの通信が途切れました。入り直してください。");
        this.world = null;
      });
    });
  }
  private pendingInviteNames = new Map<string, string>();
  async prepareInviteJoin(
    code: string,
    name: string,
    onSetup: (setup: RpgAdventureSetup) => void,
  ) {
    this.code = code.trim().toUpperCase();
    if (!/^[A-Z2-9]{6}$/.test(this.code))
      throw new Error("6文字のルームコードを入力してください。");
    if(this.serverUrl()){await this.connectServer({code:this.code,name,prepare:true},onSetup);return;}
    const peer = await this.open();
    this.selfId = peer.id;
    const conn = peer.connect(`learning-rogue-rpg-${this.code}`, {
      reliable: true,
    });
    this.connections.set("host", conn);
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(
          new Error(
            "部屋が見つからないか、接続できません。ホストとコードを確認してください。",
          ),
        );
      }, 15000);
      const finish = (error?: Error) => {
        clearTimeout(timeout);
        if (settled) return;
        settled = true;
        if (error) reject(error);
        else resolve();
      };
      conn.on("open", () =>
        conn.send({
          type: "hello",
          version: RPG_PROTOCOL_VERSION,
          admission: "prepare",
          name: name.trim().slice(0, 16),
        }),
      );
      conn.on("data", (raw: unknown) => {
        if (!raw || typeof raw !== "object") return;
        if (this.receiveDungeon(raw)) return;
        const data = raw as {
          type: string;
          world?: WireWorld;
          state?: Omit<World, "tiles">;
          setup?: unknown;
          message?: string;
        };
        if (data.type === "error") {
          const error = new Error(data.message || "接続エラー");
          finish(error);
          this.status(error.message);
          return;
        }
        if (data.type === "lobby") {
          const setup = normalizeRpgAdventureSetup(data.setup);
          if (!setup) {
            finish(new Error("ホストの冒険設定を読み込めませんでした。"));
            return;
          }
          onSetup(setup);
          finish();
        }
        if (data.type === "init" && data.world) {
          if (!data.world.nativeMode) {
            finish(new Error("同じバージョンのRPGオンラインで参加してください。"));
            return;
          }
          this.world = unpackWorld(data.world);
          this.emit();
          finish();
        }
        if (data.type === "state" && data.state && this.world) {
          this.world = { ...data.state, tiles: this.world.tiles };
          this.emit();
        }
      });
      conn.on("close", () => {
        finish(new Error("ホストとの接続が終了しました。"));
        this.status("ホストとの接続が終了しました。この部屋の冒険は終了です。");
        this.world = null;
      });
      conn.on("error", () => {
        finish(new Error("部屋への接続に失敗しました。"));
        this.status("ホストとの通信が途切れました。入り直してください。");
        this.world = null;
      });
    });
  }
  enterWorld(profile: NativeProfile) {
    if (this.closed) return;
    if(this.serverSocket){this.serverSend({type:'enter',profile});return;}
    this.connections.get("host")?.send({ type: "enter", profile });
  }
  setSpectator(enabled: boolean) {
    if (this.closed || !this.host || !this.world || this.world.started) return;
    if (this.serverSocket) { this.serverSend({ type: 'spectator', enabled }); return; }
    if (setSpectator(this.world, this.selfId, enabled)) this.emit();
  }
  send(action: Action) {
    if (this.closed) return;
    if(this.serverSocket){this.serverSend({type:'action',action});return;}
    if (this.host && this.world) {
      const revision=this.world.revision;
      applyAction(this.world, this.selfId, action);
      if(this.world.revision!==revision)this.emit();
    } else this.connections.get("host")?.send({ type: "action", action });
  }
  close() {
    this.closed = true;
    this.serverSocket?.close();this.serverSocket=null;
    if (this.timer) clearInterval(this.timer);
    this.connections.forEach((c) => c.close());
    this.connections.clear();
    this.pendingInviteNames.clear();
    this.peer?.destroy();
    this.world = null;
  }
}
