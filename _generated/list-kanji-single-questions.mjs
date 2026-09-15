import { createServer } from 'vite';
const server = await createServer({ server:{middlewareMode:true}, appType:'custom', logLevel:'error' });
const { KANJI_DATA } = await server.ssrLoadModule('/src/data/kanjiData.ts');
for(let grade=1;grade<=9;grade++){
 const arr=KANJI_DATA[`KANJI_${grade}`]||[];
 const singles=arr.filter(p=>Array.from(p.question.replace(/[「」『』【】\s]/g,'')).length===1);
 console.log(`\n## G${grade} ${singles.length}`);
 for(const p of singles) console.log(`${p.question}\t${p.answer}\t${p.options.join(' / ')}\t${p.hint||''}`);
}
await server.close();
