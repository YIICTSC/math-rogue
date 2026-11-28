import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import { createServer } from 'vite';

const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try {
  const E=await server.ssrLoadModule('/src/rpg/engine.ts');
  const M=await server.ssrLoadModule('/src/rpg/machinery.ts');
  const R=await server.ssrLoadModule('/src/rpg/realms.ts');
  const T=await server.ssrLoadModule('/src/rpg/realmTerrain.ts');
  const V=await server.ssrLoadModule('/src/rpg/voxel.ts');
  const S=await server.ssrLoadModule('/src/rpg/worldSave.ts');
  const D=await server.ssrLoadModule('/src/rpg/worldDelta.ts');
  let now=1791150000000;
  const world=E.createWorld(492,undefined,0,now);
  E.addPlayer(world,'a','Builder');E.addPlayer(world,'b','Visitor');
  const a=world.players.a,b=world.players.b;
  a.profile={hp:72,maxHp:72,gold:50,character:'WARRIOR',image:'',deck:[],deckSize:0};
  const player={id:'WARRIOR',currentHp:72,maxHp:72,gold:50,deck:[],relics:[],rpgMutationRevision:0};
  const send=(actor,action,delay=450)=>E.applyAction(world,actor,action,now+=delay);
  const locate=(actor,x,z,y=0)=>{actor.x=x;actor.y=z;actor.position3D={x:x+.5,y,z:z+.5,surface2D:true,layered2D:true};};
  const gate={x:20,y:0,z:20},lever={x:20,y:0,z:19};
  for(let z=15;z<26;z++)for(let x=15;x<26;x++)world.tiles[z*E.WIDTH+x]='grass';
  world.sites=world.sites.filter(site=>Math.abs(site.x-20)+Math.abs(site.y-20)>9);
  world.voxels={edits:{},revision:1,placedBy:{},legacyFlat:['20,20','20,19','20,21'],terrainVersion:2};
  for(const [position,block] of [[gate,'waygate'],[lever,'crystal_lever']]) {
    const {x,y,z}=position,key=V.voxelKey(x,y,z);
    world.voxels.edits[key]=block;world.voxels.placedBy[key]='a';M.recordMachineEdit(world,x,y,z,null,block);
  }
  locate(a,20,21);locate(b,20,22);
  const tune=value=>({type:'voxel-device',command:'waygate-realm',value,...gate});
  const enter={type:'voxel-dimension',command:'enter',...gate};
  assert(!send('a',tune('__proto__')));
  assert(!send('a',tune('geode')),'Tuning has a material cost.');
  Object.assign(a.life.bag,{crystal_powder:6,lapis:3,obsidian:3,quartz:4,air_draught:1,crystal_lever:3,crystal_lamp:3,wood:3});
  a.life.energy=6;
  assert(!send('b',tune('geode')),'Only the owner can retune a gate.');
  assert(send('a',tune('geode')));
  assert.equal(a.life.bag.crystal_powder,0);
  assert(!send('a',enter),'An unpowered gate stays closed.');

  const {tiles,...initial}=world;
  const writer=new D.WorldDeltaWriter();writer.capture(initial);
  let client=structuredClone(world);
  function sync(){
    const {tiles,...full}=world,packet=JSON.parse(JSON.stringify(writer.capture(full)));
    const applied=D.applyWorldDelta(client,packet);
    assert(applied);assert.deepEqual(applied,JSON.parse(JSON.stringify(full)));
    client={...applied,tiles};return packet;
  }
  assert(send('a',{type:'voxel-device',command:'use',...lever}));
  E.advanceWorld(world,now+=1000);
  assert(send('a',enter));
  assert.equal(a.realm.id,'geode');
  assert.equal(a.x,T.REALM_GATE.x);assert.equal(a.y,T.REALM_GATE.z+1);
  const y=T.realmFloorAnchor('geode'),cell={x:a.x,y,z:a.y+2},key=V.voxelKey(cell.x,y,cell.z);
  assert(sync().realmEdits.geode.layout);
  const view=()=>R.realmView(world,'geode');
  assert.deepEqual(Object.keys(view().players),['a']);
  assert.deepEqual(Object.keys(R.realmView(world).players),['b']);
  locate(b,cell.x,cell.z,V.terrainHeight(world,cell.x,cell.z));
  assert(send('a',{type:'voxel-place',block:'crystal_lever',...cell}),'Same-square player in another dimension cannot block placement.');
  assert.equal(view().voxels.edits[key],'crystal_lever');
  assert.equal(world.voxels.edits[key],undefined);
  assert.equal(sync().realmEdits.geode.changes.edits.set[key],'crystal_lever');
  assert(!send('b',{type:'native-enter',siteId:R.realmSiteId('geode',0)}));
  assert(send('a',{type:'voxel-device',command:'use',...cell}));
  E.advanceWorld(world,now+=300);
  assert.equal(M.machineSignal(view(),cell.x,y,cell.z),15);
  assert.equal(M.machineSignal(world,cell.x,y,cell.z),0);
  assert(send('a',{type:'voxel-snap',preserveHeight:true}));
  assert.equal(a.position3D.y,y);
  const row=T.REALM_ARENA;
  locate(a,row.x,row.z+1,y);
  assert(!send('a',{type:'voxel-dimension',command:'return'}));
  assert(!send('a',{type:'voxel-dimension',command:'reward'}));
  assert(send('a',{type:'native-enter',siteId:R.realmSiteId('geode',0)}));
  const token=a.nativeScene.token;
  assert(send('a',{type:'native-ready',token,maxHp:230}));
  assert(send('a',{type:'native-damage',token,sequence:1,total:230}));
  assert(send('a',{type:'native-finish',token,outcome:'victory',profile:a.profile}));
  assert(!world.ended);
  assert(send('a',{type:'voxel-dimension',command:'reward'}));
  assert(!send('a',{type:'voxel-dimension',command:'reward'}));
  assert.equal(a.life.bag.amethyststone,4);

  const saved=S.makeWorldSave(world,'a',player,now);
  const resumed=S.restoreWorldSave(JSON.parse(JSON.stringify(saved)),now+60000);
  assert.equal(resumed.players.a.realm.id,'geode');
  assert(resumed.realms.geode.sites[0].cleared);
  assert.equal(resumed.realms.geode.voxels.machinery.devices[key].signal,15);
  assert.equal(resumed.voxels.edits[key],undefined);
  locate(a,T.REALM_GATE.x,T.REALM_GATE.z+1,y);
  assert(send('a',{type:'voxel-dimension',command:'return'}));
  assert(!a.realm);
  assert.equal(a.x,20);assert.equal(a.y,21);

  for(const id of ['echo','sky','embers','tidal']){
    assert(send('a',tune(id)));
    assert(send('a',enter));
    const realm=R.realmView(world,id);
    assert.equal(a.position3D.y,T.realmFloorAnchor(id));
    assert.equal(realm.sites[0].dimension,id);
    assert(!realm.voxels.edits[key]);
    assert(V.blockAt(realm,T.REALM_GATE.x,T.realmFloorAnchor(id),T.REALM_GATE.z)==='waygate');
    assert.equal(V.protectedVoxel(realm,T.REALM_GATE.x,T.REALM_GATE.z),true);
    assert(send('a',{type:'voxel-dimension',command:'return'}));
  }
  for(const id of Object.keys(T.REALMS))assert((await stat(`public/sprites/rpg/realms/${id}.webp`)).size>30000);
  assert.equal(Object.keys(world.realms).length,5);
  assert(!world.dimensionId);
  console.log('PASS five powered realms with separate locations, devices and terrain, native guardian battle, one-time rewards, delta sync, saves and return.');
} finally {await server.close();}
