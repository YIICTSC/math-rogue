import assert from'node:assert/strict';import{build}from'esbuild';
const r=await build({stdin:{contents:"export * from './src/mini-games/star-tide/engine';export * from './src/mini-games/star-tide/elevation';export{BIOMES}from'./src/mini-games/star-tide/visuals';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});const M=await import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));
assert.equal(M.BIOMES.length,30);assert(!M.canTraverseHeight(0,0,{x:1.9,y:3},{x:2.1,y:3}));assert(!M.canTraverseHeight(0,0,{x:2.1,y:3},{x:1.9,y:3}));assert(M.canTraverseHeight(0,0,{x:2.1,y:3},{x:1.9,y:3},true));assert(!M.canTraverseHeight(0,0,{x:1.9,y:3},{x:2.1,y:3},true));
for(let chapter=0;chapter<12;chapter++)for(let room=0;room<8;room++){
 const s=M.fresh();Object.assign(s,{chapter,room});const w=new M.World(s);w.enemies=[];
 const start=[10,30],seen=new Set(['10,30']),queue=[start];
 for(let i=0;i<queue.length;i++){const [x,y]=queue[i];w.x=x/4;w.y=y/4;for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(nx<2||ny<2||nx>77||ny>53||seen.has(k)||!w.can(nx/4,ny/4))continue;seen.add(k);queue.push([nx,ny]);}}
 const goals=[[5.5,9.5],[8.5,6.5],[12.5,6.5],[10.5,6.5],[5.5,3.5],[14.5,5.5],[7.5,10.5],...M.terracesFor(chapter,room).map(t=>{const p=M.vistaPoint(t);return[p.x,p.y];})];if(room===0)goals.push([15.5,10.5],[10.5,2.5],[15.5,3.5]);if(w.npc)goals.push([w.npc.x,w.npc.y]);
 for(const [x,y]of goals)assert(seen.has(Math.round(x*4)+','+Math.round(y*4)),`unreachable ${chapter}:${room} at ${x},${y}`);
 for(const t of M.terracesFor(chapter,room)){w.x=t.rampX+.5;w.y=t.y+t.height+.35;w.travel=1;for(let i=0;i<24;i++)w.move(0,-1,.035);assert(w.y<t.y+t.height-1,`real stair movement blocked ${chapter}:${room}`);}
 const t=M.terracesFor(chapter,room)[0],p=M.vistaPoint(t);w.x=p.x;w.y=p.y;w.attack=0;assert(w.vista);w.swing();assert.equal(w.s.inventory.ore,2);assert(w.s.foraged.some(k=>k.includes(':vista:')));w.attack=0;w.swing();assert.equal(w.s.inventory.ore,2,'No repeated terrace rewards');
}
for(let room=8;room<24;room++)assert.equal(M.elevationAt(0,room,3,3),0);
console.log('PASS 30 biomes, real stair/cliff/glide traversal, all 96 field maps retain access to existing mechanisms, NPCs, camps, forage and new terrace rewards; indoor puzzles remain flat.');
