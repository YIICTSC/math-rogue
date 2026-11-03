import assert from 'node:assert/strict';
import {build} from 'esbuild';
const compiled=await build({stdin:{contents:"export * from './src/mini-games/go-home-dash/arcade';export * from './src/mini-games/go-home-dash/rush';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const E=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const player=()=>({x:120,y:340,vy:0,isJumping:false,isFalling:false,jumpCount:0,flying:false,invulFrame:0,dashFrames:0,dashCooldown:0,isPressing:false});
let protection=0,patterns=0;
for(let seed=0;seed<100;seed++){
 const s=E.createArcade(seed);let last=-Infinity;
 for(let i=0;i<160;i++){
  s.entities=[];E.spawnPattern(s,E.PATTERNS[i%16],700+i*1800,i%7===0);patterns++;
  const drops=s.entities.filter(e=>e.kind==='shield'||e.kind==='board');assert(drops.length<=1);
  if(drops.length){assert(drops[0].d-last>=14000,'Protection drops have a minimum separation');assert(drops[0].d>=12000,'No opening protection handout');last=drops[0].d;protection++;}
 }
}
assert(protection>0&&protection/patterns<.06,'Protection must remain available but genuinely rare');
const s=E.createArcade(42),p=player();
assert.equal(E.rushAt(42,0).kind,'run');assert.equal(E.rushAt(42,2200).kind,'loop');assert.equal(E.rushAt(42,8400).kind,'depth');assert.equal(E.rushAt(42,14000).kind,'run');
E.syncRush(s,p,2200-120,340);assert.equal(s.rush.kind,'loop');assert.equal(p.flying,false);
assert(E.rushSpeed(s,4.5,p)>=8.5,'Loops preserve enough momentum to climb');
const bottom=E.loopPose(.16),top=E.loopPose(.5),exit=E.loopPose(.84);assert(Math.abs(bottom.x)<1e-6&&Math.abs(top.x)<1e-6&&Math.abs(exit.x)<1e-6);assert(top.y>11&&bottom.y<1);assert(Math.abs(exit.angle-Math.PI*2)<1e-6,'Lane completes a genuine 360 degree rotation');
E.syncRush(s,p,2200+1850*.5-120,340);s.rush.jumpQueued=true;E.stepRush(s,p,2200+1850*.5-120,340);assert.equal(s.stats.perfects,1);assert(s.stats.coins>=9);s.rush.jumpQueued=true;E.stepRush(s,p,2200+1850*.5-120,340);assert.equal(s.stats.perfects,1,'One apex reward per loop');
E.syncRush(s,p,2200+1850-119,340);assert.equal(s.rush.kind,'run');assert.equal(s.rush.loops,1);E.syncRush(s,p,2200+1850-118,340);assert.equal(s.rush.loops,1,'Section rewards cannot repeat');
for(let seed=0;seed<100;seed++){
 const state=E.createArcade(seed),runner=player();E.syncRush(state,runner,8400-120,340);const waves=new Map();
 for(const e of state.rush.objects.filter(e=>['barrier','lowBar','gap'].includes(e.kind))){const lanes=waves.get(e.at)||new Set();lanes.add(e.lane);waves.set(e.at,lanes);}
 assert.equal(waves.size,5);for(const lanes of waves.values())assert(lanes.size<=2,'Every depth wave has a safe lane');
 assert.equal(E.shiftRushLane(state,-1),true);E.shiftRushLane(state,-1);assert.equal(state.rush.lane,-1);for(let i=0;i<3;i++)E.shiftRushLane(state,1);assert.equal(state.rush.lane,1);
}
function obstacle(kind,lift=0,slide=0){const a=E.createArcade(7),b=player();E.syncRush(a,b,8280,340);b.invulFrame=0;b.y=340-lift;a.slide=slide;a.rush.objects=[{id:1,lane:0,at:8400,kind,taken:false}];return {a,b,hit:E.stepRush(a,b,8280,340)};}
assert(obstacle('barrier').hit);assert(!obstacle('barrier',70).hit);assert(obstacle('lowBar').hit);assert(!obstacle('lowBar',0,20).hit);assert(obstacle('gap').hit);assert(!obstacle('gap',40).hit);
const coin=obstacle('coin');assert.equal(coin.a.stats.coins,1);E.stepRush(coin.a,coin.b,8280,340);assert.equal(coin.a.stats.coins,1,'Pickups only reward once');
const spin=E.createArcade(9),runner=player();spin.rush.chargeHeld=true;for(let i=0;i<40;i++)E.chargeRush(spin,runner);assert(E.releaseRushCharge(spin));assert(spin.rush.turbo>=180);assert(E.rushSpeed(spin,4.5,runner)>4.5);spin.rush.charge=90;assert.equal(E.releaseRushCharge(spin),false,'Spin cooldown prevents spam');
spin.rush.momentum=100;runner.dashFrames=20;assert(E.rushSpeed(spin,9,runner)<=18,'Peak speed remains bounded');
console.log(`PASS 360° lane geometry, apex timing/reward once, safe lanes for 100 seeds, depth jump/slide/gap collisions, steering limits, spin cooldown, momentum cap; ${protection}/${patterns} rare protection drops.`);
