import { createServer } from 'vite';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
});

try {
  const { EXPANSION_CARDS } = await server.ssrLoadModule('/src/data/expansionCards.ts');
  const { applyAdditionalCardLogic } = await server.ssrLoadModule('/src/services/cardEffectLogic.ts');
  const { synthesizeCards } = await server.ssrLoadModule('/src/utils/cardUtils.ts');
  const { buildEnglishCardDescription, buildHiraganaCardDescription, trans } = await server.ssrLoadModule('/src/utils/textUtils.ts');
  const { describeExpansionEffectEnglish } = await server.ssrLoadModule('/src/data/expansionCardTranslations.ts');
  const { EXPANSION_CARD_HIRAGANA_NAMES } = await server.ssrLoadModule('/src/data/expansionCardHiragana.ts');
  const { CardType, TargetType, EnemyIntentType } = await server.ssrLoadModule('/src/types.ts');

  const cards = Object.entries(EXPANSION_CARDS).map(([id, card]) => ({ id, ...card }));
  assert(cards.length === 224, `expected 224 expansion cards, found ${cards.length}`);
  assert(cards.every(card => Number.isFinite(card.cost)), 'expansion cards contain a non-finite cost');
  assert(new Set(cards.map(card => card.expansionEffect?.serial)).size === 224, 'expansion serials are not unique');
  assert(Object.keys(EXPANSION_CARD_HIRAGANA_NAMES).length === 224, 'hiragana name dictionary does not cover exactly 224 cards');

  const makeHelper = (id, type = CardType.SKILL, cost = 2) => ({
    id,
    name: `テスト補助${id}`,
    cost,
    type,
    target: TargetType.SELF,
    description: 'ブロック1。',
    block: 1,
    rarity: 'COMMON',
  });

  const makeEnemy = (type) => ({
    id: 'test-enemy',
    name: 'テスト敵',
    maxHp: 30,
    currentHp: 30,
    block: 0,
    strength: 0,
    weak: 0,
    vulnerable: 0,
    poison: 0,
    artifact: 0,
    nextIntent: { type, value: 5 },
  });

  const makeScenario = (card) => {
    const condition = card.expansionEffect.condition;
    const helperCost = condition === 'HIGHEST_COST_IN_HAND' ? Math.max(0, card.cost) : 2;
    const helperType = condition === 'SAME_TYPE_IN_HAND' ? card.type : CardType.SKILL;
    const helper = makeHelper('helper', helperType, helperCost);
    const extra = makeHelper('extra', CardType.ATTACK, 1);
    let hand = [card, helper];
    if (condition === 'RIGHTMOST') hand = [helper, card];
    if (condition === 'HAND_ODD') hand = [card, helper, extra];

    const player = {
      maxHp: 20,
      currentHp: 5,
      maxEnergy: 10,
      currentEnergy: condition === 'ENERGY_ZERO_AFTER' ? card.cost : card.cost + 2,
      block: 0,
      strength: 0,
      gold: 0,
      deck: [],
      hand,
      discardPile: [makeHelper('discarded')],
      drawPile: [makeHelper('draw-1'), makeHelper('draw-2')],
      relics: [],
      potions: [],
      powers: {},
      echoes: 0,
      cardsPlayedThisTurn: condition === 'THIRD_OR_LATER' ? 2 : 0,
      attacksPlayedThisTurn: 0,
      typesPlayedThisTurn: [],
      relicCounters: {},
      turnFlags: {},
      floatingText: null,
      nextTurnEnergy: 0,
      nextTurnDraw: 0,
      codexBuffer: [],
    };
    if (condition === 'DRAW_EVEN') player.drawPile = [makeHelper('draw-1'), makeHelper('draw-2')];
    if (condition === 'DISCARD_ODD') player.discardPile = [makeHelper('discarded')];

    const enemyIntent = condition === 'ENEMY_NOT_ATTACKING' ? EnemyIntentType.DEFEND : EnemyIntentType.ATTACK;
    return { player, enemies: [makeEnemy(enemyIntent)], helperId: helper.id };
  };

  const makeUnmetScenario = (card) => {
    const scenario = makeScenario(card);
    const condition = card.expansionEffect.condition;
    const helper = makeHelper('unmet-helper', card.type === CardType.SKILL ? CardType.ATTACK : CardType.SKILL, card.cost + 1);
    const extra = makeHelper('unmet-extra', CardType.ATTACK, 1);
    switch (condition) {
      case 'LEFTMOST': scenario.player.hand = [helper, card]; break;
      case 'RIGHTMOST': scenario.player.hand = [card, helper]; break;
      case 'HAND_EVEN': scenario.player.hand = [card, helper, extra]; break;
      case 'HAND_ODD': scenario.player.hand = [card, helper]; break;
      case 'ENERGY_ZERO_AFTER': scenario.player.currentEnergy = card.cost + 1; break;
      case 'ENERGY_EVEN_AFTER': scenario.player.currentEnergy = card.cost + 1; break;
      case 'NO_BLOCK': scenario.player.block = 1; break;
      case 'LOW_HP': scenario.player.currentHp = scenario.player.maxHp; break;
      case 'ENEMY_ATTACKING': scenario.enemies = [makeEnemy(EnemyIntentType.DEFEND)]; break;
      case 'ENEMY_NOT_ATTACKING': scenario.enemies = [makeEnemy(EnemyIntentType.ATTACK)]; break;
      case 'DRAW_EVEN': scenario.player.drawPile = [makeHelper('one-draw')]; break;
      case 'DISCARD_ODD': scenario.player.discardPile = [makeHelper('discard-1'), makeHelper('discard-2')]; break;
      case 'NO_ATTACK_PLAYED': scenario.player.attacksPlayedThisTurn = 1; break;
      case 'THIRD_OR_LATER': scenario.player.cardsPlayedThisTurn = 1; break;
      case 'SAME_TYPE_IN_HAND': scenario.player.hand = [card, helper]; break;
      case 'HIGHEST_COST_IN_HAND': scenario.player.hand = [card, helper]; break;
    }
    return scenario;
  };

  const verifyReward = (reward, before, after, helperId) => {
    const enemyBefore = before.enemies[0];
    const enemyAfter = after.enemies[0];
    switch (reward) {
      case 'DRAW': return after.player.hand.length === before.player.hand.length + 1;
      case 'BLOCK': return after.player.block === before.player.block + 5;
      case 'ENERGY': return after.player.currentEnergy === before.player.currentEnergy + 1;
      case 'HEAL': return after.player.currentHp === Math.min(before.player.maxHp, before.player.currentHp + 3);
      case 'NEXT_DRAW': return after.player.nextTurnDraw === before.player.nextTurnDraw + 1;
      case 'NEXT_ENERGY': return after.player.nextTurnEnergy === before.player.nextTurnEnergy + 1;
      case 'STRENGTH': return after.player.strength === before.player.strength + 1;
      case 'DEXTERITY': return after.player.powers.DEXTERITY === (before.player.powers.DEXTERITY || 0) + 1;
      case 'POISON_RANDOM': return enemyAfter.poison === enemyBefore.poison + 3;
      case 'WEAK_ALL': return enemyAfter.weak === enemyBefore.weak + 1;
      case 'RECOVER_DISCARD': return after.player.discardPile.length === before.player.discardPile.length - 1;
      case 'UPGRADE_HAND': return after.player.hand.find(card => card.id === helperId)?.upgraded === true;
      case 'DISCOUNT_HAND': return after.player.hand.find(card => card.id === helperId)?.cost === Math.max(0, before.player.hand.find(card => card.id === helperId).cost - 1);
      case 'HAND_COUNT_BLOCK': return after.player.block === before.player.block + before.player.hand.length;
      default: return false;
    }
  };

  const originalRandom = Math.random;
  Math.random = () => 0;
  try {
    for (const card of cards) {
      const scenario = makeScenario(card);
      const before = structuredClone(scenario);
      const logs = [];
      const effects = [];
      const result = applyAdditionalCardLogic(card, scenario.player, scenario.enemies, 'JAPANESE', logs, effects, card.cost);
      assert(logs.includes(`固有共鳴${String(card.expansionEffect.serial).padStart(3, '0')}が発動！`), `${card.id} did not activate`);
      assert(verifyReward(card.expansionEffect.reward, before, { player: result.player, enemies: result.enemies }, scenario.helperId), `${card.id} reward ${card.expansionEffect.reward} did not apply`);
      assert(effects.length === 1, `${card.id} did not emit exactly one activation effect`);

      const unmet = makeUnmetScenario(card);
      const unmetLogs = [];
      const unmetEffects = [];
      applyAdditionalCardLogic(card, unmet.player, unmet.enemies, 'JAPANESE', unmetLogs, unmetEffects, card.cost);
      assert(unmetLogs.includes(`固有共鳴${String(card.expansionEffect.serial).padStart(3, '0')}は条件未達`), `${card.id} activated when its condition was unmet`);
      assert(unmetEffects.length === 0, `${card.id} emitted an activation effect when unmet`);

      const languageResults = ['JAPANESE', 'HIRAGANA', 'ENGLISH'].map(languageMode => {
        const localizedScenario = makeScenario(card);
        const localizedResult = applyAdditionalCardLogic(
          card,
          localizedScenario.player,
          localizedScenario.enemies,
          languageMode,
          [],
          [],
          card.cost,
        );
        return JSON.stringify({ player: localizedResult.player, enemies: localizedResult.enemies });
      });
      assert(new Set(languageResults).size === 1, `${card.id} effect state changes between language modes`);
      if (card.expansionEffect.condition === 'SAME_TYPE_IN_HAND') {
        const typeLabel = {
          ATTACK: '攻撃',
          SKILL: 'スキル',
          POWER: 'パワー',
          SUMMON: 'サモン',
          STATUS: '状態',
          CURSE: '呪い',
        }[card.type];
        assert(card.description.includes(`手札に${typeLabel}カードがある時`), `${card.id} did not use the concise card-type condition text`);
        assert(!card.description.includes('同じ種別の別カード'), `${card.id} retained the verbose card-type condition text`);
      }
    }
  } finally {
    Math.random = originalRandom;
  }

  const ordinary = makeHelper('ordinary');
  for (const card of cards) {
    const synthesized = synthesizeCards(card, ordinary);
    assert(synthesized.expansionEffects?.some(effect => effect.serial === card.expansionEffect.serial), `${card.id} lost its expansion effect during synthesis`);
    assert(!synthesized.description.includes('固有共鳴'), `${card.id} exposed its expansion label during synthesis`);
    assert(synthesized.description.includes(card.description.split('。').slice(-2, -1)[0]), `${card.id} lost its expansion condition or reward during synthesis`);
  }

  const left = cards.find(card => card.expansionEffect.serial === 1);
  const right = cards.find(card => card.expansionEffect.serial === 16);
  const combined = synthesizeCards(left, right);
  const combinedScenario = makeScenario(combined);
  combinedScenario.player.hand = [combined];
  const combinedLogs = [];
  const combinedResult = applyAdditionalCardLogic(combined, combinedScenario.player, combinedScenario.enemies, 'JAPANESE', combinedLogs, [], combined.cost);
  assert(combined.expansionEffects?.length === 2, 'two expansion effects were not retained together');
  assert(combinedLogs.some(log => log.includes('固有共鳴001が発動')), 'first synthesized expansion effect did not activate');
  assert(combinedLogs.some(log => log.includes('固有共鳴016が発動')), 'second synthesized expansion effect did not activate');
  assert(combinedResult.player.block === 5, 'synthesized block reward did not apply');
  assert(combinedResult.player.hand.length === 2, 'synthesized draw reward did not apply');
  const combinedLanguageResults = ['JAPANESE', 'HIRAGANA', 'ENGLISH'].map(languageMode => {
    const scenario = makeScenario(combined);
    scenario.player.hand = [combined];
    const result = applyAdditionalCardLogic(combined, scenario.player, scenario.enemies, languageMode, [], [], combined.cost);
    return JSON.stringify({ player: result.player, enemies: result.enemies });
  });
  assert(new Set(combinedLanguageResults).size === 1, 'synthesized effect state changes between language modes');

  const kanjiPattern = /[一-龯々〆ヵヶ]/;
  const japanesePattern = /[ぁ-んァ-ヶ一-龯々〆ヵヶ]/;
  for (const card of cards) {
    const name = trans(card.name, 'HIRAGANA');
    const description = buildHiraganaCardDescription(card);
    const englishDescription = buildEnglishCardDescription(card);
    const directEnglishDescription = trans(card.description, 'ENGLISH');
    const activationLog = trans(`固有共鳴${String(card.expansionEffect.serial).padStart(3, '0')}が発動！`, 'HIRAGANA');
    const unmetLog = trans(`固有共鳴${String(card.expansionEffect.serial).padStart(3, '0')}は条件未達`, 'HIRAGANA');
    assert(name === EXPANSION_CARD_HIRAGANA_NAMES[card.name], `${card.id} did not use its exact hiragana name`);
    assert(!kanjiPattern.test(name), `${card.id} hiragana name contains kanji: ${name}`);
    assert(!kanjiPattern.test(description), `${card.id} hiragana description contains kanji: ${description}`);
    assert(!description.includes('こゆうきょうめい'), `${card.id} exposed its expansion label in hiragana description`);
    assert(description.includes('、'), `${card.id} hiragana description lost its expansion condition or reward`);
    assert(!kanjiPattern.test(activationLog), `${card.id} activation log contains kanji: ${activationLog}`);
    assert(!kanjiPattern.test(unmetLog), `${card.id} unmet log contains kanji: ${unmetLog}`);
    assert(!japanesePattern.test(englishDescription), `${card.id} English card description contains Japanese: ${englishDescription}`);
    assert(!japanesePattern.test(directEnglishDescription), `${card.id} direct English description contains Japanese: ${directEnglishDescription}`);
    assert(!englishDescription.includes('Unique Resonance'), `${card.id} exposed its expansion label in English description: ${englishDescription}`);
    assert(!directEnglishDescription.includes('Unique Resonance'), `${card.id} direct English description exposed its resonance number`);
    assert(englishDescription.includes(describeExpansionEffectEnglish(card.expansionEffect, card.type)), `${card.id} English card description lost its expansion condition or reward: ${englishDescription}`);
    assert(directEnglishDescription.includes(describeExpansionEffectEnglish(card.expansionEffect, card.type)), `${card.id} direct English description lost its expansion condition or reward: ${directEnglishDescription}`);
  }

  const combinedEnglish = buildEnglishCardDescription(combined);
  const combinedHiragana = buildHiraganaCardDescription(combined);
  assert(!combinedEnglish.includes('Unique Resonance'), 'synthesized English description exposed an expansion label');
  assert(!combinedHiragana.includes('こゆうきょうめい'), 'synthesized hiragana description exposed an expansion label');
  assert(combined.expansionEffects.every(effect => combinedEnglish.includes(describeExpansionEffectEnglish(effect, combined.type))), 'synthesized English description lost an expansion condition or reward');
  assert((combinedHiragana.match(/、/g) || []).length >= combined.expansionEffects.length, 'synthesized hiragana description lost an expansion condition or reward');
  assert(!japanesePattern.test(combinedEnglish), `synthesized English description contains Japanese: ${combinedEnglish}`);
  assert(!kanjiPattern.test(combinedHiragana), `synthesized hiragana description contains kanji: ${combinedHiragana}`);

  console.log('Expansion card audit passed: 224/224 effects activate and apply their rewards.');
  console.log('Expansion synthesis audit passed: all effects and condition/reward descriptions are retained without expansion labels.');
  console.log('Expansion translation audit passed: 224 names, effects, conditions, and logs are exact in English and hiragana.');
  console.log('Language parity audit passed: Japanese, English, and hiragana produce identical battle state for all 224 effects and synthesis.');
} finally {
  await server.close();
}
