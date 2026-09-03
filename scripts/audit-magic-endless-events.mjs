import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const femaleDoc = fs.readFileSync(path.join(root, 'docs/magic-endless-generic-events-90-plan.md'), 'utf8');
const maleDoc = fs.readFileSync(path.join(root, 'docs/magic-endless-generic-male-events-90-plan.md'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'src/data/magicEndlessEvents.ts'), 'utf8');
const service = fs.readFileSync(path.join(root, 'src/services/eventService.ts'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
const failures = [];

const countRows = (source, prefix) => [...source.matchAll(new RegExp(`^\\|\\s*${prefix}-\\d+`, 'gm'))].length;
if (countRows(femaleDoc, 'MGE') !== 90) failures.push('female design document must contain 90 MGE rows');
if (countRows(maleDoc, 'MGEM') !== 90) failures.push('male design document must contain 90 MGEM rows');

for (const [prefix, expected] of [['MGE', 90], ['MGEM', 90]]) {
  const ids = runtime.match(new RegExp(`\\b${prefix}-\\d{3}\\b`, 'g')) || [];
  if (ids.length !== expected) failures.push(`${prefix} runtime data must contain ${expected} IDs, found ${ids.length}`);
  if (new Set(ids).size !== expected) failures.push(`${prefix} runtime IDs must be unique`);
  for (let index = 1; index <= expected; index++) {
    const id = `${prefix}-${String(index).padStart(3, '0')}`;
    if (!ids.includes(id)) failures.push(`${prefix} is missing ${id}`);
  }
}

for (const prefix of ['MGE', 'MGEM']) {
  const sheetRoot = path.join(root, 'public/sprites/magic/events/endless/character-sheets');
  for (let start = 1; start <= 90; start += 9) {
    const end = start + 8;
    const file = path.join(sheetRoot, `${prefix}-${String(start).padStart(3, '0')}-${String(end).padStart(3, '0')}.png`);
    if (!fs.existsSync(file)) {
      failures.push(`missing ${prefix} image sheet: ${path.relative(root, file)}`);
      continue;
    }
    const png = fs.readFileSync(file);
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    if (width !== height || width < 900) failures.push(`${prefix} sheet is not a square high-resolution PNG: ${path.relative(root, file)}`);
  }
}

for (const [label, source, patterns] of [
  ['event generator', service, [/MAGIC_ENDLESS_EVENTS/, /MAGIC_ENDLESS_MALE_EVENTS/, /eventLearningPending/, /GENERAL_CHALLENGE/]],
  ['event challenge return', app, [/eventLearningPending/, /applyMagicEndlessEventEffects/, /isChallenge=\{Boolean\(gameState\.eventLearningPending\)\}/]],
]) {
  for (const pattern of patterns) if (!pattern.test(source)) failures.push(`${label} is missing ${pattern}`);
}

if (failures.length) {
  console.error(`Magic endless event audit failed (${failures.length})`);
  console.error(failures.map(failure => `- ${failure}`).join('\n'));
  process.exit(1);
}
console.log('Magic endless event audit passed: 90 female events, 90 male events, 20 square sprite sheets, and learning-return routing verified.');
