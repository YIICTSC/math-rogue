import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({autoImport:false,optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try {
  const E = await server.ssrLoadModule('/src/rpg/engine.ts');
  const F = await server.ssrLoadModule('/src/rpg/placedFluids.ts');
  const V = await server.ssrLoadModule('/src/rpg/voxel.ts');
  const M = await server.ssrLoadModule('/src/rpg/machinery.ts');
  const S = await server.ssrLoadModule('/src/rpg/worldSave.ts');
  let now = 1809021000000;
  const w = E.createWorld(189, undefined, 0, now);
  E.addPlayer(w,'one','River engineer');
  E.addPlayer(w,'two','Neighbor');
  const a=w.players.one, b=w.players.two;
  w.sites = [];
  w.voxels = {edits:{},terrainVersion:2,revision:0,legacyFlat:[],placedBy:{},rotations:{}};
  for (let z=26;z<=48;z++) for (let x=26;x<=49;x++) {
    w.tiles[z*E.WIDTH+x]='grass';
    w.voxels.legacyFlat.push(`${x},${z}`);
    for (let y=0;y<=2;y++) w.voxels.edits[`${x},${y},${z}`]=null;
    w.voxels.edits[`${x},-1,${z}`]='stone';
  }
  function move(player,x,z,y=0) {
    player.x=x;player.y=z;player.position3D={x:x+.5,y,z:z+.5};
  }
  const send=(a,p)=>E.applyAction(w,p.id,a,now+=300);
  const command=(p,command,x,y,z)=>send({type:'voxel-fluid',command,x,y,z},p);
  const cell=(x,y,z)=>F.fluidAt(w,x,y,z);
  const update=()=>E.advanceWorld(w,now+=300);
  function edit(block,x,y,z,owner=a.id) {
    const key=V.voxelKey(x,y,z);
    const before=V.blockAt(w,x,y,z);
    w.voxels.edits[key]=block;
    if (block) w.voxels.placedBy[key]=owner;
    else delete w.voxels.placedBy[key];
    w.voxels.revision++;
    M.recordMachineEdit(w,x,y,z,before,block);
    w.revision++;
  }

  a.life.bag.bucket=1;a.life.bag.lava_bucket=1;b.life.bag.bucket=1;
  move(a,30,30);move(b,33,31);
  w.tiles[30*E.WIDTH+29]='water';
  delete w.voxels.edits['29,-1,30'];
  const river=V.naturalVoxelWater(w,29,30);
  assert(river);
  assert(command(a,'scoop',29,-1,30),'Water can be collected from an existing river.');
  assert.deepEqual(V.naturalVoxelWater(w,29,30),river,'Natural rivers remain intact.');
  assert.equal(a.life.bag.bucket,0);
  assert.equal(a.life.bag.water_bucket,1);
  edit('wood',33,0,31,b.id);
  w.tiles[32*E.WIDTH+31]='road';
  assert(command(a,'water',31,2,30));
  assert.equal(a.life.bag.bucket,1);
  assert.equal(cell(31,0,30)?.kind,'water','Water runs down.');
  assert.equal(cell(32,0,30)?.kind,'water','Water spreads along the floor.');
  assert.equal(cell(32,0,31),undefined,'Water respects the neighboring build.');
  assert.equal(cell(31,0,32),undefined,'Water cannot cover the road.');
  assert(Object.keys(w.voxels.fluids.cells).length<=70);
  move(b,31,31);
  assert.equal(command(b,'scoop',31,2,30),false);
  assert.equal(b.life.bag.bucket,1);
  assert(command(a,'scoop',31,2,30));
  assert.equal(Object.keys(w.voxels.fluids.cells).length,0);
  assert.equal(a.life.bag.water_bucket,1);

  move(a,38,37);
  assert(command(a,'lava',39,0,37));
  assert.equal(cell(39,0,37)?.kind,'lava');
  assert(!V.bodyClear(w,39,37,0));
  assert(command(a,'water',40,0,37));
  assert.equal(V.blockAt(w,39,0,37),'obsidian','Contact with its owner’s lava source consumes it and leaves obsidian.');
  assert(!w.voxels.fluids.sources['39,0,37']);
  assert.equal(a.life.bag.lava_bucket,0);
  assert(command(a,'scoop',40,0,37));
  assert.equal(a.life.bag.water_bucket,1);

  move(a,43,43);
  edit('water_pump',44,0,43);
  w.voxels.rotations['44,0,43']=1;
  edit('crystal_lever',44,0,42);
  assert(command(a,'water',43,0,43));
  assert(send({type:'voxel-device',command:'use',x:44,y:0,z:42},a));
  update();
  assert.equal(cell(45,0,43)?.source,'45,0,43','Powered pump supplies the opposite side.');
  a.profile={hp:72,maxHp:72,gold:100,deck:[],deckSize:0,character:'WARRIOR',image:''};
  const player={currentHp:72,maxHp:72,gold:100,deck:[],relics:[],rpgMutationRevision:0};
  const snapshot=S.restoreWorldSave(S.makeWorldSave(w,a.id,player,now),now);
  E.advanceWorld(snapshot,now+300);
  assert.equal(snapshot.voxels.fluids.sources['43,0,43']?.owner,a.id);
  assert.equal(F.fluidAt(snapshot,45,0,43)?.kind,'water','Derived water is rebuilt when loading.');
  assert(send({type:'voxel-device',command:'use',x:44,y:0,z:42},a));
  update();
  assert.notEqual(cell(45,0,43)?.source,'45,0,43','Switching off removes the generated water source.');
  assert(!command(a,'lava',40,0,42),'An empty container cannot place lava.');
  assert.equal(command(a,'water',30000,0,30000),false);

  move(a,30,43);
  a.life.bag.water_bucket=1;
  edit('bubbling_stone',30,-1,44);
  assert(command(a,'water',30,2,44));
  assert.equal(F.placedWater(w,30,44,0).lift,2);
  move(a,30,44);
  a.position3D.waterAt=now;
  update();
  assert(a.position3D.y>0,'Both views use the same upward current.');
  edit('magma_block',30,-1,44);
  update();
  assert.equal(F.placedWater(w,30,44,0).lift,-1.4);
  a.position3D.y=1;
  update();
  assert(a.position3D.y<1,'A magma base produces a downward current.');

  move(a,34,44);
  a.life.bag.water_bucket=1;
  edit('dropper',34,0,45);
  w.voxels.rotations['34,0,45']=1;
  edit('crystal_lever',34,0,44);
  edit('chest',37,0,45);
  (w.voxels.containers??={})['34,0,45']={items:{ore:2}};
  assert(command(a,'water',35,0,45));
  assert(send({type:'voxel-device',command:'use',x:34,y:0,z:44},a));
  update();
  assert.equal(w.voxels.containers['37,0,45'].items.ore,1,'Dropper can send cargo along one water course.');
  assert.equal(w.voxels.containers['34,0,45'].items.ore,1);
  update();update();
  assert.equal(w.voxels.containers['37,0,45'].items.ore,1,'One pulse sends one item.');
  edit('water_drain',35,0,46);
  edit('crystal_source',35,0,47);
  update();
  assert.equal(cell(35,0,45)?.kind,'water','A drain does not delete a persistent source.');
  assert(cell(35,1,46)===undefined,'Powered drain clears the cell above it.');
  console.log('PASS natural rivers, bounded waterfalls, bucket ownership, obsidian, pump control, save/reload, bubble lift and water cargo transfer.');
} finally {
  await server.close();
}
