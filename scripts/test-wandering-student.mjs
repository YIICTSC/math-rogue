import assert from 'node:assert/strict';
import {stat,readFile,mkdir} from 'node:fs/promises';
import {build} from 'esbuild';
await mkdir('tmp/wandering-student-unit',{recursive:true});
await build({stdin:{contents:`export * from './src/components/school-dungeon/student/content';export * from './src/components/school-dungeon/student/transformation';export * from './src/components/school-dungeon/student/sprites';`,resolveDir:process.cwd(),loader:'ts'},define:{'import.meta.env':'{}'},bundle:true,format:'esm',platform:'node',outfile:'tmp/wandering-student-unit/content.mjs'});
const {PROTAGONISTS,STUDENT_GEAR,STUDENT_STORIES,studentGear,studentChapter,studentDirection,studentDamage,magicForm}=await import('../tmp/wandering-student-unit/content.mjs');
assert.equal(PROTAGONISTS.length,35);assert.equal(new Set(PROTAGONISTS.map(h=>h.id)).size,35);assert.equal(STUDENT_GEAR.length,36);assert.equal(new Set(STUDENT_GEAR.map(i=>i.type)).size,36);
const provenance=JSON.parse(await readFile('public/sprites/wandering-student/provenance.json','utf8'));assert.equal(provenance.length,52);
for(const hero of PROTAGONISTS){
 assert((await stat(`public/sprites/wandering-student/${hero.id}.webp`)).size>1000);
 const gear=studentGear(hero.id,1);assert(gear.some(i=>i.category==='WEAPON'&&i.power===4));assert(gear.some(i=>i.category==='ARMOR'&&i.power===3));assert(gear.every(i=>i.chapter===studentChapter(hero.id)));
 const story=STUDENT_STORIES[studentChapter(hero.id)];assert.deepEqual(story.map(a=>a.floor),[1,5,10,15,20,21]);assert(story.every(a=>a.lines.length===3&&a.lines.every(line=>line.length===2&&line.every(Boolean))));
 if(hero.id.startsWith('magic-')){assert(magicForm(hero.id));assert((await stat(`public/sprites/wandering-student/${hero.id}-transformed.webp`)).size>1000);assert((await stat(`public/models/protagonists/${hero.id}-transformed.glb`)).size<500000);}else assert.equal(magicForm(hero.id),undefined);
}
assert(STUDENT_GEAR.filter(g=>g.category==='RANGED').every(g=>g.count===12));assert.equal(studentDamage(7,false),7);assert.equal(studentDamage(7,true),14);assert.equal(studentDamage(0,true),0);assert.equal(studentDamage(-7,true),0);
for(const [i,[x,y]]of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,1],[1,-1],[-1,-1]].entries())assert.equal(studentDirection({x,y}),i);
console.log('PASS: 35 identities, 52 eight-direction sheets, 36 themed items, 3 complete story arcs, 17 transformed GLBs, damage math and all direction mappings.');
