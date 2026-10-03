import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try{
 const {createWorld,addPlayer,applyAction,advanceWorld,WIDTH}=await server.ssrLoadModule('/src/rpg/engine.ts');
 const {energyOf,GATHER_ENERGY_MAX}=await server.ssrLoadModule('/src/rpg/energy.ts');
 const w=createWorld(82,undefined,30,10000);addPlayer(w,'p','P');addPlayer(w,'other','Other');w.started=true;w.deadlineAt=1000000;const p=w.players.p,other=w.players.other;p.x=20;p.y=20;w.tiles[20*WIDTH+21]='forest';w.tiles[20*WIDTH+19]='water';
 assert.equal(energyOf(p.life),6);const gather=20*WIDTH+21,fish=20*WIDTH+19;
 assert.equal(applyAction(w,p.id,{type:'life-work',tile:20*WIDTH},11000),false);assert.equal(energyOf(p.life),6,'Rejected action costs nothing');
 for(let i=0;i<6;i++){const now=12000+i*1000;assert.equal(applyAction(w,p.id,{type:i%2?'life-cast':'life-work',tile:i%2?fish:gather},now),true);assert.equal(energyOf(p.life),5-i);assert.equal(applyAction(w,p.id,{type:'life-work',tile:gather},now+10),false);assert.equal(energyOf(p.life),5-i,'Duplicate start cannot double-charge');applyAction(w,p.id,{type:'life-cancel'},now+20);assert.equal(energyOf(p.life),5-i,'Cancel does not refund');}
 assert.equal(applyAction(w,p.id,{type:'life-work',tile:gather},19000),true);assert.equal(p.life.work,undefined);assert.match(p.message,/エネルギー/);assert.equal(energyOf(p.life),0);advanceWorld(w,25000);assert.equal(energyOf(p.life),0,'Time cannot refill energy');
 applyAction(w,p.id,{type:'native-learning',correctAnswers:0},26000);assert.equal(energyOf(p.life),0,'No new correct answers means no recovery');
 applyAction(w,p.id,{type:'native-learning',correctAnswers:1},27000);assert.equal(energyOf(p.life),2);assert.equal(energyOf(other.life),6,'Player energy is independent');
 applyAction(w,p.id,{type:'native-learning',correctAnswers:1},28000);assert.equal(energyOf(p.life),2,'Replayed count cannot refill twice');assert.equal(applyAction(w,p.id,{type:'native-learning',correctAnswers:0},28010),false);assert.equal(applyAction(w,p.id,{type:'native-learning',correctAnswers:NaN},28020),false);
 p.life.indoors='house';applyAction(w,p.id,{type:'native-learning',correctAnswers:2},29000);assert.equal(energyOf(p.life),4,'Questions may also recover energy indoors');delete p.life.indoors;
 applyAction(w,p.id,{type:'native-learning',correctAnswers:3},30000);assert.equal(energyOf(p.life),GATHER_ENERGY_MAX);applyAction(w,p.id,{type:'native-learning',correctAnswers:4},31000);assert.equal(energyOf(p.life),6,'Recovery is capped');
 applyAction(w,p.id,{type:'life-work',tile:gather},32000);assert.equal(energyOf(p.life),5);applyAction(w,p.id,{type:'life-hit'},32001);assert.equal(energyOf(p.life),5,'Early failure still costs only the start');assert.equal(p.life.work,undefined);
 // Legacy snapshots initialize once; profile sync cannot overwrite an already spent energy value.
 delete p.life.energy;assert.equal(energyOf(p.life),6);applyAction(w,p.id,{type:'life-cast',tile:fish},33000);assert.equal(p.life.energy,5);applyAction(w,p.id,{type:'life-cancel'},33020);const profile={hp:75,maxHp:75,gold:0,character:'WARRIOR',image:'',deckSize:0,deck:[],correctAnswers:4};applyAction(w,p.id,{type:'native-profile',profile},34000);assert.equal(energyOf(p.life),5);applyAction(w,p.id,{type:'native-profile',profile:{...profile,correctAnswers:5}},35000);assert.equal(energyOf(p.life),6);applyAction(w,p.id,{type:'life-cast',tile:fish},36000);applyAction(w,p.id,{type:'life-cancel'},36020);applyAction(w,p.id,{type:'native-profile',profile:{...profile,correctAnswers:5}},37000);assert.equal(energyOf(p.life),5,'Profile replay must not grant energy again');
 console.log('Gather energy passed: all gather types, exhaustion, no time regen, no invalid/duplicate charge, failure/cancel cost, correct-answer recovery, replay rejection, cap, player isolation and legacy snapshots.');
}finally{await server.close();}
