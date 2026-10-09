import assert from 'node:assert/strict';
import {build} from 'esbuild';
await build({entryPoints:['src/mini-games/gakurogear/onlineEngine.ts'],bundle:true,platform:'node',format:'esm',outfile:'tmp/vr-polish-engine.mjs'});
const {createWorld,addPlayer,startWorld,tickWorld,answer,completeQuiz,requestSupply,returnToLobby,safeRadius,quizLesson,retryCoop}=await import('../tmp/vr-polish-engine.mjs');
const lesson={title:'Pool',questions:Array.from({length:15},(_,i)=>({id:String(i),mode:'ADDITION',question:`${i}+1`,options:[String(i+1),'wrong 1','wrong 2','wrong 3'],correct:0}))};
const neutral={x:0,z:0,crouch:true,interact:false,decoy:false};
const w=createWorld('coop',1,lesson,300);addPlayer(w,'a','A');addPlayer(w,'b','B');startWorld(w,123);w.guards.guards=[];w.mission.cameras=[];w.mission.sensors=[];
// Ally collection is available while your own objectives are still incomplete.
w.players.a.run.player={x:2.5,z:-5,angle:0};for(let i=0;i<18;i++)tickWorld(w,{a:{...neutral,interact:true}},.05);assert(w.players.b.run.collected[0]);assert(!w.players.a.run.collected[0]);assert.equal(w.players.a.stats.assists,1);
w.players.b.run.status='caught';w.players.b.run.quiz=false;w.players.b.run.player={x:3,z:-5,angle:0};for(let i=0;i<32;i++)tickWorld(w,{a:{...neutral,interact:true}},.05);assert.equal(w.players.b.run.status,'playing');assert.equal(w.players.a.stats.rescues,1);assert(w.players.b.run.collected[0]);
const questions=[];for(let round=0;round<5;round++){w.time=round*31;assert(requestSupply(w,'a'));const selected=quizLesson(w,w.players.a);questions.push(...selected.questions.map(q=>q.id));assert.equal(completeQuiz(w,'a'),false);answer(w,'a',0);answer(w,'a',0);answer(w,'a',0);assert(w.players.a.quiz,'Final answer feedback stays protected until acknowledged');assert(completeQuiz(w,'a'));assert.equal(requestSupply(w,'a'),false);}
assert.equal(new Set(questions).size,15);assert.equal(w.players.a.stats.correct,15);
w.players.b.run.status='caught';retryCoop(w,'b');assert(w.players.b.run.collected[0],'Retry keeps progress');
w.players.a.run.status=w.players.b.run.status='clear';w.players.a.run.collected=[true];tickWorld(w,{},.05);assert.equal(w.phase,'result');assert.equal(w.players.a.wins,1);assert(returnToLobby(w,true));assert.equal(w.missionId,2);assert.equal(w.players.a.name,'A');assert.equal(w.players.a.wins,1);assert(startWorld(w,456));assert.equal(w.round,2);assert.equal(w.players.a.stats.correct,0);
const arena=createWorld('royale',300,lesson,120);addPlayer(arena,'a','A');addPlayer(arena,'b','B');startWorld(arena,99);arena.mission.obstacles=[];arena.players.a.invulnerable=arena.players.b.invulnerable=0;const initial=safeRadius(arena);arena.time=90;assert(safeRadius(arena)<initial);arena.players.a.run.player={x:arena.mission.size-1,z:0,angle:0};arena.players.b.run.player={x:0,z:0,angle:0};for(let i=0;i<122;i++)tickWorld(arena,{},.05);assert.equal(arena.players.a.hits,1);
const crate=arena.supplies[0];crate.kind='ammo';crate.readyAt=0;crate.x=0;crate.z=0;arena.players.b.run.ammo=0;tickWorld(arena,{},.05);assert.equal(arena.players.b.run.ammo,3);assert(crate.readyAt>arena.time);
crate.kind='repair';crate.readyAt=0;arena.players.b.hits=2;tickWorld(arena,{},.05);assert.equal(arena.players.b.hits,1);
assert(requestSupply(arena,'a'));answer(arena,'a',0);answer(arena,'a',0);answer(arena,'a',0);assert(completeQuiz(arena,'a'));assert(Math.hypot(arena.players.a.run.player.x,arena.players.a.run.player.z)<safeRadius(arena));assert(arena.players.a.run.ammo>=3);
// A cloaked target can only be hit at close range; firing reveals the attacker.
arena.time=0;arena.players.a.run.player={x:0,z:0,angle:0};arena.players.b.run.player={x:0,z:3,angle:Math.PI};arena.players.a.run.weapon=0;arena.players.a.run.shotCooldown=0;arena.players.a.invulnerable=arena.players.b.invulnerable=0;arena.players.b.run.stealth=6;arena.players.a.run.stealth=6;const hits=arena.players.b.hits;tickWorld(arena,{a:{...neutral,shoot:true}},.05);assert.equal(arena.players.b.hits,hits);assert.equal(arena.players.a.run.stealth,0);
arena.players.b.run.player.z=1;arena.players.a.run.shotCooldown=0;tickWorld(arena,{a:{...neutral,shoot:true}},.05);assert.equal(arena.players.b.hits,hits+1);
console.log('PASS cooperative help/revive/progress retry, nonrepeating question deck, protected feedback/rewards, same-room next stage, shrinking zone, supply crates, quiz return and cloak counterplay.');

const mags=createWorld('royale',300,lesson,300);addPlayer(mags,'a','A');addPlayer(mags,'b','B');startWorld(mags,5);mags.players.a.run.weapon=3;mags.players.a.run.ammo=0;tickWorld(mags,{a:{...neutral,reload:true}},.05);for(let i=0;i<24;i++)tickWorld(mags,{},.05);assert.equal(mags.players.a.run.ammo,12);assert.equal(mags.players.a.energy,75);console.log('PASS weapon-specific magazine capacities and deliberate reload costs.');

// Eliminated players respawn, keep moving and cannot alter contenders' results.
const replay=createWorld('royale',300,lesson,300);for(const id of ['a','b','c','d'])addPlayer(replay,id,id);startWorld(replay,87);replay.mission.obstacles=[];replay.supplies=[];
const a=replay.players.a,b=replay.players.b,c=replay.players.c,d=replay.players.d;
a.run.player={x:0,z:0,angle:0};b.run.player={x:0,z:2,angle:0};c.run.player={x:8,z:8,angle:0};d.run.player={x:-8,z:-8,angle:0};a.invulnerable=b.invulnerable=0;b.hits=2;
tickWorld(replay,{a:{...neutral,shoot:true}},.05);assert(b.out);assert.equal(b.run.status,'playing');assert.equal(b.hits,3);assert.equal(b.respawnHits,0);assert.equal(replay.phase,'playing');assert(b.invulnerable>0);
const bx=b.run.player.x;tickWorld(replay,{b:{...neutral,x:1}},.05);assert.notEqual(b.run.player.x,bx);
b.run.player={x:0,z:0,angle:0};a.run.player={x:0,z:2,angle:0};a.invulnerable=b.invulnerable=0;b.run.shotCooldown=0;const ah=a.hits;tickWorld(replay,{b:{...neutral,shoot:true}},.05);assert.equal(a.hits,ah,'Respawned cannot damage contender');
a.run.player={x:0,z:0,angle:0};b.run.player={x:0,z:2,angle:0};a.run.shotCooldown=0;tickWorld(replay,{a:{...neutral,shoot:true}},.05);assert.equal(b.respawnHits,0,'Contender cannot damage respawned player');
d.out=true;d.run.player={x:0,z:0,angle:0};b.run.player={x:0,z:2,angle:0};d.run.shotCooldown=0;b.invulnerable=0;b.respawnHits=2;tickWorld(replay,{d:{...neutral,shoot:true}},.05);assert.equal(b.respawnHits,0);assert.equal(b.hits,3);assert(b.invulnerable>0);
assert(requestSupply(replay,'b'));for(let i=0;i<3;i++)answer(replay,'b',0);assert(completeQuiz(replay,'b'));assert(b.out,'Learning cannot restore victory eligibility');
assert.equal(replay.phase,'playing');c.out=true;tickWorld(replay,{},.05);assert.equal(replay.phase,'result');assert.deepEqual(replay.winner,['a']);assert(returnToLobby(replay));assert(startWorld(replay,88));assert(Object.values(replay.players).every(p=>!p.out&&p.respawnHits===0));
console.log('PASS eliminated respawn/movement/repeated respawn, separate combat, permanent result lock, learning resupply, winner and rematch reset.');
