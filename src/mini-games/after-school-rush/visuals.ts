import type { Entry } from './catalog';
import type { ArtName } from './art';

export type View = 'flat' | 'diorama' | 'first-person' | 'chase' | 'overhead' | 'fixed';
export type Set = 'trail' | 'arena' | 'balance' | 'portal' | 'bench' | 'shelf' | 'paper' | 'spotlight' | 'circuit' | 'queue' | 'vessel' | 'orbit' | 'rhythm';
export type Motion = 'connect' | 'cut' | 'draw' | 'drop' | 'fill' | 'flip' | 'fold' | 'insert' | 'leap' | 'pick' | 'plant' | 'reveal' | 'scan' | 'shoot' | 'signal' | 'slide' | 'split' | 'squeeze' | 'stack' | 'strike' | 'swap' | 'turn' | 'walk';
type Visual = readonly [view: View, set: Set, prop: ArtName, motion: Motion];

/** Physical scenes choose their own object and animation family. */
export function visualFor(entry: Entry): Visual {
  const action = entry.game.action;
  if (!action) return ['flat', 'arena', entry.game.icon, 'pick'];
  const crossovers: Partial<Record<string, Visual>> = {
    bat: ['diorama', 'arena', action.item, 'strike'], rally: ['diorama', 'arena', action.item, 'strike'],
    soccer: ['overhead', 'arena', action.item, 'shoot'], golf: ['fixed', 'bench', action.item, 'strike'],
    kart: ['chase', 'trail', action.item, 'walk'], parry: ['diorama', 'arena', action.item, 'strike'],
    grapple: ['diorama', 'portal', action.item, 'leap'], fishing: ['fixed', 'vessel', action.item, 'pick'],
    mining: ['overhead', 'circuit', action.item, 'strike'], volley: ['diorama', 'arena', action.item, 'shoot'],
  };
  if (crossovers[action.family]) return crossovers[action.family]!;
  return ['flat', 'arena', action.item,
    ['run', 'climb', 'hurdles', 'flap'].includes(action.family) ? 'leap'
      : ['aim', 'throw'].includes(action.family) ? 'shoot' : action.family === 'duel' ? 'strike' : 'pick'];
}
