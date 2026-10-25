import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const result=await build({entryPoints:['src/components/school-dungeon/dungeons2/directionPolicy.ts'],bundle:true,write:false,format:'esm'});
const {useCanonicalD2Pose}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const hash=async path=>createHash('sha256').update(await fs.readFile(path)).digest('hex');
const forms=[];
for(const series of [1,2]){
 const data=JSON.parse(await fs.readFile(`assets/dungeons${series}/hero-actions-build.json`,'utf8'));
 for(const a of data.assets){
 const canonicalDirections=Array.from({length:8},(_,i)=>i).filter(i=>series===2&&useCanonicalD2Pose(a.heroId,a.transformed,i));
 forms.push({series,key:a.key,reference:a.reference,referenceSha256:await hash(a.reference.startsWith('public/')?a.reference:'public/'+a.reference),actions:a.output,actionsSha256:await hash(a.output.startsWith('public/')?a.output:'public/'+a.output),canonicalDirections});
 }
}
assert.equal(forms.length,70);
const text=JSON.stringify({reviewDate:'2026-10-25',directions:['S','N','E','W','SE','SW','NE','NW'],review:'Manual comparison of all 70 idle and action sheets; original direction sheets are the facing reference. D1 retains painted art. D2 diagonal actions use articulated reference art; normal Lyria east does likewise.',forms},null,2)+'\n';
const path='docs/dungeons/direction-audit.json';if(process.argv.includes('--write'))await fs.writeFile(path,text);else assert.equal(await fs.readFile(path,'utf8'),text);
console.log('PASS: 70 reviewed forms and source hashes, canonical direction policy recorded.');
