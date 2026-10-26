// Mechanical packing only: every source sprite is ImageGen art, not procedural artwork.
// node scripts/star-tide/normalize-art.mjs /path/to/sources.json
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';
const inputRecord = JSON.parse(await fs.readFile(process.argv[2], 'utf8'));
const sources = Array.isArray(inputRecord) ? inputRecord : inputRecord.sheets;
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const records = [];
// ImageGen gutters can drift a few pixels. Place cuts in low-ink gutters, rather
// than copying the previous row's boots into the next character's cell.
function cuts(ink, count) {
  const stride = ink.length / count, result = [0];
  for (let k=1;k<count;k++) {
    const nominal=k*stride, radius=stride*.36;
    let best=Math.round(nominal), score=Infinity;
    for(let p=Math.max(2,Math.floor(nominal-radius));p<Math.min(ink.length-2,nominal+radius);p++){
      const value=(ink[p-1]+ink[p]+ink[p+1])/3 + Math.abs(p-nominal)*.005;
      if(value<score){score=value;best=p;}
    }
    result.push(best);
  }
  return [...result,ink.length];
}
function discardNeighbors(data,width,height) {
  const seen=new Uint8Array(width*height),parts=[];
  for(let at=0;at<seen.length;at++){
    if(seen[at]||data[at*4+3]<64)continue;
    const todo=[at];seen[at]=1;
    for(let n=0;n<todo.length;n++){
      const p=todo[n],x=p%width,y=Math.floor(p/width);
      for(const q of [x>0?p-1:-1,x<width-1?p+1:-1,y>0?p-width:-1,y<height-1?p+width:-1])
        if(q>=0&&!seen[q]&&data[q*4+3]>=64){seen[q]=1;todo.push(q);}
    }
    parts.push(todo);
  }
  parts.sort((a,b)=>b.length-a.length);
  if(!parts.length)throw new Error('No opaque sprite component');
  const main=parts[0],xs=main.map(p=>p%width),ys=main.map(p=>Math.floor(p/width));
  const box={left:Math.min(...xs),top:Math.min(...ys),right:Math.max(...xs),bottom:Math.max(...ys)};
  // Remove disconnected fragments of neighboring frames, retaining particles
  // close to the principal sprite and any substantial detached appendages.
  for(const part of parts.slice(1))if(part.length<main.length*.035){
    const cx=part.reduce((a,p)=>a+p%width,0)/part.length,cy=part.reduce((a,p)=>a+Math.floor(p/width),0)/part.length;
    if(cx<box.left-3||cx>box.right+3||cy<box.top-3||cy>box.bottom+3)
      for(const p of part)data[p*4+3]=0;
  }
}
for (const {id, source, rowCuts: suppliedRows, colCuts: suppliedCols} of sources) {
  const rounding = id.endsWith('-rounding');
  const columns = rounding || ['terrain','props','boss-motion'].includes(id) ? 8 : 6;
  const rows = id.endsWith('-vertical') || id === 'floors' ? 4 : id === 'boss-motion' ? 6 : rounding || ['terrain','props'].includes(id) ? 12 : 8;
  const opaque = ['terrain','floors'].includes(id), tiled=opaque||rounding, frameSize = id === 'floors' ? 128 : tiled ? 64 : 96;
  const input = await fs.readFile(source), meta = await sharp(input).metadata();
  const raw=await sharp(input).ensureAlpha().raw().toBuffer(), rowInk=Array(meta.height).fill(0),colInk=Array(meta.width).fill(0);
  for(let y=0;y<meta.height;y++)for(let x=0;x<meta.width;x++)if(raw[(y*meta.width+x)*4+3]>=128){rowInk[y]++;colInk[x]++;}
  const rowCuts=suppliedRows||(tiled?Array.from({length:rows+1},(_,i)=>Math.round(i*meta.height/rows)):cuts(rowInk,rows));
  const colCuts=suppliedCols||(tiled?Array.from({length:columns+1},(_,i)=>Math.round(i*meta.width/columns)):cuts(colInk,columns));
  for(const [points,count,end] of [[rowCuts,rows,meta.height],[colCuts,columns,meta.width]])
    if(points.length!==count+1||points[0]!==0||points.at(-1)!==end||points.some((v,i)=>i&&v<=points[i-1]))throw new Error('Invalid supplied tile boundaries: '+id);
  const frames = [];
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    const left = colCuts[col], top = rowCuts[row];
    const width = colCuts[col+1]-left, height = rowCuts[row+1]-top;
    const {data, info} = await sharp(input).extract({left,top,width,height}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    if(!tiled)discardNeighbors(data,width,height);
    let minX = width, minY = height, maxX = -1, maxY = -1;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const at = (y * width + x) * 4;
      if (!opaque && data[at + 3] <= 12) data[at + 3] = 0;
      if (opaque || data[at + 3] >= 64) { minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y); }
    }
    if (maxX < 0) throw new Error(`Empty frame ${id}:${row}:${col}`);
    // Trim the generator's thin atlas separators before repeating floor materials.
    const box = rounding ? {left:0,top:0,width,height} : opaque ? {left:3,top:3,width:width-6,height:height-6}
      : {left:minX,top:minY,width:maxX-minX+1,height:maxY-minY+1};
    frames.push({row,col,data,info,box});
  }
  const layers = [], normalization = [];
  for (const frame of frames) {
    // Shared scale across a whole hero, one species, or one boss's four poses.
    const group = id.startsWith('hero-') ? frames : id.startsWith('enemies-') ? frames.filter(f=>f.row===frame.row)
      : id==='boss-motion' ? frames.filter(f=>f.row===frame.row&&Math.floor(f.col/4)===Math.floor(frame.col/4)) : [frame];
    const scale = tiled ? 1 : Math.min(80/Math.max(...group.map(f=>f.box.width)),80/Math.max(...group.map(f=>f.box.height)));
    const width = tiled ? frameSize : Math.max(1,Math.round(frame.box.width*scale));
    const height = tiled ? frameSize : Math.max(1,Math.round(frame.box.height*scale));
    const png = await sharp(frame.data,{raw:frame.info}).extract(frame.box).resize(width,height,{kernel:'nearest',fit:'fill'}).png().toBuffer();
    layers.push({input:png,left:frame.col*frameSize+Math.floor((frameSize-width)/2),top:frame.row*frameSize+(tiled?0:88-height)});
    normalization.push({row:frame.row,col:frame.col,scale,width,height,anchor:tiled?null:[48,88]});
  }
  const bytes = await sharp({create:{width:columns*frameSize,height:rows*frameSize,channels:4,background:'#00000000'}})
    .composite(layers).webp({lossless:true,effort:6}).toBuffer();
  const output = `sprites/star-tide/${id}.webp`;
  await fs.writeFile('public/'+output,bytes);
  records.push({id,generator:'ImageGen',source,sourceSha256:hash(input),output,outputSha256:hash(bytes),columns,rows,frameSize,transparent:!opaque,rowCuts,colCuts,normalization});
  console.log(id,`${columns*frameSize}x${rows*frameSize}`,`${(bytes.length/1024).toFixed(0)} KiB`);
}
await fs.writeFile('assets/star-tide/graphics.json',JSON.stringify({version:2,method:'Whole-sheet ImageGen animations, shared scale and bottom-center anchor; nearest-neighbor lossless WebP packing.',sheets:records},null,2)+'\n');
