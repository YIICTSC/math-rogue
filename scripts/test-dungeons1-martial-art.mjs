import assert from 'node:assert/strict';import fs from 'node:fs/promises';import crypto from 'node:crypto';import sharp from 'sharp';
const plan=JSON.parse(await fs.readFile('assets/dungeons1/martial-art.json','utf8')),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.deepEqual(plan.assets,[]);assert.equal(plan.retiredAssets.length,52);
for(const a of plan.retiredAssets)await assert.rejects(fs.access(a.output));
const weapons=await sharp(plan.weapons.output).metadata();assert.equal(weapons.width,512);assert.equal(weapons.height,384);assert(weapons.hasAlpha);assert.equal(sha(await fs.readFile(plan.weapons.output)),plan.weapons.sha256);
for(const file of ['public/web-asset-manifest.json','public/android-asset-pack-manifest.json']){const manifest=JSON.parse(await fs.readFile(file,'utf8')),files=Object.values(manifest.packs).flatMap(p=>p.files);assert(files.some(f=>f.path===plan.weapons.output.slice(7)));for(const a of plan.retiredAssets)assert(!files.some(f=>f.path===a.output.slice(7)));}
console.log('PASS: 52 one-direction technique sheets retired; weapon/effect art retained and manifests exclude retired sheets.');
