import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error'});
try{
 const {gameCommand,tickGames,gameKind}=await server.ssrLoadModule('/src/mini-games/gakuro-craft/homeGames.ts');
 const {RELICS,expeditionCommand,settleExpedition,canStartExpedition,paddleHalfWidth}=await server.ssrLoadModule('/src/mini-games/gakuro-craft/gameExpedition.ts');
 const {GAME_LABELS,legalReversi}=await server.ssrLoadModule('/src/mini-games/gakuro-craft/partyGames.ts');
 const make=(kind,players=1)=>{const home={tile:0,level:3,furniture:[{slot:0,item:kind}]},w={time:1,paused:false,tiles:[{homeOwner:'p0'}],games:{},players:{}};for(let i=0;i<players;i++){const id='p'+i;w.players[id]={id,name:id,indoors:true,homeTile:0,progress:{home}};gameCommand(w,w.players[id],{type:'game_join',slot:0});}return {w,g:w.games['0:0'],p:w.players.p0};};
 for(const kind of Object.keys(GAME_LABELS).filter(gameKind)){
  const {w,g,p}=make(kind);
  if(kind==='coindozer'){gameCommand(w,p,{type:'game_start',key:g.key});assert.equal(g.dozer.runs[0].maxStages,8);for(let i=0;i<120;i++){w.time+=1/30;tickGames(w,1/30);}assert(g.dozer.runs[0].coins.every(c=>['x','y','h','vx','vy'].every(k=>Number.isFinite(c[k]))));continue;}
  gameCommand(w,p,{type:'game_expedition',key:g.key,enabled:true});assert.equal(g.expedition.floors,8);assert(!canStartExpedition(g));
  assert(!expeditionCommand(w,g,'intruder',{type:'game_route',key:g.key,route:'elite',floor:1}));
  assert(!expeditionCommand(w,g,p.id,{type:'game_route',key:g.key,route:'invalid',floor:1}));
  gameCommand(w,p,{type:'game_route',key:g.key,route:'treasury',floor:1});assert(canStartExpedition(g));
  if(g.rhythm)g.rhythm.ready=[true];gameCommand(w,p,{type:'game_start',key:g.key});assert.equal(g.phase,'playing',kind);
  assert(!expeditionCommand(w,g,p.id,{type:'game_camp',key:g.key,action:'heal',floor:1}));
  if(kind==='reversi'){gameCommand(w,p,{type:'game_board',key:g.key,cell:legalReversi(g.party.board,1)[0],round:g.round});assert(g.party.cpuTurn);w.time+=1;tickGames(w,.1);assert(!g.party.cpuTurn);}
  if(kind==='connectfour'){gameCommand(w,p,{type:'game_board',key:g.key,cell:3,round:g.round});assert(g.party.board.some(Boolean));}
  if(kind==='race'){assert.equal(Object.keys(g.party.raceEffects).length,7);assert.equal(g.party.raceExtra.length,2);}
  if(kind==='arcade'){g.expedition.relics[p.id]=['paddle'];assert(paddleHalfWidth(g,p.id)>.13);}
  for(let floor=1;floor<=8;floor++){
   g.phase='finished';g.winner=[0];g.scores=[1000000];settleExpedition(g);assert.equal(g.expedition.floor,floor);assert(g.expedition.cleared,kind+' clear');const renown=g.expedition.renown[p.id];settleExpedition(g);assert.equal(g.expedition.renown[p.id],renown,'Settlement is idempotent');
   if(floor===8){assert(g.expedition.complete);break;}
   assert(!canStartExpedition(g));const offers=g.expedition.choices[p.id];assert.equal(new Set(offers).size,3);assert(offers.every(id=>{const r=RELICS.find(r=>r.id===id);return !r.kinds||r.kinds.includes(kind);}));
   const gold=g.expedition.gold;assert(expeditionCommand(w,g,p.id,{type:'game_camp',key:g.key,action:'relic',floor}));assert.equal(g.expedition.gold,gold-6);assert(!expeditionCommand(w,g,p.id,{type:'game_camp',key:g.key,action:'relic',floor}),'Camp cannot be replayed');
   const pick={type:'game_relic',key:g.key,relic:offers[0],floor};assert(expeditionCommand(w,g,p.id,pick));assert(!expeditionCommand(w,g,p.id,pick),'Duplicate picks rejected');assert(!expeditionCommand(w,g,p.id,{...pick,floor:floor-1}));
   assert(expeditionCommand(w,g,p.id,{type:'game_route',key:g.key,route:'treasury',floor}));assert(canStartExpedition(g));if(g.rhythm)g.rhythm.ready=[true];gameCommand(w,p,{type:'game_start',key:g.key});assert.equal(g.expedition.floor,floor+1);assert.equal(g.phase,'playing');
  }
 }
 const {w,g,p}=make('memory',2);gameCommand(w,p,{type:'game_expedition',key:g.key,enabled:true});assert(!expeditionCommand(w,g,'p1',{type:'game_route',key:g.key,route:'garden',floor:1}),'Only host chooses shared route');
 const coin=make('coindozer');gameCommand(coin.w,coin.p,{type:'game_start',key:coin.g.key});const run=coin.g.dozer.runs[0];
 for(let stage=1;stage<=8;stage++){run.stageScore=run.goal;run.drops=3;tickGames(coin.w,0);if(stage===8){assert.equal(run.phase,'cleared');break;}gameCommand(coin.w,coin.p,{type:'game_coin_choice',key:coin.g.key,stage,relic:run.choices[0]});if(run.phase==='event')gameCommand(coin.w,coin.p,{type:'game_coin_event',key:coin.g.key,stage,choice:0});if(run.phase==='shop')gameCommand(coin.w,coin.p,{type:'game_coin_buy',key:coin.g.key,stage,relic:'skip'});assert.equal(run.phase,'route');gameCommand(coin.w,coin.p,{type:'game_coin_route',key:coin.g.key,stage,route:'garden'});assert.equal(run.stage,stage+1);}
 console.log('PASS: all 10 games start; eight-floor progression, CPU play, route ownership, stale/duplicate commands, relic filtering, camp economy and coin physics.');
}finally{await server.close();}
