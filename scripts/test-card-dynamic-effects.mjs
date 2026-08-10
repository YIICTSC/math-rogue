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
  const { ADDITIONAL_CARDS } = await server.ssrLoadModule('/src/constants1.ts');
  const { CARDS_LIBRARY } = await server.ssrLoadModule('/src/constants.ts');
  const { EXPANSION_CARDS } = await server.ssrLoadModule('/src/data/expansionCards.ts');
  const { getCardDamage, getCardPlayCost } = await server.ssrLoadModule('/src/utils/cardDamage.ts');

  const xCards = [
    'EXP_ELEM_PE_07',
    'EXP_HS_SCI_06',
    'EXP_HS_STAGE_05',
    'EXP_CROSS_CRAFT_04',
    'EXP_CROSS_CONDITION_04',
  ];
  for (const id of xCards) {
    const card = EXPANSION_CARDS[id];
    assert(card?.xCost === true && card.cost === 0, `${id} is not an X-cost card`);
    assert(getCardPlayCost(card, 3) === 3, `${id} does not spend all available energy`);
  }

  const gravity = ADDITIONAL_CARDS.BOYS_GRAVITY_PRESS;
  assert(getCardDamage(gravity, { block: 12 }) === 24, 'gravity press is not block x2');

  const revenge = ADDITIONAL_CARDS.BOYS_REVENGE;
  assert(getCardDamage(revenge, { hpLostThisTurn: 7 }) === 14, 'revenge burst does not use HP lost this turn');

  const wolfPack = ADDITIONAL_CARDS.BOYS_WOLF_PACK;
  assert(getCardDamage(wolfPack, { handCountExcludingSelf: 3, attackCountInHand: 2 }) === 15, 'wolf pack does not count attack cards in hand');

  const arcade = ADDITIONAL_CARDS.OUT_ARCADE_MASTER;
  assert(getCardDamage(arcade, { cardsPlayedThisTurn: 3 }) === 24, 'arcade master does not count all cards played');

  const mineBlast = CARDS_LIBRARY.MINE_BLAST_G;
  assert(getCardDamage(mineBlast, { cardsPlayedThisTurn: 3 }) === 12, 'mine blast does not count all cards played');

  const tradingCard = ADDITIONAL_CARDS.OUT_TRADING_CARD;
  assert(getCardDamage(tradingCard, { deckCount: 10 }) === 10, 'trading card does not count the full deck');

  const finalFantasy = ADDITIONAL_CARDS.BOYS_FINAL_FANTASY;
  assert(getCardDamage(finalFantasy, { cardsPlayedThisBattle: 4 }) === 20, 'final fantasy does not count cards played in battle');

  const hero = ADDITIONAL_CARDS.OUT_MY_HERO;
  assert(hero.lowHpCostZero === true && hero.lowHpDamageMultiplier === 2, 'my hero low-HP condition is not represented in card data');

  assert(CARDS_LIBRARY.HOSHI_PRESENT.addPotion === true, 'star gift does not grant a potion');
  assert(CARDS_LIBRARY.MELTER.removeEnemyBlock === true, 'melter does not remove enemy block');
  assert(ADDITIONAL_CARDS.BOYS_RAILGUN.removeEnemyBlock === true, 'railgun does not remove enemy block');

  console.log('Dynamic card effect tests passed.');
} finally {
  await server.close();
}
