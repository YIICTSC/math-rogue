import fs from 'node:fs/promises';import path from 'node:path';import sharp from 'sharp';
const metadata=(await fs.readFile('assets/lantern-war/visual-upgrade.jsonl','utf8')).replace(/^\uFEFF/,'').trim().split('\n').map(line=>JSON.parse(line));
const root='public/sprites/lantern-war';await fs.mkdir(root+'/heroes',{recursive:true});await fs.mkdir(root+'/dialogue',{recursive:true});await fs.mkdir('assets/lantern-war/sources-v2',{recursive:true});
const normalized=[];
for(const entry of metadata){
 const source='assets/lantern-war/sources-v2/'+entry.id+'.png';
 if(path.resolve(entry.file)!==path.resolve(source))await fs.copyFile(entry.file,source);
 const m=await sharp(source).metadata();
 if(entry.kind==='hero'){
  const buffer=await sharp(source).trim({threshold:10}).png().toBuffer();
  await sharp(buffer).resize(512,640,{fit:'contain',background:'#00000000'}).extend({left:48,right:48,top:48,bottom:48,background:'#00000000'}).webp({quality:92,alphaQuality:100}).toFile(root+'/heroes/'+entry.id+'.webp');
 }else if(entry.kind==='battle-clean'){
  await sharp(source).resize(1152,768,{fit:'fill'}).webp({quality:94,alphaQuality:100}).toFile(root+'/'+entry.id+'-battle.webp');
 }else if(entry.kind==='dialogue'){
  const buffer=await sharp(source).trim({threshold:10}).png().toBuffer();
  await sharp(buffer).resize(576,864,{fit:'contain',background:'#00000000'}).extend({left:24,right:24,top:24,bottom:0,background:'#00000000'}).webp({quality:93,alphaQuality:100}).toFile(root+'/dialogue/'+entry.id+'.webp');
 }else if(entry.kind==='background'||entry.kind==='world'){
  await sharp(source).resize(entry.kind==='world'?1800:1600,entry.kind==='world'?1200:900,{fit:'cover'}).webp({quality:91}).toFile(root+'/'+entry.id+'.webp');
 }else if(entry.kind==='terrain'){
  await sharp(source).resize(1024,1024,{fit:'fill'}).webp({quality:94}).toFile(root+'/'+entry.id+'.webp');
 }else if(entry.kind==='props'){
  const composites=[],tile=256,w=Math.floor(m.width/4),h=Math.floor(m.height/4);
  for(let i=0;i<16;i++){
   const crop=await sharp(source).extract({left:i%4*w,top:Math.floor(i/4)*h,width:w,height:h}).png().toBuffer();
   const buffer=await sharp(crop).trim({threshold:10}).resize(224,224,{fit:'contain',background:'#00000000'}).png().toBuffer();
   composites.push({input:buffer,left:i%4*tile+16,top:Math.floor(i/4)*tile+16});
  }
  await sharp({create:{width:1024,height:1024,channels:4,background:'#00000000'}}).composite(composites).webp({quality:92,alphaQuality:100}).toFile(root+'/map-props.webp');
 }
 normalized.push({...entry,file:source});
}
await fs.writeFile('assets/lantern-war/visual-upgrade.jsonl',normalized.map(e=>JSON.stringify(e)).join('\n')+'\n');
console.log('Packed '+normalized.length+' visual upgrades.');
