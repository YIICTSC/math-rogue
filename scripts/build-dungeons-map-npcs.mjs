import fs from 'node:fs/promises';
import sharp from 'sharp';
import crypto from 'node:crypto';
const routes=JSON.parse(await fs.readFile('src/components/school-dungeon/chronicles/routes.json','utf8')),records=[];
for(const route of routes){const id=route.id.toLowerCase(),source=`public/sprites/dungeons-chronicles/npc/${id}.webp`,output=`public/sprites/dungeons-chronicles/map-npc/${id}.webp`;
 const buffer=await fs.readFile(source),trimmed=await sharp(buffer).trim({background:'#00000000',threshold:5}).toBuffer();
 // Keep every costume/proportion; a single uniform scale, shared foot anchor (64,124).
 const resized=await sharp(trimmed).resize(112,120,{fit:'inside',kernel:'nearest'}).png().toBuffer({resolveWithObject:true});
 await sharp({create:{width:128,height:128,channels:4,background:'#00000000'}}).composite([{input:resized.data,left:Math.floor((128-resized.info.width)/2),top:124-resized.info.height}]).webp({lossless:true}).toFile(output);
 records.push({route:route.id,source,sourceSha256:crypto.createHash('sha256').update(buffer).digest('hex'),output,sha256:crypto.createHash('sha256').update(await fs.readFile(output)).digest('hex'),footAnchor:[64,124],generator:'ImageGen (existing full-body NPC); uniform normalization only'});
}
await fs.writeFile('assets-source/dungeons-chronicles/map-npc-build.json',JSON.stringify({records},null,2)+'\n');console.log('Normalized 22 generated full-body NPCs at a common traveler-sized foot anchor.');
