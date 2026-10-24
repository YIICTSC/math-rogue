import fs from 'node:fs/promises';
import sharp from 'sharp';
import crypto from 'node:crypto';
const routes=JSON.parse(await fs.readFile('assets-source/dungeons-chronicles/routes.json','utf8'));
const manifestPath='assets-source/dungeons-chronicles/art-generation.json';
const previous=JSON.parse(await fs.readFile(manifestPath,'utf8').catch(error=>{if(error.code==='ENOENT')return '{"records":[]}';throw error;}));
await fs.writeFile('src/components/school-dungeon/chronicles/routes.json',JSON.stringify(routes,null,2)+'\n');
const records=[];const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const r of routes)for(const type of ['npc','event']){
 const source=`assets-source/dungeons-chronicles/generated/${r.id.toLowerCase()}-${type}.png`,output=`public/sprites/dungeons-chronicles/${type}/${r.id.toLowerCase()}.webp`;
 let data;try{data=await fs.readFile(source);}catch(error){
  if(error.code!=='ENOENT')throw error;
  const retained=previous.records.find(a=>a.source===source&&a.output===output&&a.sourceRetained===false);
  if(retained){
   if(sha(await fs.readFile(output))!==retained.sha256)throw Error('WebP hash mismatch: '+output);
   records.push(retained);continue;
  }
  if(process.argv.includes('--partial'))continue;throw Error('Missing '+source);
 }
 await fs.mkdir(`public/sprites/dungeons-chronicles/${type}`,{recursive:true});
 const pipeline=sharp(data);if(type==='npc')await pipeline.trim({threshold:12}).resize(448,576,{fit:'contain',background:'#00000000',kernel:'nearest'}).webp({lossless:true}).toFile(output);
 else await pipeline.resize(960,640,{fit:'cover',position:'centre',kernel:'nearest'}).webp({quality:92}).toFile(output);
 records.push({route:r.id,type,source,sourceSha256:sha(data),output,sha256:sha(await fs.readFile(output)),generator:'ImageGen',reference:type==='npc'?'public/sprites/high-school/characters/0.webp':null,transparent:type==='npc'});
}
await fs.writeFile('assets-source/dungeons-chronicles/art-generation.json',JSON.stringify({generator:'ImageGen',npcStyleReference:'public/sprites/high-school/characters/0.webp',eventFormat:'960x640',portraitFormat:'448x576 RGBA',records},null,2)+'\n');console.log('Normalized',records.length,'original character/event images');
