import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { createServer } from 'vite';

const EXCLUDED_PATH = /[\\/](mini-games|data)[\\/]|DebugMenuScreen|MiniGame|SchoolDungeonRPG|PokerGame|PaperPlane|MagicEventSimulation/;
const UI_ATTRIBUTES = new Set(['title', 'aria-label', 'placeholder', 'alt']);
const KANJI = /[一-龠]/;
const CONTEXTUAL_MISTRANSLATIONS = [
  'そらにもどる',
  'おはら',
  'たいしゅつかーど',
  'たいしゅつカード',
  'いんくかめ',
  'こものいれれ',
  'まじわす',
  'うけやめ',
  'しゅんいた',
  'しずくれんぐ',
  'あとかたづけけ',
  'いっって',
  'おきんがたりない',
  'じゅほのお',
  'じターン',
  'こんターン',
  'すてさつ',
  'こうきゅうてき',
  'しようか。',
  'ひ0コス',
  'ぜんダメージぶん',
  'いちばんじょう',
  'あぶねえじ',
  'ほうもつ',
];

const collectSourceFiles = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const target = path.join(directory, entry.name);
  if (entry.isDirectory()) return collectSourceFiles(target);
  return /\.tsx?$/.test(entry.name) ? [target] : [];
});

const failures = [];
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });

try {
  const { trans } = await server.ssrLoadModule('/src/utils/textUtils.ts');
  const { CARDS_LIBRARY, RELIC_LIBRARY, POTION_LIBRARY } = await server.ssrLoadModule('/src/constants.ts');
  const { MAGIC_CARDS } = await server.ssrLoadModule('/src/data/magicCards.ts');
  const { getEnemyLibraryByTheme } = await server.ssrLoadModule('/src/data/enemyCatalogs.ts');
  const { MINI_GAMES } = await server.ssrLoadModule('/src/miniGameConfig.ts');
  const { TYPING_LESSON_DEFINITIONS } = await server.ssrLoadModule('/src/data/typingLessonConfig.ts');
  const { ONLINE_RANKING_FALLBACKS, ONLINE_RANKING_CATEGORIES } = await server.ssrLoadModule('/src/data/onlineRankingDefinitions.ts');
  const { getDebugMagicEndingGalleryEntries } = await server.ssrLoadModule('/src/services/magicEndingService.ts');
  const REQUIRED_EXACT_TRANSLATIONS = {
    '課題連携': 'かだいれんけい',
    'ボスとの決戦開始！': 'ボスとの けっせん かいし！',
    '> ボスとの決戦開始！': '> ボスとの けっせん かいし！',
  };
  for (const [source, expected] of Object.entries(REQUIRED_EXACT_TRANSLATIONS)) {
    const output = trans(source, 'HIRAGANA');
    if (output !== expected) failures.push(`required exact translation ${source} => ${output} (expected ${expected})`);
  }
  const compendiumEntries = [
    ...Object.values(CARDS_LIBRARY).flatMap((card) => [['card name', card.name], ['card description', card.description]]),
    ...MAGIC_CARDS.flatMap((card) => [['magic card name', card.name], ['magic card description', card.description]]),
    ...Object.values(RELIC_LIBRARY).flatMap((relic) => [['relic name', relic.name], ['relic description', relic.description]]),
    ...Object.values(POTION_LIBRARY).flatMap((potion) => [['potion name', potion.name], ['potion description', potion.description]]),
    ...['elementary', 'high-school', 'magic'].flatMap((theme) =>
      Object.values(getEnemyLibraryByTheme(theme)).flatMap((enemy) => [
        [`${theme} enemy name`, enemy.name],
        [`${theme} enemy description`, enemy.description],
      ])
    ),
  ];
  for (const [category, value] of compendiumEntries) {
    const output = trans(value, 'HIRAGANA');
    if (KANJI.test(output)) failures.push(`compendium ${category} ${value} => ${output}`);
    for (const mistranslation of CONTEXTUAL_MISTRANSLATIONS) {
      if (output.includes(mistranslation)) failures.push(`compendium ${category} [contextual mistranslation] ${value} => ${output}`);
    }
  }
  for (const value of ['セーブデータを削除しますか？', '※ボタン長押しでセーブデータを削除できます']) {
    const output = trans(value, 'HIRAGANA');
    if (KANJI.test(output)) failures.push(`minigame delete modal ${value} => ${output}`);
  }
  for (const game of MINI_GAMES) {
    for (const [field, value] of [['name', game.name], ['description', game.description]]) {
      const output = trans(value, 'HIRAGANA');
      if (KANJI.test(output)) {
        failures.push(`src/miniGameConfig.ts [unlock notification ${field}] ${value} => ${output}`);
      }
    }
    const deleteConfirmation = `「${trans(game.name, 'HIRAGANA')}」${trans('の中断データを削除して最初からやり直します。', 'HIRAGANA')}`;
    if (KANJI.test(deleteConfirmation)) failures.push(`minigame delete confirmation [${game.id}] ${deleteConfirmation}`);
  }
  for (const ending of getDebugMagicEndingGalleryEntries()) {
    for (const [field, value] of [
      ['hero name', ending.heroName],
      ['title', ending.title],
      ['description', ending.description],
      ['rank label', ending.rankLabel],
      ['metric label', ending.metricLabel],
      ...ending.lines.map((line, index) => [`line ${index + 1}`, line]),
    ]) {
      const output = trans(value, 'HIRAGANA');
      if (KANJI.test(output)) failures.push(`compendium ending ${ending.id} ${field} ${value} => ${output}`);
      for (const mistranslation of CONTEXTUAL_MISTRANSLATIONS) {
        if (output.includes(mistranslation)) failures.push(`compendium ending ${ending.id} ${field} [contextual mistranslation] ${value} => ${output}`);
      }
    }
  }
  for (const value of ['通常・高校・魔法男女', '通常編', '高校編', 'マジック編 女子', 'マジック編 男子', 'ミニゲーム']) {
    const output = trans(value, 'HIRAGANA');
    if (KANJI.test(output)) failures.push(`compendium BGM label ${value} => ${output}`);
  }
  for (const lesson of TYPING_LESSON_DEFINITIONS) {
    for (const value of [lesson.title, lesson.shortTitle, lesson.description, ...lesson.stages]) {
      const output = trans(value, 'HIRAGANA');
      if (KANJI.test(output)) failures.push(`typing lesson ${value} => ${output}`);
    }
  }
  for (const ranking of ONLINE_RANKING_FALLBACKS) {
    for (const value of [ranking.label, ranking.unit, ranking.description]) {
      const output = trans(value, 'HIRAGANA');
      if (KANJI.test(output)) failures.push(`online ranking ${value} => ${output}`);
    }
  }
  for (const category of ONLINE_RANKING_CATEGORIES) {
    const output = trans(category.label, 'HIRAGANA');
    if (KANJI.test(output)) failures.push(`online ranking category ${category.label} => ${output}`);
  }

  for (const file of [
    'src/data/eventHiraganaExact.ts',
    'src/data/hiraganaRuntimeExact.ts',
    'src/data/hiraganaUiExact.ts',
    'src/data/hiraganaCompendiumExact.ts',
    'src/utils/textUtils.ts',
  ]) {
    const source = fs.readFileSync(file, 'utf8');
    for (const mistranslation of CONTEXTUAL_MISTRANSLATIONS) {
      if (source.includes(mistranslation)) {
        failures.push(`${file} [contextual mistranslation] ${mistranslation}`);
      }
    }
  }

  for (const file of collectSourceFiles('src')) {
    if (EXCLUDED_PATH.test(file)) continue;
    const source = fs.readFileSync(file, 'utf8');
    const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const report = (node, category, sourceText, output = '') => {
      const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
      failures.push(`${file}:${line} [${category}] ${sourceText}${output ? ` => ${output}` : ''}`);
    };

    const visit = (node) => {
      if (ts.isCallExpression(node) && node.expression.getText(sourceFile) === 'trans' && node.arguments[0]) {
        const argument = node.arguments[0];
        if (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument)) {
          const output = trans(argument.text, 'HIRAGANA');
          if (KANJI.test(output)) report(node, 'kanji remains', argument.text, output);
        } else if (ts.isTemplateExpression(argument)) {
          let sample = argument.head.text;
          for (const span of argument.templateSpans) sample += `1${span.literal.text}`;
          const output = trans(sample, 'HIRAGANA');
          if (KANJI.test(output)) report(node, 'dynamic kanji remains', sample, output);
        }
      }

      if (ts.isJsxText(node) && KANJI.test(node.text.trim())) {
        report(node, 'raw JSX text', node.text.trim());
      }

      if (ts.isJsxAttribute(node) && UI_ATTRIBUTES.has(node.name.getText(sourceFile)) && node.initializer && ts.isStringLiteral(node.initializer) && KANJI.test(node.initializer.text)) {
        report(node, 'raw JSX attribute', `${node.name.getText(sourceFile)}=${node.initializer.text}`);
      }

      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
} finally {
  await server.close();
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  console.error(`Hiragana UI audit failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log('Hiragana UI audit passed.');
