import { createServer } from 'vite';
const server = await createServer({ server:{ middlewareMode:true }, appType:'custom', logLevel:'error' });
const mod = await server.ssrLoadModule('/src/data/kanjiData.ts');
const { KANJI_DATA } = mod;
for (let grade=1; grade<=9; grade++) {
  const key=`KANJI_${grade}`;
  const arr=KANJI_DATA[key]||[];
  const singles=arr.filter(p=>Array.from(p.question.replace(/[「」『』【】\s]/g,'')).length===1);
  const optionAlt=singles.filter(p=>p.options.some(o=>o!==p.answer && /^[ぁ-ゖー]+$/.test(o)));
  console.log(key,'TOTAL',arr.length,'SINGLE',singles.length,'ALT_OPTIONS',optionAlt.length);
  for(const p of optionAlt.slice(0,30)) console.log(JSON.stringify(p));
}
await server.close();
