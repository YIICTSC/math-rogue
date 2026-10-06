import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try{
 const E=await server.ssrLoadModule('/src/rpg/engine.ts'),V=await server.ssrLoadModule('/src/rpg/voxel.ts'),L=await server.ssrLoadModule('/src/rpg/life.ts'),S=await server.ssrLoadModule('/src/rpg/worldSave.ts');
 const M=await server.ssrLoadModule('/src/rpg/worldViewMath.ts');const diagonal=M.relativeMove(0,-.32,.5);assert(Math.abs(Math.hypot(diagonal.dx,diagonal.dy)-.32)<1e-8);assert(diagonal.dx>0&&diagonal.dy<0);
 let now=1791150000000;const w=E.createWorld(42,undefined,0,now);E.addPlayer(w,'a','Builder');E.addPlayer(w,'b','Friend');w.started=true;const p=w.players.a;
 // Isolated ground deliberately excludes all protected structures.
 w.sites=[];for(let y=18;y<26;y++)for(let x=18;x<26;x++)w.tiles[y*E.WIDTH+x]='grass';p.x=20;p.y=20;
 const send=(a,id='a')=>E.applyAction(w,id,a,now+=300);
 assert(send({type:'voxel-move',dx:.23,dy:.16}));assert.equal(p.x,20);assert(Math.abs(p.position3D.x-20.73)<1e-6);assert(Math.abs(p.position3D.z-20.66)<1e-6);
 assert(!send({type:'voxel-move',dx:10,dy:0}));assert(!send({type:'voxel-move',dx:NaN,dy:0}));
 assert(send({type:'voxel-snap'}));assert(!p.position3D);assert.equal(p.x,20);
 const lp=L.lifePlayer(p);lp.energy=6;lp.bag.wood=20;
 assert(send({type:'voxel-place',x:21,y:0,z:20,block:'wood'}));assert.equal(lp.bag.wood,19);assert.equal(V.blockAt(w,21,0,20),'wood');assert(!L.lifeWalkable(w,21,20));
 assert(!send({type:'voxel-place',x:20,y:0,z:20,block:'wood'}));assert(!send({type:'voxel-place',x:21,y:5,z:20,block:'wood'}));assert(!send({type:'voxel-place',x:50,y:0,z:50,block:'wood'}));
 assert(send({type:'voxel-place',x:21,y:1,z:20,block:'wood'}));assert(send({type:'voxel-break',x:21,y:1,z:20}));assert.equal(lp.energy,5);assert(send({type:'voxel-break',x:21,y:0,z:20}));assert.equal(lp.bag.wood,20);assert(L.lifeWalkable(w,21,20));
 // Fully mine a natural column and preserve removal across serialization.
 w.tiles[20*E.WIDTH+21]='forest';delete w.voxels.edits['21,0,20'];delete w.voxels.edits['21,1,20'];
 const node=L.natureAt(w,20*E.WIDTH+21);assert(node);
 for(let h=0;h<3;h++){if(V.blockAt(w,21,h,20))assert(send({type:'voxel-break',x:21,y:h,z:20}));}
 assert(L.lifeWalkable(w,21,20));assert.equal(V.blockAt(w,21,0,20),null);
 lp.energy=0;lp.bag.stone=2;assert(send({type:'voxel-place',x:22,y:0,z:20,block:'stone'}));const rev=w.voxels.revision;assert(send({type:'voxel-break',x:22,y:0,z:20}));assert.equal(w.voxels.revision,rev);assert.equal(V.blockAt(w,22,0,20),'stone');
 p.profile={hp:72,maxHp:72,gold:100,deck:[],deckSize:0,character:'WARRIOR',image:''};const player={currentHp:72,maxHp:72,gold:100,deck:[],relics:[],rpgMutationRevision:0};
 const save=S.makeWorldSave(w,'a',player,now),restored=S.restoreWorldSave(JSON.parse(JSON.stringify(save)),now+10000);assert.deepEqual(restored.voxels,w.voxels);assert.equal(V.blockAt(restored,22,0,20),'stone');
 const q=w.players.b;q.x=22;q.y=20;q.spectator=true;assert(!send({type:'voxel-break',x:22,y:0,z:20},'b'));w.sites.push({x:22,y:20,kind:'npc'});assert(!send({type:'voxel-break',x:22,y:0,z:20}));
 w.life.houses.push({id:'home',owner:'a',ownerName:'Builder',x:20,y:21,biome:'meadow',home:{tile:21*E.WIDTH+20,level:1,furniture:[]},invitedAt:0});p.position3D={x:20.5,z:20.86};assert(send({type:'voxel-move',dx:0,dy:.32}));assert.equal(lp.indoors,'home');assert(!p.position3D);assert(send({type:'life-leave'}));assert(!lp.indoors);assert(!p.position3D);
 console.log('PASS: continuous position, snap, mining, energy, materials, supported building, collisions, protections, spectator authority and save/resume');
}finally{await server.close();}
