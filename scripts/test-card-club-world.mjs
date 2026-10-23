import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({optimizeDeps:{noDiscovery:true},server:{middlewareMode:true,hmr:false},appType:'custom'});
try{
 const load=name=>server.ssrLoadModule(`/src/mini-games/card-club/${name}.ts`);
 const {createClubGame,legalActions,applyAction,viewFor,cpuAction}=await load('engine');
 const {marriagePlayable,marriageValue}=await load('marriageGames'),{ecarteStrength}=await load('ecarte');
 const {worldPenalty}=await load('worldPenalties'),{callBridgePlayable}=await load('worldTricks');
 const {empatScore}=await load('empatSatu'),{palacePlayable}=await load('palace');
 const {ClubSession}=await load('session'),{WORLD_IDS}=await load('worldCatalog'),{classicDeck}=await load('classicCommon');
 const {searchGames}=await load('discovery');
 const players=n=>Array.from({length:n},(_,i)=>({id:`p${i}`,name:`P${i}`,hero:'high-school-warrior',cpu:false}));
 const make=(game,n=2,seed=42)=>createClubGame(game,players(n),seed);
 const act=(s,a)=>assert(applyAction(s,s.turn,a),`${s.game}/${s.extra.step} ${JSON.stringify(a)}`);
 const ids=as=>as.map(a=>a.cards?.[0]);let checks=0;
 const check=(name,fn)=>{try{fn();checks++;}catch(e){throw new Error(name,{cause:e});}};
 check('Palace and traditional game aliases remain discoverable',()=>{assert(searchGames('palace','','available').some(g=>g.id==='shithead2'));assert(searchGames('853','','available').some(g=>g.id==='sergent'));assert(searchGames('なかよし村','','available').some(g=>g.id==='blacklady'));});
 check('Distinct short decks, removed low cards retain all penalty cards',()=>{
  assert.equal(classicDeck('66',2).length,24);assert.equal(classicDeck('schnapsen',2).length,20);assert.equal(classicDeck('ecarte',2).length,32);
  for(const [n,count] of [[3,51],[4,52],[5,50],[6,48],[7,49]]){const deck=classicDeck('blackmaria',n);assert.equal(deck.length,count);assert.equal(deck.reduce((sum,c)=>sum+worldPenalty('blackmaria',c),0),43);}
 });
 check('Sixty-Six follows without forced trump; Schnapsen follows, beats and trumps',()=>{
  assert.deepEqual(marriagePlayable('66',[0,12,24],[{card:11}],1,true),[0,12]);
  assert.deepEqual(marriagePlayable('schnapsen',[0,12,24],[{card:11}],1,true),[0,12]); // Ace and five both beat four.
  assert.deepEqual(marriagePlayable('schnapsen',[8,12,24],[{card:11}],1,true),[12]);
  assert.deepEqual(marriagePlayable('schnapsen',[13,26],[{card:11}],1,true),[13]);
  assert.deepEqual(marriagePlayable('66',[13,26],[{card:11}],1,true),[13,26]);
  assert.deepEqual(marriagePlayable('schnapsen',[8,12,24],[{card:11}],1,false),[8,12,24]);assert.equal(marriageValue(0),11);
 });
 check('Marriage declaration reveals just the pair and claims automatically at 66',()=>{
  const s=make('66');s.turn=0;s.trump=0;s.players[0].hand=[11,12,9,8,10,0];s.extra.points=[30,0];
  const a=legalActions(s).find(a=>a.double&&a.cards[0]===11);assert(a);act(s,a);assert.equal(s.phase,'round');assert.equal(s.players[0].score,3);assert.equal(s.players[0].hand.length,6);assert.equal(s.extra.classic.reveals.length,2);
 });
 check('Only Schnapsen can close before winning; closing prevents draws and marriage',()=>{
  const a=make('66'),b=make('schnapsen');assert(!legalActions(a).some(a=>a.type==='close'));assert(legalActions(b).some(a=>a.type==='close'));const count=b.stock.length;act(b,{type:'close'});assert.equal(b.stock.length,count);assert(!legalActions(b).some(a=>a.double||a.type==='swap'||a.type==='close'));
 });
 check('Trump exchange requires a win and physically replaces the indicator',()=>{
  const s=make('66');s.turn=0;s.trump=0;s.players[0].hand=[8,11];s.extra.indicator=0;s.stock=[0,9,12];assert(!legalActions(s).some(a=>a.type==='swap'));s.players[0].tricks=1;act(s,{type:'swap',cards:[8]});assert.deepEqual(s.stock,[8,9,12]);assert(s.players[0].hand.includes(0));assert.equal(s.extra.indicator,8);
 });
 check('Closed hand failure awards opponent game points and ordinary unclaimed 66 carries',()=>{
  const s=make('66');s.turn=0;s.stock=[0,1];s.extra.indicator=0;s.trump=0;s.players[0].hand=[8];s.players[1].hand=[21];s.players[0].tricks=1;s.extra.points=[5,0];act(s,{type:'close'});act(s,{type:'play',cards:[8]});act(s,{type:'play',cards:[21]});assert.equal(s.phase,'round');assert.equal(s.players[1].score,3);
  const t=make('66');t.stock=[];t.extra.indicator=-1;t.turn=0;t.players[0].hand=[8];t.players[1].hand=[21];t.trump=3;t.extra.points=[10,10];act(t,{type:'play',cards:[8]});act(t,{type:'play',cards:[21]});assert.equal(t.players[0].bags,1);assert(t.players.every(p=>p.score===0));
 });
 check('Sixty-Six closing snapshots a trickless opponent; Schnapsen uses final points',()=>{
  for(const game of ['66','schnapsen']){const s=make(game);s.turn=0;s.stock=[0,1];s.extra.indicator=0;s.trump=1;s.players[0].hand=[10];s.players[1].hand=[23];s.players[0].tricks=1;s.extra.points=[5,0];act(s,{type:'close'});act(s,{type:'play',cards:[10]});act(s,{type:'play',cards:[23]});assert.equal(s.players[1].score,game==='66'?3:2);}
 });
 check('Schnapsen cannot announce marriage after stock ends',()=>{
  const s=make('schnapsen');s.turn=0;s.players[0].hand=[11,12];s.stock=[];assert(!legalActions(s).some(a=>a.double));const t=make('66');t.turn=0;t.players[0].hand=[11,12];t.stock=[];assert(legalActions(t).some(a=>a.double));
 });
 check('Écarté exchange negotiation, hidden discards and replenishment order',()=>{
  const s=make('ecarte');const child=1-s.dealer,old=s.players[child].hand.slice(0,2),dealer=s.players[s.dealer].hand[0];act(s,{type:'accept'});act(s,{type:'accept'});act(s,{type:'exchange',cards:old});assert.equal(s.players[child].hand.length,3);assert.equal(viewFor(s,s.dealer).discard,2);act(s,{type:'exchange',cards:[dealer]});assert(s.players.every(p=>p.hand.length===5));assert.equal(s.extra.step,'ecarteOffer');assert.equal(s.extra.classic.contract,1);
 });
 check('Écarté king declaration scores immediately and cannot repeat',()=>{
  const s=make('ecarte');s.turn=1;s.trump=0;s.players[1].hand=[12,11,10,0,9];s.players[1].score=4;act(s,{type:'reveal',cards:[12]});assert.equal(s.phase,'result');assert.deepEqual(s.winners,[1]);assert(ecarteStrength(10)>ecarteStrength(0));assert(ecarteStrength(0)>ecarteStrength(9));
 });
 check('Écarté initial refuser penalty and compulsory winning follow',()=>{
  const s=make('ecarte');s.turn=1;s.dealer=0;act(s,{type:'stand'});assert.equal(s.extra.classic.closedBy,1);s.turn=0;s.extra.step='play';s.trump=2;s.trick=[{player:1,card:0}];s.players[0].hand=[9,10,26];assert.deepEqual(ids(legalActions(s)),[10]);
  s.trick=[];s.turn=0;s.extra.classic.trickNo=4;s.players[0].tricks=2;s.players[1].tricks=2;s.players[0].hand=[12];s.players[1].hand=[8];act(s,{type:'play',cards:[12]});act(s,{type:'play',cards:[8]});assert.equal(s.players[0].score>=2,true);
 });
 check('Hokm first five belong only to Hâkem; declaration completes hands',()=>{
  const s=make('hokm',4),h=s.turn;assert.equal(s.direction,-1);assert.equal(s.players[h].hand.length,5);assert.equal(s.players.filter((p,i)=>i!==h).flatMap(p=>p.hand).length,0);act(s,{type:'trump',suit:2});assert(s.players.every(p=>p.hand.length===13));assert.equal(s.turn,h);assert.equal(s.stock.length,0);
 });
 check('Hokm seven straight wins earn defenders three and rotate dealer',()=>{
  const s=make('hokm',4);act(s,{type:'trump',suit:0});const h=s.extra.classic.caller,def=(h+1)%4;s.extra.step='play';s.turn=def;s.trick=[];s.players.forEach((p,i)=>{p.hand=[13+i];p.tricks=i===def?6:0;});s.players[def].hand=[0];
  const order=Array.from({length:4},(_,k)=>(def-k+4)%4);for(const i of order)act(s,{type:'play',cards:[s.players[i].hand[0]]});assert.equal(s.phase,'round');assert.equal(s.players[def].score,3);assert.equal(s.extra.classic.nextDealer,3);
 });
 check('Call Bridge overtrumps when possible, can discard if unable, does not force overtake on trump lead',()=>{
  const table=[{card:0},{card:44}];assert.deepEqual(callBridgePlayable([42,48,15],table),[48]);assert.deepEqual(callBridgePlayable([42,15],table),[42,15]);assert.deepEqual(callBridgePlayable([42,48,15],[{card:44}]),[42,48]);assert.deepEqual(callBridgePlayable([2,42,48],table),[2]);
 });
 check('Call Bridge bids 2 through 12, scores bid+1 only and high success as 13',()=>{
  const s=make('callbridge',4);assert.equal(legalActions(s)[0].value,2);assert.equal(legalActions(s).at(-1).value,12);for(let i=0;i<4;i++)act(s,{type:'bid',value:2});assert.equal(s.direction,-1);assert.equal(s.extra.step,'play');
  s.turn=0;s.trump=3;s.players.forEach((p,i)=>{p.hand=[i===0?39:13+i];p.tricks=[7,3,4,1][i];p.bid=[8,2,2,2][i];});for(const i of [0,3,2,1])act(s,{type:'play',cards:[s.players[i].hand[0]]});assert.deepEqual(s.players.map(p=>p.score),[13,2,-2,-2]);
 });
 check('Sergeant Major forced returns are strongest in suit and privately routed',()=>{
  const s=make('sergent',3);s.extra.step='sergentExchange';s.turn=0;s.extra.classic.remaining=[0,1,1];s.players[0].hand=[1,14];s.players[1].hand=[0,2,15];act(s,{type:'exchange',cards:[1],target:1});assert(s.players[0].hand.includes(0));assert(!s.players[1].hand.includes(0));assert.equal(viewFor(s,0).extra.classic.notices[0].card,0);assert.equal(viewFor(s,2).extra.classic.notices.length,0);assert.equal(s.extra.step,'sergentTrump');
 });
 check('Sergeant Major only tells the former recipient about a stronger kitty replacement',()=>{
  const s=make('sergent',3);s.extra.step='sergentDiscard';s.turn=0;s.dealer=0;s.trump=0;s.extra.classic.notices=[{to:1,from:0,card:2}];s.stock=[0,14,15,16];s.players[0].hand=[1,3,4,5,6,7,8,9,10,11,12,13,17,18,19,20];act(s,{type:'discard',cards:[1,3,4,5]});assert(viewFor(s,1).extra.classic.notices.some(n=>n.card===0));assert.equal(viewFor(s,2).extra.classic.notices.length,0);assert.equal(viewFor(s,0).extra.classic.notices.length,0);
 });
 check('Sergeant Major next deal queues exchanges from previous surplus and target order',()=>{
  const s=make('sergent',3);s.players.forEach((p,i)=>{p.bags=[2,1,-3][i];p.lives=[3,8,5][i];});s.phase='round';s.turn=0;act(s,{type:'next'});assert.deepEqual(s.extra.classic.remaining,[1,2,1,0,2,2]);assert.equal(s.turn,1);assert(s.players.every(p=>p.hand.length===16));assert.equal(s.stock.length,4);
 });
 check('Black Lady passes two then one, selects secretly and gives kitty to last winner',()=>{
  const s=make('blacklady',4);assert.equal(s.players[0].hand.length,12);assert.equal(viewFor(s,0).extra.board.filter(c=>c>=0).length,2);const before=s.players.map(p=>[...p.hand]),outgoing=[];
  for(let n=0;n<4;n++){const i=s.turn,a=legalActions(s)[0];outgoing[i]=a.cards;act(s,a);if(n<3){assert.deepEqual(s.players.map(p=>p.hand),before);assert(viewFor(s,0).extra.selections.every(cs=>!cs.length));}}
  assert.equal(s.extra.classic.contract,1);for(let i=0;i<4;i++)assert(outgoing[i].every(card=>s.players[(i+3)%4].hand.includes(card)));for(let i=0;i<4;i++)act(s,legalActions(s)[0]);assert.equal(s.extra.step,'play');
  s.turn=0;s.extra.board=[26,50];s.extra.visible=[0];s.players.forEach((p,i)=>p.hand=[i===0?0:13+i]);for(let i=0;i<4;i++)act(s,{type:'play',cards:[s.players[i].hand[0]]});assert.equal(s.extra.board.length,0);assert(s.players[0].taken.includes(50));assert.equal(s.extra.points[0],14);
 });
 check('Black Lady clear pool divides and carries remainder, no moon conversion',()=>{
  const s=make('blacklady',4);s.extra.step='play';s.extra.board=[];s.turn=0;s.players.forEach((p,i)=>{p.hand=[i===0?0:13+i];p.taken=[];});s.players[0].taken=[...Array.from({length:13},(_,i)=>26+i),50];for(let i=0;i<4;i++)act(s,{type:'play',cards:[s.players[i].hand[0]]});assert.equal(s.players[0].score,-26);assert.equal(s.players[1].score,8);assert.equal(s.players[0].bags,2);
 });
 check('Black Maria passes right with all forty-three penalty points retained',()=>{
  const s=make('blackmaria',3),cards=s.players[1].hand.slice(0,3);act(s,{type:'exchange',cards});assert.equal(viewFor(s,2).extra.selections[1].length,0);for(let i=0;i<2;i++)act(s,legalActions(s)[0]);assert(cards.every(c=>s.players[0].hand.includes(c)));assert.equal(worldPenalty('blackmaria',39),7);assert.equal(worldPenalty('blackmaria',51),10);
 });
 check('Cangkul draws until led suit and must play the drawn card',()=>{
  const s=make('cangkul',3);s.turn=1;s.players[1].hand=[14,15];s.stock=[3,27,28];s.trick=[{player:0,card:2}];s.extra.classic.remaining=[1,2];act(s,{type:'draw'});assert.deepEqual(s.trick.at(-1),{player:1,card:3});assert(s.players[1].hand.includes(27)&&s.players[1].hand.includes(28));assert.equal(s.stock.length,0);
 });
 check('Cangkul multiple passers share played cards in order; empty hand wins mid-trick',()=>{
  const s=make('cangkul',5);s.turn=3;s.stock=[];s.trick=[{player:0,card:4},{player:1,card:5},{player:2,card:6}];s.extra.classic.remaining=[3,4];s.players[3].hand=[14];s.players[4].hand=[27];act(s,{type:'pass'});act(s,{type:'pass'});assert(s.players[3].hand.includes(4)&&s.players[3].hand.includes(6));assert(s.players[4].hand.includes(5));
  const t=make('cangkul',3);t.turn=0;t.players[0].hand=[0];t.trick=[];t.extra.classic.remaining=[0,1,2];act(t,{type:'play',cards:[0]});assert.equal(t.phase,'result');assert.deepEqual(t.winners,[0]);
 });
 check('Getaway opens with spade ace and off-suit ends immediately with pickup',()=>{
  const s=make('getaway',4);assert.deepEqual(legalActions(s),[{type:'play',cards:[39]}]);s.extra.classic.trickNo=1;s.turn=0;s.trick=[];s.extra.classic.remaining=[0,1,2,3];s.players[0].hand=[0,1];s.players[1].hand=[15,16];act(s,{type:'play',cards:[0]});act(s,{type:'play',cards:[15]});assert.equal(s.trick.length,0);assert.equal(s.turn,0);assert(s.players[0].hand.includes(15));assert.equal(s.players[2].hand.length,13);
 });
 check('Getaway empty winner draws old discard; two-seat last-card trap loses',()=>{
  const s=make('getaway',3);s.extra.classic.trickNo=1;s.turn=0;s.trick=[];s.extra.classic.remaining=[0,1,2];s.players[0].hand=[0];s.players[1].hand=[1,14];s.players[2].hand=[2,27];s.discard=[12];for(const card of [0,1,2])act(s,{type:'play',cards:[card]});assert(s.players[0].hand.includes(12));assert(!s.players[0].out);
  const t=make('getaway',3);t.extra.classic.trickNo=2;t.players[2].out=true;t.players[2].hand=[];t.turn=0;t.extra.classic.remaining=[0,1];t.trick=[];t.players[0].hand=[0];t.players[1].hand=[14];act(t,{type:'play',cards:[0]});act(t,{type:'play',cards:[14]});assert.equal(t.phase,'result');assert(!t.winners.includes(0));
 });
 check('Palace secret lower cards stay hidden even to their owner, setup swaps physical cards',()=>{
  const s=make('shithead2',4);assert(viewFor(s,0).extra.classic.hidden.flat().every(c=>c===-1));const i=s.turn,card=s.players[i].hand[0],old=s.extra.classic.rows[i][0];act(s,{type:'swap',cards:[card],index:0});assert(s.players[i].hand.includes(old));assert.equal(s.extra.classic.rows[i][0],card);for(let n=0;n<4;n++)act(s,{type:'continue'});assert.equal(s.extra.step,'play');
 });
 check('Palace reset, ten burn, top four burn and refill',()=>{
  assert(palacePlayable(1,0));assert(palacePlayable(9,0));assert(!palacePlayable(2,0));assert(palacePlayable(2,1));
  const s=make('shithead2',3);s.extra.step='play';s.turn=0;s.players[0].hand=[9,2,3];s.table=[0,12];act(s,{type:'play',cards:[9]});assert.equal(s.table.length,0);assert.equal(s.turn,0);assert.equal(s.players[0].hand.length,3);
  s.players[0].hand=[18,4,2];s.table=[5,31,44];s.stock=[];act(s,{type:'play',cards:[18]});assert.equal(s.table.length,0);assert.equal(s.turn,0);
 });
 check('Palace exposed pickup adds chosen card, blind failure takes pile and blocks escape',()=>{
  const s=make('shithead2',3);s.extra.step='play';s.turn=0;s.stock=[];s.players[0].hand=[];s.extra.classic.rows[0]=[2,3,4];s.table=[0];act(s,{type:'take',cards:[3],index:1});assert(s.players[0].hand.includes(0)&&s.players[0].hand.includes(3));assert.equal(s.extra.classic.rows[0].length,2);
  s.turn=0;s.players[0].hand=[];s.extra.classic.rows[0]=[];s.extra.classic.hidden[0]=[2];s.table=[0];assert.deepEqual(legalActions(s),[{type:'pick',index:0}]);act(s,{type:'pick',index:0});assert(!s.players[0].out);assert.deepEqual(s.players[0].hand,[2,0]);
 });
 check('Empat Satu signed suits, worst-card tie break, stop and no discard-return',()=>{
  assert.equal(empatScore([0,9,10,11]).points,41);assert.equal(empatScore([0,1,15,28]).points,7);assert.equal(empatScore([0,1,15,28]).worst,-3);
  const s=make('empatsatu',3);s.turn=0;s.players[0].hand=[0,1,2,3];s.players[1].hand=[13,14,15,16];s.players[2].hand=[26,27,28,29];act(s,{type:'close'});assert.equal(s.phase,'result');assert.deepEqual(s.winners,[0,1,2]);
  const t=make('empatsatu');t.turn=0;t.discard=[12];t.extra.indicator=12;act(t,{type:'draw',target:1});assert(!legalActions(t).some(a=>a.cards[0]===12));
 });
 check('Authority validates private exchange packets and rejects out-of-turn and forged input',()=>{
  const packets=[],session=new ClubSession('p0','123456',(id,p)=>packets.push({id,p}));players(3).forEach(p=>session.join(p));session.configure('sergent',3);session.start(42);const s=session.state;s.extra.step='sergentExchange';s.turn=0;s.extra.classic.remaining=[0,1,1];s.players[0].hand=[1];s.players[1].hand=[0];session.publish();assert(session.command('p0',{type:'exchange',cards:[1],target:1},s.revision));const notices=packets.slice(-3).map(({p})=>p.view.extra.classic.notices.length);assert.deepEqual(notices,[1,0,0]);assert(!session.command('p2',{type:'trump',suit:2},s.revision));assert(!session.command('p0',{type:'trump',suit:8},s.revision));
 });
 console.log(JSON.stringify({newGames:WORLD_IDS.length,worldRuleChecks:checks,privacy:true,forcedExchange:true,palace:true}));
}finally{await server.close();}
