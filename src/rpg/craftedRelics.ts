import type { Player, Relic } from '../types';

export const CRAFTED_SWORD_DESCRIPTION = '所持中、すべての戦闘でムキムキ＋2。';
export const CRAFTED_BOW_DESCRIPTION = '戦闘開始時、15％の確率で先制攻撃。最初の敵ターンは敵が行動しない。';
const FIRST_STRIKE_COUNTER = 'RPG_CRAFT_FIRST_STRIKE_PENDING';

export function craftedRelic(id: string): Relic | null {
  const base = { rarity: 'UNCOMMON' as const, effectType: 'START_BATTLE' as const };
  const zero = { strength: 0, block: 0, draw: 0, heal: 0 };
  switch (id) {
    case 'sword':
      return { ...base, id: 'RPG_CRAFT:sword', name: '鉄の剣', description: CRAFTED_SWORD_DESCRIPTION, rpgInnate: { ...zero, strength: 2 } };
    case 'frostbow':
      return { ...base, id: 'RPG_CRAFT:frostbow', name: '霜木の弓', description: CRAFTED_BOW_DESCRIPTION, rpgInnate: { ...zero, firstStrikeChance: .15 } };
    default:
      return null;
  }
}

/** Roll once per battle. Pending first strike survives extra or cooperative player turns. */
export function prepareCraftedFirstStrike(player: Player, random: () => number = Math.random) {
  delete player.relicCounters[FIRST_STRIKE_COUNTER];
  const chances = player.relics.map(r => r.rpgInnate?.firstStrikeChance || 0).filter(n => n > 0);
  const chance = chances.length === 1 ? chances[0] : 1 - chances.reduce((chance, n) => chance * (1 - n), 1);
  if (chances.length && random() < chance) player.relicCounters[FIRST_STRIKE_COUNTER] = 1;
}

export function craftedFirstStrikeActive(player: Player) {
  return player.relicCounters[FIRST_STRIKE_COUNTER] === 1;
}

/** Consume at the start of the enemy phase, even when it contains multiple enemies. */
export function consumeCraftedFirstStrike(player: Player) {
  const active = craftedFirstStrikeActive(player);
  delete player.relicCounters[FIRST_STRIKE_COUNTER];
  return active;
}
