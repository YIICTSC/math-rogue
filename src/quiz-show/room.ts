import Peer, { type DataConnection, type PeerOptions } from 'peerjs';
import { DedicatedConnection } from '../services/dedicatedConnection';
import { ShowAuthority, type Hello } from './authority';
import { validBank, validInk } from './engine';
import { QUIZ_PROTOCOL, type Actor, type InkStroke, type Role, type ShowAction, type ShowError, type ShowView } from './types';
import { addressText, type RoomAddress } from './invite';

const PREFIX = 'gakuro-quiz-show-v1-';
const HOST_SAVE = 'learning-rogue-quiz-show-host-v1';
const token = () => crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().slice(0, 8);
const HOST: Actor = { id: 'host', role: 'host' };
export const quizShowServerUrl = () => import.meta.env.VITE_QUIZ_SHOW_SERVER_URL as string | undefined;
interface SavedHost { address: RoomAddress; key: string; savedAt: number; data?: ReturnType<ShowAuthority['save']> }
export function savedHost(): SavedHost | null {
  try { const s = JSON.parse(sessionStorage.getItem(HOST_SAVE) || 'null') as SavedHost; return s && /^\d{6}$/.test(s.address?.code) && /^[a-zA-Z0-9_-]{16,128}$/.test(s.key) && Date.now() - s.savedAt < 4 * 3600000 ? s : null; } catch { return null; }
}
function identity(address: RoomAddress, role: Role) {
  const slot = `quiz-show-seat-${addressText(address)}-${role}`;
  try { const old = sessionStorage.getItem(slot); if (old && /^[a-zA-Z0-9_-]{16,128}$/.test(old)) return old; const value = token(); sessionStorage.setItem(slot, value); return value; } catch { return token(); }
}
export interface InkEntry { revision: number; strokes: InkStroke[] }
export class QuizShowRoom {
  address: RoomAddress = { transport: 'host', code: '' };
  actor: Actor = { id: '', role: 'player' };
  authority: ShowAuthority | null = null;
  private key = '';
  private peer: Peer | null = null;
  private dedicated: DedicatedConnection | null = null;
  private channel: DataConnection | null = null;
  private pendingChannels = new Set<DataConnection>();
  private cancelPending = new Set<() => void>();
  private channels = new Map<string, { channel: DataConnection; actor: Actor; revision: number }>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private closed = false;
  private view: ShowView | null = null;
  private savedAt = 0;
  private receivedAt = 0;
  private syncing = false;
  private pendingInk = new Map<string, number>();
  private lastInkRequest = 0;
  private connectionGeneration = 0;
  private retry: ReturnType<typeof setTimeout> | null = null;
  private hello: Hello | null = null;
  private unwatch: (() => void) | null = null;
  readonly inks = new Map<string, InkEntry>();
  constructor(private update: (v: ShowView | null) => void, private status: (error: ShowError | null) => void, private connection: (state: 'connecting' | 'connected' | 'reconnecting' | 'ended') => void, private inkChanged: () => void) {}
  private sendTo(channel: DataConnection, packet: unknown) {
    if (!channel.open || (channel.dataChannel?.bufferedAmount || 0) > 128000) return false;
    try { channel.send(JSON.stringify(packet)); return true; } catch { return false; }
  }
  private sendPacket(packet: unknown) {
    if (this.dedicated) return this.dedicated.send(packet);
    return this.channel ? this.sendTo(this.channel, packet) : false;
  }
  private accept(raw: any) {
    if (this.closed || !raw || typeof raw !== 'object') return false;
    if (raw.type === 'welcome' && raw.actor && ['host', 'player', 'screen'].includes(raw.actor.role) && typeof raw.actor.id === 'string') {
      this.actor = raw.actor; if (typeof raw.code === 'string' && /^\d{6}$/.test(raw.code)) this.address.code = raw.code; return false;
    }
    if (raw.type === 'state' && raw.view && typeof raw.view.revision === 'number' && Array.isArray(raw.view.players) && raw.view.players.length <= 40 && raw.view.self === this.actor.id && raw.view.role === this.actor.role) {
      const v = raw.view as ShowView;
      if (!this.view || v.round?.id !== this.view.round?.id) { this.inks.clear(); this.pendingInk.clear(); }
      if (v.round) for (const tile of v.round.tiles) if (tile.visible && !tile.hasInk) this.inks.delete(`${v.round.id}:${tile.id}`);
      this.view = v; this.receivedAt = Date.now(); this.update(v); this.connection('connected'); this.status(null); return true;
    }
    if (raw.type === 'ink' && raw.roundId === this.view?.round?.id && typeof raw.playerId === 'string' && Number.isInteger(raw.revision) && validInk(raw.strokes)) {
      const cacheKey = `${raw.roundId}:${raw.playerId}`, old = this.inks.get(cacheKey);
      if (!old || raw.revision >= old.revision) { this.inks.set(cacheKey, { revision: raw.revision, strokes: raw.strokes }); this.pendingInk.delete(cacheKey); this.inkChanged(); }
    }
    if (raw.type === 'pong') { this.receivedAt = Date.now(); if (this.view) this.connection('connected'); }
    if (raw.type === 'error') this.status(raw.code || 'NETWORK');
    if (raw.type === 'ended') { this.connection('ended'); this.close(); }
    return false;
  }
  private emit() {
    if (!this.authority || this.closed) return;
    const w = this.authority.world;
    if (!this.view || this.view.revision !== w.revision) this.accept({ type: 'state', view: this.authority.view(HOST) });
    for (const seat of this.channels.values()) {
      if (seat.actor.role === 'player' && !w.players[seat.actor.id]) { this.sendTo(seat.channel, { type: 'error', code: 'AUTH' }); seat.channel.close(); continue; }
      if (seat.revision !== w.revision && this.sendTo(seat.channel, { type: 'state', view: this.authority.view(seat.actor) })) seat.revision = w.revision;
    }
    if (Date.now() - this.savedAt > 1000) this.persist();
  }
  private persist() {
    if (this.actor.role !== 'host' || !this.address.code) return;
    this.savedAt = Date.now();
    try { sessionStorage.setItem(HOST_SAVE, JSON.stringify({ address: this.address, key: this.key, savedAt: this.savedAt, ...(this.authority ? { data: this.authority.save() } : {}) } satisfies SavedHost)); } catch { /* Hosting still works if browser storage is full. */ }
  }
  private startTimer() {
    this.timer = setInterval(() => {
      if (this.closed) return;
      if (this.authority) { this.authority.tick(); this.emit(); }
      else if (this.view && Date.now() - this.receivedAt > 5000 && !this.syncing) { if (Date.now() - this.receivedAt > 16000) this.connection('reconnecting'); this.sendPacket({ type: 'ping' }); }
      this.fetchInk();
    }, 200);
    const save = () => this.persist(); window.addEventListener('pagehide', save); this.unwatch = () => window.removeEventListener('pagehide', save);
  }
  private fetchInk() {
    if (!this.view?.round || Date.now() - this.lastInkRequest < 250) return;
    this.lastInkRequest = Date.now(); let sent = 0;
    for (const t of this.view.round.tiles) {
      if (!t.visible || !t.hasInk || this.inks.get(`${this.view.round.id}:${t.id}`)?.revision === t.inkRevision) continue;
      const cacheKey = `${this.view.round.id}:${t.id}`;
      if (Date.now() - (this.pendingInk.get(cacheKey) || 0) < 1500) continue;
      const packet = { type: 'ink', roundId: this.view.round.id, playerId: t.id };
      if (this.authority) { const answer = this.authority.packet(HOST, packet); if (answer) this.accept(answer); }
      else if (this.sendPacket(packet)) this.pendingInk.set(cacheKey, Date.now());
      if (++sent >= 4) break;
    }
  }
  private async openPeer(id?: string) {
    const env = import.meta.env, options: PeerOptions = env.VITE_RPG_PEER_HOST ? { host: env.VITE_RPG_PEER_HOST, port: Number(env.VITE_RPG_PEER_PORT || 443), path: env.VITE_RPG_PEER_PATH || '/', secure: env.VITE_RPG_PEER_SECURE !== 'false' } : {};
    const ice = env.VITE_QUIZ_SHOW_ICE_SERVERS || env.VITE_TENNIS_ICE_SERVERS || env.VITE_GOLF_ICE_SERVERS || env.VITE_KART_ICE_SERVERS;
    if (ice) options.config = { iceServers: JSON.parse(ice) };
    const peer = id ? new Peer(id, options) : new Peer(options); this.peer = peer;
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = (error = false) => { if (settled) return; settled = true; clearTimeout(timer); this.cancelPending.delete(cancel); error ? reject(new Error('NETWORK')) : resolve(); };
      const cancel = () => finish(true), timer = setTimeout(() => { peer.destroy(); finish(true); }, 25000); this.cancelPending.add(cancel);
      peer.once('open', () => finish()); peer.once('error', () => finish(true));
    });
    if (this.closed) { peer.destroy(); throw new Error('NETWORK'); }
    peer.on('disconnected', () => { if (!this.closed && !peer.destroyed) peer.reconnect(); });
    peer.on('error', () => { if (!this.closed && this.actor.role === 'host') this.status('NETWORK'); });
    return peer;
  }
  private hostPeer(peer: Peer) {
    peer.on('connection', channel => {
      if (this.closed || this.channels.size + this.pendingChannels.size >= 48) { channel.close(); return; }
      this.pendingChannels.add(channel);
      let actor: Actor | null = null, count = 0, at = Date.now();
      const admission = setTimeout(() => { if (!actor) channel.close(); }, 15000);
      channel.on('data', raw => {
        if (!this.authority || this.closed || typeof raw !== 'string' || raw.length > 280000) return;
        const now = Date.now(); if (now - at >= 1000) { at = now; count = 0; } if (++count > 35) return;
        let p: any; try { p = JSON.parse(raw); } catch { return; }
        if (!p || typeof p !== 'object') return;
        if (!actor) {
          if (p.type !== 'hello' || p.role === 'host') return;
          const joined = this.authority.join(p);
          if ('error' in joined) { this.sendTo(channel, { type: 'error', code: joined.error }); return; }
          actor = joined.actor; clearTimeout(admission); this.pendingChannels.delete(channel);
          const old = this.channels.get(actor.id); this.channels.set(actor.id, { channel, actor, revision: -1 }); if (old) old.channel.close();
          this.sendTo(channel, { type: 'welcome', actor, code: this.address.code }); this.emit(); return;
        }
        if (this.channels.get(actor.id)?.channel !== channel) return;
        const result = this.authority.packet(actor, p); if (result) this.sendTo(channel, result); this.emit();
      });
      channel.on('close', () => {
        clearTimeout(admission); this.pendingChannels.delete(channel);
        if (actor && this.channels.get(actor.id)?.channel === channel) { this.channels.delete(actor.id); this.authority?.leave(actor); this.emit(); }
      });
      channel.on('error', () => {});
    });
  }
  async create(transport: RoomAddress['transport'] = 'host', restore = false) {
    this.connection('connecting'); this.actor = HOST;
    const saved = restore ? savedHost() : null; this.key = saved?.key || token();
    this.address = saved?.address || { transport, code: String(100000 + crypto.getRandomValues(new Uint32Array(1))[0] % 900000) };
    if (this.address.transport === 'server') await this.openServer({ protocol: 1, role: 'host', key: this.key, ...(saved ? { code: saved.address.code } : { create: true }) });
    else {
      this.authority = new ShowAuthority(this.key, undefined, saved?.data); this.authority.join({ protocol: 1, role: 'host', key: this.key });
      this.hostPeer(await this.openPeer(PREFIX + this.address.code)); this.emit();
    }
    this.startTimer(); this.persist();
  }
  async join(address: RoomAddress, name: string, screen = false) {
    this.address = address; this.actor = { id: '', role: screen ? 'screen' : 'player' }; this.key = identity(address, this.actor.role);
    this.hello = { protocol: 1, role: this.actor.role, key: this.key, name }; this.connection('connecting');
    if (address.transport === 'server') await this.openServer({ ...this.hello, code: address.code });
    else { await this.openPeer(); await this.connectPeer(); }
    this.startTimer();
  }
  private connectPeer(): Promise<void> {
    const generation = ++this.connectionGeneration; this.syncing = true;
    return new Promise((resolve, reject) => {
      if (!this.peer || this.closed) { reject(new Error('NETWORK')); return; }
      const channel = this.peer.connect(PREFIX + this.address.code, { reliable: true, serialization: 'raw' }); this.channel = channel;
      let ready = false, done = false;
      const finish = (error?: string) => { if (done) return; done = true; clearTimeout(timeout); this.cancelPending.delete(cancel); this.syncing = false; error ? reject(new Error(error)) : resolve(); };
      const cancel = () => finish('NETWORK'), timeout = setTimeout(() => { finish('NETWORK'); channel.close(); }, 25000); this.cancelPending.add(cancel);
      channel.on('open', () => this.sendTo(channel, { type: 'hello', ...this.hello }));
      channel.on('data', raw => {
        if (generation !== this.connectionGeneration || typeof raw !== 'string' || raw.length > 400000) return;
        let p: any; try { p = JSON.parse(raw); } catch { return; }
        if (p?.type === 'error' && !ready) { finish(p.code || 'NETWORK'); channel.close(); return; }
        if (this.accept(p)) { ready = true; finish(); }
      });
      const lost = () => { finish('NETWORK'); if (!this.closed && ready && generation === this.connectionGeneration) this.scheduleReconnect(); };
      channel.on('close', lost); channel.on('error', lost);
    });
  }
  private scheduleReconnect() {
    if (this.closed || this.retry) return; this.connection('reconnecting');
    this.retry = setTimeout(() => {
      this.retry = null;
      const next = this.address.transport === 'server' ? this.openServer({ ...this.hello, code: this.address.code }) : this.connectPeer();
      void next.catch(() => { if (!this.closed) this.scheduleReconnect(); });
    }, 2000);
  }
  private async openServer(hello: object) {
    const url = quizShowServerUrl(); if (!url) throw new Error('NETWORK');
    const h = hello as Hello; this.hello = { protocol: 1, role: h.role, key: h.key, name: h.name };
    const dedicated = new DedicatedConnection(packet => { if (packet.type === 'error' && !this.view) throw new Error(packet.code || 'NETWORK'); return this.accept(packet); }, () => { if (!this.closed) { dedicated.close(); this.scheduleReconnect(); } }, url);
    this.dedicated = dedicated; await dedicated.open('quiz-show', hello);
  }
  send(action: ShowAction) {
    if (this.closed) return false;
    if (action.type === 'bank' && !validBank(action.questions)) { this.status('QUESTION'); return false; }
    if (this.authority) { const error = this.authority.command(HOST, action); if (error) { this.status(error); return false; } this.status(null); this.emit(); this.persist(); return true; }
    return this.sendPacket({ type: 'action', action });
  }
  close() {
    if (this.closed) return; this.persist(); this.closed = true;
    if (this.timer) clearInterval(this.timer); if (this.retry) clearTimeout(this.retry); this.unwatch?.();
    for (const cancel of this.cancelPending) cancel(); this.cancelPending.clear();
    for (const channel of this.pendingChannels) channel.close(); this.pendingChannels.clear();
    for (const s of this.channels.values()) s.channel.close(); this.channels.clear();
    this.channel?.close(); this.peer?.destroy(); this.dedicated?.close();
  }
}
