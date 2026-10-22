import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
const input=process.argv[2];if(!input)throw Error('Usage: node scripts/prepare-home-dash-visuals.mjs <source-list.json>');
const sources=JSON.parse(await fs.readFile(input,'utf8'));
const slots={
 items:['coin','star','magnet','shield','double','sneakers','board','rocket','lowGravity','gravity','wave','charge','orb','pad','boost','laserEmitter'],
 hazards:['boss','missile','saw','spike','tunnel','wall','gate','rail','step','elevator','spring','glider','paperWyvern','waterSlime','fireFly','windSpirit'],
 enemies:['BACKPACK','VAULTING','CHALKBOARD','BIRD','IRON_BARRIER','JUMPING_SLIME','DRONE','TEACHER_RUNNER','HALL_MONITOR','CURRICULUM_BOOK','LAB_BOTTLE','BASKETBALL_TURRET','CLOCK_GHOST','SHOE_ROLLER','FIRE_FLY','WIND_SPIRIT'],
};
const out='public/sprites/go-home-dash';await fs.mkdir(`${out}/art`,{recursive:true});await fs.mkdir(`${out}/slides`,{recursive:true});
const frames={},records=[];
async function cellsOf(source,cols,rows){
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});const cells=[];
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const left=Math.round(col*info.width/cols),top=Math.round(row*info.height/rows),w=Math.round((col+1)*info.width/cols)-left,h=Math.round((row+1)*info.height/rows)-top;
  let x0=w,y0=h,x1=-1,y1=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[((top+y)*info.width+left+x)*4+3]>48){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  if(x1<0||y1<0)throw Error(`Empty sprite ${source} at ${col},${row}`);
  // Include a little transparent antialiasing outside the visible silhouette.
  x0=Math.max(0,x0-2);y0=Math.max(0,y0-2);x1=Math.min(w-1,x1+2);y1=Math.min(h-1,y1+2);
  cells.push({left:left+x0,top:top+y0,width:x1-x0+1,height:y1-y0+1});
 }
 return cells;
}
// Isolate silhouettes rather than assuming the generator obeyed an exact grid.
async function atlasCells(source){
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width:w,height:h}=info,n=w*h,labels=new Int32Array(n),queue=new Int32Array(n),parts=[];
 for(let k=0;k<n;k++)if(!labels[k]&&data[k*4+3]>48){
  const id=parts.length+1;let head=0,tail=1;queue[0]=k;labels[k]=id;
  let x0=w,y0=h,x1=0,y1=0;
  while(head<tail){const a=queue[head++],x=a%w,y=Math.floor(a/w);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
   for(const b of [x>0?a-1:-1,x<w-1?a+1:-1,y>0?a-w:-1,y<h-1?a+w:-1])if(b>=0&&!labels[b]&&data[b*4+3]>48){labels[b]=id;queue[tail++]=b;}
  }parts.push({id,area:tail,x0,y0,x1,y1});
 }
 const major=parts.slice().sort((a,b)=>b.area-a.area).slice(0,16).sort((a,b)=>(a.y0+a.y1)-(b.y0+b.y1));
 const ordered=[];for(let r=0;r<4;r++)ordered.push(...major.slice(r*4,r*4+4).sort((a,b)=>a.x0-b.x0));
 const owners=new Int32Array(parts.length+1);
 for(const part of parts){const own=ordered.findIndex(m=>m.id===part.id);if(own>=0){owners[part.id]=own+1;continue;}let best=Infinity,owner=0;ordered.forEach((m,i)=>{const dx=Math.max(0,m.x0-part.x1,part.x0-m.x1),dy=Math.max(0,m.y0-part.y1,part.y0-m.y1),d=dx*dx+dy*dy;if(d<best){best=d;owner=i+1;}});owners[part.id]=owner;}
 const cells=[];
 for(let i=0;i<16;i++){
  const mask=new Uint8Array(n);for(let k=0;k<n;k++)if(labels[k]&&owners[labels[k]]===i+1)mask[k]=1;
  const kept=new Uint8Array(n);let x0=w,y0=h,x1=-1,y1=-1;
  for(let k=0;k<n;k++)if(mask[k]){const x=k%w,y=Math.floor(k/w);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h)kept[yy*w+xx]=1;}}
  for(let k=0;k<n;k++)if(kept[k]&&data[k*4+3]){const x=k%w,y=Math.floor(k/w);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  const width=x1-x0+1,height=y1-y0+1,buf=Buffer.alloc(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const k=(y+y0)*w+x+x0;if(kept[k])data.copy(buf,(y*width+x)*4,k*4,k*4+4);}
  cells.push({left:x0,top:y0,width,height,input:await sharp(buf,{raw:{width,height,channels:4}}).png().toBuffer()});
 }return cells;
}
for(const entry of sources){
 const {id,source}=entry;const record={id,source:path.basename(source),source_sha256:crypto.createHash('sha256').update(await fs.readFile(source)).digest('hex')};
 if(entry.reference){record.reference=path.relative(process.cwd(),entry.reference);record.reference_sha256=crypto.createHash('sha256').update(await fs.readFile(entry.reference)).digest('hex');}
 if(slots[id]){
  const cells=await atlasCells(source),composite=[];
  for(let i=0;i<cells.length;i++){
   const c=cells[i],scale=Math.min(224/c.width,224/c.height),width=Math.round(c.width*scale),height=Math.round(c.height*scale);
   const x=i%4*256+Math.round((256-width)/2),y=Math.floor(i/4)*256+Math.round((256-height)/2);
   composite.push({input:await sharp(c.input).resize(width,height).png().toBuffer(),left:x,top:y});
   frames[slots[id][i]]={sheet:id,x,y,width,height};
  }
  await sharp({create:{width:1024,height:1024,channels:4,background:'#00000000'}}).composite(composite).webp({quality:92,alphaQuality:100}).toFile(`${out}/art/${id}.webp`);
  record.kind='atlas';record.layout=[4,4];record.cells=cells.map(({input,...bounds})=>bounds);
 }else{
  const cells=await cellsOf(source,2,1),scale=Math.min(144/Math.max(...cells.map(c=>c.width)),46/Math.max(...cells.map(c=>c.height))),composite=[];
  for(let i=0;i<2;i++){
   const c=cells[i],width=Math.round(c.width*scale),height=Math.round(c.height*scale);
   composite.push({input:await sharp(source).extract(c).resize(width,height).png().toBuffer(),left:i*160+Math.round((160-width)/2),top:74-height});
  }
  await sharp({create:{width:320,height:80,channels:4,background:'#00000000'}}).composite(composite).webp({quality:94,alphaQuality:100}).toFile(`${out}/slides/${id}.webp`);
  record.kind='slide';record.layout=[2,1];record.frameSize=[160,80];record.anchor=[80,74];record.scale=scale;record.cells=cells.map(({input,...bounds})=>bounds);
 }
 record.output=`${out}/${record.kind==='atlas'?'art':'slides'}/${id}.webp`;
 record.output_sha256=crypto.createHash('sha256').update(await fs.readFile(record.output)).digest('hex');
 records.push(record);
}
if(['items','hazards','enemies'].every(id=>sources.some(s=>s.id===id))){
 await fs.writeFile('src/mini-games/go-home-dash/artFrames.ts',`// Generated by scripts/prepare-home-dash-visuals.mjs.\nexport const ART_FRAMES = ${JSON.stringify(frames,null,2)} as const;\n`);
}
await fs.writeFile('assets/go-home-dash/visual-build.json',JSON.stringify({generator:'ImageGen',atlases:[1024,1024],slideFrames:2,records},null,2)+'\n');
console.log(`Prepared ${records.filter(r=>r.kind==='atlas').length} atlases and ${records.filter(r=>r.kind==='slide').length} sliding strips.`);
