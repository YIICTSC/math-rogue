import Peer, { type DataConnection, type PeerOptions } from "peerjs";
import {
  addPlayer,
  applyAction,
  createWorld,
  removePlayer,
  type Action,
  type World,
} from "./engine";

/** A single room owner validates commands and broadcasts authoritative state. */
export class RpgRoom {
  peer: Peer | null = null;
  connections = new Map<string, DataConnection>();
  world: World | null = null;
  selfId = "local";
  code = "";
  host = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastRevision = -1;
  private closed = false;
  private commands = new Map<string, { time: number; count: number }>();
  constructor(
    private update: (world: World) => void,
    private notifyStatus: (message: string) => void,
  ) {}
  private status(message: string) {
    if (!this.closed) this.notifyStatus(message);
  }
  practice(name: string, subject: World["subject"]) {
    this.host = true;
    this.world = createWorld(
      crypto.getRandomValues(new Uint32Array(1))[0],
      subject,
    );
    addPlayer(this.world, this.selfId, name);
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
  async create(name: string, subject: World["subject"]) {
    this.host = true;
    this.code = Array.from(
      crypto.getRandomValues(new Uint8Array(6)),
      (n) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[n % 31],
    ).join("");
    const peer = await this.open(`learning-rogue-rpg-${this.code}`);
    this.selfId = peer.id;
    this.world = createWorld(
      crypto.getRandomValues(new Uint32Array(1))[0],
      subject,
    );
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
      const handshake = setTimeout(() => {
        if (!this.world?.players[conn.peer]) conn.close();
      }, 10000);
      conn.on("data", (raw: unknown) => {
        if (!raw || typeof raw !== "object" || !this.world) return;
        const data = raw as { type?: string; name?: string; action?: Action };
        if (
          data.type === "hello" &&
          typeof data.name === "string" &&
          !this.world.players[conn.peer]
        ) {
          clearTimeout(handshake);
          if (!addPlayer(this.world, conn.peer, data.name)) {
            conn.send({ type: "error", message: "部屋が満員です。" });
            return;
          }
          conn.send({ type: "init", world: this.world });
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
      if (!this.world || this.world.revision === this.lastRevision) return;
      this.lastRevision = this.world.revision;
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
        conn.send({ type: "hello", name: name.slice(0, 16) }),
      );
      conn.on("data", (raw: unknown) => {
        if (!raw || typeof raw !== "object") return;
        const data = raw as {
          type: string;
          world?: World;
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
          clearTimeout(timeout);
          this.world = data.world;
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
  send(action: Action) {
    if (this.closed) return;
    if (this.host && this.world) {
      if (applyAction(this.world, this.selfId, action)) this.emit();
    } else this.connections.get("host")?.send({ type: "action", action });
  }
  close() {
    this.closed = true;
    if (this.timer) clearInterval(this.timer);
    this.connections.forEach((c) => c.close());
    this.connections.clear();
    this.peer?.destroy();
    this.world = null;
  }
}
