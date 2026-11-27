import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},
  server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try {
  const E=await server.ssrLoadModule('/src/rpg/engine.ts');
  const V=await server.ssrLoadModule('/src/rpg/voxel.ts');
  const P=await server.ssrLoadModule('/src/rpg/packAnimals.ts');
  const W=await server.ssrLoadModule('/src/rpg/lifestyle/wildlife.ts');
  const S=await server.ssrLoadModule('/src/rpg/worldSave.ts');
  let now=1791150000000;
  const world=E.createWorld(7089,undefined,0,now);
  E.addPlayer(world,'a','Rider');
  E.addPlayer(world,'b','Neighbor');
  const a=world.players.a,b=world.players.b;
  let wild;
  for(let z=8;z<E.HEIGHT-4&&!wild;z+=8)for(let x=8;x<E.WIDTH-4&&!wild;x+=8){
    wild=W.visibleWildlife(world,x,z,11,V.terrainHeight(world,x,z)).find(animal=>animal.kind==='donkey'||animal.kind==='horse');
  }
  assert(wild,'A rideable wild animal is generated in a real habitat.');
  function position(p,x,y,z) {
    p.x=Math.floor(x);p.y=Math.floor(z);
    p.position3D={x,y,z,surface2D:true,layered2D:true};
  }
  a.life.bag.hay=4;
  const command=(actor,command,fields={})=>E.applyAction(world,actor.id,{type:'voxel-pack-animal',id:wild.id,command,...fields},now+=3000);
  for(let n=0;n<3;n++){
    const current=W.visibleWildlife(world,wild.x,wild.z,6,wild.y).find(animal=>animal.id===wild.id);
    assert(current);
    position(a,current.x,current.y,current.z);
    position(b,current.x-1,current.y,current.z);
    assert(command(a,'feed'));
  }
  assert.equal(a.life.bag.hay,1);
  const animal=P.ownedPackAnimal(world,a.id);
  assert(animal);
  assert(!W.visibleWildlife(world,wild.x,wild.z,6,wild.y).some(animal=>animal.id===wild.id));
  assert(!command(b,'mount'));
  assert(command(a,'name',{name:'風待ち'}));
  assert(command(a,'mount'));
  assert.equal(P.ridingAnimal(world,a.id).id,wild.id);
  assert.equal(a.position3D.y,animal.y+1.08);
  const before=[animal.x,animal.z];
  const axes=[[1,0],[0,1],[-1,0],[0,-1]];
  const picked=axes.find(([dx,dy])=>E.applyAction(world,a.id,{type:'move',dx,dy},now+=400));
  assert(picked);
  assert.notDeepEqual([animal.x,animal.z],before);
  assert.equal(a.position3D.x,animal.x);
  assert(E.applyAction(world,a.id,{type:'voxel-snap',preserveHeight:true},now+=400));
  assert.equal(a.position3D.y,animal.y+1.08);
  assert(command(a,'cargo',{item:'wood',amount:2,direction:'load'}));
  assert.equal(animal.cargo.wood,2);
  const profile={currentHp:75,maxHp:75,gold:0,deck:[],relics:[]};
  a.profile={hp:75,maxHp:75,gold:0,deck:[]};
  const restored=S.restoreWorldSave(S.makeWorldSave(world,a.id,profile,now),now+60000);
  assert.equal(P.ridingAnimal(restored,a.id).name,'風待ち');
  assert.equal(P.ridingAnimal(restored,a.id).cargo.wood,2);
  assert(command(a,'dismount'));
  assert(!P.ridingAnimal(world,a.id));
  assert(command(a,'cargo',{item:'wood',amount:2,direction:'unload'}));
  assert.equal(a.life.bag.wood,4);
  console.log('PASS actually generated habitats, feeding, naming, exclusive ownership, riding, travel, cargo and saved companion.');
} finally {await server.close();}
