import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {build} from 'esbuild';
await fs.mkdir('tmp',{recursive:true});await build({stdin:{contents:"export {orderHand} from './src/mini-games/card-club/handOrdering';export {createClubGame,viewFor} from './src/mini-games/card-club/engine';export {CLUB_GAMES} from './src/mini-games/card-club/catalog';",resolveDir:process.cwd()},outfile:'tmp/card-club-hand-order.mjs',bundle:true,platform:'node',format:'esm'});
const {orderHand,createClubGame,viewFor,CLUB_GAMES}=await import('../tmp/card-club-hand-order.mjs');
const view=id=>{const n=CLUB_GAMES.find(g=>g.id===id).defaultPlayers;return viewFor(createClubGame(id,Array.from({length:n},(_,i)=>({id:''+i,name:''+i,hero:'high-school-warrior',cpu:false})),42),0);};
let checks=0;const check=(id,ranks,options={})=>{const v=view(id);v.trump=-1;Object.assign(v,options);const expected=ranks.map(r=>r-1);v.players[0].hand=[...expected].reverse();assert.deepEqual(orderHand(v,'rank'),expected,id);checks++;};
check('whist',[2,3,4,5,6,7,8,9,10,11,12,13,1]);check('daihinmin',[3,4,5,6,7,8,9,10,11,12,13,1,2]);check('daihinmin',[2,1,13,12,11,10,9,8,7,6,5,4,3],{ladder:{reversed:true}});
check('briscola',[2,4,5,6,7,11,12,13,3,1]);check('sueca',[2,3,4,5,6,12,11,13,7,1]);check('ciapano',[4,5,6,7,11,12,13,1,2,3]);check('ecarte',[7,8,9,10,1,11,12,13]);check('66',[9,11,12,13,10,1]);check('schnapsen',[11,12,13,10,1]);check('put',[4,5,6,7,8,9,10,11,12,13,1,2,3]);check('truc',[8,9,10,11,12,13,1,6,7]);check('doubt',[1,2,3,4,5,6,7,8,9,10,11,12,13]);
for(const game of CLUB_GAMES){const v=view(game.id),before=JSON.stringify(v);for(const mode of ['dealt','suit','rank'])assert.deepEqual([...orderHand(v,mode)].sort((a,b)=>a-b),[...v.players[0].hand].sort((a,b)=>a-b),game.id);assert.equal(JSON.stringify(v),before,game.id);}
const v=view('euchre-uk');v.trump=0;v.trick=[];v.players[0].hand=[52,10,49,0,1];assert.deepEqual(orderHand(v,'rank'),[1,0,49,10,52]);
const w=view('whist');w.trump=0;w.players[0].hand=[1,13,0,25];assert.deepEqual(orderHand(w,'rank'),[25,13,1,0]);
const d=view('daihinmin');d.ladder.reversed=true;d.players[0].hand=[52,2,1];assert.deepEqual(orderHand(d,'rank'),[1,2,52]);
console.log(JSON.stringify({games:CLUB_GAMES.length,rankOrders:checks,revolution:true,bowers:true,joker:true,stateUnchanged:true}));
