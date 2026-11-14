import assert from 'node:assert/strict';import {build} from 'esbuild';
const r=await build({stdin:{contents:"export * from './src/mini-games/card-club/engine';export * from './src/mini-games/card-club/catalog';export * from './src/mini-games/card-club/newRequestedGames';export * from './src/mini-games/card-club/cassino';export * from './src/components/school-dungeon/dojo';export * from './src/components/school-dungeon/dungeons1/weaponArea';export * from './src/mini-games/academy-sports/core';export * from './src/mini-games/academy-sports/soccer';",resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm'});const E=await import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));
const inputs=n=>Array.from({length:n},(_,i)=>({id:'p'+i,name:'Player '+i,hero:'high-school-warrior',cpu:true}));
for(const game of ['yaniv','mitch','royalcassino','pokerbull','speculation'])for(const n of E.definition(game).players)for(const seed of [3,17]){
 const s=E.createClubGame(game,inputs(n),seed);let turns=0;
 while(s.phase!=='result'&&turns++<12000){const v=E.viewFor(s,s.turn),a=E.cpuAction(v);assert(a,'no action '+game+' '+JSON.stringify({step:s.extra.step,phase:s.phase,turn:s.turn,hand:s.players[s.turn].hand}));assert(E.applyAction(s,s.turn,a),'apply '+game);const physical=[...s.stock,...s.discard,...s.table,...s.trick.map(t=>t.card),...s.players.flatMap(p=>[...p.hand,...p.taken]),...(s.extra.classic?.rows.flat()||[])];assert.equal(new Set(physical).size,physical.length,'No duplicated physical card '+game);}
 assert.equal(s.phase,'result',game+' terminates '+n+' '+seed+' '+s.extra.step);console.log('PASS',game,n,seed,turns);
}
assert(E.yanivDiscard([0,1,2]));assert(E.yanivDiscard([5,18]));assert(!E.yanivDiscard([0,2]));assert(E.yanivDiscard([0,2,52]));
assert(E.bullClaimHolds([0,13],{type:1,rank:14}));assert(!E.bullClaimHolds([0,13],{type:1,rank:13}));assert(E.bullClaimHolds([0,1,2,3,4],{type:6,rank:5,suit:0}));
const royal=E.createClubGame('royalcassino',inputs(2),3);royal.players[royal.turn].hand=[0,6];royal.table=[7,4,13];royal.extra.classic.rows=[];assert(E.casinoCaptureValid(royal,{type:'play',cards:[0,7,4,13]}),'Ace takes 8+5+1');
const map=Array.from({length:17},()=>Array(17).fill('FLOOR')),origin={x:8,y:8},dir={x:1,y:0};const kinds=['fist','sword','greatsword','rapier','axe','spear','staff','hammer','bow','whip','chakram'];const footprints=kinds.map(k=>JSON.stringify(E.weaponArea(k,origin,dir,map).map(p=>p.x+','+p.y).sort()));assert.equal(new Set(footprints).size,11);map[8][9]='WALL';assert.equal(E.weaponArea('bow',origin,dir,map).length,0);
assert.equal(E.defaultConfig('soccer').minutes,3);assert.equal(E.normalizeConfig({minutes:5},'soccer').minutes,5);

for(const direction of [{x:0,y:1},{x:0,y:-1},{x:1,y:0},{x:-1,y:0},{x:1,y:1},{x:1,y:-1},{x:-1,y:1},{x:-1,y:-1}]){
 map[8][9]='FLOOR';const shapes=kinds.map(kind=>{const cells=E.weaponArea(kind,origin,direction,map);assert.equal(new Set(cells.map(c=>c.x+','+c.y)).size,cells.length);assert(cells.every(c=>c.x!==origin.x||c.y!==origin.y));return JSON.stringify(cells.map(c=>c.x+','+c.y).sort());});assert.equal(new Set(shapes).size,11,'All eight directions retain eleven distinct shapes');
}
map[8][9]='FLOOR';const foes=[{x:9,y:8,hp:10,enemyType:'SHOPKEEPER'},{x:10,y:8,hp:10,enemyType:'SLIME'}];assert.equal(E.weaponTargets('bow',origin,dir,map,foes).length,0,'Bow never shoots through a shopkeeper');map[8][9]='WALL';assert.equal(E.weaponArea('fist',origin,{x:1,y:1},map).length,0,'Diagonal corner blocks attack');
for(const minutes of [1,3,5]){const match=E.createSoccer({...E.defaultConfig('soccer'),minutes});const input={x:0,z:0,aimX:0,aimY:0,held:false};match.phase='play';match.stage='open';match.halfTime=minutes*30-.01;E.stepSoccer(match,input,.02);assert.equal(match.phase,'interval');assert.equal(match.half,2);match.phase='play';match.halfTime=minutes*30-.01;E.stepSoccer(match,input,.02);assert.equal(match.phase,'finished');}
console.log('PASS distinct weapon ranges, occlusion, royal ace sums, exact bluff claims and soccer durations');
for(const n of [2,3,4,5,6,7,8]){
 const s=E.createClubGame('trumpcrew',inputs(n),11);let stages=0;
 while(s.phase!=='result'&&stages++<27){
  const projection=structuredClone(s);projection.extra.step='crewPlay';projection.turn=(s.dealer+1)%n;projection.players.forEach(p=>p.bid=0);
  while(projection.phase!=='round'&&projection.phase!=='result')assert(E.applyAction(projection,projection.turn,E.legalActions(projection)[0]));
  const wins=projection.players.map(p=>p.tricks);assert(E.applyAction(s,s.turn,{type:'name',value:1}));
  for(let i=0;i<n;i++)assert(E.applyAction(s,s.turn,{type:'bid',value:wins[s.turn]}));
  assert.equal(s.extra.classic.contract,0,'All stage chips are allocated');
  while(s.phase!=='round'&&s.phase!=='result')assert(E.applyAction(s,s.turn,E.legalActions(s)[0]));
  if(s.phase==='round')assert(E.applyAction(s,s.turn,{type:'next'}));
 }
 assert.equal(s.phase,'result');assert.equal(s.winners.length,n);assert.equal(s.players[0].score,Math.floor(52/n));console.log('PASS trumpcrew all stages with exact bids,',n,'players');
}
