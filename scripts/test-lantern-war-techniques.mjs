import assert from'node:assert/strict';import{build}from'esbuild';
const b=await build({stdin:{contents:"export * from './src/mini-games/lantern-war/techniques';export{HEROES}from'./src/mini-games/lantern-war/roster';export{resolveEncounter,CONDITION_LABELS,TARGET_LABELS}from'./src/mini-games/lantern-war/combat';export{newCampaign,beginChapter}from'./src/mini-games/lantern-war/engine';",resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm'});const A=await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
assert.equal(A.HEROES.length,40);const names=new Set();let checked=0;
for(const h of A.HEROES){const ts=A.PERSONAL_TECHNIQUES[h.id];assert.equal(ts.length,3);assert.deepEqual(ts.map(t=>t.level),[3,6,12]);for(const t of ts){assert(!names.has(t.name));names.add(t.name);
 for(const unlocked of [false,true]){
  const s=A.newCampaign('aster');A.beginChapter(s);s.xp[h.id]=(t.level-1-(unlocked?0:1))*100;s.tactics[h.id]=[{skill:t.id,condition:'always',target:['guard','rally'].includes(t.effect)?'self':'lowest'}];
  const ally=structuredClone(s.battle.squads[0]),enemy=structuredClone(s.battle.squads.find(q=>q.team==='enemy'));
  const actor={...ally.members[0],hero:h.id,weapon:h.weapon,uid:'tested-hero',hp:750,maxHp:1000,atk:24,def:8,speed:10};ally.members=[actor];
  enemy.members=Array.from({length:3},(_,i)=>({...actor,uid:'foe-'+i,hero:'enemy-ignis',name:'Test enemy',team:'enemy',weapon:'magic',hp:1000,maxHp:1000,slot:i,speed:30,atk:1}));
  const before=JSON.stringify({s,ally,enemy}),e=A.resolveEncounter(s,ally,enemy);assert.equal(JSON.stringify({s,ally,enemy}),before,'Forecast must be pure');assert.deepEqual(A.resolveEncounter(s,ally,enemy),e);
  assert.equal(e.events.some(ev=>ev.actor===actor.uid&&ev.name===t.name),unlocked,h.id+' '+t.name+' level gate');
  for(const f of e.final){assert(f.ap>=0&&f.pp>=0&&f.hp>=0&&f.hp<=f.maxHp);assert.equal(f.atk,f.uid===actor.uid?24:1,'Encounter attack modifiers must not persist');assert.equal(f.def,8);}
  if(unlocked&&t.effect==='flurry')assert(e.events.filter(ev=>ev.name===t.name&&ev.actor===actor.uid&&!ev.heal).length>=2);
  checked++;
 }
 }
 for(let lv=1;lv<=20;lv++)for(const preset of ['balanced','attack','support','control','finish']){const rs=A.tacticPreset(h,lv,preset);assert(rs.length<=A.tacticCapacity(lv));for(const r of rs)assert(A.skillLevel(h.id,r.skill)<=lv);}
}
assert.equal(names.size,120);assert.equal(Object.keys(A.CONDITION_LABELS).length,16);assert.equal(Object.keys(A.TARGET_LABELS).length,12);assert.equal(A.tacticCapacity(1),3);assert.equal(A.tacticCapacity(16),8);
console.log('PASS 40 hero kits, 120 unique arts, '+checked+' locked/unlocked deterministic encounters, AP/PP/HP, temporary stats and every preset at levels 1–20.');
