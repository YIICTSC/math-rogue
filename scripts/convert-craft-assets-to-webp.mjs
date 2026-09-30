import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const assetsDir=path.resolve('src/mini-games/gakuro-craft/assets');
const entries=await fs.readdir(assetsDir,{withFileTypes:true});
let sourceBytes=0,webpBytes=0,converted=0;
for(const entry of entries){
 if(!entry.isFile()||!entry.name.toLowerCase().endsWith('.png'))continue;
 const source=path.resolve(assetsDir,entry.name),target=path.resolve(assetsDir,entry.name.replace(/\.png$/i,'.webp'));
 if(path.dirname(source)!==assetsDir||path.dirname(target)!==assetsDir)throw new Error('Unexpected asset path');
 const before=await sharp(source).metadata(),beforeStats=await sharp(source).stats(),hasTransparency=!!before.hasAlpha&&beforeStats.channels[3]?.min<255;
 await sharp(source).webp({quality:92,alphaQuality:100,effort:6,smartSubsample:true}).toFile(target);
 const after=await sharp(target).metadata(),afterStats=await sharp(target).stats(),preservedTransparency=!!after.hasAlpha&&afterStats.channels[3]?.min<255;
 if(before.width!==after.width||before.height!==after.height||(hasTransparency&&!preservedTransparency)||after.format!=='webp')throw new Error(`WebP conversion mismatch: ${entry.name}`);
 const [a,b]=await Promise.all([fs.stat(source),fs.stat(target)]);sourceBytes+=a.size;webpBytes+=b.size;
 await fs.unlink(source);converted++;
 console.log(`${entry.name} -> ${path.basename(target)} (${a.size} -> ${b.size} bytes, ${before.width}x${before.height}, alpha=${hasTransparency})`);
}
console.log(`Converted ${converted} craft image PNGs: ${sourceBytes} -> ${webpBytes} bytes (${((1-webpBytes/sourceBytes)*100).toFixed(1)}% smaller)`);
