import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},
  server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try {
  const E=await server.ssrLoadModule('/src/rpg/engine.ts');
  const V=await server.ssrLoadModule('/src/rpg/voxel.ts');
  const A=await server.ssrLoadModule('/src/rpg/buildingPhysics.ts');
  const C=await server.ssrLoadModule('/src/rpg/voxelCatalog.ts');
  const M=await server.ssrLoadModule('/src/rpg/machinery.ts');
  const S=await server.ssrLoadModule('/src/rpg/worldSave.ts');
  let now=1791150000000;
  const world=E.createWorld(43,undefined,0,now);
  E.addPlayer(world,'owner','Builder');
  E.addPlayer(world,'guest','Neighbor');
  world.sites=[];
  world.caverns=[];
  const p=world.players.owner,guest=world.players.guest,bag=p.life.bag;
  const voxels=world.voxels={edits:{},revision:1,terrainVersion:2,legacyFlat:[],placedBy:{}};
  for(let z=25;z<37;z++)for(let x=25;x<44;x++) {
    world.tiles[z*E.WIDTH+x]='grass';
    voxels.legacyFlat.push(`${x},${z}`);
    voxels.edits[`${x},-1,${z}`]='stone';
    for(let y=0;y<8;y++)voxels.edits[`${x},${y},${z}`]=null;
  }
  const stand=(player,x,z,y=0)=>{player.x=x;player.y=z;player.position3D={x:x+.5,y,z:z+.5,surface2D:true,layered2D:true};};
  const send=(action,actor=p)=>E.applyAction(world,actor.id,action,now+=300);
  const step=(times=1)=>{for(let i=0;i<times;i++)E.advanceWorld(world,now+=300);};
  function place(block,x,y,z) {
    p.life.energy=6;
    bag[block]=(bag[block]??0)+1;
    assert(send({type:'voxel-place',block,x,y,z}),`Place ${block} at ${x},${y},${z}`);
  }
  assert(C.WORKSHOP_RECIPES.some(recipe=>recipe.output==='birch_fence'));
  assert.equal(C.shapeOf('andesite_stairs'),'stairs');
  for(let y=0;y<3;y++)voxels.edits[`31,${y},30`]='stone';
  stand(p,29,30);stand(guest,28,30);
  for(let y=0;y<3;y++)place('ladder',30,y,30);
  assert(A.climbTarget(world,p,1));
  assert(send({type:'voxel-climb',direction:1}));
  assert.equal(p.position3D.y,1);
  assert.equal(p.x,30);
  assert(send({type:'voxel-climb',direction:1}));
  assert.equal(p.position3D.y,2);
  assert(send({type:'voxel-snap',preserveHeight:true}));
  assert.equal(p.position3D.y,2,'The view switch preserves height on a ladder.');
  assert(send({type:'voxel-climb',direction:-1}));
  assert.equal(p.position3D.y,1);

  stand(p,34,30);
  voxels.edits['36,4,29']='plank';
  voxels.edits['37,4,30']='sand';
  voxels.placedBy['37,4,30']=p.id;
  place('sand',36,4,30);
  step(7);
  assert.equal(voxels.edits['36,0,30'],'sand');
  assert.equal(voxels.placedBy['36,0,30'],p.id);
  assert.equal(voxels.edits['37,4,30'],'sand','An older suspended construction is preserved.');
  assert.equal(Object.values(voxels.details.gravity).filter(Boolean).length,1);

  stand(p,34,33);stand(guest,35,34);
  place('signboard',35,0,33);
  const inscription={type:'voxel-sign',x:35,y:0,z:33,text:'北口へ →'};
  assert(send(inscription));
  assert(!send({...inscription,text:'改変'},guest));
  assert.equal(voxels.details.signs['35,0,33'],'北口へ →');

  stand(p,32,34);
  place('fence_gate',33,0,34);
  assert.equal(V.landscapeStep(world,p.position3D,1,0),null,'A shut gate cannot be climbed in one walking step.');
  const toggle=(x,z)=>send({type:'voxel-device',command:'use',x,y:0,z});
  assert(toggle(33,34));
  step(2);
  assert(V.landscapeStep(world,p.position3D,1,0));
  assert(send({type:'move',dx:1,dy:0}));
  assert.equal(p.x,33);
  stand(p,32,34);
  place('trapdoor',32,0,33);
  assert(Math.abs(V.floorAt(world,32,33,1)-.21)<.001);
  assert(toggle(32,33));
  step(2);
  assert.equal(V.floorAt(world,32,33,1),0);

  stand(p,35,28);
  world.tiles[28*E.WIDTH+36]='water';
  voxels.edits['36,-1,28']=null;
  voxels.revision++;world.revision++;
  place('drawbridge',36,0,28);
  place('crystal_lever',36,0,29);
  assert(!M.poweredGateOpen(world,36,0,28));
  assert(toggle(36,29));
  step(2);
  assert(M.poweredGateOpen(world,36,0,28));
  assert(send({type:'move',dx:1,dy:0}));
  assert.equal(p.x,36);
  assert(Math.abs(p.position3D.y-.21)<.001);

  stand(p,38,30);
  world.tiles[31*E.WIDTH+39]='water';
  voxels.edits['39,-1,31']=null;
  voxels.revision++;world.revision++;
  place('concrete_powder',39,0,30);
  step();
  assert.equal(voxels.edits['39,0,30'],'whiteconcrete');
  stand(p,37,27);
  place('rebound_floor',38,0,27);
  stand(p,38,27,.5);
  step();
  assert(send({type:'voxel-jump'}));
  assert(p.position3D.vy>8);

  stand(p,25,31);
  place('waygate',26,0,31);
  place('crystal_lever',26,0,32);
  assert(toggle(26,32));
  stand(p,40,35);
  place('waygate',40,0,34);
  place('crystal_lever',41,0,34);
  assert(toggle(41,34));
  stand(p,25,31);
  const link={type:'voxel-device',command:'waygate-link',x:26,y:0,z:31,value:'40,0,34'};
  const travel={type:'voxel-device',command:'waygate-travel',x:26,y:0,z:31};
  assert(!send({...link,value:'260,2,34'}));
  assert(send(link));
  assert(send(travel));
  assert.equal(p.x,40);
  assert.equal(p.y,33);
  assert.equal(p.position3D.y,0);

  const profile={currentHp:75,maxHp:75,gold:0,deck:[],relics:[]};
  p.profile={hp:75,maxHp:75,gold:0,deck:[]};
  const restored=S.restoreWorldSave(S.makeWorldSave(world,p.id,profile,now),now+60000);
  assert.equal(restored.voxels.details.signs['35,0,33'],'北口へ →');
  assert.equal(M.inspectMachine(restored,26,0,31).device.waygate,'40,0,34');
  assert.equal(restored.voxels.edits['37,4,30'],'sand');
  console.log('PASS builder recipes, ladders, gates, drawbridge crossing, spring floor, gravity, concrete hardening, signs, linked waygates and compatible saves.');
} finally {await server.close();}
