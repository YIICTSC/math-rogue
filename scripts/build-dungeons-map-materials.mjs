import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';

const manifest='assets/dungeons-map-materials/build.json',from=process.argv[2],hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const inputs=JSON.parse(await fs.readFile(from||manifest,'utf8'));const records=[];
await fs.mkdir('assets-source/dungeons-map-materials',{recursive:true});
await fs.mkdir('assets/dungeons-map-materials',{recursive:true});
await fs.mkdir('public/sprites/dungeons-map-materials/walls',{recursive:true});
const maskPath='public/sprites/dungeons2/world/walls.webp',maskBuffer=await fs.readFile(maskPath),masks=await sharp(maskBuffer).ensureAlpha().raw().toBuffer();
for(const input of (Array.isArray(inputs)?inputs:inputs.records)){
 const id=input.route.toLowerCase(),source=`assets-source/dungeons-map-materials/${id}.webp`,output=`public/sprites/dungeons-map-materials/${id}.webp`,wallOutput=`public/sprites/dungeons-map-materials/walls/${id}.webp`;
 if(from)await sharp(input.source).webp({lossless:true}).toFile(source);
 const sourceBuffer=await fs.readFile(source);
 // ImageGen authors 64 independent material cells. Only uniform atlas resampling follows.
 await sharp(sourceBuffer).resize(512,512,{fit:'fill',kernel:'nearest'}).webp({quality:95,effort:6}).toFile(output);
 const tex=await sharp(sourceBuffer).resize(256,256,{fit:'fill',kernel:'nearest'}).ensureAlpha().raw().toBuffer();
 const wall=Buffer.alloc(512*768*4);
 for(let v=0;v<24;v++){
  const tile=v<16?16+v:48+v-16,tx=tile%8*32,ty=Math.floor(tile/8)*32;
  for(let mask=0;mask<16;mask++)for(let y=0;y<32;y++)for(let x=0;x<32;x++){
   const mi=((Math.floor(mask/4)*32+y)*128+mask%4*32+x)*4,ti=((ty+y)*256+tx+x)*4,di=((v*32+y)*512+mask*32+x)*4;
   const light=(masks[mi]*.2126+masks[mi+1]*.7152+masks[mi+2]*.0722)/255,gain=.2+light*1.5;
   for(let c=0;c<3;c++)wall[di+c]=Math.min(255,Math.round(tex[ti+c]*gain));wall[di+3]=masks[mi+3];
  }
 }
 await sharp(wall,{raw:{width:512,height:768,channels:4}}).webp({lossless:true}).toFile(wallOutput);
 records.push({route:input.route,generator:'ImageGen',theme:input.theme,source,sourceSha256:hash(sourceBuffer),originalToolOutput:from?input.source:input.originalToolOutput,output,sha256:hash(await fs.readFile(output)),cell:64,grid:[8,8],authoredCells:64,wallOutput,wallSha256:hash(await fs.readFile(wallOutput)),wallVariants:24,wallMasks:16,maskSource:maskPath,maskSha256:hash(maskBuffer)});
 console.log('Built',input.route,': 64 authored tiles, 24 wall textures × 16 existing corner masks.');
}
await fs.writeFile(manifest,JSON.stringify({generator:'ImageGen',description:'22 dedicated dungeon map sets; 1408 authored cells, with derived adjacency masks.',rows:['floor','worn floor','wall','wall ornament','water / ice / crack / pit','stairs','structural wall','floor inlay'],records},null,2)+'\n');
