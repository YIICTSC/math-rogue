import type { Adventure, Encounter } from './state';

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
] as const;
export type BattleArt = (typeof BATTLE_ART)[number];
export type BattlePoint =
  | { side: 'hero' | 'party'; cell?: number }
  | { side: 'foe'; index: number; cell?: number };

export type BattleEvent = {
  art: BattleArt;
  from: BattlePoint;
  to: BattlePoint;
  outcome: 'hit' | 'miss' | 'block' | 'power' | 'push';
  hp?: number;
};
export type BattleCue = { revision: number; events: BattleEvent[]; ending?: Adventure };
export const battleCueDelay = (index: number) => Math.min(index * 62, 235);

export const heroPoint = (s: Adventure): BattlePoint => ({ side: 'hero', cell: s.delve?.cell });
export const partyPoint = (s: Adventure): BattlePoint => ({ side: 'party', cell: s.delve?.cell });
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
  for (const { to, hp } of events) {
    if (to.side === 'hero' && to.cell !== undefined) delve.cell = to.cell;
    if (to.side !== 'foe') continue;
    if (battle.tactics && to.cell !== undefined) battle.tactics.cells[to.index] = to.cell;
    if (hp) battle.enemies[to.index].hp += hp;
  }
  return { ...s, delve };
}
