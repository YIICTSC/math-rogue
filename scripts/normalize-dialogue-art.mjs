import fs from 'node:fs/promises';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
const plan=JSON.parse(await fs.readFile('assets/dialogue/cast.json','utf8'));
const generation=JSON.parse(await fs.readFile('assets/dialogue/generation.json','utf8'));
const partial=process.argv.includes('--partial'),W=384,H=576,P=20,version=4;
await fs.mkdir('public/sprites/dialogue',{recursive:true});
const portrait={},reports=[];
const previous=await fs.readFile('assets/dialogue/atlas-layouts.json','utf8').then(JSON.parse).catch(()=>({}));
function register(record,report){
 record.actors.forEach((id,row)=>{const actor=plan.cast.find(a=>a.id===id);if(!actor||portrait[id])throw Error('Unknown or duplicate dialogue actor: '+id);const top=Math.max(0,Math.min(...report.frames.filter(f=>f.row===row).map(f=>H-P-Math.round(f.bounds[3]*f.scale)))-P);portrait[id]={sheet:report.output,row,columns:4,rows:2,width:W,height:H,top,...(actor.focusX?{focusX:actor.focusX}:{}),name:actor.name,en:actor.en,...(actor.reference.startsWith('public/')?{fallback:actor.reference.slice(7)}:{})};});
 reports.push(report);
}
function splitRow(data,width,height,y0){
 const size=width*height,visited=new Uint8Array(size),queue=new Int32Array(size),components=[];
 const alpha=i=>data[((Math.floor(i/width)+y0)*width+i%width)*4+3];
 function findFigures(limit=size){
 visited.fill(0);components.length=0;
 for(let start=0;start<limit;start++){
  if(visited[start]||alpha(start)<40)continue;
  let head=0,tail=0;queue[tail++]=start;visited[start]=1;
  while(head<tail){const i=queue[head++],x=i%width,y=Math.floor(i/width);for(const n of [x?i-1:-1,x<width-1?i+1:-1,y?i-width:-1,y<height-1?i+width:-1])if(n>=0&&n<limit&&!visited[n]&&alpha(n)>=40){visited[n]=1;queue[tail++]=n;}}
  if(tail>size/1500){const pixels=queue.slice(0,tail);let min=width,max=0;for(const i of pixels){min=Math.min(min,i%width);max=Math.max(max,i%width);}components.push({pixels,area:tail,cx:(min+max)/2});}
 }
 components.sort((a,b)=>b.area-a.area);return components.slice(0,4).sort((a,b)=>a.cx-b.cx);
 }
 const valid=figures=>figures.length===4&&figures.every(c=>c.area>=figures[0].area*.13)&&figures.every((c,i)=>!i||c.cx-figures[i-1].cx>=width*.1);
 let mains=findFigures();
 // Long hair and sleeves can touch at the atlas gutters. Separate head regions
 // provide four unambiguous packing seeds without repainting any source pixel.
 if(!valid(mains))mains=findFigures(width*Math.floor(height*.4));
 if(!valid(mains))throw new Error('Expected four separate reaction figures; inspect the source atlas.');
 // Assign disconnected accessories and anti-aliased edges to the nearest figure.
 // Pixels are preserved; only atlas packing, common scale and anchors change.
 const owner=new Int8Array(size).fill(-1);let head=0,tail=0;
 mains.forEach((c,k)=>{for(const i of c.pixels){owner[i]=k;queue[tail++]=i;}});
 while(head<tail){const i=queue[head++],x=i%width,y=Math.floor(i/width);for(const n of [x?i-1:-1,x<width-1?i+1:-1,y?i-width:-1,y<height-1?i+width:-1])if(n>=0&&owner[n]<0){owner[n]=owner[i];queue[tail++]=n;}}
 const frames=Array.from({length:4},()=>({minX:width,minY:height,maxX:0,maxY:0,pixels:0,headX:0,weight:0}));
 for(let i=0;i<size;i++)if(alpha(i)>4){const f=frames[owner[i]],x=i%width,y=Math.floor(i/width);f.minX=Math.min(f.minX,x);f.maxX=Math.max(f.maxX,x);f.minY=Math.min(f.minY,y);f.maxY=Math.max(f.maxY,y);f.pixels++;}
 for(let i=0;i<size;i++)if(alpha(i)>=40){const f=frames[owner[i]],y=Math.floor(i/width);if(y<=f.minY+(f.maxY-f.minY)*.22){f.headX+=(i%width)*alpha(i);f.weight+=alpha(i);}}
 for(const f of frames){f.anchor=f.headX/f.weight;if(!Number.isFinite(f.anchor)||f.pixels<1000)throw new Error('Reaction frame is empty.');}
 const left=Math.max(...frames.map(f=>f.anchor-f.minX)),right=Math.max(...frames.map(f=>f.maxX-f.anchor)),maxHeight=Math.max(...frames.map(f=>f.maxY-f.minY+1));
 const scale=Math.min((W/2-P)/Math.max(1,left),(W/2-P)/Math.max(1,right),(H-P*2)/maxHeight),target=W/2;
 return {frames,owner,scale,target};
}
for(const record of [...generation.records].sort((a,b)=>a.id.localeCompare(b.id))){
 const source=await fs.readFile(record.raw),rawHash=createHash('sha256').update(source).digest('hex');
 const cached=previous.version===version&&previous.reports?.find(r=>r.id===record.id&&r.rawSha256===rawHash&&r.actors.join()===record.actors.join());
 if(cached){const file=await fs.readFile('public/'+cached.output).catch(()=>null);if(file&&createHash('sha256').update(file).digest('hex')===cached.sha256){register(record,cached);continue;}}
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true}),composite=[],details=[];
 // Generated rows can sit a few pixels above/below the mathematical midpoint.
 // Split at their transparent gutter so a skirt hem cannot enter the next face.
 const density=new Uint32Array(info.height);for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>=40)density[y]++;
 let divider=Math.floor(info.height/2),best=Infinity;
 for(let y=Math.floor(info.height*.44);y<info.height*.56;y++){const score=density[y-1]+density[y]+density[y+1]+Math.abs(y-info.height/2)*.01;if(score<best){best=score;divider=y;}}
 for(let row=0;row<2;row++){
  const y0=row?divider:0,rowHeight=row?info.height-divider:divider,{frames,owner,scale,target}=splitRow(data,info.width,rowHeight,y0);
  for(let column=0;column<4;column++){
   const f=frames[column],bw=f.maxX-f.minX+1,bh=f.maxY-f.minY+1,rgba=Buffer.alloc(bw*bh*4);
   for(let y=f.minY;y<=f.maxY;y++)for(let x=f.minX;x<=f.maxX;x++)if(owner[y*info.width+x]===column){const src=((y+y0)*info.width+x)*4,dst=((y-f.minY)*bw+x-f.minX)*4;data.copy(rgba,dst,src,src+4);}
   const dw=Math.max(1,Math.round(bw*scale)),dh=Math.max(1,Math.round(bh*scale)),left=Math.max(0,Math.min(W-dw,Math.round(target-(f.anchor-f.minX)*scale))),top=H-P-dh;
   const image=await sharp(rgba,{raw:{width:bw,height:bh,channels:4}}).resize(dw,dh,{kernel:'nearest'}).png().toBuffer();
   composite.push({input:image,left:column*W+left,top:row*H+top});details.push({row,column,scale,anchor:target,bounds:[f.minX,f.minY,bw,bh]});
  }
 }
 const png=await sharp({create:{width:W*4,height:H*2,channels:4,background:'#00000000'}}).composite(composite).png().toBuffer();
 const encoded=await sharp(png).webp({quality:94,alphaQuality:100,effort:5}).toBuffer(),hash=createHash('sha256').update(encoded).digest('hex'),path=`sprites/dialogue/${record.id}-${hash.slice(0,10)}.webp`;
 await fs.writeFile('public/'+path,encoded);
 register(record,{id:record.id,raw:record.raw,rawSha256:rawHash,output:path,sha256:hash,bytes:encoded.length,actors:record.actors,divider,frames:details});
 console.log(record.id,record.actors.join(' / '));
}
const missing=plan.cast.filter(a=>!portrait[a.id]);if(missing.length&&!partial)throw Error(`Missing reaction art: ${missing.map(a=>a.id).join(', ')}`);
await fs.writeFile('src/data/dialoguePortraits.generated.ts','// Generated by scripts/normalize-dialogue-art.mjs.\nexport const DIALOGUE_PORTRAITS:Record<string,{sheet:string;row:number;columns:number;rows:number;width:number;height:number;top:number;focusX?:number;name:string;en:string;fallback?:string}> = '+JSON.stringify(portrait,null,2)+';\n');
await fs.writeFile('assets/dialogue/atlas-layouts.json',JSON.stringify({version,frameWidth:W,frameHeight:H,reports},null,2)+'\n');
console.log(`${Object.keys(portrait).length}/${plan.cast.length} characters packed; ${missing.length} pending.`);
