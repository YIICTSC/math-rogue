import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},
  server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try {
  const E=await server.ssrLoadModule('/src/rpg/engine.ts');
  const V=await server.ssrLoadModule('/src/rpg/voxel.ts');
  const C=await server.ssrLoadModule('/src/rpg/subsurface.ts');
  const S=await server.ssrLoadModule('/src/rpg/worldSave.ts');
  let now=1791150000000;
  const w=E.createWorld(57,undefined,0,now);
  E.addPlayer(w,'a','Surveyor');
  E.addPlayer(w,'b','Friend');
  const p=w.players.a,q=w.players.b;
  for (const seed of [0,32,57,190,4096,0xffffffff]) {
    const world=E.createWorld(seed);
    assert.equal(world.caverns.length,8,`All chambers are present for seed ${seed}.`);
    assert.deepEqual(world.caverns,C.planCaverns({...world,sites:world.sites.filter(site=>!site.subsurface)}));
  }
  const send=(action,actor=p)=>E.applyAction(w,actor.id,action,now+=300);
  function stand(player,x,z,y) {
    player.x=x;
    player.y=z;
    player.position3D={x:x+.5,z:z+.5,y};
  }
  function descend(cave) {
    const {x,z}=C.cavernEntrance(cave);
    stand(p,x,z,V.terrainHeight(w,x,z));
    assert(send({type:'voxel-cave',command:'enter',id:cave.id}),`Enter ${cave.id}`);
    assert.equal(p.position3D.y,C.CAVERNS[cave.id].floor);
    assert.equal(C.currentCavern(w,p).id,cave.id);
    assert(p.voxelDiscoveries.includes(C.cavernRecord(cave.id)));
  }
  const cave=w.caverns.find(cave=>cave.id==='railvault');
  assert(!send({type:'voxel-cave',command:'enter',id:cave.id}));
  descend(cave);
  const floor=C.CAVERNS.railvault.floor;
  assert(send({type:'voxel-snap',preserveHeight:true}));
  assert.equal(p.position3D.y,floor);
  assert.equal(V.blockAt(w,cave.x,floor,cave.z+3),'rail');
  for (let i=0;i<7;i++) assert(send({type:'move',dx:0,dy:-1}),`Walk through an abandoned rail tunnel ${i}`);
  assert.equal(p.position3D.y,floor);
  assert(!send({type:'voxel-cave',command:'exit',id:cave.id}));
  const initial=p.life.bag.iron_ingot??0;
  assert(send({type:'voxel-cave',command:'recover',id:cave.id}));
  assert.equal(p.life.bag.iron_ingot,initial+7);
  assert(!send({type:'voxel-cave',command:'recover',id:cave.id}));
  for (let i=0;i<7;i++) assert(send({type:'move',dx:0,dy:1}));
  assert(send({type:'voxel-cave',command:'exit',id:cave.id}));
  assert(!C.currentCavern(w,p));

  const lake=w.caverns.find(cave=>cave.id==='mirrorlake');
  descend(lake);
  const level=C.CAVERNS.mirrorlake.floor;
  assert.equal(V.voxelWater(w,lake.x+3,lake.z,level-1).surface,level);
  stand(p,lake.x+3,lake.z,level-1.3);
  assert(send({type:'voxel-snap',preserveHeight:true}));
  assert.equal(p.position3D.y,level-1.3);
  assert(C.currentCavern(w,p));
  const lava=w.caverns.find(cave=>cave.id==='ember'),hot=C.CAVERNS.ember.floor;
  assert.equal(V.blockAt(w,lava.x+3,hot-1,lava.z),'cave-lava');
  assert(!V.bodyClear(w,lava.x+3,lava.z,hot-1));

  const shrine=w.caverns.find(cave=>cave.id==='shrine');
  const guardian=w.sites.find(site=>site.id===C.cavernGuardianId(shrine.id));
  stand(q,guardian.x,guardian.y,V.terrainHeight(w,guardian.x,guardian.y));
  assert(!send({type:'native-enter',siteId:guardian.id},q));
  descend(shrine);
  stand(p,shrine.x,shrine.z-2,C.CAVERNS.shrine.floor);
  assert(!send({type:'voxel-cave',command:'recover',id:shrine.id}));
  assert(send({type:'voxel-cave',command:'challenge',id:shrine.id}));
  const token=p.nativeScene.token;
  assert(send({type:'native-ready',token,maxHp:80}));
  assert(send({type:'native-damage',token,total:80,sequence:1}));
  assert(guardian.cleared&&!w.ended&&!w.won,'An optional cave boss leaves the adventure running.');
  const profile={hp:75,maxHp:75,gold:0,deckSize:0,deck:[],character:'WARRIOR',image:''};
  assert(send({type:'native-finish',token,profile,outcome:'victory'}));
  assert(send({type:'voxel-cave',command:'recover',id:shrine.id}));
  assert.equal(p.life.bag.diamond,2);
  const snapshot=S.makeWorldSave(w,p.id,{currentHp:75,maxHp:75,gold:0,deck:[],relics:[]},now);
  const restored=S.restoreWorldSave(snapshot,now+60000);
  assert.deepEqual(restored.caverns,w.caverns);
  assert(restored.players.a.voxelDiscoveries.includes(C.cacheRecord('shrine')));
  assert(restored.sites.find(site=>site.id===guardian.id).cleared);
  delete snapshot.world.caverns;
  snapshot.world.sites=snapshot.world.sites.filter(site=>!site.subsurface);
  assert.equal(S.restoreWorldSave(snapshot,now+60000).caverns,undefined,'Existing worlds retain their old terrain.');
  console.log('PASS eight underground sites, shared floors and movement, lava collision, optional wardens, rewards and save compatibility.');
} finally { await server.close(); }
