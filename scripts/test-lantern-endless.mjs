import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({configFile:false,logLevel:'error',server:{middlewareMode:true,watch:null,hmr:false},optimizeDeps:{noDiscovery:true,entries:[]}});
let stored;globalThis.localStorage={getItem:()=>stored,setItem:(k,v)=>stored=v};
try{
 const E=await server.ssrLoadModule('/src/mini-games/lantern-war/engine.ts');
 const I=await server.ssrLoadModule('/src/mini-games/lantern-war/endless.ts');
 const {ENDLESS_CAST}=await server.ssrLoadModule('/src/mini-games/lantern-war/endlessRoster.ts');
 const s=E.newCampaign('aster');assert.equal(I.startEndless(s,123),false);s.chapter=17;s.cleared=Array.from({length:18},(_,i)=>i);s.xp.aster=1200;s.forge.aster=3;s.gold=5000;
 const before=JSON.stringify(s.formations);assert(I.startEndless(s,123));assert.equal(JSON.stringify(s.formations),before);assert.equal(s.xp.aster,1200);
 s.endless.route=0;const route0=I.makeEndlessBattle(s);s.endless.route=1;assert.notDeepEqual(I.makeEndlessBattle(s).map,route0.map);s.endless.route=0;
 const objectives=new Set(),weathers=new Set(),maps=new Set();
 for(let depth=1;depth<=500;depth++){
 s.endless.depth=depth;s.endless.route=depth%3;const b=I.makeEndlessBattle(s);assert.deepEqual(I.makeEndlessBattle(s),b);objectives.add(b.endless.objective);weathers.add(b.endless.weather);maps.add(JSON.stringify(b.map));
 assert.equal(b.map.length,10);assert(b.map.every(r=>r.length===12));assert.equal(b.map[4].filter(t=>t==='#').length,b.endless.site.kind==='fortress'?12:0);assert(b.squads.every(q=>!['w','#','m'].includes(b.map[q.y][q.x])));
 const q=b.squads.find(q=>q.team==='ally');if(b.endless.site.kind==='fortress')assert.equal(E.pathTo(b,q,{x:9,y:0}).length,0);
 for(const o of b.endless.installations.filter(o=>o.kind==='wall'))b.map[o.y][o.x]='.';
 assert(E.pathTo(b,q,{x:9,y:0}).length>0,'every generated gate must open a viable route');
 assert(b.squads.filter(q=>q.team==='enemy').every(q=>q.members.every(f=>Number.isFinite(f.atk)&&f.hp>0)));
 }
 assert.equal(objectives.size,8);assert.equal(weathers.size,5);assert(maps.size>280);
 // A rain delay must exceed the 1.5s movement cadence, otherwise it has no effect.
 s.endless.depth=1;
 const travel=weather=>{const c=E.clone(s);c.battle=I.makeEndlessBattle(c);c.phase='battle';const b=c.battle;b.endless.objective='seize';b.endless.weather=weather;b.paused=false;const q=b.squads.find(q=>q.team==='ally');q.x=2;q.y=8;q.path=[{x:3,y:8},{x:4,y:8}];for(let i=0;i<6;i++)E.tick(c,.5);return q.x;};
 assert.equal(travel('clear'),4);assert.equal(travel('rain'),3,'rain skips the next movement beat');
 s.endless.depth=2;s.endless.route=2;assert(I.beginEndless(s));const original=E.clone(s.battle);E.saveCampaign(s);const loaded=E.loadCampaign();assert(loaded);assert.deepEqual(loaded.battle.map,original.map,'loading must not auto-open siege walls');assert(loaded.battle.paused);
 s.phase='battle';const wall=s.battle.endless.installations.find(o=>o.kind==='wall'),q=s.battle.squads.find(q=>q.team==='ally');q.x=wall.x;q.y=5;s.supplies=2;assert(I.interactEndless(s,q.id,wall.id,true));assert.equal(wall.hp,0);assert.equal(s.supplies,0);assert.equal(s.battle.map[4][wall.x],'.');assert.equal(I.interactEndless(s,q.id,wall.id,true),false);
 s.battle.result='lose';s.phase='result';assert(E.retryBattle(s));assert.deepEqual(s.battle.map,original.map);
 // Actual ranged fire and ownership switch, not just labels on a map.
 const cannon=s.battle.endless.installations.find(o=>o.kind==='cannon');const ally=s.battle.squads.find(q=>q.team==='ally');ally.x=cannon.x;ally.y=cannon.y+1;s.battle.map[ally.y][ally.x]='.';let hp=ally.members[0].hp;s.battle.time=7.5;I.tickEndless(s,.5);assert(ally.members[0].hp<hp);assert(I.interactEndless(s,ally.id,cannon.id));assert.equal(cannon.team,'ally');
 for(const objective of objectives){const c=E.clone(s);c.battle.endless.objective=objective;c.battle.result=undefined;c.phase='battle';for(const q of c.battle.squads)if(q.team==='enemy')for(const f of q.members)f.hp=0;
 if(objective==='escort')c.battle.squads.push({...E.clone(c.battle.squads[0]),id:'civil-test',team:'civil',x:9,y:0});
 for(const q of c.battle.squads.filter(q=>q.team==='ally')){q.x=objective==='relic'?2:9;q.y=objective==='relic'?8:0;}
 c.battle.time=180;c.battle.treasure=true;for(const o of c.battle.endless.installations)if(o.kind==='beacon')o.team='ally';I.checkEndless(c);assert.equal(c.battle.result,'win',objective);}
 s.endless.depth=1;s.phase='field';for(let i=0;i<4;i++){assert(I.beginEndless(s));s.battle.result='win';s.phase='result';s.resultClaimed=false;const gold=s.gold;assert(E.claimResult(s));assert(s.gold>gold);const after=s.gold;assert.equal(E.claimResult(s),false);assert.equal(s.gold,after);s.storyIndex=1;assert(I.chooseBlessing(s,'attack'));assert.equal(I.chooseBlessing(s,'attack'),false);}
 assert(ENDLESS_CAST.every(h=>s.recruited.includes(h.id)));assert.equal(s.endless.blessings.attack,4);assert.equal(s.endless.depth,5);assert.equal(s.chapter,17);assert.equal(s.cleared.length,18);
 I.beginEndless(s);E.saveCampaign(s);assert(E.loadCampaign());const invalid=JSON.parse(stored);invalid.battle.endless.installations[0].x=99;stored=JSON.stringify(invalid);assert.equal(E.loadCampaign(),null);
 I.leaveEndless(s);assert.equal(s.endless.active,false);assert.equal(s.phase,'field');assert.equal(s.battle,null);
 console.log('PASS: 500 geographically varied deterministic maps, 8 objectives, rain movement delay, siege routes, ranged fire/capture, save/reload, retry, four recruits, blessings, rewards once, campaign isolation and malformed saves.');
}finally{await server.close();}
