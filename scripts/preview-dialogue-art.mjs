import fs from 'node:fs/promises';
import sharp from 'sharp';
const plan=JSON.parse(await fs.readFile('assets/dialogue/cast.json','utf8'));
const layout=JSON.parse(await fs.readFile('assets/dialogue/atlas-layouts.json','utf8'));
const out='tmp/dialogue/cast';await fs.mkdir(out,{recursive:true});
for(let page=0;page<Math.ceil(plan.cast.length/10);page++){
 const actors=plan.cast.slice(page*10,page*10+10),composite=[];
 for(const[slot,actor]of actors.entries()){
  const report=layout.reports.find(r=>r.actors.includes(actor.id));if(!report)continue;
  const row=report.actors.indexOf(actor.id);
  const label=Buffer.from(`<svg width="180" height="144"><text x="8" y="24" font-family="sans-serif" font-size="10" fill="#e7e3cc">${actor.id}</text></svg>`);
  composite.push({input:label,left:0,top:slot*154+28});
  for(let col=0;col<4;col++)composite.push({input:await sharp('public/'+report.output).extract({left:col*384,top:row*576,width:384,height:576}).resize(96,144).png().toBuffer(),left:180+col*96,top:slot*154+28});
 }
 const heading=Buffer.from(`<svg width="564" height="28">${plan.expressions.map((m,i)=>`<text x="${185+i*96}" y="19" fill="#d6c191" font-family="sans-serif" font-size="11">${m}</text>`).join('')}</svg>`);
 composite.push({input:heading,left:0,top:0});
 await sharp({create:{width:564,height:actors.length*154+28,channels:4,background:'#152b36'}}).composite(composite).png().toFile(`${out}/${page}.png`);
}
console.log(`Contact sheets: ${out}`);
