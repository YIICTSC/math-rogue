import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
await mkdir('tmp/gakurogear', { recursive: true });
await build({ entryPoints: ['src/mini-games/gakurogear/engine.ts'], outfile: 'tmp/gakurogear/engine.mjs', bundle: true, platform: 'node', format: 'esm' });
const { MISSIONS, createRun, step, blocked, clearSight, visible, findPath, rank, holdCandidate, objectivesComplete, cameraBlocked, nearbySwitch } = await import('../tmp/gakurogear/engine.mjs');
const input = { x: 0, z: 0, crouch: true, interact: false, decoy: false };
for (const m of MISSIONS) {
  assert(!blocked(m, m.spawn)); assert(!blocked(m, m.exit));
  for (const goal of [...m.targets, m.exit]) assert(findPath(m, m.spawn, goal).length > 0, `Mission ${m.id} unreachable objective`);
  // Traverse the whole map through the actual collision/movement system.
  const quiet = { ...m, routes: [], cameras: [], limit: 9999, requiredHolds: 0, requiredShots: 0 }, s = createRun(quiet);
  s.player = { ...m.exit, angle: 0 }; step(quiet, s, input, .05); assert.equal(s.status, 'playing');
  s.player = { ...m.spawn, angle: 0 };
  for (const goal of [...m.targets, m.exit]) {
    const path = findPath(m, s.player, goal);
    for (const point of path) {
      for (let i = 0; Math.hypot(s.player.x - point.x, s.player.z - point.z) > .06 && i < 100; i++) {
        step(quiet, s, { ...input, x: (point.x - s.player.x) * 8, z: (point.z - s.player.z) * 8 }, .04);
      }
      assert(s.status === 'clear' || Math.hypot(s.player.x - point.x, s.player.z - point.z) < .08, `Mission ${m.id}: path blocked`);
    }
    for (let i = 0; i < 20; i++) step(quiet, s, { ...input, interact: true }, .05);
  }
  assert.equal(s.status, 'clear');
  const timeout = createRun(m); timeout.time = m.limit; step(m, timeout, input, .01); assert.equal(timeout.status, 'timeout');
}
const m = MISSIONS[0], s = createRun(m);
s.player = { x: 0, z: 2.5, angle: 0 };
for (let i = 0; i < 80; i++) step(m, s, { ...input, crouch: false }, .05);
assert.equal(s.status, 'caught');
const wall = { ...m, obstacles: [{ x: 0, z: 0, w: 2, d: 1, h: 1, kind: 'desk' }] };
assert(clearSight(wall, { x: 0, z: -3 }, { x: 0, z: 3 }, false));
assert(!clearSight(wall, { x: 0, z: -3 }, { x: 0, z: 3 }, true));
assert(!visible(m, { x: 0, z: 0 }, 0, { x: 0, z: -2 }, false));
const decoy = createRun(m); step(m, decoy, { ...input, decoy: true }, .05); assert.equal(decoy.decoys, 2); assert(decoy.noise);
step(m, decoy, { ...input, decoy: true }, .05); assert.equal(decoy.decoys, 2);
const recovery = createRun(m); recovery.detection = 50; step(m, recovery, input, .05); assert(recovery.detection < 50);
assert.equal(rank(m, createRun(m)), 'S');
console.log('PASS: fifty traversable missions, collection/extraction, collisions, crouch cover, rear visibility, detection, recovery, timeouts, decoy cooldown, ranks.');

assert.equal(MISSIONS.length, 50);
for (let tier = 0; tier < 5; tier++) assert.equal(MISSIONS.filter(m => m.difficulty === tier).length, 10);
const practice = { ...MISSIONS[6], obstacles: [], cameras: [], routes: [[{x:0,z:0},{x:0,z:4}]], spawn:{x:0,z:-.8}, requiredHolds:1, requiredShots:1 };
const held = createRun(practice); assert.equal(holdCandidate(practice, held), 0);
for (let i=0;i<19;i++) step(practice, held, {...input, hold:true}, .05);
assert(held.guards[0].sleep > 20); assert.equal(held.holds, 1); assert.equal(held.detection, 0);
held.player = {x:7,z:7,angle:0};
for(let i=0;i<460;i++) step(practice,held,input,.05);
assert.equal(held.guards[0].sleep,0); assert(held.guards[0].z>0);
const front=createRun(practice); front.player.z=.8;assert.equal(holdCandidate(practice,front),-1);
const interrupted=createRun(practice);step(practice,interrupted,{...input,hold:true},.05);step(practice,interrupted,input,.05);assert.equal(interrupted.holdProgress,0);
const shot=createRun(practice);shot.player={x:0,z:-4,angle:0};step(practice,shot,{...input,shoot:true},.05);assert.equal(shot.shots,1);assert(shot.guards[0].sleep>0);assert.equal(shot.ammo,practice.ammo-1);
step(practice,shot,{...input,shoot:true},.05);assert.equal(shot.ammo,practice.ammo-1);
const wallShot=createRun(practice);wallShot.player={x:0,z:-4,angle:0};step({...practice,obstacles:[{x:0,z:-2,w:2,d:1,h:1,kind:'desk'}]},wallShot,{...input,shoot:true},.05);assert.equal(wallShot.shots,0);
const miss=createRun(practice);miss.player.angle=Math.PI;step(practice,miss,{...input,shoot:true},.05);assert.equal(miss.shots,0);assert.equal(miss.ammo,practice.ammo-1);
shot.collected=shot.collected.map(()=>true);assert(!objectivesComplete(practice,shot));shot.holds=1;assert(objectivesComplete(practice,shot));
console.log('PASS: five difficulty bands, rear-only hold, interrupt, timed recovery, bubble aim/collision/ammo/cooldown and extra extraction requirements.');

const gate = createRun(practice); gate.collected.fill(true); gate.player = {...practice.exit, angle:0}; step(practice,gate,input,.05); assert.equal(gate.status,'playing');
gate.holds=1;gate.shots=1;step(practice,gate,input,.05);assert.equal(gate.status,'clear');
const empty=createRun(practice);empty.ammo=0;step(practice,empty,{...input,shoot:true},.05);assert.equal(empty.bubble,null);assert.equal(empty.shots,0);
const blockedHold=createRun({...practice,obstacles:[{x:0,z:-.4,w:1,d:.1,h:2,kind:'wall'}]});assert.equal(holdCandidate({...practice,obstacles:[{x:0,z:-.4,w:1,d:.1,h:2,kind:'wall'}]},blockedHold),-1);
console.log('PASS: extraction requires technique objectives; empty gun and through-wall holds are blocked.');

const crawlMission = {...MISSIONS[0], routes:[], cameras:[], sensors:[], switches:[], obstacles:[{x:0,z:0,w:3,d:1.2,h:2.5,clearance:.95,kind:'crawl'}], spawn:{x:0,z:2}};
const crawler=createRun(crawlMission);
for(let i=0;i<30;i++)step(crawlMission,crawler,{...input,crouch:false,z:-1},.05);
assert(crawler.player.z>.85,'standing player must not enter');
for(let i=0;i<10;i++)step(crawlMission,crawler,{...input,z:-1},.05);
assert(crawler.player.z<.4);
step(crawlMission,crawler,{...input,crouch:false},.05);assert(crawler.crouch,'cannot stand up inside');
assert(!cameraBlocked(crawlMission,crawler,{x:0,z:0},.62));assert(cameraBlocked(crawlMission,crawler,{x:0,z:0},1.38));
for(let i=0;i<40;i++)step(crawlMission,crawler,{...input,crouch:false,z:-1},.05);
assert(crawler.player.z<-1);assert(!crawler.crouch);
const doorMission={...crawlMission,spawn:{x:0,z:1.4},switches:[{x:0,z:1.4}],obstacles:[{x:0,z:0,w:3,d:.3,h:2.5,kind:'door',switchId:0}]};
const doorRun=createRun(doorMission);assert(blocked(doorMission,{x:0,z:0},.27,true,doorRun));assert.equal(nearbySwitch(doorMission,doorRun),0);
assert(!clearSight(doorMission,{x:0,z:2},{x:0,z:-2},false,doorRun));
for(let i=0;i<14;i++)step(doorMission,doorRun,{...input,interact:true},.05);
assert(doorRun.switches[0]);assert(!blocked(doorMission,{x:0,z:0},.27,false,doorRun));assert(clearSight(doorMission,{x:0,z:2},{x:0,z:-2},false,doorRun));
const sensorMission={...crawlMission,spawn:{x:0,z:0},obstacles:[],sensors:[{x:0,z:0,w:3,d:.22,period:5}]};
const sensorRun=createRun(sensorMission);step(sensorMission,sensorRun,{...input,crouch:false},.05);assert(sensorRun.detection>0);
const safeSensor=createRun(sensorMission);step(sensorMission,safeSensor,input,.05);assert.equal(safeSensor.detection,0);
const offSensor=createRun(sensorMission);offSensor.time=3.5;step(sensorMission,offSensor,{...input,crouch:false},.05);assert.equal(offSensor.detection,0);
const facingRun=createRun(crawlMission);step(crawlMission,facingRun,{...input,x:1,facing:Math.PI},.05);assert.equal(facingRun.player.angle,Math.PI);
console.log('PASS: standing/crouching clearance, forced crouch and recovery, camera clearance, switch doors and sight, light sensor cycles, independent facing.');
