import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { writeActionExtents } from './measure-action-frames.mjs';

const [source, groupsPath, rosterPath, standingPath, out, registryPath] = process.argv.slice(2);
if(!registryPath)throw Error('Expected source, groups, roster, standing reference, output folder and registry file');

const actions=['attack','skill','damage'];
const size=64, columns=8;
const expected=JSON.parse(await readFile('src/mini-games/pixel-rpg/generatedHeroArt.json','utf8'));
const roster=JSON.parse(await readFile(rosterPath,'utf8'));
const groups=JSON.parse(await readFile(groupsPath,'utf8'));
const files=new Set(await readdir(source));
const poses=new Map();
const warnings=[];
async function readImage(path){
  return sharp(path).ensureAlpha().raw().toBuffer({resolveWithObject:true});
}

function isolateCell({data,info},column,row,cols,rows,{alpha=false,rowEdges,colEdges}={}){
  const {width,height}=info;
  const left=Math.round((colEdges?.[column]??column/cols)*width),right=Math.round((colEdges?.[column+1]??(column+1)/cols)*width);
  const top=Math.round((rowEdges?.[row]??row/rows)*height),bottom=Math.round((rowEdges?.[row+1]??(row+1)/rows)*height);
  const w=right-left,h=bottom-top;
  const pixels=Buffer.alloc(w*h*4);
  const key=new Uint8Array(w*h);
  const fringe=new Uint8Array(w*h);
  const border=[];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x,dest=i*4,src=((top+y)*width+left+x)*4;
    const [r,g,b,a]=data.subarray(src,src+4);
    data.copy(pixels,dest,src,src+4);
    const green=g>=145&&g-r>=45&&g-b>=25;
    const hardKey=g>=194&&r<45&&g-b>69;
    key[i]=Number(a<(alpha?207:145)||(!alpha&&green));
    fringe[i]=Number(alpha&&a<249&&Math.min(r,g,b)>125&&Math.max(r,g,b)-Math.min(r,g,b)<35);
    if(a<(alpha?207:145)||!alpha&&hardKey) pixels[dest+3]=0;
    if(x===0||x===w-1||y===0||y===h-1)border.push(i);
  }
  const queue=border.filter(i=>key[i]);
  const visited=new Uint8Array(w*h);
  for(const i of queue)visited[i]=1;
  function neighbors(i){
    return [i%w>0?i-1:-1,i%w<w-1?i+1:-1,i>=w?i-w:-1,i+w<key.length?i+w:-1];
  }
  for(let n=0;n<queue.length;n++){
    const at=queue[n];pixels[at*4+3]=0;
    for(const i of neighbors(at)){
      if(i<0||visited[i]||!key[i]&&!fringe[i])continue;
      visited[i]=1;queue.push(i);
    }
  }
  if(alpha){
    // Clear isolated flecks from the source matte before resampling the artwork.
    const seen=new Uint8Array(w*h);
    for(let i=0;i<seen.length;i++){
      if(seen[i]||!pixels[i*4+3])continue;
      const component=[i];seen[i]=1;
      for(let n=0;n<component.length;n++)for(const adjacent of neighbors(component[n])){
        if(adjacent<0||seen[adjacent]||!pixels[adjacent*4+3])continue;
        seen[adjacent]=1;component.push(adjacent);
      }
      if(component.length<Math.max(5,w*h*.0015))for(const at of component)pixels[at*4+3]=0;
    }
  }
  let minX=w,minY=h,maxX=0,maxY=0,count=0,edge=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const dest=(y*w+x)*4;
    if(!pixels[dest+3])continue;
    pixels[dest+3]=255;
    count++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
    if(x===0||x===w-1||y===0||y===h-1)edge++;
  }
  if(count<w*h*.025||count>w*h*.72||maxY-minY<h*.25||edge>Math.min(w,h)*.45)return null;
  return sharp(pixels,{raw:{width:w,height:h,channels:4}}).extract({left:minX,top:minY,width:maxX-minX+1,height:maxY-minY+1});
}

async function cell(table,c,r,cols,rows,key,settings){
  const sprite=isolateCell(table,c,r,cols,rows,settings);
  if(!sprite){warnings.push(key);return;}
  const result=await sprite.resize(size-4,size-3,{kernel:'nearest',fit:'inside'}).png().toBuffer({resolveWithObject:true});
  return result;
}

function splitPoseGrid({data,info:{width,height}},cols,rows,slots){
  const w=width/cols,h=height/rows;
  const visited=new Uint8Array(width*height);
  const parts=Array.from({length:slots},()=>[]);
  for(let i=0;i<visited.length;i++){
    const [r,g,b,a]=data.subarray(i*4,i*4+4);
    visited[i]=Number(a<145||g>=160&&g-r>=73&&g-b>=44);
  }
  for(let i=0;i<visited.length;i++){
    if(visited[i])continue;
    visited[i]=1;
    const component=[i], overlap=new Uint32Array(slots);
    let minX=width,minY=height,maxX=0,maxY=0;
    for(let n=0;n<component.length;n++){
      const x=component[n]%width,y=Math.floor(component[n]/width);
      const slot=Math.floor(y/h)*cols+Math.floor(x/w);
      overlap[slot]++;
      minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      for(const step of [-width,-1,1,width]){
        if(step===-1&&x===0||step===1&&x===width-1)continue;
        const next=component[n]+step;
        if(next<0||next>=visited.length||visited[next])continue;
        visited[next]=1;component.push(next);
      }
    }
    if(component.length<Math.max(7,w*h*.0016))continue;
    if(maxX-minX>w*1.35||maxY-minY>h*1.3){
      // A large connected cluster can span neighboring grid cells.
      for(const p of component){
        const slot=Math.floor(Math.floor(p/width)/h)*cols+Math.floor((p%width)/w);
        parts[slot]?.push(p);
      }
    }else{
      let best=0;
      for(let slot=1;slot<slots;slot++)if(overlap[slot]>overlap[best])best=slot;
      const minimum=component.length<w*h*.04?.72:.44;
      if(overlap[best]>component.length*minimum)for(const p of component)parts[best].push(p);
    }
  }
  return parts.map(points=>{
    if(points.length<w*h*.12||points.length>w*h*.78)return;
    let left=width,top=height,right=0,bottom=0;
    for(const p of points){
      const x=p%width,y=Math.floor(p/width);
      left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
    }
    const sw=right-left+1,sh=bottom-top+1;
    if(sw>w*1.38||sh>h*1.34||sh<h*.31)return;
    const pixels=Buffer.alloc(sw*sh*4);
    for(const p of points){
      const at=((Math.floor(p/width)-top)*sw+p%width-left)*4;
      data.copy(pixels,at,p*4,p*4+3);pixels[at+3]=255;
    }
    return sharp(pixels,{raw:{width:sw,height:sh,channels:4}}).resize(size-4,size-3,{kernel:'nearest',fit:'inside'}).png().toBuffer({resolveWithObject:true});
  });
}

function put(hero,job,action,value){
  if(!value)return;
  if(!poses.has(hero))poses.set(hero,new Map());
  const outfits=poses.get(hero);
  if(!outfits.has(job))outfits.set(job,{});
  outfits.get(job)[action]=value;
}

for(const group of groups){
  const file=`group-${group.n}.png`;
  if(!files.has(file))continue;
  const table=await readImage(join(source,file));
  const grid=await Promise.all(splitPoseGrid(table,3,6,group.people.length*3));
  for(const [row,hero] of group.people.entries()){
    for(const [column,action] of actions.entries()){
      put(hero.id,hero.job,action,grid[row*3+column]??await cell(table,column,row,3,6,`${hero.id}/${action}`));
    }
  }
}
for(const hero of roster){
  const file=`retake-${hero.id}.png`;
  if(!files.has(file))continue;
  const table=await readImage(join(source,file));
  const grid=await Promise.all(splitPoseGrid(table,3,1,3));
  for(const [column,action] of actions.entries()){
    put(hero.id,hero.job,action,grid[column]??await cell(table,column,0,3,1,`${hero.id}/${action} retake`));
  }
}
for(const [i,action] of actions.entries()){
  const file=`akari-${action}.png`;
  if(!files.has(file))continue;
  const table=await readImage(join(source,file));
  const grid=await Promise.all(splitPoseGrid(table,7,4,expected.jobOrder.length));
  for(const [j,job] of expected.jobOrder.entries()){
    put('magic-akari',job,actions[i],grid[j]??await cell(table,j%7,Math.floor(j/7),7,4,`akari/${job}/${action}`));
  }
}
for(const hero of roster){
  const file=`expanded-${hero.id}.png`;
  if(!files.has(file))continue;
  const table=await readImage(join(source,file));
  const grid=await Promise.all(splitPoseGrid(table,9,9,expected.jobOrder.length*actions.length));
  for(const [j,job] of expected.jobOrder.entries()){
    for(const [i,action] of actions.entries()){
      if(poses.get(hero.id)?.get(job)?.[action])continue;
      const index=j*actions.length+i;
      put(hero.id,job,action,grid[index]??await cell(table,index%9,Math.floor(index/9),9,9,`${hero.id}/${job}/${action}`));
    }
  }
}
await mkdir(out,{recursive:true});
const actors={};
for(const [hero,jobArt] of poses){
  const costumes={},tiles=[];
  let index=0;
  for(const [job,art] of jobArt){
    if(!actions.every(action=>art[action]))continue;
    costumes[job]={};
    for(const action of actions){
      const {data,info}=art[action];
      costumes[job][action]=index;
      tiles.push({ input:data, left:index%columns*size+Math.floor((size-info.width)/2),top:Math.floor(index/columns)*size+size-info.height-2 });
      index++;
    }
  }
  if(!index)continue;
  const file=`${expected.jobs[hero]}.webp`;
  await sharp({create:{width:Math.min(index,columns)*size,height:Math.ceil(index/columns)*size,channels:4,background:'#00000000'}})
    .composite(tiles).webp({quality:87,alphaQuality:100,smartSubsample:true}).toFile(join(out,file));
  actors[hero]={file,costumes};
}
const registry={frameWidth:size,frameHeight:size,columns,actors};
await writeFile(registryPath,JSON.stringify(registry,null,2)+'\n');
await writeActionExtents(out,registry,join(dirname(registryPath),'generatedActionExtents.json'));

const akari=await readImage(standingPath);
const cleaned=join(out,'akari-standing');
await mkdir(cleaned,{recursive:true});
for(const [j,job] of expected.jobOrder.entries()){
  const sprite=isolateCell(akari,j%7,Math.floor(j/7),7,4,{alpha:true});
  if(!sprite)throw Error('Standing alpha retouch failed for '+job);
  await sprite.resize(64,80,{fit:'inside',kernel:'nearest'}).webp({quality:91,alphaQuality:100}).toFile(join(cleaned,j+'.webp'));
}
console.log('Costumes with all 3 poses:',Object.values(actors).reduce((count,a)=>count+Object.keys(a.costumes).length,0));
console.log('Characters:',Object.keys(actors).length);
console.log('Flagged or clipped cells:',warnings.join(', '));
