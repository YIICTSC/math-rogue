import assert from 'node:assert/strict';
import {build} from 'esbuild';
const {outputFiles}=await build({entryPoints:['src/components/school-dungeon/dungeons1/mastery.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const M=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
assert.equal(M.WEAPON_KINDS.length,11);assert.equal(M.TECHNIQUES.length,48);assert.equal(Object.keys(M.TRAINING_WEAPONS).length,10);
assert.equal(new Set(M.TECHNIQUES.map(t=>t.ja)).size,48);
assert.equal(M.equippedWeaponKind(null),'fist');assert.equal(M.equippedWeaponKind({type:'STUDENT_H_RAPIER'}),'rapier');assert.equal(M.equippedWeaponKind({type:'STUDENT_M_WAND'}),'staff');
for(const item of Object.values(M.TRAINING_WEAPONS)){assert.equal(M.equippedWeaponKind(item),item.weaponKind);assert.equal(M.equippedWeaponKind({type:item.type}),item.weaponKind,'training weapon IDs retain their classification even when optional save metadata is absent');}
assert.deepEqual(M.normalizeMartialProgress({weaponXp:{sword:NaN,axe:Infinity,fist:-12},learned:['bad'],selected:{fist:'bad'}}),M.normalizeMartialProgress());
for(const kind of M.WEAPON_KINDS){
 let p=M.newMartialProgress();
 for(let i=0;i<5;i++){const r=M.practiceAttack(p,kind,()=>0);assert.equal(r.sparked,undefined);p=r.progress;}
 let r=M.practiceAttack(p,kind,()=>0);assert.equal(r.sparked.id,`${kind}-1`);p=r.progress;
 assert.equal(M.weaponLevel(p,kind),1);assert.equal(p.techniqueUses[`${kind}-1`]||0,0,'new technique starts at zero uses');
 const input=JSON.stringify(p);r=M.practiceAttack(p,kind,()=>.99);assert.equal(JSON.stringify(p),input,'rules do not mutate input');assert(!r.sparked);
 const learned=[];
 for(let i=0;i<330;i++){r=M.practiceAttack(p,kind,()=>0);p=r.progress;if(r.sparked)learned.push(r.sparked.id);}
 assert.deepEqual(learned,[`${kind}-2`,`${kind}-3`,`${kind}-4`]);assert.equal(M.weaponLevel(p,kind),10);
 for(const k of M.WEAPON_KINDS.filter(k=>k!==kind))assert.equal(p.weaponXp[k],0,'unrelated weapon is not trained');
 assert.deepEqual(M.normalizeMartialProgress(JSON.parse(JSON.stringify(p))),p,'progress round trips through save JSON');
 p.selected[kind]='not-learned';assert.equal(M.selectedTechnique(p,kind),undefined);assert.equal(M.normalizeMartialProgress(p).selected[kind],undefined);
}
for(const ultimate of M.TECHNIQUES.filter(t=>t.requires)){
 const p=M.normalizeMartialProgress();for(const k of ultimate.requires){p.weaponXp[k]=M.weaponThreshold(8);p.learned.push(`${k}-4`);p.techniqueUses[`${k}-4`]=15;}
 assert(M.canSpark(p,ultimate));const missing=structuredClone(p);missing.techniqueUses[`${ultimate.requires[1]}-4`]=14;assert(!M.canSpark(missing,ultimate));
 const result=M.practiceAttack(p,ultimate.kind,()=>0);
 // Lower eligible techniques are deliberately discovered before an ultimate.
 assert(result.sparked.tier<5);p.learned.push(...M.TECHNIQUES.filter(t=>t.kind===ultimate.kind&&t.tier<5).map(t=>t.id));
 assert.equal(M.practiceAttack(p,ultimate.kind,()=>0).sparked.id,ultimate.id);
}
const locked=M.newMartialProgress();locked.weaponXp.sword=330;assert(!M.canSpark(locked,M.TECHNIQUES.find(t=>t.id==='sword-4')),'weapon mastery alone cannot skip technique prerequisites');
const low=M.newMartialProgress();low.weaponXp.sword=6;assert(!M.practiceAttack(low,'sword',()=>.99).sparked,'a chance is not a guaranteed spark');
console.log('PASS: all 11 weapon chains, 48 unique techniques, ordered random discovery, mastery caps, technique prerequisites, 4 cross-weapon ultimates, legacy saves and immutable progression.');
