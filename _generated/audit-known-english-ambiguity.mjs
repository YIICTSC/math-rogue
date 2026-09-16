import { createServer } from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error'});
try {
 const {SUBJECT_DATA}=await server.ssrLoadModule('/src/data/subjectData.ts');
 const checks=[
  ['ENGLISH_G3_U01',/「こんにちは」|^こんにちは に|「こんにちは」は/],
  ['ENGLISH_G3_U10',/「あし」|^あし に|「あし」は/],
  ['ENGLISH_G6_U07',/「見た」|^見た に|「見た」は/],
 ];
 for(const [m,re] of checks){const hit=(SUBJECT_DATA[m]||[]).filter(p=>re.test(p.question));console.log(m,'AMBIGUOUS_PROMPTS',hit.length);if(hit.length) console.log(hit.map(p=>p.question).slice(0,8));}
 const libs=['ENGLISH_G4_U07','ENGLISH_G4_U08'].flatMap(m=>(SUBJECT_DATA[m]||[]).filter(p=>p.question.includes('「library」')).map(p=>[m,p.question,p.answer]));
 console.log('PLAIN_LIBRARY_PROMPTS',libs.length,libs.slice(0,8));
} finally {await server.close();}
