import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try{
 const E=await server.ssrLoadModule('/src/rpg/engine.ts'),V=await server.ssrLoadModule('/src/rpg/voxel.ts'),C=await server.ssrLoadModule('/src/rpg/adventureCamera.ts');
 const w=E.createWorld(42);E.addPlayer(w,'a','Camera');w.sites=[];w.voxels={edits:{},revision:0,terrainVersion:2,legacyFlat:[]};
 for(let z=15;z<27;z++)for(let x=15;x<27;x++){w.voxels.legacyFlat.push(`${x},${z}`);for(let y=0;y<8;y++)w.voxels.edits[`${x},${y},${z}`]=null;}w.revision++;
 const focus={x:20.5,y:1.62,z:20.5},back={x:0,y:0,z:1};
 assert.equal(C.cameraBoom(w,focus,back,5),5);
 for(let y=0;y<4;y++)w.voxels.edits[`20,${y},23`]='stone';w.voxels.revision++;
 const collision=C.cameraBoom(w,focus,back,5);assert(collision>1.9&&collision<2.3,'boom retracts before wall including camera radius');
 assert(C.cameraBoom(w,{x:20.9,y:1.62,z:20.5},back,5)<2.3,'camera volume does not slip around edge');
 assert(C.cameraBoom(w,focus,{x:0,y:-1,z:0},5)<1.5,'ground collision');
 const before=JSON.stringify(w);C.cameraBoom(w,focus,back,5);assert.equal(JSON.stringify(w),before,'camera never modifies saves');
 const q=new C.AdventureQuality();for(let i=0;i<300;i++)q.sample(1/20,true);assert(q.level<=.7);const low=q.level;for(let i=0;i<1200;i++)q.sample(1/60,true);assert(q.level>low,'slow recovery');
 const manual=new C.AdventureQuality();for(let i=0;i<300;i++)manual.sample(.05,false);assert.equal(manual.level,1);
 assert.equal(V.traceVoxel(w,focus,back).z,23,'construction keeps original eye reach');
 const fresh=E.createWorld(42),legacy=structuredClone(fresh);delete legacy.terrainStyle;
 let peak=0;for(let z=1;z<E.HEIGHT-1;z++)for(let x=1;x<E.WIDTH-1;x++)peak=Math.max(peak,V.terrainHeight(fresh,x,z));
 let largestStep=0;for(let z=2;z<E.HEIGHT-2;z++)for(let x=2;x<E.WIDTH-2;x++){const h=V.terrainHeight(fresh,x,z);largestStep=Math.max(largestStep,Math.abs(h-V.terrainHeight(fresh,x+1,z)),Math.abs(h-V.terrainHeight(fresh,x,z+1)));}
 assert(largestStep<=4,'natural terrain has no isolated tall columns at road or water grading boundaries');
 const mountainStamp=JSON.stringify(fresh.terrainPeaks),npc=fresh.sites.find(s=>s.kind==='npc'),sample={x:npc.x,z:npc.y};const beforeNpc=V.terrainHeight(fresh,sample.x,sample.z);npc.x+=3;fresh.revision++;assert.equal(V.terrainHeight(fresh,sample.x,sample.z),beforeNpc,'walking NPCs never reshape mountains');assert.equal(JSON.stringify(fresh.terrainPeaks),mountainStamp);
 assert(peak>=25,'new adventure has a mountain mass tens of blocks high');
 const oldHeight=V.terrainHeight(legacy,171,74);legacy.voxels={edits:{},revision:0,terrainVersion:2};legacy.revision++;assert.equal(V.terrainHeight(legacy,171,74),oldHeight,'old terrain remains stable');
 assert.equal(JSON.parse(JSON.stringify(fresh)).terrainStyle,1,'terrain generation version persists');
 const springs=[];for(let z=1;z<E.HEIGHT-1;z++)for(let x=1;x<E.WIDTH-1;x++){const pool=V.voxelWater(fresh,x,z);if(pool?.kind==='waterfall')springs.push({x,z,pool});}
 assert(springs.length>8,'mountain springs form actual connected water cells');let drops=0;
 for(const {x,z,pool}of springs){const root=V.blockAt(fresh,x,pool.surface-1,z);if(root)assert(V.vegetationCells(fresh,x,z).some(c=>c.x===x&&c.z===z&&c.y===pool.surface&&c.block===root),'only rooted vegetation can remain in the water column');assert(V.solid(V.blockAt(fresh,x,pool.surface-2,z)),'spring bed has a solid floor');const next=V.voxelWater(fresh,x+pool.flowX,z+pool.flowZ);if(next){assert(next.surface<=pool.surface,'spring never flows uphill');if(next.surface<pool.surface)drops++;}}
 assert(drops>3,'spring has real cascade steps');
 const restored=JSON.parse(JSON.stringify(fresh));for(const {x,z,pool}of springs)assert.deepEqual(V.voxelWater(restored,x,z),pool,'spring path survives saving');
 console.log('Spring water cells:',springs.length,'cascade drops:',drops);
 console.log('New adventure mountain peak:',peak,'largest natural step:',largestStep,'summits:',fresh.terrainPeaks);
 console.log('PASS: swept camera wall/edge/ground, save immutability, adaptive resolution/recovery/manual quality and eye reach');
}finally{await server.close();}
