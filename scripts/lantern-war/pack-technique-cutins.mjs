import fs from 'node:fs/promises';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {isolatedCutinRects} from './cutin-isolation.mjs';
const plan=JSON.parse(await fs.readFile('assets/lantern-war/technique-cutins-plan.json','utf8'));
const out='public/sprites/lantern-war/cutins';await fs.mkdir(out,{recursive:true});
const report=[];
for(const job of plan){
 const source=await fs.readFile(job.source),m=await sharp(source).metadata();
 assert(m.hasAlpha,job.id+' needs transparent artwork');
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {rects,gutters}=isolatedCutinRects(data,info.width,info.height);
 const frames=[];
 for(let i=0;i<4;i++){
  const cell=await sharp(source).extract(rects[i]).png().toBuffer();
  const name=['art1','art2','art3','ultimate'][i],file=`${out}/${job.id}-${name}.webp`;
  // Trim only empty transparency inside this complete cell, never borrow adjacent pixels.
  const trimmed=await sharp(cell).trim({background:'#00000000',threshold:1}).png().toBuffer({resolveWithObject:true});
  const pixels=await sharp(trimmed.data).ensureAlpha().raw().toBuffer();
  let x0=trimmed.info.width,y0=trimmed.info.height,x1=0,y1=0;
  for(let y=0;y<trimmed.info.height;y++)for(let x=0;x<trimmed.info.width;x++)if(pixels[(y*trimmed.info.width+x)*4+3]>32){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  // Very faint distant glow must not make the actual illustration appear smaller.
  // Preserve that glow, but use the visible silhouette to choose the scale.
  const fullLongEdge=Math.max(trimmed.info.width,trimmed.info.height);
  const contentLongEdge=Math.min(784,Math.round(fullLongEdge*720/Math.max(x1-x0+1,y1-y0+1)));
  const normalizationScale=contentLongEdge/fullLongEdge;
  assert(normalizationScale<=2.5,job.id+' '+name+': regenerate a higher-resolution source instead of excessive enlargement');
  const padding=(816-contentLongEdge)/2;
  await sharp(trimmed.data).resize(contentLongEdge,contentLongEdge,{fit:'contain',background:'#00000000',kernel:'lanczos3'}).extend({left:Math.floor(padding),right:Math.ceil(padding),top:Math.floor(padding),bottom:Math.ceil(padding),background:'#00000000'}).webp({quality:93,alphaQuality:100}).toFile(file);
  frames.push({skill:name,name:job.names[i],file,sourceRect:rects[i],trimmedSize:[trimmed.info.width,trimmed.info.height],normalizationScale,contentLongEdge,visibleLongEdgeTarget:720,canvasSize:816,sha256:createHash('sha256').update(await fs.readFile(file)).digest('hex')});
 }
 report.push({id:job.id,generator:'ImageGen',source:job.source,sourceSha256:createHash('sha256').update(source).digest('hex'),gutters,frames});
}
await fs.writeFile('assets/lantern-war/technique-cutins.json',JSON.stringify(report,null,2)+'\n');
console.log(`Packed ${report.length} heroes / ${report.length*4} isolated cut-ins.`);
