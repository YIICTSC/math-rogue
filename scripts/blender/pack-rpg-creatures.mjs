import path from 'node:path';
import { mkdir, readdir } from 'node:fs/promises';
import sharp from 'sharp';

const input = process.argv[2] || '/dev/shm/rpg-creature-renders';
const output = 'public/sprites/rpg/creatures';
const rendered = new Set(await readdir(input));
const directions=['front','back','left','right'];
const species=[...rendered].filter(file=>file.endsWith('-0.png') && !directions.some(dir=>file.endsWith(`-${dir}-0.png`)))
  .map(file=>file.slice(0,-6)).filter(kind=>rendered.has(`${kind}-3.png`)).sort();
await mkdir(output, { recursive: true });

async function panelsFor(names,size,padding){
  const files=names.map(name=>path.join(input,name));
  let left=Infinity,top=Infinity,right=0,bottom=0;
  for(const file of files){
    const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++){
      if(data[(y*info.width+x)*4+3]<19)continue;
      left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);
    }
  }
  if(right<=left||bottom<=top)throw new Error(`No silhouette for ${names[0]}`);
  const width=right-left,height=bottom-top;
  const factor=Math.min((size-padding*2)/width,(size-padding*2)/height);
  const dstWidth=Math.round(width*factor),dstHeight=Math.round(height*factor);
  const panels=[];
  for(const file of files){
    const image=await sharp(file).extract({left,top,width,height}).resize(dstWidth,dstHeight)
      .modulate({brightness:1.16,saturation:1.08}).png().toBuffer();
    panels.push(await sharp({create:{width:size,height:size,channels:4,background:'#00000000'}})
      .composite([{input:image,left:Math.floor((size-dstWidth)/2),top:size-dstHeight-padding}]).png().toBuffer());
  }
  return panels;
}

async function saveAtlas(panels,size,columns,file){
  await sharp({create:{width:size*columns,height:size*Math.ceil(panels.length/columns),channels:4,background:'#00000000'}})
    .composite(panels.map((input,index)=>({input,left:index%columns*size,top:Math.floor(index/columns)*size})))
    .webp({quality:88,alphaQuality:100}).toFile(file);
}

let directional=0;
for(const kind of species){
  const panels=await panelsFor(Array.from({length:4},(_,i)=>`${kind}-${i}.png`),96,4);
  await sharp(panels[0]).webp({quality:92,alphaQuality:100}).toFile(`${output}/${kind}.webp`);
  await saveAtlas(panels,96,4,`${output}/${kind}-poses.webp`);
  const views=directions.flatMap(direction=>Array.from({length:8},(_,i)=>`${kind}-${direction}-${i}.png`));
  if(views.every(view=>rendered.has(view))){
    const frames=await panelsFor(views,72,3);
    await saveAtlas(frames,72,8,`${output}/${kind}-motion.webp`);
    directional++;
  }
}
console.log(`${species.length} portraits and pose strips; ${directional} directional motion atlases`);
