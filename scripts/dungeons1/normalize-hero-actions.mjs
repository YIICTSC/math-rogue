import fs from 'node:fs/promises';
import sharp from 'sharp';
import crypto from 'node:crypto';
const input=process.argv[2];if(!input)throw Error('Pass the ImageGen 8x8 source atlas');
const raw=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true}),{width,height}=raw.info;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const refPath='public/sprites/wandering-student/elementary-warrior.webp';
const ref=await sharp(refPath).extract({left:0,top:0,width:128,height:128}).ensureAlpha().raw().toBuffer();
let rt=128,rb=0;for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(ref[(y*128+x)*4+3]>160){rt=Math.min(rt,y);rb=Math.max(rb,y);}
// Locate row/column gutters, tolerating the slight spacing drift in generated sheets.
function boundary(axis,length,n,lo,hi){const cuts=[0];for(let i=1;i<n;i++){const expected=length*i/n,radius=length/n*.25;let best=Math.round(expected),score=Infinity;for(let p=Math.floor(expected-radius);p<=expected+radius;p++){let count=0;for(let k=lo;k<hi;k++){const x=axis==='x'?p:k,y=axis==='y'?p:k;if(raw.data[(y*width+x)*4+3]>180)count++;}const s=count*1000+Math.abs(p-expected);if(s<score){score=s;best=p;}}cuts.push(best);}cuts.push(length);return cuts;}
const ys=boundary('y',height,8,0,width),frames=[];
for(let row=0;row<8;row++){
 const xs=boundary('x',width,8,ys[row],ys[row+1]);
 for(let col=0;col<8;col++){
  const rect={left:xs[col],top:ys[row],width:xs[col+1]-xs[col],height:ys[row+1]-ys[row]};
  const cropped=await sharp(input).extract(rect).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  // Remove translucent generation fringe, retaining crisp opaque pixel clusters.
  for(let i=3;i<cropped.data.length;i+=4)cropped.data[i]=cropped.data[i]>180?255:0;
  const png=await sharp(cropped.data,{raw:cropped.info}).trim({threshold:12}).png().toBuffer(),meta=await sharp(png).metadata();
  frames.push({png,width:meta.width,height:meta.height});
 }
}
const median=a=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)];
const scale=Math.min((rb-rt+1)/2/median(frames.slice(0,16).map(f=>f.height)),88/Math.max(...frames.map(f=>f.width)),88/Math.max(...frames.map(f=>f.height)));
const baseline=16+(rb+1)/2,layers=[];
for(let i=0;i<frames.length;i++){const f=frames[i],w=Math.max(1,Math.round(f.width*scale)),h=Math.max(1,Math.round(f.height*scale));layers.push({input:await sharp(f.png).resize(w,h,{kernel:'nearest'}).png().toBuffer(),left:i%8*96+Math.floor((96-w)/2),top:Math.floor(i/8)*96+Math.round(baseline-h)});}
const output='public/sprites/dungeons1/actions/elementary-warrior.webp';
await sharp({create:{width:768,height:768,channels:4,background:'#00000000'}}).composite(layers).webp({lossless:true}).toFile(output);
await fs.writeFile('assets/dungeons1/hero-actions.json',JSON.stringify({generator:'ImageGen',heroId:'elementary-warrior',source:input.split('/').pop(),sourceSha256:sha(await fs.readFile(input)),reference:refPath,referenceSha256:sha(await fs.readFile(refPath)),output,sha256:sha(await fs.readFile(output)),columns:['S','N','E','W','SE','SW','NE','NW'],rows:['walk-left','walk-right','attack','throw','swing','read','use','shoot'],cell:96,baseline,scale,frameCount:64,normalization:'Single shared scale, bottom-center anchor matched to the shipped idle sprite, nearest-neighbor, lossless WebP'},null,2)+'\n');
console.log('Normalized 64 hero action frames');
