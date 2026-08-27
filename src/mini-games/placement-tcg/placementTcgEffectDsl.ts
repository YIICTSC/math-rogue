import type { PlacementCardKind, PlacementEffectKey, PlacementTcgEdition } from './placementTcgCards';

/**
 * The placement TCG effect language deliberately describes intent rather than
 * screen behaviour. A card can therefore be audited, translated, simulated by
 * the CPU, and resolved by the engine from the same small AST.
 */
export type PlacementEffectTrigger =
  | 'DEPLOY'
  | 'ATTACK'
  | 'DIRECT_ATTACK'
  | 'DAMAGED'
  | 'DEFEAT'
  | 'TURN_START'
  | 'TURN_END'
  | 'EVENT_PLAY'
  | 'FINISH';

export type PlacementEffectTarget =
  | 'SELF'
  | 'OWN_SAME_LANE'
  | 'OWN_ANY'
  | 'OWN_ALL'
  | 'ENEMY_SAME_LANE'
  | 'ENEMY_ANY'
  | 'ENEMY_ALL'
  | 'ENEMY_LIFE'
  | 'ADJACENT_EMPTY'
  | 'SUPPORT_SAME_LANE';

export type PlacementEffectCondition =
  | 'ALWAYS'
  | 'HAS_ENEMY'
  | 'HAS_OWN_UNIT'
  | 'LIFE_BELOW_HALF'
  | 'SP_LEAD'
  | 'CENTER_LANE'
  | 'AFTER_MARK'
  | 'ODD_TURN'
  | 'EMPTY_LANE';

export type PlacementEffectResetRule = 'EVERY_TRIGGER' | 'ONCE_PER_TURN' | 'ONCE_PER_BATTLE';

export type PlacementEffectAction =
  | 'DAMAGE'
  | 'HEAL'
  | 'DRAW'
  | 'GAIN_SP'
  | 'BUFF_ATTACK'
  | 'BUFF_HEALTH'
  | 'SHIELD'
  | 'STUN'
  | 'MOVE'
  | 'BREAK_SUPPORT'
  | 'LIFE_DRAIN'
  | 'MARK'
  | 'REORDER_HAND'
  | 'DISCARD';

export interface PlacementEffectStep {
  action: PlacementEffectAction;
  target: PlacementEffectTarget;
  condition: PlacementEffectCondition;
  amount: number;
  duration: 0 | 1 | 2 | 3;
  label: string;
}

export interface PlacementEffectProgram {
  id: string;
  trigger: PlacementEffectTrigger;
  resetRule: PlacementEffectResetRule;
  memoryKey: string;
  steps: PlacementEffectStep[];
  legacyEffect: PlacementEffectKey;
  identityNote: string;
  normalizedSignature: string;
  tags: string[];
  edition: PlacementTcgEdition;
  kind: PlacementCardKind;
}

export interface PlacementEffectBuildContext {
  id: string;
  name: string;
  index: number;
  kind: PlacementCardKind;
  edition: PlacementTcgEdition;
  amount: number;
  legacyEffect: PlacementEffectKey;
}

const UNIT_TRIGGERS: PlacementEffectTrigger[] = [
  'DEPLOY', 'ATTACK', 'DIRECT_ATTACK', 'DAMAGED', 'DEFEAT', 'TURN_START', 'TURN_END', 'FINISH',
];
const SUPPORT_TRIGGERS: PlacementEffectTrigger[] = ['DEPLOY', 'TURN_START', 'TURN_END', 'DEFEAT'];
const ACTIONS: PlacementEffectAction[] = [
  'DAMAGE', 'HEAL', 'DRAW', 'GAIN_SP', 'BUFF_ATTACK', 'BUFF_HEALTH', 'SHIELD',
  'STUN', 'MOVE', 'BREAK_SUPPORT', 'LIFE_DRAIN', 'MARK', 'REORDER_HAND', 'DISCARD',
];
const TARGETS: PlacementEffectTarget[] = [
  'SELF', 'OWN_SAME_LANE', 'OWN_ANY', 'OWN_ALL', 'ENEMY_SAME_LANE', 'ENEMY_ANY',
  'ENEMY_ALL', 'ENEMY_LIFE', 'ADJACENT_EMPTY', 'SUPPORT_SAME_LANE',
];
const CONDITIONS: PlacementEffectCondition[] = [
  'ALWAYS', 'HAS_ENEMY', 'HAS_OWN_UNIT', 'LIFE_BELOW_HALF', 'SP_LEAD',
  'CENTER_LANE', 'AFTER_MARK', 'ODD_TURN', 'EMPTY_LANE',
];
const RESETS: PlacementEffectResetRule[] = ['EVERY_TRIGGER', 'ONCE_PER_TURN', 'ONCE_PER_BATTLE'];

const actionLabel: Record<PlacementEffectAction, { jp: string; en: string }> = {
  DAMAGE: { jp: 'ダメージ', en: 'damage' },
  HEAL: { jp: '回復', en: 'heal' },
  DRAW: { jp: 'ドロー', en: 'draw' },
  GAIN_SP: { jp: 'SP回復', en: 'restore SP' },
  BUFF_ATTACK: { jp: '攻撃力強化', en: 'Attack boost' },
  BUFF_HEALTH: { jp: '体力強化', en: 'Health boost' },
  SHIELD: { jp: 'シールド', en: 'Shield' },
  STUN: { jp: '気絶', en: 'stun' },
  MOVE: { jp: '移動', en: 'move' },
  BREAK_SUPPORT: { jp: 'サポート破壊', en: 'break Support' },
  LIFE_DRAIN: { jp: '吸収', en: 'drain Life' },
  MARK: { jp: '記録', en: 'mark' },
  REORDER_HAND: { jp: '手札再編', en: 'reorder the hand' },
  DISCARD: { jp: '手札破棄', en: 'discard' },
};

const triggerLabel: Record<PlacementEffectTrigger, { jp: string; en: string }> = {
  DEPLOY: { jp: '配置時', en: 'on deploy' },
  ATTACK: { jp: '攻撃時', en: 'on attack' },
  DIRECT_ATTACK: { jp: '直接攻撃時', en: 'after a direct attack' },
  DAMAGED: { jp: '被ダメージ時', en: 'when damaged' },
  DEFEAT: { jp: '撃退時', en: 'after a defeat' },
  TURN_START: { jp: 'ターン開始時', en: 'at turn start' },
  TURN_END: { jp: 'ターン終了時', en: 'at turn end' },
  EVENT_PLAY: { jp: 'イベント解決時', en: 'when the event resolves' },
  FINISH: { jp: 'フィニッシュ時', en: 'when this card delivers the finish' },
};

const conditionLabel: Record<PlacementEffectCondition, { jp: string; en: string }> = {
  ALWAYS: { jp: '条件なし', en: 'always' },
  HAS_ENEMY: { jp: '敵がいる場合', en: 'if an enemy is present' },
  HAS_OWN_UNIT: { jp: '味方がいる場合', en: 'if an ally is present' },
  LIFE_BELOW_HALF: { jp: 'ライフ半分以下なら', en: 'if your Life is half or lower' },
  SP_LEAD: { jp: 'SPが相手より多ければ', en: 'if you have more SP' },
  CENTER_LANE: { jp: '中央レーンなら', en: 'if this is the center lane' },
  AFTER_MARK: { jp: '記録があれば', en: 'if its mark is active' },
  ODD_TURN: { jp: '奇数ターンなら', en: 'on odd turns' },
  EMPTY_LANE: { jp: '空きレーンがあれば', en: 'if an empty lane exists' },
};

const targetLabel: Record<PlacementEffectTarget, { jp: string; en: string }> = {
  SELF: { jp: '自身', en: 'itself' },
  OWN_SAME_LANE: { jp: '同じレーンの味方', en: 'the ally in this lane' },
  OWN_ANY: { jp: '味方1体', en: 'one allied unit' },
  OWN_ALL: { jp: '味方全体', en: 'all allied units' },
  ENEMY_SAME_LANE: { jp: '同じレーンの敵', en: 'the enemy in this lane' },
  ENEMY_ANY: { jp: '敵1体', en: 'one enemy unit' },
  ENEMY_ALL: { jp: '敵全体', en: 'all enemy units' },
  ENEMY_LIFE: { jp: '相手ライフ', en: 'the enemy Life total' },
  ADJACENT_EMPTY: { jp: '隣接する空きレーン', en: 'an adjacent empty lane' },
  SUPPORT_SAME_LANE: { jp: '同じレーンのサポート', en: 'the Support in this lane' },
};

export type PlacementEffectTermCategory = 'TRIGGER' | 'ACTION' | 'TARGET' | 'CONDITION' | 'RESET';

export interface PlacementEffectTermDefinition {
  key: string;
  category: PlacementEffectTermCategory;
  label: { jp: string; en: string };
  description: { jp: string; en: string };
}

const term = (
  key: string,
  category: PlacementEffectTermCategory,
  label: { jp: string; en: string },
  description: { jp: string; en: string },
): PlacementEffectTermDefinition => ({ key, category, label, description });

/** Short, player-facing explanations for the DSL vocabulary shown in details. */
export const PLACEMENT_EFFECT_TERM_DEFINITIONS: Record<string, PlacementEffectTermDefinition> = {
  ...Object.fromEntries((Object.keys(triggerLabel) as PlacementEffectTrigger[]).map(key => [key, term(
    key, 'TRIGGER', triggerLabel[key], {
      jp: {
        DEPLOY: 'このカードを配置した直後に効果を確認します。',
        ATTACK: 'このユニットが攻撃を宣言したときに効果を確認します。',
        DIRECT_ATTACK: '相手レーンが空いていて、ライフへ直接攻撃が通ったときに確認します。',
        DAMAGED: 'このユニットがダメージを受けた直後に確認します。',
        DEFEAT: 'このカードが相手ユニットを撃退した直後に確認します。',
        TURN_START: '自分のターンが始まったときに確認します。',
        TURN_END: '自分のターンを終えるときに確認します。',
        EVENT_PLAY: 'イベントカードの効果を解決するときに確認します。',
        FINISH: 'このカードで相手ライフを0にしたときのフィニッシュ処理です。',
      }[key],
      en: {
        DEPLOY: 'Checks immediately after this card is deployed.',
        ATTACK: 'Checks when this unit declares an attack.',
        DIRECT_ATTACK: 'Checks after a direct attack reaches the opponent Life.',
        DAMAGED: 'Checks immediately after this unit takes damage.',
        DEFEAT: 'Checks immediately after this card defeats an enemy unit.',
        TURN_START: 'Checks when your turn begins.',
        TURN_END: 'Checks as your turn ends.',
        EVENT_PLAY: 'Checks while an Event card is resolving.',
        FINISH: 'Resolves when this card reduces the opponent Life to zero.',
      }[key],
    },
  )])) as Record<string, PlacementEffectTermDefinition>,
  ...Object.fromEntries((Object.keys(actionLabel) as PlacementEffectAction[]).map(key => [key, term(
    key, 'ACTION', actionLabel[key], {
      jp: {
        DAMAGE: '対象の体力またはライフを減らします。',
        HEAL: '対象の体力を回復します。',
        DRAW: '山札からカードを引き、手札に加えます。',
        GAIN_SP: 'カードを使うためのSPを増やします。',
        BUFF_ATTACK: '対象ユニットの攻撃力を一時的に上げます。',
        BUFF_HEALTH: '対象ユニットの最大体力と現在体力を増やします。',
        SHIELD: '次に受けるダメージを肩代わりするシールドを付与します。',
        STUN: '対象ユニットを疲労状態にし、そのターンは攻撃できなくします。',
        MOVE: 'ユニットを隣の空きレーンへ移動します。',
        BREAK_SUPPORT: '対象レーンのサポート耐久値を減らします。',
        LIFE_DRAIN: '敵からライフを奪い、自分のライフを回復します。',
        MARK: '後続の効果が参照できる記録を残します。',
        REORDER_HAND: '手札を山札に戻して引き直します。',
        DISCARD: '手札からカードを捨てます。',
      }[key],
      en: {
        DAMAGE: 'Reduces the target unit health or Life.',
        HEAL: 'Restores health to the target.',
        DRAW: 'Draws cards from the deck into your hand.',
        GAIN_SP: 'Adds SP used to play cards.',
        BUFF_ATTACK: 'Temporarily raises the target unit attack.',
        BUFF_HEALTH: 'Raises the target unit maximum and current health.',
        SHIELD: 'Adds a shield that absorbs the next damage.',
        STUN: 'Rests the target unit so it cannot attack this turn.',
        MOVE: 'Moves a unit into an adjacent empty lane.',
        BREAK_SUPPORT: 'Reduces the durability of the lane Support.',
        LIFE_DRAIN: 'Steals Life from an enemy and restores your Life.',
        MARK: 'Leaves a marker that later effects can check.',
        REORDER_HAND: 'Returns hand cards to the deck and redraws them.',
        DISCARD: 'Removes cards from your hand.',
      }[key],
    },
  )])) as Record<string, PlacementEffectTermDefinition>,
  ...Object.fromEntries((Object.keys(targetLabel) as PlacementEffectTarget[]).map(key => [key, term(
    key, 'TARGET', targetLabel[key], {
      jp: {
        SELF: '効果を発動したこのカード自身が対象です。',
        OWN_SAME_LANE: 'このカードと同じレーンにいる味方が対象です。',
        OWN_ANY: '自分が選んだ味方1体が対象です。',
        OWN_ALL: '自分の場にいるすべての味方が対象です。',
        ENEMY_SAME_LANE: 'このカードと同じレーンにいる敵が対象です。',
        ENEMY_ANY: '自分が選んだ敵1体が対象です。',
        ENEMY_ALL: '相手の場にいるすべての敵が対象です。',
        ENEMY_LIFE: '相手プレイヤーのライフが対象です。',
        ADJACENT_EMPTY: '現在のレーンに隣接する空きレーンが対象です。',
        SUPPORT_SAME_LANE: 'このカードと同じレーンのサポートが対象です。',
      }[key],
      en: {
        SELF: 'The card that triggered this effect.',
        OWN_SAME_LANE: 'Your ally in this card lane.',
        OWN_ANY: 'One allied unit you choose.',
        OWN_ALL: 'All allied units on your field.',
        ENEMY_SAME_LANE: 'The enemy in this card lane.',
        ENEMY_ANY: 'One enemy unit you choose.',
        ENEMY_ALL: 'All enemy units on the opposing field.',
        ENEMY_LIFE: 'The opposing player Life total.',
        ADJACENT_EMPTY: 'An empty lane next to the current lane.',
        SUPPORT_SAME_LANE: 'The Support in this card lane.',
      }[key],
    },
  )])) as Record<string, PlacementEffectTermDefinition>,
  ...Object.fromEntries((Object.keys(conditionLabel) as PlacementEffectCondition[]).map(key => [key, term(
    key, 'CONDITION', conditionLabel[key], {
      jp: {
        ALWAYS: '追加条件はありません。',
        HAS_ENEMY: '同じ条件を満たす敵が場にいるときだけ解決します。',
        HAS_OWN_UNIT: '味方ユニットが場にいるときだけ解決します。',
        LIFE_BELOW_HALF: '自分のライフが最大値の半分以下のときだけ解決します。',
        SP_LEAD: '相手よりSPが多いときだけ解決します。',
        CENTER_LANE: '中央レーンにいるカードだけが解決します。',
        AFTER_MARK: '同じカードが先に残した記録があるときだけ解決します。',
        ODD_TURN: '奇数ターンのときだけ解決します。',
        EMPTY_LANE: '場に空きレーンが1つ以上あるときだけ解決します。',
      }[key],
      en: {
        ALWAYS: 'No additional condition is required.',
        HAS_ENEMY: 'Resolves only while a matching enemy is present.',
        HAS_OWN_UNIT: 'Resolves only while an allied unit is present.',
        LIFE_BELOW_HALF: 'Resolves only when your Life is at or below half.',
        SP_LEAD: 'Resolves only when you have more SP than the opponent.',
        CENTER_LANE: 'Resolves only for a card in the center lane.',
        AFTER_MARK: 'Resolves only after this card has left its marker.',
        ODD_TURN: 'Resolves only on odd-numbered turns.',
        EMPTY_LANE: 'Resolves only while at least one lane is empty.',
      }[key],
    },
  )])) as Record<string, PlacementEffectTermDefinition>,
  EVERY_TRIGGER: term('EVERY_TRIGGER', 'RESET', { jp: '毎回', en: 'every trigger' }, { jp: '条件を満たすたびに何度でも発動します。', en: 'Can resolve every time its trigger is satisfied.' }),
  ONCE_PER_TURN: term('ONCE_PER_TURN', 'RESET', { jp: '各ターン1回', en: 'once per turn' }, { jp: '同じターン中は1回だけ発動します。', en: 'Can resolve only once during each turn.' }),
  ONCE_PER_BATTLE: term('ONCE_PER_BATTLE', 'RESET', { jp: '1戦1回', en: 'once per battle' }, { jp: 'その対戦中に1回だけ発動します。', en: 'Can resolve only once during the battle.' }),
};

export const getPlacementEffectTerms = (program: PlacementEffectProgram): PlacementEffectTermDefinition[] => {
  const keys = [
    program.trigger,
    program.resetRule,
    ...program.steps.flatMap(step => [step.action, step.target, step.condition]),
  ];
  const seen = new Set<string>();
  return keys
    .filter(key => !seen.has(key) && seen.add(key))
    .map(key => PLACEMENT_EFFECT_TERM_DEFINITIONS[key])
    .filter((definition): definition is PlacementEffectTermDefinition => Boolean(definition));
};

const targetPoolFor = (action: PlacementEffectAction): PlacementEffectTarget[] => {
  switch (action) {
    case 'DAMAGE':
      return ['ENEMY_SAME_LANE', 'ENEMY_ANY', 'ENEMY_ALL', 'ENEMY_LIFE'];
    case 'STUN':
      return ['ENEMY_SAME_LANE', 'ENEMY_ANY', 'ENEMY_ALL'];
    case 'LIFE_DRAIN':
      return ['ENEMY_SAME_LANE', 'ENEMY_ANY', 'ENEMY_ALL', 'ENEMY_LIFE'];
    case 'BREAK_SUPPORT':
      return ['SUPPORT_SAME_LANE', 'ENEMY_SAME_LANE', 'ENEMY_ANY', 'ENEMY_ALL'];
    case 'HEAL':
    case 'BUFF_ATTACK':
    case 'BUFF_HEALTH':
    case 'SHIELD':
      return ['SELF', 'OWN_SAME_LANE', 'OWN_ANY', 'OWN_ALL'];
    case 'MOVE':
      return ['ADJACENT_EMPTY', 'SELF', 'OWN_ANY', 'OWN_ALL'];
    case 'DRAW':
    case 'GAIN_SP':
    case 'MARK':
    case 'REORDER_HAND':
    case 'DISCARD':
      return ['SELF'];
    default:
      return TARGETS;
  }
};

// Labels are presentation metadata, not effect identity. Amount and duration
// are included so two cards that happen to use the same verb still audit as
// different only when their actual state mutation differs.
const stepSignature = (step: PlacementEffectStep): string => [
  step.action, step.target, step.condition, step.amount, step.duration,
].join(':');

const renderStep = (step: PlacementEffectStep): { jp: string; en: string } => {
  const action = actionLabel[step.action];
  const target = targetLabel[step.target];
  const condition = conditionLabel[step.condition];
  const amount = step.action === 'MOVE' || step.action === 'REORDER_HAND' || step.action === 'MARK'
    ? ''
    : String(step.amount);
  const jpAmount = amount ? ` ${amount}` : '';
  const enAmount = amount ? ` ${amount}` : '';
  const targetText = ['DRAW', 'GAIN_SP', 'MARK', 'REORDER_HAND', 'DISCARD'].includes(step.action)
    ? ''
    : `${target.jp}へ`;
  const targetTextEn = ['DRAW', 'GAIN_SP', 'MARK', 'REORDER_HAND', 'DISCARD'].includes(step.action)
    ? ''
    : ` to ${target.en}`;
  return {
    jp: `${condition.jp}、${targetText}${action.jp}${jpAmount}。`,
    en: `${action.en}${enAmount}${targetTextEn} ${condition.en}.`,
  };
};

/** Build a deterministic, auditable program for every card in the catalogue. */
export const buildPlacementEffectProgram = (context: PlacementEffectBuildContext): PlacementEffectProgram => {
  const triggers = context.kind === 'EVENT'
    ? ['EVENT_PLAY'] as PlacementEffectTrigger[]
    : context.kind === 'SUPPORT' ? SUPPORT_TRIGGERS : UNIT_TRIGGERS;
  const trigger = triggers[context.index % triggers.length];
  const action = ACTIONS[(context.index * 3 + context.amount) % ACTIONS.length];
  const target = targetPoolFor(action)[(context.index * 5 + context.amount) % targetPoolFor(action).length];
  const condition = CONDITIONS[(context.index * 7 + context.amount) % CONDITIONS.length];
  const secondAction = ACTIONS[(context.index * 11 + 2) % ACTIONS.length];
  const secondTargetPool = targetPoolFor(secondAction);
  const secondTarget = secondTargetPool[(context.index * 13 + 1) % secondTargetPool.length];
  const secondCondition = CONDITIONS[(context.index * 17 + 3) % CONDITIONS.length];
  const steps: PlacementEffectStep[] = [
    {
      action,
      target,
      condition,
      amount: 1 + ((context.index + context.amount) % 5),
      duration: (context.index % 4) as 0 | 1 | 2 | 3,
      label: `step-${context.index + 1}-a`,
    },
    {
      action: secondAction,
      target: secondTarget,
      condition: secondCondition,
      amount: 1 + ((context.index * 2 + context.amount) % 5),
      duration: ((context.index + 1) % 4) as 0 | 1 | 2 | 3,
      label: `step-${context.index + 1}-b`,
    },
  ];
  const resetRule = RESETS[(context.index + context.amount) % RESETS.length];
  const memoryKey = `tcg:${context.id}`;
  const normalizedSignature = [
    context.kind, context.edition, trigger, resetRule,
    ...steps.map(stepSignature),
  ].join('|');
  return {
    id: `DSL_${context.id}`,
    trigger,
    resetRule,
    memoryKey,
    steps,
    legacyEffect: context.legacyEffect,
    identityNote: `${context.name} uses a ${triggerLabel[trigger].en} sequence with a private memory slot.`,
    normalizedSignature,
    tags: [context.edition, context.kind, trigger, action],
    edition: context.edition,
    kind: context.kind,
  };
};

export const renderPlacementEffectProgram = (
  program: PlacementEffectProgram,
  baseRules: { jp: string; en: string },
): { jp: string; en: string } => {
  const rendered = program.steps.map(renderStep);
  const trigger = triggerLabel[program.trigger];
  const reset = program.resetRule === 'ONCE_PER_TURN'
    ? { jp: '（各ターン1回）', en: ' (once per turn)' }
    : program.resetRule === 'ONCE_PER_BATTLE'
      ? { jp: '（1戦1回）', en: ' (once per battle)' }
      : { jp: '', en: '' };
  return {
    jp: `${baseRules.jp} 固有効果：${trigger.jp}、${rendered.map(step => step.jp).join(' ')}${reset.jp}`,
    en: `${baseRules.en} Unique effect: ${trigger.en}; ${rendered.map(step => step.en).join(' ')}${reset.en}`,
  };
};

export const getPlacementEffectSignature = (program: PlacementEffectProgram): string => program.normalizedSignature;
