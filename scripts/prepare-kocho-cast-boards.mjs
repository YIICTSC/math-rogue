import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const cast=JSON.parse(await fs.readFile('assets/kocho/story/cast-revision.json'));
await fs.mkdir('tmp/kocho-story-cast/boards',{recursive:true});
for(const item of cast){const scene=await sharp(item.oldImage).resize(1024,576,{fit:'contain',background:'#10243b'}).png().toBuffer(),guest=await sharp(item.referenceArt).resize(256,576,{fit:'contain',background:'#25394b'}).png().toBuffer();await sharp({create:{width:1280,height:576,channels:4,background:'#10243b'}}).composite([{input:scene,left:0,top:0},{input:guest,left:1024,top:0}]).png().toFile(item.board);}
console.log('Prepared',cast.length,'old-scene and canonical-guest reference boards.');
