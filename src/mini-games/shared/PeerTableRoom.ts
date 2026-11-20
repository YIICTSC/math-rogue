import Peer, { type DataConnection, type PeerOptions } from 'peerjs';
import { createHostRoomCode } from '../../services/onlineTransport';
import { shouldReportPeerError } from './tableNetworkPolicy';
import { tableRoomCode } from './tableInvite';

export type TableProfile = { name: string; hero: string };
type Member = TableProfile & { id: string; cpu: boolean };
type Packet = { selfId: string };
interface Session<A> {
  members: Member[];
  join(member: Member): boolean;
  leave(id: string): void;
  command(id: string, action: A, revision: number): boolean;
  tick(): void;
}

type TransportOptions<P extends Packet> = {
  namespace: string;
  protocol: number;
  seats: number;
  revision: (packet: P | null) => number;
  live: (packet: P | null) => boolean;
};

/** Transport for host-authoritative turn-based tables and offline CPU matches. */
export abstract class PeerTableRoom<P extends Packet, A, S extends Session<A>> {
  private peer: Peer | null = null;
  protected session: S | null = null;
  private readonly channels = new Map<string, DataConnection>();
  protected cpuTimer: ReturnType<typeof setInterval> | null = null;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  private readonly controller = new AbortController();
  private closed = false;
  private connecting = false;
  selfId = 'local';
  code = '';
  host = false;
  last: P | null = null;
  constructor(
    private readonly options: TransportOptions<P>,
    private readonly update: (packet: P) => void,
    private readonly status: (message: string) => void,
  ) {}

  protected abstract makeSession(emit: (id: string, packet: P) => void): S;

  private notify(packet: P) {
    if (this.closed) return;
    this.last = packet;
    this.update(packet);
  }

  private send(c: DataConnection, data: unknown) {
    try {
      if (c.open) c.send(JSON.stringify(data));
    } catch {
      if (!this.closed) this.status('NETWORK_ERROR');
    }
  }

  private beginSession(profile: TableProfile) {
    this.session = this.makeSession((id, packet) => {
      if (id === this.selfId) this.notify(packet);
      else {
        const channel = this.channels.get(id);
        if (channel) this.send(channel, { type: 'state', packet });
      }
    });
    this.session.join({ id: this.selfId, ...profile, cpu: false });
    this.cpuTimer = setInterval(() => this.session?.tick(), 550);
  }

  practice(profile: TableProfile) {
    this.host = true;
    this.beginSession(profile);
  }

  private peerId() {
    return `${this.options.namespace}-v${this.options.protocol}-${this.code}`;
  }

  private timeout(callback: () => void, ms: number) {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      callback();
    }, ms);
    this.timers.add(timer);
    return timer;
  }

  private stopTimer(timer: ReturnType<typeof setTimeout>) {
    clearTimeout(timer);
    this.timers.delete(timer);
  }

  private async open(id?: string) {
    const env = import.meta.env;
    const options: PeerOptions = env.VITE_RPG_PEER_HOST
      ? {
          host: env.VITE_RPG_PEER_HOST,
          port: Number(env.VITE_RPG_PEER_PORT || 443),
          path: env.VITE_RPG_PEER_PATH || '/',
          secure: env.VITE_RPG_PEER_SECURE !== 'false',
        }
      : {};
    if (env.VITE_KART_ICE_SERVERS) {
      try {
        options.config = { iceServers: JSON.parse(env.VITE_KART_ICE_SERVERS) };
      } catch {
        throw Error('ICE_CONFIG_ERROR');
      }
    }
    const peer = id ? new Peer(id, options) : new Peer(options);
    this.peer = peer;
    await new Promise<void>((resolve, reject) => {
      const finish = (error?: Error) => {
        this.stopTimer(timer);
        this.controller.signal.removeEventListener('abort', abort);
        error ? reject(error) : resolve();
      };
      const abort = () => finish(Error('CLOSED'));
      const timer = this.timeout(() => finish(Error('TIMEOUT')), 18000);
      this.controller.signal.addEventListener('abort', abort, { once: true });
      peer.once('open', () => finish());
      peer.once('error', (e) => finish(Error(e.type)));
    });
    if (this.closed) {
      peer.destroy();
      throw Error('CLOSED');
    }
    this.selfId = peer.id;
    peer.on('error', (error) => {
      const openChannels = [...this.channels.values()].filter((channel) => channel.open).length;
      if (
        !this.closed &&
        shouldReportPeerError(error.type, this.options.live(this.last), openChannels)
      ) {
        this.status('NETWORK_ERROR');
      }
    });
    peer.on('disconnected', () => {
      if (!this.closed && !peer.destroyed) peer.reconnect();
    });
    return peer;
  }

  async create(profile: TableProfile) {
    if (this.connecting || this.closed) return;
    this.connecting = true;
    this.host = true;
    try {
      let peer: Peer | undefined;
      for (let attempt = 0; attempt < 3; attempt++) {
        this.code = createHostRoomCode();
        try {
          peer = await this.open(this.peerId());
          break;
        } catch (error) {
          this.peer?.destroy();
          if (!String(error).includes('unavailable-id') || attempt === 2) throw error;
        }
      }
      if (!peer) throw Error('NETWORK_ERROR');
      this.beginSession(profile);
      peer.on('connection', (c) => this.accept(c));
    } finally {
      this.connecting = false;
    }
  }

  private accept(c: DataConnection) {
    if (this.closed || this.channels.has(c.peer) || this.channels.size >= this.options.seats - 1) {
      c.close();
      return;
    }
    this.channels.set(c.peer, c);
    let admitted = false,
      windowAt = 0,
      count = 0;
    const timer = this.timeout(() => {
      if (!admitted) c.close();
    }, 12000);
    c.on('data', (raw) => {
      if (this.closed || typeof raw !== 'string' || raw.length > 4096) return;
      const now = Date.now();
      if (now - windowAt > 1000) {
        windowAt = now;
        count = 0;
      }
      if (++count > 25) return;
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        return;
      }
      if (!data || typeof data !== 'object' || Array.isArray(data)) return;
      if (data.type === 'hello' && !admitted) {
        const p = { id: c.peer, name: data.name, hero: data.hero, cpu: false };
        admitted = data.protocol === this.options.protocol && !!this.session?.join(p);
        if (admitted) this.stopTimer(timer);
        else this.send(c, { type: 'error', message: 'ROOM_FULL_OR_STARTED' });
      } else if (
        data.type === 'action' &&
        admitted &&
        data.action &&
        typeof data.action === 'object'
      ) {
        this.session?.command(c.peer, data.action, data.revision);
      } else if (data.type === 'leave') c.close();
    });
    c.on('close', () => {
      this.stopTimer(timer);
      this.channels.delete(c.peer);
      if (admitted) this.session?.leave(c.peer);
    });
    c.on('error', () => c.close());
  }

  async join(profile: TableProfile, code: string) {
    if (this.connecting || this.closed) return;
    this.connecting = true;
    try {
      this.code = tableRoomCode(code);
      if (!this.code) throw Error('INVALID_CODE');
      const peer = await this.open();
      const c = peer.connect(this.peerId(), { reliable: true });
      this.channels.set('host', c);
      await new Promise<void>((resolve, reject) => {
        let admitted = false;
        const settle = (error?: Error) => {
          this.stopTimer(timer);
          this.controller.signal.removeEventListener('abort', abort);
          error ? reject(error) : resolve();
        };
        const abort = () => settle(Error('CLOSED'));
        const timer = this.timeout(() => {
          settle(Error('TIMEOUT'));
          c.close();
        }, 20000);
        this.controller.signal.addEventListener('abort', abort, { once: true });
        c.on('open', () =>
          this.send(c, { type: 'hello', protocol: this.options.protocol, ...profile }),
        );
        c.on('data', (raw) => {
          if (this.closed || typeof raw !== 'string' || raw.length > 500000) return;
          let data;
          try {
            data = JSON.parse(raw);
          } catch {
            return;
          }
          if (data?.type === 'state' && data.packet?.selfId === this.selfId) {
            if (!admitted) {
              admitted = true;
              settle();
            }
            this.notify(data.packet);
          } else if (data?.type === 'error' && !admitted) settle(Error(data.message));
        });
        c.on('close', () => {
          if (!this.closed) {
            if (admitted) this.status('HOST_DISCONNECTED');
            else settle(Error('HOST_DISCONNECTED'));
          }
        });
        c.on('error', () =>
          admitted ? this.status('NETWORK_ERROR') : settle(Error('NETWORK_ERROR')),
        );
      });
    } finally {
      this.connecting = false;
    }
  }

  command(action: A) {
    const revision = this.options.revision(this.last);
    if (this.host) this.session?.command(this.selfId, action, revision);
    else {
      const c = this.channels.get('host');
      if (c) this.send(c, { type: 'action', action, revision });
    }
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.controller.abort();
    if (this.cpuTimer) clearInterval(this.cpuTimer);
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
    const peer = this.peer,
      channels = [...this.channels.values()];
    this.peer = null;
    this.channels.clear();
    setTimeout(() => {
      for (const c of channels) c.close();
      peer?.destroy();
    }, 250);
  }
}
