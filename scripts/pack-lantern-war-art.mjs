import fs from 'node:fs/promises';
import sharp from 'sharp';
const root='public/sprites/lantern-war',sourceRoot='assets/lantern-war';
const metadata=(await fs.readFile(sourceRoot+'/imagegen.jsonl','utf8')).replace(/^\uFEFF/,'').trim().split('\n').map(line=>JSON.parse(line));
await fs.mkdir(sourceRoot+'/sources',{recursive:true});await fs.mkdir(root,{recursive:true});
const packed=[];
for(const entry of metadata){
 const file=entry.file;if(!file)throw Error('No generated file: '+entry.id);
 if(entry.kind==='ui')continue;
 const key=entry.id+'-'+entry.kind;if(file.replaceAll('\\','/')!==sourceRoot+'/sources/'+key+'.png')await fs.copyFile(file,sourceRoot+'/sources/'+key+'.png');
 if(entry.id==='lyra'&&entry.kind==='battle')continue;
 const output=entry.kind==='battle-fixed'?'lyra-battle':key;
 const m=await sharp(file).metadata();let cols=1,rows=1,tile=384;
 if(entry.kind==='map'){cols=4;rows=3;tile=128;}
 if(entry.kind.startsWith('battle')){cols=['aster','lyra'].includes(entry.id)?4:3;rows=2;}
 if(entry.kind==='scenery'){for(let i=0;i<4;i++){const w=Math.floor(m.width/2),h=Math.floor(m.height/2);await sharp(file).extract({left:(i%2)*w,top:Math.floor(i/2)*h,width:w,height:h}).resize(1280,720,{fit:'cover'}).webp({quality:88}).toFile(root+'/scenery-'+i+'.webp');}continue;}
 if(entry.id==='ui-frame'){await sharp(file).resize({width:1536}).webp({quality:88,alphaQuality:100}).toFile(root+'/ui-frame.webp');continue;}
 if(entry.id==='ui-kit'){
 const names=['ui-button','ui-button-active','ui-name','ui-crest','ui-alert','ui-dialogue'];
 for(let i=0;i<6;i++){const w=Math.floor(m.width/3),h=Math.floor(m.height/2);await sharp(await sharp(file).extract({left:(i%3)*w,top:Math.floor(i/3)*h,width:w,height:h}).png().toBuffer()).trim({threshold:20}).resize({width:i===3?256:768}).webp({quality:90,alphaQuality:100}).toFile(root+'/'+names[i]+'.webp');}continue;}
 const composites=[];
 for(let i=0;i<cols*rows;i++){const w=Math.floor(m.width/cols),h=Math.floor(m.height/rows);const buffer=await sharp(await sharp(file).extract({left:i%cols*w,top:Math.floor(i/cols)*h,width:w,height:h}).png().toBuffer()).trim({threshold:8}).resize(tile-8,tile-8,{fit:'contain',background:'#00000000'}).png().toBuffer();composites.push({input:buffer,left:i%cols*tile+4,top:Math.floor(i/cols)*tile+4});}
 await sharp({create:{width:cols*tile,height:rows*tile,channels:4,background:'#00000000'}}).composite(composites).webp({quality:88,alphaQuality:100}).toFile(root+'/'+output+'.webp');
 const stats=await sharp(file).stats();packed.push({id:entry.id,kind:entry.kind,cols,rows,tile,alphaMin:stats.channels[3]?.min,alphaMax:stats.channels[3]?.max});
}
await fs.writeFile(sourceRoot+'/packed.json',JSON.stringify(packed,null,2)+'\n');console.log('Packed '+packed.length+' character atlases and four story backgrounds.');
