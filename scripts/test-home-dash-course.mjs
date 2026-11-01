import assert from 'node:assert/strict';
import {build} from 'esbuild';
const compiled=await build({stdin:{contents:"export * from './src/mini-games/go-home-dash/obstacles';export * from './src/mini-games/go-home-dash/motion';export * from './src/mini-games/go-home-dash/arcade';export * from './src/mini-games/go-home-dash/routes';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const m=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const widths=new Set(),gaps=new Set();
for(let seed=0;seed<25;seed++)for(let d=0;d<16000;d+=420){
 const shape=m.flightGateShape(seed,d),gate={...shape,type:'FLIGHT_GATE',x:900,y:shape.baseY,vy:0,height:340,speedMult:1};widths.add(shape.width);gaps.add(shape.baseGap);
 for(let frame=0;frame<240;frame+=17){m.advanceObstacleMotion(gate,seed,d,0,frame,()=>.5);const r=m.flightGateRects(gate.x,gate.width,gate.y,gate.gateGap);assert.ok(r[0].height>0&&r[1].height>0);assert.ok(gate.gateGap>=148&&gate.gateGap<=220);assert.ok(Math.abs(r[1].top-r[0].height-gate.gateGap)<1e-8);assert.ok(!m.overlapsSolid(gate.x,gate.y+32,r[0])&&!m.overlapsSolid(gate.x,gate.y+32,r[1]),'The displayed opening must fit the runner');}
}
assert.equal(widths.size,4);assert.equal(gaps.size,5);
const s=m.createArcade(1),p={x:120,y:340,vy:0,isJumping:false,isFalling:false,jumpCount:0,flying:false,invulFrame:0,dashFrames:0,dashCooldown:0,isPressing:false};s.chunk=Infinity;m.dashArcade(s,p);assert(s.dashUsed);m.addEntity(s,'charge',120,30);m.endArcade(s,p,0);assert(s.dashUsed,'A battery must not recharge dash');m.beginArcade(s,5000,false);assert(s.dashUsed);m.beginArcade(s,m.OPENING_DISTANCE-120,false);assert(!s.dashUsed,'A new map must restore dash');
const rail=m.addEntity(s,'rail',-180,100,500,12);m.beginArcade(s,0,false);assert(s.entities.includes(rail),'A wide platform must remain until its trailing edge leaves the screen');m.beginArcade(s,500,false);assert(!s.entities.includes(rail));
for(const [type,count]of [['STEPS',3],['HIGH_STEPS',5],['MOUNTAIN_STEPS',7]]){const rects=m.stairRects({type,x:400,width:480,height:160},340);assert.equal(rects.length,count);for(let i=1;i<count;i++)assert.ok(Math.abs(rects[i-1].left+rects[i-1].width-rects[i].left)<1e-8);}
console.log('PASS 975 flight shapes and animated traversable gaps, four thicknesses, area-only dash, battery, offscreen platform lifetime and connected 3/5/7-step geometry.');
