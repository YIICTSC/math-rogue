import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });

try {
  const hard = await server.ssrLoadModule('/src/data/subjects/hard_kanji.ts');
  const master = await server.ssrLoadModule('/src/data/kankenLevelKanji.ts');
  const learned = new Set();
  for (const level of master.KANKEN_OFFICIAL_LEVEL_ORDER) {
    for (const char of master.KANKEN_OFFICIAL_LEVEL_KANJI[level]) learned.add(char);
  }
  const target = master.KANKEN_OFFICIAL_LEVEL_KANJI_SETS.KANKEN_2;
  const kanjiOf = (text) => [...new Set(text.match(/[\u3400-\u4DBF\u4E00-\u9FFF]/g) ?? [])];

  for (const [group, problems] of Object.entries(hard.HARD_KANJI_DATA)) {
    if (group === 'HARD_KANJI_MIXED') continue;
    const matches = problems.filter((problem) => {
      const chars = kanjiOf(problem.question);
      return chars.length > 0
        && chars.every((char) => learned.has(char))
        && chars.some((char) => target.has(char));
    });
    console.log(`\n${group} ${matches.length}`);
    for (const problem of matches) {
      const targetKanji = kanjiOf(problem.question).filter((char) => target.has(char)).join('');
      console.log(`${targetKanji}\t${problem.question}\t${problem.answer}`);
    }
  }
} finally {
  await server.close();
}
