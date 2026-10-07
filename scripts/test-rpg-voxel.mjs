import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try{
 const E=await server.ssrLoadModule('/src/rpg/engine.ts'),V=await server.ssrLoadModule('/src/rpg/voxel.ts'),L=await server.ssrLoadModule('/src/rpg/life.ts'),S=await server.ssrLoadModule('/src/rpg/worldSave.ts'),M=await server.ssrLoadModule('/src/rpg/worldViewMath.ts'),Energy=await server.ssrLoadModule('/src/rpg/energy.ts');
 const diagonal=M.relativeMove(0,-.32,.5);assert(Math.abs(Math.hypot(diagonal.dx,diagonal.dy)-.32)<1e-8);
 assert.equal(Energy.energyOf({energy:5.9}),5.9);let now=1791150000000;const w=E.createWorld(42,undefined,0,now);E.addPlayer(w,'a','Builder');E.addPlayer(w,'b','Friend');w.started=true;const p=w.players.a;w.sites=[];w.voxels={edits:{},revision:0,terrainVersion:2,legacyFlat:[]};
 for(let y=18;y<26;y++)for(let x=18;x<26;x++){w.tiles[y*E.WIDTH+x]='grass';w.voxels.legacyFlat.push(`${x},${y}`);}p.x=20;p.y=20;
 const send=(a,id='a')=>E.applyAction(w,id,a,now+=300);const near=(actual,expected)=>assert(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);
 assert(send({type:'voxel-move',dx:.23,dy:.16}));assert.equal(p.x,20);near(p.position3D.x,20.73);near(p.position3D.z,20.66);assert.equal(p.position3D.y,0);
 assert(!send({type:'voxel-move',dx:10,dy:0}));assert(!send({type:'voxel-move',dx:NaN,dy:0}));assert(send({type:'voxel-snap'}));assert(!p.position3D);
 const lp=L.lifePlayer(p);lp.energy=6;lp.bag.wood=20;
 assert(send({type:'voxel-place',x:21,y:0,z:20,block:'wood'}));assert.equal(lp.bag.wood,19);near(lp.energy,5.9);assert(!L.lifeWalkable(w,21,20));
 assert(send({type:'voxel-move',dx:.32,dy:0}));assert(send({type:'voxel-move',dx:.32,dy:0}));assert.equal(p.position3D.y,1,'One-block auto step');
 send({type:'voxel-snap'});assert(L.lifeWalkable(w,p.x,p.y));p.x=20;p.y=20;
 assert(!send({type:'voxel-place',x:20,y:0,z:20,block:'wood'}));assert(!send({type:'voxel-place',x:21,y:5,z:20,block:'wood'}));assert(!send({type:'voxel-place',x:50,y:0,z:50,block:'wood'}));
 w.voxels.edits['21,1,20']='wood';w.revision++;p.position3D={x:20.5,z:20.5,y:0};assert(send({type:'voxel-move',dx:.32,dy:0}));near(p.position3D.x,20.5);assert.equal(p.position3D.y,0,'No teleport through a two-block wall to a buried cavern');delete p.position3D;w.voxels.edits['21,1,20']=null;w.revision++;
 assert(send({type:'voxel-place',x:21,y:1,z:20,block:'wood'}));assert(send({type:'voxel-break',x:21,y:1,z:20}));assert(send({type:'voxel-break',x:21,y:0,z:20}));near(lp.energy,5.6);assert.equal(lp.bag.wood,20);
 w.tiles[20*E.WIDTH+21]='forest';delete w.voxels.edits['21,0,20'];delete w.voxels.edits['21,1,20'];w.revision++;
 for(const cell of V.vegetationCells(w,21,20)){if(V.blockAt(w,cell.x,cell.y,cell.z))assert(send({type:'voxel-break',x:cell.x,y:cell.y,z:cell.z}));}assert(L.lifeWalkable(w,21,20));assert.equal(V.blockAt(w,21,0,20),null);
 lp.energy=1;lp.bag.stone=3;assert(send({type:'voxel-place',x:22,y:0,z:20,block:'stone'}));near(lp.energy,.9);lp.energy=0;const rev=w.voxels.revision;assert(send({type:'voxel-break',x:22,y:0,z:20}));assert.equal(w.voxels.revision,rev);
 // Mine straight down: exposed ground disappears and feet fall to the next floor.
 lp.energy=6;p.position3D={x:20.5,z:20.5,y:0};assert(send({type:'voxel-break',x:20,y:-1,z:20}));assert.equal(p.position3D.y,-1);near(lp.energy,5.9);
 assert(send({type:'voxel-break',x:20,y:-2,z:20}));assert.equal(p.position3D.y,-2);assert(send({type:'voxel-snap'}));assert(!p.position3D);assert.equal(p.x,20);
 // Each biome has hills; each deterministic underground oasis has air and a pool.
 const B=await server.ssrLoadModule('/src/rpg/biomes.ts');for(const biome of B.BIOMES){let peak=0;for(let z=biome.y-10;z<=biome.y+10;z++)for(let x=biome.x-10;x<=biome.x+10;x++)peak=Math.max(peak,V.terrainHeight(w,x,z));assert(peak>0,biome.id+' has relief');}
 for(const oasis of V.oasisCenters(w)){assert.equal(V.blockAt(w,oasis.x,oasis.depth,oasis.z),null);assert.equal(V.blockAt(w,oasis.x,oasis.depth-1,oasis.z),'oasis-water');}
 let steel;for(let z=30;z<45&&!steel;z++)for(let x=30;x<45&&!steel;x++)for(let y=-8;y>-15&&!steel;y--)if(V.blockAt(w,x,y,z)==='steel')steel={x,y,z};assert(steel,'Underground steel deposits');assert(V.miningCost('steel',p)>.1);
 lp.bag={wood:10,stone:10,plank:10,ore:10,steel:10,crystal:10};assert(send({type:'life-craft',recipe:'pickaxe-stone'}));assert.equal(lp.pickaxe,'stone');near(V.miningCost('steel',p),.9);assert(send({type:'life-craft',recipe:'pickaxe-iron'}));near(V.miningCost('steel',p),.6);assert(send({type:'life-craft',recipe:'pickaxe-steel'}));near(V.miningCost('steel',p),.36);
 p.position3D={x:steel.x+.5,z:steel.z+.5,y:steel.y+1};p.x=steel.x;p.y=steel.z;lp.energy=6;assert(send({type:'voxel-break',...steel}));near(lp.energy,5.64);assert(p.voxelDiscoveries.includes('steel'));
 p.profile={hp:72,maxHp:72,gold:100,deck:[],deckSize:0,character:'WARRIOR',image:''};const player={currentHp:72,maxHp:72,gold:100,deck:[],relics:[],rpgMutationRevision:0};const save=S.makeWorldSave(w,'a',player,now),restored=S.restoreWorldSave(JSON.parse(JSON.stringify(save)),now+10000);assert.deepEqual(restored.voxels,w.voxels);assert.equal(restored.players.a.life.pickaxe,'steel');assert.equal(restored.players.a.position3D.y,p.position3D.y);
 // Natural leaves, fruit and bushes are individually harvested, placed and saved.
 const vw=E.createWorld(42,undefined,0,now);vw.started=true;E.addPlayer(vw,'v','Gardener');vw.sites=[];const vp=vw.players.v,vl=L.lifePlayer(vp);const found=new Map();
 for(let z=2;z<E.HEIGHT-2;z++)for(let x=2;x<E.WIDTH-2;x++)for(const c of V.vegetationCells(vw,x,z))if(c.x===x&&c.z===z&&!found.has(c.block))found.set(c.block,c);
 for(const block of ['leaves','frostleaves','fruit','bush','reed','herb','cactus']){
  const c=found.get(block);assert(c,block+' exists naturally');vp.x=c.x-1;vp.y=c.z;vp.position3D={x:c.x-.5,z:c.z+.5,y:V.terrainHeight(vw,c.x,c.z)};vl.energy=6;const before=vl.bag[block]||0;
  assert(E.applyAction(vw,'v',{type:'voxel-break',x:c.x,y:c.y,z:c.z},now+=300));assert.equal(V.blockAt(vw,c.x,c.y,c.z),null);assert.equal(vl.bag[block],before+1);near(vl.energy,5.9);
  assert(E.applyAction(vw,'v',{type:'voxel-place',x:c.x,y:c.y,z:c.z,block},now+=300));assert.equal(V.blockAt(vw,c.x,c.y,c.z),block);assert.equal(vl.bag[block],before);near(vl.energy,5.8);
 }
 const tree=found.get('leaves');vp.x=tree.x-1;vp.y=tree.z;vp.position3D={x:tree.x-.5,z:tree.z+.5,y:V.terrainHeight(vw,tree.x,tree.z)};vl.energy=6;const base=V.terrainHeight(vw,tree.x,tree.z);assert(E.applyAction(vw,'v',{type:'voxel-break',x:tree.x,y:base,z:tree.z},now+=300));assert.equal(V.blockAt(vw,tree.x,tree.y,tree.z),'leaves','Cutting trunk preserves canopy');assert.equal(V.blockAt(vw,tree.x+1,base+2,tree.z),'leaves','Spread canopy is editable');
 vp.profile=p.profile;const vegetationSave=S.makeWorldSave(vw,'v',player,now),vegetationRestore=S.restoreWorldSave(JSON.parse(JSON.stringify(vegetationSave)),now+10000);assert.deepEqual(vegetationRestore.voxels,vw.voxels);assert.deepEqual(vegetationRestore.players.v.life.bag,vl.bag);
 const q=w.players.b;q.spectator=true;assert(!send({type:'voxel-break',x:22,y:0,z:20},'b'));w.sites.push({x:22,y:20,kind:'npc'});assert(!send({type:'voxel-break',x:22,y:0,z:20}));
 p.x=20;p.y=20;p.position3D={x:20.5,z:20.86,y:0};w.life.houses.push({id:'home',owner:'a',ownerName:'Builder',x:20,y:21,biome:'meadow',home:{tile:21*E.WIDTH+20,level:1,furniture:[]},invitedAt:0});w.revision++;assert(send({type:'voxel-move',dx:0,dy:.32}));assert.equal(lp.indoors,'home');assert(!p.position3D);assert(send({type:'life-leave'}));assert(!p.position3D);
 console.log('PASS: fractional energy, continuous movement, 1-block climbing, 2D snap, ground excavation/falling, six biome hills/oases, steel, crafted tool discounts, authority and saved elevations/edits/tools.');
}finally{await server.close();}
