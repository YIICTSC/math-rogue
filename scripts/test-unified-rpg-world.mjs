import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true,watch:null,hmr:false},optimizeDeps:{noDiscovery:true,include:[]},appType:'custom'});
try{
 const E=await server.ssrLoadModule('/src/rpg/engine.ts'),L=await server.ssrLoadModule('/src/rpg/worldLandscape.ts'),V=await server.ssrLoadModule('/src/rpg/voxel.ts'),M=await server.ssrLoadModule('/src/rpg/unifiedWorldMigration.ts');
 const w=E.createWorld(44);assert.equal(w.tiles.length,256*128);assert(!L.landscapeRegion(-1,40));assert(!L.landscapeRegion(260,40));assert(!L.landscapeRegion(100,129));
 assert(L.LANDMARKS.every(l=>l.x-l.width/2>0&&l.x+l.width/2<256&&l.z-l.depth/2>0&&l.z+l.depth/2<128));
 for(const l of L.LANDMARKS){assert(L.legacyRegion(l.x,l.z));const base=l.kind==='tower'?Math.floor(L.mountainHeight(l.x,l.z)):0;assert(V.blockAt(w,l.x-l.width/2,base+1,l.z));}
 for(const [x,z,dx,dz]of [[191,30,1,0],[120,87,0,1]])assert(Math.abs(V.terrainHeight(w,x,z)-V.terrainHeight(w,x+dx,z+dz))<=1,'former map seam remains walkable');
 const pool=V.voxelWater(w,124,103);assert(pool&&pool.surface===1&&pool.depth===12);assert.equal(V.blockAt(w,124,-10,103),null);assert(V.solid(V.blockAt(w,124,-12,103)));
 E.addPlayer(w,'swimmer','Swimmer');w.started=true;const swimmer=w.players.swimmer;swimmer.x=124;swimmer.y=103;swimmer.position3D={x:124.5,z:103.5,y:-5};assert(E.applyAction(w,'swimmer',{type:'voxel-snap'},Date.now()));assert.equal(swimmer.x,124);assert.equal(swimmer.y,103);assert(swimmer.position3D.surface2D);assert(E.applyAction(w,'swimmer',{type:'move',dx:1,dy:0},Date.now()+500));assert.equal(swimmer.x,125);assert(swimmer.position3D.surface2D);
 const old=Array.from({length:192*88},(_,tile)=>w.tiles[Math.floor(tile/192)*256+tile%192]);w.tiles=old;
 w.life.nodes={193:{hits:2,regrowAt:123}};w.voxels={edits:{'-2,0,46':'door','-3,0,46':'stone','20,0,20':'plank'},revision:0,terrainVersion:2,rotations:{'-2,0,46':1}};
 w.life.games={'193:0':{key:'193:0',homeTile:193,slot:0},'16897:1':{key:'16897:1',homeTile:16897,slot:1}};
 w.voxelRooms=[{id:'old',owner:'a',shared:false,door:{x:-2,y:0,z:46},cells:[{x:-1,z:46}],floor:0,stock:{},furniture:[{id:'f',item:'bed',x:-1,y:46,rotation:0,slot:0}],revision:0}];
 M.migrateUnifiedWorld(w);assert.equal(w.tiles.length,256*128);assert(w.life.games['257:0']);assert(w.life.games['32769:1']);assert.deepEqual(w.life.nodes[257],{hits:2,regrowAt:123});assert.equal(w.voxels.edits['20,0,20'],'plank');assert(!Object.hasOwn(w.voxels.edits,'-2,0,46'));
 const door=w.voxelRooms[0].door;assert(L.legacyRegion(door.x,door.z));assert.equal(w.voxels.edits[`${door.x},0,${door.z}`],'door');assert.equal(w.voxels.rotations[`${door.x},0,${door.z}`],1);assert.equal(w.voxelRooms[0].furniture[0].x,door.x+1);
 const once=JSON.stringify(w);M.migrateUnifiedWorld(w);assert.equal(JSON.stringify(w),once);
 console.log('PASS: unified world bounds, five integrated landmarks, old tile state, exterior construction/room/furniture migration and idempotence');
}finally{await server.close();}
