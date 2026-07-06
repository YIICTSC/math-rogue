import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

const files = {
  app: 'src/App.tsx',
  logic: 'src/services/cardEffectLogic.ts',
  utils: 'src/utils/cardUtils.ts',
};

const source = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, read(file)])
);

const getSpecialDescMapKeys = () => {
  const match = source.utils.match(/const specialDescMap: Record<string, string> = \{([\s\S]*?)\n\s*\};/);
  if (!match) return new Set();
  const keys = new Set();
  for (const keyMatch of match[1].matchAll(/'([^']+)'\s*:/g)) {
    keys.add(keyMatch[1]);
  }
  return keys;
};

const getCardEffectLogicCases = () => {
  const keys = new Set();
  for (const match of source.logic.matchAll(/case '([^']+)'/g)) {
    keys.add(match[1]);
  }
  return keys;
};

const getPotentiallyUnsafeConditions = (fileKey, filePath, text) => {
  const findings = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    const usesCardName = /\bcard\.name\s*(?:===|!==)|\bcard\.name\.includes/.test(line);
    const usesCardId = /\bcard\.id(?:\?\.)?\.includes|\bcard\.id\s*&&\s*card\.id\.includes/.test(line);
    if (!usesCardName && !usesCardId) return;

    const context = lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 6)).join('\n');
    const hasOriginalNames = /card\.originalNames\?\./.test(context);
    const isKnownNonCardLookup = fileKey === 'app' && context.includes('ADDITIONAL_CARDS');
    const isCanonicalSkipList = fileKey === 'logic' && context.includes('APP_CANONICAL_CARD_LOGIC_KEY_LIST');
    if (hasOriginalNames || isKnownNonCardLookup) return;
    if (isCanonicalSkipList) return;

    findings.push({
      file: filePath,
      line: index + 1,
      condition: line.trim(),
    });
  });
  return findings;
};

const specialDescMapKeys = getSpecialDescMapKeys();
const cardEffectLogicCases = getCardEffectLogicCases();
const missingLogicCases = [...cardEffectLogicCases]
  .filter((key) => !specialDescMapKeys.has(key))
  .sort((a, b) => a.localeCompare(b, 'ja'));

const unsafeConditions = [
  ...getPotentiallyUnsafeConditions('app', files.app, source.app),
  ...getPotentiallyUnsafeConditions('logic', files.logic, source.logic),
  ...getPotentiallyUnsafeConditions('utils', files.utils, source.utils),
];

console.log('Card synthesis effect retention audit');
console.log(`specialDescMap keys: ${specialDescMapKeys.size}`);
console.log(`cardEffectLogic cases: ${cardEffectLogicCases.size}`);
console.log(`missing cardEffectLogic cases in specialDescMap: ${missingLogicCases.length}`);
if (missingLogicCases.length > 0) {
  missingLogicCases.forEach((key) => console.log(`  - ${key}`));
}

console.log(`potential card.name/card.id conditions without originalNames: ${unsafeConditions.length}`);
if (unsafeConditions.length > 0) {
  unsafeConditions.forEach((finding) => {
    console.log(`  - ${finding.file}:${finding.line} ${finding.condition}`);
  });
}

if (missingLogicCases.length > 0 || unsafeConditions.length > 0) {
  process.exitCode = 1;
}
