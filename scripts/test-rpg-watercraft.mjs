import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},
  server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try {
  const E=await server.ssrLoadModule('/src/rpg/engine.ts');
  const T=await server.ssrLoadModule('/src/rpg/transport.ts');
  const S=await server.ssrLoadModule('/src/rpg/worldSave.ts');
  let now=1791150000000;
  const world=E.createWorld(57,undefined,0,now);
  E.addPlayer(world,'one','Captain');
  E.addPlayer(world,'two','Passenger');
  const p=world.players.one, guest=world.players.two;
  world.sites=[];
  world.voxels={edits:{},revision:1,terrainVersion:2,legacyFlat:[],placedBy:{}};
  for (let z=27;z<=46;z++) for (let x=24;x<=51;x++) {
    const water=z>=35 && z<=40 && x>=28 && x<=43;
    world.tiles[z*E.WIDTH+x]=water?'water':'grass';
    world.voxels.legacyFlat.push(`${x},${z}`);
    world.voxels.edits[`${x},-1,${z}`]=water?null:'stone';
    for (let y=0;y<=7;y++) world.voxels.edits[`${x},${y},${z}`]=null;
  }
  const placePlayer=(player,x,z,y)=>{
    player.x=x;
    player.y=z;
    player.position3D={x:x+.5,y,z:z+.5,surface2D:true,layered2D:true};
  };
  const send=(actor,action)=>E.applyAction(world,actor.id,action,now+=220);
  const transport=(actor,params)=>send(actor,{type:'voxel-transport',...params});
  placePlayer(p,31,34,0);
  placePlayer(guest,32,34,0);
  p.life.bag.cargo_boat=1;
  p.life.bag.bamboo_raft=1;
  p.life.bag.wood=16;
  assert(transport(p,{command:'launch',item:'cargo_boat'}));
  assert.equal(p.life.bag.cargo_boat,0);
  const [boat]=T.watercraft(world);
  assert(boat && boat.z>=35 && boat.z<=40);
  const command=(command,fields={})=>({command,boat:boat.id,...fields});
  const wood={item:'wood',amount:8,direction:'load'};
  assert(!transport(guest,command('cargo',wood)));
  assert(transport(p,command('cargo',wood)));
  assert.equal(boat.cargo.wood,8);
  assert(!transport(p,command('stow')),'A loaded boat cannot be converted to an inventory item.');
  assert(send(p,{type:'voxel-admin',command:'option',option:'ownerCarts',enabled:true}));
  assert(!transport(guest,command('board')));
  assert(transport(p,command('board')));
  assert(!transport(guest,command('board')));
  assert.equal(T.boardedBoat(world,p.id)?.id,boat.id);
  assert(!send(p,{type:'move',dx:2,dy:0}));
  assert(send(p,{type:'move',dx:1,dy:0}));
  assert(p.position3D.surface2D);
  assert(send(p,{type:'voxel-move',dx:.3,dy:0}));
  assert(!p.position3D.surface2D);
  assert(send(p,{type:'voxel-snap',preserveHeight:true}));
  assert.equal(p.position3D.x,boat.x);
  assert.equal(p.position3D.z,boat.z);
  assert.equal(p.position3D.y,boat.y+.18);
  for (let i=0;i<25;i++) send(p,{type:'move',dx:1,dy:0});
  assert(boat.x<44,'The vessel stops at the shoreline.');
  assert(!send(p,{type:'voxel-jump'}),'Jumping aboard must not move the rider off the boat.');
  assert(transport(p,command('dock')));
  assert.notEqual(world.tiles[p.y*E.WIDTH+p.x],'water','A nearby dry floor takes priority over swimming.');
  assert(transport(p,command('cargo',{...wood,direction:'unload'})));
  assert.equal(p.life.bag.wood,16);

  const profile={currentHp:75,maxHp:75,gold:0,deck:[],relics:[]};
  p.profile={hp:75,maxHp:75,gold:0,deck:[]};
  assert(transport(p,command('board')));
  const saved=S.makeWorldSave(world,p.id,profile,now);
  const restored=S.restoreWorldSave(saved,now+60000);
  const renewed=T.boardedBoat(restored,p.id);
  assert.equal(renewed.id,boat.id);
  assert.equal(renewed.x,boat.x);
  assert.equal(restored.players.one.position3D.x,boat.x);

  assert(transport(p,command('dock')));
  assert(transport(p,command('stow')));
  assert.equal(p.life.bag.cargo_boat,1);
  assert(!transport(p,command('stow')));

  placePlayer(p,27,29,6);
  world.voxels.edits['27,5,29']='stone';
  world.voxels.revision++;
  p.life.bag.glider_wing=1;
  p.life.bag.glider_boost=2;
  assert(!transport(p,{command:'glide',heading:4}));
  assert(transport(p,{command:'glide',heading:1}));
  const estimate=T.glideEstimate(world,p);
  assert(estimate.distance>10 && estimate.point.x>p.position3D.x);
  assert(send(p,{type:'move',dx:1,dy:0}));
  assert(transport(p,{command:'boost'}));
  assert(!transport(p,{command:'boost'}));
  assert.equal(p.life.bag.glider_boost,1);
  const flyingSave=S.makeWorldSave(world,p.id,profile,now);
  const flying=S.restoreWorldSave(flyingSave,now+60000);
  assert.equal(flying.players.one.position3D.y,p.position3D.y);
  assert.equal(flying.players.one.gliding.boost,p.gliding.boost);
  while (p.gliding && p.position3D.y>0 && now-flyingSave.savedAt<10000) {
    const height=p.position3D.y;
    E.advanceWorld(world,now+=140);
    assert(p.position3D.y<=height);
  }
  assert(!p.gliding && p.position3D.y===0);
  assert(!transport(p,{command:'glide',heading:1}));

  const asset=await readFile('public/models/storybook/rpg-watercraft.glb');
  assert(asset.byteLength<650000);
  const gltf=JSON.parse(asset.toString('utf8',20,20+asset.readUInt32LE(12)));
  const names=gltf.scenes[0].nodes.map(index=>gltf.nodes[index].name);
  assert.deepEqual(new Set(names),new Set(['rowboat','cargo_boat','bamboo_raft','cargo_raft','glider_wing']));
  console.log('PASS physical boats, sailing in both views, ownership, full cargo recovery, dock, view switch, saved rider and timed glider landing.');
} finally { await server.close(); }
