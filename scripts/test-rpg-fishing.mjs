import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {existsSync} from 'node:fs';
const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try{
 const {createWorld,addPlayer,applyAction,advanceWorld,WIDTH}=await server.ssrLoadModule('/src/rpg/engine.ts');
 const {FISH,chooseFish,fishSize,reelWindow,mergeFishRecords}=await server.ssrLoadModule('/src/rpg/fishing.ts');
 const {lifeWalkable}=await server.ssrLoadModule('/src/rpg/life.ts');
 const {BIOMES,biomeAt}=await server.ssrLoadModule('/src/rpg/biomes.ts');
 for(const seed of [1,42,82,9252026]){const map=createWorld(seed,undefined,30,10000);for(const b of BIOMES){const water=map.tiles.map((v,i)=>v==='water'&&biomeAt(i%WIDTH,Math.floor(i/WIDTH)).id===b.id?i:-1).filter(i=>i>=0);assert.ok(water.length>=10,`${b.id} must contain real fishable water`);assert.ok(water.some(tile=>[1,-1,WIDTH,-WIDTH].some(d=>lifeWalkable(map,(tile+d)%WIDTH,Math.floor((tile+d)/WIDTH)))),`${b.id} must have a walkable shore`);}}
 assert.equal(FISH.length,60);assert.equal(new Set(FISH.map(f=>f.id)).size,60);
 for(const b of BIOMES){assert.equal(FISH.filter(f=>f.biome===b.id).length,10);const tile=b.y*WIDTH+b.x,seen=new Set();for(let n=0;n<5000;n++){const f=chooseFish(42,tile,n);assert.equal(f.biome,b.id);seen.add(f.id);const size=fishSize(f.id,42,tile,n,n%5);assert.ok(size>=f.min&&size<=f.max);}assert.equal(seen.size,10,'All rarity tiers are reachable');}
 for(const f of FISH)assert.ok(existsSync(`public/sprites/rpg/fishing/${f.id}.webp`));
 const w=createWorld(82,undefined,30,10000);addPlayer(w,'p','P');addPlayer(w,'other','Other');w.started=true;w.deadlineAt=10000000;const p=w.players.p;p.x=20;p.y=20;const tile=20*WIDTH+19;w.tiles[tile]='water';let now=12000;
 const cast=()=>{p.life.energy=6;now+=1000;applyAction(w,p.id,{type:'life-cast',tile},now);assert.equal(p.life.energy,5);assert.equal(p.life.work.fishing.phase,'bite');return p.life.work;};
 const reel=(at)=>{const work=p.life.work;applyAction(w,p.id,{type:'life-reel',phaseTarget:work.target},at);now=at;};
 cast();reel(p.life.work.target-1);assert.equal(p.life.work,undefined);assert.equal(p.life.lastCatch,undefined,'Early strike fails');
 cast();const firstTarget=p.life.work.target;reel(firstTarget+100);assert.equal(p.life.work.fishing.phase,'reel');const nextTarget=p.life.work.target;assert.equal(applyAction(w,p.id,{type:'life-reel',phaseTarget:firstTarget},firstTarget+110),false,'Replayed phase cannot advance reel');assert.equal(p.life.work.target,nextTarget);
 for(let i=0;i<3;i++){reel(p.life.work.target);assert.equal(p.life.energy,5,'No additional energy for reel beats');}
 assert.equal(p.life.work,undefined);assert.ok(p.life.lastCatch.perfect);assert.ok(p.life.lastCatch.record);assert.equal(p.life.bag.fish,2);assert.equal(p.life.fishRecords[p.life.lastCatch.id].count,1);assert.equal(w.players.other.life.fishRecords,undefined,'Records isolated per player');const first=p.life.lastCatch;
 assert.equal(applyAction(w,p.id,{type:'life-reel',phaseTarget:nextTarget},now+10),false,'Duplicate catch rejected');
 cast();reel(p.life.work.target+100);reel(p.life.work.started+300);assert.ok(p.life.work);reel(p.life.work.started+300);assert.equal(p.life.work,undefined,'Two misses snap line');assert.equal(p.life.lastCatch.at,first.at);assert.equal(p.life.bag.fish,2);
 cast();const expires=p.life.work.expires;advanceWorld(w,expires+1);now=expires+1;assert.equal(p.life.work,undefined,'Timeout ends cast');assert.equal(p.life.energy,5);
 // Exactly two successful reel beats is a valid ordinary catch; out-of-range requests remain rejected.
 cast();reel(p.life.work.target+500);reel(p.life.work.started+300);for(let i=0;i<2;i++)reel(p.life.work.target+Math.floor(reelWindow(p.life.work.fishing.id)*.8));assert.ok(p.life.lastCatch.at>first.at);assert.equal(p.life.lastCatch.perfect,false);assert.equal(p.life.bag.fish,3);
 const id=first.id,merged=mergeFishRecords({[id]:{count:1,best:150,perfect:1}},{[id]:{count:2,best:75,perfect:0}});assert.equal(merged[id].best,150,'Smaller room record does not overwrite device record');assert.equal(merged[id].count,2);
 console.log('Fishing passed: 60 assets, biome pools, all rare fish reachable, bounded sizes, strike/reel phases, timing failure, duplicate protection, one energy per cast, catch quality, individual records and record merge.');
}finally{await server.close();}
