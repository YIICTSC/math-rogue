import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {build} from 'esbuild';
import {createHash} from 'node:crypto';
const result=await build({stdin:{contents:"export * from './src/quiz-show/engine';export * from './src/quiz-show/questions';export * from './src/quiz-show/types';export * from './src/quiz-show/prompt';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'node',write:false});
const E=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const raw=JSON.parse(await fs.readFile('src/quiz-show/varietyPrompts.json','utf8'));
const baseline=JSON.parse(await fs.readFile('scripts/quiz-show/variety-prefix-baseline.json','utf8'));
for(const[mode,entry]of Object.entries(baseline))assert.equal(createHash('sha256').update(JSON.stringify(raw[mode].slice(0,entry.count))).digest('hex'),entry.sha256,'Preserve shipped question IDs and content: '+mode);
assert.equal(E.onAirPrompt({mode:'CONSENSUS',prompt:'「お祭りのたべもの」で連想をそろえるなら？'}),'お祭りのたべものといえば？');assert.equal(E.onAirPrompt({mode:'STANDARD',prompt:'「物語」を書いた人は？'}),'「物語」を書いた人は？');
assert.equal(E.onAirPrompt({mode:'MAJORITY',prompt:'お祭りの食べ物：代表を一つだけ言う。'}),'お祭りのたべものといえば？');assert.equal(E.onAirPrompt({mode:'CONSENSUS',prompt:'赤い食べ物：冒険に役立ちそうなものを一つ。'}),'冒険に役立ちそうな赤い食べ物は？');assert.equal(E.onAirPrompt({mode:'MAJORITY',prompt:'Festival Foods: Name one classic example.'}),'What comes to mind for Festival Foods?');assert.equal(E.onAirPrompt({mode:'CONSENSUS',prompt:'「赤い花」で思い浮かべるのは？'}),'「赤い花」で思い浮かべるのは？');
const H={id:'host',role:'host'},P=id=>({id,role:'player'});
const cmd=(w,a,who=H)=>assert.equal(E.act(w,who,a,1000),null,JSON.stringify(a));
function round(mode,q){const w=E.createShow();w.plan.autoAdvance=false;w.plan.order='SEQUENTIAL';w.plan.partyFormat='CHOICE';for(const id of ['a','b','c'])E.addAnswerer(w,id,id);cmd(w,{type:'configure',title:'Variety',mode,teamCount:2});cmd(w,{type:'bank',questions:[q]});cmd(w,{type:'start'});cmd(w,{type:'open',roundId:w.round.id});return w;}
const categories=E.PARTY_CATEGORIES.filter(c=>c!=='ALL');assert.equal(categories.length,20);
for(const mode of E.MODES){
 const expanded=raw[mode].slice(-80);assert.equal(expanded.length,80);for(const category of categories)assert.equal(expanded.filter(q=>q.category===category).length,4,mode+'/'+category);
 const prompts=expanded.map(q=>q.prompt[0]);assert.equal(new Set(prompts).size,80,'No copied prompt within '+mode);
}
// Four knowledge rules intentionally share factual material. Agreement and wolf
// use shared associations; preferences, comedy, drawing and surveys are distinct.
const factual=new Set(raw.STANDARD.slice(-80).map(q=>q.prompt[0]));
const sourceKinds=['STANDARD','CONSENSUS','MAJORITY','VOTE','DRAW','NEAREST'];
const authored=sourceKinds.flatMap(mode=>raw[mode].slice(-80).map(q=>q.prompt[0]));assert.equal(new Set(authored).size,480);
for(const mode of ['CONSENSUS','MAJORITY','VOTE','WOLF','NEAREST'])assert(raw[mode].slice(-80).every(q=>q.answer.every(a=>a==='')));
for(const mode of ['MAJORITY','VOTE'])assert(raw[mode].slice(-80).every(q=>!factual.has(q.prompt[0])));
for(const language of ['JAPANESE','ENGLISH','HIRAGANA']){
 for(const mode of ['STANDARD','BUZZER','SURVIVAL','TEAMS'])for(const q of E.varietyQuestions(mode,language).slice(-80)){
  const w=round(mode,q),id=w.round.id;if(mode==='BUZZER')cmd(w,{type:'buzz',roundId:id},P('a'));
  cmd(w,{type:'answer',roundId:id,text:q.answer,ink:[],submit:true},P('a'));assert.equal(w.round.grades.a,true);cmd(w,{type:'close',roundId:id});cmd(w,{type:'score',roundId:id});assert.equal(w.players.a.score,100);
 }
 for(const q of E.varietyQuestions('DRAW',language).slice(-80)){
  const w=round('DRAW',q),id=w.round.id,text=q.aliases.find(a=>a!==q.answer)||q.answer;
  cmd(w,{type:'answer',roundId:id,text,ink:[],submit:true},P('b'));cmd(w,{type:'close',roundId:id});cmd(w,{type:'score',roundId:id});assert.equal(w.players.b.score,100,'Accepted drawing answer: '+text);
 }
}
assert.deepEqual(raw.CONSENSUS.slice(-80),raw.WOLF.slice(-80),'Wolf uses consensus material without inventing fixed correct answers');
console.log('PASS 800 additional mode entries from 480 authored prompts; 20 categories × 4 per mode, distinct prompt families, 960 automatic factual scores, 240 drawing aliases and opinion/survey semantics.');
