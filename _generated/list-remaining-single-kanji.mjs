import { createServer } from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error'});
const {KANJI_DATA}=await server.ssrLoadModule('/src/data/kanjiData.ts');
const single=/^[\p{Script=Han}]$/u;
for(let g=1;g<=9;g++){
  const key=`KANJI_${g}`;
  const rows=KANJI_DATA[key].filter(p=>single.test(p.question.replace(/[「」『』【】\s]/g,'')));
  console.log(key, rows.length);
  for(const p of rows) console.log(JSON.stringify(p));
}
await server.close();
