import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { SUBJECT_DATA } = await server.ssrLoadModule('/src/data/subjectData.ts');
  const units = Object.entries(SUBJECT_DATA).filter(([k]) => /^(?:MATH_G\d|KOKUGO_G\d|ENGLISH_G\d|LIFE_\d|SCIENCE_\d|SOCIAL_\d)_U\d+$/.test(k));
  const arr = [];
  for (const [mode, ps] of units) {
    const groups = new Map();
    for (const p of ps) {
      const key = JSON.stringify({ q:p.question, passage:p.passage||'', visual:p.visual||null, audio:p.audioPrompt?.text||'', speech:p.speechPrompt?.expected||'' });
      const correct = p.options?.[0] ?? p.answer;
      if (!groups.has(key)) groups.set(key, new Set());
      groups.get(key).add(correct);
    }
    for (const [key, answers] of groups) {
      if (answers.size > 1) {
        const s = JSON.parse(key);
        arr.push({ mode, q:s.q, answers:[...answers] });
      }
    }
  }
  for (const x of arr) console.log(`${x.mode}\t${x.q.replaceAll('\n',' ')}\t${x.answers.join(' / ')}`);
} finally {
  await server.close();
}
