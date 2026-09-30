import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try {
  const e=await server.ssrLoadModule('/src/mini-games/gakuro-kart/engine.ts');
  const t=await server.ssrLoadModule('/src/mini-games/gakuro-kart/track.ts');
  const n=await server.ssrLoadModule('/src/mini-games/gakuro-kart/protocol.ts');
  const w=e.createRace();e.addRacer(w,'first','First');e.addRacer(w,'last','Last');w.phase='race';w.time=200;
  w.lesson={title:'Lesson',questions:Array.from({length:3},(_,i)=>({id:`q${i}`,mode:'ADDITION',question:'1+1?',options:['1','2','3','4'],correct:1}))};
  const length=t.getTrack(0).length,p=w.players.first,q=w.players.last;
  Object.assign(p,{distance:length*3-.2,speed:58,x:0,quizLap:2,quizAnswers:[1,1,1],quizCorrect:3,quizCorrectTotal:9,quizApplied:true,drifts:5,overtakes:2});
  q.distance=length*2;q.x=8;
  e.tick(w,.05);assert(p.finish);assert.equal(w.phase,'race');assert(p.speed>0);
  const result={finish:p.finish,quizLap:p.quizLap,answers:[...p.quizAnswers],score:p.quizCorrectTotal,drifts:p.drifts,overtakes:p.overtakes},distance=p.distance;
  e.command(w,p.id,{type:'input',steer:.8,brake:true,drift:true});assert.equal(p.steer,.8);assert(p.brake);
  const speed=p.speed;e.tick(w,.05);assert(p.speed<speed);assert(p.distance>distance);
  p.item='nitro';e.command(w,p.id,{type:'item'});assert(p.boost>0);assert.equal(p.item,null);
  // Finished racers must not attack, collide with, or provide a draft to active racers.
  q.distance=p.distance+10;q.slow=0;p.item='pulse';e.command(w,p.id,{type:'item'});assert.equal(q.slow,0);
  q.distance=p.distance-10;q.x=p.x;q.draft=0;e.tick(w,.05);assert.equal(q.draft,0);
  q.distance=length*2;q.speed=0;
  p.distance=length*4+99.9;p.speed=58;p.boost=0;p.slow=0;p.x=0;
  for(let i=0;i<120;i++){e.command(w,p.id,{type:'input',steer:0,brake:false,drift:false});e.tick(w,1/60);}
  assert.equal(w.phase,'race');
  assert(p.distance>length*4+200,'Finished kart must continue moving throughout free run.');
  assert(p.speed>20,'Post-finish quiz straight should remain unrestricted.');
  assert.deepEqual({finish:p.finish,quizLap:p.quizLap,answers:p.quizAnswers,score:p.quizCorrectTotal,drifts:p.drifts,overtakes:p.overtakes},result);
  assert.equal(e.ranking(w)[0].id,p.id);
  const copy=n.acceptRoster(n.roster(w),null),decoded=n.decodeSnapshot(n.encodeSnapshot(w,1),copy,0);
  assert(decoded);assert(Math.abs(decoded.world.players.first.finish-result.finish)<.001);assert(Math.abs(decoded.world.players.first.distance-p.distance)<.01);assert(decoded.world.players.first.speed>20);
  q.distance=length*3-.2;q.speed=58;e.tick(w,.05);assert(q.finish);assert.equal(w.phase,'result');
  assert.equal(p.finish,result.finish);assert.equal(e.ranking(w)[0].id,p.id);
  const stopped=p.distance;e.tick(w,.05);assert.equal(p.distance,stopped);
  console.log('Post-finish steering/braking/boost, uninterrupted speed, frozen official results and learning answers, no interference with active racers, network snapshots, and final result transition passed.');
} finally {await server.close();}
