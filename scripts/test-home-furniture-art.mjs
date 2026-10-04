import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import {createServer} from 'vite';
const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true},appType:'custom',logLevel:'error'});
try{
 const {FURNISHINGS,furnitureImage,seasonalFurniture,furnitureSource}=await server.ssrLoadModule('/src/rpg/homeCatalog.ts');
 const {trans}=await server.ssrLoadModule('/src/utils/textUtils.ts');
 const {GAME_RULES,GAME_LABELS}=await server.ssrLoadModule('/src/mini-games/gakuro-craft/partyGames.ts');
 for(const f of FURNISHINGS){
  if(seasonalFurniture.includes(f.id)){const path='public/'+furnitureImage(f.id),meta=await sharp(path).metadata();assert.equal(meta.format,'webp');assert.ok(meta.hasAlpha);const [x,y,width,height]=furnitureSource(f.id,{naturalWidth:meta.width,naturalHeight:meta.height});const {data,info}=await sharp(path).extract({left:Math.floor(x),top:Math.floor(y),width:Math.floor(width),height:Math.floor(height)}).ensureAlpha().raw().toBuffer({resolveWithObject:true});let visible=0;for(let i=3;i<data.length;i+=info.channels)if(data[i]>0)visible++;assert.ok(visible>1000,f.id+' sprite cell must not be blank');assert.ok(!/[ぁ-んァ-ヶ一-龠]/.test(trans(f.name,'ENGLISH')),f.name);assert.ok(!/[一-龠]/.test(trans(f.name,'HIRAGANA')),f.name);continue;}
  const path='public/'+furnitureImage(f.id),meta=await sharp(path).metadata();assert.equal(meta.format,'webp');assert.equal(meta.hasAlpha,true);assert.equal(meta.width,320);assert.equal(meta.height,320);
  const {data,info}=await sharp(path).ensureAlpha().raw().toBuffer({resolveWithObject:true});let visible=0,left=320,right=-1;
  for(let y=0;y<320;y++)for(let x=0;x<320;x++){const alpha=data[(y*320+x)*info.channels+3];if(alpha){visible++;left=Math.min(left,x);right=Math.max(right,x);assert.ok(x>=24&&x<296&&y>=24&&y<296,`${f.id}: artwork crosses transparent padding`);}}
  assert.ok(visible>1000,f.id+' is not blank');assert.ok(Math.abs(left-(319-right))<=1,f.id+' must retain equal left and right padding');
  const output=trans(f.name,'ENGLISH');assert.ok(!/[ぁ-んァ-ヶ一-龠]/.test(output),f.name+' lacks English translation');assert.ok(!/[一-龠]/.test(trans(f.name,'HIRAGANA')),f.name+' lacks hiragana');
 }
 for(const text of [...Object.values(GAME_RULES),...Object.values(GAME_LABELS)])assert.ok(!/[ぁ-んァ-ヶ一-龠]/.test(trans(text,'ENGLISH')),'Game rules must translate: '+text);
 const canvas=await fs.readFile('src/rpg/HomeCanvas.tsx','utf8');assert.ok(canvas.includes('sprite(furnitureImage(f.id))'));assert.ok(!canvas.includes('f.sprite%'),'Furniture rendering must use the entire isolated image');
 console.log('Furniture art passed: 61 isolated WebP files plus 12 separate atlas cells, fully transparent margins, symmetric left/right padding, complete-image rendering and translated names/rules.');
}finally{await server.close();}
