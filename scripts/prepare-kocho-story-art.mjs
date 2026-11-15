import fs from 'node:fs/promises';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
const scenes=JSON.parse(await fs.readFile('src/mini-games/kocho/story/scenes.json'));
const sources=JSON.parse(await fs.readFile('assets/kocho/story/art-sources-v2.json'));
const plan=JSON.parse(await fs.readFile('assets/kocho/story/cast-revision.json'));
const record=[],hash=data=>createHash('sha256').update(data).digest('hex');
await fs.mkdir('assets/kocho/story/originals-v2',{recursive:true});
await fs.mkdir('public/sprites/kocho/story',{recursive:true});
for(const scene of scenes){
 if(!sources[scene.id])throw Error('Missing generated CG: '+scene.id);
 const archive=`assets/kocho/story/originals-v2/${scene.id}.png`,output='public/'+scene.image;
 try{await fs.access(archive);}catch{await fs.copyFile(sources[scene.id],archive);}
 await sharp(archive).resize({width:1536,height:864,fit:'cover',position:'attention'}).webp({quality:88}).toFile(output);
 const source=await fs.readFile(archive),data=await fs.readFile(output),entry=plan.find(p=>p.scene===scene.id);
 record.push({id:scene.id,generator:'ImageGen',version:2,cast:scene.cast,guest:scene.guest,referenceArt:entry.referenceArt,referenceSha256:hash(await fs.readFile(entry.referenceArt)),archive,output,sourceSha256:hash(source),sha256:hash(data),bytes:data.length});
}
await fs.writeFile('assets/kocho/story/art-build.json',JSON.stringify(record,null,2)+'\n');
await fs.writeFile('assets/kocho/story/art-sources.json',JSON.stringify(sources,null,2)+'\n');
await fs.mkdir('tmp/kocho-story-qa',{recursive:true});
const tiles=[];for(let i=0;i<scenes.length;i++)tiles.push({input:await sharp('public/'+scenes[i].image).resize(320,180).toBuffer(),left:i%3*320,top:Math.floor(i/3)*180});
await sharp({create:{width:960,height:1440,channels:3,background:'#101a2a'}}).composite(tiles).png().toFile('tmp/kocho-story-qa/art-preview.png');
console.log('Prepared',record.length,'cast-matched story illustrations.');
