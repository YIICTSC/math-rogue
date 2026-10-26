import assert from 'node:assert/strict';
import {build} from 'esbuild';
import fs from 'node:fs';
import sharp from 'sharp';
import crypto from 'node:crypto';
const result=await build({stdin:{contents:"export * from './src/mini-games/star-tide/engine';export * from './src/mini-games/star-tide/visuals';export * from './src/mini-games/star-tide/enemyAI';export * from './src/mini-games/star-tide/scenery';export * from './src/mini-games/star-tide/rounding';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'node',write:false});
const M=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
let saved='';globalThis.localStorage={getItem:()=>saved,setItem:(_k,v)=>saved=v};
const legacy=M.fresh();delete legacy.hero;saved=JSON.stringify(legacy);assert.equal(M.load().hero,'nagi');
for(const h of M.HEROES){const s=M.fresh();s.hero=h.id;M.persist(s);assert.equal(M.load().hero,h.id);const w=new M.World(M.load());w.startNew();assert.equal(w.s.hero,h.id);}
saved=JSON.stringify({...M.fresh(),hero:'invalid'});assert.equal(M.load().hero,'nagi');
const motion={moving:true,walk:0,attack:0,effect:0,dash:0,hurt:0,gliding:false,time:0,dx:1,dy:0};
assert.equal(new Set(Array.from({length:8},(_,i)=>M.heroFrame({...motion,walk:i/14}).frame)).size,8);
assert.equal(M.heroFrame({...motion,moving:false,walk:3.2}).frame,2);
assert.equal(M.heroFrame({...motion,dy:-1,dx:0}).row,1);
assert.equal(M.heroFrame({...motion,attack:.2,dy:-1,dx:0}).sheet,'combo');
assert.equal(M.heroFrame({...motion,attack:.4,effect:3,dy:1,dx:0}).row,1);
assert.equal(M.heroFrame({...motion,dash:.15}).row,6);
assert.equal(M.heroFrame({...motion,attack:.4,effect:7,hurt:.5}).row,6,'Shield invulnerability must not show a damage pose');
assert.equal(M.heroFrame({...motion,gliding:true}).row,7);
assert.equal(new Set(M.BIOMES.map(b=>b.ja)).size,24);
const seen=new Set();
for(let chapter=0;chapter<12;chapter++)for(let room=0;room<24;room++){
 const s=M.fresh();Object.assign(s,{chapter,room});const w=new M.World(s);
 for(const e of w.enemies)if(!e.boss)seen.add(e.kind);
 if(room<8){const queue=[[2,7]],reachable=new Set(['2,7']);for(const[x,y]of queue)for(const[dx,dy]of[[0,1],[1,0],[0,-1],[-1,0]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!reachable.has(k)&&w.can(nx+.5,ny+.5)){reachable.add(k);queue.push([nx,ny]);}}
  for(const p of [{x:5.5,y:3.5},{x:14.5,y:5.5},{x:7.5,y:10.5},{x:15.5,y:10.5},{x:10.5,y:2.5},...(w.npc?[w.npc]:[])])assert(reachable.has(Math.floor(p.x)+','+Math.floor(p.y)),'Field interaction must be reachable without the glider');
 }

 for(const p of M.sceneryFor(w))if(p.y>1&&p.y<13)assert.equal(w.map[Math.floor(p.y)][Math.floor(p.x)],3,'Large scenery must have a blocked footprint');
}
assert.equal(seen.size,24,'All species must spawn in the campaign');
assert.equal(new Set(M.ENEMIES.map(e=>e.behavior)).size,6);
for(let kind=0;kind<24;kind++){
 const w=new M.World(M.fresh());w.map=Array.from({length:14},()=>Array(20).fill(0));w.x=6;w.y=7;w.hurt=999;
 const e={x:10,y:7,hp:100,max:100,kind,cool:0,phase:0};w.enemies=[e];
 M.stepEnemy(w,e,.035);assert.equal(M.enemyFrame(e),4,'Every species telegraphs its attack');
 let attacks=0;for(let i=0;i<150;i++){M.stepEnemy(w,e,.035);if(M.enemyFrame(e)===5)attacks++;assert(w.enemyCan(e.x,e.y));}
 assert(attacks>0,'Windup should lead to the attack frame');
 if(['ranged','sentry'].includes(M.ENEMIES[kind].behavior))assert(w.shots.length>0,'Ranged enemies must really shoot');
}
const charge=new M.World(M.fresh());charge.map=Array.from({length:14},()=>Array(20).fill(0));charge.x=5;charge.y=7;charge.hurt=999;const crab={x:10,y:7,hp:10,max:10,kind:0,cool:0,phase:0};M.stepEnemy(charge,crab,.035);charge.x=10;charge.y=11;for(let i=0;i<21;i++)M.stepEnemy(charge,crab,.035);assert(crab.x<10&&Math.abs(crab.y-7)<.05,'A telegraphed charge must keep its stored aim');
charge.gliding=true;charge.map[7][9]=2;assert(charge.can(9.5,7.5));assert(!charge.enemyCan(9.5,7.5),'Player gliding must not remove enemy collision');
for(let i=0;i<100;i++)charge.burst(4,4);assert(charge.fx.length<=32);
const single=Array.from({length:5},()=>Array(5).fill(0));single[2][2]=2;assert.deepEqual(M.corners(single,2,2,2),Array(4).fill('outer'));assert(!M.roundedSolid(single,2.01,2.01,2));assert(M.roundedSolid(single,2.5,2.5,2));single[1][2]=single[2][1]=2;assert.equal(M.corners(single,2,2,2)[0],'inner');assert(!M.roundedSolid(single,2.01,2.01,2));assert(M.roundedSolid(single,2.4,2.4,2));single[1][1]=2;assert.equal(M.corners(single,2,2,2)[0],'flat');
for(let mask=0;mask<256;mask++){const a=Array.from({length:3},()=>Array(3).fill(0));a[1][1]=2;let bit=0;for(let y=0;y<3;y++)for(let x=0;x<3;x++)if(x!==1||y!==1)a[y][x]=mask&(1<<bit++)?2:0;const cs=M.corners(a,1,1,2);assert.equal(cs.length,4);assert(cs.every(c=>['outer','inner','flat'].includes(c)));assert(M.roundedSolid(a,1.5,1.5,2));}
const art=JSON.parse(fs.readFileSync('assets/star-tide/graphics.json'));
assert.equal(art.sheets.length,M.UPGRADE_SHEETS.length);
for(const spec of M.UPGRADE_SHEETS){
 const record=art.sheets.find(s=>s.id===spec.id);assert(record);const bytes=fs.readFileSync('public/'+record.output);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),record.outputSha256);
 const meta=await sharp(bytes).metadata();assert.equal(meta.width,spec.columns*record.frameSize);assert.equal(meta.height,spec.rows*record.frameSize);
 if(spec.transparent)assert(meta.hasAlpha);
 const hashes=new Set();
 for(let row=0;row<spec.rows;row++)for(let col=0;col<spec.columns;col++){
  const{data,info}=await sharp(bytes).extract({left:col*record.frameSize,top:row*record.frameSize,width:record.frameSize,height:record.frameSize}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let ink=0;for(let p=3;p<data.length;p+=4)if(data[p]>64)ink++;
  assert(ink>50,`${spec.id}:${row}:${col} empty`);
  if(spec.transparent&&!spec.id.endsWith('-rounding'))for(let x=0;x<record.frameSize;x++){assert.equal(data[x*4+3],0,'Top gutter');assert.equal(data[((record.frameSize-1)*info.width+x)*4+3],0,'Foot gutter');}
  for(let p=0;p<data.length;p+=4)if(data[p+3]===0)data[p]=data[p+1]=data[p+2]=0;
  hashes.add(crypto.createHash('sha256').update(data).digest('hex'));
 }
 assert(hashes.size>=spec.rows*spec.columns*.8,`${spec.id}: repeated frames`);
}
for(const path of ['public/web-asset-manifest.json','public/android-asset-pack-manifest.json']){
 const manifest=JSON.parse(fs.readFileSync(path)),files=new Set(Object.values(manifest.packs).flatMap(p=>p.files.map(f=>f.path)));
 for(const r of art.sheets)assert(files.has(r.output),`${path} missing ${r.output}`);
}
console.log('PASS: Nagi save migration, expanded Nagi walk/combat frames, 24 species/six actual AI patterns, 24 biomes, terrain collision, bounded effects, 192 R tiles/256 neighbor layouts, all normalized art frames and both delivery manifests.');
