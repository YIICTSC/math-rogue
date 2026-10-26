import assert from 'node:assert/strict';
import {build} from 'esbuild';
const result=await build({stdin:{contents:"export * from './src/mini-games/star-tide/engine';export * from './src/mini-games/star-tide/combat';export * from './src/mini-games/star-tide/visuals';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'node',write:false});
const M=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
let saved='';globalThis.localStorage={getItem:()=>saved,setItem:(_k,v)=>saved=v};
for(const oldHero of ['mio','sena',undefined]){
 const s=M.fresh();delete s.weaponA;s.hero=oldHero;s.ownedTools=[0,5];s.tool=5;s.coins=77;s.chests=['1:2'];saved=JSON.stringify(s);
 const migrated=M.load();assert.equal(migrated.hero,'nagi');assert.equal(migrated.weaponA,0);assert.equal(migrated.tool,5);assert.equal(migrated.coins,77);assert.deepEqual(migrated.chests,['1:2']);
}
for(const value of [-1,1.5,99,'5',null]){saved=JSON.stringify({...M.fresh(),weaponA:value});assert.equal(M.load().weaponA,0);}
function arena(){const w=new M.World(M.fresh());w.s.ownedTools=[0,1,2,3,4,5,6,7];w.map=Array.from({length:14},()=>Array(20).fill(0));w.x=7;w.y=7;w.enemies=[];return w;}
function advance(w,seconds){for(let t=0;t<seconds;t+=.01)w.tick(Math.min(.01,seconds-t),0,0);}
for(const slot of ['a','b'])for(let weapon=0;weapon<8;weapon++){
 const w=arena();assert(w.equip(slot,weapon));assert(w.swing(slot==='b'));assert.equal(w.activeWeapon,weapon);assert.equal(w.combo,0);
 const before=w.attackSerial;for(let i=0;i<20;i++)w.swing(slot==='b');assert.equal(w.attackSerial,before,'Rapid input cannot skip stages');
 advance(w,w.attackDuration+.005);assert.equal(w.combo,1);assert.equal(w.attackSerial,before+1,'One queued strike only');
 w.swing(slot==='b');advance(w,w.attack+.005);assert.equal(w.combo,2);assert.equal(w.activeWeapon,weapon);
 const duration=w.attackDuration;advance(w,duration+.005);assert.equal(w.attack,0,'A combo cannot repeat without another input');
 advance(w,.3);w.stamina=1;w.swing(slot==='b');assert.equal(w.combo,0,'Idle resets the combo');
}
const locked=arena();locked.s.ownedTools=[0];assert(!locked.equip('a',5));assert(!locked.equip('b',1));assert(!locked.equip('a',1.5));
const switched=arena();switched.equip('a',0);switched.equip('b',7);switched.swing();switched.swing(true);advance(switched,.31);assert.equal(switched.activeWeapon,7);assert.equal(switched.combo,0,'Different weapon starts its own chain');
const melee=arena();const target={x:8,y:7,hp:100,max:100,kind:3,cool:100,phase:0};melee.enemies=[target];melee.swing();assert.equal(target.hp,100,'Windup has no early damage');advance(melee,.14);assert.equal(target.hp,98);advance(melee,.10);assert.equal(target.hp,98,'Each swing hits only once');melee.swing();advance(melee,.10);melee.swing();advance(melee,.65);assert(target.hp<=93,'Finisher must deal extra damage');
for(const weapon of [1,2,5]){
 const w=arena();w.equip('a',weapon);w.swing();assert.equal(w.shots.length,0);advance(w,.18);assert.equal(w.shots.length,1,'Ranged attack fires at release');
 w.swing();advance(w,.25);w.swing();advance(w,.65);assert(w.shots.length>=4,'Ranged finisher fires multiple projectiles');
}
const aim=arena();aim.swing();aim.tick(.02,0,-1);assert.equal(aim.dx,1);assert.equal(aim.dy,0,'Facing stays locked through the active attack');
const cancel=arena();cancel.swing();cancel.swing();cancel.roll();assert.equal(cancel.queuedSlot,null);assert.equal(cancel.attack,0);assert.equal(cancel.strikePending,false);advance(cancel,.7);assert.equal(cancel.attackSerial,1);
const hurt=arena();hurt.swing();hurt.swing();hurt.hit();advance(hurt,.6);assert.equal(hurt.attackSerial,1);assert.equal(hurt.attack,0);
const exit=arena();exit.swing();exit.swing();exit.enter();assert.equal(exit.queuedSlot,null);assert.equal(exit.strikePending,false);
const shield=arena();shield.equip('a',6);shield.stamina=.2;assert(!shield.swing());assert.equal(shield.attack,0);shield.stamina=1;shield.swing();assert(shield.stamina<1);
const walk=arena();walk.move(1,0,.1);assert(Math.abs(walk.x-7-M.WALK_SPEED*.1)<1e-9);assert.equal(M.WALK_SPEED,3.8);
const analog=arena();analog.tick(.03,.3,0);assert(Math.abs(analog.walk-.009)<1e-9,'Step clock follows actual travel distance');
const diagonal=arena();diagonal.move(1,1,.1);assert(Math.abs(Math.hypot(diagonal.x-7,diagonal.y-7)-.38)<1e-9);
const puzzle=arena();puzzle.s.chapter=2;puzzle.s.room=14;puzzle.enter();puzzle.circuit=null;puzzle.equip('a',2);puzzle.x=10.5;puzzle.y=6.5;puzzle.swing();assert.equal(puzzle.switches.length,1,'Required tool can activate a chamber from A');
const mirror=arena();mirror.s.room=11;mirror.enter();const m=mirror.beam.mirrors[0],original=m.slash;mirror.x=m.x+.5;mirror.y=m.y+.5;mirror.swing();mirror.swing();advance(mirror,.7);assert.equal(m.slash,!original,'Queued combos cannot toggle an interaction twice');
M.persist(switched.s);assert.equal(M.load().weaponA,0);assert.equal(M.load().tool,7);
console.log('PASS: Nagi-only save migration, both slots/all eight weapons, timed one-hit impacts, buffered three-stage combos, ranged finishers, direction lock, interruptions, faster normalized walking, distance-based footsteps and interactions on A.');
