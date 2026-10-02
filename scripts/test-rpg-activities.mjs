import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ optimizeDeps: { noDiscovery: true, entries: [] }, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { createWorld, addPlayer, removePlayer, applyAction, advanceWorld } = await server.ssrLoadModule('/src/rpg/engine.ts');
  const base = { name:'Test', description:'Test', cost:1, rarity:'COMMON', type:'ATTACK', damage:6 };
  const now = Date.now();
  const make = (count=2) => {
    const w=createWorld(42,undefined,30,now); w.activities.nextEventAt=w.deadlineAt;
    for(let i=0;i<count;i++) {
      const id=String(i);addPlayer(w,id,id);
      applyAction(w,id,{type:'native-profile',profile:{hp:40,maxHp:80,gold:100,deckSize:6,character:'WARRIOR',image:'',deck:Array.from({length:6},(_,j)=>({...base,id:`${id}-${j}`}))}},now);
    }
    return w;
  };
  const send=(w,id,a)=>applyAction(w,id,a,now);
  const ack=(w,id)=>send(w,id,{type:'native-profile',profile:{...w.players[id].profile,mutationRevision:w.players[id].mutationRevision||0}});
  const near=(w,id,kind)=>{const s=w.sites.find(s=>s.kind===kind);Object.assign(w.players[id],{x:s.x,y:s.y});return s;};
  const w=make();
  send(w,'0',{type:'trade-request',target:'1'});
  let t=w.activities.trades[0];assert(t);
  send(w,'1',{type:'trade-accept',tradeId:t.id});
  assert.equal(send(w,'0',{type:'trade-offer',tradeId:t.id,cards:null}),false);
  send(w,'0',{type:'trade-offer',tradeId:t.id,cards:['0-0']});send(w,'1',{type:'trade-offer',tradeId:t.id,cards:['1-0']});
  send(w,'0',{type:'trade-confirm',tradeId:t.id});assert.equal(w.players['0'].profile.deck[0].id,'0-0');
  send(w,'1',{type:'trade-offer',tradeId:t.id,cards:['1-1']});assert.deepEqual(t.confirmed,[]);
  send(w,'0',{type:'trade-confirm',tradeId:t.id});send(w,'1',{type:'trade-confirm',tradeId:t.id});
  assert.equal(w.activities.trades.length,0);assert.equal(w.players['0'].profile.deck.length,6);
  assert(!w.players['0'].profile.deck.some(c=>c.id==='0-0'));assert.equal(w.players['0'].mutations.length,1);
  assert.equal(send(w,'1',{type:'trade-confirm',tradeId:t.id}),false);
  assert.equal(send(w,'0',{type:'native-profile',profile:{...w.players['0'].profile,mutationRevision:0}}),false);
  ack(w,'0');ack(w,'1');assert.equal(w.players['0'].mutations.length,0);
  send(w,'0',{type:'trade-request',target:'1'});advanceWorld(w,now+120001);assert.equal(w.activities.trades.length,0);
  send(w,'0',{type:'trade-request',target:'1'});removePlayer(w,'1');assert.equal(w.activities.trades.length,0);

  const arcade=make(1),town=near(arcade,'0','town');
  send(arcade,'0',{type:'arcade-play',siteId:town.id,game:'FLIP',choice:0});
  const pending=arcade.players['0'].arcadePending;assert(pending);assert.equal(arcade.players['0'].gold,90);
  send(arcade,'0',{type:'arcade-play',siteId:town.id,game:'FLIP',choice:0});assert.equal(arcade.players['0'].gold,90);
  ack(arcade,'0');send(arcade,'0',{type:'arcade-finish',token:pending.token,correctCount:3});
  assert.equal(arcade.players['0'].gold,pending.roll%3===0?120:100);
  const settled=arcade.players['0'].gold;assert.equal(send(arcade,'0',{type:'arcade-finish',token:pending.token,correctCount:3}),false);assert.equal(arcade.players['0'].gold,settled);

  const dungeon=make(5),site=dungeon.sites.find(s=>s.kind==='dungeon');
  for(let i=0;i<5;i++){near(dungeon,String(i),'dungeon');send(dungeon,String(i),{type:'dungeon-join',siteId:site.id});}
  const d=dungeon.activities.dungeons[0];assert.equal(d.members.length,4);assert.equal(dungeon.players['4'].dungeonId,undefined);
  send(dungeon,'0',{type:'dungeon-start',dungeonId:d.id});assert.equal(d.status,'lobby');
  for(const id of d.members)send(dungeon,id,{type:'dungeon-ready',dungeonId:d.id});
  send(dungeon,'1',{type:'dungeon-start',dungeonId:d.id});assert.equal(d.status,'lobby');
  send(dungeon,'0',{type:'dungeon-start',dungeonId:d.id});assert.equal(d.status,'active');
  const hit={type:'dungeon-damage',dungeonId:d.id,target:'1',actionId:'one',damage:12};
  assert.equal(send(dungeon,'1',hit),false);send(dungeon,'0',hit);assert.equal(dungeon.players['1'].totalDamage,12);
  assert.equal(send(dungeon,'0',hit),false);assert.equal(dungeon.players['1'].totalDamage,12);
  send(dungeon,'1',{type:'dungeon-complete',dungeonId:d.id});assert.equal(d.status,'active');
  send(dungeon,'0',{type:'dungeon-complete',dungeonId:d.id});assert.equal(d.status,'complete');
  for(const id of d.members){assert.equal(dungeon.players[id].dungeonId,undefined);assert.equal(dungeon.players[id].gold,160);assert.equal(dungeon.players[id].completedBattles,3);}
  const broken=make(),bs=near(broken,'0','dungeon');near(broken,'1','dungeon');
  for(const id of ['0','1'])send(broken,id,{type:'dungeon-join',siteId:bs.id});
  const bd=broken.activities.dungeons[0];for(const id of bd.members)send(broken,id,{type:'dungeon-ready',dungeonId:bd.id});send(broken,'0',{type:'dungeon-start',dungeonId:bd.id});
  removePlayer(broken,'1');assert.equal(bd.status,'aborted');assert.equal(broken.players['0'].dungeonId,undefined);

  const secret=make(1),ruins=near(secret,'0','secret');send(secret,'0',{type:'secret-search',siteId:ruins.id});assert.equal(secret.players['0'].gold,100);
  for(const f of secret.sites.filter(s=>s.kind==='fragment')){Object.assign(secret.players['0'],{x:f.x,y:f.y});send(secret,'0',{type:'secret-search',siteId:f.id});ack(secret,'0');}
  assert.equal(secret.activities.secretsFound.length,3);near(secret,'0','secret');send(secret,'0',{type:'secret-search',siteId:ruins.id});assert.equal(secret.players['0'].gold,170);ack(secret,'0');
  send(secret,'0',{type:'secret-search',siteId:ruins.id});assert.equal(secret.players['0'].gold,170);
  const shared=make(1);shared.activities.nextEventAt=0;shared.seed=0;advanceWorld(shared,now);assert.equal(shared.activities.event.kind,'ANSWERS');
  send(shared,'0',{type:'native-learning',correctAnswers:8});advanceWorld(shared,now+1);assert(shared.activities.event.completed);assert.equal(shared.players['0'].hp,60);assert.equal(shared.players['0'].gold,135);
  ack(shared,'0');advanceWorld(shared,now+60002);assert.equal(shared.activities.event.kind,'SEALS');
  for(const s of shared.sites.filter(s=>s.kind==='seal')){Object.assign(shared.players['0'],{x:s.x,y:s.y});send(shared,'0',{type:'secret-search',siteId:s.id});}
  advanceWorld(shared,now+60003);assert(shared.activities.bossWeakened);
  const { RpgRoom } = await server.ssrLoadModule('/src/rpg/network.ts');
  const { p2pService } = await server.ssrLoadModule('/src/services/p2pService.ts');
  const room=new RpgRoom(()=>{},()=>{});
  room.host=true;room.selfId='0';room.world=make(5);
  const rw=room.world,rs=rw.sites.find(s=>s.kind==='dungeon');
  for(const id of ['0','1','2','3']){near(rw,id,'dungeon');send(rw,id,{type:'dungeon-join',siteId:rs.id});}
  const rd=rw.activities.dungeons[0];for(const id of rd.members)send(rw,id,{type:'dungeon-ready',dungeonId:rd.id});send(rw,'0',{type:'dungeon-start',dungeonId:rd.id});
  const routed=[];room.onDungeonEvent=(event,from)=>routed.push({to:'0',event,from});
  for(const id of ['1','2','3','4'])room.connections.set(id,{send:event=>routed.push({to:id,...event}),close:()=>{}});
  const attack={type:'COOP_BATTLE_PLAY_CARD',cardId:'one'};
  assert.equal(room.relayDungeon('1',attack,'2'),true);assert.deepEqual(routed.map(r=>r.to),['0']);assert.equal(routed[0].from,'1');
  routed.length=0;assert.equal(room.relayDungeon('4',attack),false);
  assert.equal(room.relayDungeon('1',{type:'COOP_STATE_SYNC',state:{}}),false);
  room.sendDungeonEvent({type:'COOP_BATTLE_STATE',state:{}});assert.deepEqual(routed.map(r=>r.to),['1','2','3']);
  // The dungeon leader may be a guest of the world owner.
  routed.length=0;rd.leader='1';
  assert(room.relayDungeon('1',{type:'COOP_PARTICIPANTS',participants:[],decisionOwnerIndex:0}));
  assert.deepEqual(routed.map(r=>r.to),['0','2','3']);
  routed.length=0;assert(room.sendDungeonEvent(attack));assert.deepEqual(routed.map(r=>r.to),['1']);
  const messages=[];p2pService.setRoomTransport({id:'1',peers:()=>['0','2','3'],send:(event,target)=>{messages.push({event,target});return true;}});
  assert.equal(p2pService.getMyId(),'1');assert.deepEqual(p2pService.getConnectedPeerIds(),['0','2','3']);
  assert(p2pService.send(attack));assert(p2pService.sendTo('0',attack));assert.equal(messages[1].target,'0');
  p2pService.setRoomTransport(null);room.close();
  for(let seed=0;seed<50;seed++){const map=createWorld(seed);assert.equal(new Set(map.sites.map(s=>`${s.x},${s.y}`)).size,map.sites.length);}
  console.log('RPG activities passed: atomic trade/replay/expiry, arcade charge/prize, dungeon party limits/damage/dropout, secrets and shared events.');
} finally {await server.close();}
