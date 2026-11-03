import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const partial=process.argv.includes('--partial');
const source=await fs.readFile('src/mini-games/go-home-dash/heroes.ts','utf8');
const heroes=[...source.matchAll(/"([^"]+)": "([^"]+)"/g)].map(([,id,reference])=>({id,reference}));
const output='public/sprites/go-home-dash/rush/rear';await fs.mkdir(output,{recursive:true});const records=[];
const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
for(const {id,reference}of heroes){
 const path=`assets/go-home-dash/rush/rear-sources/${id}.png`;
 let bytes;try{bytes=await fs.readFile(path);}catch(error){if(partial)continue;throw error;}
 const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.width%4!==0)throw Error(id+': expected four equal columns');
 const cw=info.width/4,ch=info.height,bounds=[];
 for(let frame=0;frame<4;frame++){
  let minX=cw,minY=ch,maxX=-1,maxY=-1,clear=0;
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const alpha=data[(y*info.width+frame*cw+x)*4+3];if(alpha<8)clear++;if(alpha>=32){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}}
  if(clear/cw/ch<.25||maxX<0)throw Error(id+': background must be truly transparent');
  if(minX<4||minY<4||maxX>=cw-4||maxY>=ch-4)throw Error(id+': silhouette touches a cell edge');
  bounds.push({left:minX,top:minY,width:maxX-minX+1,height:maxY-minY+1});
 }
 const baseline=Math.max(...bounds.map(b=>b.top+b.height)),top=Math.min(...bounds.map(b=>b.top));
 const extent=Math.max(...bounds.map(b=>Math.max(Math.abs(b.left-cw/2),Math.abs(b.left+b.width-cw/2))));
 const scale=Math.min(132/(baseline-top),55/extent),frames=[];
 for(let i=0;i<4;i++){
  const b=bounds[i],w=Math.round(b.width*scale),h=Math.round(b.height*scale),left=Math.round(64+(b.left-cw/2)*scale),destTop=Math.round(150-(baseline-b.top)*scale);
  const frame=await sharp(bytes).extract({left:i*cw+b.left,top:b.top,width:b.width,height:b.height}).resize(w,h,{kernel:'lanczos3'}).png().toBuffer();
  frames.push({input:frame,left:i*128+left,top:destTop});
 }
 const sheet=await sharp({create:{width:512,height:160,channels:4,background:'#00000000'}}).composite(frames).webp({quality:94,alphaQuality:100}).toBuffer();
 await fs.writeFile(`${output}/${id}.webp`,sheet);
 records.push({id,source:path,sourceSHA256:hash(bytes),reference:'public/'+reference,referenceSHA256:hash(await fs.readFile('public/'+reference)),output:`${output}/${id}.webp`,sha256:hash(sheet),bounds,scale,baseline,frameSize:[128,160],anchor:[64,150]});
}
await fs.writeFile('assets/go-home-dash/rush/rear-build.json',JSON.stringify({generator:'ImageGen: reference-conditioned rear-view sprint strips',normalizer:'scripts/prepare-home-dash-rear.mjs',frames:4,layout:[4,1],records},null,2)+'\n');
console.log(`Prepared ${records.length} rear-run animations (${records.length*4} frames), shared scale and baseline per character.`);
