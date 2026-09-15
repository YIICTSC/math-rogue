import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { KANKEN_DATA } = await server.ssrLoadModule('/src/data/kanjiData.ts');
  for (const level of ['KANKEN_10', 'KANKEN_9', 'KANKEN_5', 'KANKEN_PRE2', 'KANKEN_2', 'KANKEN_PRE1', 'KANKEN_1']) {
    console.log(`\n${level}`);
    console.log(KANKEN_DATA[level].slice(0, 12).map((p) => `${p.targetKanji}\t${p.question}\t${p.answer}`).join('\n'));
  }
  console.log('\n乳 variants in KANKEN_5');
  console.log(KANKEN_DATA.KANKEN_5.filter((p) => p.question.includes('「乳」')).map((p) => `${p.targetKanji}\t${p.question}\t${p.answer}`).join('\n'));
  console.log('\nKANKEN_2 all');
  console.log(KANKEN_DATA.KANKEN_2.map((p) => `${p.targetKanji}\t${p.question}\t${p.answer}`).join('\n'));
} finally {
  await server.close();
}
