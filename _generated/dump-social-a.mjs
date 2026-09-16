import fs from 'node:fs';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
try {
  const { SUBJECT_DATA } = await server.ssrLoadModule('/src/data/subjectData.ts');
  const { getUnitBoardSummary } = await server.ssrLoadModule('/src/data/unitBoardSummaries.ts');
  const plan = JSON.parse(fs.readFileSync('_generated/dynamic-visual-unit-plan.json', 'utf8'));
  for (const row of plan.filter((entry) => entry.subject === 'SOCIAL' && entry.priority === 'A' && entry.needsNewVisual)) {
    console.log(`\n### ${row.mode} ${getUnitBoardSummary(row.mode)?.title ?? row.title}`);
    (SUBJECT_DATA[row.mode] || []).slice(0, 8).forEach((problem, index) => {
      console.log(`${index + 1}. ${problem.question} -> ${problem.answer}`);
    });
  }
} finally {
  await server.close();
}
