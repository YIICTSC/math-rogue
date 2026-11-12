import type { Actor, ShowError, ShowWorld, WolfAction, WolfGame, WolfRole } from './types';
export function wolfDistribution(n: number): Record<WolfRole, number> {
  const wolf = n <= 6 ? 1 : n <= 10 ? 2 : n <= 15 ? 3 : Math.floor(n / 4);
  const SEER = n >= 5 ? 1 : 0, GUARD = n >= 7 ? 1 : 0, MEDIUM = n >= 8 ? 1 : 0, MAD = n === 9 || n === 10 || n >= 13 ? 1 : 0;
  return { HUMAN: n - wolf - SEER - GUARD - MEDIUM - MAD, WOLF: wolf, SEER, GUARD, MEDIUM, MAD };
}
export function startWolves(ids: string[]): WolfGame {
  const order = [...ids];
  for (let i = order.length - 1; i > 0; i--) { const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1); [order[i], order[j]] = [order[j], order[i]]; }
  const roles = Object.entries(wolfDistribution(ids.length)).flatMap(([r, n]) => Array(n).fill(r as WolfRole));
  return { seats: Object.fromEntries(order.map((id, i) => [id, { role: roles[i], original: roles[i], active: true, lastGuard: null, reports: [] }])), matches: 0, goal: 10, winner: null, review: {}, votes: {}, night: {}, event: null };
}
export function checkWolfWinner(g: WolfGame) {
  const active = Object.values(g.seats).filter(s => s.active), wolves = active.filter(s => s.role === 'WOLF').length;
  if (!wolves || g.matches >= g.goal) g.winner = 'HUMAN';
  else if (wolves * 2 >= active.length) g.winner = 'WOLF';
  return g.winner;
}
function convert(g: WolfGame, id: string) { const seat = g.seats[id]; if (seat) { seat.role = 'HUMAN'; seat.active = false; } }
export function nightActors(g: WolfGame) { return Object.entries(g.seats).filter(([, s]) => s.active && ['WOLF', 'SEER', 'GUARD'].includes(s.role)).map(([id]) => id); }
/** Return 'next' only after a skipped deliberation. Otherwise the host gets a distinct next phase. */
export function wolfAction(w: ShowWorld, actor: Actor, action: WolfAction): ShowError | 'next' | null {
  const g = w.wolf; if (!g || g.winner) return 'PHASE';
  const seat = g.seats[actor.id];
  if (action.type !== 'wolfResolve' && (actor.role !== 'player' || !seat || !w.players[actor.id]?.connected)) return 'AUTH';
  if (action.type === 'wolfReview') {
    if (w.phase !== 'review' || typeof action.value !== 'boolean') return 'PHASE';
    g.review[actor.id] = action.value;
  } else if (action.type === 'wolfVote') {
    if (w.phase !== 'trial' || typeof action.playerId !== 'string' || (action.playerId !== '' && (!g.seats[action.playerId]?.active || action.playerId === actor.id))) return 'VOTE';
    g.votes[actor.id] = action.playerId;
  } else if (action.type === 'wolfNight') {
    const target = g.seats[action.playerId];
    if (w.phase !== 'night' || !seat.active || !['WOLF', 'SEER', 'GUARD'].includes(seat.role) || !target?.active || action.playerId === actor.id ||
      (seat.role === 'WOLF' && target.role === 'WOLF') || (seat.role === 'GUARD' && seat.lastGuard === action.playerId)) return 'VOTE';
    g.night[actor.id] = action.playerId;
  } else if (action.type === 'wolfResolve') {
    if (actor.role !== 'host') return 'AUTH';
    if (w.phase === 'review') {
      if (Object.values(g.review).some(Boolean)) { g.votes = {}; w.phase = 'trial'; }
      else { g.event = { kind: 'skip' }; return 'next'; }
    } else if (w.phase === 'trial') {
      const counts = new Map<string, number>();
      for (const id of Object.keys(g.seats)) { const target = g.votes[id] || ''; counts.set(target, (counts.get(target) || 0) + 1); }
      const max = Math.max(0, ...counts.values()), tied = [...counts].filter(([, n]) => n === max).map(([id]) => id);
      if (tied.includes('') || !max) { g.event = { kind: 'skip' }; return 'next'; }
      if (tied.length === 1) {
        const target = tied[0], wolf = g.seats[target].role === 'WOLF';
        for (const s of Object.values(g.seats)) if (s.active && s.role === 'MEDIUM') { s.reports.push({ target, wolf, day: w.index + 1 }); s.reports = s.reports.slice(-40); }
        convert(g, target); g.event = { kind: 'banished', target };
        if (checkWolfWinner(g)) { w.phase = 'finished'; return null; }
      } else g.event = { kind: 'tie' };
      g.night = {}; w.phase = 'night';
    } else if (w.phase === 'night') {
      const votes = new Map<string, number>(), protectedIds = new Set<string>();
      for (const [id, s] of Object.entries(g.seats)) {
        const target = g.night[id]; if (!s.active) continue;
        if (s.role === 'GUARD') { if (target) protectedIds.add(target); s.lastGuard = target || null; }
        if (!target) continue;
        if (s.role === 'WOLF') votes.set(target, (votes.get(target) || 0) + 1);
        if (s.role === 'SEER') { s.reports.push({ target, wolf: g.seats[target].role === 'WOLF', day: w.index + 1 }); s.reports = s.reports.slice(-40); }
      }
      const max = Math.max(0, ...votes.values()), targets = [...votes].filter(([, n]) => n === max).map(([id]) => id);
      const target = targets.length ? targets[crypto.getRandomValues(new Uint32Array(1))[0] % targets.length] : null;
      if (target && !protectedIds.has(target)) { convert(g, target); g.event = { kind: 'attacked', target }; }
      else g.event = { kind: 'safe' };
      w.phase = checkWolfWinner(g) ? 'finished' : 'dawn';
    } else return 'PHASE';
  } else return 'AUTH';
  return null;
}
