import { createServer } from 'vite';
const server = await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error'});
const {KANJI_DATA,KANKEN_DATA}=await server.ssrLoadModule('/src/data/kanjiData.ts');
const {KANJI_READING_PROFILES,KANJI_CONTEXT_READING_PROFILES}=await server.ssrLoadModule('/src/data/kanjiReadingProfiles.ts');
const failures=[];
const allGroups={...KANJI_DATA,...KANKEN_DATA};
for(const [key,items] of Object.entries(allGroups)){
  for(const p of items){
    const unique=new Set(p.options);
    if(unique.size!==p.options.length) failures.push(`${key}: duplicate option: ${p.question}`);
    const answerCount=p.options.filter(x=>x===p.answer).length;
    if(answerCount!==1) failures.push(`${key}: answer count ${answerCount}: ${p.question}`);
  }
}
for(const profile of KANJI_READING_PROFILES){
  const expected=[...(profile.onyomi??[]).map(v=>['音読み',v.reading]),...(profile.kunyomi??[]).map(v=>['訓読み',v.reading])];
  const rows=Object.values(KANJI_DATA).flat().filter(p=>p.question.includes(`「${profile.kanji}」は何と読む？`));
  for(const [kind,reading] of expected){
    if(!rows.some(p=>p.question.includes(`【${kind}】`)&&p.answer===reading)) failures.push(`missing ${kind} ${profile.kanji}=${reading}`);
  }
}
for(const profile of KANJI_CONTEXT_READING_PROFILES){
  const rows=Object.values(KANJI_DATA).flat().filter(p=>profile.variants.some(v=>v.question===p.question));
  for(const v of profile.variants){
    const row=rows.find(p=>p.question===v.question&&p.answer===v.reading);
    if(!row) failures.push(`missing context ${profile.sourceQuestion}=${v.reading}`);
    else {
      const otherValid=profile.variants.map(x=>x.reading).filter(x=>x!==v.reading);
      const leaked=otherValid.filter(x=>row.options.includes(x));
      if(leaked.length) failures.push(`valid alternate leaked into options ${profile.sourceQuestion} ${v.reading}: ${leaked.join(',')}`);
    }
  }
  const raw=Object.values(KANJI_DATA).flat().filter(p=>p.question===profile.sourceQuestion);
  if(raw.length) failures.push(`raw ambiguous question remains: ${profile.sourceQuestion}`);
}
console.log('KANJI COUNTS');
for(let g=1;g<=9;g++) console.log(`KANJI_${g}`,KANJI_DATA[`KANJI_${g}`].length);
console.log('\nCONTEXT VARIANTS');
for(const profile of KANJI_CONTEXT_READING_PROFILES){
  console.log(profile.sourceQuestion);
  for(const v of profile.variants){
    const row=Object.values(KANJI_DATA).flat().find(p=>p.question===v.question&&p.answer===v.reading);
    console.log(JSON.stringify(row));
  }
}
console.log('\n乳 VARIANTS');
for(const p of KANJI_DATA.KANJI_6.filter(p=>p.question.includes('「乳」は何と読む？'))) console.log(JSON.stringify(p));
console.log('\nFAILURES',failures.length);
for(const f of failures) console.log(f);
await server.close();
if(failures.length) process.exit(1);
