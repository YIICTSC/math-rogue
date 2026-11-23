import type { Adventure, Encounter } from './state';
import { ADVANCED_IDS } from './advancedTechniques';

export const BATTLE_ART = [
  'slash',
  'thrust',
  'crush',
  'arrow',
  'arcane',
  'wind',
  'guard',
  'collision',
  'shock',
  'fire',
  'heal',
  'snare',
  ...ADVANCED_IDS,
] as const;
export type BattleArt = (typeof BATTLE_ART)[number];
export type BattlePoint =
  | { side: 'hero'; cell?: number }
  | { side: 'party'; id: string; cell?: number }
  | { side: 'foe'; index: number; cell?: number };

export type BattleEvent = {
  art: BattleArt;
  from: BattlePoint;
  to: BattlePoint;
  outcome: 'hit' | 'miss' | 'block' | 'power' | 'push' | 'move';
  hp?: number;
  sharedStep?: boolean;
};
export type BattleCue = {
  revision: number;
  events: BattleEvent[];
  delays: number[];
  duration: number;
  alliesAct: boolean;
  ending?: Adventure;
};

export function battleTiming(events: BattleEvent[]) {
  let previousAlly: string | undefined;
  let time = 0;
  let alliesAct = false;
  const delays = events.map(({ from, sharedStep }, index) => {
    if (sharedStep) return time;
    const ally = from.side === 'party' ? from.id : undefined;
    alliesAct ||= ally !== undefined;
    if (index) time += (ally || previousAlly) && ally !== previousAlly ? 225 : 58;
    previousAlly = ally;
    return time;
  });
  return { delays, duration: Math.max(640, time + 425), alliesAct };
}
export const battleCueDelay = (cue: BattleCue | null | undefined, index: number) =>
  cue?.delays[index] ?? 0;

export const heroPoint = (s: Adventure): BattlePoint => ({ side: 'hero', cell: s.delve?.cell });
export const partyPoint = (battle: Encounter, id: string): BattlePoint => ({
  side: 'party',
  id,
  cell: battle.tactics?.party?.[id],
});
export const foePoint = (battle: Encounter, index: number): BattlePoint => ({
  side: 'foe',
  index,
  cell: battle.tactics?.cells[index],
});

export function hurtFoe(
  battle: Encounter,
  index: number,
  amount: number,
  art: BattleArt,
  from: BattlePoint,
  events?: BattleEvent[],
) {
  const foe = battle.enemies[index];
  const lost = Math.min(amount, foe.hp);
  if (!lost) return 0;
  foe.hp -= lost;
  events?.push({ art, from, to: foePoint(battle, index), outcome: 'hit', hp: -lost });
  return lost;
}

export function finalBattleFrame(s: Adventure, events: BattleEvent[]) {
  const delve = structuredClone(s.delve!);
  const battle = delve.encounter!;
  for (const { to, hp, outcome } of events) {
    if (to.side === 'hero' && to.cell !== undefined && outcome === 'move') delve.cell = to.cell;
    if (to.side === 'party') {
      if (battle.tactics && to.cell !== undefined) (battle.tactics.party ??= {})[to.id] = to.cell;
      const ally = battle.allies?.find((member) => member.id === to.id);
      if (ally && hp) ally.hp = Math.max(0, Math.min(ally.max, ally.hp + hp));
    }
    if (to.side !== 'foe') continue;
    if (battle.tactics && to.cell !== undefined) battle.tactics.cells[to.index] = to.cell;
    if (hp) battle.enemies[to.index].hp += hp;
  }
  return { ...s, delve };
}
