import type { Good, Slot, Text } from './content';
import { forgeGear } from './inventory';
import { awardExperience, awardInspiration, note, type Adventure } from './state';

type Badge = {
  name: Text;
  goal: Text;
  base: number;
  score: (state: Adventure) => number;
  prize: Good | Slot;
};
export const BADGES = {
  roads: {
    name: ['街道の案内人', 'Road Guide'],
    goal: ['新しい町を訪れる', 'Visit new towns'],
    base: 4,
    score: (s) => Object.keys(s.knownTowns).length - 1,
    prize: 'lantern',
  },
  chronicles: {
    name: ['郷土の記録者', 'Local Chronicler'],
    goal: ['名所を発見し、町の出来事を解決', 'Discover landmarks or resolve town stories'],
    base: 3,
    score: (s) =>
      s.counters.landmarks + Object.values(s.townTales).filter((tale) => tale.boon).length,
    prize: 'relic',
  },
  towns: {
    name: ['みんなの働き手', 'Hometown Helper'],
    goal: ['働く・町の依頼を終える', 'Work shifts or complete commissions'],
    base: 5,
    score: (s) => s.counters.jobs + s.counters.contracts * 2,
    prize: 'ration',
  },
  harvest: {
    name: ['実りを育てる人', 'Keeper of Gardens'],
    goal: ['畑から収穫する', 'Harvest garden plots'],
    base: 3,
    score: (s) => s.counters.harvests,
    prize: 'seed',
  },
  gear: {
    name: ['自前の道具職人', 'Independent Artificer'],
    goal: ['料理・調合・装備製作をする', 'Cook, brew, or forge gear'],
    base: 4,
    score: (s) => s.counters.crafted,
    prize: 'ore',
  },
  ruin: {
    name: ['遺跡の踏破者', 'Ruin Pathfinder'],
    goal: ['守護者を越えて通行の証を得る', 'Earn passage from guardians'],
    base: 2,
    score: (s) => s.counters.guardians,
    prize: 'coat',
  },
  accord: {
    name: ['境界の仲裁者', 'Boundary Mediator'],
    goal: [
      '町の友達を増やす・遺跡で交渉を成功させる',
      'Make friends or settle encounters by parley',
    ],
    base: 3,
    score: (s) =>
      s.counters.pacified + Object.values(s.friends).filter((friend) => friend.trust >= 4).length,
    prize: 'charm',
  },
  wanderer: {
    name: ['世界渡り', 'Realm Walker'],
    goal: ['新しい世界へ渡る', 'Cross into new realms'],
    base: 2,
    score: (s) => Object.keys(s.gates).length - 1,
    prize: 'weapon',
  },
} satisfies Record<string, Badge>;
export type BadgeId = keyof typeof BADGES;

export function badgeProgress(s: Adventure, id: BadgeId) {
  const badge = BADGES[id];
  const rank = (s.badges[id] ?? 0) + 1;
  return { rank, current: badge.score(s), target: badge.base * rank };
}

export function claimBadge(s: Adventure, id: BadgeId) {
  if (!Object.hasOwn(BADGES, id)) return false;
  const badge = BADGES[id];
  const { rank, current, target } = badgeProgress(s, id);
  if (current < target) return false;
  s.badges[id] = rank;
  s.gold += 12 + rank * 6;
  const prize = badge.prize;
  if (prize === 'weapon' || prize === 'coat' || prize === 'charm')
    forgeGear(s, rank * 3, rank >= 4 ? 3 : 1, prize);
  else s.goods[prize] += Math.min(8, rank + 2);
  awardExperience(s, 8 + rank * 3);
  awardInspiration(s);
  note(
    s,
    [
      `「${badge.name[0]}」の称号を獲得した。第${rank}段。`,
      `Earned ${badge.name[1]}, rank ${rank}.`,
    ],
    'good',
  );
  return true;
}
