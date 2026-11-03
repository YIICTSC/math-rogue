import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createServer} from 'vite';
const server=await createServer({logLevel:'error',optimizeDeps:{noDiscovery:true},server:{middlewareMode:true,watch:null,hmr:false},appType:'custom'});
try{
 const E=await server.ssrLoadModule('/src/mini-games/lantern-war/engine.ts');
 const D=await server.ssrLoadModule('/src/mini-games/lantern-war/deployment.ts');
 const F=await server.ssrLoadModule('/src/mini-games/lantern-war/formationAdvice.ts');
 const V=await server.ssrLoadModule('/src/mini-games/lantern-war/battleEffects.ts');
 const N=await server.ssrLoadModule('/src/mini-games/lantern-war/endless.ts');
 const {HEROES}=await server.ssrLoadModule('/src/mini-games/lantern-war/roster.ts');
 const {TERRAIN_INFO}=await server.ssrLoadModule('/src/mini-games/lantern-war/story.ts');
 const checkSpawns=b=>{for(const q of b.squads){assert(TERRAIN_INFO[b.map[q.y][q.x]].cost<99,q.id+' must be on land');assert([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>b.map[q.y+dy]?.[q.x+dx]&&TERRAIN_INFO[b.map[q.y+dy][q.x+dx]].cost<99),'Must have an exit: '+q.id);}};
 for(let chapter=0;chapter<18;chapter++){const s=E.newCampaign('aster');s.chapter=chapter;E.recruitFor(s,chapter);checkSpawns(E.createBattle(s));}
 const voyage=E.newCampaign('lyra');voyage.chapter=17;voyage.cleared=Array.from({length:18},(_,i)=>i);N.startEndless(voyage,109);
 for(let depth=1;depth<=32;depth++)for(let route=0;route<3;route++){voyage.endless.depth=depth;voyage.endless.route=route;checkSpawns(N.makeEndlessBattle(voyage));}
 const stuck=E.newCampaign('aster');E.beginChapter(stuck);const b=stuck.battle,q=b.squads[0];b.map[q.y][q.x]='w';const original=JSON.stringify(b.map);D.repairDeployments(b);checkSpawns(b);assert.equal(JSON.stringify(b.map),original,'Deployment repair must preserve water and walls');
 q.x=0;q.y=0;b.map[0][0]='.';b.map[0][1]='w';b.map[1][0]='w';D.repairDeployments(b);assert.notEqual(q.x+','+q.y,'0,0','An isolated one-tile island is not a usable deployment');
 E.orderMove(stuck,q.id,q.x+1,q.y);b.paused=false;for(let i=0;i<6;i++)E.tick(stuck);assert.notEqual(q.path.length,1,'Repaired squad can leave its spawn');
 for(const speed of [1,2,4]){const s=E.newCampaign('aster');E.beginChapter(s);s.battle.paused=false;s.battle.marchSpeed=speed;E.advanceMarch(s);assert.equal(s.battle.time,.5*speed);}
 const fast=E.newCampaign('aster');E.beginChapter(fast);fast.battle.marchSpeed=4;fast.battle.paused=false;fast.battle.squads[1].x=fast.battle.squads[0].x+1;fast.battle.squads[1].y=fast.battle.squads[0].y;E.advanceMarch(fast);assert.equal(fast.battle.time,.5);assert(fast.battle.pending,'Fast-forward must stop at first contact');
 const s=E.newCampaign('aster');s.xp.aster=90;E.beginChapter(s);s.phase='battle';const a=s.battle.squads[0],enemy=s.battle.squads[1];
 for(let i=0;i<3;i++){
  s.battle.pending=[a.id,enemy.id];E.startEncounter(s);const e=s.battle.encounter;e.winner='ally';e.final.forEach(f=>{if(f.team==='enemy')f.hp=0;});
  const rewards=E.encounterRewards(s),xp=s.xp.aster;assert.equal(rewards[0].xp,45);assert.equal(s.xp.aster,xp,'Result preview must be pure');
  if(i===0){assert.equal(rewards[0].old,1);assert.equal(rewards[0].next,2);}
  assert(E.finishEncounter(s));assert.equal(s.xp.aster,xp+45);assert.equal(E.finishEncounter(s),false,'No double claiming');assert.equal(s.studyPending===true,i===2,'Study only every third engagement');
 }
 assert.equal(s.encountersSinceStudy,0);s.battle.paused=false;const time=s.battle.time;assert.equal(E.advanceMarch(s),false);assert.equal(s.battle.time,time,'Study blocks fast-forward');
 let saved;globalThis.localStorage={setItem:(key,value)=>{saved=value;},getItem:()=>saved};
 const legacy=E.newCampaign('lyra');E.beginChapter(legacy);legacy.phase='battle';legacy.encountersSinceStudy=2;legacy.battle.marchSpeed=4;const spawn=legacy.battle.squads[0];legacy.battle.map[spawn.y][spawn.x]='w';legacy.checkpoint=E.clone(legacy.battle);assert(E.saveCampaign(legacy));const restored=E.loadCampaign();assert(restored);assert.equal(restored.encountersSinceStudy,2);assert.equal(restored.battle.marchSpeed,4);assert.equal(restored.battle.paused,true);checkSpawns(restored.battle);checkSpawns(restored.checkpoint);delete legacy.encountersSinceStudy;E.saveCampaign(legacy);assert.equal(E.loadCampaign().encountersSinceStudy,0,'Old saves start a fresh three-encounter cycle');delete globalThis.localStorage;
 const camp=E.newCampaign('aster');camp.chapter=17;camp.recruited=HEROES.map(h=>h.id);camp.formations=[{slots:['aster',null,null,null,null,null]},{slots:['lyra',null,null,null,null,null]},{slots:Array(6).fill(null)}];
 const other=JSON.stringify(camp.formations[1]);assert(F.recommendFormation(camp,0));assert.equal(JSON.stringify(camp.formations[1]),other);assert(camp.formations[0].slots.includes('aster'));assert(camp.formations[0].slots.slice(0,3).every(id=>id&&!['bow','magic','staff'].includes(HEROES.find(h=>h.id===id).weapon)));assert(camp.formations[0].slots.slice(3).some(id=>id&&HEROES.find(h=>h.id===id).weapon==='staff'));
 for(const plan of ['assault','sustain']){assert(F.recommendFormation(camp,2,plan));assert.equal(JSON.stringify(camp.formations[1]),other);const ids=camp.formations.flatMap(f=>f.slots.filter(Boolean));assert.equal(ids.length,new Set(ids).size);assert(camp.formations.every(f=>f.slots.filter(Boolean).length<=E.capacity(camp)));}
 const event={actor:'a',target:'b',actorHero:'aster',targetHero:'lyra',damage:0,heal:false,name:'戦意を高める',skill:true,passive:false,crit:false,hp:30};assert.equal(V.eventReaction(event),'buff');assert.equal(V.eventReaction({...event,damage:5}),'hurt');assert.equal(V.eventReaction({...event,damage:-5,heal:true}),'heal');
 for(const [name,weapon,key]of [['攻撃','sword','slash'],['攻撃','bow','projectile'],['ケミカル・フレア','magic','fire'],['ヴァイオレットボルト','magic','lightning'],['ダブルリベリオン','sword','multihit']]){const actorHero=name==='ダブルリベリオン'?'high-school-warrior':'aster';assert.equal(V.battleEffect({...event,actorHero,name,damage:10},weapon),key);assert(fs.existsSync('public/sprites/attack-vfx-'+key+'.webp'));}
 console.log('PASS passable deployment in 18 chapters and 96 voyages; 1/2/4x steps and encounter stop; pure XP preview, claim once, study every third; scoped recommendations; helpful reactions and shared VFX.');
}finally{await server.close();}
