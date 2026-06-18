import type React from 'react';
import type { GameState, MagicRomanceProgress, Player } from '../types';
import { getUpgradedCard } from '../utils/cardUtils';
import { ROMANCE_TARGETS } from '../data/romanceTargets';
import { getMagicRomanceDialogue, type MagicRomanceRewardKind } from '../data/magicRomanceDialogue';
import { MAGIC_HEROES, MAGIC_MALE_PROTAGONISTS, isMagicMaleProtagonist } from '../data/magicHeroes';
import { getMagicFriendshipRoutesForHero, type MagicFriendshipRoute } from '../data/magicFriendshipRoutes';

interface MagicEventOption {
  label: string;
  text: string;
  action: () => void;
}

export interface MagicEventVoiceLine {
  heroId: string;
  lineId: string;
}

export interface MagicRomanceGameEvent {
  title: string;
  description: string;
  options: MagicEventOption[];
  imageKey?: string;
  voiceLines?: MagicEventVoiceLine[];
}

const createEmptyProgress = (): MagicRomanceProgress => ({
  affection: {},
  stages: {},
  selectedCounts: {},
  completedEventIds: [],
});

const getProgress = (player: Player) => player.magicRomance ?? createEmptyProgress();
const REQUIRED_ACT_BY_STAGE = [1, 1, 2, 3, 3] as const;
const getMagicCharacterName = (id: string) =>
  MAGIC_HEROES.find((hero) => hero.id === id)?.name
  ?? MAGIC_MALE_PROTAGONISTS.find((hero) => hero.id === id)?.name
  ?? id;

interface MagicRomanceCandidate {
  id: string;
  name: string;
  role: string;
  specialty: string;
}

const getRomanceCandidates = (heroId: string): MagicRomanceCandidate[] => {
  if (isMagicMaleProtagonist(heroId)) {
    return MAGIC_HEROES.map((hero) => ({
      id: hero.id,
      name: hero.name,
      role: hero.transformedTitle,
      specialty: hero.specialty,
    }));
  }
  return ROMANCE_TARGETS;
};

const getRomanceCandidate = (heroId: string, targetId: string) =>
  getRomanceCandidates(heroId).find((entry) => entry.id === targetId)
    ?? getRomanceCandidates(heroId)[0];

const getRomanceImageKey = (heroId: string, targetId: string, stage: number) =>
  isMagicMaleProtagonist(heroId)
    ? `magic-romance:${targetId}:${heroId}:r${stage}`
    : `magic-romance:${heroId}:${targetId}:r${stage}`;

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

export const getMagicRomanceVoiceLines = (heroId: string, targetId: string, stageIndex: number, description: string): MagicEventVoiceLine[] => {
  const linePrefix = `romance-${heroId}-${targetId}-r${stageIndex + 1}`.toLowerCase();
  return description
    .split('\n')
    .map((line) => line.match(/^([^「]+)「(.+)」$/))
    .filter((match): match is RegExpMatchArray => !!match)
    .map((match, index) => ({
      heroId: SPEAKER_NAME_TO_MAGIC_ID[match[1].trim()] ?? heroId,
      lineId: `${linePrefix}-${index + 1}`,
    }));
};

export const getBestMagicRomanceTargetId = (player: Player, heroId?: string): string | null => {
  const affection = getProgress(player).affection;
  const validTargetIds = new Set(getRomanceCandidates(heroId ?? player.magicProtagonistId ?? 'AKARI').map((entry) => entry.id));
  const ranked = Object.entries(affection)
    .filter(([targetId]) => validTargetIds.has(targetId))
    .sort((a, b) => b[1] - a[1]);
  return ranked.length > 0 && ranked[0][1] > 0 ? ranked[0][0] : null;
};

const weightedTargetSelection = (player: Player, heroId: string, count: number) => {
  const progress = getProgress(player);
  const createCandidates = (targets: MagicRomanceCandidate[]) => targets.map((target) => {
    const selected = progress.selectedCounts[target.id] ?? 0;
    const affection = progress.affection[target.id] ?? 0;
    return {
      target,
      weight: selected > 0 ? 4 + selected * 2 + Math.floor(affection / 20) : 1,
    };
  });
  const romanceCandidates = getRomanceCandidates(heroId);
  const incompleteTargets = romanceCandidates.filter((target) => (progress.stages[target.id] ?? 0) < 5);
  const completedTargets = romanceCandidates.filter((target) => (progress.stages[target.id] ?? 0) >= 5);
  const candidates = createCandidates(incompleteTargets);
  const selected: MagicRomanceCandidate[] = [];

  while (selected.length < count && candidates.length > 0) {
    const totalWeight = candidates.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * totalWeight;
    let pickedIndex = candidates.length - 1;
    for (let index = 0; index < candidates.length; index++) {
      roll -= candidates[index].weight;
      if (roll <= 0) {
        pickedIndex = index;
        break;
      }
    }
    selected.push(candidates[pickedIndex].target);
    candidates.splice(pickedIndex, 1);
  }

  if (selected.length < count) {
    const remainingCompleted = createCandidates(completedTargets);
    while (selected.length < count && remainingCompleted.length > 0) {
      const totalWeight = remainingCompleted.reduce((sum, entry) => sum + entry.weight, 0);
      let roll = Math.random() * totalWeight;
      let pickedIndex = remainingCompleted.length - 1;
      for (let index = 0; index < remainingCompleted.length; index++) {
        roll -= remainingCompleted[index].weight;
        if (roll <= 0) {
          pickedIndex = index;
          break;
        }
      }
      selected.push(remainingCompleted[pickedIndex].target);
      remainingCompleted.splice(pickedIndex, 1);
    }
  }

  return selected;
};

const weightedFriendshipRouteSelection = (player: Player, heroId: string, count: number) => {
  const progress = getProgress(player);
  const routes = getMagicFriendshipRoutesForHero(heroId);
  const candidates = routes.map((route) => {
    const selected = progress.selectedCounts[route.id] ?? 0;
    const bond = progress.affection[route.id] ?? 0;
    return {
      route,
      weight: selected > 0 ? 5 + selected * 2 + Math.floor(bond / 20) : 2,
    };
  });
  const selected: MagicFriendshipRoute[] = [];

  while (selected.length < count && candidates.length > 0) {
    const totalWeight = candidates.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * totalWeight;
    let pickedIndex = candidates.length - 1;
    for (let index = 0; index < candidates.length; index++) {
      roll -= candidates[index].weight;
      if (roll <= 0) {
        pickedIndex = index;
        break;
      }
    }
    selected.push(candidates[pickedIndex].route);
    candidates.splice(pickedIndex, 1);
  }

  return selected;
};

const applyReward = (
  player: Player,
  rewardKind: MagicRomanceRewardKind,
  rewardAmount: number,
  seed: string,
): { player: Player; message: string } => {
  if (rewardKind === 'upgrade') {
    const upgradeable = player.deck.filter((card) => !card.upgraded);
    if (upgradeable.length === 0) {
      return {
        player: { ...player, gold: player.gold + 25 },
        message: '強化できるカードがなかったため、魔法学園の協力費25Gを得た。',
      };
    }
    const hash = [...seed].reduce((value, char) => value * 31 + char.charCodeAt(0), 0);
    const target = upgradeable[Math.abs(hash) % upgradeable.length];
    return {
      player: {
        ...player,
        deck: player.deck.map((card) => card.id === target.id ? getUpgradedCard(card) : card),
      },
      message: `「${target.name}」が強化された。`,
    };
  }
  if (rewardKind === 'maxHp') {
    return {
      player: {
        ...player,
        maxHp: player.maxHp + rewardAmount,
        currentHp: player.currentHp + rewardAmount,
      },
      message: `最大HPが${rewardAmount}上がった。`,
    };
  }
  if (rewardKind === 'heal') {
    return {
      player: {
        ...player,
        currentHp: Math.min(player.maxHp, player.currentHp + rewardAmount),
      },
      message: `HPが${rewardAmount}回復した。`,
    };
  }
  if (rewardKind === 'gold') {
    return {
      player: { ...player, gold: player.gold + rewardAmount },
      message: `${rewardAmount}Gを得た。`,
    };
  }
  return {
    player: {
      ...player,
      relicCounters: {
        ...player.relicCounters,
        EVENT_STRENGTH_BONUS: (player.relicCounters.EVENT_STRENGTH_BONUS ?? 0) + rewardAmount,
      },
    },
    message: `戦闘開始時の恒久ムキムキが${rewardAmount}増えた。`,
  };
};

const buildDialogueEvent = (
  heroId: string,
  targetId: string,
  stageIndex: number,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  setEventResultLog: (log: string | null) => void,
): MagicRomanceGameEvent => {
  const dialogue = getMagicRomanceDialogue(heroId, targetId, stageIndex);
  const target = getRomanceCandidate(heroId, targetId);

  return {
    title: dialogue.title,
    description: dialogue.description,
    imageKey: getRomanceImageKey(heroId, targetId, stageIndex + 1),
    voiceLines: getMagicRomanceVoiceLines(heroId, targetId, stageIndex, dialogue.description),
    options: dialogue.choices.map((choice, choiceIndex) => ({
      label: choice.label,
      text: `好感度+${choice.affectionGain}`,
      action: () => {
        let rewardMessage = '';
        setGameState((prev) => {
          const progress = getProgress(prev.player);
          const currentStage = Math.min(4, progress.stages[targetId] ?? 0);
          const reward = applyReward(
            prev.player,
            choice.rewardKind,
            choice.rewardAmount,
            `${heroId}-${targetId}-${currentStage}-${choiceIndex}`,
          );
          const eventId = `${heroId}_${targetId}_r${currentStage + 1}`;
          rewardMessage = reward.message;
          return {
            ...prev,
            player: {
              ...reward.player,
              magicRomance: {
                affection: {
                  ...progress.affection,
                  [targetId]: Math.min(100, (progress.affection[targetId] ?? 0) + choice.affectionGain),
                },
                stages: {
                  ...progress.stages,
                  [targetId]: Math.min(5, currentStage + 1),
                },
                selectedCounts: { ...progress.selectedCounts },
                completedEventIds: progress.completedEventIds.includes(eventId)
                  ? progress.completedEventIds
                  : [...progress.completedEventIds, eventId],
              },
            },
          };
        });
        setEventResultLog(`${target.name} 好感度+${choice.affectionGain}\n${choice.response}\n${rewardMessage}`);
      },
    })),
  };
};

const buildCompletedRouteEvent = (
  heroId: string,
  targetId: string,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  setEventResultLog: (log: string | null) => void,
): MagicRomanceGameEvent => {
  const dialogue = getMagicRomanceDialogue(heroId, targetId, 4);
  const target = getRomanceCandidate(heroId, targetId);
  const choices = [
    { label: '一緒に帰る', rewardKind: 'heal' as const, rewardAmount: 10, text: 'HPを10回復' },
    { label: '次の任務を相談する', rewardKind: 'gold' as const, rewardAmount: 20, text: '20Gを得る' },
    { label: '勉強の続きをする', rewardKind: 'upgrade' as const, rewardAmount: 1, text: 'カードを1枚強化' },
  ];

  return {
    title: `${target.name}・約束の続き`,
    description: `${dialogue.description}\n\n五つの大切な時間を重ねた二人には、もう言葉に迷う距離はなかった。`,
    imageKey: getRomanceImageKey(heroId, targetId, 5),
    voiceLines: getMagicRomanceVoiceLines(heroId, targetId, 4, dialogue.description),
    options: choices.map((choice, choiceIndex) => ({
      label: choice.label,
      text: `5段階完了 / ${choice.text}`,
      action: () => {
        let rewardMessage = '';
        setGameState((prev) => {
          const reward = applyReward(
            prev.player,
            choice.rewardKind,
            choice.rewardAmount,
            `${heroId}-${targetId}-complete-${choiceIndex}`,
          );
          rewardMessage = reward.message;
          return { ...prev, player: reward.player };
        });
        setEventResultLog(`${target.name}との五つの物語を越え、穏やかな時間を過ごした。\n好感度は変化しない。\n${rewardMessage}`);
      },
    })),
  };
};

const buildFriendshipRouteEvent = (
  route: MagicFriendshipRoute,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  setEventResultLog: (log: string | null) => void,
): MagicRomanceGameEvent => {
  const friendName = getMagicCharacterName(route.friendHeroId);
  const choices = [
    { label: '本音を聞く', rewardKind: 'maxHp' as const, rewardAmount: 4, bondGain: 18, text: '絆+18 / 最大HP+4' },
    { label: '連携を練習する', rewardKind: 'upgrade' as const, rewardAmount: 1, bondGain: 15, text: '絆+15 / カードを1枚強化' },
    { label: '一緒に休む', rewardKind: 'heal' as const, rewardAmount: 14, bondGain: 12, text: '絆+12 / HPを14回復' },
  ];

  return {
    title: route.eventTitle,
    description: `${route.eventSummary}\n\n${friendName}との絆が、恋とは違う強さで胸に灯る。`,
    imageKey: route.imageKey,
    options: choices.map((choice, choiceIndex) => ({
      label: choice.label,
      text: choice.text,
      action: () => {
        let rewardMessage = '';
        setGameState((prev) => {
          const progress = getProgress(prev.player);
          const currentStage = progress.stages[route.id] ?? 0;
          const reward = applyReward(
            prev.player,
            choice.rewardKind,
            choice.rewardAmount,
            `${route.id}-friendship-${currentStage}-${choiceIndex}`,
          );
          rewardMessage = reward.message;
          return {
            ...prev,
            player: {
              ...reward.player,
              magicRomance: {
                affection: {
                  ...progress.affection,
                  [route.id]: Math.min(100, (progress.affection[route.id] ?? 0) + choice.bondGain),
                },
                stages: {
                  ...progress.stages,
                  [route.id]: Math.min(2, currentStage + 1),
                },
                selectedCounts: { ...progress.selectedCounts },
                completedEventIds: progress.completedEventIds.includes(route.id)
                  ? progress.completedEventIds
                  : [...progress.completedEventIds, route.id],
              },
            },
          };
        });
        setEventResultLog(`${friendName} 絆+${choice.bondGain}\n${route.endingText}\n${rewardMessage}`);
      },
    })),
  };
};

const buildFriendshipEndingEvent = (
  route: MagicFriendshipRoute,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  setEventResultLog: (log: string | null) => void,
): MagicRomanceGameEvent => {
  const friendName = getMagicCharacterName(route.friendHeroId);
  const choices = [
    { label: '親友の証を結ぶ', rewardKind: 'maxHp' as const, rewardAmount: 6, text: '最大HP+6' },
    { label: '相棒技を磨く', rewardKind: 'upgrade' as const, rewardAmount: 1, text: 'カードを1枚強化' },
    { label: '次の任務を約束する', rewardKind: 'gold' as const, rewardAmount: 30, text: '30Gを得る' },
  ];

  return {
    title: route.endingTitle,
    description: `${route.endingText}\n\nこれは恋愛ではなく、何周しても選び直したくなる友情の終着点だ。`,
    imageKey: route.imageKey,
    options: choices.map((choice, choiceIndex) => ({
      label: choice.label,
      text: `友情ルート完了 / ${choice.text}`,
      action: () => {
        let rewardMessage = '';
        setGameState((prev) => {
          const reward = applyReward(
            prev.player,
            choice.rewardKind,
            choice.rewardAmount,
            `${route.id}-friendship-ending-${choiceIndex}`,
          );
          rewardMessage = reward.message;
          return { ...prev, player: reward.player };
        });
        setEventResultLog(`${friendName}との友情ルートを確認した。\n${rewardMessage}`);
      },
    })),
  };
};

const buildChapterWaitEvent = (
  heroId: string,
  targetId: string,
  stageIndex: number,
  requiredAct: number,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  setEventResultLog: (log: string | null) => void,
): MagicRomanceGameEvent => {
  const target = getRomanceCandidate(heroId, targetId);
  const previousStage = Math.max(0, stageIndex - 1);
  const dialogue = getMagicRomanceDialogue(heroId, targetId, previousStage);
  const choices = [
    { label: '一緒に復習する', rewardKind: 'upgrade' as const, rewardAmount: 1, text: 'カードを1枚強化' },
    { label: '魔力を整える', rewardKind: 'heal' as const, rewardAmount: 10, text: 'HPを10回復' },
    { label: '購買へ寄る', rewardKind: 'gold' as const, rewardAmount: 18, text: '18Gを得る' },
  ];

  return {
    title: `${target.name}・次の季節を待ちながら`,
    description: `${dialogue.description}\n\n二人の関係は確かに進んでいる。けれど、次の出来事が動き出すのは第${requiredAct}章からだ。今日は焦らず、いつもの学園生活を一緒に過ごすことにした。`,
    imageKey: getRomanceImageKey(heroId, targetId, previousStage + 1),
    voiceLines: getMagicRomanceVoiceLines(heroId, targetId, previousStage, dialogue.description),
    options: choices.map((choice, choiceIndex) => ({
      label: choice.label,
      text: `段階維持 / ${choice.text}`,
      action: () => {
        let rewardMessage = '';
        setGameState((prev) => {
          const reward = applyReward(
            prev.player,
            choice.rewardKind,
            choice.rewardAmount,
            `${heroId}-${targetId}-act-wait-${stageIndex}-${choiceIndex}`,
          );
          rewardMessage = reward.message;
          return { ...prev, player: reward.player };
        });
        setEventResultLog(`${target.name}と穏やかな放課後を過ごした。\n次の恋愛イベントは第${requiredAct}章で解放される。\n${rewardMessage}`);
      },
    })),
  };
};

export const generateMagicRomanceSelectionEvent = (
  player: Player,
  heroId: string,
  currentAct: number,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  setEventData: (event: MagicRomanceGameEvent) => void,
  setEventResultLog: (log: string | null) => void,
  debugOptions?: {
    showAllRomanceCandidates?: boolean;
    showAllFriendshipCandidates?: boolean;
  },
): MagicRomanceGameEvent => {
  const targets = debugOptions?.showAllRomanceCandidates
    ? getRomanceCandidates(heroId)
    : weightedTargetSelection(player, heroId, 2);
  const friendshipRoutes = debugOptions?.showAllFriendshipCandidates
    ? getMagicFriendshipRoutesForHero(heroId)
    : weightedFriendshipRouteSelection(player, heroId, 1);
  return {
    title: '放課後、誰と過ごす？',
    description: '授業と魔法訓練の合間に、少しだけ自由な時間ができた。\n恋の相手、あるいは親友として絆を深める相手を選ぼう。以前選んだ相手は、次から候補に現れやすくなる。',
    imageKey: 'magic-romance-select',
    options: [
      ...targets.map((target) => ({
      label: `${target.name}（${target.role}）`,
      text: (() => {
        const progress = getProgress(player);
        const affection = progress.affection[target.id] ?? 0;
        const stage = progress.stages[target.id] ?? 0;
        const requiredAct = REQUIRED_ACT_BY_STAGE[Math.min(4, stage)];
        return stage >= 5
          ? `好感度 ${affection}/100 / 5段階完了`
          : currentAct < requiredAct
            ? `好感度 ${affection}/100 / 第${requiredAct}章で第${stage + 1}段階解放`
          : `好感度 ${affection}/100 / 第${stage + 1}段階 / ${target.specialty}`;
      })(),
      action: () => {
        setEventResultLog(null);
        setGameState((prev) => {
          const progress = getProgress(prev.player);
          return {
            ...prev,
            currentEventTitle: `${target.name}との放課後`,
            player: {
              ...prev.player,
              magicRomance: {
                ...progress,
                selectedCounts: {
                  ...progress.selectedCounts,
                  [target.id]: (progress.selectedCounts[target.id] ?? 0) + 1,
                },
              },
            },
          };
        });
        const stage = getProgress(player).stages[target.id] ?? 0;
        const requiredAct = REQUIRED_ACT_BY_STAGE[Math.min(4, stage)];
        setEventData(
          stage >= 5
            ? buildCompletedRouteEvent(heroId, target.id, setGameState, setEventResultLog)
            : currentAct < requiredAct
              ? buildChapterWaitEvent(
                  heroId,
                  target.id,
                  stage,
                  requiredAct,
                  setGameState,
                  setEventResultLog,
                )
              : buildDialogueEvent(heroId, target.id, stage, setGameState, setEventResultLog),
        );
      },
    })),
      ...friendshipRoutes.map((route) => {
        const friendName = getMagicCharacterName(route.friendHeroId);
        const progress = getProgress(player);
        const bond = progress.affection[route.id] ?? 0;
        const stage = progress.stages[route.id] ?? 0;
        return {
          label: `${friendName}（友情）`,
          text: stage >= 2 ? `絆 ${bond}/100 / 友情エンド解放済み` : `絆 ${bond}/100 / ${route.theme}`,
          action: () => {
            setEventResultLog(null);
            setGameState((prev) => {
              const nextProgress = getProgress(prev.player);
              return {
                ...prev,
                currentEventTitle: `${friendName}との友情`,
                player: {
                  ...prev.player,
                  magicRomance: {
                    ...nextProgress,
                    selectedCounts: {
                      ...nextProgress.selectedCounts,
                      [route.id]: (nextProgress.selectedCounts[route.id] ?? 0) + 1,
                    },
                  },
                },
              };
            });
            setEventData(stage >= 2
              ? buildFriendshipEndingEvent(route, setGameState, setEventResultLog)
              : buildFriendshipRouteEvent(route, setGameState, setEventResultLog));
          },
        };
      }),
    ],
  };
};
