import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';import sharp from 'sharp';
const input=process.argv[2];const prior=JSON.parse(await fs.readFile('assets/dungeons2/dedicated-animations-build.json','utf8').catch(()=>'{"assets":[]}'));const sources=input?JSON.parse(await fs.readFile(input,'utf8')):prior.assets.map(a=>({key:a.key,path:a.retainedSource,cuts:a.rowCuts,sourceRowMap:a.sourceRowMap,generatedSource:a.generatedSource,generatedSourceSha256:a.generatedSourceSha256}));if(sources.length!==18)throw Error('Expected eighteen reviewed ImageGen sources');const hash=b=>createHash('sha256').update(b).digest('hex');const records=[];
await fs.mkdir('public/sprites/dungeons2/animations',{recursive:true});await fs.mkdir('assets-source/dungeons2/dedicated-animations',{recursive:true});
for(const source of sources){
 const bytes=await fs.readFile(source.path);const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});const {width,height}=info;
 const cuts=source.cuts;if(!cuts||!source.sourceRowMap||source.sourceRowMap.length!==16)throw Error('Pass the reviewed row cuts and row mapping');
 const frames=[];let maxW=0,maxH=0;
 for(let row=0;row<16;row++)for(let col=0;col<8;col++){
  const left=Math.round(col*width/8),right=Math.round((col+1)*width/8),top=cuts[source.sourceRowMap[row]],bottom=cuts[source.sourceRowMap[row]+1];let x0=right,y0=bottom,x1=left,y1=top;
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(data[(y*width+x)*4+3]>80){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  if(x1<=x0||y1<=y0)throw Error('Empty cell '+source.key+'/'+row+'/'+col);
  const w=x1-x0+1,h=y1-y0+1;maxW=Math.max(maxW,w);maxH=Math.max(maxH,h);frames.push({row,col,left,top,right,bottom,x0,y0,w,h});
 }
 const scale=Math.min(84/maxW,80/maxH);const layers=[];
 for(const f of frames){const w=Math.max(1,Math.round(f.w*scale)),h=Math.max(1,Math.round(f.h*scale));const png=await sharp(bytes).extract({left:f.x0,top:f.y0,width:f.w,height:f.h}).resize(w,h,{kernel:'nearest'}).png().toBuffer();layers.push({input:png,left:f.col*96+Math.round(48+(f.x0-(f.left+f.right)/2)*scale),top:f.row*96+88-h});}
 const output=`public/sprites/dungeons2/animations/${source.key}.webp`;const webp=await sharp({create:{width:768,height:1536,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).webp({lossless:true}).toBuffer();await fs.writeFile(output,webp);
 const retained=`assets-source/dungeons2/dedicated-animations/${source.key}.webp`;if(path.resolve(source.path)!==path.resolve(retained))await sharp(bytes).webp({lossless:true}).toFile(retained);
 records.push({key:source.key,heroId:'dungeons2-'+source.key.replace(/-transformed$/,''),transformed:source.key.endsWith('-transformed'),reference:`public/sprites/dungeons2/${source.key}-directions.webp`,referenceSha256:hash(await fs.readFile(`public/sprites/dungeons2/${source.key}-directions.webp`)),generatedSource:source.generatedSource||path.basename(source.path),generatedSourceSha256:source.generatedSourceSha256||hash(bytes),retainedSource:retained,retainedSourceSha256:hash(await fs.readFile(retained)),rowCuts:cuts,sourceRowMap:source.sourceRowMap,scale,output,sha256:hash(webp),rows:16,columns:8,cell:96,anchor:[48,88]});console.log('BUILT',source.key,cuts.join(','));
}
await fs.mkdir('assets/dungeons2',{recursive:true});await fs.writeFile('assets/dungeons2/dedicated-animations-build.json',JSON.stringify({generator:'ImageGen',date:'2026-10-25',directions:['S','N','E','W','SE','SW','NE','NW'],rows:['walk-1','walk-2','walk-3','walk-4','attack-ready','attack-release','throw-ready','throw-release','swing-ready','swing-release','read-1','read-2','use-1','use-2','shoot-ready','shoot-release'],assets:records},null,2)+'\n');if(records.length!==18)throw Error(`Review missing grids: ${records.length}/18 built`);
