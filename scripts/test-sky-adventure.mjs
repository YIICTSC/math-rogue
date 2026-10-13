import {completeFurnitureQuiz} from './fixtures/furniture-quiz.mjs';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error'});
try{
 const {gameCommand,tickGames}=await server.ssrLoadModule('/src/mini-games/gakuro-craft/homeGames.ts');
 const {platforms,landmarks,STAGE_COUNT}=await server.ssrLoadModule('/src/mini-games/gakuro-craft/sky-adventure/level.ts');
 const home={tile:0,level:3,furniture:[{slot:0,item:'skyadventure'}]},w={time:1,paused:false,tiles:[{homeOwner:'p'}],players:{p:{id:'p',name:'Player',indoors:true,homeTile:0,progress:{home}}},games:{}};
 gameCommand(w,w.players.p,{type:'game_join',slot:0});const g=w.games['0:0'];gameCommand(w,w.players.p,{type:'game_start',key:g.key});assert(g.sky);const r=g.sky.runners.p;
 let jump=0,attack=0;
 const input=(x=0,z=0,dash=false)=>gameCommand(w,w.players.p,{type:'game_sky_input',key:g.key,input:{x,z,dash,stomp:false,jump,attack}});
 const tick=(n=1)=>{for(let i=0;i<n;i++){w.time+=.05;tickGames(w,.05);}};
 const before=JSON.stringify(r.input);input(NaN);assert.equal(JSON.stringify(r.input),before);
 input(99,99);assert(Math.hypot(r.input.x,r.input.z)<=1.0001);input();jump++;input();tick(3);assert(r.y>.5);jump++;input();tick(3);assert.equal(r.jumps,2);jump++;input();tick(2);assert.equal(r.jumps,2);input();tick(30);assert(r.grounded);
 const p={x:r.x,z:r.z};w.paused=true;input(1,0);tick(5);assert.equal(r.x,p.x);assert.equal(r.z,p.z);w.paused=false;input();tick(10);
 function drive(x,y,z){let n=0;while((Math.hypot(r.x-x,r.z-z)>.35||(r.y<y-.25||r.y>y+1.4)||!r.grounded)&&!r.offers.length&&!r.finished&&n++<240){const dx=x-r.x,dz=z-r.z,d=Math.hypot(dx,dz);if(n%8===0)attack++;if(d>1&&((r.grounded&&y>r.y+.2)||(r.vy<2&&r.jumps<2&&!r.grounded)))jump++;input(d>.15?dx/Math.max(1.2,d):0,d>.15?dz/Math.max(1.2,d):0);tick();}input();tick(2);let settle=0;while(!r.grounded&&!r.offers.length&&!r.finished&&settle++<100)tick();assert(Math.hypot(r.x-x,r.z-z)<1.3&&r.y>=y-.6&&r.y<y+1.5,`Cannot reach ${x},${y},${z}: ${JSON.stringify({x:r.x,y:r.y,z:r.z,falls:r.falls,stage:r.stage,hp:r.hp,vy:r.vy,defeated:r.defeated})}`);}
 let batches=0;const signatures=new Set();for(let stage=0;stage<STAGE_COUNT;stage++){
  const initial=platforms(stage,0);signatures.add(JSON.stringify(initial.map(p=>[p.x,p.y,p.z,p.w,p.kind])));drive(0,0,0);for(const x of [-.9,0,.9])drive(x,0,.5);
  for(let k=1;k<=6;k++){if(k===2&&stage%10===8){while(w.time%5>1.5){input();tick();}}const p=platforms(stage,w.time)[k];drive(p.x+(p.spring||p.kind==='fan'?(platforms(stage,w.time)[k+1].x<p.x?1.4:-1.4):0),p.y,p.z);if(k===3){assert.equal(r.checkpoint,1);if(r.coins.length<8)for(const x of [-.9,0,.9])drive(p.x+x,p.y,p.z+.5);}if(k===5&&!r.stars.includes(1)){for(let a=0;a<240&&!r.stars.includes(1);a++){const lm=landmarks(stage,w.time).switch,dx=lm.x-r.x,dz=lm.z-r.z,d=Math.hypot(dx,dz);if(a%8===0)attack++;input(dx/Math.max(1.2,d),dz/Math.max(1.2,d));tick();}}}
  const lm=landmarks(stage,w.time);drive(lm.summit.x,lm.summit.y,lm.summit.z);assert.equal(r.stars.length,3,`stage ${stage}, stars ${r.stars}, coins ${r.coins.length}`);drive(lm.goal.x,lm.goal.y,lm.goal.z);
  if((stage+1)%3===0){assert(w.learning.p.due);assert(completeFurnitureQuiz(gameCommand,w,g,'p'));batches++;}else assert(!w.learning?.p?.due);
  if(stage<STAGE_COUNT-1){assert.equal(r.offers.length,3);const choice=r.offers[0];gameCommand(w,w.players.p,{type:'game_sky_relic',key:g.key,relic:'invalid'});assert.equal(r.stage,stage);gameCommand(w,w.players.p,{type:'game_sky_relic',key:g.key,relic:choice});assert.equal(r.stage,stage+1);assert.equal(r.offers.length,0);}
 }
 tick();assert.equal(r.finished,true);assert.equal(g.phase,'finished');assert.deepEqual(g.winner,[0]);assert.equal(signatures.size,30);assert.equal(batches,10);assert(Number.isFinite(g.scores[0]));
 const home2={tile:0,level:3,furniture:[{slot:0,item:'skyadventure'}]},party={time:0,paused:false,tiles:[{homeOwner:'p0'}],players:{},games:{}};
 for(let i=0;i<5;i++){const id='p'+i;party.players[id]={id,name:id,indoors:true,homeTile:0,progress:{home:home2}};gameCommand(party,party.players[id],{type:'game_join',slot:0});}
 const group=party.games['0:0'];assert.equal(group.players.length,4);gameCommand(party,party.players.p1,{type:'game_start',key:group.key});assert.equal(group.phase,'lobby');gameCommand(party,party.players.p0,{type:'game_start',key:group.key});assert.equal(Object.keys(group.sky.runners).length,4);
 const runner=group.sky.runners.p0;runner.checkpoint=1;runner.x=0;runner.y=3;runner.z=-18;
 for(let n=0;n<75;n++){gameCommand(party,party.players.p0,{type:'game_sky_input',key:group.key,input:{x:1,z:1,dash:true,stomp:false,jump:0,attack:0}});party.time+=.05;tickGames(party,.05);}
 assert(runner.falls>0);assert(runner.hp<5);assert.equal(runner.checkpoint,1);assert.equal(group.sky.runners.p1.x,0);assert.equal(group.sky.runners.p1.z,3);
 const frozen={x:runner.x,z:runner.z};for(let n=0;n<40;n++){party.time+=.05;tickGames(party,.05);}const stopped={x:runner.x,z:runner.z};for(let n=0;n<20;n++){party.time+=.05;tickGames(party,.05);}assert(Math.hypot(runner.x-stopped.x,runner.z-stopped.z)<.05);
 gameCommand(party,party.players.p1,{type:'game_leave',key:group.key});assert(!group.sky.runners.p1);assert.equal(group.phase,'lobby');
 console.log('PASS: authoritative inputs, double jump, pause, 30 traversable stages, ten three-question gates, stars, checkpoint respawn, relic validation, four-player isolation, host control, input expiry and leave cleanup.');
}finally{await server.close();}
