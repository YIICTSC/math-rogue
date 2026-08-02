import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const ROOT = process.cwd();
const SOURCE_ROOT = path.join(ROOT, 'src');
const OUTPUT = path.join(SOURCE_ROOT, 'data/englishIdentifierExact.ts');
const JAPANESE = /[ぁ-ヺ㐀-鿿々〆]/;
const GAMEPLAY_CATALOG = /(?:components\/(?:PaperPlaneBattle|PokerGameScreen|SchoolDungeonRPG2?)\.tsx|data\/(?:schoolDungeonExtraItems|magicLoadouts|attackEffects|visualThemes|magicDungeons)\.ts)$/;

const collectFiles = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const target = path.join(directory, entry.name);
  return entry.isDirectory() ? collectFiles(target) : /\.tsx?$/.test(entry.name) ? [target] : [];
});

const propertyText = (object, key) => {
  const property = object.properties.find((candidate) => (
    ts.isPropertyAssignment(candidate) && candidate.name.getText().replace(/^['"]|['"]$/g, '') === key
  ));
  return property && (ts.isStringLiteral(property.initializer) || ts.isNoSubstitutionTemplateLiteral(property.initializer))
    ? property.initializer.text
    : '';
};

const enclosingRecordKey = (object) => {
  const parent = object.parent;
  if (!ts.isPropertyAssignment(parent)) return '';
  return parent.name.getText().replace(/^['"]|['"]$/g, '');
};

const ACRONYMS = new Map([
  ['hp', 'HP'], ['cd', 'CD'], ['aoe', 'AoE'], ['pta', 'PTA'], ['ict', 'ICT'], ['it', 'IT'],
]);
const SOURCE_OVERRIDES = new Map([
  ['勝利の余韻', 'Victory Afterglow'],
  ['おこづかい', 'Victory Allowance'],
  ['先制花火', 'Opening Firework'],
  ['白紙の束', 'Blank Paper Bundle'],
  ['青インクの瓶', 'Blue Ink Bottle'],
  ['夕焼けスケッチ', 'Sunset Sketch'],
  ['情報網', 'Information Network'],
  ['初動重視', 'Quick Start'],
  ['二重装填(初手)', 'Opening Double Load'],
  ['優待券', 'Complimentary Pass'],
  ['火事場の馬鹿力', 'Last-Ditch Strength'],
]);
const identifierLabel = (raw) => {
  const normalized = raw
    .replace(/^(?:endless_rival_|rival_)/i, '')
    .replace(/^(?:t|r|k)_/i, '')
    .replace(/_bonus(?=_|$)/ig, '')
    .replace(/_+/g, ' ')
    .trim();
  if (!normalized || !/[a-z]/i.test(normalized) || /^(?:none|unknown|normal|item)$/i.test(normalized)) return '';
  return normalized.split(/\s+/).map((token) => (
    ACRONYMS.get(token.toLowerCase()) || token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()
  )).join(' ');
};

const entries = new Map();
for (const absoluteFile of collectFiles(SOURCE_ROOT)) {
  const relativeFile = path.relative(SOURCE_ROOT, absoluteFile).replaceAll('\\', '/');
  if (!GAMEPLAY_CATALOG.test(relativeFile)) continue;
  if (/english|translation/i.test(path.basename(absoluteFile))) continue;
  const source = fs.readFileSync(absoluteFile, 'utf8');
  const sourceFile = ts.createSourceFile(absoluteFile, source, ts.ScriptTarget.Latest, true, absoluteFile.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = (node) => {
    if (ts.isObjectLiteralExpression(node)) {
      const name = propertyText(node, 'name');
      if (name && JAPANESE.test(name)) {
        const specialEffect = propertyText(node, 'specialEffect');
        const identifier = propertyText(node, 'id') || enclosingRecordKey(node) || (
          relativeFile === 'components/PaperPlaneBattle.tsx' && specialEffect
            ? `${specialEffect}_${propertyText(node, 'type')}`
            : ''
        );
        const label = SOURCE_OVERRIDES.get(name) || identifierLabel(identifier);
        if (label && !entries.has(name)) entries.set(name, label);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

const body = [...entries.entries()]
  .sort(([a], [b]) => a.localeCompare(b, 'ja'))
  .map(([source, english]) => `  ${JSON.stringify(source)}: ${JSON.stringify(english)},`)
  .join('\n');
fs.writeFileSync(OUTPUT, `// Generated from stable data identifiers by scripts/generate-english-identifier-map.mjs.\n`
  + `// Curated English dictionaries take precedence over this cross-platform fallback.\n`
  + `export const ENGLISH_IDENTIFIER_EXACT: Readonly<Record<string, string>> = Object.freeze({\n${body}\n});\n`);
console.log(`Generated ${entries.size} identifier-backed English labels.`);
