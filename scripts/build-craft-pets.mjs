import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const dir='src/mini-games/gakuro-craft/assets';
const manifest=JSON.parse(await fs.readFile(path.join(dir,'pets-generation.json'),'utf8'));
const gallery=[];
for(let row=0;row<manifest.sources.length;row++){
 const {id}=manifest.sources[row],source=path.join(dir,`pet-${id}-source.webp`),meta=await sharp(source).metadata();
 if(!meta.hasAlpha)throw new Error(`${id}: missing transparency`);
 const cw=meta.width/3,ch=meta.height/2;if(!Number.isInteger(cw)||!Number.isInteger(ch))throw new Error(`${id}: invalid grid`);
 const frames=[];let maxW=0,maxH=0;
 for(let i=0;i<6;i++){
  const {data,info}=await sharp(source).extract({left:i%3*cw,top:Math.floor(i/3)*ch,width:cw,height:ch}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let left=cw,top=ch,right=-1,bottom=-1;
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const n=(y*cw+x)*4;if(data[n+3]<8){data.fill(0,n,n+4);continue;}left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
  if(right<left)throw new Error(`${id}/${i}: empty frame`);
  if(left<2||top<2||right>=cw-2||bottom>=ch-2)throw new Error(`${id}/${i}: clipped sprite; regenerate`);
  const width=right-left+1,height=bottom-top+1;
  const trimmed=await sharp(data,{raw:info}).extract({left,top,width,height}).png().toBuffer();frames.push({trimmed,width,height});maxW=Math.max(maxW,width);maxH=Math.max(maxH,height);
 }
 const target=id==='longTailedTit'?[100,112]:id==='hamster'?[104,120]:[128,144],scale=Math.min(target[0]/maxW,target[1]/maxH),cells=[];
 for(let i=0;i<frames.length;i++){const f=frames[i],width=Math.max(1,Math.floor(f.width*scale)),height=Math.max(1,Math.floor(f.height*scale)),input=await sharp(f.trimmed).resize(width,height).png().toBuffer();cells.push({input,left:i%3*160+Math.floor((160-width)/2),top:Math.floor(i/3)*192+172-height});}
 const output=await sharp({create:{width:480,height:384,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(cells).webp({quality:92,alphaQuality:100,effort:6,smartSubsample:true}).toBuffer();await fs.writeFile(path.join(dir,`pet-${id}.webp`),output);
 gallery.push({input:output,left:0,top:row*384});console.log(`PASS ${id}: six whole padded frames`);
}
await fs.mkdir('tmp/craft-pets',{recursive:true});await sharp({create:{width:480,height:3840,channels:4,background:'#f2eadc'}}).composite(gallery).png().toFile('tmp/craft-pets/all-pet-poses.png');
