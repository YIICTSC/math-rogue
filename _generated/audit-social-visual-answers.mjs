import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });

const collect = (value, out = []) => {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collect(item, out));
  else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, child]) => {
      if (!['kind', 'mode', 'tone'].includes(key)) collect(child, out);
    });
  }
  return out;
};

try {
  const { SUBJECT_DATA } = await server.ssrLoadModule('/src/data/subjectData.ts');
  let units = 0;
  let hits = 0;
  for (const [mode, problems] of Object.entries(SUBJECT_DATA).filter(([mode]) => mode.startsWith('SOCIAL_'))) {
    const visuals = problems.filter((problem) => problem.visual);
    if (visuals.length) units += 1;
    for (const problem of visuals) {
      const answer = String(problem.answer).replace(/\s+/g, '').toLowerCase();
      const direct = collect(problem.visual)
        .map((value) => String(value).replace(/\s+/g, '').toLowerCase())
        .filter((value) => answer.length >= 2 && (value.includes(answer) || answer.includes(value)));
      if (direct.length) {
        hits += 1;
        console.log(`${mode}\t${problem.question}\tANSWER=${problem.answer}\tVISUAL=${[...new Set(direct)].join('|')}`);
      }
    }
  }
  console.log(`SOCIAL_VISUAL_UNITS ${units}`);
  console.log(`SOCIAL_DIRECT_ANSWER_HITS ${hits}`);
} finally {
  await server.close();
}
