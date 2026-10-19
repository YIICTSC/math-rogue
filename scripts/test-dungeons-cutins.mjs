import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const modules=await build({stdin:{contents:`export {abilityCutin} from './src/components/school-dungeon/student/cutins';export {STUDENT_ABILITIES,abilityDescription} from './src/components/school-dungeon/student/abilities';export {ABYSS_HEROES} from './src/components/school-dungeon/dungeons2/roster';export {AbilityDetails} from './src/components/school-dungeon/student/AbilityDetails';`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'esm',packages:'external',loader:{'.css':'empty'},define:{'import.meta.env':'{"BASE_URL":"/"}'}});
// Keep external React imports resolvable from the repository.
const {writeFile,unlink,mkdir}=await import('node:fs/promises'),file='tmp/test-cutins-compiled.mjs';await mkdir('tmp',{recursive:true});await writeFile(file,modules.outputFiles[0].text);
try{
 const {abilityCutin,STUDENT_ABILITIES,ABYSS_HEROES,abilityDescription,AbilityDetails}=await import(pathToFileURL(process.cwd()+'/'+file));
 const {default:React}=await import('react'),{renderToStaticMarkup}=await import('react-dom/server');
 const manifest=JSON.parse(await readFile('assets-source/dungeons-cutins/manifest.json','utf8'));
 const expected=[...Object.entries(STUDENT_ABILITIES).map(([hero,a])=>({hero,slot:0,a})),...ABYSS_HEROES.flatMap(h=>h.skills.map((a,slot)=>({hero:h.id,slot,a})))];
 assert.equal(expected.length,62);assert.equal(manifest.count,106);assert.equal(manifest.cutins.length,106);
 assert.equal(new Set(manifest.cutins.map(e=>e.sha256)).size,106,'Every skill has unique art');
 for(const {hero,slot,a}of expected){const cutin=abilityCutin(hero,a.en),entry=manifest.cutins.find(e=>e.hero===hero&&e.slot===slot&&e.form==='normal');assert.ok(entry);assert.equal(entry.ability,a.en);assert.equal(cutin.slot,slot);assert.ok(cutin.url.includes(entry.file));const bytes=await readFile('public/'+entry.file);assert.equal(bytes.length,entry.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256);assert.ok(entry.width<=512&&entry.height<=1024);}
 for(const entry of manifest.cutins){const cutin=abilityCutin(entry.hero,entry.ability,entry.form==='transformed'),bytes=await readFile('public/'+entry.file);assert.ok(cutin.url.includes(entry.file));assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256);}
 for(const h of ABYSS_HEROES){assert.equal(abilityCutin(h.id,h.card.en).slot,2);for(const form of [false,true])assert.equal(abilityCutin(h.id,h.card.en,form).url,abilityCutin(h.id,h.skills[2].en,form).url);assert.equal(abilityCutin(h.id,'missing'),undefined);}
 assert.equal(abilityCutin('missing','missing'),undefined);
 for(const hero of [...Object.keys(STUDENT_ABILITIES),...ABYSS_HEROES.map(h=>h.id)])for(const en of [false,true]){const text=(ja,english)=>en?english:ja,html=renderToStaticMarkup(React.createElement(AbilityDetails,{heroId:hero,text})),h=ABYSS_HEROES.find(h=>h.id===hero),skills=h?[...h.skills,h.card]:[STUDENT_ABILITIES[hero]];assert.equal((html.match(/data-ability-name=/g)||[]).length,skills.length);for(const a of skills){assert.ok(html.includes(en?a.en:a.name));for(const part of abilityDescription(a,en).split(' / '))assert.ok(html.includes(part),hero+': '+part);}}
 console.log('PASS: 106 unique skill/form-specific packaged cut-ins and hashes; all 44 heroes share complete bilingual skill effects, cooldowns and cards; signature cut-ins resolve to their own finisher.');
}finally{await unlink(file);}
