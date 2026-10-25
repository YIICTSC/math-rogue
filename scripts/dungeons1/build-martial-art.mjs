import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
// Source PNGs are retained in the session Library; only compact, normalized assets ship.
const config=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const root='public/sprites/dungeons1/martial';await fs.mkdir(root,{recursive:true});
const grids=new Map();
function cuts(raw,axis,count,start,end){
 const {width,height}=raw.info,length=axis==='y'?height:width,result=[0];
 for(let i=1;i<count;i++){
  const expected=length*i/count,radius=length/count*.43;let best=Math.round(expected),score=Infinity;
  for(let p=Math.max(1,Math.floor(expected-radius));p<Math.min(length,expected+radius);p++){
   let pixels=0;for(let k=start;k<end;k++){const x=axis==='x'?p:k,y=axis==='y'?p:k;if(raw.data[(y*width+x)*4+3]>=128)pixels++;}
   const value=pixels*10000+Math.abs(p-expected);if(value<score){score=value;best=p;}
  }result.push(best);
 }result.push(length);return result;
}
async function frame(bytes,col,row,columns,rows){
 let grid=grids.get(bytes);if(!grid){const raw=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),ys=cuts(raw,'y',rows,0,raw.info.width);grid={ys,xs:ys.slice(0,-1).map((y,i)=>cuts(raw,'x',columns,y,ys[i+1]))};grids.set(bytes,grid);}
 const left=grid.xs[row][col],top=grid.ys[row],right=grid.xs[row][col+1],bottom=grid.ys[row+1];
 const {data,info}=await sharp(bytes).extract({left,top,width:right-left,height:bottom-top}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let minX=info.width,minY=info.height,maxX=-1,maxY=-1;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const a=(y*info.width+x)*4+3;data[a]=data[a]>=128?255:0;if(data[a]){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}
 if(maxX<minX)throw Error(`Empty generated cell ${row}/${col}`);
 const width=maxX-minX+1,height=maxY-minY+1;
 return {input:await sharp(data,{raw:info}).extract({left:minX,top:minY,width,height}).png().toBuffer(),width,height};
}
const assets=[];
for(const batch of config.heroes){
 const bytes=await fs.readFile(batch.source);
 for(let row=0;row<batch.keys.length;row++){
  const key=batch.keys[row],frames=await Promise.all([0,1,2,3].map(col=>frame(bytes,col,row,4,batch.keys.length)));
  const reference=`public/sprites/wandering-student/${key}.webp`,ref=await fs.readFile(reference),raw=await sharp(ref).extract({left:0,top:0,width:128,height:128}).ensureAlpha().raw().toBuffer();
  let top=128,bottom=-1;for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(raw[(y*128+x)*4+3]>128){top=Math.min(top,y);bottom=Math.max(bottom,y);}
  const baseline=16+(bottom+1)/2,target=(bottom-top+1)/2,heights=frames.map(f=>f.height).sort((a,b)=>a-b);
  const scale=Math.min(target/heights[2],86/Math.max(...frames.map(f=>f.width)),(baseline-5)/Math.max(...frames.map(f=>f.height))),layers=[];
  for(let i=0;i<4;i++){const f=frames[i],w=Math.max(1,Math.round(f.width*scale)),h=Math.max(1,Math.round(f.height*scale));layers.push({input:await sharp(f.input).resize(w,h,{kernel:'nearest'}).png().toBuffer(),left:i*96+Math.floor((96-w)/2),top:Math.round(baseline-h)});}
  const output=`${root}/${key}.webp`;await sharp({create:{width:384,height:96,channels:4,background:'#00000000'}}).composite(layers).webp({lossless:true}).toFile(output);
  assets.push({key,output,source:path.basename(batch.source),sourceSha256:sha(bytes),reference,referenceSha256:sha(ref),sha256:sha(await fs.readFile(output)),baseline,scale,poses:4});
 }
}
const weaponBytes=await fs.readFile(config.weapons),layers=[];
for(let i=0;i<12;i++){const f=await frame(weaponBytes,i%4,Math.floor(i/4),4,3),scale=Math.min(112/f.width,112/f.height),w=Math.round(f.width*scale),h=Math.round(f.height*scale);layers.push({input:await sharp(f.input).resize(w,h,{kernel:'nearest'}).png().toBuffer(),left:i%4*128+Math.floor((128-w)/2),top:Math.floor(i/4)*128+Math.floor((128-h)/2)});}
const output=`${root}/weapons.webp`;await sharp({create:{width:512,height:384,channels:4,background:'#00000000'}}).composite(layers).webp({lossless:true}).toFile(output);
await fs.writeFile('assets/dungeons1/martial-art.json',JSON.stringify({generator:'ImageGen',sourceRetained:true,sourceLocation:'Session generated_images Library; originals preserved',columns:['slash','cleave','thrust','kick'],cell:96,normalization:'One shared scale per hero, bottom-center anchor matched to original reference, nearest-neighbor, lossless WebP; empty-handed poses. Weapon art is a separate effect atlas.',assets,weapons:{output,source:path.basename(config.weapons),sourceSha256:sha(weaponBytes),sha256:sha(await fs.readFile(output)),columns:4,rows:3}},null,2)+'\n');
console.log(`Built ${assets.length*4} weaponless hero poses and 12 weapon/emblem illustrations.`);
