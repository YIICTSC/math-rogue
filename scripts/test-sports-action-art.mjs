import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
for(const[sport,cols,rows]of[['basketball',3,3],['tennis',3,2]]){
 const meta=JSON.parse(await fs.readFile(`assets/${sport}/action-icons.json`,'utf8')),path=`public/${meta.runtime}`,image=sharp(path),info=await image.metadata();
 assert.equal(meta.generator,'ImageGen');assert.equal(info.width%cols,0);assert.equal(info.height%rows,0);assert(info.hasAlpha);assert.equal(meta.order.length,cols*rows);
 const hashes=new Set();for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const cell=await sharp(path).extract({left:x*info.width/cols,top:y*info.height/rows,width:info.width/cols,height:info.height/rows}).ensureAlpha().raw().toBuffer();let visible=0;
  for(let i=3;i<cell.length;i+=4)if(cell[i]>32)visible++;assert(visible>cell.length/4*.09,'action artwork must be visible');assert(visible<cell.length/4*.95,'tile must retain transparent margins');hashes.add(createHash('sha256').update(cell).digest('hex'));
 }
 assert.equal(hashes.size,cols*rows,'all actions must have distinct illustrations');console.log(`PASS: ${sport} ${cols*rows} distinct ImageGen cells, exact atlas geometry, alpha and visible game-scale content.`);
}
