import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try {
 const {WIDTH,HEIGHT,createWorld}=await server.ssrLoadModule('/src/rpg/engine.ts');
 const {findWalkingRoute}=await server.ssrLoadModule('/src/rpg/walking.ts');
 const w=createWorld(12);w.tiles=Array(WIDTH*HEIGHT).fill('grass');
 for(let y=1;y<10;y++)w.tiles[y*WIDTH+8]='water';
 const route=findWalkingRoute(w,5,5,12,5);assert(route.length>7);assert.deepEqual(route.at(-1),{x:12,y:5});
 let p={x:5,y:5};for(const n of route){assert.equal(Math.abs(n.x-p.x)+Math.abs(n.y-p.y),1);assert.notEqual(w.tiles[n.y*WIDTH+n.x],'water');p=n;}
 const edge=findWalkingRoute(w,5,5,8,5);assert.deepEqual(edge.at(-1),{x:7,y:5});
 assert.deepEqual(findWalkingRoute(w,5,5,5,5),[]);assert.deepEqual(findWalkingRoute(w,5,5,-1,2),[]);
 const generated=createWorld(17),from=generated.sites[0],to=generated.sites.find(s=>s.kind==='boss');
 assert.deepEqual(findWalkingRoute(generated,from.x,from.y,to.x,to.y).at(-1),{x:to.x,y:to.y});
 console.log('Click walking: obstacle detours, unreachable tile edge, arrival and expanded-world route passed.');
}finally{await server.close();}
