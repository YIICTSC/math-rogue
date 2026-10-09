import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try{
 const E=await server.ssrLoadModule('/src/rpg/engine.ts'),V=await server.ssrLoadModule('/src/rpg/voxel.ts'),L=await server.ssrLoadModule('/src/rpg/worldLandscape.ts'),S=await server.ssrLoadModule('/src/rpg/worldSave.ts');
 let now=1791500000000;const w=E.createWorld(42,undefined,0,now);E.addPlayer(w,'a','Explorer');w.started=true;const p=w.players.a;
 assert.equal(L.WORLD_SCALE.playerHeight,1.78);assert.equal(L.WORLD_SCALE.block,1);
 for(const m of L.MOUNTAINS){assert(L.landscapeHeight(w.seed,m.x,m.z)>200);let previous=0;for(let i=0;i<=2000;i++){const r=m.radius*(1-i/2000),angle=i/2000*Math.PI*8,x=m.x+r*Math.cos(angle),z=m.z+r*Math.sin(angle);const h=L.mountainHeight(x,z);if(i)assert(Math.abs(h-previous)<1);previous=h;}}
 const anchor={x:p.x,y:p.y};p.position3D={x:92.5,z:-.2,y:0};p.lastMove=now-300;
 assert(E.applyAction(w,'a',{type:'voxel-move',dx:0,dy:-.32},now+=100));assert.deepEqual({x:p.x,y:p.y},anchor,'exterior travel keeps a valid legacy return tile');assert(p.position3D.z<-.2);
 // The walkable academy opening admits an adult-sized player; its facade is solid.
 const school=L.LANDMARKS[0],front=school.z+school.depth/2;
 assert(V.bodyClear(w,school.x,front-1,1));assert(!V.bodyClear(w,school.x+5,front-1,1));
 p.position3D={x:school.x+.5,z:front+1.5,y:0};for(let i=0;i<15;i++)assert(E.applyAction(w,'a',{type:'voxel-move',dx:0,dy:-.32},now+=100));assert(p.position3D.z<front,'walk through the opening');
 p.position3D={x:92.5,z:-10.5,y:0};assert(E.applyAction(w,'a',{type:'voxel-jump'},now+=500));let peak=0;for(let i=0;i<20;i++){E.applyAction(w,'a',{type:'voxel-move',dx:0,dy:0},now+=80);peak=Math.max(peak,p.position3D.y);}assert(peak>.7&&peak<1.5);assert.equal(p.position3D.y,0);
 const pool=L.waterProfile(150,180);assert(pool.depth>=10);const bed=V.terrainHeight(w,150,180);assert.equal(V.blockAt(w,150,bed-1,180),'gravel');assert.equal(V.blockAt(w,150,bed+1,180),null);
 p.position3D={x:150.5,z:180.5,y:pool.surface-1.3};for(let i=0;i<4;i++)assert(E.applyAction(w,'a',{type:'voxel-dive'},now+=100));assert(p.position3D.y+V.EYE_HEIGHT<pool.surface);assert(E.applyAction(w,'a',{type:'voxel-jump'},now+=100));
 p.profile={hp:72,maxHp:72,gold:100,deck:[],deckSize:0,character:'WARRIOR',image:''};const player={currentHp:72,maxHp:72,gold:100,deck:[],relics:[],rpgMutationRevision:0};
 const restored=S.restoreWorldSave(JSON.parse(JSON.stringify(S.makeWorldSave(w,'a',player,now))),now+1000);assert.deepEqual(restored.players.a.position3D,{...p.position3D,waterAt:p.position3D.waterAt+1000});assert.equal(restored.tiles.length,E.WIDTH*E.HEIGHT);
 p.position3D={x:92.5,z:-22.5,y:0};assert(E.applyAction(w,'a',{type:'voxel-snap'},now+=100));assert(p.position3D?.surface2D);assert.equal(Math.floor(p.position3D.x),92);assert.equal(Math.floor(p.position3D.z),-23);assert.deepEqual({x:p.x,y:p.y},anchor);
 const trace=V.traceVoxel(w,{x:92.5,y:2,z:-10.5},{x:0,y:-1,z:0});assert(trace&&trace.y===-1&&trace.normal.y===1);
 console.log('PASS metre scale, mountain ascent grades, extended travel, collidable entry, jump/landing, lake bed/diving, save/load and exterior 2D preservation, voxel ray');
}finally{await server.close();}
