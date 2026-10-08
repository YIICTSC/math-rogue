import assert from 'node:assert/strict';
import {build} from 'esbuild';
await build({entryPoints:['src/mini-games/gakurogear/onlineEngine.ts'],bundle:true,platform:'node',format:'esm',outfile:'tmp/vr-online-engine.mjs'});
const {createWorld,addPlayer,startWorld,tickWorld,answer,retryCoop}=await import('../tmp/vr-online-engine.mjs');
const lesson={title:'test',questions:Array.from({length:3},(_,i)=>({id:String(i),mode:'ADDITION',question:'1+1',options:['2','3','4','5'],correct:0}))};
const neutral={x:0,z:0,crouch:true,interact:false,decoy:false};
const w=createWorld('royale',1,lesson,300);addPlayer(w,'a','A');addPlayer(w,'b','B');assert(startWorld(w,42));assert(w.mission.size>16);assert(w.mission.obstacles.length>20);
const original=JSON.stringify(w.mission.obstacles);const different=createWorld('royale',1,lesson,300);addPlayer(different,'a','A');addPlayer(different,'b','B');startWorld(different,43);assert.notEqual(JSON.stringify(different.mission.obstacles),original);
w.mission.obstacles=[];const a=w.players.a,b=w.players.b;a.run.player={x:0,z:0,angle:0};b.run.player={x:0,z:3,angle:Math.PI};a.invulnerable=b.invulnerable=0;
for(let hit=0;hit<3;hit++){a.run.shotCooldown=0;b.invulnerable=0;tickWorld(w,{a:{...neutral,shoot:true}},.05);assert.equal(b.hits,hit+1);}
assert(b.out);assert.equal(w.phase,'result');assert.deepEqual(w.winner,['a']);assert(w.players.b);
const e=createWorld('royale',1,lesson,300);addPlayer(e,'a','A');addPlayer(e,'b','B');startWorld(e,1);e.mission.obstacles=[];e.players.a.energy=25;e.players.a.run.ammo=0;
tickWorld(e,{a:{...neutral,reload:true}},.05);assert(e.players.a.quiz);assert.equal(e.players.a.energy,0);
const position={...e.players.a.run.player};tickWorld(e,{a:{...neutral,x:1}},.05);assert.deepEqual(e.players.a.run.player,position);
answer(e,'a',0);answer(e,'a',0);answer(e,'a',0);assert(!e.players.a.quiz);assert.equal(e.players.a.energy,100);
const coop=createWorld('coop',1,lesson,300);addPlayer(coop,'a','A');addPlayer(coop,'b','B');startWorld(coop,3);assert.equal(coop.mission.targets.length,2);assert(coop.mission.size>8);
for(let i=0;i<20;i++)tickWorld(coop,{a:neutral,b:neutral},.05);assert.equal(coop.phase,'playing');
coop.players.a.run.status='clear';coop.players.a.run.collected=[true];coop.players.a.answers=[0,0,0];coop.players.a.quiz=false;
// Finished participant collects a team mate's file in their expanded zone.
coop.players.a.run.player={x:2.5,z:-5,angle:0};tickWorld(coop,{a:{...neutral,interact:true}},.05);assert(coop.players.b.run.collected[0]);assert(coop.players.a.helped.includes('b'));
coop.players.b.run.status='clear';coop.players.b.quiz=false;tickWorld(coop,{},.05);assert.equal(coop.phase,'result');
console.log('PASS seeded field, authoritative hits/3-hit elimination/spectator, energy/reload/3-question refill, expanded cooperative zones and helping.');

const holdCoop=createWorld('coop',7,lesson,300);addPlayer(holdCoop,'a','A');addPlayer(holdCoop,'b','B');startWorld(holdCoop,42);
const guard=holdCoop.guards.guards[0];holdCoop.mission.cameras=[];holdCoop.mission.sensors=[];holdCoop.players.a.run.player={x:guard.x,z:guard.z+.8,angle:Math.PI};
for(let i=0;i<25;i++)tickWorld(holdCoop,{a:{...neutral,hold:true},b:neutral},.05);
assert.equal(holdCoop.players.a.run.holds,1);assert(holdCoop.guards.guards[0].sleep>0);
const failed=createWorld('coop',1,lesson,60);addPlayer(failed,'a','A');startWorld(failed,2);failed.players.a.run.status='caught';failed.players.a.quiz=true;answer(failed,'a',0);answer(failed,'a',0);answer(failed,'a',0);retryCoop(failed,'a');assert.equal(failed.players.a.run.status,'playing');
failed.time=60;tickWorld(failed,{},.05);assert.equal(failed.phase,'result');assert(failed.players.a.quiz);assert.equal(failed.players.a.run.status,'timeout');
const doors=createWorld('coop',2,lesson,300);addPlayer(doors,'a','A');addPlayer(doors,'b','B');startWorld(doors,5);assert.equal(doors.mission.switches.length,2);assert.equal(doors.mission.obstacles.filter(b=>b.kind==='door').length,2);
doors.players.a.run.player={...doors.mission.switches[0],angle:0};for(let i=0;i<15;i++)tickWorld(doors,{a:{...neutral,interact:true},b:neutral},.05);assert(doors.players.b.run.switches[0]);
console.log('PASS cooperative hold progress, shared sleep and doors, 3-question failure retry and timeout quiz.');
