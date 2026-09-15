import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const hard = await server.ssrLoadModule('/src/data/subjects/hard_kanji.ts');
  const master = await server.ssrLoadModule('/src/data/kankenLevelKanji.ts');
  const learned = new Set(master.KANKEN_OFFICIAL_LEVEL_ORDER.flatMap((level) => [...master.KANKEN_OFFICIAL_LEVEL_KANJI[level]]));
  const target = master.KANKEN_OFFICIAL_LEVEL_KANJI_SETS.KANKEN_2;
  const chars = (text) => [...new Set(text.match(/[\u3400-\u4DBF\u4E00-\u9FFF]/g) ?? [])];
  for (const [group, problems] of Object.entries(hard.HARD_KANJI_DATA)) {
    if (group === 'HARD_KANJI_MIXED') continue;
    const matches = problems.filter((problem) => {
      const found = chars(problem.question);
      return found.length && found.every((c) => learned.has(c)) && found.some((c) => target.has(c));
    });
    console.log(`\n${group} ${matches.length}`);
    for (const problem of matches) {
      console.log(`${chars(problem.question).filter((c) => target.has(c)).join('')}\t${problem.question}\t${problem.answer}`);
    }
  }
} finally {
  await server.close();
}
