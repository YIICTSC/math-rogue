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
  type TrpgCombatActionId,
  type TrpgCombatResolution,
  type TrpgCombatState,
  type TrpgCopy,
  type TrpgQuestionGateId,
} from './schoolTrpgTypes';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const unique = <T,>(values: T[]) => Array.from(new Set(values));

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

export const reconcileSchoolTrpgUnlocks = (state: TrpgCampaignState): TrpgCampaignState => {
  const completed = new Set(state.completedEventIds);
  const questions = new Set(state.completedQuestionGates);
  const chapter = Number.isInteger(state.chapter) ? state.chapter : 0;
  const chapterLocations = getTrpgChapterLocations(chapter);
  const chapterEvents = getTrpgChapterEvents(chapter);
  const unlocked = chapterLocations[0] ? [chapterLocations[0].id] : [];
  const completedEvent = (index: number) => Boolean(chapterEvents[index] && completed.has(chapterEvents[index].id));
  if (completedEvent(0)) unlocked.push(...chapterLocations.slice(1, 3).map(location => location.id));
  if (completedEvent(1) && completedEvent(2)) unlocked.push(chapterLocations[3]?.id);
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
  completedEventIds: [],
  currentLocationId: 'classroom',
  currentEventId: null,
  pendingQuestionGate: null,
  completedQuestionGates: [],
  result: null,
  combat: null,
  selectedRewardId: null,
  endingId: null,
  discoveryLog: [trpgCopy('消えた校章の調査を開始した。', 'きえたこうしょうのちょうさをかいしした。', 'The investigation into the missing emblem has begun.')],
});

export const beginSchoolTrpgEvent = (state: TrpgCampaignState, locationId: string): TrpgCampaignState => {
  const location = getTrpgLocation(locationId);
  if (!location || !state.unlockedLocationIds.includes(locationId)) return state;
  if (state.completedEventIds.includes(location.eventId)) return { ...state, currentLocationId: locationId };
  return {
    ...state,
    phase: 'EVENT',
    currentLocationId: locationId,
    currentEventId: location.eventId,
    time: state.time + location.travelCost,
    result: null,
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

const createGuardianCombat = (state: TrpgCampaignState): TrpgCombatState => {
  const observed = Boolean(state.flags.observedGuardian);
  const knowsWeakness = Boolean(state.flags.knowsWeakness);
  const alliance = Boolean(state.flags.rivalAlliance);
  return {
    enemyHp: alliance ? 11 : 13,
    enemyMaxHp: alliance ? 11 : 13,
    enemyIntent: observed ? 2 : 3,
    insight: observed ? 2 : knowsWeakness ? 1 : 0,
    resolve: state.flags.knowsPassphrase ? 2 : 0,
    turn: 1,
    result: null,
    resolution: null,
    logs: [{
      turn: 0,
      copy: trpgCopy('番人は校章の欠片を守り、こちらの意図を測っている。', 'ばんにんはこうしょうのかけらをまもり、こちらのいとをはかっている。', 'The guardian protects the emblem fragment and studies your intent.'),
    }],
  };
};

export const resolveSchoolTrpgChoice = (
  state: TrpgCampaignState,
  choiceId: string,
  useFate: boolean,
): TrpgCampaignState => {
  const event = getTrpgEvent(state.currentEventId || '');
  const choice = event?.choices.find(candidate => candidate.id === choiceId);
  if (!event || !choice || state.phase !== 'EVENT') return state;

  const rolled = rollD6(state);
  const fateBonus = useFate && state.fate > 0 ? 2 : 0;
  const statValue = state.stats[choice.stat];
  const total = rolled.roll + statValue + fateBonus;
  const success = total >= choice.difficulty;
  const completedEventIds = unique([...state.completedEventIds, event.id]);
  const nextStats = {
    ...state.stats,
    [choice.stat]: clamp(statValue + (success ? 1 : 0), 1, 6),
  };
  const nextFlags = { ...state.flags, ...choice.flags, [`choice.${event.id}`]: choice.id };
  const result = {
    choiceId: choice.id,
    stat: choice.stat,
    roll: rolled.roll,
    statValue,
    fateBonus,
    total,
    difficulty: choice.difficulty,
    success,
    copy: success ? choice.success : choice.failure,
    nextPhase: event.nextPhase,
  } as const;
  const pendingQuestionGate = event.nextPhase === 'QUESTION' ? event.questionGate || null : state.pendingQuestionGate;
  const combat = event.nextPhase === 'COMBAT' ? createGuardianCombat({ ...state, flags: nextFlags }) : state.combat;
  const updated: TrpgCampaignState = {
    ...state,
    rngStep: rolled.rngStep,
    phase: 'RESULT',
    stats: nextStats,
    clues: clamp(state.clues + (success ? choice.clueOnSuccess : 0), 0, 8),
    stress: clamp(state.stress + (success ? 0 : choice.stressOnFailure), 0, 6),
    fate: clamp(state.fate - (fateBonus ? 1 : 0) + (success ? 0 : 1), 0, 3),
    flags: nextFlags,
    completedEventIds,
    pendingQuestionGate,
    result,
    combat,
    discoveryLog: [...state.discoveryLog, success ? choice.success : choice.failure].slice(-18),
  };
  return reconcileSchoolTrpgUnlocks(updated);
};

export const continueSchoolTrpgResult = (state: TrpgCampaignState): TrpgCampaignState => {
  if (state.phase !== 'RESULT' || !state.result) return state;
  if (state.result.nextPhase === 'QUESTION') return { ...state, phase: 'QUESTION', result: null };
  if (state.result.nextPhase === 'COMBAT') return { ...state, phase: 'COMBAT', result: null };
  return { ...state, phase: 'MAP', currentEventId: null, result: null };
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
  const next: TrpgCampaignState = {
    ...state,
    chapter: nextChapter,
    phase: 'MAP',
    currentLocationId: nextLocation.id,
    currentEventId: null,
    pendingQuestionGate: null,
    result: null,
    combat: null,
    selectedRewardId: null,
    endingId: null,
    unlockedLocationIds: [nextLocation.id],
    discoveryLog: [...state.discoveryLog, trpgCopy(`${nextMeta.label.ja}の航路を開いた。`, `${nextMeta.label.hira}のこうろをひらいた。`, `The route for ${nextMeta.label.en} is now open.`)].slice(-18),
  };
  return reconcileSchoolTrpgUnlocks(next);
};

export const completeSchoolTrpgQuestion = (
  state: TrpgCampaignState,
  correctCount: number,
): TrpgCampaignState => {
  const gate = state.pendingQuestionGate;
  if (state.phase !== 'QUESTION' || !gate) return state;
  const passed = correctCount >= 2;
  const isResearchGate = gate === 'LIBRARY' || gate.endsWith('_RESEARCH');
  const completedQuestionGates = unique([...state.completedQuestionGates, gate]);
  const feedback = gate === 'LIBRARY'
    ? passed
      ? trpgCopy('三つの資料がつながり、旧校舎への経路を復元した。', 'みっつのしりょうがつながり、きゅうこうしゃへのけいろをふくげんした。', 'The three sources connect, restoring the route to the old wing.')
      : trpgCopy('経路は不完全だが、仲間のメモから安全な道を残せた。', 'けいろはふかんぜんだが、なかまのメモからあんぜんなみちをのこせた。', 'The route is incomplete, but an ally’s notes preserve a safe path.')
    : passed
      ? trpgCopy('ミッションクリア。調査記録が新しい発見物へ変わった。', 'ミッションクリア。ちょうさきろくがあたらしいはっけんぶつへかわった。', 'Mission clear. Your investigation becomes a new discovery.')
      : trpgCopy('補足記録を加え、失敗も次の探索に残せる知識へ変えた。', 'ほそくきろくをくわえ、しっぱいもつぎのたんさくにのこせるちしきへかえた。', 'You add a correction note, turning mistakes into knowledge for the next expedition.');
  const updated: TrpgCampaignState = {
    ...state,
    phase: isResearchGate ? 'MAP' : 'REWARD',
    pendingQuestionGate: null,
    completedQuestionGates,
    clues: clamp(state.clues + (passed ? 1 : 0), 0, 8),
    stress: clamp(state.stress + (passed ? 0 : 1), 0, 6),
    flags: { ...state.flags, [`question.${gate}`]: correctCount },
    currentEventId: isResearchGate ? null : state.currentEventId,
    discoveryLog: [...state.discoveryLog, feedback].slice(-18),
  };
  return reconcileSchoolTrpgUnlocks(updated);
};

const combatCopy = (action: TrpgCombatActionId, amount: number, extra = 0): TrpgCopy => {
  if (action === 'STRIKE') return trpgCopy(`勇気を込めた一撃で${amount}の脅威を減らした。`, `ゆうきをこめたいちげきで${amount}のきょういをへらした。`, `A courageous strike reduces the threat by ${amount}.`);
  if (action === 'INVESTIGATE') return trpgCopy(`記憶の断片を${amount}段階まで読み解いた。`, `きおくのだんぺんを${amount}だんかいまでよみといた。`, `You decode the memory fragments to insight level ${amount}.`);
  if (action === 'PERSUADE') return trpgCopy(`番人へ言葉を届け、対話を${amount}/8まで進めた。`, `ばんにんへことばをとどけ、たいわを${amount}/8まですすめた。`, `Your words reach the guardian, advancing dialogue to ${amount}/8.`);
  if (action === 'GUARD') return trpgCopy(`${amount}の守りで反撃を受け止めた。`, `${amount}のまもりではんげきをうけとめた。`, `You brace with ${amount} guard against the counterattack.`);
  return trpgCopy(`退路を探した。必要な間合いまであと${extra}手。`, `たいろをさがした。ひつようなまあいまであと${extra}て。`, `You search for an exit. ${extra} more turn remains before escape is safe.`);
};

const finishCombat = (
  state: TrpgCampaignState,
  combat: TrpgCombatState,
  resolution: TrpgCombatResolution,
): TrpgCampaignState => {
  if (resolution === 'OVERWHELMED') {
    return {
      ...state,
      phase: 'ENDING',
      combat: { ...combat, result: 'LOSE', resolution },
      endingId: 'unfinished-map',
      flags: { ...state.flags, combatResolution: resolution },
      discoveryLog: [...state.discoveryLog, trpgCopy('番人に押し戻されたが、調査記録は守り抜いた。', 'ばんにんにおしもどされたが、ちょうさきろくはまもりぬいた。', 'The guardian forces you back, but the investigation notes survive.')].slice(-18),
    };
  }
  return {
    ...state,
    phase: 'QUESTION',
    combat: { ...combat, result: 'WIN', resolution },
    pendingQuestionGate: getTrpgChapterMeta(state.chapter).clearGate,
    flags: { ...state.flags, combatResolution: resolution },
    discoveryLog: [...state.discoveryLog, trpgCopy('旧校舎の対決を乗り越えた。最後に調査記録を整理する。', 'きゅうこうしゃのたいけつをのりこえた。さいごにちょうさきろくをせいりする。', 'You overcome the old-wing encounter. One final review remains.')].slice(-18),
  };
};

export const performSchoolTrpgCombatAction = (
  state: TrpgCampaignState,
  action: TrpgCombatActionId,
): TrpgCampaignState => {
  if (state.phase !== 'COMBAT' || !state.combat || state.combat.result) return state;
  const rolled = rollD6(state);
  const combat = { ...state.combat, logs: [...state.combat.logs] };
  let guard = 0;
  let resolution: TrpgCombatResolution | null = null;

  if (action === 'STRIKE') {
    const amount = Math.max(1, state.stats.courage + Math.ceil(rolled.roll / 2) - 1);
    combat.enemyHp = Math.max(0, combat.enemyHp - amount);
    combat.logs.push({ turn: combat.turn, copy: combatCopy(action, amount) });
    if (combat.enemyHp <= 0) resolution = 'DEFEAT';
  } else if (action === 'INVESTIGATE') {
    combat.insight = clamp(combat.insight + 1 + (rolled.roll >= 4 ? 1 : 0) + (state.stats.study >= 3 ? 1 : 0), 0, 6);
    combat.logs.push({ turn: combat.turn, copy: combatCopy(action, combat.insight) });
  } else if (action === 'PERSUADE') {
    if (combat.insight < 3 && !state.flags.knowsPassphrase) {
      combat.logs.push({ turn: combat.turn, copy: trpgCopy('情報が足りず、言葉は番人へ届かなかった。', 'じょうほうがたりず、ことばはばんにんへとどかなかった。', 'Without enough insight, your words cannot reach the guardian.') });
    } else {
      const amount = Math.max(1, state.stats.friendship + Math.floor(rolled.roll / 2) + (state.flags.knowsPassphrase ? 1 : 0));
      combat.resolve = clamp(combat.resolve + amount, 0, 8);
      combat.logs.push({ turn: combat.turn, copy: combatCopy(action, combat.resolve) });
      if (combat.resolve >= 8) resolution = 'PERSUADE';
    }
  } else if (action === 'GUARD') {
    guard = state.stats.energy + 2;
    combat.logs.push({ turn: combat.turn, copy: combatCopy(action, guard) });
  } else if (action === 'ESCAPE') {
    const canEscape = combat.turn >= 3 || combat.insight >= 4 || state.clues >= 5;
    if (canEscape) {
      combat.logs.push({ turn: combat.turn, copy: trpgCopy('仲間と記録を守りながら、安全な退路へ離脱した。', 'なかまときろくをまもりながら、あんぜんなたいろへりだつした。', 'You withdraw through a safe route, protecting your ally and notes.') });
      resolution = 'ESCAPE';
    } else {
      combat.logs.push({ turn: combat.turn, copy: combatCopy(action, 0, Math.max(0, 3 - combat.turn)) });
    }
  }

  const withRoll: TrpgCampaignState = { ...state, rngStep: rolled.rngStep };
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
  combat.enemyIntent = 2 + ((combat.turn + state.seed) % 3);
  combat.logs = combat.logs.slice(-7);
  if (nextStress >= 6) return finishCombat({ ...withRoll, stress: nextStress }, combat, 'OVERWHELMED');
  return { ...withRoll, stress: nextStress, combat };
};

const evaluateEndingId = (state: TrpgCampaignState): string => {
  const resolution = state.flags.combatResolution as TrpgCombatResolution | undefined;
  const endings = getTrpgChapterEndings(state.chapter);
  if (state.chapter === 5 && resolution === 'PERSUADE' && state.flags.companionTrusted) {
    return endings[4]?.id || endings[1]?.id || endings[0]?.id || 'unfinished-map';
  }
  const index = resolution === 'PERSUADE' ? 1 : resolution === 'ESCAPE' ? 2 : resolution === 'OVERWHELMED' ? 3 : 0;
  return endings[index]?.id || endings[0]?.id || 'unfinished-map';
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
    discoveryLog: [...state.discoveryLog, trpgCopy(`発見物「${reward.name.ja}」を記録した。`, `はっけんぶつ「${reward.name.hira}」をきろくした。`, `Recorded the discovery: ${reward.name.en}.`)].slice(-18),
  };
  const endingId = evaluateEndingId(rewarded);
  return { ...rewarded, endingId };
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
  const completed = state.completedEventIds.filter(eventId => chapterEventIds.has(eventId)).length;
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
