import fs from'node:fs/promises';import sharp from'sharp';import assert from'node:assert/strict';
const metrics=JSON.parse(await fs.readFile('src/point-exchange/portraitMetrics.json'));assert.equal(Object.keys(metrics).length,85);let poses=0,vacation=0;
for(const[id,hero]of Object.entries(metrics))for(const[k,s]of Object.entries(hero)){
 if(k==='vacation')vacation++;const{data,info}=await sharp('public/'+s.path).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(info.width,s.width);assert.equal(info.height,s.height);const h=id.startsWith('elementary-')?s.height/2:s.height;
 for(const[frame,b]of s.frames.entries()){
  assert(b.w>0&&b.h>0&&b.x>=0&&b.y>=0&&b.x+b.w<=s.cellWidth&&b.y+b.h<=h,id+' frame bounds');
  const opaque=(x,y)=>data[(y*s.width+frame*s.cellWidth+x)*info.channels+info.channels-1]>96;
  assert(Array.from({length:b.w},(_,x)=>opaque(b.x+x,b.y)).some(Boolean),id+' tight top');assert(Array.from({length:b.w},(_,x)=>opaque(b.x+x,b.y+b.h-1)).some(Boolean),id+' tight bottom');assert(Array.from({length:b.h},(_,y)=>opaque(b.x,b.y+y)).some(Boolean),id+' tight left');assert(Array.from({length:b.h},(_,y)=>opaque(b.x+b.w-1,b.y+y)).some(Boolean),id+' tight right');poses++;
 }
}
assert.equal(vacation,44);console.log(`PASS ${poses} pose records with tight alpha bounds, valid source sheets, 85 normal protagonists and 44 vacation sets.`);
