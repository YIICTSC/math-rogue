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
  const { MINI_GAMES } = await server.ssrLoadModule('/src/miniGameConfig.ts');
  for (const game of MINI_GAMES) {
    for (const [field, value] of [['name', game.name], ['description', game.description]]) {
      const output = trans(value, 'HIRAGANA');
      if (KANJI.test(output)) {
        failures.push(`src/miniGameConfig.ts [unlock notification ${field}] ${value} => ${output}`);
      }
    }
  }

  for (const file of [
    'src/data/eventHiraganaExact.ts',
    'src/data/hiraganaRuntimeExact.ts',
    'src/data/hiraganaUiExact.ts',
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
