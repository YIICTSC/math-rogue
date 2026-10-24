import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {build} from 'esbuild';
const bundle='.chronicle-rules-test.mjs';
try{
 await build({entryPoints:['src/components/school-dungeon/chronicles/story.ts'],bundle:true,format:'esm',platform:'node',outfile:bundle});const m=await import('../'+bundle+'?'+Date.now());
 const roster=await build({entryPoints:['src/components/school-dungeon/student/content.ts'],bundle:true,write:false,format:'esm',platform:'node'}),catalog=await import('data:text/javascript;base64,'+Buffer.from(roster.outputFiles[0].text).toString('base64'));const sequel=await build({entryPoints:['src/components/school-dungeon/dungeons2/roster.ts'],bundle:true,write:false,format:'esm',platform:'node'}),d2=await import('data:text/javascript;base64,'+Buffer.from(sequel.outputFiles[0].text).toString('base64'));assert.deepEqual(m.CHRONICLE_HEROES.map(h=>h.id).sort(),[...catalog.PROTAGONISTS,...d2.ABYSS_HEROES].map(h=>h.id).sort());
 const modesBundle=await build({entryPoints:['src/components/school-dungeon/adventure.ts'],bundle:true,write:false,format:'esm',platform:'node'}),modes=await import('data:text/javascript;base64,'+Buffer.from(modesBundle.outputFiles[0].text).toString('base64'));assert.deepEqual(m.CHRONICLE_ROUTES.map(r=>r.id).sort(),modes.MODES.map(r=>r.id).sort());
 assert.deepEqual(m.CHRONICLE_ROUTES,JSON.parse(await fs.readFile('assets-source/dungeons-chronicles/routes.json','utf8')));assert.equal(m.CHRONICLE_ROUTES.length,22);assert.equal(m.CHRONICLE_HEROES.length,44);assert.equal(new Set(m.CHRONICLE_HEROES.map(h=>h.id)).size,44);
 const allEndings=new Set(),allHeroOpen=new Set(),conversations=new Set();let combinations=0;
 for(const h of m.CHRONICLE_HEROES){assert(!allHeroOpen.has(h.open[0]),'shared opening '+h.id);allHeroOpen.add(h.open[0]);for(const r of m.CHRONICLE_ROUTES){if(r.series===2&&!h.id.startsWith('dungeons2-'))continue;combinations++;const run=m.newChronicle(r.id,h.id);assert.equal(m.chronicleStage(1,30,run),0);
  for(let stage=0;stage<3;stage++){const scene=m.chronicleScene(run,h.en,h.id.startsWith('dungeons2-')?2:1,stage);assert.equal(scene.lines.length,6);assert(scene.lines.every(l=>l.text.length===2&&l.text.every(Boolean)));conversations.add(scene.lines.map(l=>l.text[0]).join('\n'));run.pending={stage,line:5};assert(m.chooseChronicle(run,stage,'accord'));assert(!m.chooseChronicle(run,stage,'defy'),'repeated choice must fail');}
  assert.equal(m.chronicleEnding(run),'accord');for(const branch of ['release','accord','defy']){const replay=m.newChronicle(r.id,h.id);replay.choices={0:branch,1:branch,2:branch};assert.equal(m.chronicleEnding(replay),branch);replay.ending=branch;replay.pending={stage:3,line:2};const restored=JSON.parse(JSON.stringify(replay));assert.equal(restored.pending.line,2);assert.deepEqual(m.chronicleScene(restored,h.en,1,3),m.chronicleScene(replay,h.en,1,3));}
 }}
 for(const r of m.CHRONICLE_ROUTES){assert.equal(r.endings.length,3);for(const e of r.endings){assert(!allEndings.has(e.consequence[0]),'reused ending');allEndings.add(e.consequence[0]);}}
 assert.equal(combinations,758);assert.equal(conversations.size,combinations*3);assert.equal(allEndings.size,66);
 const tie=m.newChronicle('STORY','elementary-warrior');tie.choices={0:'release',1:'accord',2:'defy'};assert.equal(m.chronicleEnding(tie),'defy');assert.equal(m.chronicleEnding(m.newChronicle('STORY','elementary-warrior')),'accord');
 console.log(`PASS: 22 original routes, 66 unique endings, 44 individual protagonist personalities, ${combinations} protagonist/route pairs, ${conversations.size} contextual conversations, three-choice routing, repeat protection and serialized dialogue restoration.`);
}finally{await fs.rm(bundle,{force:true});}
