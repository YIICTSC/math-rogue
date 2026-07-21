import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { createServer } from 'vite';

// Only game-specific mini-game internals and question banks are outside the
// shared translation contract. Selection, unlock, result, and confirmation UI
// remain in scope even when their file name contains "MiniGame".
const EXCLUDED_PATH = /[\\/]mini-games[\\/]|[\\/]data[\\/]subjects[\\/]|[\\/]components[\\/](?:SchoolDungeonRPG2?|PokerGameScreen|PaperPlaneBattle)\.tsx$/;
const UI_ATTRIBUTES = new Set(['title', 'aria-label', 'placeholder', 'alt']);
const JAPANESE = /[ぁ-んァ-ヶ一-龠々〆ヵヶ]/;
const GENERIC_FALLBACK = /^(Choose Option|Event Details|School Foe|Choose a fitting event action|You handled the (?:event|situation|moment).*|You turned the event into a useful tool for the road ahead\.|You handled the situation carefully and turned the experience into progress\.)$/;

const collectSourceFiles = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const target = path.join(directory, entry.name);
  if (entry.isDirectory()) return collectSourceFiles(target);
  return /\.tsx?$/.test(entry.name) ? [target] : [];
});

const failures = [];
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });

try {
  const { buildEnglishCardDescription, trans, transEventText } = await server.ssrLoadModule('/src/utils/textUtils.ts');
  const { CARDS_LIBRARY, RELIC_LIBRARY, POTION_LIBRARY } = await server.ssrLoadModule('/src/constants.ts');
  const { MAGIC_CARDS } = await server.ssrLoadModule('/src/data/magicCards.ts');
  const { getEnemyLibraryByTheme } = await server.ssrLoadModule('/src/data/enemyCatalogs.ts');
  const { MINI_GAMES } = await server.ssrLoadModule('/src/miniGameConfig.ts');
  const { TYPING_LESSON_DEFINITIONS } = await server.ssrLoadModule('/src/data/typingLessonConfig.ts');
  const { ONLINE_RANKING_FALLBACKS, ONLINE_RANKING_CATEGORIES } = await server.ssrLoadModule('/src/data/onlineRankingDefinitions.ts');
  const { getDebugMagicEndingGalleryEntries } = await server.ssrLoadModule('/src/services/magicEndingService.ts');
  const REQUIRED_EXACT_TRANSLATIONS = {
    '課題連携': 'Assignment Link',
    '空き': 'Empty Slot',
    'チラシ号': 'Flyer Glider',
    'テスト用紙号': 'Test-Paper Glider',
    '画用紙号': 'Drawing-Paper Glider',
    '通常授業': 'Regular Class',
    '抜き打ちテスト': 'Surprise Test',
    '校長最終通告': "Principal's Final Warning",
    '校長先生': 'Principal',
    '校長': 'Principal',
  };
  for (const [source, expected] of Object.entries(REQUIRED_EXACT_TRANSLATIONS)) {
    const output = trans(source, 'ENGLISH');
    if (output !== expected) failures.push(`required exact translation ${source} => ${output} (expected ${expected})`);
  }
  const compendiumEntries = [
    ...Object.values(CARDS_LIBRARY).flatMap((card) => [['card name', card.name], [`rendered card description [${card.name}]`, buildEnglishCardDescription(card)]]),
    ...MAGIC_CARDS.flatMap((card) => [['magic card name', card.name], [`rendered magic card description [${card.name}]`, buildEnglishCardDescription(card)]]),
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
    const output = category.startsWith('rendered ') ? value : trans(value, 'ENGLISH');
    if (JAPANESE.test(output) || GENERIC_FALLBACK.test(output.trim())) {
      failures.push(`compendium ${category} ${value} => ${output}`);
    }
  }
  for (const value of ['セーブデータを削除しますか？', '※ボタン長押しでセーブデータを削除できます']) {
    const output = trans(value, 'ENGLISH');
    if (JAPANESE.test(output) || GENERIC_FALLBACK.test(output.trim())) failures.push(`minigame delete modal ${value} => ${output}`);
  }
  for (const game of MINI_GAMES) {
    for (const [field, value] of [['name', game.name], ['description', game.description]]) {
      const output = trans(value, 'ENGLISH');
      if (JAPANESE.test(output) || /Choose Option|You handled the moment/.test(output)) {
        failures.push(`src/miniGameConfig.ts [unlock notification ${field}] ${value} => ${output}`);
      }
    }
    const deleteConfirmation = `"${trans(game.name, 'ENGLISH')}" save data will be deleted and restarted from the beginning.`;
    if (JAPANESE.test(deleteConfirmation) || GENERIC_FALLBACK.test(deleteConfirmation.trim())) {
      failures.push(`minigame delete confirmation [${game.id}] ${deleteConfirmation}`);
    }
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
      const output = trans(value, 'ENGLISH');
      if (JAPANESE.test(output) || GENERIC_FALLBACK.test(output.trim())) {
        failures.push(`compendium ending ${ending.id} ${field} ${value} => ${output}`);
      }
    }
  }
  for (const value of ['通常・高校・魔法男女', '通常編', '高校編', 'マジック編 女子', 'マジック編 男子', 'ミニゲーム']) {
    const output = trans(value, 'ENGLISH');
    if (JAPANESE.test(output) || GENERIC_FALLBACK.test(output.trim())) failures.push(`compendium BGM label ${value} => ${output}`);
  }
  for (const lesson of TYPING_LESSON_DEFINITIONS) {
    for (const value of [lesson.title, lesson.shortTitle, lesson.description, ...lesson.stages]) {
      const output = trans(value, 'ENGLISH');
      if (JAPANESE.test(output) || GENERIC_FALLBACK.test(output.trim())) failures.push(`typing lesson ${value} => ${output}`);
    }
  }
  for (const ranking of ONLINE_RANKING_FALLBACKS) {
    for (const value of [ranking.label, ranking.unit, ranking.description]) {
      const output = trans(value, 'ENGLISH');
      if (JAPANESE.test(output) || GENERIC_FALLBACK.test(output.trim())) failures.push(`online ranking ${value} => ${output}`);
    }
  }
  for (const category of ONLINE_RANKING_CATEGORIES) {
    const output = trans(category.label, 'ENGLISH');
    if (JAPANESE.test(output) || GENERIC_FALLBACK.test(output.trim())) failures.push(`online ranking category ${category.label} => ${output}`);
  }
  for (const file of collectSourceFiles('src')) {
    if (EXCLUDED_PATH.test(file)) continue;
    const source = fs.readFileSync(file, 'utf8');
    const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const report = (node, category, sourceText, output = '') => {
      const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
      failures.push(`${file}:${line} [${category}] ${sourceText}${output ? ` => ${output}` : ''}`);
    };
    const isExplicitNonEnglishBranch = (node) => {
      let child = node;
      let parent = node.parent;
      while (parent) {
        if (ts.isConditionalExpression(parent)) {
          const condition = parent.condition.getText(sourceFile);
          if (/languageMode\s*===\s*['\"]ENGLISH['\"]/.test(condition) && child.pos >= parent.whenFalse.pos && child.end <= parent.whenFalse.end) return true;
          if (/languageMode\s*!==\s*['\"]ENGLISH['\"]/.test(condition) && child.pos >= parent.whenTrue.pos && child.end <= parent.whenTrue.end) return true;
        }
        child = parent;
        parent = parent.parent;
      }
      return false;
    };
    const isWithinTranslatedUiTree = (node) => {
      let parent = node.parent;
      while (parent) {
        if (ts.isJsxElement(parent) && parent.openingElement.tagName.getText(sourceFile) === 'TranslatedUiTree') return true;
        parent = parent.parent;
      }
      return false;
    };
    const auditTranslatedLiteral = (node, category, value) => {
      const output = trans(value, 'ENGLISH');
      if (JAPANESE.test(output)) report(node, `${category} Japanese remains`, value, output);
      if (GENERIC_FALLBACK.test(output.trim())) report(node, `${category} generic fallback`, value, output);
    };
    const visit = (node) => {
      if (ts.isCallExpression(node) && ['trans', 'transEventText'].includes(node.expression.getText(sourceFile)) && node.arguments[0]) {
        const argument = node.arguments[0];
        const translator = node.expression.getText(sourceFile) === 'transEventText' ? transEventText : trans;
        if (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument)) {
          const output = translator(argument.text, 'ENGLISH');
          if (JAPANESE.test(output)) report(node, 'Japanese remains', argument.text, output);
          if (GENERIC_FALLBACK.test(output.trim())) report(node, 'generic fallback translation', argument.text, output);
        } else if (ts.isTemplateExpression(argument)) {
          let sample = argument.head.text;
          for (const span of argument.templateSpans) sample += `1${span.literal.text}`;
          const output = translator(sample, 'ENGLISH');
          if (JAPANESE.test(output)) report(node, 'dynamic Japanese remains', sample, output);
          if (GENERIC_FALLBACK.test(output.trim())) report(node, 'dynamic generic fallback translation', sample, output);
        }
      }
      if (ts.isJsxText(node) && JAPANESE.test(node.text.trim()) && !isExplicitNonEnglishBranch(node)) {
        if (isWithinTranslatedUiTree(node)) auditTranslatedLiteral(node, 'translated JSX text', node.text.trim());
        else report(node, 'raw JSX text', node.text.trim());
      }
      if (
        node.parent && ts.isJsxExpression(node.parent) &&
        (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
        JAPANESE.test(node.text) &&
        !isExplicitNonEnglishBranch(node)
      ) {
        if (isWithinTranslatedUiTree(node)) auditTranslatedLiteral(node, 'translated JSX expression', node.text);
        else report(node, 'raw JSX expression', node.text);
      }
      if (ts.isJsxAttribute(node) && UI_ATTRIBUTES.has(node.name.getText(sourceFile)) && node.initializer && ts.isStringLiteral(node.initializer) && JAPANESE.test(node.initializer.text)) {
        if (isWithinTranslatedUiTree(node)) auditTranslatedLiteral(node, `translated JSX attribute ${node.name.getText(sourceFile)}`, node.initializer.text);
        else report(node, 'raw JSX attribute', `${node.name.getText(sourceFile)}=${node.initializer.text}`);
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
  console.error(`English UI audit failed: ${failures.length} issue(s).`);
  process.exit(1);
}
console.log('English UI audit passed.');
