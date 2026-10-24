import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const script=fileURLToPath(new URL('./generate-android-asset-manifest.mjs',import.meta.url));
const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'android-manifest-scope-'));
try{
 const prefix='sprites/dungeons1/actions/',bytes=Buffer.from('test atlas bytes');
 const packs={};
 for(const id of ['visual-elementary','visual-high-school','visual-magic','audio-common','audio-high-school','audio-magic']){
  const files=[{path:`preserved/${id}.webp`,size:123,sha256:'a'.repeat(64)}];
  packs[id]={id,files,totalBytes:123,version:'old'};
 }
 packs['visual-elementary'].files.push({path:prefix+'removed.webp',size:9,sha256:'b'.repeat(64)});
 await fs.mkdir(path.join(temporary,'public',prefix),{recursive:true});
 await fs.writeFile(path.join(temporary,'public',prefix,'magic-akari.webp'),bytes);
 await fs.writeFile(path.join(temporary,'public/android-asset-pack-manifest.json'),JSON.stringify({packs}));
 const run=(...args)=>execFileSync(process.execPath,[script,...args],{cwd:temporary,encoding:'utf8',stdio:'pipe'});
 run('--update-prefix',prefix);
 const output=JSON.parse(await fs.readFile(path.join(temporary,'public/android-asset-pack-manifest.json')));
 const entries=Object.values(output.packs).flatMap(p=>p.files);
 for(const id of Object.keys(packs))assert.deepEqual(entries.find(f=>f.path===`preserved/${id}.webp`),packs[id].files[0]);
 assert(!entries.some(f=>f.path.endsWith('/removed.webp')));
 const added=output.packs['visual-magic'].files.find(f=>f.path===prefix+'magic-akari.webp');
 assert.deepEqual(added,{path:prefix+'magic-akari.webp',size:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 for(const pack of Object.values(output.packs))assert.equal(pack.totalBytes,pack.files.reduce((total,f)=>total+f.size,0));
 const before=await fs.readFile(path.join(temporary,'public/android-asset-pack-manifest.json'),'utf8');
 run('--update-prefix',prefix);
 assert.equal(await fs.readFile(path.join(temporary,'public/android-asset-pack-manifest.json'),'utf8'),before,'scoped updates must be deterministic');
 for(const bad of ['../','/sprites/','./','sprites/../','sprites//','sprites\\actions/'])assert.throws(()=>run('--update-prefix',bad));
 console.log('PASS: scoped Android manifest updates retain unavailable unrelated assets, remove obsolete scoped entries, place new assets in the right theme, refresh hashes/totals deterministically and reject invalid prefixes.');
}finally{await fs.rm(temporary,{recursive:true,force:true});}
