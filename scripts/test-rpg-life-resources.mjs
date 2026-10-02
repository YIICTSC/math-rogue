import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {readFile} from 'node:fs/promises';
const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true},appType:'custom',logLevel:'error'});
try {
 const {createWorld,addPlayer,applyAction,WIDTH,HEIGHT}=await server.ssrLoadModule('/src/rpg/engine.ts');
 const {natureAt,isResourceTile}=await server.ssrLoadModule('/src/rpg/life.ts');
 const w=createWorld(77,undefined,30,10000);addPlayer(w,'tester','Tester');const p=w.players.tester;
 for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++)if(x===0||y===0||x===WIDTH-1||y===HEIGHT-1){const tile=y*WIDTH+x;assert.equal(natureAt(w,tile),null);assert.equal(isResourceTile(w,tile),false);}
 p.x=1;p.y=10;assert.equal(applyAction(w,p.id,{type:'life-work',tile:10*WIDTH},11000),false);assert.equal(p.life.work,undefined);
 const tile=w.tiles.findIndex((t,i)=>t==='forest'&&isResourceTile(w,i));assert.ok(natureAt(w,tile));p.x=tile%WIDTH;p.y=Math.floor(tile/WIDTH);assert.equal(applyAction(w,p.id,{type:'life-work',tile},12000),true);assert.ok(p.life.work);
 // Pages replaces absolute /sprites/ literals. Paths passed to assetUrl must stay relative.
 for(const file of ['src/rpg/WorldCanvas.tsx']){const source=await readFile(file,'utf8');assert.ok(source.includes("assetUrl('sprites/rpg/frontier-atlas.webp')"));assert.ok(!source.includes("assetUrl('/sprites/rpg/frontier-atlas.webp')"));}
 console.log('RPG life: border exclusion, authority rejection, interior gathering and Pages atlas paths passed.');
} finally {await server.close();}
