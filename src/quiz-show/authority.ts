import { act, addAnswerer, createShow, disconnectAnswerer, hostConnection, inkFor, tickShow, viewFor } from './engine';
import { QUIZ_PROTOCOL, type Actor, type ShowError, type ShowWorld } from './types';

export interface Hello { protocol: number; role: 'host' | 'player' | 'screen'; key: string; name?: string }
interface Seat { actor: Actor; key: string }
/** The same admission and command authority runs on a host device and on the WS server. */
export class ShowAuthority {
  readonly world: ShowWorld;
  private seats = new Map<string, Seat>();
  private banned = new Set<string>();
  constructor(private hostKey: string, title?: string, saved?: { world: ShowWorld; seats: Seat[]; banned: string[] }) {
    this.world = saved?.world || createShow(title);
    this.world.plan ||= { order: 'RANDOM', limit: 0, shuffleChoices: true, autoAdvance: true };
    this.world.plan.autoAdvance ??= true;
    this.world.queue ||= this.world.bank.map((_, i) => i);
    if (this.world.round) this.world.round.showJudgments ??= false;
    this.world.audienceScreens = 0;
    if (saved) {
      delete this.world.autoProgress;
      for (const s of saved.seats) if (s.actor.role !== 'screen') this.seats.set(s.key, s);
      this.banned = new Set(saved.banned);
      for (const p of Object.values(this.world.players)) p.connected = false;
      hostConnection(this.world, true);
    }
  }
  join(hello: unknown): { actor: Actor } | { error: ShowError } {
    if (!hello || typeof hello !== 'object') return { error: 'AUTH' };
    const h = hello as Hello;
    if (h.protocol !== QUIZ_PROTOCOL || !['host', 'player', 'screen'].includes(h.role) || typeof h.key !== 'string' || !/^[a-zA-Z0-9_-]{16,128}$/.test(h.key) || this.banned.has(h.key)) return { error: 'AUTH' };
    if (h.role === 'host') {
      if (h.key !== this.hostKey) return { error: 'AUTH' };
      hostConnection(this.world, true); return { actor: { id: 'host', role: 'host' } };
    }
    const seat = this.seats.get(h.key);
    if (seat) {
      if (seat.actor.role !== h.role) return { error: 'AUTH' };
      if (h.role === 'player') { const error = addAnswerer(this.world, seat.actor.id, h.name); if (error) return { error }; }
      return { actor: seat.actor };
    }
    if (h.role === 'screen' && [...this.seats.values()].filter(s => s.actor.role === 'screen').length >= 4) return { error: 'FULL' };
    const actor: Actor = { id: crypto.randomUUID(), role: h.role };
    if (h.role === 'player') { const error = addAnswerer(this.world, actor.id, h.name); if (error) return { error }; }
    this.seats.set(h.key, { key: h.key, actor });
    this.syncScreens();
    return { actor };
  }
  leave(actor: Actor) {
    if (actor.role === 'host') hostConnection(this.world, false);
    else if (actor.role === 'player') disconnectAnswerer(this.world, actor.id);
    else { for (const [key, s] of this.seats) if (s.actor.id === actor.id) this.seats.delete(key); this.syncScreens(); }
  }
  private syncScreens() {
    const count = [...this.seats.values()].filter(s => s.actor.role === 'screen').length;
    if (count !== this.world.audienceScreens) { this.world.audienceScreens = count; this.world.revision++; }
  }
  command(actor: Actor, action: unknown, now = Date.now()): ShowError | null {
    if (actor.role === 'player' && !this.world.players[actor.id]) return 'AUTH';
    const error = act(this.world, actor, action, now);
    if (!error && actor.role === 'host' && (action as any)?.type === 'remove') {
      const id = (action as any).playerId;
      for (const [key, seat] of this.seats) if (seat.actor.id === id) { if (this.banned.size < 200) this.banned.add(key); this.seats.delete(key); }
    }
    return error;
  }
  packet(actor: Actor, raw: unknown): object | null {
    if (!raw || typeof raw !== 'object') return null;
    const p = raw as any;
    if (p.type === 'ink' && typeof p.roundId === 'string' && typeof p.playerId === 'string') {
      const answer = inkFor(this.world, actor, p.roundId, p.playerId);
      return answer ? { type: 'ink', roundId: p.roundId, playerId: p.playerId, revision: answer.revision, strokes: answer.ink } : null;
    }
    if (p.type === 'action') { const error = this.command(actor, p.action); return error ? { type: 'error', code: error } : { type: 'ack', request: typeof p.request === 'number' ? p.request : 0 }; }
    if (p.type === 'ping') return { type: 'pong', now: Date.now() };
    return null;
  }
  view(actor: Actor) { return viewFor(this.world, actor); }
  tick(now = Date.now()) { tickShow(this.world, now); }
  save() { return { world: this.world, seats: [...this.seats.values()].filter(s => s.actor.role !== 'screen'), banned: [...this.banned] }; }
}
