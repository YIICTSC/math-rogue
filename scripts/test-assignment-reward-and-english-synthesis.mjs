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
  const { normalizeIllustrationRefToken, synthesizeCards } = await server.ssrLoadModule('/src/utils/cardUtils.ts');
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
