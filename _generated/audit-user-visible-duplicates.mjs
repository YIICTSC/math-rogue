import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });

try {
  const { SUBJECT_DATA } = await server.ssrLoadModule('/src/data/subjectData.ts');
  const units = Object.entries(SUBJECT_DATA).filter(([key]) => /^(?:MATH_G\d|KOKUGO_G\d|ENGLISH_G\d|LIFE_\d|SCIENCE_\d|SOCIAL_\d)_U\d+$/.test(key));
  const duplicates = [];
  const fallbackProblems = [];
  const fallbackSet = new Set(['どれでもない', '別の答え', 'わからない', 'どちらでもない', 'あてはまらない', 'none of these', 'another answer', 'not applicable']);
  const signature = (problem) => JSON.stringify({
    question: problem.question,
    answer: problem.answer,
    options: problem.options,
    passage: problem.passage || '',
    passageTitle: problem.passageTitle || '',
    visual: problem.visual || null,
    audioPrompt: problem.audioPrompt || null,
    speechPrompt: problem.speechPrompt || null,
  });

  for (const [mode, problems] of units) {
    const seen = new Map();
    problems.forEach((problem, index) => {
      const sig = signature(problem);
      if (seen.has(sig)) {
        duplicates.push({ mode, first: seen.get(sig), index, question: problem.question, answer: problem.answer, options: problem.options, visual: problem.visual || null, passage: problem.passage || '', passageTitle: problem.passageTitle || '', audioPrompt: problem.audioPrompt || null, speechPrompt: problem.speechPrompt || null });
      } else {
        seen.set(sig, index);
      }

      const fallbackHits = (problem.options || []).filter((option) => fallbackSet.has(option));
      if (fallbackHits.length) fallbackProblems.push({ mode, index, question: problem.question, answer: problem.answer, fallbackHits, options: problem.options });
    });
  }

  console.log('TRUE_USER_VISIBLE_DUPLICATES', duplicates.length);
  console.log(JSON.stringify(duplicates.slice(0, 200), null, 2));

  const byMode = new Map();
  for (const item of fallbackProblems) byMode.set(item.mode, (byMode.get(item.mode) || 0) + 1);
  console.log('\nFALLBACK_OPTION_PROBLEMS', fallbackProblems.length, 'UNITS', byMode.size);
  console.log([...byMode.entries()].sort((a, b) => b[1] - a[1]).slice(0, 80).map(([mode, count]) => `${mode}\t${count}`).join('\n'));
  console.log('\nFALLBACK_SAMPLES');
  console.log(JSON.stringify(fallbackProblems.slice(0, 120), null, 2));
} finally {
  await server.close();
}
