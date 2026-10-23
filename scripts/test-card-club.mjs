import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server=await createServer({configFile:'./vite.config.ts',server:{middlewareMode:true},appType:'custom'});
try{
 const {CLUB_GAMES,REFERENCE_GAMES}=await server.ssrLoadModule('/src/mini-games/card-club/catalog.ts');
 const {createClubGame,legalActions,applyAction,viewFor,cpuAction}=await server.ssrLoadModule('/src/mini-games/card-club/engine.ts');
 const {ClubSession,CARD_CLUB_HEROES}=await server.ssrLoadModule('/src/mini-games/card-club/session.ts');
 const inputs=n=>Array.from({length:n},(_,i)=>({id:`p${i}`,name:`Player ${i}`,hero:CARD_CLUB_HEROES[i].id,cpu:false}));
 assert.equal(REFERENCE_GAMES.length,467);
 assert.equal(new Set(REFERENCE_GAMES.map(g=>g.id)).size,467);
 let matches=0,moves=0;
 const verifyCards=s=>{
   const cards=[...s.stock,...s.discard,...s.table,...s.trick.map(t=>t.card),...s.players.flatMap(p=>[...p.hand,...p.taken])];
   const expected=s.game==='oldmaid'?51:s.game==='daihinmin'?53:['scopa','scopone'].includes(s.game)?40:52;
   assert.equal(cards.length,expected,`${s.game}: conserved card count`);assert.equal(new Set(cards).size,expected,`${s.game}: no duplicated cards`);
 };
 for(const d of CLUB_GAMES)for(const n of [...new Set([d.players[0],d.players.at(-1)])])for(const seed of [1,15,77]){
   const s=createClubGame(d.id,inputs(n),seed);
   for(let move=0;move<20000&&s.phase!=='result';move++){
     verifyCards(s);const v=viewFor(s,s.turn),a=cpuAction(v);assert(a,`${d.id}: no action at ${s.phase}`);assert.equal(v.seed,0,'Shuffle seed is private');if(s.phase!=='round'&&s.phase!=='result')assert.deepEqual(v.whistHonors,[0,0],'Original-hand honours stay private');
     for(let other=0;other<n;other++)if(other!==v.self&&s.phase!=='result'&&s.phase!=='round')assert(v.players[other].hand.length<=(s.game==='blackjack'&&other===s.dealer?1:0),`${d.id}: opponent hand exposed`);
     const before=JSON.stringify(s);assert.equal(applyAction(s,(s.turn+1)%n,a),false,'Out-of-turn input rejected');assert.equal(JSON.stringify(s),before,'Rejected command cannot mutate');
     assert(applyAction(s,s.turn,a),`${d.id}: CPU generated illegal action`);moves++;
   }
   assert.equal(s.phase,'result',`${d.id}: match did not finish (${s.round}, ${s.revision})`);assert(s.winners.length,`${d.id}: winners required`);verifyCards(s);matches++;
 }
 const w=createClubGame('whist',inputs(4),7);w.phase='play';w.turn=1;w.trick=[{player:0,card:1}];w.players[1].hand=[2,14,40];assert.deepEqual(legalActions(w).map(a=>a.cards[0]),[2],'Must follow suit');
 const o=createClubGame('oldmaid',inputs(3),5);assert(!o.players.flatMap(p=>p.hand).includes(11),'Exactly one queen removed');
 const capture=createClubGame('scopa',inputs(2),3);capture.turn=0;capture.players[0].hand=[11];capture.table=[24,2,5];assert.deepEqual(legalActions(capture),[{type:'play',cards:[11,24]}],'An equal-rank capture takes priority over a sum');
 const ladder=createClubGame('daihinmin',inputs(3),2);ladder.turn=0;ladder.players[0].hand=[2,15,28,52,3];ladder.ladder.count=0;const revolution=legalActions(ladder).find(a=>a.revolution&&a.cards.length===4);assert(revolution,'Joker can complete a four-card revolution');assert(applyAction(ladder,0,revolution));assert(ladder.ladder.reversed,'Revolution reverses rank order');
 const f=createClubGame('fantan',inputs(3),1);f.turn=0;f.table=[];f.players[0].hand=[6,2];assert.deepEqual(legalActions(f),[{type:'play',cards:[6]}],'Fan Tan starts on seven and cannot pass if playable');
 const d=createClubGame('doubt',inputs(3),5);d.turn=0;d.players[0].hand=[0,1,2];d.table=[];d.claim=1;assert(applyAction(d,0,{type:'play',cards:[1,2]}));const hidden=viewFor(d,1);assert(hidden.table.every(c=>c===-1));assert(!('cards' in hidden.pending));assert(applyAction(d,1,{type:'challenge'}));assert(d.players[0].hand.includes(1)&&d.players[0].hand.includes(2),'Caught bluff takes pile');
 const packets=[];const room=new ClubSession('p0','012345',(id,p)=>packets.push({id,p}));assert(room.join(inputs(2)[0]));assert(room.join(inputs(2)[1]));assert(room.configure('gofish',3));assert(room.start(123));const t=room.state.turn,a=legalActions(room.state)[0];assert.equal(room.command('p0',a,room.state.revision),false,'Identity selects player, not claimed seat');assert.equal(room.command('p1',a,-1),false,'Stale revision rejected');room.leave('p1');assert.equal(room.state.players[1].cpu,true,'Disconnected guest is replaced by CPU');
 room.finish();assert(packets.slice(-2).every(x=>x.p.phase==='game'&&x.p.view.phase==='result'),'Host ending sends result to every player');
 console.log(JSON.stringify({matches,moves,catalog:REFERENCE_GAMES.length,implemented:CLUB_GAMES.length,hiddenHands:true,invalidInputs:true,disconnectCPU:true}));
}finally{await server.close();}
