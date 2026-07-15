import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { createServer } from 'vite';

const EXCLUDED_PATH = /[\\/](mini-games|data)[\\/]|DebugMenuScreen|MiniGame|SchoolDungeonRPG|PokerGame|PaperPlane|MagicEventSimulation|CreditRoll/;
const UI_ATTRIBUTES = new Set(['title', 'aria-label', 'placeholder', 'alt']);
const JAPANESE = /[ぁ-んァ-ヶ一-龠々〆ヵヶ]/;
const GENERIC_FALLBACK = /^(Choose Option|Event Details|School Foe|Choose a fitting event action|You handled the (?:event|situation|moment).*)$/;

const collectSourceFiles = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const target = path.join(directory, entry.name);
  if (entry.isDirectory()) return collectSourceFiles(target);
  return /\.tsx?$/.test(entry.name) ? [target] : [];
});

const failures = [];
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });

try {
  const { trans, transEventText } = await server.ssrLoadModule('/src/utils/textUtils.ts');
  const { MINI_GAMES } = await server.ssrLoadModule('/src/miniGameConfig.ts');
  for (const game of MINI_GAMES) {
    for (const [field, value] of [['name', game.name], ['description', game.description]]) {
      const output = trans(value, 'ENGLISH');
      if (JAPANESE.test(output) || /Choose Option|You handled the moment/.test(output)) {
        failures.push(`src/miniGameConfig.ts [unlock notification ${field}] ${value} => ${output}`);
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
      if (ts.isJsxText(node) && JAPANESE.test(node.text.trim()) && !isExplicitNonEnglishBranch(node)) report(node, 'raw JSX text', node.text.trim());
      if (
        node.parent && ts.isJsxExpression(node.parent) &&
        (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
        JAPANESE.test(node.text) &&
        !isExplicitNonEnglishBranch(node)
      ) report(node, 'raw JSX expression', node.text);
      if (ts.isJsxAttribute(node) && UI_ATTRIBUTES.has(node.name.getText(sourceFile)) && node.initializer && ts.isStringLiteral(node.initializer) && JAPANESE.test(node.initializer.text)) {
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
  console.error(`English UI audit failed: ${failures.length} issue(s).`);
  process.exit(1);
}
console.log('English UI audit passed.');
