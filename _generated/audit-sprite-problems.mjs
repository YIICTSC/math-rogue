import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { SUBJECT_DATA } = await server.ssrLoadModule('/src/data/subjectData.ts');
  const rows = [];
  for (const [mode, problems] of Object.entries(SUBJECT_DATA)) {
    for (const problem of problems) {
      if (!problem.imageUrl?.includes('/problem-illustrations/sprites/')) continue;
      rows.push({ mode, asset: problem.imageUrl.split('/problem-illustrations/')[1], q: problem.question, a: problem.answer, audio: !!problem.audioPrompt, speech: !!problem.speechPrompt, visual: !!problem.visual });
    }
  }
  const byAsset = new Map();
  for (const row of rows) byAsset.set(row.asset, (byAsset.get(row.asset) || 0) + 1);
  console.log('TOTAL', rows.length, 'ASSETS', byAsset.size);
  [...byAsset.entries()].sort((a,b)=>a[0].localeCompare(b[0])).forEach(([asset,count])=>console.log(`${count}\t${asset}`));
  console.log('BAD_VISUAL', rows.filter(r=>r.visual).length, 'BAD_AUDIO', rows.filter(r=>r.audio||r.speech).length);
  console.log('KAIKO'); rows.filter(r=>/カイコ|蚕/.test(r.q)).slice(0,20).forEach(r=>console.log(JSON.stringify(r)));
  await import('node:fs').then(fs=>fs.writeFileSync('_generated/sprite-problem-report.json', JSON.stringify(rows, null, 2)));
} finally { await server.close(); }
