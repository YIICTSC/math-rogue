import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const plan=JSON.parse(await fs.readFile('assets/academy-sports/batting-art-plan.json'));
const heroes=JSON.parse((await fs.readFile('src/three/protagonistCatalog.ts','utf8')).split('export const PROTAGONISTS = ')[1].split(' as const')[0]);
const files=[],sources=[];
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const item of plan.entries){
 const key=item.kind==='batting'?'batting-'+item.group:item.kind;
 const archive=`assets/academy-sports/batting-art/originals/${key}.png`;
 await fs.mkdir(path.dirname(archive),{recursive:true});
 try{await fs.access(archive);}catch{await fs.copyFile(item.source,archive);}
 sources.push({key,path:archive,sha256:hash(await fs.readFile(archive)),references:item.references||[]});
 const meta=await sharp(archive).metadata();
 const save=async(hero,sport,move,column,row,columns,rows,target)=>{
  const left=Math.floor(column*meta.width/columns),top=Math.floor(row*meta.height/rows),width=Math.floor((column+1)*meta.width/columns)-left,height=Math.floor((row+1)*meta.height/rows)-top;
  await fs.mkdir(path.dirname(target),{recursive:true});
  await sharp(archive).extract({left,top,width,height}).resize(512,512,{fit:'contain',background:'#00000000'}).webp({quality:90,alphaQuality:100}).toFile(target);
  const bytes=await fs.readFile(target);files.push({hero,sport,move,path:target,source:archive,cell:{column,row,columns,rows},sha256:hash(bytes),bytes:bytes.length});
 };
 if(item.kind==='batting')for(let i=0;i<(item.group===8?3:4);i++){const hero=heroes[item.group*4+i].id;await save(hero,'baseball','drive',i%2,Math.floor(i/2),2,2,`public/sprites/academy-sports/cutins/batting/${hero}-v1.webp`);}
 else if(item.kind==='madoka-pitch')await save('magic-madoka','baseball','pitch',0,0,1,1,'public/sprites/academy-sports/cutins/corrections/magic-madoka-baseball-v2.webp');
 else if(item.kind==='tsubasa-sports')for(const [i,sport]of ['baseball','soccer','volleyball'].entries())await save('magic-tsubasa',sport,sport==='baseball'?'pitch':sport==='soccer'?'shot':'spike',i,0,3,1,`public/sprites/academy-sports/cutins/corrections/magic-tsubasa-${sport}-v2.webp`);
 else if(item.kind==='tsubasa-classic')for(const [i,sport]of ['golf','tennis','basketball','dodgeball'].entries())await save('magic-tsubasa',sport,'special',i%2,Math.floor(i/2),2,2,`public/sprites/sports-cutins/corrections/magic-tsubasa-${sport}-v2.webp`);
}
await fs.writeFile('assets/academy-sports/batting-art.json',JSON.stringify({generator:'ImageGen',batting:35,corrections:8,sources,files},null,2)+'\n');
const tiles=[];for(const [i,f]of files.entries())tiles.push({input:await sharp(f.path).resize(160,160).toBuffer(),left:i%7*160,top:Math.floor(i/7)*160});await fs.mkdir('tmp/academy-court-qa',{recursive:true});await sharp({create:{width:1120,height:Math.ceil(files.length/7)*160,channels:4,background:'#0c1e30'}}).composite(tiles).png().toFile('tmp/academy-court-qa/batting-contact.png');
console.log('Packaged',files.length,'individual cut-ins from',sources.length,'preserved ImageGen sources.');
