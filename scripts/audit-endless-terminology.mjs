import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataPath = path.join(root, 'src/data/endlessMode.ts');
const docPath = path.join(root, 'docs/endless-mode-boss-lineup-50f.md');
const data = fs.readFileSync(dataPath, 'utf8');
const doc = fs.readFileSync(docPath, 'utf8');

const failures = [];
const checkLines = (source, file, predicate, message) => {
  source.split('\n').forEach((line, index) => {
    if (predicate(line)) failures.push(`${file}:${index + 1}: ${message}\n  ${line.trim()}`);
  });
};

// These words are intentionally used in the glossary and story text, but must
// not leak into reward or mechanic conditions where they can be interpreted in
// multiple ways.
const isRewardOrMechanicLine = (line) =>
  !/^\s*\|\s*(正解|連続正解)/.test(line) &&
  (line.includes('rewardRows') || line.includes("['") || line.includes('役割／ギミック') || line.includes('報酬例') || line.includes('`EL-') || line.includes('`HS-') || line.includes('`MG-'));

const ambiguousSuccess = (line) => {
  if (!isRewardOrMechanicLine(line)) return false;
  if (/初回正解|正解したら|正解すると|正解で|正解時|成功を重ねる/.test(line)) return true;
  if (/連続正解/.test(line)) return true;
  // Every “連続成功” condition must state a count or explicitly refer to a
  // counter. “学習判定の連続成功数” is the counter form.
  if (/連続成功/.test(line) && !/(?:[0-9０-９]+回|指定回数|成功数)/.test(line)) return true;
  return false;
};

checkLines(data, 'src/data/endlessMode.ts', ambiguousSuccess, '曖昧な成功条件');
checkLines(doc, 'docs/endless-mode-boss-lineup-50f.md', ambiguousSuccess, '曖昧な成功条件');

if (failures.length > 0) {
  console.error(`Endless terminology audit failed (${failures.length})`);
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Endless terminology audit passed: reward and mechanic conditions use explicit learning-judgment scope and counts.');
