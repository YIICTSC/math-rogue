import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const dir=process.argv[2];
if(!dir)throw Error('Usage: node scripts/normalize-lantern-vacation-art.mjs <generated-image-directory>');
const out='public/sprites/lantern-war/vacation';
await fs.mkdir(out,{recursive:true});
const plan=JSON.parse(await fs.readFile('assets/lantern-war/vacation-art.json','utf8'));
const report={};

// Find actual transparent gutters: generated rows need not start halfway down.
function valley(counts,target,radius){
 const lo=Math.max(1,Math.floor(target-radius)),hi=Math.min(counts.length-1,Math.ceil(target+radius));
 let minimum=Infinity;for(let i=lo;i<hi;i++)minimum=Math.min(minimum,counts[i]);
 const runs=[];for(let i=lo;i<hi;){if(counts[i]>minimum){i++;continue;}const start=i;while(i<hi&&counts[i]===minimum)i++;runs.push({start,end:i});}
 runs.sort((a,b)=>Math.abs((a.start+a.end)/2-target)-Math.abs((b.start+b.end)/2-target));
 const run=runs[0];return Math.round((run.start+run.end)/2);
}
function occupied(data,w,h,region,axis){const counts=new Uint32Array(axis==='x'?w:h);for(let y=region.top;y<region.top+region.height;y++)for(let x=region.left;x<region.left+region.width;x++)if(data[(y*w+x)*4+3]>80)counts[axis==='x'?x:y]++;return counts;}
async function regions(file,type){
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width:w,height:h}=info,whole={left:0,top:0,width:w,height:h};
 const ys=type==='actions'?[0,valley(occupied(data,w,h,whole,'y'),h/2,h*.18),h]:[0,h];
 const boxes=[];for(let row=0;row<ys.length-1;row++){
  const region={left:0,top:ys[row],width:w,height:ys[row+1]-ys[row]},cols=type==='actions'?3:4;
  const projection=occupied(data,w,h,region,'x'),xs=[0,...Array.from({length:cols-1},(_,i)=>valley(projection,w*(i+1)/cols,w/cols*.27)),w];
  for(let i=0;i<cols;i++)boxes.push({left:xs[i],top:ys[row],width:xs[i+1]-xs[i],height:ys[row+1]-ys[row]});
 }
 return boxes;
}
// Atlas segmentation: discard isolated pieces belonging to an adjacent portrait.
// Keep the main figure and nearby disconnected details, without repainting it.
function isolatePortrait(data,w,h){
 const labels=new Int32Array(w*h),queue=new Int32Array(w*h),components=[];
 for(let p=0;p<w*h;p++)if(!labels[p]&&data[p*4+3]>8){
  const label=components.length+1,pixels=[];let head=0,tail=1;queue[0]=p;labels[p]=label;
  while(head<tail){const q=queue[head++];pixels.push(q);const x=q%w,y=Math.floor(q/w);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;const v=yy*w+xx;if(!labels[v]&&data[v*4+3]>8){labels[v]=label;queue[tail++]=v;}}
  }components.push(pixels);
 }
 const main=components.reduce((best,c,i)=>c.length>components[best].length?i:best,0);
 const distance=new Uint8Array(w*h);distance.fill(255);let head=0,tail=0;
 for(const p of components[main]){distance[p]=0;queue[tail++]=p;}
 while(head<tail){const p=queue[head++],d=distance[p];if(d>=8)continue;const x=p%w,y=Math.floor(p/w);
  for(const q of [x?p-1:-1,x<w-1?p+1:-1,y?p-w:-1,y<h-1?p+w:-1])if(q>=0&&distance[q]===255){distance[q]=d+1;queue[tail++]=q;}
 }
 const keep=new Set(components.flatMap((c,i)=>i===main||c.some(p=>distance[p]<=8)?[i+1]:[]));
 let removed=0;for(let p=0;p<w*h;p++)if(data[p*4+3]&&!keep.has(labels[p])){data[p*4+3]=0;removed++;}return removed;
}
async function slot(file,region,type){
 const {data,info}=await sharp(file).extract(region).ensureAlpha().raw().toBuffer({resolveWithObject:true});const {width:w,height:h}=info;
 const detached=type==='dialogue'?isolatePortrait(data,w,h):0;
 let x=w,y=h,r=-1,b=-1,edge=0;
 for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const a=data[(yy*w+xx)*4+3];if(a>48){x=Math.min(x,xx);y=Math.min(y,yy);r=Math.max(r,xx);b=Math.max(b,yy);}if(a>200&&(xx===0||xx===w-1||yy===0||yy===h-1))edge++;}
 if(r<0)throw Error('Empty sprite slot: '+file);
 return {image:await sharp(data,{raw:info}).extract({left:x,top:y,width:r-x+1,height:b-y+1}).png().toBuffer(),w:r-x+1,h:b-y+1,edge,region,detached};
}
async function pack(id,file,type){
 const cells=await Promise.all((await regions(file,type)).map(box=>slot(file,box,type)));
 if(type==='actions'&&cells.some(c=>c.edge))throw Error('Action touches a source boundary; regenerate before packing: '+id);
 const cw=type==='actions'?512:448,ch=type==='actions'?640:704,baseline=type==='actions'?550:592,cols=type==='actions'?3:4,rows=type==='actions'?2:1;
 const scale=Math.min((type==='actions'?384:416)/Math.max(...cells.map(c=>c.w)),(type==='actions'?480:560)/Math.max(...cells.map(c=>c.h)));
 const parts=[];for(const [i,c]of cells.entries()){
  const w=Math.max(1,Math.round(c.w*scale)),h=Math.max(1,Math.round(c.h*scale));
  parts.push({input:await sharp(c.image).resize(w,h).png().toBuffer(),left:i%cols*cw+Math.round((cw-w)/2),top:Math.floor(i/cols)*ch+baseline-h});
 }
 report[id]??={};report[id][type]={source:path.basename(file),cells:cells.map(({w,h,edge,region,detached})=>({w,h,edge,region,detached})),scale};
 await sharp({create:{width:cols*cw,height:rows*ch,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(parts).webp({quality:92}).toFile(`${out}/${type==='actions'?'actions':'dialogue'}-${id}.webp`);
}
for(const [type,manifest]of [['actions','vacation-individual-actions.json'],['dialogue','vacation-individual-portraits.json']]){
 const sources=JSON.parse(await fs.readFile('assets/lantern-war/'+manifest,'utf8'));
 for(const [id,file]of Object.entries(sources))await pack(id,path.join(dir,file),type);
}
await sharp(path.join(dir,plan.intro)).webp({quality:92}).toFile(out+'/voyage.webp');
const artifacts=process.env.LANTERN_ARTIFACT_DIR||'.codex-artifacts/lantern-endless';await fs.mkdir(artifacts,{recursive:true});await fs.writeFile(artifacts+'/vacation-normalization.json',JSON.stringify(report,null,2));
console.log('Normalized 16 individual six-pose sheets and 44 four-expression portrait strips with shared scale.');
