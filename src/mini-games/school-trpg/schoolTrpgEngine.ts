import {
  SCHOOL_TRPG_EVENTS,
  SCHOOL_TRPG_REWARDS,
  getTrpgEnding,
  getTrpgEvent,
  getTrpgLocation,
  getTrpgChapterEvents,
  getTrpgChapterEndings,
  getTrpgChapterLocations,
  getTrpgChapterMeta,
  getTrpgChapterRewards,
} from './schoolTrpgData';
import {
  trpgCopy,
  type TrpgCampaignState,
  type TrpgCheckGrade,
  type TrpgCombatActionId,
  type TrpgCombatResolution,
  type TrpgCombatState,
  type TrpgCopy,
  type TrpgChoice,
  type TrpgQuestionGateId,
  type TrpgReward,
  type TrpgLocationVisitState,
} from './schoolTrpgTypes';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const unique = <T,>(values: T[]) => Array.from(new Set(values));

const rewardUsedFlag = (rewardId: string) => `usedReward.${rewardId}`;

const claimRewardEffect = (state: TrpgCampaignState, kind: TrpgReward['effect']['kind']) => {
  const reward = state.inventory
    .map(rewardId => SCHOOL_TRPG_REWARDS.find(candidate => candidate.id === rewardId))
    .find(candidate => candidate
      && candidate.effect.kind === kind
      && (candidate.useChapter ?? ((candidate.chapter || 0) + 1)) === state.chapter
      && !state.flags[rewardUsedFlag(candidate.id)]);
  if (!reward) return { amount: 0, reward: null, flags: state.flags, log: [] as TrpgCopy[] };
  return {
    amount: reward.effect.amount,
    reward,
    flags: { ...state.flags, [rewardUsedFlag(reward.id)]: true },
    log: [trpgCopy(
      `発見物「${reward.name.ja}」を使用した。${reward.useCopy.ja}`,
      `はっけんぶつ「${reward.name.hira}」をしようした。${reward.useCopy.hira}`,
      `Used ${reward.name.en}. ${reward.useCopy.en}`,
    )],
  };
};

const randomAt = (seed: number, step: number) => {
  let value = (seed + Math.imul(step + 1, 0x6d2b79f5)) | 0;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
};

const rollD6 = (state: TrpgCampaignState) => ({
  roll: Math.floor(randomAt(state.seed, state.rngStep) * 6) + 1,
  rngStep: state.rngStep + 1,
});

type SchoolTrpgCombatMode = NonNullable<TrpgCombatState['mode']>;

const combatModeForChapter = (chapter: number): SchoolTrpgCombatMode =>
  (['DUEL', 'RITUAL', 'DEFENSE', 'CHASE', 'PARADOX', 'ECHO'] as const)[Math.max(0, chapter) % 6];

/**
 * Strong stats should improve a route without turning every later check into a
 * foregone conclusion. The target rises gradually with both mastery and
 * chapter depth, while remaining visible to the player before committing.
 */
export const getSchoolTrpgChoiceTarget = (state: TrpgCampaignState, choice: TrpgChoice) => {
  const masteryPressure = Math.min(2, Math.max(0, state.stats[choice.stat] - 4));
  const chapterPressure = Math.min(1, Math.max(0, state.chapter - 1));
  return choice.difficulty + masteryPressure + chapterPressure;
};

const getActiveSchoolTrpgEvent = (state: TrpgCampaignState) => {
  const event = getTrpgEvent(state.currentEventId || '');
  return state.currentEventVariant === 'REVISIT' ? event?.revisit || event : event;
};

/** UI-facing resolver so event and result screens render the same revisit beat. */
export const getSchoolTrpgEventForState = (state: TrpgCampaignState) => getActiveSchoolTrpgEvent(state);

export const reconcileSchoolTrpgUnlocks = (state: TrpgCampaignState): TrpgCampaignState => {
  const completed = new Set(state.completedEventIds);
  const questions = new Set(state.completedQuestionGates);
  const chapter = Number.isInteger(state.chapter) ? state.chapter : 0;
  const chapterLocations = getTrpgChapterLocations(chapter);
  const chapterEvents = getTrpgChapterEvents(chapter);
  const unlocked = chapterLocations[0] ? [chapterLocations[0].id] : [];
  const completedEvent = (index: number) => Boolean(chapterEvents[index] && completed.has(chapterEvents[index].id));
  if (chapter === 1 && completedEvent(0)) {
    // Chapter 1 is the first authored fork: the opening choice decides which
    // investigation is available first instead of presenting two identical
    // map buttons at once. A setback opens the alternate branch; a clear
    // result can skip it and go straight to the archive.
    const preferredIndex = state.flags.routeChapter1 === 'ALLY' ? 2 : 1;
    unlocked.push(chapterLocations[preferredIndex]?.id);
    if (state.flags.chapter1OpenAlternate) {
      unlocked.push(chapterLocations[preferredIndex === 1 ? 2 : 1]?.id);
    }
    if (state.flags.chapter1Shortcut) unlocked.push(chapterLocations[3]?.id);
  } else if (completedEvent(0)) {
    unlocked.push(...chapterLocations.slice(1, 3).map(location => location.id));
  }
  if (completedEvent(1) && completedEvent(2)) unlocked.push(chapterLocations[3]?.id);
  if (chapter === 1 && (completedEvent(1) || completedEvent(2)) && state.flags.chapter1OpenAlternate) {
    unlocked.push(chapterLocations[1]?.id, chapterLocations[2]?.id);
  }
  const gateEvent = chapterEvents[3];
  if (completedEvent(3) && (!gateEvent.questionGate || questions.has(gateEvent.questionGate))) unlocked.push(chapterLocations[4]?.id);
  if (completedEvent(4)) unlocked.push(chapterLocations[5]?.id);
  const safeUnlocked = unlocked.filter((locationId): locationId is string => Boolean(locationId));
  if (chapter === 5 && state.flags.hiddenKey) {
    safeUnlocked.push(...chapterLocations.map(location => location.id));
  }
  return { ...state, chapter, unlockedLocationIds: unique([...state.unlockedLocationIds, ...safeUnlocked]) };
};

export const createSchoolTrpgCampaign = (seed = Date.now()): TrpgCampaignState => ({
  version: 1,
  seed,
  rngStep: 0,
  phase: 'MAP',
  chapter: 0,
  time: 0,
  stress: 0,
  fate: 2,
  clues: 0,
  stats: { study: 2, energy: 2, friendship: 2, courage: 2 },
  flags: {},
  inventory: [],
  unlockedLocationIds: ['classroom'],
  locationStates: { classroom: 'UNVISITED' },
  completedEventIds: [],
  currentLocationId: 'classroom',
  currentEventId: null,
  pendingQuestionGate: null,
  completedQuestionGates: [],
  result: null,
  combat: null,
  selectedRewardId: null,
  endingId: null,
  endingHistory: [],
  discoveryLog: [trpgCopy('消えた校章の調査を開始した。', 'きえたこうしょうのちょうさをかいしした。', 'The investigation into the missing emblem has begun.')],
});

export const beginSchoolTrpgEvent = (state: TrpgCampaignState, locationId: string): TrpgCampaignState => {
  const location = getTrpgLocation(locationId);
  if (!location || !state.unlockedLocationIds.includes(locationId)) return state;
  const sourceEvent = getTrpgEvent(location.eventId);
  if (state.completedEventIds.includes(location.eventId)) {
    if (!sourceEvent?.revisit) return { ...state, currentLocationId: locationId };
    return {
      ...state,
      phase: 'EVENT',
      currentLocationId: locationId,
      currentEventId: location.eventId,
      currentEventVariant: 'REVISIT',
      locationStates: { ...(state.locationStates || {}), [location.id]: 'ALTERED' },
      result: null,
      discoveryLog: [...state.discoveryLog, trpgCopy(
        `${location.name.ja}を再調査し、前回の選択で変化した痕跡を確認する。`,
        `${location.name.hira}をさいちょうさし、ぜんかいのせんたくでへんかしたこんせきをかくにんする。`,
        `Revisit ${location.name.en} to inspect traces changed by the previous choice.`,
      )].slice(-18),
    };
  }
  const travelEffect = claimRewardEffect(state, 'TRAVEL_TIME');
  return {
    ...state,
    flags: travelEffect.flags,
    phase: 'EVENT',
    currentLocationId: locationId,
    currentEventId: location.eventId,
    currentEventVariant: 'PRIMARY',
    locationStates: { ...(state.locationStates || {}), [location.id]: 'SEEN' },
    time: state.time + Math.max(0, location.travelCost - travelEffect.amount),
    result: null,
    discoveryLog: [...state.discoveryLog, ...travelEffect.log].slice(-18),
  };
};

/**
 * Rest on the route map to keep fatigue from becoming a dead end. A rest
 * costs one in-game hour and recovers up to two stress points; it is only
 * available while planning the next location.
 */
export const recoverSchoolTrpgStress = (state: TrpgCampaignState): TrpgCampaignState => {
  if (state.phase !== 'MAP' || state.stress <= 0) return state;
  const recovered = Math.min(2, state.stress);
  return {
    ...state,
    time: state.time + 1,
    stress: state.stress - recovered,
    discoveryLog: [
      ...state.discoveryLog,
      trpgCopy(
        `静かな休憩で疲労が${recovered}回復した。次の航路へ進める。`,
        `しずかなきゅうけいでひろうが${recovered}かいふくした。つぎのこうろへすすめる。`,
        `A quiet rest recovers ${recovered} stress. You are ready for the next route.`,
      ),
    ].slice(-18),
  };
};

const createGuardianCombat = (state: TrpgCampaignState, insightBonus = 0, resolveBonus = 0): TrpgCombatState => {
  const observed = Boolean(state.flags.observedGuardian);
  const knowsWeakness = Boolean(state.flags.knowsWeakness);
  const alliance = Boolean(state.flags.rivalAlliance);
  const mode = state.chapter === 1 && state.flags.routeChapter1 === 'ASTRAL'
    ? 'CHASE'
    : state.chapter === 1 && state.flags.routeChapter1 === 'ALLY'
      ? 'DEFENSE'
      : combatModeForChapter(state.chapter);
  const chapterKey = `chapter${state.chapter}`;
  const momentum = String(state.flags[`${chapterKey}.momentum`] || '');
  const setback = Boolean(state.flags[`${chapterKey}.setback`]);
  const researchQuality = String(state.flags[`${chapterKey}.researchQuality`] || '');
  const signatureScore = Number(state.flags[`${chapterKey}.signatureScore`] || 0);
  const finalSignature = Boolean(state.flags[`${chapterKey}.finalSignature`]);
  const modeHpBonus = (mode === 'DEFENSE' ? 3 : mode === 'RITUAL' ? 1 : mode === 'PARADOX' ? 2 : 0)
    + (setback ? 2 : momentum && momentum !== 'SETBACK' ? -1 : 0)
    - (finalSignature ? 2 : 0);
  const modeIntent = (mode === 'CHASE' ? 1 : mode === 'DEFENSE' ? -1 : 0)
    + (setback ? 1 : researchQuality === 'CLEAR' ? -1 : 0)
    - (finalSignature ? 1 : 0);
  const researchSignal = String(state.flags.chapter1Signal || '');
  const signalHpBonus = state.chapter === 1 && researchSignal.endsWith('FRAGMENT') ? 2 : 0;
  const shortcutCrossing = Boolean(state.flags.shortcutCrossing);
  const objective = mode === 'CHASE'
    ? trpgCopy('鐘が消える前に記録を持って退路へ。2ターン目から退避できる。', 'かねがきえるまえにきろくをもってたいろへ。2ターンめからたいひできる。', 'Carry the records to the exit before the bell vanishes. Escape opens on turn 2.')
    : mode === 'DEFENSE'
      ? trpgCopy('仲間の記憶を守りながら番人を止める。守りで疲労を抑えられる。', 'なかまのきおくをまもりながらばんにんをとめる。まもりでひろうをおさえられる。', 'Hold the guardian while protecting your ally’s memory. Guarding suppresses stress more strongly.')
      : mode === 'RITUAL'
        ? trpgCopy('儀式の順番を崩さず、3つの印を読み解いて番人の核を露出させる。', 'ぎしきのじゅんばんをくずさず、3つのしるしをよみといてばんじんのかくをろしゅつさせる。', 'Keep the ritual order intact and decode three seals to expose the guardian core.')
        : mode === 'PARADOX'
          ? trpgCopy('鏡像の矛盾を見抜く。調査が3以上なら攻撃が共鳴する。', 'きょうぞうのむじゅんをみぬく。ちょうさが3いじょうならこうげきがきょうめいする。', 'Read the mirror paradox. At 3 Insight, attacks resonate with the true target.')
          : mode === 'ECHO'
            ? trpgCopy('残響を消さずに記録する。防御と対話で次の声をつなぐ。', 'ざんきょうをけさずにきろくする。ぼうぎょとたいわでつぎのこえをつなぐ。', 'Preserve the echo instead of erasing it. Guard and dialogue connect the next voice.')
      : undefined;
  const objectiveWithSignature = finalSignature
    ? trpgCopy('章の専用手順が番人の核へ届いている。環境操作を続けると初期脅威が下がる。', 'しょうのせんようてじゅんがばんにんのかくへとどいている。かんきょうそうさをつづけるとしょききょういがさがる。', 'Your chapter signature reached the guardian core. Keep using the environment to reduce the opening threat.')
    : objective;
  const combatType: NonNullable<TrpgCombatState['combatType']> = mode === 'DEFENSE'
    ? 'DEFENSE'
    : mode === 'CHASE'
      ? 'CHASE'
      : mode === 'ECHO'
        ? 'NEGOTIATION'
        : mode === 'RITUAL' || mode === 'PARADOX'
          ? 'PUZZLE_BATTLE'
          : 'DUEL';
  const hazard = mode === 'CHASE'
    ? { id: 'vanishing-bell', label: trpgCopy('消える鐘', 'きえるかね', 'VANISHING BELL'), progress: 0, target: 3 }
    : mode === 'DEFENSE'
      ? { id: 'memory-gate', label: trpgCopy('記憶の門', 'きおくのもん', 'MEMORY GATE'), progress: 0, target: 4 }
      : mode === 'RITUAL' || mode === 'PARADOX'
        ? { id: 'unstable-seal', label: trpgCopy('不安定な印', 'ふあんていなしるし', 'UNSTABLE SEAL'), progress: 0, target: 3 }
        : undefined;
  const allyStates = mode === 'DEFENSE' || mode === 'ECHO'
    ? [
      { id: 'scout', label: trpgCopy('記録係', 'きろくがかり', 'SCRIBE'), integrity: 3, status: 'THREATENED' as const },
      { id: 'companion', label: trpgCopy('同行者', 'どうこうしゃ', 'COMPANION'), integrity: 3, status: 'READY' as const },
    ]
    : undefined;
  return {
    encounterId: `${chapterKey}-${mode.toLowerCase()}`,
    enemyId: `${chapterKey}-guardian`,
    combatType,
    phase: 1,
    actionHistory: [],
    hazard,
    allyStates,
    mode,
    objective: objectiveWithSignature,
    enemyHp: (alliance ? 11 : 13) + modeHpBonus + signalHpBonus,
    enemyMaxHp: (alliance ? 11 : 13) + modeHpBonus + signalHpBonus,
    enemyIntent: Math.max(1, (observed ? 2 : 3) + modeIntent - (shortcutCrossing ? 1 : 0)),
    insight: clamp((observed ? 2 : knowsWeakness ? 1 : mode === 'PARADOX' ? 1 : 0)
      + (momentum === 'INVESTIGATION' || momentum === 'PUZZLE' ? 1 : 0)
      + (researchQuality === 'CLEAR' ? 1 : 0)
      + (shortcutCrossing ? 1 : 0)
      + (signatureScore >= 4 ? 1 : 0)
      + insightBonus, 0, 6),
    resolve: clamp((state.flags.knowsPassphrase ? 2 : 0)
      + (momentum === 'DIALOGUE' || momentum === 'DEFENSE' ? 1 : 0)
      + (finalSignature ? 1 : 0)
      + resolveBonus, 0, 8),
    turn: 1,
    result: null,
    resolution: null,
    logs: [
      {
        turn: 0,
        copy: trpgCopy('番人は集めた記録に反応し、倒す・説得する・記録を持ち帰る三つの道を同時に開いた。', 'ばんにんはあつめたきろくにはんのうし、たおす・せっとくする・きろくをもちかえるみっつのみちをどうじにひらいた。', 'The guardian reacts to your records, opening three paths at once: defeat, persuade, or escape with the truth.'),
      },
      ...(shortcutCrossing ? [{
        turn: 0,
        copy: trpgCopy('近道の地図が番人の初動を先読みした。最初の脅威が1下がり、調査が1進む。', 'ちかみちのちずがばんにんのしょどうをさきよみした。さいしょのきょういがいちさがり、ちょうさがいちすすむ。', 'The shortcut map predicts the guardian’s opening. The first threat drops by 1 and Insight rises by 1.'),
      }] : []),
    ],
  };
};

export const resolveSchoolTrpgChoice = (
  state: TrpgCampaignState,
  choiceId: string,
  useFate: boolean,
): TrpgCampaignState => {
  const event = getActiveSchoolTrpgEvent(state);
  const choice = event?.choices.find(candidate => candidate.id === choiceId);
  if (!event || !choice || state.phase !== 'EVENT') return state;
  // Contextual choices are authored as optional route rewards. Keep the
  // condition in the engine (rather than only disabling the button) so old
  // saves, keyboard input, and scripted callers cannot bypass the branch.
  if (choice.requiresFlag && !state.flags[choice.requiresFlag]) return state;

  const rolled = rollD6(state);
  const fateBonus = useFate && state.fate > 0 ? 2 : 0;
  const checkEffect = claimRewardEffect(state, 'CHECK_BONUS');
  const statValue = state.stats[choice.stat];
  const difficulty = getSchoolTrpgChoiceTarget(state, choice);
  const total = rolled.roll + statValue + fateBonus + checkEffect.amount;
  const success = total >= difficulty;
  const grade: TrpgCheckGrade = total >= difficulty + 3 ? 'GREAT' : success ? 'SUCCESS' : 'SETBACK';
  // Early routine wins teach the route and can raise a weak stat to the stable
  // band. Past that band, growth requires a GREAT result; at 6 the stat is
  // deliberately stable while adaptive targets keep checks contestable.
  const statGain = grade === 'GREAT'
    ? (statValue < 6 ? 1 : 0)
    : success && statValue < 4
      ? 1
      : 0;
  const completedEventIds = unique([...state.completedEventIds, event.id.replace(/-revisit$/, '')]);
  const nextStats = {
    ...state.stats,
    [choice.stat]: clamp(statValue + statGain, 1, 6),
  };
  const outcomeFlags = success ? choice.successFlags : choice.failureFlags;
  const nextFlags = {
    ...state.flags,
    ...choice.flags,
    ...(outcomeFlags || {}),
    [`choice.${event.id}`]: choice.id,
    [`check.grade.${event.id}`]: grade,
  };
  const result = {
    choiceId: choice.id,
    stat: choice.stat,
    roll: rolled.roll,
    statValue,
    fateBonus,
    itemBonus: checkEffect.amount,
    itemName: checkEffect.reward?.name,
    total,
    difficulty,
    success,
    grade,
    statGain,
    copy: success ? choice.success : choice.failure,
    nextPhase: event.nextPhase,
  } as const;
  const pendingQuestionGate = event.nextPhase === 'QUESTION' ? event.questionGate || null : state.pendingQuestionGate;
  const effectBase = { ...state, flags: { ...checkEffect.flags, ...nextFlags } };
  const insightEffect = event.nextPhase === 'COMBAT' ? claimRewardEffect(effectBase, 'COMBAT_INSIGHT') : { amount: 0, reward: null, flags: effectBase.flags, log: [] as TrpgCopy[] };
  const resolveEffect = event.nextPhase === 'COMBAT' ? claimRewardEffect({ ...effectBase, flags: insightEffect.flags }, 'COMBAT_RESOLVE') : { amount: 0, reward: null, flags: insightEffect.flags, log: [] as TrpgCopy[] };
  const combat = event.nextPhase === 'COMBAT'
    ? createGuardianCombat({ ...state, flags: resolveEffect.flags }, insightEffect.amount, resolveEffect.amount)
    : state.combat;
  const updated: TrpgCampaignState = {
    ...state,
    rngStep: rolled.rngStep,
    phase: 'RESULT',
    stats: nextStats,
    clues: clamp(state.clues + (success ? choice.clueOnSuccess + (grade === 'GREAT' ? 1 : 0) : 0), 0, 8),
    stress: clamp(state.stress + (success ? 0 : choice.stressOnFailure + (grade === 'SETBACK' ? 1 : 0)), 0, 6),
    fate: clamp(state.fate - (fateBonus ? 1 : 0) + (success ? 0 : 1), 0, 3),
    flags: resolveEffect.flags,
    completedEventIds,
    locationStates: {
      ...(state.locationStates || {}),
      [event.locationId]: state.currentEventVariant === 'REVISIT'
        ? 'COMPANION_REACTION'
        : success ? 'RESOLVED' : 'SEEN',
    } as Record<string, TrpgLocationVisitState>,
    currentEventVariant: state.currentEventVariant === 'REVISIT' ? 'REVISIT' : 'PRIMARY',
    pendingQuestionGate,
    result,
    combat,
    discoveryLog: [...state.discoveryLog, ...checkEffect.log, success ? choice.success : choice.failure, ...insightEffect.log, ...resolveEffect.log].slice(-18),
  };
  return reconcileSchoolTrpgUnlocks(updated);
};

export const continueSchoolTrpgResult = (state: TrpgCampaignState): TrpgCampaignState => {
  if (state.phase !== 'RESULT' || !state.result) return state;
  if (state.result.nextPhase === 'QUESTION') return { ...state, phase: 'QUESTION', result: null };
  if (state.result.nextPhase === 'COMBAT') return { ...state, phase: 'COMBAT', result: null };
  return { ...state, phase: 'MAP', currentEventId: null, currentEventVariant: 'PRIMARY', result: null };
};

export const isHiddenSchoolTrpgChapterUnlocked = (state: TrpgCampaignState) =>
  state.chapter >= 4
  && Boolean(state.flags.hiddenKey)
  && state.completedQuestionGates.includes('CHAPTER4_RESEARCH');

export const startNextSchoolTrpgChapter = (state: TrpgCampaignState): TrpgCampaignState => {
  if (state.phase !== 'ENDING') return state;
  const nextChapter = state.chapter < 4
    ? state.chapter + 1
    : state.chapter === 4 && isHiddenSchoolTrpgChapterUnlocked(state) ? 5 : null;
  if (nextChapter === null) return state;
  const nextLocation = getTrpgChapterLocations(nextChapter)[0];
  if (!nextLocation) return state;
  const nextMeta = getTrpgChapterMeta(nextChapter);
  const recoveryEffect = claimRewardEffect({ ...state, chapter: nextChapter }, 'FATIGUE_RECOVERY');
  const next: TrpgCampaignState = {
    ...state,
    chapter: nextChapter,
    phase: 'MAP',
    stress: Math.max(0, state.stress - recoveryEffect.amount),
    flags: recoveryEffect.flags,
    currentLocationId: nextLocation.id,
    currentEventId: null,
    currentEventVariant: 'PRIMARY',
    pendingQuestionGate: null,
    result: null,
    combat: null,
    selectedRewardId: null,
    endingId: null,
    endingSummary: undefined,
    unlockedLocationIds: [nextLocation.id],
    discoveryLog: [...state.discoveryLog, ...recoveryEffect.log, trpgCopy(`${nextMeta.label.ja}の航路を開いた。`, `${nextMeta.label.hira}のこうろをひらいた。`, `The route for ${nextMeta.label.en} is now open.`)].slice(-18),
  };
  return reconcileSchoolTrpgUnlocks(next);
};

const QUESTION_OUTCOMES: Partial<Record<TrpgQuestionGateId, { pass: TrpgCopy; fail: TrpgCopy }>> = {
  LIBRARY: { pass: trpgCopy('三つの資料が一致し、隠し棚が動いて旧校舎への安全な通路が現れた。', 'みっつのしりょうがいっちし、かくしだながうごいてきゅうこうしゃへのあんぜんなつうろがあらわれた。', 'The three sources agree; the hidden shelf moves and reveals a safe passage to the old wing.'), fail: trpgCopy('照合は不完全だったが、誤答箇所が危険な通路を示し、仲間が迂回路を書き残した。', 'しょうごうはふかんぜんだったが、ごとうかしょがきけんなつうろをしめし、なかまがうかいろをかきのこした。', 'The comparison is incomplete, but the wrong entries expose the dangerous corridor and an ally records a detour.') },
  CHAPTER1_RESEARCH: { pass: trpgCopy('卒業記録の時刻がそろい、保管庫の壁に時計塔への夜間通路が投影された。', 'そつぎょうきろくのじこくがそろい、ほかんこのかべにとけいとうへのやかんつうろがとうえいされた。', 'The alumni timestamps align and project the night passage to the clock tower onto the archive wall.'), fail: trpgCopy('時刻はずれたが、重ならなかった一枚が連絡橋の出現時刻を教えた。', 'じこくはずれたが、かさならなかったいちまいがれんらくきょうのしゅつげんじこくをおしえた。', 'The times fail to align, but the one unmatched record reveals when the night crossing appears.') },
  CHAPTER2_RESEARCH: { pass: trpgCopy('正答順に垂れ幕が回転し、鏡写しの講堂へ続く祭りの裏航路が開いた。', 'せいとうじゅんにたれまくがかいてんし、かがみうつしのこうどうへつづくまつりのうらこうろがひらいた。', 'The banners rotate in answer order, opening the festival’s hidden route to the mirror auditorium.'), fail: trpgCopy('迷路は閉じたままだが、間違えた幕だけが風に揺れ、花火デッキへの抜け道を示した。', 'めいろはとじたままだが、まちがえたまくだけがかぜにゆれ、はなびデッキへのぬけみちをしめした。', 'The maze remains shut, but only the incorrect banner moves, revealing a shortcut to the fireworks deck.') },
  CHAPTER3_RESEARCH: { pass: trpgCopy('扉に刻んだ答えが校外航路へ変わり、反響図書館の記録が一斉に目を覚ました。', 'とびらにきざんだこたえがこうがいこうろへかわり、はんきょうとしょかんのきろくがいっせいにめをさました。', 'The answers carved into the door become an outbound route, awakening every record in the echo library.'), fail: trpgCopy('扉は半分しか開かなかったが、外から届いた声が不足した答えを補い、安全な幅を確保した。', 'とびらははんぶんしかひらかなかったが、そとからとどいたこえがふそくしたこたえをおぎない、あんぜんなはばをかくほした。', 'The door opens only halfway, but a voice from outside supplies the missing answer and secures a safe gap.') },
  CHAPTER4_RESEARCH: { pass: trpgCopy('水面に正答がそろい、校章が最初に作られた原室と隠し階段が同時に映った。', 'すいめんにせいとうがそろい、こうしょうがさいしょにつくられたげんしつとかくしかいだんがどうじにうつった。', 'The correct answers settle on the water, reflecting both the origin chamber and a hidden stair.'), fail: trpgCopy('原記憶は揺らいだが、水底に沈んだ校章の影が最終連絡橋の位置を示した。', 'げんきおくはゆらいだが、みずそこにしずんだこうしょうのかげがさいしゅうれんらくきょうのいちをしめした。', 'The origin memory wavers, but the emblem’s submerged shadow reveals the final crossing.') },
  HIDDEN_RESEARCH: { pass: trpgCopy('黒板の全ての名前が戻り、忘れられた生徒たちが最初の鐘の合言葉を声にした。', 'こくばんのすべてのなまえがもどり、わすれられたせいとたちがさいしょのかねのあいことばをこえにした。', 'Every name returns to the board, and the forgotten students speak the First Bell’s passphrase.'), fail: trpgCopy('名前は一部しか戻らなかったが、残った空欄の形が0時間目の教室への扉になった。', 'なまえはいちぶしかもどらなかったが、のこったくうらんのかたちがれいじかんめのきょうしつへのとびらになった。', 'Only some names return, but the remaining blanks form a door to the zero-hour classroom.') },
};

export const completeSchoolTrpgQuestion = (
  state: TrpgCampaignState,
  correctCount: number,
): TrpgCampaignState => {
  const gate = state.pendingQuestionGate;
  if (state.phase !== 'QUESTION' || !gate) return state;
  const questionEffect = claimRewardEffect(state, 'QUESTION_CLUE');
  const effectiveCorrectCount = Math.min(3, correctCount + questionEffect.amount);
  const passed = effectiveCorrectCount >= 2;
  const isResearchGate = gate === 'LIBRARY' || gate.endsWith('_RESEARCH');
  const completedQuestionGates = unique([...state.completedQuestionGates, gate]);
  const authoredOutcome = QUESTION_OUTCOMES[gate];
  const baseFeedback = authoredOutcome
    ? passed ? authoredOutcome.pass : authoredOutcome.fail
    : passed
      ? trpgCopy(`${correctCount}問正解。答えを調査記録へ結び、番人の記憶を発見物へ変えた。`, `${correctCount}もんせいかい。こたえをちょうさきろくへむすび、ばんにんのきおくをはっけんぶつへかえた。`, `${correctCount} answers correct. You bind them to the investigation and turn the guardian’s memory into a discovery.`)
      : trpgCopy(`${correctCount}問正解。誤答の理由を補足し、失敗も次の航路を残す記録へ変えた。`, `${correctCount}もんせいかい。ごとうのりゆうをほそくし、しっぱいもつぎのこうろをのこすきろくへかえた。`, `${correctCount} answers correct. You annotate the mistakes and turn them into a record that preserves the next route.`);
  const routeFeedback = state.chapter === 1 && gate === 'CHAPTER1_RESEARCH'
    ? state.flags.routeChapter1 === 'ALLY'
      ? passed
        ? trpgCopy('仲間の記憶が記録の空欄を埋め、番人へ届ける合図が安定した。', 'なかまのきおくがきろくのくうらんをうめ、ばんじんへとどけるあいずがあんていした。', 'Your ally fills the archive gaps; the signal to the guardian stabilizes.')
        : trpgCopy('記録の空欄は残ったが、仲間が危険な順番を読み取り、守るべきページを選んだ。', 'きろくのくうらんはのこったが、なかまがきけんなじゅんばんをよみとり、まもるべきページをえらんだ。', 'Gaps remain, but your ally identifies the dangerous order and marks the page to protect.')
      : passed
        ? trpgCopy('星図と時刻が重なり、番人の初動を先読みできる航路になった。', 'せいずとじこくがかさなり、ばんじんのしょどうをさきよみできるこうろになった。', 'The star chart and timestamps align, revealing the guardian’s opening move.')
        : trpgCopy('星図は揺らいだが、ずれた時刻が退避の窓を示した。', 'せいずはゆらいだが、ずれたじこくがたいひのまどをしめした。', 'The chart wavers, but the offset time reveals an escape window.')
    : null;
  const feedback = routeFeedback || baseFeedback;
  const updated: TrpgCampaignState = {
    ...state,
    phase: isResearchGate ? 'MAP' : 'REWARD',
    pendingQuestionGate: null,
    completedQuestionGates,
    clues: clamp(state.clues + (passed ? 1 : 0), 0, 8),
    stress: clamp(state.stress + (passed ? 0 : 1), 0, 6),
    flags: {
      ...questionEffect.flags,
      [`question.${gate}`]: correctCount,
      [`questionEffective.${gate}`]: effectiveCorrectCount,
      [`chapter${state.chapter}.researchQuality`]: passed ? 'CLEAR' : 'MIXED',
      ...(state.chapter === 1 && gate === 'CHAPTER1_RESEARCH'
        ? { chapter1ResearchQuality: passed ? 'CLEAR' : 'MIXED' }
        : {}),
    },
    currentEventId: isResearchGate ? null : state.currentEventId,
    discoveryLog: [...state.discoveryLog, ...questionEffect.log, feedback].slice(-18),
  };
  return reconcileSchoolTrpgUnlocks(updated);
};

const combatCopy = (action: TrpgCombatActionId, amount: number, extra = 0): TrpgCopy => {
  if (action === 'STRIKE') return trpgCopy(`勇気を込めた一撃で${amount}の脅威を減らした。`, `ゆうきをこめたいちげきで${amount}のきょういをへらした。`, `A courageous strike reduces the threat by ${amount}.`);
  if (action === 'INVESTIGATE') return trpgCopy(`記憶の断片を${amount}段階まで読み解いた。`, `きおくのだんぺんを${amount}だんかいまでよみといた。`, `You decode the memory fragments to insight level ${amount}.`);
  if (action === 'PERSUADE') return trpgCopy(`番人へ言葉を届け、対話を${amount}/8まで進めた。`, `ばんにんへことばをとどけ、たいわを${amount}/8まですすめた。`, `Your words reach the guardian, advancing dialogue to ${amount}/8.`);
  if (action === 'GUARD') return trpgCopy(`${amount}の守りで反撃を受け止めた。`, `${amount}のまもりではんげきをうけとめた。`, `You brace with ${amount} guard against the counterattack.`);
  if (action === 'INTERACT') return trpgCopy(`環境装置を${amount}段階まで動かした。`, `かんきょうそうちを${amount}だんかいまでうごかした。`, `You advance the environment mechanism to stage ${amount}.`);
  if (action === 'USE_ITEM') return trpgCopy(`発見物を使い、戦闘の余白を${amount}つ取り戻した。`, `はっけんぶつをつかい、せんとうのよはくを${amount}つとりもどした。`, `You use a discovery to recover ${amount} combat margin.`);
  if (action === 'ALLY_SKILL') return trpgCopy(`同行者の技能が脅威の流れを変え、連携値が${amount}になった。`, `どうこうしゃのぎのうがきょういのながれをかえ、れんけいちが${amount}になった。`, `An ally skill shifts the threat flow; coordination reaches ${amount}.`);
  if (action === 'PROTECT') return trpgCopy(`記録係を守り、門の安定度を${amount}まで高めた。`, `きろくがかりをまもり、もんのあんていどを${amount}までたかめた。`, `You protect the scribe and raise the gate stability to ${amount}.`);
  return trpgCopy(`退路を探した。必要な間合いまであと${extra}手。`, `たいろをさがした。ひつようなまあいまであと${extra}て。`, `You search for an exit. ${extra} more turn remains before escape is safe.`);
};

const finishCombat = (
  state: TrpgCampaignState,
  combat: TrpgCombatState,
  resolution: TrpgCombatResolution,
): TrpgCampaignState => {
  const chapter = getTrpgChapterMeta(state.chapter);
  const endings = getTrpgChapterEndings(state.chapter);
  const chapterKey = `chapter${state.chapter}`;
  const signatureScore = Number(state.flags[`${chapterKey}.signatureScore`] || 0);
  const researchQuality = state.flags[`${chapterKey}.researchQuality`];
  const routeTrace = state.flags[`${chapterKey}.finalSignature`]
    ? trpgCopy('章固有の手順で番人の核へ到達し、最後の合図を先に記録した。', 'しょうこゆうのてじゅんでばんじんのかくへとうたつし、さいごのあいずをさきにきろくした。', 'You reached the guardian core through the chapter signature and recorded the final signal first.')
    : researchQuality === 'CLEAR'
      ? trpgCopy('問題ゲートを正答で通過し、番人の弱点を先に調査記録へ写した。', 'もんだいゲートをせいとうでつうかし、ばんじんのじゃくてんをさきにちょうさきろくへうつした。', 'You cleared the quiz gate and copied the guardian’s weakness into the investigation first.')
      : signatureScore >= 3
        ? trpgCopy('章固有の調査を複数地点でつなぎ、標準航路にはない別解を残した。', 'しょうこゆうのちょうさをふくすうちてんでつなぎ、ひょうじゅんこうろにはないべっかいをのこした。', 'You linked the chapter investigation across several locations, preserving an alternate route beyond the standard path.')
        : trpgCopy('標準航路で記録を回収し、次の探索へ渡せる最低限の手がかりを残した。', 'ひょうじゅんこうろできろくをかいしゅうし、つぎのたんさくへわたせるさいていげんのてがかりをのこした。', 'You recovered the record along the standard route and left the minimum clue for the next expedition.');
  if (resolution === 'OVERWHELMED') {
    const withdrawal = endings.find(ending => ending.route === 'OVERWHELMED') || endings[3] || endings[0];
    const endingSummary = trpgCopy(`${routeTrace.ja} ${chapter.guardianName.ja}に押し戻されたため、疲労を抱えたまま記録を持ち帰った。`, `${routeTrace.hira} ${chapter.guardianName.hira}におしもどされたため、ひろうをかかえたままきろくをもちかえった。`, `${routeTrace.en} ${chapter.guardianName.en} pushed you back, so you carried the record home under heavy fatigue.`);
    return {
      ...state,
      phase: 'ENDING',
      combat: { ...combat, result: 'LOSE', resolution },
      endingId: withdrawal?.id || 'unfinished-map',
      endingHistory: unique([...(state.endingHistory || []), withdrawal?.id || 'unfinished-map']),
      endingSummary,
      flags: { ...state.flags, combatResolution: resolution },
      discoveryLog: [...state.discoveryLog, endingSummary, trpgCopy(`${chapter.guardianName.ja}に押し戻されたが、仲間が調査記録を抱えて退避した。次の探索では反撃の順番まで分かる。`, `${chapter.guardianName.hira}におしもどされたが、なかまがちょうさきろくをかかえてたいひした。つぎのたんさくでははんげきのじゅんばんまでわかる。`, `${chapter.guardianName.en} forces you back, but your ally escapes with the notes. The next expedition will know the counterattack order.`)].slice(-18),
    };
  }
  const outcome = resolution === 'DEFEAT'
    ? trpgCopy(`${chapter.guardianName.ja}の脅威核を封じ、守られていた記録と次の航路を回収した。`, `${chapter.guardianName.hira}のきょういかくをふうじ、まもられていたきろくとつぎのこうろをかいしゅうした。`, `You seal ${chapter.guardianName.en}’s threat core and recover both the guarded record and the next route.`)
    : resolution === 'PERSUADE'
      ? trpgCopy(`${chapter.guardianName.ja}は攻撃を止め、守っていた理由と失われた記憶の持ち主を語った。`, `${chapter.guardianName.hira}はこうげきをとめ、まもっていたりゆうとうしなわれたきおくのもちぬしをかたった。`, `${chapter.guardianName.en} stops attacking and reveals why the memory was guarded and to whom it belonged.`)
      : trpgCopy(`${chapter.guardianName.ja}を倒さず、仲間・手がかり・安全な退路を確保した。番人の弱点は地図に残った。`, `${chapter.guardianName.hira}をたおさず、なかま・てがかり・あんぜんなたいろをかくほした。ばんにんのじゃくてんはちずにのこった。`, `Without defeating ${chapter.guardianName.en}, you secure your ally, clues, and a safe exit. Its weakness remains marked on the map.`);
  const endingSummary = resolution === 'DEFEAT'
    ? trpgCopy(`${routeTrace.ja} 撃破した番人の脅威核から、次の航路を開く記録を回収した。`, `${routeTrace.hira} げきはしたばんにんのきょういかくから、つぎのこうろをひらくきろくをかいしゅうした。`, `${routeTrace.en} From the defeated guardian’s threat core, you recover the record that opens the next route.`)
    : resolution === 'PERSUADE'
      ? trpgCopy(`${routeTrace.ja} 対話で番人の目的を引き出し、記録を壊さず次の航路へ渡した。`, `${routeTrace.hira} たいわでばんにんのもくてきをひきだし、きろくをこわさずつぎのこうろへわたした。`, `${routeTrace.en} Through dialogue, you draw out the guardian’s purpose and pass the intact record to the next route.`)
      : trpgCopy(`${routeTrace.ja} 退避を選び、仲間と手がかりを守った。番人の弱点は地図に残った。`, `${routeTrace.hira} たいひをえらび、なかまとてがかりをまもった。ばんにんのじゃくてんはちずにのこった。`, `${routeTrace.en} You choose withdrawal, protecting your ally and clues while leaving the guardian’s weakness on the map.`);
  return {
    ...state,
    phase: 'QUESTION',
    combat: { ...combat, result: 'WIN', resolution },
    pendingQuestionGate: getTrpgChapterMeta(state.chapter).clearGate,
    endingSummary,
    flags: { ...state.flags, combatResolution: resolution },
    discoveryLog: [...state.discoveryLog, endingSummary, outcome].slice(-18),
  };
};

export const performSchoolTrpgCombatAction = (
  state: TrpgCampaignState,
  action: TrpgCombatActionId,
): TrpgCampaignState => {
  if (state.phase !== 'COMBAT' || !state.combat || state.combat.result) return state;
  const rolled = rollD6(state);
  const combat = {
    ...state.combat,
    logs: [...state.combat.logs],
    actionHistory: [...(state.combat.actionHistory || []), action],
    allyStates: state.combat.allyStates?.map(ally => ({ ...ally })),
    hazard: state.combat.hazard ? { ...state.combat.hazard } : undefined,
  };
  const mode: SchoolTrpgCombatMode = combat.mode || 'DUEL';
  let guard = 0;
  let resolution: TrpgCombatResolution | null = null;
  let nextFlags = state.flags;

  if (action === 'STRIKE') {
    const modeBonus = mode === 'RITUAL' && rolled.roll >= 4 ? 1 : mode === 'PARADOX' && combat.insight >= 3 ? 1 : 0;
    const amount = Math.max(1, state.stats.courage + Math.ceil(rolled.roll / 2) - 1 + modeBonus);
    combat.enemyHp = Math.max(0, combat.enemyHp - amount);
    combat.logs.push({ turn: combat.turn, copy: modeBonus > 0
      ? trpgCopy(`${combatCopy(action, amount).ja}（${mode}の共鳴）`, `${combatCopy(action, amount).hira}（${mode}のきょうめい）`, `${combatCopy(action, amount).en} (${mode} resonance).`)
      : combatCopy(action, amount) });
    if (combat.enemyHp <= 0) resolution = 'DEFEAT';
  } else if (action === 'INVESTIGATE') {
    const modeBonus = mode === 'CHASE' && rolled.roll >= 4 ? 1 : mode === 'ECHO' ? 1 : 0;
    combat.insight = clamp(combat.insight + 1 + (rolled.roll >= 4 ? 1 : 0) + (state.stats.study >= 3 ? 1 : 0) + modeBonus, 0, 6);
    const ritualBreak = mode === 'RITUAL' && rolled.roll >= 5;
    if (ritualBreak) combat.enemyHp = Math.max(0, combat.enemyHp - 1);
    combat.logs.push({ turn: combat.turn, copy: ritualBreak
      ? trpgCopy(`${combatCopy(action, combat.insight).ja} 儀式の印が一つ崩れ、脅威が1減った。`, `${combatCopy(action, combat.insight).hira} ぎしきのしるしがひとつくずれ、きょういが1へった。`, `${combatCopy(action, combat.insight).en} One ritual seal breaks, reducing Threat by 1.`)
      : combatCopy(action, combat.insight) });
    if (combat.enemyHp <= 0) resolution = 'DEFEAT';
  } else if (action === 'PERSUADE') {
    if (combat.insight < 3 && !state.flags.knowsPassphrase) {
      combat.logs.push({ turn: combat.turn, copy: trpgCopy('情報が足りず、言葉は番人へ届かなかった。', 'じょうほうがたりず、ことばはばんにんへとどかなかった。', 'Without enough insight, your words cannot reach the guardian.') });
    } else {
      const amount = Math.max(1, state.stats.friendship + Math.floor(rolled.roll / 2) + (state.flags.knowsPassphrase ? 1 : 0) + (mode === 'PARADOX' ? 1 : 0));
      combat.resolve = clamp(combat.resolve + amount, 0, 8);
      combat.logs.push({ turn: combat.turn, copy: combatCopy(action, combat.resolve) });
      if (combat.resolve >= 8) resolution = 'PERSUADE';
    }
  } else if (action === 'GUARD') {
    guard = state.stats.energy + 2 + (mode === 'DEFENSE' ? 2 : mode === 'RITUAL' ? 1 : 0);
    if (mode === 'ECHO' && state.clues >= 3) combat.resolve = clamp(combat.resolve + 1, 0, 8);
    combat.logs.push({ turn: combat.turn, copy: combatCopy(action, guard) });
  } else if (action === 'INTERACT') {
    let stage = 0;
    if (mode === 'RITUAL') {
      stage = clamp(combat.insight + (rolled.roll >= 4 ? 1 : 0), 0, 6);
      combat.insight = stage;
      if (stage >= 3) combat.enemyHp = Math.max(0, combat.enemyHp - 2);
    } else if (mode === 'CHASE') {
      stage = clamp(combat.insight + 1, 0, 6);
      combat.insight = stage;
      combat.enemyIntent = Math.max(1, combat.enemyIntent - 1);
      guard = 1;
    } else if (mode === 'DEFENSE') {
      stage = state.stats.energy + 3;
      guard = stage;
      combat.resolve = clamp(combat.resolve + (rolled.roll >= 4 ? 1 : 0), 0, 8);
    } else if (mode === 'PARADOX') {
      stage = clamp(combat.insight + 2, 0, 6);
      combat.insight = stage;
      if (stage >= 4) combat.enemyHp = Math.max(0, combat.enemyHp - 1);
    } else if (mode === 'ECHO') {
      stage = state.clues >= 3 ? clamp(combat.resolve + 2, 0, 8) : clamp(combat.insight + 1, 0, 6);
      if (state.clues >= 3) combat.resolve = stage;
      else combat.insight = stage;
    }
    combat.logs.push({ turn: combat.turn, copy: combatCopy(action, stage) });
    if (combat.enemyHp <= 0) resolution = 'DEFEAT';
  } else if (action === 'USE_ITEM') {
    const itemId = state.inventory.find(candidate => !state.flags[`usedCombatItem.${candidate}`]);
    if (itemId) {
      nextFlags = { ...state.flags, [`usedCombatItem.${itemId}`]: true };
      combat.insight = clamp(combat.insight + 1, 0, 6);
      combat.resolve = clamp(combat.resolve + 1, 0, 8);
      guard = 3;
      combat.logs.push({ turn: combat.turn, copy: combatCopy(action, 1) });
    } else {
      combat.logs.push({ turn: combat.turn, copy: trpgCopy('使える発見物がない。記録は次の航路のために残した。', 'つかえるはっけんぶつがない。きろくはつぎのこうろのためにのこした。', 'No usable discovery remains. You keep the records for the next route.') });
    }
  } else if (action === 'ALLY_SKILL') {
    const ally = combat.allyStates?.find(candidate => candidate.status !== 'SAFE');
    if (ally) {
      ally.status = 'SAFE';
      ally.integrity = Math.min(3, ally.integrity + 1);
      combat.insight = clamp(combat.insight + 1, 0, 6);
      combat.resolve = clamp(combat.resolve + 1, 0, 8);
      guard = 2;
      combat.logs.push({ turn: combat.turn, copy: combatCopy(action, combat.resolve) });
    } else {
      combat.logs.push({ turn: combat.turn, copy: trpgCopy('同行者は安全な位置にいる。合図だけを送り、次の手へ備えた。', 'どうこうしゃはあんぜんないちにいる。あいずだけをおくり、つぎのてへそなえた。', 'Your allies are already safe. You signal them and prepare the next move.') });
    }
  } else if (action === 'PROTECT') {
    const ally = combat.allyStates?.find(candidate => candidate.status === 'THREATENED');
    if (ally) {
      ally.status = 'SAFE';
      ally.integrity = Math.max(1, ally.integrity - 1);
      combat.hazard = combat.hazard ? { ...combat.hazard, progress: Math.min(combat.hazard.target, combat.hazard.progress + 1) } : combat.hazard;
      guard = state.stats.energy + 3;
      combat.resolve = clamp(combat.resolve + (mode === 'DEFENSE' ? 1 : 0), 0, 8);
      combat.logs.push({ turn: combat.turn, copy: combatCopy(action, combat.hazard?.progress || 1) });
      if (mode === 'DEFENSE' && combat.allyStates?.every(candidate => candidate.status === 'SAFE')) resolution = 'ESCAPE';
    } else {
      guard = state.stats.energy + 2;
      combat.logs.push({ turn: combat.turn, copy: trpgCopy('守るべき仲間はすでに安全だ。番人の動きを観察した。', 'まもるべきなかまはすでにあんぜんだ。ばんじんのうごきをかんさつした。', 'Your allies are already safe, so you study the guardian’s movement instead.') });
    }
  } else if (action === 'ESCAPE') {
    const escapeTurn = mode === 'CHASE' ? 2 : 3;
    const canEscape = combat.turn >= escapeTurn || combat.insight >= 4 || state.clues >= 5;
    if (canEscape) {
      combat.logs.push({ turn: combat.turn, copy: trpgCopy('仲間と記録を守りながら、安全な退路へ離脱した。', 'なかまときろくをまもりながら、あんぜんなたいろへりだつした。', 'You withdraw through a safe route, protecting your ally and notes.') });
      resolution = 'ESCAPE';
    } else {
      combat.logs.push({ turn: combat.turn, copy: combatCopy(action, 0, Math.max(0, escapeTurn - combat.turn)) });
    }
  }

  combat.phase = combat.enemyHp <= combat.enemyMaxHp / 2 ? 2 : combat.hazard && combat.hazard.progress >= combat.hazard.target ? 3 : 1;
  const withRoll: TrpgCampaignState = { ...state, rngStep: rolled.rngStep, flags: nextFlags };
  if (resolution) return finishCombat(withRoll, combat, resolution);

  const incoming = Math.max(0, combat.enemyIntent - guard);
  const nextStress = clamp(state.stress + Math.ceil(incoming / 2), 0, 6);
  combat.logs.push({
    turn: combat.turn,
    copy: incoming > 0
      ? trpgCopy(`番人の反撃で疲労が${Math.ceil(incoming / 2)}増えた。`, `ばんにんのはんげきでひろうが${Math.ceil(incoming / 2)}ふえた。`, `The guardian’s counterattack adds ${Math.ceil(incoming / 2)} stress.`)
      : trpgCopy('守り切り、番人の反撃を無効にした。', 'まもりきり、ばんにんのはんげきをむこうにした。', 'Your defense completely absorbs the counterattack.'),
  });
  combat.turn += 1;
  const nextIntentBase = mode === 'CHASE' ? 3 : mode === 'DEFENSE' ? 1 : mode === 'RITUAL' ? 2 : 2;
  const nextIntentRange = mode === 'ECHO' ? 2 : 3;
  combat.enemyIntent = Math.max(1, nextIntentBase + ((combat.turn + state.seed) % nextIntentRange));
  combat.logs = combat.logs.slice(-7);
  if (nextStress >= 6) return finishCombat({ ...withRoll, stress: nextStress }, combat, 'OVERWHELMED');
  return { ...withRoll, stress: nextStress, combat };
};

const evaluateEndingId = (state: TrpgCampaignState): string => {
  const resolution = state.flags.combatResolution as TrpgCombatResolution | undefined;
  const endings = getTrpgChapterEndings(state.chapter);
  const selectedReward = getTrpgChapterRewards(state.chapter).find(reward => reward.id === state.selectedRewardId);
  const hiddenPerfect = Number(state.flags['question.HIDDEN_CLEAR'] || 0) === 3;
  if (state.chapter === 5
    && resolution === 'PERSUADE'
    && state.flags.companionTrusted
    && hiddenPerfect
    && selectedReward?.effect.kind === 'ENDING_KEY'
    && selectedReward.effect.amount === 2) {
    return endings.find(ending => ending.route === 'TIMELINE')?.id || endings[4]?.id || endings[1]?.id || 'unfinished-map';
  }
  return endings.find(ending => ending.route === resolution)?.id || endings[0]?.id || 'unfinished-map';
};

export const chooseSchoolTrpgReward = (state: TrpgCampaignState, rewardId: string): TrpgCampaignState => {
  if (state.phase !== 'REWARD') return state;
  const reward = getTrpgChapterRewards(state.chapter).find(candidate => candidate.id === rewardId);
  if (!reward) return state;
  const rewarded = {
    ...state,
    phase: 'ENDING' as const,
    selectedRewardId: reward.id,
    inventory: unique([...state.inventory, reward.id]),
    flags: { ...state.flags, [reward.flag]: true },
    discoveryLog: [...state.discoveryLog, trpgCopy(`発見物「${reward.name.ja}」を記録した。${reward.useCopy.ja}`, `はっけんぶつ「${reward.name.hira}」をきろくした。${reward.useCopy.hira}`, `Recorded the discovery: ${reward.name.en}. ${reward.useCopy.en}`)].slice(-18),
  };
  const endingId = evaluateEndingId(rewarded);
  const clearGate = getTrpgChapterMeta(state.chapter).clearGate;
  const correctCount = Number(rewarded.flags[`question.${clearGate}`] || 0);
  const questionTrace = correctCount === 3
    ? trpgCopy('章末の3問を全て正解し、記録の読み方を確定した。', 'しょうまつの3もんをすべてせいかいし、きろくのよみかたをかくていした。', 'All three chapter-end answers were correct, confirming how the record should be read.')
    : correctCount >= 2
      ? trpgCopy(`章末問題は${correctCount}問正解。補足記録を残して航路をつないだ。`, `しょうまつもんだいは${correctCount}もんせいかい。ほそくきろくをのこしてこうろをつないだ。`, `${correctCount} chapter-end answers were correct; a supplementary note keeps the route connected.`)
      : trpgCopy('章末問題の誤答を注記し、別の読み方を次の探索へ残した。', 'しょうまつもんだいのごとうをちゅうきし、べつのよみかたをつぎのたんさくへのこした。', 'You annotate the missed chapter-end answers and carry an alternate reading into the next expedition.');
  const tracedSummary = rewarded.endingSummary
    ? trpgCopy(`${rewarded.endingSummary.ja} ${questionTrace.ja}`, `${rewarded.endingSummary.hira} ${questionTrace.hira}`, `${rewarded.endingSummary.en} ${questionTrace.en}`)
    : questionTrace;
  const endingSummary = reward.effect.kind === 'ENDING_KEY'
    ? trpgCopy(`${tracedSummary.ja} 発見物「${reward.name.ja}」が結末の鍵になった。`, `${tracedSummary.hira} はっけんぶつ「${reward.name.hira}」がけつまつのかぎになった。`, `${tracedSummary.en} The discovery ${reward.name.en} became the key to the ending.`)
    : tracedSummary;
  return { ...rewarded, endingId, endingHistory: unique([...(state.endingHistory || []), endingId]), endingSummary };
};

export const isSchoolTrpgCampaignComplete = (state: TrpgCampaignState) =>
  state.phase === 'ENDING' && Boolean(getTrpgEnding(state.endingId));

export const getSchoolTrpgDataErrors = () => {
  const errors: string[] = [];
  for (const event of SCHOOL_TRPG_EVENTS) {
    if (!getTrpgLocation(event.locationId)) errors.push(`Unknown location: ${event.locationId}`);
  }
  return errors;
};

export const getSchoolTrpgProgress = (state: TrpgCampaignState) => {
  const chapterEvents = getTrpgChapterEvents(state.chapter);
  const chapterEventIds = new Set(chapterEvents.map(event => event.id));
  const completedEvents = state.completedEventIds.filter(eventId => chapterEventIds.has(eventId)).length;
  // A clean Chapter 1 shortcut intentionally bypasses the alternate branch.
  // Count that authored skip as resolved so the route meter reflects a
  // complete expedition rather than punishing the player for exploring well.
  const skipped = state.chapter === 1 && typeof state.flags.chapter1SkippedEvent === 'string' ? 1 : 0;
  const completed = Math.min(chapterEvents.length, completedEvents + skipped);
  const total = chapterEvents.length || SCHOOL_TRPG_EVENTS.length;
  return { completed, total, percent: Math.round((completed / total) * 100) };
};

export const getSchoolTrpgCombatResolutionCopy = (resolution: TrpgCombatResolution | null): TrpgCopy => {
  if (resolution === 'PERSUADE') return trpgCopy('説得', 'せっとく', 'PERSUASION');
  if (resolution === 'ESCAPE') return trpgCopy('退避', 'たいひ', 'ESCAPE');
  if (resolution === 'DEFEAT') return trpgCopy('封印', 'ふういん', 'SEALED');
  if (resolution === 'OVERWHELMED') return trpgCopy('撤退', 'てったい', 'WITHDRAWAL');
  return trpgCopy('未決着', 'みけっちゃく', 'UNRESOLVED');
};

const QUESTION_GATE_COPY: Partial<Record<TrpgQuestionGateId, TrpgCopy>> = {
  MISSION_CLEAR: trpgCopy('ミッションクリア問題', 'ミッションクリアもんだい', 'MISSION CLEAR QUIZ'),
  CHAPTER1_RESEARCH: trpgCopy('夜間記録チャレンジ', 'やかんきろくチャレンジ', 'NIGHT RECORD CHALLENGE'),
  CHAPTER1_CLEAR: trpgCopy('時計塔ミッションクリア問題', 'とけいとうミッションクリアもんだい', 'CLOCK TOWER MISSION QUIZ'),
  CHAPTER2_RESEARCH: trpgCopy('祭りの残響チャレンジ', 'まつりのざんきょうチャレンジ', 'FESTIVAL ECHO CHALLENGE'),
  CHAPTER2_CLEAR: trpgCopy('祭りの最終問題', 'まつりのさいしゅうもんだい', 'FESTIVAL FINALE QUIZ'),
  CHAPTER3_RESEARCH: trpgCopy('校外航路チャレンジ', 'こうがいこうろチャレンジ', 'BEYOND-CAMPUS CHALLENGE'),
  CHAPTER3_CLEAR: trpgCopy('校外航路の最終問題', 'こうがいこうろのさいしゅうもんだい', 'OUTBOUND FINALE QUIZ'),
  CHAPTER4_RESEARCH: trpgCopy('原室記録チャレンジ', 'げんしつきろくチャレンジ', 'ORIGIN RECORD CHALLENGE'),
  CHAPTER4_CLEAR: trpgCopy('第5章ミッションクリア問題', 'だいごしょうミッションクリアもんだい', 'CHAPTER 5 MISSION QUIZ'),
  CHAPTER5_RESEARCH: trpgCopy('0時間目チャレンジ', 'れいじかんめチャレンジ', 'ZERO-HOUR CHALLENGE'),
  HIDDEN_RESEARCH: trpgCopy('隠し航路チャレンジ', 'かくしこうろチャレンジ', 'SECRET ROUTE CHALLENGE'),
  HIDDEN_CLEAR: trpgCopy('最初の鐘ミッションクリア問題', 'さいしょのかねミッションクリアもんだい', 'FIRST BELL MISSION QUIZ'),
};

export const getQuestionGateCopy = (gate: TrpgQuestionGateId | null): TrpgCopy => QUESTION_GATE_COPY[gate || 'LIBRARY'] || trpgCopy('資料調査問題', 'しりょうちょうさもんだい', 'RESEARCH QUIZ');

export const getQuestionGateTitleCopy = (gate: TrpgQuestionGateId | null): TrpgCopy => getQuestionGateCopy(gate);
