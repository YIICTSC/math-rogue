import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sources = [
  ['src/App.tsx', path.join(root, 'src/App.tsx')],
  ['src/components/MapScreen.tsx', path.join(root, 'src/components/MapScreen.tsx')],
  ['src/components/BattleScene.tsx', path.join(root, 'src/components/BattleScene.tsx')],
];
const failures = [];

for (const [label, file] of sources) {
  const source = fs.readFileSync(file, 'utf8');
  if (/EndlessGimmickGlossary|updateActiveEndlessGimmick|applyEndlessLearningAnswer|endlessGimmickProgress/.test(source)) {
    failures.push(`${label}: endless gimmick UI or runtime hook is still active`);
  }
}

const data = fs.readFileSync(path.join(root, 'src/data/endlessMode.ts'), 'utf8');
if (!/const rewardRows\s*:/.test(data)) failures.push('src/data/endlessMode.ts: rewardRows is missing');
if (!/createEndlessRewardItems/.test(data)) failures.push('src/data/endlessMode.ts: reward factory is missing');

if (failures.length > 0) {
  console.error(`Endless reward-only terminology audit failed (${failures.length})`);
  console.error(failures.map(failure => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Endless reward-only terminology audit passed: no endless gimmick UI or runtime hook is active.');
