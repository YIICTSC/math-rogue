import type { Player } from '../types';
import { getMagicRomanceEndingText } from '../data/magicRomanceDialogue';
import { getMagicFriendshipRoutesForHero } from '../data/magicFriendshipRoutes';
import { MAGIC_HEROES, MAGIC_MALE_PROTAGONISTS, isMagicMaleProtagonist } from '../data/magicHeroes';
import { ROMANCE_TARGETS } from '../data/romanceTargets';

export interface MagicEndingPage {
  kind: 'romance' | 'double-romance' | 'friendship';
  title: string;
  description: string;
  lines: string[];
  voiceLines?: Array<{ heroId: string; lineId: string } | null>;
  imagePath: string;
  rankLabel: string;
  metricLabel: string;
}

const getRomanceCharacters = (heroId: string) => (
  isMagicMaleProtagonist(heroId) ? MAGIC_HEROES : ROMANCE_TARGETS
);

const getCharacterName = (id: string) =>
  MAGIC_HEROES.find((entry) => entry.id === id)?.name
  ?? MAGIC_MALE_PROTAGONISTS.find((entry) => entry.id === id)?.name
  ?? ROMANCE_TARGETS.find((entry) => entry.id === id)?.name
  ?? id;

const SPEAKER_NAME_TO_MAGIC_ID: Record<string, string> = {
  あかり: 'AKARI',
  しずく: 'SHIZUKU',
  ひより: 'HIYORI',
  つばさ: 'TSUBASA',
  れい: 'REI',
  まどか: 'MADOKA',
  こはる: 'KOHARU',
  みらい: 'MIRAI',
  セラ: 'SERA',
  蓮: 'REN',
  颯真: 'SOMA',
  湊: 'MINATO',
  理玖: 'RIKU',
  大和: 'YAMATO',
  レオン: 'LEON',
  エリオット: 'ELLIOT',
  朔夜: 'SAKUYA',
};

const hashEndingVoiceText = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = Math.imul(hash, 31) + value.charCodeAt(index);
    hash >>>= 0;
  }
  return hash.toString(36);
};

export const getMagicEndingVoiceLine = (line: string, fallbackHeroId?: string): { heroId: string; lineId: string } | null => {
  const match = line.match(/^([^「]+)「(.+)」$/);
  if (!match) {
    if (!fallbackHeroId) return null;
    return {
      heroId: fallbackHeroId,
      lineId: `ending-${hashEndingVoiceText(`${fallbackHeroId}:${line}`)}`,
    };
  }
  const heroId = SPEAKER_NAME_TO_MAGIC_ID[match[1].trim()];
  if (!heroId) return null;
  return {
    heroId,
    lineId: `ending-${hashEndingVoiceText(`${heroId}:${match[2]}`)}`,
  };
};

const getMagicEndingVoiceLines = (lines: string[], fallbackHeroId?: string) =>
  lines.map((line) => getMagicEndingVoiceLine(line, fallbackHeroId));

const getCompletedRomanceTargetIds = (player: Player, heroId: string) => {
  const progress = player.magicRomance;
  if (!progress) return [];
  const validTargetIds = new Set(getRomanceCharacters(heroId).map((entry) => entry.id));
  return Object.keys(progress.affection)
    .filter((targetId) =>
      validTargetIds.has(targetId)
      && (progress.affection[targetId] ?? 0) >= 100
      && (progress.stages[targetId] ?? 0) >= 5)
    .sort((left, right) => {
      const selectedDifference = (progress.selectedCounts[right] ?? 0) - (progress.selectedCounts[left] ?? 0);
      if (selectedDifference !== 0) return selectedDifference;
      return (progress.affection[right] ?? 0) - (progress.affection[left] ?? 0);
    });
};

const getBestRomanceTargetId = (player: Player, heroId: string) => {
  const progress = player.magicRomance;
  if (!progress) return null;
  const validTargetIds = new Set(getRomanceCharacters(heroId).map((entry) => entry.id));
  const ranked = Object.entries(progress.affection)
    .filter(([targetId, affection]) => validTargetIds.has(targetId) && affection > 0)
    .sort((left, right) => right[1] - left[1]);
  return ranked[0]?.[0] ?? null;
};

const getPairImagePath = (heroId: string, firstTargetId: string, secondTargetId: string) => {
  const targetOrder = getRomanceCharacters(heroId).map((entry) => entry.id);
  const pair = [firstTargetId, secondTargetId]
    .sort((left, right) => targetOrder.indexOf(left) - targetOrder.indexOf(right));
  const folder = isMagicMaleProtagonist(heroId) ? 'female' : 'male';
  return `sprites/magic/events/double-romance/${folder}/${pair.join('-')}.webp`;
};

const buildDoubleRomancePage = (
  heroId: string,
  firstTargetId: string,
  secondTargetId: string,
): MagicEndingPage => {
  const heroName = getCharacterName(heroId);
  const firstName = getCharacterName(firstTargetId);
  const secondName = getCharacterName(secondTargetId);
  const maleHero = isMagicMaleProtagonist(heroId);
  const firstEnding = getMagicRomanceEndingText(heroId, firstTargetId, 100);
  const secondEnding = getMagicRomanceEndingText(heroId, secondTargetId, 100);
  const lines = [
    firstEnding.lines[1],
    secondEnding.lines[1],
    firstEnding.lines[0],
    maleHero
      ? `${firstName}と${secondName}は互いを見つめ、それから同時に${heroName}へ詰め寄った。`
      : `${firstName}と${secondName}は互いに視線をぶつけ、同時に${heroName}との距離を詰めた。`,
  ];

  return {
    kind: 'double-romance',
    title: `${firstName}と${secondName}、譲れない告白`,
    description: `決戦後、${heroName}を呼び止めた二人は、互いの想いが同じ強さだと知る。好意を曖昧にしないため、二人は正面から答えを求めた。`,
    lines,
    voiceLines: getMagicEndingVoiceLines(lines, heroId),
    imagePath: getPairImagePath(heroId, firstTargetId, secondTargetId),
    rankLabel: '二股エンド',
    metricLabel: '好感度 100 / 100 × 2',
  };
};

export const getMagicEndingPages = (player: Player, heroId: string): MagicEndingPage[] => {
  const pages: MagicEndingPage[] = [];
  const completedRomanceTargetIds = getCompletedRomanceTargetIds(player, heroId);

  if (completedRomanceTargetIds.length >= 2) {
    pages.push(buildDoubleRomancePage(
      heroId,
      completedRomanceTargetIds[0],
      completedRomanceTargetIds[1],
    ));
  } else {
    const targetId = completedRomanceTargetIds[0] ?? getBestRomanceTargetId(player, heroId);
    if (targetId) {
      const affection = player.magicRomance?.affection[targetId] ?? 0;
      const ending = getMagicRomanceEndingText(heroId, targetId, affection);
      pages.push({
        kind: 'romance',
        title: ending.title,
        description: ending.description,
        lines: ending.lines,
        voiceLines: getMagicEndingVoiceLines(ending.lines, heroId),
        imagePath: ending.imagePath,
        rankLabel: ending.rankLabel,
        metricLabel: `好感度 ${affection}`,
      });
    }
  }

  const progress = player.magicRomance;
  getMagicFriendshipRoutesForHero(heroId)
    .filter((route) =>
      (progress?.affection[route.id] ?? 0) >= 100
      && (progress?.stages[route.id] ?? 0) >= 2)
    .forEach((route) => {
      const friendName = getCharacterName(route.friendHeroId);
      pages.push({
        kind: 'friendship',
        title: route.endingTitle,
        description: route.endingText,
        lines: [
          `${getCharacterName(heroId)}と${friendName}は、戦いが終わっても変わらない約束を交わした。`,
          `恋とは違う。それでも何度でも選び直したい、大切な友情の未来だった。`,
        ],
        voiceLines: [
          getMagicEndingVoiceLine(`${getCharacterName(heroId)}と${friendName}は、戦いが終わっても変わらない約束を交わした。`, heroId),
          getMagicEndingVoiceLine(`恋とは違う。それでも何度でも選び直したい、大切な友情の未来だった。`, heroId),
        ],
        imagePath: `sprites/magic/events/friendship/${route.heroId}/${route.friendHeroId}/event.webp`,
        rankLabel: '友情エンド',
        metricLabel: '絆 100 / 100',
      });
    });

  return pages;
};

export const hasMagicEnding = (player: Player, heroId: string) =>
  getMagicEndingPages(player, heroId).length > 0;
