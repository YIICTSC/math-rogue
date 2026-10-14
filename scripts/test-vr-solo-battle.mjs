import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
await mkdir('tmp',{recursive:true});
for(const file of ['soloBots','onlineEngine','network'])await build({entryPoints:[`src/mini-games/gakurogear/${file}.ts`],outfile:`tmp/solo-${file}.mjs`,bundle:true,platform:'node',format:'esm',packages:'external',define:{'import.meta.env':'{}'}});
const {SoloBots}=await import('../tmp/solo-soloBots.mjs'),E=await import('../tmp/solo-onlineEngine.mjs');
const lesson={title:'Test',questions:Array.from({length:3},(_,i)=>({id:String(i),mode:'ADDITION',question:'1+1',options:['2','0','1','3'],correct:0}))};
for(const mode of ['royale','bomb'])for(const seed of [1,2,27,20261014]){
 const w=E.createWorld(mode,1,lesson,90);w.bombMap=seed%3;E.addPlayer(w,'human','Player');const ids=['cpu1','cpu2','cpu3'];ids.forEach(id=>E.addPlayer(w,id,id));assert(E.startWorld(w,seed));
 const cpu=new SoloBots(ids),controls={},before=structuredClone(w.players.cpu1.run.player),initialCrates=w.bombArena?.cells.filter(c=>c===2).length;
 let bombs=0,shots=0;for(let i=0;i<1802;i++){cpu.update(w,controls,.05);bombs+=Object.values(controls).filter(v=>v.bomb).length;shots+=Object.values(controls).filter(v=>v.shoot).length;E.tickWorld(w,controls,.05);if(w.phase==='result')break;}
 assert.equal(w.phase,'result',`${mode}/${seed}: match never finished`);
 assert.notDeepEqual(w.players.cpu1.run.player,before,`${mode}/${seed}: CPU never moved`);
 if(mode==='bomb'){assert(bombs>=5,`bomb/${seed}: CPU never placed bombs`);assert(w.bombArena.cells.filter(c=>c===2).length<initialCrates,'CPU must clear crates');}
 else {assert(shots>0,`royale/${seed}: CPU never found a weapon and attacked`);assert(ids.some(id=>w.players[id].stats.hits>0),'CPU weapons must deal actual hits');}
 console.log(mode,seed,'phase',w.phase,'time',w.time.toFixed(1),'bombs',bombs,'shots',shots);
}
// The offline adapter never creates a Peer or dedicated connection and cleans its timer.
const listeners=new Map();let tick;const oldInterval=globalThis.setInterval,oldClear=globalThis.clearInterval;
globalThis.document={hidden:false,addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:(name,fn)=>{if(listeners.get(name)===fn)listeners.delete(name);}};
globalThis.setInterval=fn=>(tick=fn,1);let cleared=false;globalThis.clearInterval=()=>{cleared=true;};
try{
 const {VrRoom}=await import('../tmp/solo-network.mjs');let latest;const room=new VrRoom(w=>latest=w,()=>{});room.createSolo('Player','bomb',lesson,60,undefined,2,39);
 assert(room.solo&&room.host);assert.equal(Object.keys(latest.players).length,40);assert.equal(latest.phase,'playing');assert.equal(room.shareCode,'');
 const time=latest.time;room.pauseSolo(true);tick();tick();assert.equal(latest.time,time);room.pauseSoloEditor(true);room.pauseSolo(false);tick();tick();assert.equal(latest.time,time);room.pauseSoloEditor(false);tick();tick();assert(latest.time>time);
 room.input({x:1,z:0,crouch:false,interact:false,decoy:false,bomb:true});tick();tick();assert(latest.bombArena.bombs.some(b=>b.owner===room.selfId));
 room.supply();assert(latest.players[room.selfId].quiz);const own=latest.players[room.selfId],question=latest.lesson.questions[own.quizQuestions[0]];room.answer(question.correct,own.quizRound);assert.equal(latest.players[room.selfId].bomb.stock,3);room.closeBombQuiz();assert(!latest.players[room.selfId].quiz);
 room.world.phase='result';for(const p of Object.values(room.world.players))p.quiz=false;const round=room.world.round;room.rematch();assert.equal(latest.phase,'playing');assert.equal(latest.round,round+1);assert.equal(Object.keys(latest.players).length,40);
 room.close();assert(cleared);assert.equal(listeners.size,0);const closed=latest.time;tick();assert.equal(latest.time,closed);
}finally{globalThis.setInterval=oldInterval;globalThis.clearInterval=oldClear;delete globalThis.document;}
console.log('PASS: Solo CPU navigation/combat in both modes and four seeds / three bomb maps, 40-seat offline room, pause, human refill, immediate rematch and cleanup.');
