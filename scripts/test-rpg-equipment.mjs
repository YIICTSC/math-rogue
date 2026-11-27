import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},
  server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try{
  const E=await server.ssrLoadModule('/src/rpg/engine.ts');
  const V=await server.ssrLoadModule('/src/rpg/voxel.ts');
  const B=await server.ssrLoadModule('/src/rpg/explorationEquipment.ts');
  const S=await server.ssrLoadModule('/src/rpg/worldSave.ts');
  let now=1791150000000;
  const w=E.createWorld(57,undefined,0,now);
  E.addPlayer(w,'a','Builder');
  w.sites=[];
  w.voxels={edits:{},revision:1,terrainVersion:2,legacyFlat:[],placedBy:{}};
  for(let z=25;z<39;z++)for(let x=23;x<41;x++){
    w.tiles[z*E.WIDTH+x]='grass';w.voxels.legacyFlat.push(`${x},${z}`);
    for(let y=0;y<3;y++)w.voxels.edits[V.voxelKey(x,y,z)]=null;
  }
  const p=w.players.a,bag=p.life.bag;
  const move=(x,z,y=0)=>{p.x=x;p.y=z;p.position3D={x:x+.5,z:z+.5,y};};
  const send=action=>E.applyAction(w,p.id,action,now+=300);
  const step=(ticks)=>{for(let i=0;i<ticks;i++)E.advanceWorld(w,now+=300);};
  const stepAt=(block,x,z,y=0,rotation=0)=>{
    move(x-1,z-1,y);
    p.life.energy=6;bag[block]=(bag[block]||0)+1;
    assert(send({type:'voxel-place',block,x,y,z,rotation}),`Place ${block}`);
  };
  stepAt('anvil',30,32);
  stepAt('imprint_table',29,32);
  stepAt('whetstone',30,33);
  p.life.tools={pickaxe:'iron'};
  stepAt('stone',29,31);
  move(29,30);
  assert.equal(V.miningCost('ore',p,w),.30);
  assert(send({type:'voxel-break',x:29,y:0,z:31}));
  assert.equal(p.life.toolWear.pickaxe,1);
  p.life.toolWear.pickaxe=72;
  assert.equal(V.miningCost('ore',p,w),.60,'A worn tool can be used through the normal mining path.');
  bag.iron_ingot=1;
  assert(send({type:'voxel-tools',tool:'pickaxe',operation:'repair'}));
  assert.equal(bag.iron_ingot,0);
  assert.equal(p.life.toolWear.pickaxe,0);
  bag.imprint_book=2;
  const imprint={type:'voxel-tools',tool:'pickaxe',operation:'imprint',imprint:'sharpness'};
  assert(!send(imprint));
  assert(send({type:'native-learning',correctAnswers:1}));
  assert(send(imprint));
  assert.equal(bag.imprint_book,1);
  assert.equal(V.miningCost('ore',p,w),.25);
  assert(send({type:'voxel-tools',tool:'pickaxe',operation:'clean'}));
  assert(!send(imprint),'Removing an imprint does not refund the learning credit.');

  stepAt('auto_brewer',33,34,0,1);
  stepAt('chest',33,34,1);
  stepAt('chest',34,34);
  stepAt('crystal_lever',33,35);
  move(32,33);
  for(const [item,amount]of [['reed',2],['lapis',1],['glass',1]]){
    bag[item]=(bag[item]||0)+amount;
    assert(send({type:'voxel-storage',x:33,y:1,z:34,item,amount,direction:'deposit'}));
  }
  step(20);
  assert(!w.voxels.containers['34,0,34'].items.air_draught,'A signal is needed to start brewing.');
  assert(send({type:'voxel-device',command:'use',x:33,y:0,z:35}));
  step(22);
  assert.equal(w.voxels.containers['34,0,34'].items.air_draught,1);
  assert(send({type:'voxel-storage',x:34,y:0,z:34,item:'air_draught',amount:1,direction:'withdraw'}));
  assert(send({type:'voxel-potion',item:'air_draught'}));
  assert.equal(bag.air_draught,0);
  const remain=B.potionSeconds(w,p,'air_draught');
  assert(remain>89&&remain<=90);
  assert(!send({type:'voxel-potion',item:'air_draught'}));
  const player={id:'WARRIOR',currentHp:60,maxHp:60,gold:0,deck:[],relics:[]};
  p.profile={hp:60,maxHp:60,gold:0,deck:[],deckSize:0,character:'WARRIOR',image:''};
  const saved=S.restoreWorldSave(S.makeWorldSave(w,p.id,player,now),now+3600000);
  assert(B.potionSeconds(saved,saved.players.a,'air_draught')>89);
  assert.equal(saved.players.a.life.imprintStudy,1);
  w.tiles[31*E.WIDTH+34]='water';
  move(34,31,-1.9);
  p.position3D.oxygen=10;
  p.position3D.waterAt=now;
  V.advanceVoxelWater(w,now+500);
  assert(p.position3D.oxygen>=10);
  w.life.time+=91;
  V.advanceVoxelWater(w,now+1000);
  assert(p.position3D.oxygen<12);
  console.log('PASS wear, repair, authoritative learning credit, automatic brewing, oxygen buff and paused save state.');
}finally{await server.close();}
