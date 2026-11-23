import assert from 'node:assert/strict';
import {build} from 'esbuild';
const result=await build({stdin:{contents:"export * from './src/quiz-show/engine';export * from './src/quiz-show/questions';export * from './src/quiz-show/types';export * from './src/quiz-show/authority';export * from './src/quiz-show/prompt';export {themedQuestions} from './src/quiz-show/catalogue/partyTopics';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'node',write:false});
const E=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const H={id:'host',role:'host'},S={id:'screen',role:'screen'},P=id=>({id,role:'player'});
const cmd=(w,a,actor=H,now=1000)=>assert.equal(E.act(w,actor,a,now),null,JSON.stringify(a));
const patchWorld=E.createShow();cmd(patchWorld,{type:'plan',partyCategory:'ANIMALS'});cmd(patchWorld,{type:'plan',partyFormat:'CHOICE'});cmd(patchWorld,{type:'plan',limit:2});assert.equal(patchWorld.plan.partyCategory,'ANIMALS');assert.equal(patchWorld.plan.partyFormat,'CHOICE');assert.equal(patchWorld.plan.limit,2);
let total=0;
const allowedStarterLimit={STANDARD:12,BUZZER:12,SURVIVAL:12,TEAMS:12,CONSENSUS:20,WOLF:0,VOTE:0,MAJORITY:0,DRAW:20,NEAREST:20};
for(const language of ['JAPANESE','ENGLISH','HIRAGANA'])for(const mode of E.MODES){
 const bank=E.varietyQuestions(mode,language);
 assert(bank.every(E.validQuestion),mode+language);
 assert.equal(new Set(bank.map(q=>q.id)).size,bank.length);
 assert.deepEqual(bank.map(q=>q.id),E.varietyQuestions(mode,'JAPANESE').map(q=>q.id));
 const largestQuestions=bank.map(q=>Buffer.byteLength(JSON.stringify(q))+1).sort((a,b)=>b-a);
 assert(largestQuestions.slice(0,E.MAX_VARIETY_PACK).reduce((a,b)=>a+b,1024)<256000,'Largest possible pack must fit the existing transport');
 const onAir=bank.map(q=>(mode==='DRAW'?q.answer:E.onAirPrompt({mode,prompt:q.prompt})).normalize('NFKC').toLowerCase().replace(/\s|[？?。]/g,''));
 assert.equal(new Set(onAir).size,bank.length,'Repeated on-air question or drawing subject '+mode+'/'+language);
 if (language === 'JAPANESE') {
  const selectedIds = new Set(bank.map(q => q.id));
  assert(!bank.some(q => q.id.startsWith('catalogue-')), 'Retired angle-based prompts must stay out of the bank');
  const topics = E.PARTY_CATEGORIES.slice(1).flatMap(category => E.themedQuestions(mode, language, category))
   .filter(({question}) => selectedIds.has(question.id)).map(({theme}) => theme);
  assert.equal(new Set(topics).size, topics.length, 'A specific topic can only appear once across the three levels in '+mode);
 }
 for(const q of bank){
  const index=Number(q.id.split('-').at(-1));
  if(q.id.startsWith('starter-'))assert(index<allowedStarterLimit[q.id.split('-')[1]],'Retired template in '+mode);
  if(['CONSENSUS','WOLF','VOTE'].includes(mode)&&q.id.startsWith('variety-'+mode+'-'))assert(index>=64,'Misrouted preference survey in '+mode);
 }
 for(const q of bank){if(!['DRAW','NEAREST'].includes(mode)){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);if(!q.opinion)assert(q.options.includes(q.answer));}}
 if(language==='JAPANESE')total+=bank.length;
 for(const category of E.PARTY_CATEGORIES)for(const level of ['ALL','EASY','NORMAL','HARD']){
  const matching = bank.filter(q => E.matchesPartyPlan(q, { partyCategory:category, partyLevel:level }));
  const pack = E.varietyPack(bank,{partyCategory:category,partyLevel:level,order:'RANDOM'});
  if (category!=='ALL' && level!=='ALL') assert(matching.length >= 30, 'Sparse category '+mode+'/'+category+'/'+level);
  assert(E.validBankForMode(mode,pack),mode+'/'+category+'/'+level+'/'+language);
  const w=E.createShow();for(const id of ['a','b','c'])E.addAnswerer(w,id,id);cmd(w,{type:'configure',title:'Test',mode,teamCount:2});cmd(w,{type:'bank',questions:pack,source:'Variety '+category});cmd(w,{type:'plan',...w.plan,partyCategory:category,partyLevel:level,partyFormat:'CHOICE'});cmd(w,{type:'start'});
  assert.equal(w.queue.length,Math.min(matching.length,E.MAX_VARIETY_PACK),mode+category+level);
  assert.equal(new Set(w.queue).size,w.queue.length,'No question can recur in a normal round queue');
  assert(w.queue.every(i=>E.matchesPartyPlan(pack[i],w.plan)));assert.equal(E.viewFor(w,S).questionSource,'Variety '+category);
  cmd(w,{type:'open',roundId:w.round.id});
  if(!['DRAW','NEAREST'].includes(mode)){assert.equal(w.round.question.options.length,4);assert.equal(new Set(w.round.question.options).size,4);if(!w.round.question.opinion)assert(w.round.question.options.includes(w.round.question.answer));}
 }
}
assert.equal(total,18000,'Expanded catalogue size');
const pool = E.varietyQuestions('CONSENSUS','JAPANESE');
assert.deepEqual(E.varietyPack(pool,{order:'SEQUENTIAL'}),pool.slice(0,E.MAX_VARIETY_PACK));
const rounds = Array.from({length:5},()=>E.varietyPack(pool,{order:'RANDOM'}));
assert(new Set(rounds.flat().map(q=>q.id)).size>2*E.MAX_VARIETY_PACK,'Broad replay draws from beyond a single packet');
const freshRooms = Array.from({length:5},()=>E.starterQuestions('MAJORITY','JAPANESE'));
assert(new Set(freshRooms.flat().map(q=>q.id)).size>120,'Fresh rooms rotate the initial prompts');
assert.equal(E.PARTY_CATEGORIES.length,21,'20 categories plus all');
// The host can judge live; audience packets and ink fetches cannot reveal a submitted flip.
const w=E.createShow();for(const id of ['a','b'])E.addAnswerer(w,id,id);
cmd(w,{type:'bank',questions:[{id:'ink',prompt:'Draw a ship',answer:'ship',aliases:[],format:'FLIP',options:[],seconds:60,points:100}]});cmd(w,{type:'start'});cmd(w,{type:'open',roundId:w.round.id});
const r=w.round.id;cmd(w,{type:'answer',roundId:r,text:'SECRET',ink:[{c:0,w:2,p:[1,2,10,20]}],submit:true},P('a'));cmd(w,{type:'grade',roundId:r,playerId:'a',correct:true});
assert(E.viewFor(w,H).round.tiles[0].text==='SECRET');assert.equal(E.viewFor(w,S).round.tiles[0].visible,false);assert.equal(E.viewFor(w,S).round.tiles[0].text,undefined);assert.equal(E.inkFor(w,S,r,'a'),null);
cmd(w,{type:'close',roundId:r});assert.equal(E.viewFor(w,S).round.tiles[0].visible,false);cmd(w,{type:'publish',roundId:r});assert.equal(E.viewFor(w,S).round.tiles[0].text,'SECRET');
cmd(w,{type:'autoPause',roundId:r});const phase=w.phase;E.tickShow(w,90000);assert.equal(w.phase,phase);assert.equal(w.autoProgress,undefined);assert.equal(E.act(w,P('a'),{type:'autoPause',roundId:r}),'AUTH');
cmd(w,{type:'score',roundId:r});E.tickShow(w,100000);assert.equal(w.phase,'scoreboard');cmd(w,{type:'autoPause',roundId:r},H,100001);E.tickShow(w,100001);E.tickShow(w,105002);assert.equal(w.phase,'finished');
const authority=new E.ShowAuthority('host_key_1234567890');const screen=authority.join({protocol:1,role:'screen',key:'screen_key_1234567890'});assert(!screen.error);assert.equal(authority.view(H).audienceScreens,1);authority.leave(screen.actor);assert.equal(authority.view(H).audienceScreens,0);
console.log('PASS '+total+' available prompts, 30+ per mode/category/level, unique on-air text, bounded randomized packs, automatic choice validation and broadcast privacy.');
