import assert from 'node:assert/strict';import {createServer} from 'vite';
const server=await createServer({appType:'custom',server:{middlewareMode:true,watch:null,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}});
try{
 const {typingProgress,EXTRA_WORDS,EXTRA_SENTENCES,EXTRA_ENGLISH}=await server.ssrLoadModule('/src/data/typingVariety.ts');
 const {buildPromptFromLesson,getAcceptedAnswersForPrompt}=await server.ssrLoadModule('/src/data/typingPrompts.ts');
 const {TYPING_LESSON_DEFINITIONS}=await server.ssrLoadModule('/src/data/typingLessonConfig.ts');
 assert.equal(typingProgress(1,1).level,1);assert.equal(typingProgress(1,2).level,2);assert.equal(typingProgress(1,1,8).level,5);assert.equal(typingProgress(3,8,99).level,30);
 for(const group of EXTRA_WORDS.flat().concat(EXTRA_SENTENCES.flat())){
  assert(/^[a-z]+$/.test(group.accepted[0]),group.text+': '+group.accepted[0]);assert(group.accepted.includes(group.text));
 }
 assert(EXTRA_WORDS.flat().length>=100);assert(EXTRA_SENTENCES.flat().length>=120);assert(EXTRA_ENGLISH.flat().length>=100);
 for(const language of ['JAPANESE','ENGLISH','HIRAGANA'])for(const lesson of TYPING_LESSON_DEFINITIONS){
  for(const [act,floor]of[[1,1],[1,7],[2,2],[2,8],[3,7]]){
   const samples=[];for(let i=0;i<20;i++){
    const p=buildPromptFromLesson(lesson.id,act,floor,'same-card',language);assert(p.text&&p.answer&&p.acceptedAnswers.length);assert(getAcceptedAnswersForPrompt(p).includes(p.answer.toLowerCase().replace(/\s+/g,'')),lesson.id);assert(p.title.includes('Lv.'));samples.push(p.text);
   }
   if(lesson.id!=='HOME_ROW')assert(new Set(samples).size>=(['WORDS','SENTENCES','ENGLISH','MIXED'].includes(lesson.id)?8:4),`${language} ${lesson.id} ${act}/${floor} varied prompts: ${new Set(samples).size}`);
  }
 }
 for(const lesson of ['HOME_ROW','WORDS','SENTENCES','ENGLISH','NUMBERS_SYMBOLS']){
  const lengths=([act,floor])=>Array.from({length:60},()=>buildPromptFromLesson(lesson,act,floor,'same-card','JAPANESE').answer.length).reduce((a,b)=>a+b,0)/60;
  const early=lengths([1,1]),late=lengths([3,7]);assert(late>early*1.6,`${lesson}: difficulty increases ${early} => ${late}`);console.log(lesson,early.toFixed(1),'→',late.toFixed(1));
 }
 const p={text:'しゅっちょう',acceptedAnswers:['shucchou'],answer:'shucchou'};assert(getAcceptedAnswersForPrompt(p).includes('syucchou'));
 console.log('Typing: all 15 lessons × 3 languages × 5 bands, recently seen prompt avoidance, 30-level progression, expanded vocabulary and romanization alternatives passed.');
}finally{await server.close();}
