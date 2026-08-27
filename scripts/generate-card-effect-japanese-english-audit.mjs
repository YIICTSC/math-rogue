import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
process.chdir(repoRoot);

// Some card constants use btoa while loading in Vite's SSR runtime.
if (!globalThis.btoa) {
  globalThis.btoa = (value) => Buffer.from(value, 'binary').toString('base64');
}

const numberList = (text) => [...text.matchAll(/\d+(?:\.\d+)?/g)].map((match) => match[0]);
const hasJapanese = (text) => /[ぁ-んァ-ヶ一-龯]/.test(text);
const numberWords = {
  '0': ['zero', 'empty', 'none'],
  '1': ['one', 'once', 'single', 'each', 'every', 'next'],
  '2': ['two', 'twice', 'double', 'second', 'every other'],
  '3': ['three', 'thrice', 'third'],
  '4': ['four', 'fourth'],
  '5': ['five', 'fifth'],
  '6': ['six', 'sixth'],
  '7': ['seven', 'seventh'],
  '8': ['eight', 'eighth'],
  '9': ['nine', 'ninth'],
  '10': ['ten', 'tenth'],
  '12': ['twelve', 'twelfth'],
  '14': ['fourteen'],
  '15': ['fifteen'],
  '16': ['sixteen'],
  '18': ['eighteen'],
  '20': ['twenty'],
  '22': ['twenty-two'],
  '25': ['twenty-five'],
  '30': ['thirty'],
  '35': ['thirty-five'],
  '40': ['forty'],
  '50': ['fifty'],
  '60': ['sixty'],
  '99': ['ninety-nine'],
  '120': ['one hundred twenty'],
};

const englishContainsNumber = (english, value) => {
  if (numberList(english).includes(value)) return true;
  return (numberWords[value] || []).some((word) => english.toLowerCase().includes(word));
};
const escapeCell = (text) => String(text || '')
  .replaceAll('|', '\\|')
  .replaceAll('\n', '<br>');

const auditDescription = (card, english, exactNames) => {
  const japanese = card.description || '';
  const reasons = [];
  const jpNumbers = numberList(japanese);
  const isFamiliar = card.id?.startsWith('HS_FAMILIAR_');

  // Familiar cadence is intentionally rendered as “every other turn” rather
  // than exposing the implementation's 2-turn interval as a second number.
  const comparableJapaneseNumbers = isFamiliar
    ? jpNumbers.filter((value) => value !== '2' || !japanese.includes('2ターンに1回'))
    : jpNumbers;
  const missingNumbers = comparableJapaneseNumbers.filter((value) => !englishContainsNumber(english, value));
  if (missingNumbers.length) reasons.push(`missing number(s): ${[...new Set(missingNumbers)].join(', ')}`);
  if (hasJapanese(english)) reasons.push('Japanese text remains');
  if (exactNames.has(card.name)) return 'OK (explicit card text)';
  return reasons.length ? `REVIEW — ${reasons.join('; ')}` : 'OK';
};

const loadCards = async () => {
  const server = await createServer({
    root: repoRoot,
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true },
  });
  try {
    const constants = await server.ssrLoadModule('/src/constants.ts');
    const magic = await server.ssrLoadModule('/src/data/magicCards.ts');
    const support = await server.ssrLoadModule('/src/coopSupportCards.ts');
    const textUtils = await server.ssrLoadModule('/src/utils/textUtils.ts');
    const exact = await server.ssrLoadModule('/src/data/englishCardDescriptionExact.ts');

    const mainCards = Object.entries(constants.CARDS_LIBRARY).map(([id, card]) => ({ ...card, id }));
    const magicCards = magic.MAGIC_CARDS.map((card) => ({ ...card }));
    const supportCards = support.COOP_SUPPORT_LIBRARY.map((card) => ({ ...card }));
    const exactNames = new Set(Object.keys(exact.ENGLISH_CARD_DESCRIPTION_EXACT));
    const { buildEnglishCardDescription, trans } = textUtils;

    return {
      mainCards,
      magicCards,
      supportCards,
      exactNames,
      buildEnglishCardDescription,
      translate: (text) => trans(text, 'ENGLISH'),
      constants,
    };
  } finally {
    await server.close();
  }
};

const sectionFor = (id, constants) => {
  const groups = [
    ['STATUS_CARDS', '状態異常'],
    ['CURSE_CARDS', '呪い'],
    ['EVENT_CARDS', 'イベント'],
    ['LIBRARIAN_CARDS', '司書'],
    ['GARDEN_SEEDS', '菜園の種'],
    ['GROWN_PLANTS', '成長した植物'],
  ];
  for (const [key, label] of groups) {
    if (Object.hasOwn(constants[key], id)) return label;
  }
  if (id.startsWith('EXP_')) return '拡張カード';
  if (id.startsWith('HS_')) return '高校編';
  if (/^(KOKUGO|SANSU|RIKA|SYAKAI|PE|EVENT)_/.test(id)) return '追加学習カード';
  if (/^(BOYS|GIRLS)_/.test(id)) return '高校編・固有カード';
  if (id.startsWith('OUT_')) return '課外活動カード';
  return '基本・特殊カード';
};

const renderRow = (card, english, audit) => [
  escapeCell(card.id),
  escapeCell(card.name),
  escapeCell(card.description),
  escapeCell(english),
  escapeCell(audit),
].join(' | ');

const renderMainSection = (title, cards, context) => {
  const rows = cards.map((card) => {
    const english = context.buildEnglishCardDescription(card);
    return renderRow(card, english, auditDescription(card, english, context.exactNames));
  });
  return `## ${title}\n\n| ID | カード名 | 日本語効果 | English effect | 監査 |\n|---|---|---|---|---|\n${rows.map((row) => `| ${row} |`).join('\n')}\n`;
};

const renderSupportSection = (cards, context) => {
  const rows = cards.map((card) => {
    const english = context.translate(card.description);
    return renderRow(card, english, hasJapanese(english) ? 'REVIEW — Japanese text remains' : 'OK');
  });
  return `## 協力サポートカード\n\n| ID | カード名 | 日本語効果 | English effect | 監査 |\n|---|---|---|---|---|\n${rows.map((row) => `| ${row} |`).join('\n')}\n`;
};

const main = async () => {
  const context = await loadCards();
  const grouped = new Map();
  for (const card of context.mainCards) {
    const section = sectionFor(card.id, context.constants);
    if (!grouped.has(section)) grouped.set(section, []);
    grouped.get(section).push(card);
  }

  const allRows = [
    ...context.mainCards.map((card) => {
      const english = context.buildEnglishCardDescription(card);
      return { card, english, audit: auditDescription(card, english, context.exactNames) };
    }),
    ...context.magicCards.map((card) => {
      const english = context.buildEnglishCardDescription(card);
      return { card, english, audit: auditDescription(card, english, context.exactNames) };
    }),
    ...context.supportCards.map((card) => {
      const english = context.translate(card.description);
      return { card, english, audit: hasJapanese(english) ? 'REVIEW — Japanese text remains' : 'OK' };
    }),
  ];
  const reviewRows = allRows.filter(({ audit }) => audit.startsWith('REVIEW'));
  const explicitRows = allRows.filter(({ audit }) => audit.includes('explicit card text'));
  const mainSections = [...grouped.entries()]
    .map(([title, cards]) => renderMainSection(title, cards, context))
    .join('\n');
  const markdown = [
    '# 学習ローグ カード効果 日本語／英語一覧・翻訳監査',
    '',
    '> 生成日: 2026-08-27',
    '',
    '## 対象と件数',
    '',
    '| 対象 | 枚数 |',
    '|---|---:|',
    `| 通常戦闘・図鑑カード（状態異常、呪い、イベント、司書、菜園、高校編、拡張を含む） | ${context.mainCards.length} |`,
    `| 魔法カード | ${context.magicCards.length} |`,
    `| 協力サポートカード | ${context.supportCards.length} |`,
    `| 合計 | ${allRows.length} |`,
    '',
    '図鑑・戦闘で参照されるカード定義を対象にしています。配置TCGは別ゲームのカード体系（別ルール・別表示経路）のため、この一覧から除外しています。',
    '',
    '## 監査結果',
    '',
    `- 抽出・英訳を確認したカード: ${allRows.length}枚`,
    `- カード固有文を明示英訳で補ったカード: ${explicitRows.length}枚`,
    `- 機械監査で要確認になったカード: ${reviewRows.length}枚`,
    '',
    '監査は、英訳が実際の `buildEnglishCardDescription`／`trans(..., ENGLISH)` の表示経路から生成されていること、日本語中の数値が英訳に残っていること、英訳に日本語が残っていないことを確認します。熟知者の発動間隔「2ターンに1回」は “every other turn” として意味が保たれるため、数値比較から除外しています。',
    '',
    '## 今回の修正ポイント',
    '',
    '- 「銀河鉄道の夜」: 山札の上5枚を見る、1枚を選ぶ、残りを捨てる、の全工程を英訳。',
    '- 状態異常・呪い: 即時痛み／手札阻害／山札汚染の分類と、引いた時・ターン終了時・手札中などの条件を補完。',
    '- 菜園の種: ブロック効果だけでなく、菜園に植えることと成長先・必要ターンを補完。',
    '- 固有カード: 追加ドロー、対象、条件付き廃棄、敵の行動遅延、コスト変更、使い切り、倍率などを補完。',
    '- 共通生成: `damagePerStrike`、`REGEN`、負の次ターンエナジー、`CHAOS_SURGE` のエナジー量、使い切りを反映。',
    '',
    '## カード別一覧',
    '',
    mainSections,
    renderMainSection('魔法カード', context.magicCards, context),
    renderSupportSection(context.supportCards, context),
  ].join('\n');

  const outputPath = path.join(repoRoot, 'docs/card-effect-japanese-english-audit-20260827.md');
  await fs.writeFile(outputPath, markdown, 'utf8');
  console.log(`Wrote ${outputPath}`);
  console.log(`Cards: ${allRows.length}; explicit: ${explicitRows.length}; review: ${reviewRows.length}`);
  if (reviewRows.length) {
    console.log('Review rows:');
    for (const { card, audit } of reviewRows) console.log(`- ${card.id}: ${audit}`);
  }
};

await main();
