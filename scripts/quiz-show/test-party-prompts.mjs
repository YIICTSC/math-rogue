import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {build} from 'esbuild';
const bundle=await build({stdin:{contents:"export * from './src/quiz-show/questions';export * from './src/quiz-show/engine';export * from './src/quiz-show/types';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'node',write:false});
const original=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const E={...original,createShow:(...args)=>{const w=original.createShow(...args);w.plan.order='SEQUENTIAL';w.plan.autoAdvance=false;return w;}};
const social=['VOTE','CONSENSUS','MAJORITY','WOLF'];
for(const language of ['JAPANESE','ENGLISH','HIRAGANA'])for(const mode of E.MODES){
 const pack=E.starterQuestions(mode,language);assert.equal(pack.length,12);assert(E.validBank(pack),`${mode}/${language} is playable`);assert.equal(new Set(pack.map(q=>q.id)).size,12);assert.equal(new Set(pack.map(q=>q.prompt+'|'+q.answer)).size,12);
 for(const q of pack){assert(q.prompt.trim());assert.equal(q.format,mode==='DRAW'?'FLIP':'TEXT');assert.equal(q.answer==='',social.includes(mode));if(mode==='NEAREST')assert.notEqual(E.numericAnswer(q.answer),null);}
}
assert.deepEqual(E.starterQuestions('NEAREST','JAPANESE').map(q=>Number(q.answer)),[100,7*24*60,30*6,12*120,25*8,10*24*60*60,125*24,5000/10,2**10,150*40*2,400*42,80*15]);
// Real scoring still works with the new entertainment packs in every objective mode.
const H={id:'host',role:'host'};
for(const mode of ['STANDARD','BUZZER','SURVIVAL','TEAMS','NEAREST','DRAW']){
 const w=E.createShow();for(const id of ['a','b','c'])E.addAnswerer(w,id,id);const pack=E.starterQuestions(mode,'JAPANESE');
 const cmd=(a,actor=H)=>assert.equal(E.act(w,actor,a),null,JSON.stringify(a));cmd({type:'configure',title:'Party',mode,teamCount:2});cmd({type:'bank',questions:pack});cmd({type:'start'});cmd({type:'open',roundId:w.round.id});const id=w.round.id,answerer=w.round.artist==='a'?'b':'a';
 if(mode==='BUZZER')cmd({type:'buzz',roundId:id},{id:answerer,role:'player'});
 cmd({type:'answer',roundId:id,text:w.round.question.answer,ink:[],submit:true},{id:answerer,role:'player'});cmd({type:'close',roundId:id});cmd({type:'autoJudge',roundId:id});cmd({type:'score',roundId:id});assert(w.players[answerer].score>0,mode+' accepts its factual answer');
}
const rules=await fs.readFile('src/quiz-show/Rules.tsx','utf8');assert(!rules.includes('wolfknock'));assert(rules.includes('springin.org'),'Keep required sound credits');
console.log('PASS 120 mode-specific prompts in three languages, valid packs, social answer semantics, derived numeric answers, real factual scoring and reference-link removal.');
