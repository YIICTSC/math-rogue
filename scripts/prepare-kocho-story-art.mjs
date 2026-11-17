import fs from 'node:fs/promises';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
const read=async path=>JSON.parse(await fs.readFile(path));
const scenes=await read('src/mini-games/kocho/story/scenes.json');
const sources=await read('assets/kocho/story/art-sources-v2.json');
const plan=await read('assets/kocho/story/cast-revision.json');
let revision={scenes:[]};try{revision=await read('assets/kocho/story/art-generation-v3.json');}catch(e){if(e.code!=='ENOENT')throw e;}
const revisions=new Map(revision.scenes.map(row=>[row.id,row]));
const scope=process.argv.includes('--hero')?process.argv[process.argv.indexOf('--hero')+1]:null;
if(scope&&!['original','rebel','akari'].includes(scope))throw Error('Unknown hero scope');
const previous=await read('assets/kocho/story/art-build.json');const record=new Map(previous.map(row=>[row.id,row]));
const hash=data=>createHash('sha256').update(data).digest('hex');
await fs.mkdir('public/sprites/kocho/story',{recursive:true});
for(const scene of scenes.filter(s=>!scope||s.hero===scope)){
 const updated=revisions.get(scene.id),version=updated?3:2,source=updated?.source??sources[scene.id];
 if(!source)throw Error('Missing generated CG: '+scene.id);
 const archive=`assets/kocho/story/originals-v${version}/${scene.id}.png`,output='public/'+scene.image;
 await fs.mkdir(`assets/kocho/story/originals-v${version}`,{recursive:true});
 try{await fs.access(archive);}catch(e){if(e.code!=='ENOENT')throw e;await fs.copyFile(source,archive);}
 await sharp(archive).resize({width:1536,height:864,fit:'cover',position:'attention'}).webp({quality:88}).toFile(output);
 const original=await fs.readFile(archive),data=await fs.readFile(output),entry=plan.find(p=>p.scene===scene.id);
 record.set(scene.id,{id:scene.id,generator:'ImageGen',version,cast:scene.cast,guest:scene.guest,referenceArt:entry.referenceArt,referenceSha256:hash(await fs.readFile(entry.referenceArt)),
  ...(updated?{heroReference:revision.heroReference,heroReferenceSha256:hash(await fs.readFile(revision.heroReference)),promptSha256:hash(updated.prompt)}:{}),
  archive,output,sourceSha256:hash(original),sha256:hash(data),bytes:data.length});
}
await fs.writeFile('assets/kocho/story/art-build.json',JSON.stringify(scenes.map(s=>record.get(s.id)),null,2)+'\n');
await fs.writeFile('assets/kocho/story/art-sources.json',JSON.stringify({...sources,...Object.fromEntries(revision.scenes.map(row=>[row.id,row.source]))},null,2)+'\n');
await fs.mkdir('tmp/kocho-story-qa',{recursive:true});
const tiles=[];for(let i=0;i<scenes.length;i++)tiles.push({input:await sharp('public/'+scenes[i].image).resize(320,180).toBuffer(),left:i%3*320,top:Math.floor(i/3)*180});
await sharp({create:{width:960,height:1440,channels:3,background:'#101a2a'}}).composite(tiles).png().toFile('tmp/kocho-story-qa/art-preview.png');
console.log('Prepared',scenes.filter(s=>!scope||s.hero===scope).length,'cast-matched story illustrations; other records preserved.');
