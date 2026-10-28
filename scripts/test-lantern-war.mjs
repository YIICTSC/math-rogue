import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createServer} from 'vite';
const server=await createServer({logLevel:'error',optimizeDeps:{noDiscovery:true},server:{middlewareMode:true},appType:'custom'});
try{
 const E=await server.ssrLoadModule('/src/mini-games/lantern-war/engine.ts'),C=await server.ssrLoadModule('/src/mini-games/lantern-war/combat.ts'),{CHAPTERS,SUPPORTS,supportLines}=await server.ssrLoadModule('/src/mini-games/lantern-war/story.ts'),{HEROES}=await server.ssrLoadModule('/src/mini-games/lantern-war/roster.ts');
 const W=await server.ssrLoadModule('/src/mini-games/lantern-war/world.ts');assert.equal(W.FIELD_QUESTS.length,18);const expedition=E.newCampaign('aster');assert.equal(W.canVisit(expedition,'main-1'),false);assert(W.canVisit(expedition,'side-0'));for(const q of W.FIELD_QUESTS){assert(HEROES.some(h=>h.id===q.hero));assert.equal(W.fieldLines(q.id).length,6);}expedition.fieldQuest='side-0';expedition.phase='story';W.finishFieldQuest(expedition,0);assert(expedition.recruited.includes('high-school-caretaker'));assert.equal(expedition.phase,'field');const earned=expedition.gold;expedition.fieldQuest='side-0';W.finishFieldQuest(expedition,1);assert.equal(expedition.gold,earned);assert.equal(W.travelPath(expedition,'main-0','side-0').at(-1),'side-0');assert.equal(CHAPTERS.length,18);assert.equal(new Set(CHAPTERS.map(c=>c.map.join(''))).size,18);assert.equal(SUPPORTS.length*3,36);
 for(const [i,c]of CHAPTERS.entries()){assert.equal(c.map.length,10);assert(c.map.every(row=>row.length===12));const s=E.newCampaign('aster');s.chapter=i;E.recruitFor(s,i);const b=E.createBattle(s);assert(E.pathTo(b,{x:2,y:8},{x:9,y:0}).length>0,'Reachable chapter '+i);assert(c.intro.length>=6&&c.outro.length>=4);}
 for(let i=0;i<SUPPORTS.length;i++)for(let rank=0;rank<3;rank++)assert.equal(supportLines(i,rank).length,3);
 let s=E.newCampaign('lyra');for(let i=1;i<18;i++){s.chapter=i;E.recruitFor(s,i);}assert.equal(s.recruited.length,HEROES.length-1);
 const formed=s.formations.flatMap(f=>f.slots.filter(Boolean));assert.equal(formed.length,new Set(formed).size);assert(formed.includes('lyra'));assert(s.formations.every(f=>f.slots.filter(Boolean).length<=6));
 assert.equal(E.assign(s,'aster',0,0),false);const existing=s.formations[1].slots.find(Boolean);assert(E.assign(s,existing,0,0));assert(s.formations.flatMap(f=>f.slots).includes('lyra'),'swapped hero retained');
 s=E.newCampaign('aster');E.beginChapter(s);s.phase='battle';const a=s.battle.squads[0],e=s.battle.squads.find(q=>q.team==='enemy');
 const before=JSON.stringify(s),pred=C.resolveEncounter(s,a,e);assert.equal(JSON.stringify(s),before,'Forecast is pure');assert(pred.events.length>0);assert(pred.final.every(f=>f.hp>=0&&f.ap>=0&&f.pp>=0));assert.deepEqual(C.resolveEncounter(s,a,e),pred,'Forecast deterministic');
 const resting=E.clone(a);resting.rest=8;const rest=C.resolveEncounter(s,resting,e);assert(!rest.events.some(ev=>ev.actor.startsWith('ally-')),'Rest disables AP and PP');
 const medic=E.clone(a.members[0]);medic.hero='magic-hiyori';medic.weapon='staff';medic.uid='ally-medic';medic.slot=3;const damaged=E.clone(a.members[0]);damaged.hp=10;damaged.uid='ally-patient';a.members=[damaged,medic];const healing=C.resolveEncounter(s,a,e);assert(healing.events.some(ev=>ev.heal),'Healing tactics trigger');
 s.battle.pending=[a.id,e.id];assert(E.startEncounter(s));assert(E.finishEncounter(s));assert(!s.battle.encounter);
 assert(E.retryBattle(s));s.battle.paused=false;const time=s.battle.time;E.tick(s);assert(s.battle.time>time);s.battle.paused=true;E.tick(s);assert.equal(s.battle.time,time+.5);
 for(const hero of ['aster','lyra']){
  const campaign=E.newCampaign(hero);for(let chapter=0;chapter<18;chapter++){
   campaign.chapter=chapter;E.recruitFor(campaign,chapter);E.beginChapter(campaign);campaign.phase='battle';
   // A deterministic command bot uses the same move, rest, forecast and combat APIs as the UI.
   let steps=0;while(!campaign.battle.result&&steps++<1800){
    const b=campaign.battle;
    if(b.pending){E.startEncounter(campaign);E.finishEncounter(campaign);continue;}
    const foes=b.squads.filter(q=>q.team==='enemy'&&E.living(q)),allies=b.squads.filter(q=>q.team==='ally'&&E.living(q));
    for(const q of allies){
     if(q.members.some(f=>f.hp<f.maxHp*.5)&&b.brave>0)E.braveSkill(campaign,q.id,'heal');
     if(q.stamina<=1&&!q.rest)E.restSquad(campaign,q.id);
     if(!q.path.length&&!q.rest&&!q.wait){const targets=[...foes].sort((x,y)=>E.distance(q,x)-E.distance(q,y));const goal=targets[0]||{x:9,y:0};E.orderMove(campaign,q.id,goal.x,goal.y);}
    }
    b.paused=false;E.tick(campaign,1);
   }
   if(campaign.battle.result!=='win')throw Error(hero+' chapter '+chapter+' failed '+campaign.battle.reason+' step '+steps+' '+JSON.stringify(campaign.battle.squads.map(q=>({id:q.id,hp:q.members.reduce((n,f)=>n+f.hp,0),x:q.x,y:q.y}))));
   E.claimResult(campaign);assert.equal(E.claimResult(campaign),false,'No duplicate rewards');const lines=CHAPTERS[chapter].outro;campaign.storyIndex=lines.length-1;E.advanceStory(campaign,lines.length,chapter%2);
   assert.equal(campaign.cleared.length,chapter+1);
   // Spend earned rewards on the deployed formation; no artificial stats.
   for(const id of campaign.formations.flatMap(f=>f.slots.filter(Boolean)))if(campaign.gold>=150)E.forge(campaign,id);
  }
  assert.equal(campaign.phase,'ending');console.log(hero+': all 18 chapters completed through live simulation.');
 }
 const source=fs.readFileSync('src/mini-games/lantern-war/art.tsx','utf8');
 for(const h of HEROES.filter(h=>h.origin==='高校編'||h.origin==='マジック編')){
  const hs=HEROES.filter(x=>x.origin==='高校編').findIndex(x=>x.id===h.id),key=h.id.slice(6),girls=['akari','shizuku','hiyori','tsubasa','rei','madoka','koharu','mirai','sera'],index=girls.indexOf(key);
  for(const kind of ['idle','attack','skill','hit']){
   const path=hs>=0?'public/sprites/high-school/characters-'+kind+'-sheets/'+hs+'.'+(kind==='idle'&&hs===1?'png':'webp'):index>=0?'public/sprites/magic/characters-'+kind+'-sheets/heroine-'+String(index+1).padStart(2,'0')+'-after.webp':'public/sprites/magic/male-characters-'+kind+'-sheets/'+key+'-after.webp';
   assert(fs.existsSync(path),'Missing authored battle animation '+path);
  }
 }
 for(const id of ['aster','lyra','nagi','mio','sena'])assert(fs.existsSync('public/sprites/lantern-war/'+id+'-map.webp'));
 for(const id of ['aster','lyra'])for(const pose of ['ready','windup','attack','guard','hurt','cast','victory','ultimate'])assert(fs.existsSync('public/sprites/lantern-war/heroes/'+id+'-'+pose+'.webp'));
 for(const theme of ['meadow','woodland','citadel','astral'])assert(fs.existsSync('public/sprites/lantern-war/terrain-'+theme+'.webp'));
 for(const place of ['meadow','forest','bridge','library','harbor','final'])assert(fs.existsSync('public/sprites/lantern-war/battle-bg-'+place+'.webp'));
 const metrics=JSON.parse(fs.readFileSync('src/mini-games/lantern-war/battleMetrics.json','utf8'));assert.equal(Object.keys(metrics).length,46);for(const [id,actions]of Object.entries(metrics))for(const [action,frames]of Object.entries(actions)){assert.equal(frames.length,4);for(const frame of frames){assert(frame.footY>0&&frame.footY<=frame.h,id+' '+action+' foot baseline');assert(frame.footX>=0&&frame.footX<=frame.w);assert(frame.bodyBounds.h>0);assert(frame.contacts.length<=2);}}
 console.log('Lantern War: progression, paths, deterministic prediction, AP/PP, healing, formations, replay guards, assets and 1104 measured battle frames passed.');
}finally{await server.close();}
