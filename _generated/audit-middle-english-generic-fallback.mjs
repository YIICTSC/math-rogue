import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { SUBJECT_DATA } = await server.ssrLoadModule('/src/data/subjectData.ts');
  const generic = new Set(['none of these', 'another answer', 'not applicable', 'どれでもない', '別の答え', 'あてはまらない']);
  const hits = [];
  for (const [mode, problems] of Object.entries(SUBJECT_DATA)) {
    if (!/^ENGLISH_G[789]_U\d+$/.test(mode)) continue;
    for (const [index, problem] of problems.entries()) {
      const found = (problem.options || []).filter(option => generic.has(option));
      if (found.length) hits.push({ mode, index, question: problem.question, answer: problem.answer, options: problem.options, found });
    }
  }
  console.log('MIDDLE_ENGLISH_GENERIC_FALLBACK', hits.length);
  console.log(JSON.stringify(hits, null, 2));
} finally {
  await server.close();
}
