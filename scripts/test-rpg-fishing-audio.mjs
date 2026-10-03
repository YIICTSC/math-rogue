import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try{
 const {createWorld,addPlayer,applyAction,advanceWorld,WIDTH}=await server.ssrLoadModule('/src/rpg/engine.ts'),{fishingFeedback}=await server.ssrLoadModule('/src/rpg/fishingAudio.ts');
 const w=createWorld(82,undefined,30,10000);addPlayer(w,'p','P');w.started=true;w.deadlineAt=10000000;const p=w.players.p;p.x=20;p.y=20;const tile=20*WIDTH+19;w.tiles[tile]='water';let now=12000;
 function action(a,at){const before=structuredClone(p.life.work),caughtAt=p.life.lastCatch?.at;applyAction(w,p.id,a,at);now=at;return fishingFeedback(before,p.life.work,p.life.lastCatch?.at!==caughtAt,p.message);}
 const cast=()=>{p.life.energy=6;return action({type:'life-cast',tile},now+1000);},reel=(time)=>action({type:'life-reel',phaseTarget:p.life.work.target},time);
 assert.equal(cast(),'cast');assert.equal(action({type:'life-cast',tile},now+10),undefined,'Rejected cast is silent');assert.equal(reel(p.life.work.target+40),'perfect');const old=p.life.work.target;assert.equal(reel(p.life.work.started+100),'miss','Bad reel uses failure feedback, not the client estimate');assert.equal(action({type:'life-reel',phaseTarget:old},now+10),undefined,'Duplicate packet is silent');assert.equal(reel(p.life.work.target),'perfect');assert.equal(reel(p.life.work.started+100),'escape','Second miss ends the fight');
 assert.equal(cast(),'cast');assert.equal(action({type:'life-cancel'},now+10),undefined,'Cancel is not a failed catch');assert.equal(cast(),'cast');const before=structuredClone(p.life.work);advanceWorld(w,p.life.work.expires+1);assert.equal(fishingFeedback(before,p.life.work,false,p.message),'escape','Timeout has one terminal failure cue');assert.equal(fishingFeedback(undefined,p.life.work,false,p.message),undefined,'Repeated snapshot cannot replay failure');
 console.log('Fishing feedback passed: accepted cast, central success, off-zone miss, stale packet, line snap, cancel and timeout.');
}finally{await server.close();}
