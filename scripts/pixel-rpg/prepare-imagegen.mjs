import sharp from 'sharp';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const [source, destination] = process.argv.slice(2);
if(!source || !destination)throw Error('Specify the source directory and output directory');
const files=(await readdir(source)).filter(n=>/^(?:base|[a-z][a-z0-9-]+)\.png$/.test(n)&&!n.startsWith('scratch-')).sort();
await mkdir(destination,{recursive:true});
const covered={};
for(const file of files){
  const hero=file.slice(0,-4);
  try{
    const {data,info:{width,height}}=await sharp(join(source,file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const rows=hero==='base'?7:4, cols=hero==='base'?8:7, count=hero==='base'?53:26;
    const sprites=[];
    for(let index=0;index<rows*cols;index++){
      const col=index%cols,row=Math.floor(index/cols);
      const left=Math.round(col*width/cols),right=Math.round((col+1)*width/cols);
      const top=Math.round(row*height/rows),bottom=Math.round((row+1)*height/rows);
      const w=right-left,h=bottom-top, raw=Buffer.alloc(w*h*4);
      let pixels=0,minX=w,minY=h,maxX=0,maxY=0;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const at=((top+y)*width+left+x)*4,dest=(y*w+x)*4;
        if(data[at+3]<166)continue;
        const [r,g,b]=data.subarray(at,at+3);
        if(Math.min(r,g,b)>200&&Math.max(r,g,b)-Math.min(r,g,b)<13&&data[at+3]<252)continue;
        raw[dest]=r;raw[dest+1]=g;raw[dest+2]=b;raw[dest+3]=255;
        pixels++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
      }
      if(index>=count){if(pixels>w*h*.06)throw Error('Unexpected drawing in blank slot '+index);continue;}
      if(pixels<w*h*.085||pixels>w*h*.75||maxY-minY<h*.38)throw Error('Unclear silhouette in slot '+index);
      const sprite=await sharp(raw,{raw:{width:w,height:h,channels:4}})
        .extract({left:minX,top:minY,width:maxX-minX+1,height:maxY-minY+1})
        .resize({width:64,height:80,fit:'inside',kernel:'nearest'})
        .webp({quality:87,alphaQuality:100,smartSubsample:true}).toBuffer();
      sprites.push(sprite);
    }
    const out=join(destination,hero);
    await mkdir(out,{recursive:true});
    await Promise.all(sprites.map((buf,i)=>writeFile(join(out,i+'.webp'),buf)));
    covered[hero]=count;
  }catch(error){console.warn(hero+': '+error.message);}
}
await writeFile(join(destination,'coverage.json'),JSON.stringify(covered,null,2)+'\n');
console.log(covered);
