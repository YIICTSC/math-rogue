import assert from 'node:assert/strict';
import {build} from 'esbuild';
await build({entryPoints:['src/mini-games/gakurogear/onlineEngine.ts'],bundle:true,platform:'node',format:'esm',outfile:'tmp/vr-hold-online.mjs'});
await build({entryPoints:['src/mini-games/gakurogear/engine.ts'],bundle:true,platform:'node',format:'esm',outfile:'tmp/vr-hold-engine.mjs'});
const {MISSIONS,createRun,holdCandidate,step}=await import('../tmp/vr-hold-engine.mjs');
const {createWorld,addPlayer,startWorld,tickWorld}=await import('../tmp/vr-hold-online.mjs');
const neutral={x:0,z:0,crouch:true,interact:false,decoy:false};
const mission={...MISSIONS[6],obstacles:[],cameras:[],sensors:[],routes:[[{x:0,z:0},{x:0,z:4}]],spawn:{x:0,z:-2.2},targets:[{x:7,z:7}],exit:{x:7,z:6},requiredHolds:1};
for(const distance of [1.1,2,2.4]) {
 const run=createRun(mission);run.player.z=-distance;
 assert.equal(holdCandidate(mission,run),0);
 for(let i=0;i<19;i++)step(mission,run,{...neutral,hold:true},.05);
 assert.equal(run.holds,1);assert(run.guards[0].sleep>0);
}
const run=createRun(mission);
run.player.z=-2.5;assert.equal(holdCandidate(mission,run),-1,'Cannot start beyond 2.4m');
run.player.z=-2.2;step(mission,run,{...neutral,hold:true},.05);
run.player.z=-2.7;step(mission,run,{...neutral,hold:true},.05);assert(run.holdProgress>.05,'Maintain progress within 2.8m');
run.player.z=-2.9;step(mission,run,{...neutral,hold:true},.05);assert.equal(run.holdProgress,0,'Moving too far cancels');
run.player.z=-2.2;step(mission,run,{...neutral,hold:true},.05);step(mission,run,neutral,.05);assert.equal(run.holdProgress,0,'Release cancels');
run.player.z=2;assert.equal(holdCandidate(mission,run),-1,'Front holds remain blocked');
const wall={x:0,z:-1,w:4,d:.2,h:3,kind:'wall'};
run.player.z=-2;assert.equal(holdCandidate({...mission,obstacles:[wall]},run),-1,'Walls block holds');
const nearest=createRun({...mission,routes:[[{x:0,z:0},{x:0,z:4}],[{x:0,z:-.5},{x:0,z:4}]]});
assert.equal(holdCandidate(mission,nearest),1,'Choose the closest guard');
nearest.holdTarget=0;nearest.holdProgress=.2;assert.equal(holdCandidate(mission,nearest),0,'Retain the current target');
const lesson={title:'test',questions:[{id:'1',mode:'ADDITION',question:'1+1',options:['2','3'],correct:0}]};
function battle(mode='royale') {
 const world=createWorld(mode,7,lesson,300);addPlayer(world,'a','A');addPlayer(world,'b','B');assert(startWorld(world,42));
 world.mission.obstacles=[];world.mission.cameras=[];world.mission.sensors=[];
 const a=world.players.a,b=world.players.b;
 a.run.player={x:0,z:-2.2,angle:0};b.run.player={x:0,z:0,angle:0};a.invulnerable=b.invulnerable=0;
 return {world,a,b};
}
for(const blocked of ['none','front','wall','range']) {
 const {world,a,b}=battle();
 if(blocked==='front')a.run.player.z=2;
 if(blocked==='wall')world.mission.obstacles=[wall];
 if(blocked==='range')a.run.player.z=-2.5;
 for(let i=0;i<19;i++)tickWorld(world,{a:{...neutral,hold:true},b:neutral},.05);
 assert.equal(b.hits,blocked==='none'?1:0,blocked);
 assert.equal(a.energy,blocked==='none'?80:100,'Energy spent only on success');
}
const {world,a,b}=battle();tickWorld(world,{a:{...neutral,hold:true}},.05);
a.run.player.z=-2.7;tickWorld(world,{a:{...neutral,hold:true}},.05);assert(a.run.holdProgress>.05,'PvP target survives movement update');
a.run.player.z=-2.9;tickWorld(world,{a:{...neutral,hold:true}},.05);assert.equal(a.run.holdProgress,0);
const coop=battle('coop');const g=coop.world.guards.guards[0];g.x=0;g.z=0;g.angle=0;
coop.a.run.player={x:0,z:-2.2,angle:0};coop.b.run.player={x:7,z:7,angle:0};
for(let i=0;i<22;i++)tickWorld(coop.world,{a:{...neutral,hold:true},b:neutral},.05);
assert.equal(coop.a.run.holds,1);assert(g.sleep>0);
console.log('PASS VR holds: extended range, release tolerance, nearest/sticky target, release/front/wall limits, solo/coop/PvP completion and energy.');
