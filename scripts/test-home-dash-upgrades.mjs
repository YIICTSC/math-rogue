import assert from 'node:assert/strict';
import {build} from 'esbuild';
const compiled=await build({stdin:{contents:"export * from './src/mini-games/go-home-dash/upgrades';export * from './src/mini-games/go-home-dash/airCombat';export * from './src/mini-games/go-home-dash/arcade';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const E=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
assert.equal(E.DASH_UPGRADES.length,48);assert.equal(new Set(E.DASH_UPGRADES.map(u=>u.id)).size,48);
let levels={};const all=Object.fromEntries(E.DASH_UPGRADES.map(u=>[u.id,u.maxLevel]));
for(let run=0;run<100;run++){
 const offers=E.rollUpgrades(levels,E.seededRandom(run));
 assert.deepEqual(offers,E.rollUpgrades(levels,E.seededRandom(run)),'Daily seed preserves choices');
 assert.equal(new Set(offers.map(u=>u.id)).size,offers.length);
 for(const u of offers){assert(E.upgradeLevel(levels,u.id)<u.maxLevel);if(u.requiresWeapon)assert(levels.STRIKE_1>0);}
 levels=E.gainUpgrade(levels,offers[run%offers.length]);
}
assert.deepEqual(E.rollUpgrades(all).map(u=>u.id),['REFILL']);
for(const u of E.DASH_UPGRADES){assert.equal(E.gainUpgrade(all,u)[u.id],u.maxLevel);for(let lv=1;lv<=u.maxLevel;lv++)for(const lang of ['JAPANESE','ENGLISH','HIRAGANA'])assert(E.upgradeDescription(u,lv,lang).length>3);}
assert(E.upgradeStats({MOVE_3:3,MOVE_2:1}).maxJumps>=E.upgradeStats({MOVE_3:3}).maxJumps,'Adding double jump cannot downgrade triple jump');
assert.equal(E.upgradeHealth('DEF_7',2,1,3).maxHp,5);
function moveShots(world,shots,obstacles){for(const p of shots){if(p.isHoming){const t=E.nearestAirTarget(world,obstacles,p.x,p.y);if(t){const dx=t.x-p.x,dy=t.y-p.y,l=Math.hypot(dx,dy)||1;p.vx+=dx/l*.85;p.vy+=dy/l*.85;const speed=Math.hypot(p.vx,p.vy);if(speed>18){p.vx*=18/speed;p.vy*=18/speed;}}}p.previousX=p.x;p.previousY=p.y;p.x+=p.vx;p.y+=p.vy;if(p.life!==undefined)p.life--;}return shots.filter(p=>p.life>=0&&p.x>-100&&p.x<920&&p.y>-70&&p.y<470);}
// Each independent weapon must actually kill every boss before the encounter expires.
for(let weapon=1;weapon<=8;weapon++)for(let variant=0;variant<4;variant++){
 const world=E.createArcade(42);world.combatWidth=800;E.spawnAirBoss(world,variant);const stats=E.upgradeStats({['AIR_'+weapon]:weapon===1?1:5});let shots=[];
 for(let f=1;f<=1200&&world.boss;f++){world.frame=f;shots.push(...E.emitAirWeapons(world,{x:120,y:340},stats,[]));shots=moveShots(world,shots,[]);shots=E.resolveAirHits(world,[],shots,stats).projectiles;E.advanceCombatFx(world);}
 assert.equal(world.boss,null,`AIR_${weapon} must down boss ${variant}`);assert.equal(world.stats.bosses,1);assert(world.combatFx.some(f=>f.boss));const score=world.score;assert.equal(E.damageAirBoss(world,999),false);assert.equal(world.score,score,'A falling corpse cannot be scored again');
 const corpse=world.combatFx.find(f=>f.boss),y=corpse.y;for(let i=0;i<20;i++)E.advanceCombatFx(world);assert(corpse.y>y+20,'Destroyed bosses visibly fall');for(let i=0;i<130;i++)E.advanceCombatFx(world);assert.equal(world.combatFx.length,0);
}
const world=E.createArcade(1),stats=E.upgradeStats({AIR_1:1});
for(const def of E.AIR_ENEMIES.slice(0,12)){const obs={...def,id:def.id,type:'BIRD',airKind:def.id,x:300,y:150,hp:def.hp,maxHp:def.hp};const pr={id:'sweep',x:500,y:150,previousX:0,previousY:150,vx:500,vy:0,isPierce:true,damage:100};assert(E.airShotHits(pr,obs),'Swept fast projectiles cannot tunnel');assert.equal(E.airShotHits({...pr,y:390,previousY:390},obs),false);const r=E.resolveAirHits(world,[obs],[pr],stats);assert.equal(r.downs,1);assert.equal(obs.hp,0);assert.equal(E.downAirEnemy(world,obs),false);assert.equal(E.resolveAirHits(world,[obs],[pr],stats).downs,0);}
assert.equal(world.stats.breaks,12);
const tank={id:'tank',type:'BIRD',airKind:'beetle',x:300,y:150,width:80,height:60,hp:50};const laser={id:'laser',x:300,y:150,vx:0,vy:0,isPierce:true,damage:3};E.resolveAirHits(world,[tank],[laser],stats);const hp=tank.hp;E.resolveAirHits(world,[tank],[laser],stats);assert.equal(tank.hp,hp,'A piercing laser hits a target once');
E.spawnAirBoss(world,0);E.damageAirBoss(world,999);
for(let i=0;i<50;i++)E.queueCombatFx(world,'impact',300,150);assert(world.combatFx.length<=18,'Effects remain bounded');assert(world.combatFx.some(f=>f.boss),'Impact bursts cannot evict a falling boss');
console.log('PASS 48 levelled upgrades, deterministic capped choices, jump compatibility, 32 weapon/boss battles, 12 enemy hitboxes, swept shots, one-time rewards, falling explosions and bounded effects.');
