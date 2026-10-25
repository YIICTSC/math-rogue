import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=async path=>createHash('sha256').update(await fs.readFile(path)).digest('hex');
const old=JSON.parse(await fs.readFile('assets-source/dungeons2/voice-generation.json','utf8'));
const added=JSON.parse(await fs.readFile('assets-source/dungeons-chronicles/voice-generation.json','utf8')).clips.filter(c=>c.actor.startsWith('dungeons2-'));
assert.equal(old.clips.length,270);assert.equal(added.length,189);
const clips=[];
for(const c of old.clips){const path=`sfx/dungeons2-voices/${c.hero}/${c.action}.ogg`;assert.equal(await hash('public/'+path),c.sha256);clips.push({path,sha256:c.sha256,text:c.text});}
for(const c of added)assert.equal(await hash('public/'+c.path),c.sha256);
assert.match(await fs.readFile('scripts/dungeons-chronicles/generate-voices.py','utf8'),/no_ref=True/);
const report={auditedDate:'2026-10-25',referenceGeneratorSha256:await hash('scripts/dungeons2/generate-voices.py'),originalModel:old.model,originalRevision:old.revision,establishedClips:clips,excludedNoReferenceClips:added.map(c=>({path:c.path,sha256:c.sha256,text:c.text}))};
const file='docs/dungeons/dungeons2-voice-audit.json',text=JSON.stringify(report,null,2)+'\n';
if(process.argv.includes('--write'))await fs.writeFile(file,text);else assert.equal(await fs.readFile(file,'utf8'),text);
console.log('PASS: 270 established Dungeons 2 recordings and 189 excluded no-reference recordings match delivered SHA-256.');
