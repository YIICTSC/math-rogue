const output=process.env.LANTERN_ARTIFACT_DIR||'.codex-artifacts/lantern-endless';
import sharp from 'sharp';
import fs from 'node:fs/promises';
const actions=['ready','windup','attack','guard','hurt','ultimate'];
const metrics=JSON.parse(await fs.readFile('src/mini-games/lantern-war/battleMetrics.json','utf8')).aster;
// Keep a single shared scale and bottom-centre anchor. No character is repainted.
const cell={width:768,height:896},scale=.85,baseline=780,parts=[];
for(const [i,action]of actions.entries()){
 const path=`public/sprites/lantern-war/heroes/aster-${action}.webp`,meta=await sharp(path).metadata(),m=metrics[action][0];
 const width=Math.round(meta.width*scale),height=Math.round(meta.height*scale);
 const image=await sharp(path).resize(width,height).png().toBuffer();
 parts.push({input:image,left:i%3*cell.width+Math.round(cell.width/2-m.footX*scale),top:Math.floor(i/3)*cell.height+Math.round(baseline-m.footY*scale)});
}
await fs.mkdir(output,{recursive:true});
await sharp({create:{width:cell.width*3,height:cell.height*2,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(parts).png().toFile(output+'/aster-actions-reference.png');
console.log('Aster reference: 3×2 cells, 768×896 each, shared 85% scale, bottom-centre anchor, extensive clear gutters.');
