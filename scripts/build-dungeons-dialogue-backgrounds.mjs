import fs from 'node:fs/promises';import sharp from 'sharp';import crypto from 'node:crypto';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const from=process.argv[2],manifest='assets-source/dungeons-chronicles/background-generation.json';
const inputs=from?JSON.parse(await fs.readFile(from,'utf8')):JSON.parse(await fs.readFile(manifest,'utf8')).records,records=[];
await fs.mkdir('assets-source/dungeons-chronicles/backgrounds',{recursive:true});await fs.mkdir('public/sprites/dungeons-chronicles/background',{recursive:true});
for(const input of inputs){const id=input.route.toLowerCase(),source=`assets-source/dungeons-chronicles/backgrounds/${id}.webp`,output=`public/sprites/dungeons-chronicles/background/${id}.webp`;
 if(from)await sharp(input.source).webp({lossless:true}).toFile(source);
 const bytes=await fs.readFile(source);await sharp(bytes).resize(960,640,{fit:'cover'}).webp({quality:90,effort:6}).toFile(output);
 records.push({route:input.route,generator:'ImageGen',content:'character-free environment background',setting:input.setting,source,sourceSha256:hash(bytes),output,sha256:hash(await fs.readFile(output)),originalToolOutput:from?input.source:input.originalToolOutput});
}
await fs.writeFile(manifest,JSON.stringify({format:'960x640 environment-only WebP',records},null,2)+'\n');console.log('Built '+records.length+' dedicated dialogue backgrounds.');
