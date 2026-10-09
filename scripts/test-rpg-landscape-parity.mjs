import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try{
 const Social=await server.ssrLoadModule('/src/rpg/social.ts');
 const E=await server.ssrLoadModule('/src/rpg/engine.ts'),V=await server.ssrLoadModule('/src/rpg/voxel.ts'),L=await server.ssrLoadModule('/src/rpg/worldLandscape.ts'),R=await server.ssrLoadModule('/src/rpg/voxelRooms.ts'),S=await server.ssrLoadModule('/src/rpg/worldSave.ts');
 let now=1791500000000;const w=E.createWorld(42,undefined,0,now);E.addPlayer(w,'a','Explorer');w.started=true;const p=w.players.a;
 const anchor={x:p.x,y:p.y};p.position3D={x:92.5,z:-22.5,y:0};
 assert(E.applyAction(w,'a',{type:'voxel-snap'},now+=200));assert(p.position3D.surface2D);
 assert(E.applyAction(w,'a',{type:'move',dx:0,dy:-1},now+=200));assert.equal(p.position3D.z,-23.5);assert.deepEqual({x:p.x,y:p.y},anchor);
 assert(!Social.socialNear(p,{...p,id:'b',position3D:undefined}),'legacy return coordinates do not cause remote conversations');
 assert(Social.socialNear(p,{...p,id:'b',position3D:{...p.position3D,x:p.position3D.x+1}}));
 assert(!E.applyAction(w,'a',{type:'native-enter',siteId:w.sites[0].id},now+=200),'legacy scenes cannot be entered remotely');
 // Four gateways connect both coordinate systems without changing the legacy save array.
 p.position3D=undefined;p.x=92;p.y=1;p.lastMove=now-200;
 assert(E.applyAction(w,'a',{type:'move',dx:0,dy:-1},now+=200));assert.equal(p.y,0);
 assert(E.applyAction(w,'a',{type:'move',dx:0,dy:-1},now+=200));assert.equal(p.position3D.z,-.5);
 assert(E.applyAction(w,'a',{type:'move',dx:0,dy:1},now+=200));assert(!p.position3D);assert.equal(p.y,0);
 p.position3D={x:92.5,z:-22.5,y:0,surface2D:true};p.profile={hp:72,maxHp:72,gold:100,deck:[],deckSize:0,character:'WARRIOR',image:''};
 const save=S.makeWorldSave(w,'a',{currentHp:72,maxHp:72,gold:100,deck:[],relics:[],rpgMutationRevision:0},now);
 assert.deepEqual(S.restoreWorldSave(JSON.parse(JSON.stringify(save)),now+1000).players.a.position3D,p.position3D);
 // Tap routes go around solid two-block walls and remain executable by the authority.
 w.voxels??={edits:{},revision:0,terrainVersion:2};w.voxels.edits['92,0,-24']='stone';w.voxels.edits['92,1,-24']='stone';
 const route=V.findLandscapeRoute(w,p,92,-26);assert(route.some(s=>s.x!==92));assert.deepEqual(route.at(-1),{x:92,y:-26});
 for(const step of route){const dx=step.x-Math.floor(p.position3D.x),dy=step.y-Math.floor(p.position3D.z);assert(E.applyAction(w,'a',{type:'move',dx,dy},now+=200));}
 // Public buildings reward exploration only once, through the authority action.
 for(const l of L.LANDMARKS){p.position3D={x:l.x+.5,z:l.z+l.depth/2+1.5,y:l.kind==='tower'?268:0};assert(E.applyAction(w,'a',{type:'voxel-landmark'},now+=200));}
 assert.equal(p.life.bag.crystal,5);assert.equal(p.life.bag.steel,5);assert(E.applyAction(w,'a',{type:'voxel-landmark'},now+=200));assert.equal(p.life.bag.crystal,5);
 let bridge;for(let x=-130;x<-60;x++)if(L.waterProfile(x,46)&&L.roadAt(x,46)){bridge={x,z:46};break;}assert(bridge);
 const pool=L.waterProfile(bridge.x,bridge.z),h=L.landscapeHeight(w.seed,bridge.x,bridge.z);
 assert.equal(V.blockAt(w,bridge.x,h-1,bridge.z),'plank');assert.equal(V.blockAt(w,bridge.x,pool.surface-1,bridge.z),null);assert(V.solid(V.blockAt(w,bridge.x,pool.surface-pool.depth-1,bridge.z)));
 // Movement does not reset breath, even though it replaces the position object.
 p.position3D={x:150.5,z:180.5,y:-4,swimming:true,oxygen:8,waterAt:now};p.lastMove=now-200;
 for(let i=0;i<5;i++)assert(E.applyAction(w,'a',{type:'voxel-move',dx:.2,dy:0},now+=200));assert(p.position3D.oxygen<8);
 // Drowning protection finds clear water beside the bridge instead of entering its deck.
 p.position3D={x:150.5,z:180.5,y:-4,oxygen:1,waterAt:now};V.advanceVoxelWater(w,now+=1000);assert(p.position3D.y+V.EYE_HEIGHT>=1);assert(p.position3D.oxygen>0);
 const before=p.position3D.z;V.advanceVoxelWater(w,now+=1000);assert(p.position3D.z>before,'water currents also apply without input');
 // Enclosures/furniture registration beyond the old tile array use physical coordinates.
 w.voxels={edits:{},revision:0,terrainVersion:2};const x=95,z=-20,y=0;
 for(let dx=0;dx<6;dx++)for(let dz=0;dz<6;dz++)for(let dy=-1;dy<=2;dy++)if(dy===-1||dy===2||dx===0||dz===0||dx===5||dz===5)w.voxels.edits[V.voxelKey(x+dx,y+dy,z+dz)]='stone';
 w.voxels.edits[V.voxelKey(x+2,y,z+5)]='door';w.voxels.edits[V.voxelKey(x+2,y+1,z+5)]=null;
 p.position3D={x:x+2.5,z:z+4.5,y};assert(R.findEnclosure(w,{x:x+2,y,z:z+5}));assert(E.applyAction(w,'a',{type:'voxel-room-register',x:x+2,y,z:z+5},now+=300));assert(R.currentVoxelRoom(w,p));
 console.log('PASS exterior 2D/3D coordinates, gateways, scene isolation, save/load, five landmark rewards, open bridge water, oxygen/current authority and exterior rooms');
}finally{await server.close();}
