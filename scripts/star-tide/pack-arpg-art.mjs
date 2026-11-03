import sharp from 'sharp';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='assets/star-tide/arpg',out='public/sprites/star-tide/arpg',records=[];
await fs.mkdir(out,{recursive:true});
async function cell(input,size=108){return sharp(input).trim({threshold:8}).resize(size,size,{fit:'inside'}).extend({top:0,bottom:0,left:0,right:0}).png().toBuffer();}
async function atlas(name,cols,rows,source){
 const bytes=await fs.readFile(source),meta=await sharp(bytes).metadata(),cells=[];
 for(let i=0;i<cols*rows;i++){
  const c=i%cols,r=Math.floor(i/cols),left=Math.round(c*meta.width/cols),top=Math.round(r*meta.height/rows),width=Math.round((c+1)*meta.width/cols)-left,height=Math.round((r+1)*meta.height/rows)-top;
  const sprite=await cell(await sharp(bytes).extract({left,top,width,height}).png().toBuffer(),name==='combat-fx'?116:108),s=await sharp(sprite).metadata();
  cells.push({input:sprite,left:c*128+Math.floor((128-s.width)/2),top:r*128+Math.floor((128-s.height)/2)});
 }
 const target=`${out}/${name}.webp`;await sharp({create:{width:cols*128,height:rows*128,channels:4,background:'#00000000'}}).composite(cells).webp({quality:94,alphaQuality:100}).toFile(target);
 records.push({name,generator:'ImageGen',source,sourceSha256:createHash('sha256').update(bytes).digest('hex'),grid:[cols,rows],cell:128,output:target,outputSha256:createHash('sha256').update(await fs.readFile(target)).digest('hex')});
}
await atlas('relics',4,3,`${root}/relics-imagegen-source.png`);await atlas('combat-fx',4,2,`${root}/combat-fx-imagegen-source.png`);
const altarCells=[];for(const[i,name]of ['hunt','arena','voyage'].entries()){const sprite=await cell(await fs.readFile(`${root}/blender/${name}.png`),112),m=await sharp(sprite).metadata();altarCells.push({input:sprite,left:i*128+Math.floor((128-m.width)/2),top:120-m.height});}
await sharp({create:{width:384,height:128,channels:4,background:'#00000000'}}).composite(altarCells).webp({quality:94,alphaQuality:100}).toFile(`${out}/altars.webp`);
await atlas('action-icons',4,4,`${root}/action-icons-imagegen-source.png`);
records.push({name:'altars',generator:'Blender 4.3.2 / Cycles CPU, 48 samples, orthographic transparent render',source:`${root}/blender/trial-altars.blend`,script:'scripts/star-tide/build-trial-altars.py',grid:[3,1],cell:128,output:`${out}/altars.webp`,outputSha256:createHash('sha256').update(await fs.readFile(`${out}/altars.webp`)).digest('hex')});
await fs.writeFile(`${root}/art.json`,JSON.stringify({date:'2026-11-03',normalization:'Isolate authored grid cells; trim transparent padding; preserve aspect ratio; repack with at least six pixels of transparent breathing room.',relicOrder:['shell','conch','crescent','fang','sun','bloom','feather','compass','lens','leaf','knot','mirror'],fxOrder:['slash','impact','guard','starburst','fire','wind','chain','loot'],actionOrder:['sword','ring','wand','hook','hammer','bow','shield','spear','dodge','guard','target','burst','glide','interact','journal','map'],records},null,2)+'\n');
console.log('Packed 12 relics, eight effects, 16 action icons and three CPU-rendered altars.');
