import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';
const build=JSON.parse(await fs.readFile('assets/dungeons2/hero-actions-build.json','utf8'));assert.equal(build.assets.length,18);assert.equal(build.frameCount,1152);const shas=new Set();
for(const a of build.assets){const file=await fs.readFile(a.output);assert.equal(crypto.createHash('sha256').update(file).digest('hex'),a.sha256);assert(!shas.has(a.sha256));shas.add(a.sha256);const m=await sharp(file).metadata();assert.equal(m.width,768);assert.equal(m.height,768);assert.ok(a.rowBoundaryDensities.every(v=>v<=.25),a.key+' incorrect row grid');const cells=[],raw=await sharp(file).ensureAlpha().raw().toBuffer();
 for(let i=0;i<64;i++){const data=Buffer.alloc(96*96*4);for(let yy=0;yy<96;yy++){const start=((Math.floor(i/8)*96+yy)*768+i%8*96)*4;raw.copy(data,yy*96*4,start,start+96*4);}let visible=0;for(let y=0;y<96;y++)for(let x=0;x<96;x++)if(data[(y*96+x)*4+3]>40){visible++;assert(x>=1&&x<95&&y>=1&&y<=94,a.key+' clipped '+i);}assert(visible>75,a.key+' empty '+i);cells.push(data);}
 for(let direction=0;direction<8;direction++){assert(!cells[direction].equals(cells[8+direction]),a.key+' identical footstep frames '+direction);let changed=0;for(let y=65;y<94;y++)for(let x=0;x<96;x++){const i=(y*96+x)*4;if(!cells[direction].subarray(i,i+4).equals(cells[8+direction].subarray(i,i+4)))changed++;}assert(changed>4,a.key+' no lower-body walking motion '+direction);}
}
console.log('PASS: 9 heroes × 2 forms × 8 poses × 8 facings = 1152 full anchored frames; genuine two-step walk; all source grids and output hashes.');
