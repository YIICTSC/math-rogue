import fs from 'node:fs';
import { createServer } from 'vite';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const appSource = fs.readFileSync('src/App.tsx', 'utf8');
const styles = fs.readFileSync('src/styles.css', 'utf8');

for (const required of [
  'assignment-progress-panel-with-card',
  'data-gamepad-modal',
  'data-gamepad-navigation-root',
  'data-gamepad-zone="assignment-progress-actions"',
  'data-gamepad-initial-choice',
  'data-gamepad-back',
]) {
  assert(appSource.includes(required), `assignment reward modal is missing ${required}`);
}

for (const required of [
  '"reward heading"',
  '"reward details"',
  '"reward actions"',
  'grid-template-columns: minmax(12rem, 0.78fr) minmax(19rem, 1.22fr)',
  'env(safe-area-inset-left)',
  'env(safe-area-inset-right)',
]) {
  assert(styles.includes(required), `landscape assignment reward layout is missing ${required}`);
}

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
});

try {
  const { getUpgradedCard, normalizeIllustrationRefToken, synthesizeCards } = await server.ssrLoadModule('/src/utils/cardUtils.ts');
  const { getCardDamage } = await server.ssrLoadModule('/src/utils/cardDamage.ts');
  const { EXPANSION_CARDS } = await server.ssrLoadModule('/src/data/expansionCards.ts');
  const { buildEnglishCardName, transEventText } = await server.ssrLoadModule('/src/utils/textUtils.ts');
  const { CardType, TargetType } = await server.ssrLoadModule('/src/types.ts');

  const attack = {
    id: 'test-cheat',
    name: 'カンニング',
    cost: 1,
    type: CardType.ATTACK,
    target: TargetType.ENEMY,
    description: '5ダメージ。',
    damage: 5,
    rarity: 'COMMON',
  };
  const skill = {
    id: 'test-doll',
    name: 'お人形遊び',
    cost: 1,
    type: CardType.SKILL,
    target: TargetType.SELF,
    description: 'ブロック4。',
    block: 4,
    rarity: 'COMMON',
    illustrationRefs: ['asset:sprites/high-school/azuki/pounce.webp'],
  };

  const synthesized = synthesizeCards(attack, skill);
  const englishName = buildEnglishCardName(synthesized);
  assert(synthesized.originalNames?.includes(attack.name), 'first canonical source name was lost');
  assert(synthesized.originalNames?.includes(skill.name), 'second canonical source name was lost');
  assert(synthesized.damage === 5, 'attack effect was lost during synthesis');
  assert(synthesized.block === 4, 'block effect was lost during synthesis');
  assert(synthesized.illustrationRefs?.includes('asset:sprites/high-school/azuki/pounce.webp'), 'asset illustration ref was lost during synthesis');
  assert(normalizeIllustrationRefToken('asset:sprites/high-school/azuki/pounce.webp') === 'asset:sprites/high-school/azuki/pounce.webp', 'finisher rewrote an asset illustration ref as a card name');
  assert(!/[ぁ-んァ-ヶ一-龠々〆ヵヶ]/.test(englishName), `English mashup contains Japanese: ${englishName}`);
  assert(!/^(Choose Option|Event Details|School Foe|Item)$/.test(englishName), `English mashup fell back to a placeholder: ${englishName}`);
  assert(englishName === buildEnglishCardName(synthesized), 'English mashup name is not stable');
  assert(englishName.length >= 6, `English mashup is too short: ${englishName}`);

  const pencilAttack = { ...attack, id: 'PENCIL_ATTACK', name: 'えんぴつ攻撃' };
  const notebookGuard = { ...skill, id: 'NOTEBOOK_GUARD', name: 'ノートで防御' };
  const originalRandom = Math.random;
  Math.random = () => 0.99;
  const firstGeneration = synthesizeCards(pencilAttack, notebookGuard);
  const laterGeneration = synthesizeCards(pencilAttack, firstGeneration);
  Math.random = originalRandom;
  assert(laterGeneration.name.startsWith('えんぴつ'), `new source fragment did not remain first: ${laterGeneration.name}`);
  assert(laterGeneration.name.endsWith(firstGeneration.name), `existing synthesized name was shortened: ${laterGeneration.name}`);
  assert(laterGeneration.name.length > firstGeneration.name.length, `synthesized name did not grow: ${laterGeneration.name}`);
  assert(laterGeneration.synthesisDepth === 2, `synthesis generation was not recorded: ${laterGeneration.synthesisDepth}`);

  let longChain = synthesizeCards(
    { ...pencilAttack, id: 'CHAIN_01', name: '連結01', illustrationRefs: ['asset:chain-01'] },
    { ...skill, id: 'CHAIN_02', name: '連結02', illustrationRefs: ['asset:chain-02'] },
  );
  for (let index = 3; index <= 10; index += 1) {
    const previous = longChain;
    longChain = synthesizeCards(previous, {
      ...skill,
      id: `CHAIN_${String(index).padStart(2, '0')}`,
      name: `連結${String(index).padStart(2, '0')}`,
      illustrationRefs: [`asset:chain-${String(index).padStart(2, '0')}`],
    });
    assert(longChain.name.startsWith(previous.name), `long synthesis name stopped growing at ${index}: ${longChain.name}`);
    assert(longChain.name.length > previous.name.length, `long synthesis name did not grow at ${index}: ${longChain.name}`);
  }
  assert(longChain.originalNames?.length === 10, `long synthesis name history lost sources: ${longChain.originalNames?.length}`);
  assert(longChain.illustrationRefs?.length === 8, `long synthesis artwork did not cap at the latest 8 refs: ${longChain.illustrationRefs?.length}`);
  assert(longChain.illustrationRefs?.[0] === 'asset:chain-03', `long synthesis artwork did not start at the latest 8 refs: ${longChain.illustrationRefs?.join(',')}`);
  assert(longChain.illustrationRefs?.[7] === 'asset:chain-10', `long synthesis artwork did not retain the newest ref: ${longChain.illustrationRefs?.join(',')}`);

  const repeatedEnergy = synthesizeCards(
    { ...skill, id: 'ENERGY_ONE', name: '充電', energy: 1, description: 'エナジー+1。' },
    { ...attack, id: 'SWORD_BOOMERANG', name: 'ブーメラン', playCopies: 1 },
  );
  assert(repeatedEnergy.description.includes('エナジー+2'), `numeric energy effects were not consolidated: ${repeatedEnergy.description}`);
  assert(!repeatedEnergy.description.includes('エナジー+1。エナジー+1'), `energy effect is still duplicated: ${repeatedEnergy.description}`);
  assert(repeatedEnergy.description.endsWith('×2。'), `whole-card repeat count is not at the end: ${repeatedEnergy.description}`);
  assert(!/\d+ダメージx2/.test(repeatedEnergy.description), `repeat count is still attached only to damage: ${repeatedEnergy.description}`);

  const xAttack = { id: 'X_ATTACK', ...EXPANSION_CARDS.EXP_ELEM_PE_07 };
  const synthesizedX = synthesizeCards(xAttack, attack);
  assert(synthesizedX.xCost === true, 'X-cost flag was lost during synthesis');
  assert(synthesizedX.cost === 0, `synthesized X-cost card received a fixed cost: ${synthesizedX.cost}`);
  assert(synthesizedX.description.includes('×Xダメージ'), `synthesized X-cost description lost X scaling: ${synthesizedX.description}`);
  assert(getCardDamage(synthesizedX, { energySpent: 3 }) === (synthesizedX.damage || 0) * 3, 'synthesized X-cost damage does not scale with spent Energy');

  const upgradedX = getUpgradedCard(xAttack);
  assert(upgradedX.xCost === true, 'X-cost flag was lost during upgrade');
  assert(upgradedX.description.includes('×Xダメージ'), `upgraded X-cost description lost X scaling: ${upgradedX.description}`);

  const magicEventSources = ['src/data/magicRomanceDialogue.ts', 'src/services/magicRomanceEventService.ts'];
  const magicChoiceLabels = Array.from(new Set(magicEventSources.flatMap(file =>
    Array.from(fs.readFileSync(file, 'utf8').matchAll(/label: '([^']+)'/g), match => match[1])
  )));
  const untranslatedChoices = magicChoiceLabels
    .map(label => ({ label, translation: transEventText(label, 'ENGLISH') }))
    .filter(({ translation }) => /[ぁ-んァ-ヶ一-龠々〆ヵヶ]/.test(translation));
  assert(untranslatedChoices.length === 0, `Magic event choices remain untranslated: ${JSON.stringify(untranslatedChoices)}`);

  const relationshipSamples = [
    '星宮あかり（星冠の魔法騎士）',
    '朝霧 蓮（幼なじみ）',
    '好感度 20/100 / 第1段階 / 国語・発表',
    '絆 30/100 / 勢いと分析が互いを補う親友ルート',
  ];
  relationshipSamples.forEach((sample) => {
    const translation = transEventText(sample, 'ENGLISH');
    assert(!/[ぁ-んァ-ヶ一-龠々〆ヵヶ]/.test(translation), `Magic relationship metadata remains untranslated: ${sample} => ${translation}`);
  });

  console.log(`Assignment reward landscape/controller checks passed.`);
  console.log(`English synthesis passed: ${synthesized.name} => ${englishName}`);
  console.log(`Magic event English choices passed: ${magicChoiceLabels.length} labels.`);
} finally {
  await server.close();
}
