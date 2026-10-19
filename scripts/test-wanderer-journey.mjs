import assert from 'node:assert/strict';
import {build} from 'esbuild';
const result=await build({entryPoints:['src/components/school-dungeon/journey.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const journey=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const catalog=await build({entryPoints:['src/three/protagonistCatalog.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {PROTAGONISTS}=await import('data:text/javascript;base64,'+Buffer.from(catalog.outputFiles[0].text).toString('base64'));
const base={clears:{},warehouse:[],bank:0,rescue:null};
for(let stage=0;stage<journey.ROUTE_ORDER.length;stage++){
 for(let index=0;index<journey.ROUTE_ORDER.length;index++)assert.equal(journey.routeOpen(base,journey.ROUTE_ORDER[index]),index<=stage,'Routes must open one at a time after a clear');
 base.clears[journey.ROUTE_ORDER[stage]]=1;
}
assert.equal(journey.routeOpen(base,'RESCUE'),false);base.rescue={attempts:0};assert.equal(journey.routeOpen(base,'RESCUE'),true);base.rescue.attempts=3;assert.equal(journey.routeOpen(base,'RESCUE'),false);
for(const hero of PROTAGONISTS){const friend=journey.classmateFor(hero.id);assert.notEqual(friend.id,hero.id);const chapter=id=>id.startsWith('magic-')?'magic':id.startsWith('high-school-')?'high-school':'elementary';assert.equal(chapter(friend.id),chapter(hero.id));const stories=journey.personalStories(hero.id);assert.equal(stories.length,6);assert.equal(stories[0].floor,1);assert.equal(stories.at(-1).floor,21);assert.ok(stories.every(act=>act.lines[0][0].includes(hero.name)));}
assert.equal(journey.TOWN_BUILDINGS.at(-1).kind,'GATE');assert.ok(journey.TOWN_BUILDINGS.some(b=>b.kind==='DOJO'));assert.equal(new Set(journey.TOWN_BUILDINGS.map(b=>b.x)).size,journey.TOWN_BUILDINGS.length);
console.log('PASS: sequential routes, rescue limits, 35 matching-chapter companions, 210 personalized story stages, and town entrances.');
const artBundle=await build({entryPoints:['src/components/school-dungeon/itemArt.tsx'],bundle:true,write:false,format:'esm',platform:'node',define:{'import.meta.env':'{}'}});
const {COMMON_ITEM_ART,itemArtSpec}=await import('data:text/javascript;base64,'+Buffer.from(artBundle.outputFiles[0].text).toString('base64'));
const contentBundle=await build({entryPoints:['src/components/school-dungeon/student/content.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {STUDENT_GEAR}=await import('data:text/javascript;base64,'+Buffer.from(contentBundle.outputFiles[0].text).toString('base64'));
const {existsSync}=await import('node:fs');
const cells=new Set();for(const type of [...COMMON_ITEM_ART,...STUDENT_GEAR.map(i=>i.type)]){const spec=itemArtSpec(type);assert.ok(spec,type);assert.ok(spec.index<spec.columns*spec.rows,type);assert.ok(existsSync('public/'+spec.path),spec.path);cells.add(spec.path+':'+spec.index);}assert.equal(cells.size,161);console.log('PASS: 161 distinct generated item illustrations are assigned and available.');

for(const hero of PROTAGONISTS){assert.ok(existsSync('public/sprites/wandering-student/'+hero.id+'.webp'),hero.id);assert.ok(existsSync('public/models/protagonists/'+hero.id+'.glb'),hero.id);}console.log('PASS: all 35 travelers have their 2D sheet and 3D model.');

assert.deepEqual(journey.townBuildings(true).filter(b=>!b.npc).map(b=>b.kind).sort(),['DOJO','GATE','WAREHOUSE']);assert.ok(journey.townBuildings(false).some(b=>b.kind==='SHOP'));console.log('PASS: home has only warehouse/dojo facilities and its gate; relay shops remain available.');
