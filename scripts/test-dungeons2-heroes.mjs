import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {access} from 'node:fs/promises';
const read=async p=>{const r=await build({entryPoints:[p],bundle:true,write:false,platform:'node',format:'esm'});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));};
const {ABYSS_HEROES,unlockedAbyssHeroes,abyssSelection,signatureId,signatureHero}=await read('src/components/school-dungeon/dungeons2/roster.ts');
const {studentAbility,resolveStudentAbility}=await read('src/components/school-dungeon/student/abilities.ts');
const {magicForm,studentDamage}=await read('src/components/school-dungeon/student/transformation.ts');
assert.equal(ABYSS_HEROES.length,9);assert.equal(ABYSS_HEROES.filter(h=>h.gender==='female').length,5);assert.equal(ABYSS_HEROES.filter(h=>h.gender==='male').length,4);
for(let n=0;n<12;n++){assert.equal(unlockedAbyssHeroes(n).length,Math.min(9,n+1));assert.equal(abyssSelection('magic-akari',n).id,ABYSS_HEROES[0].id);assert.equal(abyssSelection(ABYSS_HEROES[8].id,n).id,n<8?ABYSS_HEROES[0].id:ABYSS_HEROES[8].id);}
assert.equal(unlockedAbyssHeroes(NaN).length,1);assert.equal(unlockedAbyssHeroes(-1).length,1);
assert.equal(new Set(ABYSS_HEROES.flatMap(h=>h.skills.map(s=>s.name))).size,27);assert.equal(new Set(ABYSS_HEROES.map(h=>h.card.name)).size,9);
const map=Array.from({length:20},()=>Array(20).fill('FLOOR')),player={x:5,y:5,attack:20,hp:15,maxHp:100,dir:{x:1,y:0}},enemies=[{id:1,x:6,y:5,hp:500,defense:1,status:{}},{id:2,x:7,y:5,hp:500,enemyType:'SHOPKEEPER'}];
for(const hero of ABYSS_HEROES){assert.equal(signatureHero(signatureId(hero.id)).id,hero.id);assert.equal(magicForm(hero.id).portrait,hero.afterPortrait);assert.equal(studentDamage(9,true),18);assert.equal(hero.skills.length,3);for(const [i,a]of [...hero.skills,hero.card].entries()){if(i<3)assert.deepEqual(studentAbility(hero.id,i),a);const result=resolveStudentAbility(a,player,enemies,map,{}),transformed=resolveStudentAbility(a,player,enemies,map,{},2);assert.equal(result.enemies.find(e=>e.id===2).hp,500);assert.equal(enemies[0].hp,500);assert.ok(result.hp<=100);if(a.power)assert.equal(transformed.hits[0].damage,result.hits[0].damage*2);if(a.heal)assert.equal(result.hp,Math.min(100,15+a.heal));if(a.status)assert.ok(result.enemies[0].status[a.status]>0);}
 for(const p of [hero.portrait,hero.afterPortrait,`sprites/dungeons2/${hero.id.slice(10)}-directions.webp`,`sprites/dungeons2/${hero.id.slice(10)}-transformed-directions.webp`])await access('public/'+p);
}
assert.equal(signatureHero('THRUST'),undefined);console.log('PASS: nine original heroes (5F/4M), sequential 1–9 unlocks and legacy selection migration, all 27 skills and 9 signature cards, doubled transformation damage, shop protection, healing/status, and 36 production art assets.');
