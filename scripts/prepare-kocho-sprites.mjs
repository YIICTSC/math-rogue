// Mechanical extraction only. Artwork must originate in ImageGen, never this script.
import sharp from 'sharp';
import fs from 'node:fs/promises';
const root='public/sprites/kocho', sourceRoot='docs/assets/kocho';
await fs.mkdir(root,{recursive:true}); await fs.mkdir(sourceRoot,{recursive:true});
const specs=JSON.parse(await fs.readFile(`${sourceRoot}/imagegen-sources.json`,'utf8'));
for(const [key,file] of Object.entries(specs)) {
  const input=await fs.access(file).then(()=>file).catch(()=>`${sourceRoot}/${key}.webp`);
  if(input!==`${sourceRoot}/${key}.webp`) await sharp(input).webp({quality:96}).toFile(`${sourceRoot}/${key}.webp`);
  if(key==='title') { await sharp(input).resize({width:1400,withoutEnlargement:true}).webp({quality:88}).toFile(`${root}/title.webp`); continue; }
  const columns=key==='ground'?3:key.includes('-actions-')?4:3,rows=key==='ground'?2:key.includes('-actions-')?5:3;
  const {width,height}=await sharp(input).metadata();
  const raw=await sharp(input).removeAlpha().raw().toBuffer();
  const isKey=(x,y)=>{const i=(y*width+x)*3,r=raw[i],g=raw[i+1],b=raw[i+2];return r>150&&b>130&&r-g>65&&b-g>65;};
  // Find the empty gutters near each expected uniform boundary. This prevents
  // clipping a wide effect when ImageGen shifts it slightly inside the gutter.
  const gutter=(expected,radius,cost)=>{
    let best=Math.round(expected),score=Infinity;
    for(let p=Math.ceil(expected-radius);p<=Math.floor(expected+radius);p++) {
      const candidate=cost(p)+Math.abs(p-expected)*.025;
      if(candidate<score){score=candidate;best=p;}
    } return best;
  };
  const ys=[0,...Array.from({length:rows-1},(_,i)=>gutter((i+1)*height/rows,height/rows*.23,y=>{let n=0;for(let x=0;x<width;x++)if(!isKey(x,y))n++;return n;})),height];
  for(let index=0;index<columns*rows;index++) {
    const x=index%columns,y=Math.floor(index/columns);
    const xs=[0,...Array.from({length:columns-1},(_,i)=>gutter((i+1)*width/columns,width/columns*.3,px=>{let n=0;for(let py=ys[y];py<ys[y+1];py++)if(!isKey(px,py))n++;return n;})),width];
    const left=xs[x],top=ys[y],w=xs[x+1]-left,h=ys[y+1]-top;
    const {data,info}=await sharp(input).extract({left,top,width:w,height:h}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let minX=w,minY=h,maxX=-1,maxY=-1;
    for(let p=0;p<w*h;p++) {
      const i=p*4,r=data[i],g=data[i+1],b=data[i+2];
      // Neither protagonist uses magenta in the costume; interior key pixels are background too.
      if(r>150&&b>130&&r-g>65&&b-g>65) data[i+3]=0;
      else if(data[i+3]>0) {const px=p%w,py=Math.floor(p/w);minX=Math.min(minX,px);minY=Math.min(minY,py);maxX=Math.max(maxX,px);maxY=Math.max(maxY,py);}
    }
    if(maxX<minX||maxY<minY) throw Error(`Empty sprite ${key}/${index}`);
    const cut=sharp(data,{raw:info}).extract({left:minX,top:minY,width:maxX-minX+1,height:maxY-minY+1});
    const hero=key.split('-')[0],offset=key.includes('-actions-')?10+Number(key.split('-').at(-1))*20:0;
    const name=key==='ground'?`ground-${index}`:`${hero}-${offset+index}`;
    await cut.resize(key==='ground'?384:300,key==='ground'?192:300,{fit:'contain',position:'bottom',background:'#00000000'}).extend({top:10,bottom:10,left:10,right:10,background:'#00000000'}).webp({quality:92}).toFile(`${root}/${name}.webp`);
  }
}
// Existing lead portrait: a mechanical crop from the existing idle sprite.
const original=await sharp('public/sprites/kocho-hero-actions-01.webp').metadata();
await sharp('public/sprites/kocho-hero-actions-01.webp').extract({left:0,top:0,width:Math.floor(original.width/5),height:Math.floor(original.height/5)}).webp({quality:94}).toFile(`${root}/original-portrait.webp`);
console.log(`Prepared ${Object.keys(specs).length} ImageGen sources for Kocho Showdown.`);
