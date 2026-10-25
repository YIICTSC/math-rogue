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
 forms.push({series,key:a.key,reference:a.reference,referenceSha256:await hash(a.reference.startsWith('public/')?a.reference:'public/'+a.reference),actions:a.output,actionsSha256:await hash(a.output.startsWith('public/')?a.output:'public/'+a.output),canonicalDirections,canonicalActionDirections:Object.fromEntries(['walk','attack','throw','swing','read','use','shoot'].map(action=>[action,Array.from({length:8},(_,i)=>i).filter(i=>series===1&&['attack','throw','swing','shoot'].includes(action)||series===2&&useCanonicalD2Pose(a.heroId,a.transformed,i,action))]))});
 }
}
assert.equal(forms.length,70);
const rendererFiles=['src/components/school-dungeon/student/actionGeometry.ts','src/components/school-dungeon/dungeons1/poseAtlas.ts','src/components/school-dungeon/dungeons1/drawHero.ts','src/components/school-dungeon/dungeons2/heroActions.ts','src/components/school-dungeon/dungeons2/directionPolicy.ts'];
const rendererSha256=Object.fromEntries(await Promise.all(rendererFiles.map(async path=>[path,await hash(path)])));
const dedicatedAnimations=JSON.parse(await fs.readFile('assets/dungeons2/dedicated-animations-build.json','utf8')).assets.map(a=>({key:a.key,path:a.output,sha256:a.sha256}));
const text=JSON.stringify({dedicatedAnimations,reviewDate:'2026-10-25',runtimePhaseDraws:12288,rendererSha256,directions:['S','N','E','W','SE','SW','NE','NW'],review:'Manual comparison of all 70 idle and action sheets; original direction sheets are the facing reference. D1 offensive actions use direction-aware poses from the original facing. D2 uses dedicated ImageGen animations for all eighteen forms; see dedicated-animations-build.json for all 2304 frame hashes and reviewed row mappings. No procedural D2 pose fallback.',forms},null,2)+'\n';
const path='docs/dungeons/direction-audit.json';if(process.argv.includes('--write'))await fs.writeFile(path,text);else assert.equal(await fs.readFile(path,'utf8'),text);
console.log('PASS: 70 reviewed forms and source hashes, canonical direction policy recorded.');
