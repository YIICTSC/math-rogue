import type { Entry } from '../catalog';
import { makeActionMechanic } from './physics';
import type { ActionSpec } from './types';

/** Make a fresh scenario for this appearance; never change the library or saved keys. */
export function challengeEntry(entry: Entry, level: number, seed: number): Entry {
  if (!entry.game.action) return entry;
  const tier = Math.max(0, Math.min(4, Math.floor(level))), base = entry.game.action;
  const hash = (Math.imul(seed ^ base.variant, 1664525) + 1013904223) >>> 0;
  const extra = ['sweep','mining'].includes(base.family) ? Number(tier >= 2) : ['collect', 'catch', 'rhythm', 'duel'].includes(base.family)
    ? Math.floor(tier / 2) : ['aim', 'timing', 'throw', 'chase', 'bat', 'rally', 'soccer', 'parry', 'volley'].includes(base.family) && tier >= 3 ? 1 : 0;
  const action: ActionSpec = { ...base, tier,
    // Keep the original travel direction while changing routes, pitches and patterns.
    variant: base.variant + (tier ? tier * 14 + hash % 3 * 2 : 0),
    goal: base.goal + extra,
  };
  return { ...entry, game: { ...entry.game, action, mechanic: makeActionMechanic(action) } };
}
