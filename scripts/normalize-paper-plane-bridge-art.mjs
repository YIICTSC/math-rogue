import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const sources=process.argv[2];if(!sources)throw Error('Usage: node scripts/normalize-paper-plane-bridge-art.mjs <retained-ImageGen-source-directory>');
const record=JSON.parse(await fs.readFile('assets/paper-plane/bridge-art-build.json','utf8')),out='public/sprites/paper-plane/bridge';await fs.mkdir(out,{recursive:true});
for(const sheet of record.sheets)for(const [expression,file]of Object.entries(sheet.sources)){
 const source=path.join(sources,file),m=await sharp(source).metadata();
 for(const [i,id]of sheet.ids.entries()){
  const col=i%sheet.columns,row=Math.floor(i/sheet.columns),left=Math.round(col*m.width/sheet.columns),top=Math.round(row*m.height/sheet.rows);
  const width=Math.round((col+1)*m.width/sheet.columns)-left,height=Math.round((row+1)*m.height/sheet.rows)-top;
  await sharp(source).extract({left,top,width,height}).resize(420,420).webp({quality:88}).toFile(`${out}/${id}${expression==='normal'?'':'-'+expression}.webp`);
 }
}
await sharp(path.join(sources,record.title_source)).webp({quality:88}).toFile(`${out}/title.webp`);
console.log('Normalized 120 original captain/rival expressions and the title key visual.');
