import assert from 'node:assert/strict';import {createServer} from 'vite';
const server=await createServer({optimizeDeps:{noDiscovery:true},server:{middlewareMode:true},appType:'custom'});
try{
 const {createClubGame,legalActions,applyAction,viewFor,cpuAction}=await server.ssrLoadModule('/src/mini-games/card-club/engine.ts');
 const {ginHand,ginKnock}=await server.ssrLoadModule('/src/mini-games/card-club/gin.ts');
 const {shuffled,pack}=await server.ssrLoadModule('/src/mini-games/card-club/cards.ts');
 const players=n=>Array.from({length:n},(_,i)=>({id:'p'+i,name:'P'+i,hero:'high-school-warrior',cpu:true}));const make=(id,n=2)=>createClubGame(id,players(n),42);
 const act=(s,a)=>assert(applyAction(s,s.turn,a));
 // Independent subset-cover oracle; does not call meldOptions/isMeld/ginHand.
 function oracle(hand){const n=hand.length,total=hand.reduce((s,c)=>s+Math.min(c%13+1,10),0),melds=[];
  for(let mask=1;mask<1<<n;mask++){const cs=hand.filter((_,i)=>mask>>i&1),rs=cs.map(c=>c%13+1).sort((a,b)=>a-b);if(cs.length<3)continue;
   if(cs.length<=4&&new Set(rs).size===1||cs.every(c=>Math.floor(c/13)===Math.floor(cs[0]/13))&&rs.every((r,i)=>i===0||r===rs[i-1]+1))melds.push(mask);
  }
  const memo=new Map();function best(used){if(memo.has(used))return memo.get(used);let score=hand.reduce((s,c,i)=>s+((used>>i&1)?Math.min(c%13+1,10):0),0);for(const meld of melds)if(!(used&meld))score=Math.max(score,best(used|meld));memo.set(used,score);return score;}return total-best(0);
 }
 const good=[1,2,3,4,5,14,15,16,17,35,51],bad=[1,2,3,4,14,15,16,17,26,35,51];
 assert.equal(oracle(good.filter(c=>c!==51)),10);assert.equal(ginKnock(good,51).points,10);assert.equal(oracle(bad.filter(c=>c!==51)),11);assert.equal(ginKnock(bad,51),null);assert.equal(ginKnock(good,51,51),null);assert.equal(ginKnock(good.slice(1),51),null);
 let compared=0,knocks=0;
 for(let seed=1;seed<=200;seed++){const s=make('ginrummy');s.turn=1;s.extra.step='ginDiscard';s.extra.classic.drawnFromDiscard=false;s.players[1].hand=shuffled(pack(),seed).slice(0,11);
  for(const card of s.players[1].hand){const remaining=s.players[1].hand.filter(c=>c!==card),points=oracle(remaining);assert.equal(ginHand(remaining).points,points);assert.equal(legalActions(s).some(a=>a.type==='knock'&&a.cards[0]===card),points<=10);compared++;}
  const chosen=cpuAction(viewFor(s,1));assert(chosen);if(chosen.type==='knock'){assert(oracle(s.players[1].hand.filter(c=>c!==chosen.cards[0]))<=10);knocks++;}
 }
 let cpuDealKnocks=0,cpuMoves=0;
 for(let seed=1;seed<=100;seed++){const s=createClubGame('ginrummy',players(2),seed);for(let turn=0;turn<150&&s.phase==='play';turn++){const a=cpuAction(viewFor(s,s.turn));assert(a);if(a.type==='knock'){const points=oracle(s.players[s.turn].hand.filter(c=>c!==a.cards[0]));assert(points<=10,`CPU illegal knock seed ${seed}: ${points}`);cpuDealKnocks++;}act(s,a);cpuMoves++;}assert.notEqual(s.phase,'play','CPU deal must finish');}
 for(const hand of [bad,good]){const s=make('ginrummy');s.turn=1;s.extra.step='ginDiscard';s.players[1].hand=hand;s.extra.classic.drawnFromDiscard=false;const before=JSON.stringify(s);if(hand===bad){assert.equal(applyAction(s,1,{type:'knock',cards:[51]}),false);assert.equal(JSON.stringify(s),before);}else{act(s,{type:'knock',cards:[51]});assert.equal(s.extra.classic.notes.find(n=>n.player===1&&n.label==='deadwood').points,10);assert(s.log.some(e=>e.key==='knock'&&e.value===10));}}
 const eight=make('crazyeight');eight.turn=0;eight.activeSuit=0;eight.table=[0];eight.players[0].hand=[1,20];assert(!legalActions(eight).some(a=>a.type==='draw'));let before=JSON.stringify(eight);assert.equal(applyAction(eight,0,{type:'draw'}),false);assert.equal(JSON.stringify(eight),before);eight.players[0].hand=[15];assert.deepEqual(legalActions(eight),[{type:'draw'}]);eight.stock.push(7);act(eight,{type:'draw'});assert(!legalActions(eight).some(a=>a.type==='draw'));
 for(const game of ['66','schnapsen']){const s=make(game);s.turn=0;s.trump=0;s.trick=[];s.players[0].hand=[11,12,24,25,0];s.players[1].hand=[1,14,27,40,2];s.players.forEach(p=>p.tricks=0);s.extra.points=[0,0];
  act(s,{type:'play',cards:[11],double:true});assert.equal(s.extra.points[0],0);assert.equal(s.extra.classic.pendingMarriage[0],40);act(s,{type:'play',cards:[1]});assert.equal(s.extra.classic.pendingMarriage[0],0);assert.equal(s.extra.points[0],43);
  s.players[0].tricks=0;s.extra.points[0]=30;s.turn=0;s.trick=[];s.players[0].hand=[11,12];s.extra.classic.shown[0]=[];act(s,{type:'play',cards:[11],double:true});assert.equal(s.phase,'play','Cannot claim 66 from an unearned marriage');assert.equal(s.extra.points[0],30);
 }
 assert.equal(ginHand([11,12,0]).points,21,'Q-K-A is not a gin run');
 console.log(JSON.stringify({independentGinDiscards:compared,cpuKnocks:knocks,cpuDeals:100,cpuDealKnocks,cpuMoves,boundary10:true,reject11:true,immutableRejection:true,crazyEightForcedPlay:true,pendingMarriage:true}));
}finally{await server.close();}
