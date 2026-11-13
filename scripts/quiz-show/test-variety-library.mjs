import assert from 'node:assert/strict';
import {build} from 'esbuild';
const result=await build({stdin:{contents:"export * from './src/quiz-show/engine';export * from './src/quiz-show/questions';export * from './src/quiz-show/types';export * from './src/quiz-show/authority';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'node',write:false});
const E=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const H={id:'host',role:'host'},S={id:'screen',role:'screen'},P=id=>({id,role:'player'});
const cmd=(w,a,actor=H,now=1000)=>assert.equal(E.act(w,actor,a,now),null,JSON.stringify(a));
const patchWorld=E.createShow();cmd(patchWorld,{type:'plan',partyCategory:'ANIMALS'});cmd(patchWorld,{type:'plan',partyFormat:'CHOICE'});cmd(patchWorld,{type:'plan',limit:2});assert.equal(patchWorld.plan.partyCategory,'ANIMALS');assert.equal(patchWorld.plan.partyFormat,'CHOICE');assert.equal(patchWorld.plan.limit,2);
let total=0;
for(const language of ['JAPANESE','ENGLISH','HIRAGANA'])for(const mode of E.MODES){
 const bank=E.varietyQuestions(mode,language);assert(E.validBankForMode(mode,bank),mode+language);assert(bank.length>60);assert.equal(new Set(bank.map(q=>q.id)).size,bank.length);assert(bank.length<=E.MAX_SHOW_QUESTIONS);
 for(const q of bank){if(!['DRAW','NEAREST'].includes(mode)){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);if(!q.opinion)assert(q.options.includes(q.answer));}}
 if(language==='JAPANESE')total+=bank.length;
 for(const category of E.PARTY_CATEGORIES)for(const level of ['ALL','EASY','NORMAL','HARD']){
  const w=E.createShow();for(const id of ['a','b','c'])E.addAnswerer(w,id,id);cmd(w,{type:'configure',title:'Test',mode,teamCount:2});cmd(w,{type:'bank',questions:bank,source:'Variety '+category});cmd(w,{type:'plan',...w.plan,partyCategory:category,partyLevel:level,partyFormat:'CHOICE'});cmd(w,{type:'start'});
  assert(w.queue.length>0,mode+category+level);assert(w.queue.every(i=>E.matchesPartyPlan(bank[i],w.plan)));assert.equal(E.viewFor(w,S).questionSource,'Variety '+category);
  cmd(w,{type:'open',roundId:w.round.id});
  if(!['DRAW','NEAREST'].includes(mode)){assert.equal(w.round.question.options.length,4);assert.equal(new Set(w.round.question.options).size,4);if(!w.round.question.opinion)assert(w.round.question.options.includes(w.round.question.answer));}
 }
}
assert.equal(total,1976,'600 legacy + 576 first collection + 800 expansion entries');
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
console.log('PASS 1976 categorized mode entries in 3 languages, all 20 categories/levels/modes, four-choice validity, private collection, host deliberation pause/resume and audience connection count.');
