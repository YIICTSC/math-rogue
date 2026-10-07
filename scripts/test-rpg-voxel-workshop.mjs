import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try{
 const E=await server.ssrLoadModule('/src/rpg/engine.ts'),V=await server.ssrLoadModule('/src/rpg/voxel.ts'),C=await server.ssrLoadModule('/src/rpg/voxelCatalog.ts'),W=await server.ssrLoadModule('/src/rpg/voxelWorkshop.ts'),F=await server.ssrLoadModule('/src/rpg/farm/model.ts'),S=await server.ssrLoadModule('/src/rpg/worldSave.ts');
 let now=1791150000000;const world=E.createWorld(42,undefined,0,now);E.addPlayer(world,'a','Builder');E.addPlayer(world,'b','Friend');world.started=true;world.sites=[];world.voxels={edits:{},revision:0,terrainVersion:2,legacyFlat:[]};
 for(let z=12;z<30;z++)for(let x=12;x<30;x++){world.tiles[z*E.WIDTH+x]='grass';world.voxels.legacyFlat.push(`${x},${z}`);}
 const p=world.players.a;p.x=20;p.y=20;p.position3D={x:20.5,y:0,z:20.5};const lp=p.life;lp.bag={wood:12,stone:30};lp.energy=6;
 const send=a=>E.applyAction(world,'a',a,now+=300),craft=(recipe,amount=1)=>send({type:'voxel-craft',recipe,amount});
 assert(craft('plank'));assert.equal(lp.bag.plank,4);assert.equal(lp.bag.wood,11);
 const snapshot=JSON.stringify(lp.bag);assert(craft('chest'));assert.equal(JSON.stringify(lp.bag),snapshot,'Workstation required before spending');
 assert(craft('workbench'));assert(send({type:'voxel-place',x:21,y:0,z:20,block:'workbench'}));
 assert(craft('plank',4));assert.equal(lp.bag.plank,16);assert(craft('furnace'));assert(send({type:'voxel-place',x:21,y:0,z:21,block:'furnace',rotation:1}));
 lp.bag.ore=8;assert(craft('iron_ingot'));assert.equal(lp.bag.iron_ingot,4);assert.equal(lp.bag.ore,4);assert.equal(lp.bag.wood,6,'One wood fuel used');
 assert(craft('stick'));assert(craft('pickaxe-iron'));assert.equal(lp.pickaxe,'iron');assert(V.miningCost('stone',p)<.3);
 lp.bag.diamond=3;assert(craft('pickaxe-diamond'));assert.equal(lp.pickaxe,'diamond');lp.bag.wood=10;lp.bag.stone=20;send({type:'life-craft',recipe:'pickaxe-stone'});assert.equal(lp.pickaxe,'diamond','Legacy crafting cannot downgrade tools');
 assert(craft('chest'));assert(send({type:'voxel-place',x:20,y:0,z:21,block:'chest'}));
 assert(send({type:'voxel-storage',x:20,y:0,z:21,item:'stone',amount:8,direction:'deposit'}));assert.equal(world.voxels.containers['20,0,21'].items.stone,8);
 assert(send({type:'voxel-break',x:20,y:0,z:21}));assert.equal(V.blockAt(world,20,0,21),'chest','Cannot destroy filled chest');
 assert(!send({type:'voxel-storage',x:20,y:0,z:21,item:'stone',amount:-1,direction:'withdraw'}));assert(!send({type:'voxel-storage',x:20,y:0,z:21,item:'__proto__',amount:1,direction:'withdraw'}));
 p.x=40;p.y=40;p.position3D={x:40.5,y:0,z:40.5};assert(!send({type:'voxel-storage',x:20,y:0,z:21,item:'stone',amount:1,direction:'withdraw'}));p.x=20;p.y=20;p.position3D={x:20.5,y:0,z:20.5};
 assert(send({type:'voxel-storage',x:20,y:0,z:21,item:'stone',amount:8,direction:'withdraw'}));assert(send({type:'voxel-break',x:20,y:0,z:21}));
 lp.energy=6;lp.bag.woodslab=2;assert(send({type:'voxel-place',x:20,y:0,z:21,block:'woodslab',rotation:2}));assert.equal(V.floorAt(world,20,21,1),.5,'Half-height support');assert.equal(world.voxels.rotations['20,0,21'],2);
 lp.bag.stick=6;lp.bag.stone=12;assert(craft('axe-stone'));assert(V.miningCost('wood',p)<.1);assert(craft('shovel-stone'));assert(V.miningCost('dirt',p)<.1);
 const before=JSON.stringify(lp.bag);assert(!craft('plank',-1));assert(!craft('plank',17));assert(!craft('__proto__'));assert.equal(JSON.stringify(lp.bag),before);
 lp.bag.woodstairs=1;assert(!send({type:'voxel-place',x:19,y:0,z:20,block:'woodstairs',rotation:NaN}));assert.equal(lp.bag.woodstairs,1);
 const farm=F.farmOf(world,p);farm.plots[0].x=24;farm.plots[0].y=24;world.tiles[24*E.WIDTH+27]='water';world.voxels.edits['25,0,24']='irrigator';world.revision++;assert(W.irrigatedPlot(world,24,24));assert(!W.irrigatedPlot(world,20,20));
 world.tiles[24*E.WIDTH+27]='grass';world.revision++;assert(!W.irrigatedPlot(world,24,24),'Tank needs a water source');
 lp.bag.fertilizer=1;const compost=farm.compost;assert(send({type:'voxel-compost'}));assert.equal(farm.compost,compost+3);farm.pantry.carrot={normal:2,quality:0};const seeds=farm.seeds.carrot||0;assert(send({type:'voxel-seeds',crop:'carrot'}));assert.equal(farm.seeds.carrot,seeds+3);assert.equal(farm.pantry.carrot.normal,0);
 p.profile={hp:72,maxHp:72,gold:100,deck:[],deckSize:0,character:'WARRIOR',image:''};const player={currentHp:72,maxHp:72,gold:100,deck:[],relics:[],rpgMutationRevision:0};const saved=S.makeWorldSave(world,'a',player,now),restored=S.restoreWorldSave(JSON.parse(JSON.stringify(saved)),now+10000);assert.deepEqual(restored.voxels,world.voxels);assert.deepEqual(restored.players.a.life.tools,lp.tools);
 assert.equal(new Set(C.WORKSHOP_RECIPES.map(r=>r.id)).size,C.WORKSHOP_RECIPES.length);for(const r of C.WORKSHOP_RECIPES)for(const item of Object.keys(r.cost))assert(Object.hasOwn(C.ALL_MATERIAL_NAMES,item),r.id+': '+item);
 console.log(`PASS: ${C.CATALOG_BLOCKS.length} blocks, ${C.WORKSHOP_RECIPES.length} recipes; progression, fuel, tool upgrades, chest authority, input validation, slab support, irrigation, seed recovery and save/restore.`);
}finally{await server.close();}
