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
  const { synthesizeCards } = await server.ssrLoadModule('/src/utils/cardUtils.ts');
  const { buildEnglishCardName } = await server.ssrLoadModule('/src/utils/textUtils.ts');
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
  };

  const synthesized = synthesizeCards(attack, skill);
  const englishName = buildEnglishCardName(synthesized);
  assert(synthesized.originalNames?.includes(attack.name), 'first canonical source name was lost');
  assert(synthesized.originalNames?.includes(skill.name), 'second canonical source name was lost');
  assert(synthesized.damage === 5, 'attack effect was lost during synthesis');
  assert(synthesized.block === 4, 'block effect was lost during synthesis');
  assert(!/[ぁ-んァ-ヶ一-龠々〆ヵヶ]/.test(englishName), `English mashup contains Japanese: ${englishName}`);
  assert(!/^(Choose Option|Event Details|School Foe|Item)$/.test(englishName), `English mashup fell back to a placeholder: ${englishName}`);
  assert(englishName === buildEnglishCardName(synthesized), 'English mashup name is not stable');
  assert(englishName.length >= 6, `English mashup is too short: ${englishName}`);

  console.log(`Assignment reward landscape/controller checks passed.`);
  console.log(`English synthesis passed: ${synthesized.name} => ${englishName}`);
} finally {
  await server.close();
}
