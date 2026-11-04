import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
await mkdir('tmp/online-active',{recursive:true});
const paths={tennisProtocol:'src/mini-games/tennis/protocol.ts',basketballProtocol:'src/mini-games/basketball/protocol.ts',dodgeballProtocol:'src/mini-games/dodgeball/protocol.ts',golfProtocol:'src/mini-games/gakuro-golf/protocol.ts',tennis:'src/mini-games/tennis/engine.ts',basketball:'src/mini-games/basketball/engine.ts',dodgeball:'src/mini-games/dodgeball/engine.ts',vr:'src/mini-games/gakurogear/onlineEngine.ts',bomb:'src/mini-games/gakurogear/bombEngine.ts',vrRules:'src/mini-games/gakurogear/onlineRules.ts',kart:'src/mini-games/gakuro-kart/engine.ts',golf:'src/mini-games/gakuro-golf/engine.ts',rpg:'src/rpg/engine.ts',rpgSession:'src/rpg/sessionState.ts'};
const modules={};
for(const [key,path]of Object.entries(paths)){await build({entryPoints:[path],outfile:`tmp/online-active/${key}.mjs`,bundle:true,platform:'node',format:'esm',define:{'import.meta.env':'{}'}});modules[key]=await import(`../tmp/online-active/${key}.mjs`);}
const lesson=()=>({title:'Test',questions:Array.from({length:3},(_,i)=>({id:`q${i}`,mode:'ADDITION',question:'1+1',options:['2','3','4','5'],correct:0}))});
function answer(E,w){for(const p of Object.values(w.players))while(p.quiz){const q=p.quiz;assert(E.command(w,p.id,{type:'answer',id:q.id,index:q.index,option:0}));assert(E.command(w,p.id,{type:'continue',id:q.id,index:q.index}));}}
function advance(E,w,n=1){for(let i=0;i<n;i++)E.tick(w,.05,lesson);}
for(const [sport,create,start,max]of [['tennis','createTennis','startTennis',32],['basketball','createBasketball','startBasketball',24],['dodgeball','createDodgeball','startDodgeball',24]]){
 const E=modules[sport];
 for(let count=2;count<=max;count++){
  const w=E[create](41);for(let i=0;i<count;i++)assert(E.addPlayer(w,`p${i}`,`P${i}`));
  assert(E[start](w,lesson));answer(E,w);advance(E,w);
  const humans=w.teams.map(t=>t.members.filter(Boolean).length);assert(Math.max(...humans)-Math.min(...humans)<=1);
  assert(w.matches.every(m=>m.teams[1]!==null&&m.reason!=='bye'));
  for(const id of Object.keys(w.players))assert(E.viewFor(w,id).match.units.some(u=>u.owner===id));
  if(w.matches.length>1){
   const first=w.matches[0],ids=first.units.flatMap(u=>u.owner?[u.owner]:[]);first.phase='finished';first.winner=first.teams[0];advance(E,w);
   for(const id of ids){const m=E.currentMatch(w,id);assert(m.warmup,'Finished entrants remain playable');assert(E.viewFor(w,id).match.units.some(u=>u.owner===id));assert(E.command(w,id,{type:'move',x:.5,y:0}));}
   const official=w.matches.filter(m=>!m.warmup).length;advance(E,w,3);assert.equal(w.matches.filter(m=>!m.warmup).length,official);
  }
  // Every team, including the losing sides, must have a real court in each round.
  while(w.phase==='playing'){
   const round=w.round;for(const m of w.matches.filter(m=>m.round===round&&!m.warmup)){m.phase='finished';m.winner=m.teams[0];}
   advance(E,w,63);
   if(w.phase==='playing'){assert.equal(w.round,round+1);answer(E,w);advance(E,w);for(const id of Object.keys(w.players)){assert(E.currentMatch(w,id)?.units.some(u=>u.owner===id));assert(modules[sport+'Protocol'].validView(E.viewFor(w,id)));}}
  }
  assert.notEqual(w.champion,null);assert(modules[sport+'Protocol'].validView(E.viewFor(w,'p0')),'Final placements must fit the network protocol');
 }
 const w=E[create](5);E.addPlayer(w,'a','A');E.addPlayer(w,'b','B');E[start](w,lesson);answer(E,w);advance(E,w);
 const original=w.matches[0],state=()=>({time:original.time,ball:structuredClone(original.ball),humans:structuredClone(original.units.filter(u=>u.owner==='a'||u.owner==='b'))}),snapshot=state();let calls=0;
 assert(E.addPlayer(w,'late','Late',false,()=>{assert.equal(++calls,1,'Admission consumes one validated lesson');return lesson();}));
 assert(!w.players.late.spectator);assert(E.currentMatch(w,'late'));assert.deepEqual(state(),snapshot,'Late entry must not reset current humans or the live ball');
 const before=JSON.stringify(w);assert(!E.addPlayer(w,'bad','Bad',false,()=>({})));assert.equal(JSON.stringify(w),before,'Invalid lessons cannot partially admit a player');
 E.disconnectPlayer(w,'a');advance(E,w);assert.notEqual(original.reason,'forfeit');
 console.log(`PASS ${sport}: all entrant counts, parallel courts, losers keep playing, warm-ups, late admission and atomic validation.`);
}
const V=modules.vr,B=modules.bomb,R=modules.vrRules,neutral={x:0,z:0,crouch:false,interact:false,decoy:false};
for(const mode of ['coop','royale','bomb']){
 const w=V.createWorld(mode,1,lesson(),300);for(const id of ['a','b','c','d'])assert(V.addPlayer(w,id,id));assert(V.startWorld(w,3));
 const geometry=JSON.stringify(w.mission),positions=Object.fromEntries(Object.values(w.players).map(p=>[p.id,structuredClone(p.run.player)]));
 const offsets=mode==='coop'?Object.fromEntries(Object.keys(w.players).map((id,i)=>[id,R.zoneOffset(w,i)])):null;
 assert(V.addPlayer(w,'late','Late'));assert.equal(JSON.stringify(w.mission),geometry);for(const id of Object.keys(positions))assert.deepEqual(w.players[id].run.player,positions[id]);
 if(mode==='coop'){for(const [i,id]of Object.keys(positions).entries())assert.deepEqual(R.zoneOffset(w,i),offsets[id]);assert(!w.players.late.out);V.tickWorld(w,{late:neutral},.05);}
 else {assert(w.players.late.out);assert.equal(w.players.late.run.status,'playing');}
 if(mode==='bomb'){
  const a=w.bombArena,p=w.players.a,c=B.pointCell(a,p.run.player);p.invulnerable=0;p.hits=2;a.flames=[{...c,until:1,owner:'b'}];V.tickWorld(w,{},.05);
  assert(p.out);assert.equal(p.run.status,'playing');assert.equal(w.phase,'playing');assert(w.bombPractice);
  const main=JSON.stringify(a.cells);assert(B.placeBomb(w,p));assert.equal(a.bombs.length,0);assert.equal(w.bombPractice.bombs.length,1);
  V.tickWorld(w,{a:{...neutral,x:1}},.05);assert.equal(JSON.stringify(a.cells),main);assert(R.requestSupply(w,p.id));assert(p.quiz,'Practice players can still replenish through learning');
 }
 console.log(`PASS VR ${mode}: late join preserves the arena and current players; eliminated entrants remain active.`);
}
// GP and golf already support mid-game entrants; keep those contracts covered.
const K=modules.kart,race=K.createRace();K.addRacer(race,'a','A');K.startRace(race,true);for(let i=0;i<70;i++)K.tick(race,.05);const racer=structuredClone(race.players.a);assert(K.addRacer(race,'late','Late'));assert.deepEqual(race.players.a,racer);
const G=modules.golf,golf=G.createGolf();assert(G.setHoleCount(golf,1));assert(G.addPlayer(golf,'a','A'));assert(G.startGolf(golf,'Test'));assert(G.addPlayer(golf,'late','Late'));assert(!golf.players.late.spectator);
const P=modules.rpg,rpg=P.createWorld(5);assert(P.addPlayer(rpg,'host','Host'));rpg.started=false;const setup={visualTheme:'high-school',mode:'ADDITION',answerMode:'CHOICE',difficultyLevel:2};assert(P.applyAction(rpg,'host',{type:'rpg-setup',setup}));assert.equal(rpg.setup.mode,'ADDITION');assert(P.applyAction(rpg,'host',{type:'rpg-start'}));assert(P.addPlayer(rpg,'late','Late'));assert(rpg.players.late);
console.log('PASS GP, golf and RPG: active-room admission and solo host start.');

const savedPlayer={id:'WARRIOR',gold:14,deck:[{id:'rpg-card',name:'RPG only'}],relics:[],potions:[]};const state=modules.rpgSession.resumeRpgState(savedPlayer);assert.equal(state.isEndless,false);assert.equal(state.challengeMode,undefined);assert.equal(state.floor,0);assert.deepEqual(state.map,[]);state.player.deck[0].name='Changed';assert.equal(savedPlayer.deck[0].name,'RPG only');console.log('PASS RPG resume creates independent state without main-run flags or shared inventory references.');

Object.assign(golf.players.a,{hole:0,strokes:3,scores:[3],phase:'holed'});assert(G.command(golf,'a',{type:'next'}));assert.equal(golf.players.a.phase,'finished');assert(G.viewFor(golf,'a').practicePlayer);assert(modules.golfProtocol.validView(G.viewFor(golf,'a')));assert(G.command(golf,'a',{type:'quiz'},lesson));const practice=golf.practicePlayers.a;for(let i=0;i<3;i++){G.command(golf,'a',{type:'answer',shotId:practice.shotId,index:i,option:0});G.command(golf,'a',{type:'continue',shotId:practice.shotId,index:i});}assert.equal(practice.phase,'aim');assert(G.command(golf,'a',{type:'shot',shotId:practice.shotId,club:'driver',angle:0,power:.5,impact:0}));G.tick(golf,.05);assert(practice.flightTime>0);assert.deepEqual(golf.players.a.scores,[3]);assert.equal(golf.players.a.totalCorrect,0);Object.assign(golf.players.late,{phase:'holed',scores:[4],strokes:4});G.command(golf,'late',{type:'next'});assert.equal(golf.phase,'result');assert(!G.viewFor(golf,'a').practicePlayer);assert.deepEqual(G.viewFor(golf,'a').players.find(p=>p.id==='a').scores,[3]);console.log('PASS golf: early finishers can quiz and play practice shots without changing official scores; result still completes.');

for(const [sport,create,start]of [['tennis','createTennis','startTennis'],['basketball','createBasketball','startBasketball'],['dodgeball','createDodgeball','startDodgeball']]){
 const E=modules[sport],w=E[create](9);for(let i=0;i<E.MAX_MEMBERS;i++)assert(E.addPlayer(w,'seat'+i,'P'+i,i>=E.MAX_PLAYERS));assert(E[start](w,lesson));E.disconnectPlayer(w,'seat0');
 const snapshot=JSON.stringify(w);assert(!E.addPlayer(w,'bad','Bad',false,()=>({})));assert.equal(JSON.stringify(w),snapshot);
 assert(E.addPlayer(w,'replacement','Replacement',false,lesson));assert.equal(Object.keys(w.players).length,E.MAX_MEMBERS);assert(!w.players.replacement.spectator);assert(E.currentMatch(w,'replacement'));assert(modules[sport+'Protocol'].validView(E.viewFor(w,'replacement')));
}
const fullGolf=G.createGolf();for(let i=0;i<40;i++)assert(G.addPlayer(fullGolf,'s'+i,'P'+i));G.startGolf(fullGolf,'Test');G.disconnectPlayer(fullGolf,'s0');assert(G.addPlayer(fullGolf,'new','New'));assert.equal(Object.keys(fullGolf.players).length,40);
const fullVr=V.createWorld('bomb',1,lesson());for(let i=0;i<40;i++)assert(V.addPlayer(fullVr,'s'+i,'P'+i));V.startWorld(fullVr,2);fullVr.players.s1.run.holdProgress=.7;assert(!V.addPlayer(fullVr,'overflow','Overflow'));assert.equal(fullVr.players.s1.run.holdProgress,.7);fullVr.players.s0.connected=false;assert(V.addPlayer(fullVr,'new','New'));assert(fullVr.players.new.out);assert.equal(Object.keys(fullVr.players).length,40);
console.log('PASS: departed seats can be reused at room capacity; invalid or full-room joins do not mutate live play.');

for(const [sport,create]of [['tennis','createTennis'],['basketball','createBasketball'],['dodgeball','createDodgeball']]){const E=modules[sport],w=E[create](1);for(let i=0;i<E.MAX_PLAYERS;i++)assert(E.addPlayer(w,'p'+i,'P'+i));assert(!E.addPlayer(w,'overflow','Overflow'),'A full field must not silently admit an idle spectator');assert(E.addPlayer(w,'observer','Observer',true));}
console.log('PASS: participation overflow is rejected instead of automatically putting players into spectating.');
