import type { EndlessGimmickProgress, RewardItem } from '../types';
import { assetUrl } from '../utils/assetPaths';

export type EndlessArc = 'elementary' | 'high-school' | 'magic';
export type EndlessBossTier = 'BOSS' | 'MAJOR_BOSS';
export type EndlessRewardSlot =
  | 'SAFE'
  | 'LEARNING'
  | 'RISK'
  | 'CORE'
  | 'GROWTH'
  | 'CONTRACT'
  | 'PERMANENT'
  | 'RECORD';
export type EndlessRewardScope = 'RUN' | 'PERMANENT' | 'RECORD';

export interface EndlessRewardChoice {
  id: string;
  bossId: string;
  slot: EndlessRewardSlot;
  name: string;
  description: string;
  scope: EndlessRewardScope;
  effectKey: string;
  oncePerRun: boolean;
  oncePerProfile: boolean;
}

export type EndlessGimmickEvent =
  | {
      type: 'LEARNING_ANSWER';
      correct: boolean;
      isRetry?: boolean;
      subjectId?: string;
      mode?: string;
      phase?: number;
      segment?: number;
      bossBattle?: boolean;
      battleId?: string;
    }
  | {
      type: 'CARD_PLAY';
      cardType?: string;
      turn?: number;
      damage?: number;
      block?: number;
      segment?: number;
      bossBattle?: boolean;
      battleId?: string;
    };

export interface EndlessBossDefinition {
  id: string;
  arc: EndlessArc;
  /** Boss chapter. Chapters after 50 are generated deterministically. */
  floor: number;
  tier: EndlessBossTier;
  name: string;
  theme: string;
  mechanicKey: string;
  mechanicSummary: string;
  /** Number of HP phases used by the boss. Normal bosses use one phase. */
  phaseCount: number;
  /** Short, non-colour-coded preparation hints shown on the map preview. */
  weakness: string;
  recommendedPrep: string;
  rewards: EndlessRewardChoice[];
}

const PHASE_GIMMICKS = new Set(['NOX_ROOT', 'NOX_PRIME', 'NOX_ORIGIN']);
const SAME_SUBJECT_STREAK_GIMMICKS = new Set(['STREAK_CHECK', 'REPEAT_RECORD', 'GATE_SEQUENCE', 'WAVEFORM', 'STAR_KEY', 'ORBITAL_ORDER']);
const LEARNING_COUNT_GIMMICKS = new Set(['UNPROCESSED', 'SUBJECT_TRIAD', 'UNREAD_PAGE', 'UNDEFINED', 'TEST_TRIAD', 'NOISE', 'CONTRACT', 'BLANK_VERDICT', 'SEALED_PAGE']);
const UNIQUE_CARD_TYPE_GIMMICKS = new Set(['PROTOCOL_TRIAD', 'ROOFTOP_COMBO', 'ATTRIBUTE_SEAL', 'PRISM_TRIAD', 'MORPH_AFTERIMAGE', 'LUNAR_PHASE']);

const phaseCountByMechanic: Record<string, number> = {
  STREAK_CHECK: 3,
  NOX_ROOT: 4,
  NOX_PRIME: 4,
  NOX_ORIGIN: 4,
};

export const getEndlessGimmickTarget = (mechanicKey: string, phaseCount = 3): number => {
  // The final boss has four HP phases, but the game presents the learning
  // challenge once after the battle.  Requiring one answer per HP phase would
  // therefore be impossible.  Keep the combat phase count separate from the
  // attainable learning target (the standard challenge has three answers).
  if (PHASE_GIMMICKS.has(mechanicKey)) return Math.min(3, Math.max(1, phaseCount));
  if (mechanicKey === 'RESUBMIT' || mechanicKey === 'UNPROCESSED' || mechanicKey === 'UNREAD_PAGE' || mechanicKey === 'UNDEFINED' || mechanicKey === 'NOISE' || mechanicKey === 'CONTRACT' || mechanicKey === 'BLANK_VERDICT' || mechanicKey === 'SEALED_PAGE' || mechanicKey === 'REFLECTION' || mechanicKey === 'TIME_SLICE' || mechanicKey === 'TIME_PHASE') return 1;
  if (mechanicKey === 'STREAK_CHECK' || mechanicKey === 'REPEAT_RECORD') return 3;
  if (mechanicKey === 'GATE_SEQUENCE' || mechanicKey === 'WAVEFORM' || mechanicKey === 'STAR_KEY' || mechanicKey === 'ORBITAL_ORDER' || mechanicKey === 'CATALYST' || mechanicKey === 'ATTRIBUTE_SEAL' || mechanicKey === 'MORPH_AFTERIMAGE') return 2;
  if (mechanicKey === 'SUBJECT_TRIAD' || mechanicKey === 'TEST_TRIAD' || mechanicKey === 'PROTOCOL_TRIAD' || mechanicKey === 'ROOFTOP_COMBO' || mechanicKey === 'PRISM_TRIAD') return 3;
  if (mechanicKey === 'BALANCE_SCORE') return 1;
  return 1;
};

const createEmptyGimmickProgress = (target: number, segment?: number): EndlessGimmickProgress => ({
  segment,
  progress: 0,
  target,
  achieved: false,
  streak: 0,
  cardTypes: [],
  phases: [],
  attackCount: 0,
  blockCount: 0,
  learningCount: 0,
});

const markGimmickAchieved = (progress: EndlessGimmickProgress, target: number): EndlessGimmickProgress => ({
  ...progress,
  target,
  progress: target,
  achieved: true,
});

/**
 * Advances one boss gimmick from a learning answer or a successfully played
 * card. The returned object is save-safe and deliberately does not mutate the
 * previous progress record.
 */
export const updateEndlessGimmickProgress = (
  current: EndlessGimmickProgress | undefined,
  mechanicKey: string,
  event: EndlessGimmickEvent,
  phaseCount = 3,
): EndlessGimmickProgress | undefined => {
  const target = getEndlessGimmickTarget(mechanicKey, phaseCount);
  const segment = event.segment ?? current?.segment;
  const previous = current && current.segment !== undefined && event.segment !== undefined && current.segment !== event.segment
    ? createEmptyGimmickProgress(target, event.segment)
    : current || createEmptyGimmickProgress(target, segment);
  if (previous.achieved) return previous;

  const next: EndlessGimmickProgress = {
    ...previous,
    segment,
    target,
    cardTypes: [...(previous.cardTypes || [])],
    phases: [...(previous.phases || [])],
  };

  if (event.type === 'LEARNING_ANSWER') {
    if (!event.correct) {
      if (SAME_SUBJECT_STREAK_GIMMICKS.has(mechanicKey)) {
        return { ...next, progress: 0, streak: 0, lastSubjectId: undefined };
      }
      return next;
    }

    if (event.isRetry) {
      return mechanicKey === 'RESUBMIT' ? markGimmickAchieved(next, target) : next;
    }

    if (PHASE_GIMMICKS.has(mechanicKey)) {
      // HP phases are combat presentation only.  Count the attainable
      // successful answers from the single post-battle learning challenge.
      if (!event.bossBattle || !Number.isFinite(event.phase) || (event.phase || 0) < 1) return next;
      next.learningCount = (next.learningCount || 0) + 1;
      next.progress = Math.min(target, next.learningCount);
      return next.progress >= target ? markGimmickAchieved(next, target) : next;
    }

    if (mechanicKey === 'BALANCE_SCORE') {
      next.learningCount = (next.learningCount || 0) + 1;
      const counts = [next.attackCount || 0, next.blockCount || 0, next.learningCount || 0];
      if (counts.every(count => count > 0) && Math.max(...counts) - Math.min(...counts) <= 1) {
        return markGimmickAchieved(next, target);
      }
      return next;
    }

    if (SAME_SUBJECT_STREAK_GIMMICKS.has(mechanicKey)) {
      const subjectId = event.subjectId || event.mode || 'UNKNOWN';
      const streak = next.lastSubjectId === subjectId ? (next.streak || 0) + 1 : 1;
      next.lastSubjectId = subjectId;
      next.streak = streak;
      next.progress = Math.min(target, streak);
      return next.progress >= target ? markGimmickAchieved(next, target) : next;
    }

    if (LEARNING_COUNT_GIMMICKS.has(mechanicKey)) {
      next.learningCount = (next.learningCount || 0) + 1;
      next.progress = Math.min(target, next.learningCount);
      return next.progress >= target ? markGimmickAchieved(next, target) : next;
    }

    return next;
  }

  const cardType = event.cardType;
  const validCardType = cardType === 'ATTACK' || cardType === 'SKILL' || cardType === 'POWER';
  if (!validCardType) return next;

  // "Consecutive" card conditions are consecutive within one battle.  A
  // chapter transition or a new battle must not inherit the previous card.
  if (event.battleId && next.lastBattleId !== event.battleId) {
    next.lastBattleId = event.battleId;
    next.streak = 0;
    next.lastCardType = undefined;
  }

  if (mechanicKey === 'TIME_SLICE' || mechanicKey === 'TIME_PHASE') {
    return event.bossBattle && event.turn !== undefined && event.turn <= 3 && cardType === 'ATTACK'
      ? markGimmickAchieved(next, target)
      : next;
  }

  if (mechanicKey === 'REFLECTION') {
    return cardType === 'SKILL' ? markGimmickAchieved(next, target) : next;
  }

  if (mechanicKey === 'CATALYST') {
    const streak = cardType === 'ATTACK' ? (next.lastCardType === 'ATTACK' ? (next.streak || 0) + 1 : 1) : 0;
    next.lastCardType = cardType;
    next.streak = streak;
    next.progress = Math.min(target, streak);
    return next.progress >= target ? markGimmickAchieved(next, target) : next;
  }

  if (mechanicKey === 'BALANCE_SCORE') {
    if (cardType === 'ATTACK' || (event.damage || 0) > 0) next.attackCount = (next.attackCount || 0) + 1;
    if ((event.block || 0) > 0) next.blockCount = (next.blockCount || 0) + 1;
    const counts = [next.attackCount || 0, next.blockCount || 0, next.learningCount || 0];
    if (counts.every(count => count > 0) && Math.max(...counts) - Math.min(...counts) <= 1) {
      return markGimmickAchieved(next, target);
    }
    return next;
  }

  if (mechanicKey === 'ATTRIBUTE_SEAL') {
    if (next.lastCardType && next.lastCardType !== cardType) return markGimmickAchieved(next, target);
    next.lastCardType = cardType;
    return next;
  }

  if (UNIQUE_CARD_TYPE_GIMMICKS.has(mechanicKey)) {
    if (!next.cardTypes!.includes(cardType)) next.cardTypes!.push(cardType);
    next.progress = Math.min(target, next.cardTypes!.length);
    return next.progress >= target ? markGimmickAchieved(next, target) : next;
  }

  return next;
};

const bossGuidance: Record<string, Pick<EndlessBossDefinition, 'weakness' | 'recommendedPrep'>> = {
  UNPROCESSED: { weakness: '区間内に学習判定へ1回成功して未処理データを消去', recommendedPrep: '区間内の学習機会を確保する' },
  STREAK_CHECK: { weakness: '区間内に同じ単元の学習判定へ3回連続成功', recommendedPrep: '同じ単元へ集中できる手札を整える' },
  GATE_SEQUENCE: { weakness: '区間内に同じ単元の学習判定へ2回連続成功', recommendedPrep: 'ブロックを確保して入力ターンを作る' },
  SUBJECT_TRIAD: { weakness: '区間内に学習判定へ3回成功', recommendedPrep: '同じ単元でもよいので問題機会を確保' },
  UNREAD_PAGE: { weakness: '区間内に学習判定へ1回成功して封印ページを回収', recommendedPrep: '区間内の学習機会を確保する' },
  PROTOCOL_TRIAD: { weakness: '指定カードタイプの解決', recommendedPrep: 'ATTACK・SKILL・POWERを各1枚残す' },
  TIME_SLICE: { weakness: '早いターンの高火力', recommendedPrep: '初手の攻撃と防御を両方準備' },
  REPEAT_RECORD: { weakness: '区間内に同じ単元の学習判定へ3回連続成功', recommendedPrep: '同じ単元の問題へ集中できる手札にする' },
  UNDEFINED: { weakness: '区間内に学習判定へ1回成功して空白を復元', recommendedPrep: '区間内の学習機会を確保する' },
  NOX_ROOT: { weakness: '最終ボス戦後の学習判定に3回成功', recommendedPrep: '最終ボス戦後の3問に備えて集中力を残す' },
  RESUBMIT: { weakness: '再提出の学習判定', recommendedPrep: '失敗後の再試行用に1ターン余裕を作る' },
  TEST_TRIAD: { weakness: '区間内に学習判定へ3回成功', recommendedPrep: '同じ単元でもよいので問題機会を確保' },
  NOISE: { weakness: '区間内に学習判定へ1回成功して通知ノイズを解除', recommendedPrep: '区間内の学習機会を確保する' },
  CONTRACT: { weakness: '区間内に学習判定へ3回成功して規約を解除', recommendedPrep: '区間内の学習機会を確保する' },
  CATALYST: { weakness: '攻撃カードの連続解決', recommendedPrep: '攻撃の間に防御カードを挟める構成' },
  ROOFTOP_COMBO: { weakness: '区間内に異なるカードタイプ3種を解決', recommendedPrep: 'タイプを偏らせず手札を整える' },
  BALANCE_SCORE: { weakness: '区間内の攻撃・ブロック・学習判定の均衡', recommendedPrep: '1ターンに3要素を無理なく進める' },
  BLANK_VERDICT: { weakness: '区間内に学習判定へ1回成功して白紙ルールを解除', recommendedPrep: '区間内の学習機会を確保する' },
  WAVEFORM: { weakness: '区間内に同じ単元の学習判定へ2回連続成功して波形を解除', recommendedPrep: '敵の次行動表示を有効にする' },
  NOX_PRIME: { weakness: '最終ボス戦後の学習判定に3回成功', recommendedPrep: '最終ボス戦後の3問に備えて集中力を残す' },
  TIME_PHASE: { weakness: 'ボス戦の3ターン以内にATTACKを解決', recommendedPrep: '直前カードを再演されても耐えるブロック' },
  ATTRIBUTE_SEAL: { weakness: '同一戦闘で異なる種類の魔法カードを2枚連続で解決', recommendedPrep: 'ATTACK・SKILL・POWERを2種類以上残す' },
  REFLECTION: { weakness: 'SKILLを1枚解決して反照片を破壊', recommendedPrep: '反射されても損しないSKILLを先に選ぶ' },
  PRISM_TRIAD: { weakness: '区間内に異なるカードタイプ3種を解決', recommendedPrep: 'ATTACK・SKILL・POWERをそろえる' },
  STAR_KEY: { weakness: '区間内に同じ単元の学習判定へ2回連続成功して星鍵を開く', recommendedPrep: '敵の順序表示と入力時間を確保' },
  LUNAR_PHASE: { weakness: '区間内に異なるカードタイプ2種を解決', recommendedPrep: '状態異常解除と防御を両方残す' },
  SEALED_PAGE: { weakness: '区間内に学習判定へ1回成功して封印を解除', recommendedPrep: '区間内の学習機会を確保する' },
  ORBITAL_ORDER: { weakness: '区間内に同じ単元の学習判定へ2回連続成功して防壁を開く', recommendedPrep: '単発の高火力を温存して防壁を割る' },
  MORPH_AFTERIMAGE: { weakness: '区間内に異なるカードタイプ2種を解決', recommendedPrep: 'ATTACK・SKILL・POWERを2種類以上用意' },
  NOX_ORIGIN: { weakness: '最終ボス戦後の学習判定に3回成功', recommendedPrep: '最終ボス戦後の3問に備えて集中力を残す' },
};

const bossRows: Array<[EndlessArc, number, EndlessBossTier, string, string, string, string]> = [
  ['elementary', 5, 'BOSS', '墨核端末ピポ', '未処理データを積み上げる端末', 'UNPROCESSED', 'S01区間内に学習判定へ1回成功すると端末の装甲が下がる。'],
  ['elementary', 10, 'MAJOR_BOSS', '採点殻ヴァルナ', '連続判定を採点する殻', 'STREAK_CHECK', 'S02区間内に同じ単元の学習判定へ3回連続成功すると装甲が変化する3フェーズ。'],
  ['elementary', 15, 'BOSS', '門式端末オクト', '八方向のゲートを持つ端末', 'GATE_SEQUENCE', 'S03区間内に学習判定へ2回連続成功するとゲートが開く。'],
  ['elementary', 20, 'MAJOR_BOSS', '三相演算体オルビス', '三つの演算相を回す中枢', 'SUBJECT_TRIAD', 'S04区間内に学習判定へ3回成功すると相が崩れる3フェーズ。同じ単元でよい。'],
  ['elementary', 25, 'BOSS', '頁喰いミラ', 'カードの頁を食べる断片体', 'UNREAD_PAGE', 'S05区間内に学習判定へ1回成功すると封印ページを回収する。'],
  ['elementary', 30, 'MAJOR_BOSS', '三監プロトコル・ノア', '三つの監査プロトコルを統合した体', 'PROTOCOL_TRIAD', 'S06区間内にATTACK・SKILL・POWERを各1回解決すると結界が崩れる3フェーズ。'],
  ['elementary', 35, 'BOSS', '刻喰いクロノル', '時間片を喰らう黒い演算体', 'TIME_SLICE', '3ターン以内にATTACKを解決すると時間片が止まり、敵の行動前倒しを防ぐ。'],
  ['elementary', 40, 'MAJOR_BOSS', '反復機リピタ', '同じ記録を再生する機械体', 'REPEAT_RECORD', 'S08区間内に同じ単元の学習判定へ3回連続成功すると停止する。直前のカード効果は弱く再演される。'],
  ['elementary', 45, 'BOSS', '空白面ブランクス', '空白の仮面だけが浮く存在', 'UNDEFINED', 'S09区間内に学習判定へ1回成功すると空白を復元する。'],
  ['elementary', 50, 'MAJOR_BOSS', '零号記録者ノクス・ルート', '小学生編へ投影された首領の零号体', 'NOX_ROOT', '最終ボス戦後の学習判定に3回成功すると、黒帳機関の記録を開示する。'],
  ['high-school', 5, 'BOSS', '再提出官レドゥン', '再提出データを回収する監督官', 'RESUBMIT', 'S01区間内に失敗した学習判定を1回再提出して成功すると未処理タグが消える。'],
  ['high-school', 10, 'MAJOR_BOSS', '三相試験体トライクス', '三つの試験相を持つ実験体', 'TEST_TRIAD', 'S02区間内に学習判定へ3回成功すると試験相が進む3フェーズ。同じ単元でよい。'],
  ['high-school', 15, 'BOSS', '通知残響ネイヴ', '通知の残響を放つ監査体', 'NOISE', 'S03区間内に学習判定へ1回成功すると通知ノイズを解除する。'],
  ['high-school', 20, 'MAJOR_BOSS', '規約執行体ヴェルデック', '規約違反を執行する体', 'CONTRACT', 'S04区間内に学習判定へ3回成功すると規約リングを解除する。'],
  ['high-school', 25, 'BOSS', '化成炉主任カルブリス', '化成炉を管理する主任体', 'CATALYST', 'S05区間内の同一戦闘でATTACKを2枚連続解決すると触媒反動が止まる。'],
  ['high-school', 30, 'MAJOR_BOSS', '屋上演算体バルグリフ', '屋上の風圧を演算する巨体', 'ROOFTOP_COMBO', 'S06区間内に異なるカードタイプ3種を解決すると防壁が開く3フェーズ。'],
  ['high-school', 35, 'BOSS', '評定演算体モノメル', '評定を数値化する演算体', 'BALANCE_SCORE', 'S07区間内の攻撃・ブロック・学習成功を各1件以上にし、3値の最大差を1以内にする。'],
  ['high-school', 40, 'MAJOR_BOSS', '白紙皇后アウレリア', '白紙の規約を統べる投影体', 'BLANK_VERDICT', 'S08区間内に学習判定へ1回成功すると白紙ルールを解除する。'],
  ['high-school', 45, 'BOSS', '周波監査体オルト', '周波形を監査する観測体', 'WAVEFORM', 'S09区間内に同じ単元の学習判定へ2回連続成功すると強化効果を解除する。'],
  ['high-school', 50, 'MAJOR_BOSS', '零号判定者ノクス・プライム', '高校編へ投影された首領の零号体', 'NOX_PRIME', '最終ボス戦後の学習判定に3回成功すると、判定を反転する。'],
  ['magic', 5, 'BOSS', '時相端末テンポラ', '三枚の時間板を回す端末', 'TIME_PHASE', 'C05ボス戦の3ターン以内にATTACKを解決すると時間板が止まり、直前のカード再演を防ぐ。'],
  ['magic', 10, 'MAJOR_BOSS', '封印監理体カテドラ', '属性封印輪を管理する構造体', 'ATTRIBUTE_SEAL', 'S02区間内の同一戦闘で異なるカードタイプ2枚を連続解決すると封印が解除される。'],
  ['magic', 15, 'BOSS', '反照体ヴェイル', '反照片で輪郭を作る存在', 'REFLECTION', 'S03区間内に`SKILL`を1枚解決すると反照片が壊れ、反射が止まる。'],
  ['magic', 20, 'MAJOR_BOSS', '三属性監督体プリズマ', '三属性の結界を展開する抽象体', 'PRISM_TRIAD', 'S04区間内にATTACK・SKILL・POWERを各1回解決すると結界が崩れる3フェーズ。'],
  ['magic', 25, 'BOSS', '星鍵収束体キーファ', '三本の星鍵フレームを束ねる体', 'STAR_KEY', 'S05区間内に同じ単元の学習判定へ2回連続成功すると属性耐性が下がる。'],
  ['magic', 30, 'MAJOR_BOSS', '欠月炉エクリプサ', '明光と暗相を切り替える炉心', 'LUNAR_PHASE', 'S06区間内に異なるカードタイプ2種を解決すると相が切り替わる3フェーズ。'],
  ['magic', 35, 'BOSS', '深層頁獣アビスラ', '頁状パネルが脚になる異形', 'SEALED_PAGE', 'S07区間内に学習判定へ1回成功すると封印を解除する。'],
  ['magic', 40, 'MAJOR_BOSS', '軌道観測体オルビタ', '三つの軌道リングを持つ球体', 'ORBITAL_ORDER', 'S08区間内に同じ単元の学習判定へ2回連続成功すると防壁が開く3フェーズ。'],
  ['magic', 45, 'BOSS', '変身残像体モルファ', '属性色の輪郭線だけでできた残像', 'MORPH_AFTERIMAGE', 'S09区間内に異なるカードタイプ2種を解決すると輪郭が崩れる。'],
  ['magic', 50, 'MAJOR_BOSS', '零号星核ノクス・オリジン', 'マジック編へ投影された首領の零号体', 'NOX_ORIGIN', '時間・封印・反照・軌道／残像を4フェーズで演出し、戦闘後の学習判定3回成功で星核を崩す。'],
];

const rewardRows: Record<EndlessArc, Record<number, Array<[EndlessRewardSlot, string, string, EndlessRewardScope, string]>>> = {
  elementary: {
    5: [['SAFE', '未処理クリアランス', '各戦闘の最初の弱体を無効化', 'RUN', 'IGNORE_FIRST_WEAK'], ['LEARNING', '学習メモ', '学習判定が提示された各戦闘で、最初に成功した学習判定の直後に1枚ドロー', 'RUN', 'DRAW_FIRST_LEARNING'], ['RISK', 'ピポ複製核', '1戦闘1回、直前に解決したカードを再使用。ただし弱体1', 'RUN', 'REPLAY_CARD']],
    10: [['CORE', '採点保護膜', '各戦闘で最初に発生した学習判定失敗による追加ペナルティを1回無効化', 'RUN', 'IGNORE_FIRST_LEARNING_FAIL'], ['GROWTH', '三相演算板', '次のカード報酬を異なるカードタイプ3種から選ぶ', 'RUN', 'TRIPLE_CARD_TYPES'], ['CONTRACT', '赤線逆流核', 'HP30％以下で次に解決するダメージ付きATTACKの最終ダメージを2倍。ただしHP5', 'RUN', 'LOW_HP_DOUBLE_ATTACK']],
    15: [['SAFE', '暗号ゲートの笛', '戦闘開始時、敵の最初の行動内容を表示', 'RUN', 'REVEAL_FIRST_INTENT'], ['LEARNING', '解除手順メモ', '同一戦闘内で同じsubjectIdの学習判定に3回連続成功するとエネルギー1', 'RUN', 'SUBJECT_STREAK_ENERGY'], ['RISK', 'オクト跳躍鍵', 'ゲート解除の学習判定に成功した後、次に出る小危険ノードを1回無視。ただしG20', 'RUN', 'SKIP_MINOR_NODE']],
    20: [['CORE', '三相バランサ', '同一戦闘で学習判定に成功するたびブロック2（最大3回）', 'RUN', 'SUBJECT_BLOCK'], ['GROWTH', '分野切替ノート', '同一戦闘で学習判定に3回成功した時、次に提示されるカード1枚の数値効果を＋25％し、コスト0', 'RUN', 'SUBJECT_TRIPLE_CARD'], ['CONTRACT', '収束反転核', '直前に解決したカード効果を再発動。ただし次ターン開始時に疲労1', 'RUN', 'RECAST_WITH_FATIGUE']],
    25: [['SAFE', '空白頁のしおり', '次に開く報酬画面を1回再抽選', 'RUN', 'REROLL_REWARD'], ['LEARNING', '読了マーカー', 'その周回で未達成のsubjectIdの学習判定に初めて成功するとブロック4', 'RUN', 'NEW_SUBJECT_BLOCK'], ['RISK', '頁間ショートカット', '呪いカードを1枚除去。ただし最大HP5', 'RUN', 'REMOVE_CURSE_HP5']],
    30: [['CORE', 'プロトコル・キー', '不利な階層ルールを1回無視', 'RUN', 'IGNORE_FLOOR_RULE'], ['GROWTH', '三監ログ', '次に進める2ノードの種類と報酬傾向を表示', 'RUN', 'REVEAL_NEXT_NODES'], ['CONTRACT', 'ノア上書きコード', '次の戦闘だけレリックが与える数値効果を＋25％。ただし混乱1', 'RUN', 'BOOST_RELIC_NEXT_BATTLE']],
    35: [['SAFE', 'クロノルの遅延杭', '1戦闘1回、敵の次行動を1ターン遅延', 'RUN', 'DELAY_ENEMY'], ['LEARNING', '刻み書き', '同一戦闘内で学習判定に3回連続成功した時、その連続成功カウンター1を次の戦闘へ持ち越す', 'RUN', 'CARRY_STREAK'], ['RISK', '時間借用', '1戦闘1回、プレイヤーターンを1回追加。ただしHP8', 'RUN', 'EXTRA_TURN_HP8']],
    40: [['CORE', '反復機の観測窓', '次に開くイベントの内容を1つ先読み', 'RUN', 'PREVIEW_EVENT'], ['GROWTH', 'ループ解除ノート', '同一戦闘内で同じsubjectIdの学習判定に2回連続成功するとG20', 'RUN', 'SUBJECT_STREAK_GOLD'], ['CONTRACT', '再演核', '直前の通常戦闘で獲得したGを同額追加。ただし次のショップ割引を失う', 'RUN', 'REPEAT_GOLD']],
    45: [['SAFE', '空白面のリセット', 'デッキから呪いを1枚除去', 'RUN', 'REMOVE_CURSE'], ['LEARNING', '復元インク', '未定義タグまたは数値効果の一時減衰が付いたカードを1枚選び、元の効果へ戻す', 'RUN', 'RESTORE_CARD'], ['RISK', '逆転面', '致死ダメージを1回だけHP1で耐える。ただし次のボスまで回復不可', 'RUN', 'CHEAT_DEATH_NO_HEAL']],
    50: [['PERMANENT', '学びの金バッジ', '50階称号＋次回開始時の報酬候補枠＋1', 'PERMANENT', 'ELEMENTARY_START_REWARD_PLUS'], ['PERMANENT', '明日の問題箱', '小学生編の開始分野選択を恒久解放', 'PERMANENT', 'ELEMENTARY_START_SUBJECT'], ['RECORD', 'ノクス断片', '黒帳機関の深層記録＋高難度「BLACKOUT」条件を解放', 'RECORD', 'UNLOCK_BLACKOUT']],
  },
  'high-school': {
    5: [['SAFE', '再提出キャンセルキー', '各戦闘1回、イベントの選択肢または報酬画面の候補を再抽選', 'RUN', 'REROLL_ONCE'], ['LEARNING', '科目タグ', 'その周回で、各subjectIdについて最初に成功した学習判定の直後に1枚ドロー', 'RUN', 'DRAW_FIRST_SUBJECT'], ['RISK', '過採点データ', 'HP30％以下の同一戦闘内で学習判定に成功した時、G20（1戦闘1回）。ただしHP5', 'RUN', 'LOW_HP_LEARNING_GOLD']],
    10: [['CORE', '三相バインダー', '次のカード報酬を異なるカードタイプ3種から選ぶ', 'RUN', 'TRIPLE_CARD_TYPES'], ['GROWTH', '教科連結ノート', '同一戦闘で学習判定に3回成功すると、次に提示されるカード1枚の数値効果を＋25％し、コスト0', 'RUN', 'SUBJECT_TRIPLE_CARD'], ['CONTRACT', 'トライクス再試験核', '直前に失敗した学習判定を1回だけ再試行。ただし敵の行動カウントを1進める', 'RUN', 'RETRY_LEARNING']],
    15: [['SAFE', '残響ミュート', '戦闘開始時の状態異常を1つ無効化', 'RUN', 'CLEANSE_START'], ['LEARNING', '通知ログ', '敵の次の2行動内容を常に表示', 'RUN', 'REVEAL_TWO_INTENTS'], ['RISK', 'ネイヴ増幅器', 'ノイズ1枚をエネルギー1へ変換。ただし山札にノイズ2枚', 'RUN', 'NOISE_TO_ENERGY']],
    20: [['CORE', '規約解除キー', 'ボス戦中の追加ルールを1回解除', 'RUN', 'IGNORE_BOSS_RULE'], ['GROWTH', '規約分析表', '次の10階層の不利ルール候補を見て1つ除外', 'RUN', 'REMOVE_CONTRACT'], ['CONTRACT', '例外条項', '規約違反時の反撃ダメージの50％を次のダメージ付きATTACKへ加算。ただしカード1枚をロック', 'RUN', 'CONTRACT_COUNTER']],
    25: [['SAFE', '反応式ノート', 'カード1枚の数値効果を次の3戦闘だけ＋25％', 'RUN', 'BOOST_CARD_3_BATTLES'], ['LEARNING', '安全手順', 'フェーズ内の学習判定に全問成功した時、付与中の状態異常を1つ解除', 'RUN', 'PHASE_CLEANSE'], ['RISK', 'カルブリス触媒', '次に解決する3枚のダメージ付きATTACKが1.5倍。ただし各攻撃でHP2', 'RUN', 'ATTACK_BOOST_HP2']],
    30: [['CORE', '単独演算バンド', '同一戦闘内で学習判定に3回連続成功するたび、または同じカードタイプのカードを2枚連続で解決するたびに、次の3戦闘の与ダメージを10％上げる（合計3回まで）', 'RUN', 'COMBO_DAMAGE'], ['GROWTH', 'コンボ設計図', '各戦闘開始時、コンボ数1から開始', 'RUN', 'START_COMBO'], ['CONTRACT', '越境コード', '同一戦闘内で異なる2カードタイプのカードを連続で2枚解決するとエネルギー1。ただし次ターンはドロー不可', 'RUN', 'TYPE_CHAIN_ENERGY']],
    35: [['SAFE', '評定メモリ', '次のマップでルートごとの報酬傾向を表示', 'RUN', 'REVEAL_ROUTE_REWARDS'], ['LEARNING', '均衡評価表', '同一戦闘内の「攻撃カード解決数」「ブロックカード解決数」「学習判定成功数」の最大値と最小値の差が1以内になった時、最大HP3', 'RUN', 'BALANCE_MAX_HP'], ['RISK', '逆評定コード', '次戦闘で最初に付く不利効果1つを同量の有利効果へ反転。ただし次戦闘開始時に弱体1', 'RUN', 'REVERSE_DEBUFF']],
    40: [['SAFE', '再計測免除証', '致死ダメージを1回だけHP1で耐える', 'RUN', 'CHEAT_DEATH'], ['LEARNING', '答案アーカイブ', '過去に確定した報酬カードから1枚を再取得', 'RUN', 'RECLAIM_CARD'], ['CONTRACT', '先行採点', '次の3戦闘開始時に与ダメージを10％。ただしその間は回復不可', 'RUN', 'DAMAGE_UP_NO_HEAL']],
    45: [['SAFE', 'オルト・モニター', '敵の次の2行動を常に表示', 'RUN', 'REVEAL_TWO_INTENTS'], ['LEARNING', '遮断波形', '敵の強化効果を1回解除', 'RUN', 'REMOVE_ENEMY_BUFF'], ['RISK', 'ノイズブースト', 'ノイズ1枚をダメージへ変換。ただし追加ノイズ2枚', 'RUN', 'NOISE_TO_DAMAGE']],
    50: [['PERMANENT', '卒業証書・深層級', '50階称号＋次回開始時のカード候補枠＋1', 'PERMANENT', 'HIGH_SCHOOL_START_REWARD_PLUS'], ['PERMANENT', '黒帳章', '高校編開始時に3つのチャレンジ条件から1つを選ぶ機能を恒久解放', 'PERMANENT', 'HIGH_SCHOOL_CHALLENGE_SELECT'], ['RECORD', '判定反転コード', '黒帳機関の本部記録＋高難度「VERDICT」条件を解放', 'RECORD', 'UNLOCK_VERDICT']],
  },
  magic: {
    5: [['SAFE', 'テンポラの差分キー', '各戦闘1回、直前に解決したカードの効果を取り消し、同じコストで選び直す', 'RUN', 'RETRY_CARD'], ['LEARNING', '時相ログ', '各戦闘で、直前に解決したカードと異なる種類の魔法カードを最初に解決した時、1枚ドロー', 'RUN', 'DRAW_ATTRIBUTE_SWITCH'], ['RISK', '加速核', '1戦闘1回、プレイヤーターンを1回追加。ただし腐蝕1', 'RUN', 'EXTRA_TURN_CORRUPTION']],
    10: [['CORE', 'カテドラの解除鍵', 'ランダムな属性封印を1つ無効化', 'RUN', 'BREAK_ATTRIBUTE_SEAL'], ['GROWTH', '属性連結譜', '異なる種類の魔法カードを2枚連続で解決するとブロック6', 'RUN', 'ATTRIBUTE_CHAIN_BLOCK'], ['CONTRACT', '封印逆流核', '属性封印を1つ解除。ただし次の戦闘開始時、別の種類の魔法カードを1つ封印', 'RUN', 'REBOUND_SEAL']],
    15: [['SAFE', 'ヴェイルの反照片', '各戦闘1回、直前に解決したSKILLの数値効果を50％にして複製', 'RUN', 'REFLECT_SKILL'], ['LEARNING', '反照観測', '敵の次の2行動内容を常に表示', 'RUN', 'REVEAL_TWO_INTENTS'], ['RISK', '二重詠唱', '次に解決する属性ID付き魔法カードを2回発動。ただしコスト＋1', 'RUN', 'DOUBLE_SPELL']],
    20: [['CORE', 'プリズマの分光片', '次の変身または固有能力のコストを1回、1エネルギー減らす（最低0）', 'RUN', 'ABILITY_COST_MINUS'], ['GROWTH', '三属性譜', '同一戦闘で異なる種類の魔法カードを3種類解決すると状態異常を全解除', 'RUN', 'THREE_ATTRIBUTE_CLEANSE'], ['CONTRACT', '分光核', 'カード1枚の数値効果を＋25％する。ただしHP10', 'RUN', 'BOOST_CARD_HP10']],
    25: [['SAFE', 'キーファの星片', '次のマップの分岐を1つ追加表示', 'RUN', 'REVEAL_BRANCH'], ['LEARNING', '星鍵座標', '次のエリート報酬に異なる種類の魔法カード候補を1枚保証', 'RUN', 'GUARANTEE_ATTRIBUTE_CARD'], ['RISK', '収束核', '異なる種類の魔法カードを3枚解決後、次のダメージ付きATTACKを1.5倍。ただし1種類を次戦闘で使用不可', 'RUN', 'THREE_ATTRIBUTE_ATTACK']],
    30: [['CORE', 'エクリプサの相切替器', '各戦闘1回、攻撃寄り／防御寄りを切替', 'RUN', 'STANCE_SWITCH'], ['GROWTH', '明暗観測', '次に開く2イベントの結果候補を先読み', 'RUN', 'PREVIEW_EVENTS'], ['CONTRACT', '欠月炉逆位相', '次に解決するカード1枚の数値効果を2倍。ただしその次は半減', 'RUN', 'DOUBLE_THEN_HALF']],
    35: [['SAFE', 'アビスラの栞鍵', '各戦闘1回、捨て札または封印カードを手札へ戻す', 'RUN', 'RETURN_DISCARD'], ['LEARNING', '未読記録', '各戦闘で最初に封印解除の学習判定に成功した直後、ドロー1＋ブロック4', 'RUN', 'SEALED_LEARNING_REWARD'], ['RISK', '頁獣再封印', '呪いカードを1枚除去。ただし最もレアリティの高いカードを1枚封印', 'RUN', 'REMOVE_CURSE_SEAL_RARE']],
    40: [['SAFE', 'オルビタの星図', '次に進む3階層の敵・イベント候補を先読み', 'RUN', 'PREVIEW_FLOORS'], ['LEARNING', '軌道計算譜', '新エリア進入時、エネルギー1', 'RUN', 'AREA_ENERGY'], ['CONTRACT', '重力鍵', '次の戦闘で最初に解決する攻撃の敵ブロックを無視。ただし自分のブロック上限を半減', 'RUN', 'PIERCE_FIRST_ATTACK']],
    45: [['SAFE', 'モルファの残光', '変身状態の持続ターンを1回延長', 'RUN', 'EXTEND_TRANSFORM'], ['LEARNING', '変身観測', '変身後に最初に解決するダメージ付きATTACKを複製', 'RUN', 'COPY_TRANSFORM_ATTACK'], ['RISK', '鏡像核', '固有能力を1回再使用。ただし腐蝕2', 'RUN', 'REUSE_ABILITY_CORRUPTION']],
    50: [['PERMANENT', 'ノクス・オリジンの星冠', '50階称号＋次回開始時に変身ゲージ10', 'PERMANENT', 'MAGIC_START_GAUGE'], ['PERMANENT', '九属性解放コード', 'マジック編の開始フォーム選択を恒久解放', 'PERMANENT', 'MAGIC_START_FORM_SELECT'], ['RECORD', '原典鍵', '黒帳機関の首領記録＋高難度「ORIGIN」条件を解放', 'RECORD', 'UNLOCK_ORIGIN']],
  },
};

export const ENDLESS_BOSSES: EndlessBossDefinition[] = bossRows.map(([arc, floor, tier, name, theme, mechanicKey, mechanicSummary]) => {
  const bossId = `ENDLESS-${arc.toUpperCase().replace('-', '_')}-${String(floor).padStart(2, '0')}`;
  const choices = (rewardRows[arc][floor] || []).map(([slot, rewardName, description, scope, effectKey]) => ({
    id: `${bossId}-${slot}`,
    bossId,
    slot,
    name: rewardName,
    description,
    scope,
    effectKey,
    oncePerRun: true,
    oncePerProfile: scope === 'PERMANENT' || scope === 'RECORD',
  }));
  const guidance = bossGuidance[mechanicKey] || {
    weakness: '学習判定成功のタイミング',
    recommendedPrep: '手札とHPを余裕のある状態に整える',
  };
  return {
    id: bossId,
    arc,
    floor: floor as EndlessBossDefinition['floor'],
    tier,
    name,
    theme,
    mechanicKey,
    mechanicSummary,
    phaseCount: phaseCountByMechanic[mechanicKey] || (tier === 'MAJOR_BOSS' ? 3 : 1),
    ...guidance,
    rewards: choices,
  };
});

const TRUE_ENDLESS_MECHANICS = [
  'REPEAT_RECORD', 'WAVEFORM', 'ATTRIBUTE_SEAL', 'MORPH_AFTERIMAGE',
  'ORBITAL_ORDER', 'NOISE', 'TIME_PHASE', 'CATALYST', 'STAR_KEY', 'CONTRACT',
] as const;

const TRUE_ENDLESS_BOSS_NAMES: Record<EndlessArc, string[]> = {
  elementary: ['反復深度体リピタ', '空白深度体ブランクス', '演算深度体オルビス', '門式深度体オクト'],
  'high-school': ['周波深度体オルト', '規約深度体ヴェルデック', '評定深度体モノメル', '屋上深度体バルグリフ'],
  magic: ['深層星獣ノクティス', '反照深度体ヴェイル', '軌道深度体オルビタ', '原典深度体アーカイヴ'],
};

/**
 * True endless chapters have no finite boss table. Generate their boss from
 * the chapter number so saves, replays, and coop clients resolve the same
 * name, gimmick, reward IDs, and phase count without another content table.
 */
const createTrueEndlessBoss = (arc: EndlessArc, floor: number): EndlessBossDefinition => {
  const index = Math.max(0, Math.floor((floor - 55) / 5));
  const tier: EndlessBossTier = floor % 10 === 0 ? 'MAJOR_BOSS' : 'BOSS';
  const mechanicKey = TRUE_ENDLESS_MECHANICS[index % TRUE_ENDLESS_MECHANICS.length];
  const bossId = `ENDLESS-${arc.toUpperCase().replace('-', '_')}-${String(floor).padStart(2, '0')}`;
  const slots: EndlessRewardSlot[] = tier === 'MAJOR_BOSS' ? ['CORE', 'GROWTH', 'CONTRACT'] : ['SAFE', 'LEARNING', 'RISK'];
  const rewardNames: Record<EndlessRewardSlot, [string, string, string]> = {
    SAFE: ['深層安定核', 'HPを10回復する', 'FALLBACK_HEAL'],
    LEARNING: ['深層記録金', '75Gを得る', 'FALLBACK_GOLD'],
    RISK: ['深層改良片', '未強化カードを1枚強化する', 'FALLBACK_CARD_UPGRADE'],
    CORE: ['深層コア', 'HPを10回復する', 'FALLBACK_HEAL'],
    GROWTH: ['深層成長記録', '75Gを得る', 'FALLBACK_GOLD'],
    CONTRACT: ['深層契約片', '未強化カードを1枚強化する', 'FALLBACK_CARD_UPGRADE'],
    PERMANENT: ['深層記章', 'HPを10回復する', 'FALLBACK_HEAL'],
    RECORD: ['深層記録片', '75Gを得る', 'FALLBACK_GOLD'],
  };
  const guidance = bossGuidance[mechanicKey] || {
    weakness: '区間内の学習判定成功とカード解決を積み重ねる',
    recommendedPrep: '学習機会と3種類のカードを確保する',
  };
  return {
    id: bossId,
    arc,
    floor,
    tier,
    name: TRUE_ENDLESS_BOSS_NAMES[arc][index % TRUE_ENDLESS_BOSS_NAMES[arc].length],
    theme: `第${floor}章の深層を巡回する${arc}監査体`,
    mechanicKey,
    mechanicSummary: `真エンドレス第${floor}章の深層ギミック。${guidance.weakness}。`,
    phaseCount: tier === 'MAJOR_BOSS' ? 3 : 1,
    ...guidance,
    rewards: slots.map((slot, slotIndex) => {
      const [name, description, effectKey] = rewardNames[slot];
      return {
        id: `${bossId}-${slot}`,
        bossId,
        slot,
        name: `${name} ${slotIndex + 1}`,
        description,
        scope: 'RUN' as const,
        effectKey,
        oncePerRun: true,
        oncePerProfile: false,
      };
    }),
  };
};

export const getEndlessBoss = (arc: EndlessArc | undefined, floor: number) => {
  if (!arc) return undefined;
  const fixedBoss = ENDLESS_BOSSES.find((boss) => boss.arc === arc && boss.floor === floor);
  if (fixedBoss) return fixedBoss;
  return floor > 50 && floor % 5 === 0 ? createTrueEndlessBoss(arc, floor) : undefined;
};

export const getEndlessBossById = (id: string | undefined) => {
  if (!id) return undefined;
  const fixedBoss = ENDLESS_BOSSES.find((boss) => boss.id === id);
  if (fixedBoss) return fixedBoss;
  const match = id.match(/^ENDLESS-(ELEMENTARY|HIGH_SCHOOL|MAGIC)-(\d+)$/);
  if (!match) return undefined;
  const arc = match[1] === 'HIGH_SCHOOL' ? 'high-school' : match[1].toLowerCase() as EndlessArc;
  const floor = Number(match[2]);
  return floor > 50 && floor % 5 === 0 ? createTrueEndlessBoss(arc, floor) : undefined;
};

export const getEndlessArc = (theme: string | undefined): EndlessArc =>
  theme === 'high-school' || theme === 'magic' ? theme : 'elementary';

export const getEndlessBossSpritePath = (boss: EndlessBossDefinition, action: 'idle' | 'attack' | 'skill' = 'idle') =>
  assetUrl(`sprites/endless-bosses/${boss.arc}/${String(boss.floor).padStart(2, '0')}-${action}.webp`);

export const createEndlessRewardItems = (boss: EndlessBossDefinition, claimedIds: string[], prefix: string): RewardItem[] => {
  const available = boss.rewards.filter((reward) => !claimedIds.includes(reward.id));
  // The final floor is a special permanent/record pool rather than a normal
  // major-boss CORE/GROWTH/CONTRACT pool.  Keep the two permanent choices
  // distinct when selecting the three visible cards.
  const slots: EndlessRewardSlot[] = boss.floor === 50
    ? ['PERMANENT', 'PERMANENT', 'RECORD']
    : boss.tier === 'MAJOR_BOSS' ? ['CORE', 'GROWTH', 'CONTRACT'] : ['SAFE', 'LEARNING', 'RISK'];
  const fallbackNames: Record<EndlessRewardSlot, [string, string, string]> = {
    SAFE: ['深層の回復箱', 'HPを10回復', 'FALLBACK_HEAL'],
    LEARNING: ['深層の補給箱', 'Gを75獲得', 'FALLBACK_GOLD'],
    RISK: ['深層の改良箱', '未強化カードを1枚強化', 'FALLBACK_CARD_UPGRADE'],
    CORE: ['深層の回復箱', 'HPを10回復', 'FALLBACK_HEAL'],
    GROWTH: ['深層の補給箱', 'Gを75獲得', 'FALLBACK_GOLD'],
    CONTRACT: ['深層の改良箱', '未強化カードを1枚強化', 'FALLBACK_CARD_UPGRADE'],
    PERMANENT: ['深層の回復箱', 'HPを10回復', 'FALLBACK_HEAL'],
    RECORD: ['深層の補給箱', 'Gを75獲得', 'FALLBACK_GOLD'],
  };
  const selectedRewardIds = new Set<string>();
  const selected = slots.map((slot, slotIndex) => {
    const reward = available.find((candidate) => candidate.slot === slot && !selectedRewardIds.has(candidate.id));
    if (reward) selectedRewardIds.add(reward.id);
    if (reward) return reward;
    const [name, description, effectKey] = fallbackNames[slot];
    return {
      id: `${boss.id}-FALLBACK-${slot}-${slotIndex}`,
      bossId: boss.id,
      slot,
      name,
      description,
      scope: 'RUN' as const,
      effectKey,
      oncePerRun: false,
      oncePerProfile: false,
    };
  });
  const seed = Array.from(prefix).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
  const offset = seed % selected.length;
  const ordered = selected.map((_, index) => selected[(index + offset) % selected.length]);
  return ordered.map((reward) => ({ type: 'ENDLESS_REWARD', value: reward, id: `${prefix}-${reward.id}` }));
};
