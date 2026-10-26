/** Re-encode ImageGen originals; layout and painting are supplied by ImageGen. */
import fs from 'node:fs/promises';import sharp from 'sharp';import{createHash}from'node:crypto';
const previous=JSON.parse(await fs.readFile('assets/star-tide/presentation.json','utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex'),images=[];
for(const {id,source,output}of previous.images){const input=await fs.readFile(source);const bytes=await sharp(input).resize({width:1920,height:1920,fit:'inside',withoutEnlargement:true}).webp({quality:88,effort:6}).toBuffer();await fs.writeFile('public/'+output,bytes);const{width,height}=await sharp(bytes).metadata();images.push({id,generator:'ImageGen',source,sourceSha256:hash(input),output,outputSha256:hash(bytes),width,height});}
await fs.writeFile('assets/star-tide/presentation.json',JSON.stringify({version:1,images},null,2)+'\n');
