import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({optimizeDeps:{noDiscovery:true},server:{middlewareMode:true},appType:'custom'});
try{
 const load=name=>server.ssrLoadModule(`/src/mini-games/card-club/${name}.ts`);
 const {createClubGame,legalActions,applyAction,viewFor,cpuAction}=await load('engine');
 const {ginHand,ginDefense}=await load('gin'),{durakBeats}=await load('durak');
 const {golfScore,swimScore}=await load('classicLayouts'),{classicSuit,classicWinner}=await load('classicTricks');
 const {cribHand,cribPeg}=await load('cribbage'),{casinoPartition,casinoCaptureValid,casinoBuildValid}=await load('cassino');
 const {pontoonRules}=await load('pontoon');
 const {ClubSession}=await load('session');
 const players=n=>Array.from({length:n},(_,i)=>({id:`p${i}`,name:`P${i}`,hero:'high-school-warrior',cpu:false}));
 const make=(game,n=2,seed=42)=>createClubGame(game,players(n),seed);
 const act=(s,a)=>assert(applyAction(s,s.turn,a),`${s.game} ${s.extra.step}: ${JSON.stringify(a)}`);
 const ids=as=>as.map(a=>a.cards?.[0]);
 let checks=0;
 const check=(label,fn)=>{fn();checks++;};
 check('Gin optimal overlapping melds and defender chained layoffs',()=>{
  assert.equal(ginHand([0,1,2,3,4,17,30,7,20,33]).points,0);
  assert.equal(ginDefense([0,1,5,18,31,9,22,35,12,25],[[2,3,4]]),20);
 });
 check('Gin initial offer, forced draw and no immediate return of upcard',()=>{
  const s=make('ginrummy');const first=s.turn;act(s,{type:'pass'});act(s,{type:'pass'});assert.equal(s.turn,first);assert.deepEqual(legalActions(s),[{type:'draw'}]);
  const t=make('ginrummy'),top=t.extra.indicator;act(t,{type:'draw',target:1});assert(!legalActions(t).some(a=>a.cards?.[0]===top));
 });
 check('Gin tied deadwood undercuts and scores 25',()=>{
  const s=make('ginrummy');s.turn=0;s.extra.step='ginDiscard';s.extra.classic.drawnFromDiscard=false;
  s.players[0].hand=[0,1,2,13,14,15,26,27,28,6,12];s.players[1].hand=[3,4,5,16,17,18,29,30,31,45];
  act(s,{type:'knock',cards:[12]});assert.equal(s.players[1].score,25);assert.equal(s.extra.classic.nextDealer,0);
 });
 check('Durak effective suit and rank, take and defender-last refill',()=>{
  assert(durakBeats(0,12,0));assert(!durakBeats(12,0,0));assert(durakBeats(5,18,0));assert(!durakBeats(18,5,0));
  const s=make('durak2',3);s.turn=0;s.extra.step='durakAttack';Object.assign(s.extra.classic,{attacker:0,defender:1,first:0,limit:6});s.players[0].hand=[5,6];s.players[1].hand=[18];s.players[2].hand=[31];s.stock=[50,49,48,47,46,45,44,43,42,41,40,39];
  act(s,{type:'play',cards:[5]});act(s,{type:'take'});assert.equal(s.turn,2);assert(s.players[1].hand.includes(5));assert(s.players[0].hand.includes(39));assert(!s.players[1].hand.includes(39));
 });
 check('Transfer Durak requires capacity and no previous defense',()=>{
  const s=make('perevodnoy',3);s.turn=1;s.extra.step='durakDefend';Object.assign(s.extra.classic,{attacker:0,defender:1,first:0,rows:[[5],[],[]]});s.players[1].hand=[18];s.players[2].hand=[31];assert(!legalActions(s).some(a=>a.type==='transfer'));
  s.players[2].hand=[31,32];assert(legalActions(s).some(a=>a.type==='transfer'));act(s,{type:'transfer',cards:[18]});assert.equal(s.turn,2);assert.equal(s.extra.classic.rows[0].length,2);
 });
 check('Golf scoring, initial hidden cards, swap reveal and nine holes',()=>{
  assert.equal(golfScore([12,1,9,25,14,22]),0); // All three vertical ranks match.
  assert.equal(golfScore([0,1,12,2,3,4]),11);
  const s=make('golf');assert(viewFor(s,0).extra.classic.rows.flat().every(c=>c===-1));for(let i=0;i<4;i++)act(s,{type:'pick',index:i%2});assert.equal(s.extra.step,'golfDraw');act(s,{type:'draw'});act(s,{type:'swap',index:2});assert(s.extra.classic.shown[1].includes(2));
 });
 check('Schwimmen hand ranking, unseen dealer option and final lap',()=>{
  assert.equal(swimScore([0,13,26]).points,32);assert.equal(swimScore([6,19,32]).points,30.5);assert.equal(swimScore([0,9,10]).points,31);
  const s=make('schwimmen',3);assert(viewFor(s,s.dealer).table.every(c=>c===-1));act(s,{type:'pass'});act(s,{type:'pass'});act(s,{type:'close'});const closer=s.extra.classic.closedBy;assert(closer>=0);act(s,{type:'pass'});assert.equal(s.phase,'play');act(s,{type:'pass'});assert.equal(s.phase,'round');
 });
 check('Euchre left bower follows trump, joker must follow and lone maker omits partner',()=>{
  assert.equal(classicSuit('euchre2',49,0),0);
  const s=make('euchre-uk',4);s.extra.step='play';s.trump=0;s.turn=0;s.trick=[{player:1,card:8}];s.players[0].hand=[49,52,21];assert.deepEqual(ids(legalActions(s)),[49,52]);
  const u=make('euchre2',4);const maker=u.turn,suit=u.extra.classic.indicatorSuit;act(u,{type:'order',suit,alone:true});assert(u.players[(maker+2)%4].out);act(u,{type:'pass'});assert(!u.players[u.turn].out);
  assert.equal(classicWinner('euchre-uk',[{player:0,card:10},{player:1,card:52}],0),1);
 });
 check('British blind dealer hand and candidate are confidential',()=>{
  let s;for(let seed=1;seed<1000;seed++){s=make('euchre-uk',4,seed);if(s.extra.step==='euchreBlind')break;}assert.equal(s.extra.step,'euchreBlind');assert.equal(viewFor(s,s.dealer).players[s.dealer].hand.length,0);act(s,{type:'trump',suit:2});assert.equal(viewFor(s,s.dealer).players[s.dealer].hand.length,5);
 });
 check('German Whist first thirteen tricks refill but do not score',()=>{
  const s=make('germanwhist');for(let i=0;i<26;i++)act(s,cpuAction(viewFor(s,s.turn)));assert.equal(s.stock.length,0);assert.equal(s.extra.classic.trickNo,13);assert(s.players.every(p=>p.hand.length===13&&p.tricks===0));
 });
 check('Minnesota declarations are secret until checked, stop at first black',()=>{
  const s=make('minnesotawhist',4);for(let i=0;i<4;i++){const a=legalActions(s).find(a=>[0,3].includes(Math.floor(a.cards[0]/13)))||legalActions(s)[0];act(s,a);if(i<3){const v=viewFor(s,0);assert(v.extra.classic.bids.every(c=>c===-1));assert(v.extra.selections.every(cs=>cs.length===0));}}
  assert.equal(s.extra.classic.bids.filter(c=>c>=0).length,1);
 });
 check('Chinese Whist hides lower cards and uncovers only after trick',()=>{
  const s=make('chinesewhist');act(s,{type:'trump',suit:0});assert(viewFor(s,0).extra.classic.hidden.flat().every(c=>c<0));
  const seat=s.turn,card=s.extra.classic.rows[seat][0],lower=s.extra.classic.hidden[seat][0];act(s,{type:'play',cards:[card]});assert.equal(s.extra.classic.rows[seat][0],-1);assert.equal(s.extra.classic.hidden[seat][0],lower);
  for(let i=0;i<3;i++)act(s,cpuAction(viewFor(s,s.turn)));assert.equal(s.extra.classic.rows[seat][0],lower);assert.equal(viewFor(s,0).extra.classic.hidden[seat][0],-2);
 });
 check('Knockout restores eliminated seats between deals',()=>{
  const s=make('knockout',4);s.players[1].lives=0;s.players[1].out=true;s.phase='round';s.turn=0;s.extra.classic.nextDealer=2;act(s,{type:'next'});assert(s.players[1].out);assert.equal(s.players[1].hand.length,0);assert.equal(s.dealer,2);assert.equal(s.players[0].hand.length,6);
 });
 check('Nap bid order and Wellington restriction',()=>{
  const s=make('nap',4);assert(!legalActions(s).some(a=>a.value===6));act(s,{type:'bid',value:5});assert.deepEqual(legalActions(s),[{type:'pass'},{type:'bid',value:6}]);act(s,{type:'bid',value:6});assert.deepEqual(legalActions(s),[{type:'pass'}]);
 });
 check('Napoleon specials retain printed suits, Same Two and first-trick exception',()=>{
  assert.equal(classicSuit('napoleon',49,0),3);
  const trick=[{player:0,card:2},{player:1,card:1},{player:2,card:0}];assert.equal(classicWinner('napoleon',trick,2),1);assert.equal(classicWinner('napoleon',trick,2,true),2);
  assert.equal(classicWinner('napoleon',[{player:0,card:52},{player:1,card:39}],0),1);
 });
 check('Napoleon secret partner and first-trick joker restriction',()=>{
  const s=make('napoleon',5);const caller=s.turn;act(s,{type:'bid',value:10,suit:0});for(let i=0;i<4;i++)act(s,{type:'pass'});const other=(caller+1)%5,partner=s.players[other].hand[0];act(s,{type:'name',cards:[partner]});assert.equal(s.extra.classic.partner,other);assert.equal(viewFor(s,other).extra.classic.partner,-1);
  while(s.extra.step==='napoleonDiscard')act(s,legalActions(s).find(a=>a.cards[0]!==52)||legalActions(s)[0]);assert(!legalActions(s).some(a=>a.cards[0]===52));
 });
 check('Cribbage 29, flush distinction, double runs and pegging suffix',()=>{
  assert.equal(cribHand([4,17,30,49],43).total,29);
  assert.equal(cribHand([0,2,6,8],25).flush,4);assert.equal(cribHand([0,2,6,8],25,true).flush,0);
  assert.equal(cribHand([2,15,3,4],25).runs,6);
  assert.equal(cribPeg([3,1,2],9),3);assert.equal(cribPeg([4,17,30],15),8);assert.equal(cribPeg([9,22,10],30),0);
 });
 check('Cribbage private crib, Go, and 121 immediately ends without next count',()=>{
  const s=make('cribbage');act(s,legalActions(s)[0]);assert(viewFor(s,0).extra.classic.crib.every(c=>c===-1));act(s,legalActions(s)[0]);s.turn=0;s.players[0].hand=[9];s.players[1].hand=[22];s.total=25;assert.deepEqual(legalActions(s),[{type:'pass'}]);
  s.extra.step='cribCount';s.extra.classic.countIndex=0;assert(viewFor(s,0).extra.classic.crib.every(c=>c===-1));s.extra.classic.countIndex=2;assert(viewFor(s,0).extra.classic.crib.every(c=>c>=0));s.extra.step='cribPeg';
  s.total=5;s.table=[4];s.extra.classic.owners=[1];s.players[0].score=120;act(s,{type:'play',cards:[9]});assert.equal(s.phase,'result');assert(s.winners.includes(0));
 });
 check('Cassino disjoint groups, face capture, whole builds and ownership promise',()=>{
  assert(casinoPartition([{value:2,locked:false},{value:3,locked:false},{value:5,locked:false}],5));assert(!casinoPartition([{value:5,locked:true},{value:2,locked:false}],7));assert(!casinoPartition([{value:11,locked:false},{value:1,locked:false}],12));
  const s=make('cassino');s.turn=0;s.players[0].hand=[4,6,19];s.table=[1,2,17];s.extra.classic.rows=[];assert(casinoCaptureValid(s,{type:'play',cards:[4,1,2,17]}));assert(!casinoCaptureValid(s,{type:'play',cards:[4,1,1]}));act(s,{type:'play',cards:[4,1,2,17]});assert.equal(s.players[0].taken.length,4);
  s.turn=0;s.table=[2];s.players[0].hand=[3,6,19];assert(casinoBuildValid(s,{type:'build',cards:[3,2],value:7}));act(s,{type:'build',cards:[3,2],value:7});s.turn=0;assert(!casinoCaptureValid(s,{type:'play',cards:[6,2]}));assert(casinoCaptureValid(s,{type:'play',cards:[6,2,3]}));
  s.players[0].hand=[6,12];assert(!casinoCaptureValid(s,{type:'play',cards:[6]}));assert(!casinoBuildValid(s,{type:'build',cards:[6,2,3],value:7}));
 });
 check('Cassino may build one unit only, including compound face builds',()=>{
  const s=make('cassino');s.turn=0;s.table=[1,2];s.players[0].hand=[3,8];s.extra.classic.rows=[];assert(!casinoBuildValid(s,{type:'build',cards:[3,1,2],value:9}));
  s.table=[10];s.players[0].hand=[23,36];assert(casinoBuildValid(s,{type:'build',cards:[23,10],value:11}));
 });
 check('Pontoon blind dealer, hidden buy, visible twist and minimum stick',()=>{
  const s=make('pontoon',3);assert.equal(viewFor(s,s.dealer).players[s.dealer].hand.length,0);act(s,{type:'bid',value:1});act(s,{type:'bid',value:1});s.turn=1;s.extra.step='pontoonPlay';s.players[1].out=false;s.players[1].hand=[1,14];s.stock=[2,3,4];assert(!legalActions(s).some(a=>a.type==='stand'));act(s,{type:'buy',value:1});assert.equal(s.extra.classic.shown[1].length,0);act(s,{type:'hit'});assert(!legalActions(s).some(a=>a.type==='buy'));assert.equal(s.extra.classic.shown[1].length,1);assert.equal(viewFor(s,2).players[1].hand.length,0);assert.equal(viewFor(s,2).extra.classic.rows[1].length,1);
 });
 check('Pontoon dealer wins ties, zero-sum settlement, ordered stock reuse',()=>{
  const s=make('pontoon');s.turn=0;s.extra.step='pontoonDealer';s.players[0].hand=[9,6];s.players[1].hand=[22,19];s.players[1].stake=3;act(s,{type:'stand'});assert.equal(s.players[1].score,-3);assert.equal(s.players[0].score,3);
  s.extra.classic.deckHistory=[1,2,3,4];s.stock=[5,6];assert.deepEqual(pontoonRules.nextStock(s),[4,3,2,1,5,6]);s.round=1;assert.equal(pontoonRules.nextStock(s),undefined);
 });
 check('Authoritative sessions send filtered Chinese layouts and reject stale custom captures',()=>{
  const packets=[],session=new ClubSession('p0','123456',(id,packet)=>packets.push({id,packet}));players(2).forEach(p=>session.join(p));session.configure('chinesewhist',4);session.start(7);assert(packets.slice(-2).every(({packet})=>packet.view.extra.classic.hidden.flat().every(c=>c<0)));
  session.finish();session.rematch();session.configure('cassino',2);session.start(7);assert(!session.command('p0',{type:'play',cards:[0,1]},-1));
 });
 console.log(JSON.stringify({popularRuleChecks:checks,gin:true,builds:true,cribbage:true,privacy:true}));
}finally{await server.close();}
