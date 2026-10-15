import assert from 'node:assert/strict';
import {build} from 'esbuild';
await build({entryPoints:['src/mini-games/gakurogear/onlineEngine.ts'],bundle:true,platform:'node',format:'esm',outfile:'tmp/vr-online-engine.mjs'});
const {createWorld,addPlayer,startWorld,tickWorld,answer,retryCoop,completeQuiz}=await import('../tmp/vr-online-engine.mjs');
await build({entryPoints:['src/mini-games/gakurogear/engine.ts'],bundle:true,platform:'node',format:'esm',outfile:'tmp/vr-online-terrain.mjs'});
const {MISSIONS,WEAPON_UNLOCKS,ITEM_UNLOCKS,floorHeight}=await import('../tmp/vr-online-terrain.mjs');
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
answer(e,'a',0);answer(e,'a',0);answer(e,'a',0);completeQuiz(e,'a');assert(!e.players.a.quiz);assert.equal(e.players.a.energy,100);
const coop=createWorld('coop',1,lesson,300);addPlayer(coop,'a','A');addPlayer(coop,'b','B');startWorld(coop,3);assert.equal(coop.mission.targets.length,2);assert(coop.mission.size>8);
for(let i=0;i<20;i++)tickWorld(coop,{a:neutral,b:neutral},.05);assert.equal(coop.phase,'playing');
coop.players.a.run.status='clear';coop.players.a.run.collected=[true];coop.players.a.answers=[0,0,0];coop.players.a.quiz=false;
// Finished participant collects a team mate's file in their expanded zone.
coop.players.a.run.player={x:2.5,z:-5,angle:0};for(let i=0;i<18;i++)tickWorld(coop,{a:{...neutral,interact:true}},.05);assert(coop.players.b.run.collected[0]);assert(coop.players.a.stats.assists>0);
coop.players.b.run.status='clear';coop.players.b.quiz=false;tickWorld(coop,{},.05);assert.equal(coop.phase,'result');
console.log('PASS seeded field, authoritative hits/3-hit elimination/spectator, energy/reload/3-question refill, expanded cooperative zones and helping.');

const holdCoop=createWorld('coop',7,lesson,300);addPlayer(holdCoop,'a','A');addPlayer(holdCoop,'b','B');startWorld(holdCoop,42);
const guard=holdCoop.guards.guards[0];holdCoop.mission.cameras=[];holdCoop.mission.sensors=[];holdCoop.players.a.run.player={x:guard.x,z:guard.z+.8,angle:Math.PI};
for(let i=0;i<25;i++)tickWorld(holdCoop,{a:{...neutral,hold:true},b:neutral},.05);
assert.equal(holdCoop.players.a.run.holds,1);assert(holdCoop.guards.guards[0].sleep>0);
const failed=createWorld('coop',1,lesson,60);addPlayer(failed,'a','A');startWorld(failed,2);failed.players.a.run.status='caught';failed.players.a.quiz=true;answer(failed,'a',0);answer(failed,'a',0);answer(failed,'a',0);completeQuiz(failed,'a');retryCoop(failed,'a');assert.equal(failed.players.a.run.status,'playing');
failed.time=60;tickWorld(failed,{},.05);assert.equal(failed.phase,'result');assert(failed.players.a.quiz);assert.equal(failed.players.a.run.status,'timeout');
const doors=createWorld('coop',2,lesson,300);addPlayer(doors,'a','A');addPlayer(doors,'b','B');startWorld(doors,5);assert.equal(doors.mission.switches.length,2);assert.equal(doors.mission.obstacles.filter(b=>b.kind==='door').length,3);
doors.players.a.run.player={...doors.mission.switches[0],angle:0};for(let i=0;i<15;i++)tickWorld(doors,{a:{...neutral,interact:true},b:neutral},.05);assert(doors.players.b.run.switches[0]);
console.log('PASS cooperative hold progress, shared sleep and doors, 3-question failure retry and timeout quiz.');

// Use an existing elevated mission that unlocks the equipment under test.
const elevated=MISSIONS.find(m=>m.terrain?.length && m.id>=Math.max(WEAPON_UNLOCKS[4],ITEM_UNLOCKS[1]));
assert(elevated,'An elevated mission with the required equipment must exist');
const expanded=createWorld('coop',elevated.id,lesson,600);addPlayer(expanded,'a','A');addPlayer(expanded,'b','B');assert(startWorld(expanded,7));
assert.equal(expanded.missionId,elevated.id,'Do not silently fall back to the first mission');
assert.equal(expanded.mission.terrain.length,elevated.terrain.length*2);
assert(expanded.mission.size>elevated.size);
expanded.guards.guards=[];expanded.mission.cameras=[];expanded.mission.sensors=[];
for(const [index,player] of Object.values(expanded.players).entries()) {
 const offset=(index-.5)*(2*(elevated.size??8)+1);
 for(const x of [-elevated.size*.9,0,elevated.size*.9]) {
  const local={x,z:0},shifted={x:x+offset,z:0};
  assert.equal(floorHeight(expanded.mission,shifted),floorHeight(elevated,local),'Shifted ramps must preserve their height');
 }
 player.run.player={x:offset,z:0,angle:0};
}
tickWorld(expanded,{},.05);
for(const player of Object.values(expanded.players)) assert.equal(player.run.player.y,floorHeight(elevated,{x:0,z:0}),'Both players stand at the correct elevation');
const equip={...neutral,weapon:4,item:1,useItem:true};tickWorld(expanded,{a:equip},.05);
assert.equal(expanded.players.a.run.weapon,4);assert.equal(expanded.players.a.run.items[1],1);
assert.equal(expanded.players.b.run.items[1],2);assert(expanded.players.a.run.ammo>expanded.mission.ammo);
console.log('PASS enlarged elevated cooperative zones and independent equipment/item inventories.');

const decoyWorld=createWorld('coop',1,lesson,300);addPlayer(decoyWorld,'a','A');startWorld(decoyWorld,1);tickWorld(decoyWorld,{a:{...neutral,item:0,useItem:true}},.05);assert.equal(decoyWorld.players.a.run.decoys,2);assert.equal(decoyWorld.players.a.run.items[0],2);assert(decoyWorld.guards.noise);console.log('PASS cooperative decoy consumed once and attracts shared patrols.');

const defense=createWorld('coop',100,lesson,600);addPlayer(defense,'a','A');addPlayer(defense,'b','B');assert(startWorld(defense,1));
const dm=defense.mission;
assert(dm.defend,'Defense mission must have a defense objective');
assert.equal(dm.targetKinds.length,dm.targets.length);
defense.guards.guards=[];defense.mission.cameras=[];defense.mission.sensors=[];
const spacing=2*(MISSIONS[defense.missionId-1].size??8)+1;
defense.players.a.run.player={x:dm.defend.x-spacing/2,z:dm.defend.z,angle:0};
for(let i=0;i<20;i++)tickWorld(defense,{a:neutral,b:neutral},.05);
assert(defense.players.a.run.defended>0);
assert.equal(defense.players.b.run.defended,0,'An ally outside their defense zone gets no shared progress');
defense.players.b.run.player={x:dm.defend.x+spacing/2,z:dm.defend.z,angle:0};
for(let i=0;i<Math.ceil(dm.defend.seconds/.05)+1;i++)tickWorld(defense,{a:neutral,b:neutral},.05);
assert.equal(defense.players.a.run.defended,dm.defend.seconds,'Progress caps at the mission requirement');
assert.equal(defense.players.b.run.defended,dm.defend.seconds);
console.log('PASS defense objectives progress independently in shifted cooperative zones.');

// Cooperative unlocks follow the mission; battle equipment follows pickups.
const locked=createWorld('coop',1,lesson,300);addPlayer(locked,'a','A');addPlayer(locked,'b','B');startWorld(locked,1);
tickWorld(locked,{a:{...neutral,weapon:5,item:2,useItem:true}},.05);
assert.equal(locked.players.a.run.weapon,0);assert.equal(locked.players.a.run.item,0);assert.equal(locked.players.a.run.items[2],0);
const field=createWorld('royale',1,lesson,300);addPlayer(field,'a','A');addPlayer(field,'b','B');startWorld(field,1);
field.mission.obstacles=[];field.supplies=[];field.players.a.run.player={x:0,z:0,angle:0};field.players.b.run.player={x:8,z:8,angle:0};
tickWorld(field,{a:{...neutral,weapon:5,item:2,useItem:true}},.05);
assert.equal(field.players.a.run.weapon,0,'Unowned battle weapons cannot be equipped');
assert.equal(field.players.a.run.item,2,'An empty item slot can be selected');
assert.equal(field.players.a.run.items[2],0);assert.equal(field.players.a.run.stealth,0,'Empty items cannot be used');
field.supplies=[{id:901,kind:'item',slot:2,x:0,z:0,readyAt:0}];tickWorld(field,{},.05);
assert.equal(field.players.a.run.items[2],1,'Battle pickup grants item stock');
tickWorld(field,{a:{...neutral,useItem:true}},.05);
assert.equal(field.players.a.run.items[2],0);assert(field.players.a.run.stealth>0,'Collected item activates its effect');
console.log('PASS cooperative stage unlocks and authoritative battle weapon ownership/item stock.');
