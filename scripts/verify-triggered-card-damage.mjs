import { readFileSync } from 'node:fs';

const constantsSource = readFileSync('src/constants.ts', 'utf8');
const additionalCardsSource = readFileSync('src/constants1.ts', 'utf8');
const appSource = readFileSync('src/App.tsx', 'utf8');
const cardUtilsSource = readFileSync('src/utils/cardUtils.ts', 'utf8');

const requiredCards = [
  ['摩擦熱', constantsSource],
  ['幾何学模様', additionalCardsSource],
];

for (const [cardName, source] of requiredCards) {
  const pattern = new RegExp(
    `${cardName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}[^\\n]+5ダメージ[^\\n]+STATIC_DISCHARGE[^\\n]+amount:\\s*1`,
  );
  if (!pattern.test(source)) {
    throw new Error(`${cardName}: STATIC_DISCHARGE 1スタック＝5ダメージの定義が崩れています`);
  }
}

if (!cardUtilsSource.includes("case 'STATIC_DISCHARGE': return `被弾時ランダム${5 * amount}ダメージ`")) {
  throw new Error('カード合成表示のSTATIC_DISCHARGE倍率が5倍ではありません');
}

if (!appSource.includes("const staticDischargeDamage = p.powers['STATIC_DISCHARGE'] * 5;")) {
  throw new Error('戦闘処理のSTATIC_DISCHARGE倍率が5倍ではありません');
}

if (!appSource.includes('target.currentHp -= staticDischargeDamage;')) {
  throw new Error('STATIC_DISCHARGEの計算結果が敵HPへ適用されていません');
}

process.stdout.write('✓ 摩擦熱・幾何学模様の被弾反撃は1スタックにつき5ダメージ\n');
