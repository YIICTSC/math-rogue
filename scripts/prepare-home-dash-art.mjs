import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const sourceFile = process.argv[2] || '/workspace/dash-art-results.json';
const entries = JSON.parse(await fs.readFile(sourceFile, 'utf8'));
const out = 'public/sprites/go-home-dash';
await fs.mkdir(`${out}/heroes`, { recursive: true });
const records = [];
async function normalize(source, frameWidth, frameHeight) {
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const cells = [];
  for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) {
    const left = Math.round(col * info.width / 4), top = Math.round(row * info.height / 2);
    const width = Math.round((col + 1) * info.width / 4) - left, height = Math.round((row + 1) * info.height / 2) - top;
    let x0 = width, y0 = height, x1 = 0, y1 = 0;
    // Ignore nearly invisible antialiasing when locating the shared body scale.
    // Original alpha is retained in the extracted cells.
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (data[((top + y) * info.width + left + x) * 4 + 3] > 64) {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
    if (x1 <= x0 || y1 <= y0) throw new Error(`Empty frame ${source} ${row}/${col}`);
    cells.push({left:left+x0, top:top+y0, width:x1-x0+1, height:y1-y0+1});
  }
  const scale = Math.min((frameWidth-12)/Math.max(...cells.map(c=>c.width)), (frameHeight-16)/Math.max(...cells.map(c=>c.height)));
  const frames = [];
  for (let i=0;i<cells.length;i++) {
    const c = cells[i], width = Math.round(c.width*scale), height = Math.round(c.height*scale);
    frames.push({input:await sharp(source).extract(c).resize(width,height).png().toBuffer(), left:i%4*frameWidth+Math.round((frameWidth-width)/2), top:Math.floor(i/4)*frameHeight+frameHeight-8-height});
  }
  const result = await sharp({create:{width:frameWidth*4,height:frameHeight*2,channels:4,background:'#00000000'}}).composite(frames).webp({quality:93,alphaQuality:100}).toBuffer();
  return {result, scale, cells};
}
for (const {id,source} of entries) {
  const {result,scale,cells} = await normalize(source,128,160);
  await fs.writeFile(`${out}/heroes/${id}.webp`,result);
  records.push({id,source:path.basename(source),source_sha256:crypto.createHash('sha256').update(await fs.readFile(source)).digest('hex'),scale,cells});
}
const routeSources = process.argv[5] ? JSON.parse(await fs.readFile(process.argv[5], 'utf8')) : [];
await fs.mkdir(`${out}/routes`, {recursive:true});
const routeRecords = [];
for (const {id,source} of routeSources) {
  await sharp(source).resize(1280,640,{fit:'cover'}).webp({quality:86}).toFile(`${out}/routes/${id}.webp`);
  routeRecords.push({id,source:path.basename(source),source_sha256:crypto.createHash('sha256').update(await fs.readFile(source)).digest('hex')});
}
const title = process.argv[3], enemies = process.argv[4];
if (title) await sharp(title).resize(1600,900,{fit:'cover'}).webp({quality:88}).toFile(`${out}/title.webp`);
if (enemies) { const {result}=await normalize(enemies,128,128);await fs.writeFile(`${out}/enemies.webp`,result); }
await fs.writeFile('assets/go-home-dash/illustration-build.json',JSON.stringify({generator:'ImageGen',frames:8,layout:[4,2],frame_size:[128,160],actions:{dash:[0,1,2,3],jump:[4,5,6,7]},heroes:records,routes:routeRecords,title: title && path.basename(title),enemies: enemies && path.basename(enemies)},null,2)+'\n');
console.log(`Prepared ${records.length} runner atlases (${records.length*8} frames).`);
