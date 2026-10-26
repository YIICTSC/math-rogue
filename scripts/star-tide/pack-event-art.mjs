/** Rebuild delivery images from the retained ImageGen originals. */
import fs from 'node:fs/promises';import sharp from 'sharp';import{createHash}from'node:crypto';
const path='assets/star-tide/event-art.json',manifest=JSON.parse(await fs.readFile(path,'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const record of manifest.records){const source=await fs.readFile(record.source);const output=await sharp(source).resize(1200,800,{fit:'cover'}).webp({quality:91,effort:6}).toBuffer();await fs.writeFile(record.output,output);record.sourceSha256=hash(source);record.sha256=hash(output);}
await fs.writeFile(path,JSON.stringify(manifest,null,2)+'\n');
