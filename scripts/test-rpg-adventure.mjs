import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createServer } from 'vite';
const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true},appType:'custom',logLevel:'error'});
try {
 const {getEnemyHeroes,enemyHeroDeck,applyEnemyHeroRelics}=await server.ssrLoadModule('/src/rpg/enemyHeroes.ts');
 const {getAllEnemyNamesByTheme}=await server.ssrLoadModule('/src/data/enemyCatalogs.ts');
 const {getThemedCharacterSpritePath,getThemedCharacterIdleSpriteSheetPath,getThemedCharacterAnimationSheetPath}=await server.ssrLoadModule('/src/data/visualThemes.ts');
 for(const theme of ['elementary','high-school','magic']) {
  const heroes=getEnemyHeroes(theme);
  assert(getAllEnemyNamesByTheme(theme).every(n=>heroes.some(h=>h.name===n)));
  assert.equal(new Set(heroes.map(h=>h.relic.id)).size,heroes.length);
  assert.equal(new Set(heroes.map(h=>JSON.stringify(h.relic.rpgInnate))).size,heroes.length,`${theme} needs a mechanically unique starter relic for every hero`);
  assert.equal(new Set(heroes.map(h=>enemyHeroDeck(h).map(c=>c.name).join('|'))).size,heroes.length);
  const missing=[];
  for(const h of heroes){
   const deck=enemyHeroDeck(h);assert.equal(deck.length,10);assert.equal(new Set(deck.map(c=>c.id)).size,10);assert(deck.every(c=>c.name&&c.description&&Number.isFinite(c.cost)));
   const p={relics:[h.relic],strength:0,block:0,currentHp:20,maxHp:h.maxHp};const draw=applyEnemyHeroRelics(p);assert.equal(p.strength,h.relic.rpgInnate.strength);assert.equal(p.block,h.relic.rpgInnate.block);assert.equal(draw,h.relic.rpgInnate.draw);assert.equal(p.currentHp,20+h.relic.rpgInnate.heal);
   assert.equal(getThemedCharacterSpritePath(theme,h.id,'attack',h.imageData),h.imageData);assert.equal(getThemedCharacterIdleSpriteSheetPath(theme,h.id),null);assert.equal(getThemedCharacterAnimationSheetPath(theme,h.id,'hit'),null);
   if(!existsSync('public/'+decodeURIComponent(h.imageData.split('?')[0].replace(/^\//,''))))missing.push([h.name,h.imageData]);
  }
  assert.deepEqual(missing,[],`${theme} missing portraits`);
  console.log(theme,heroes.length,'unique hero loadouts valid');
 }
 const {createWorld,addPlayer,applyAction,WIDTH,HEIGHT}=await server.ssrLoadModule('/src/rpg/engine.ts');
 const {STORIES}=await server.ssrLoadModule('/src/rpg/stories.ts');
 const {BIOMES,biomeBattleBackground}=await server.ssrLoadModule('/src/rpg/biomes.ts');
 for(const b of BIOMES)assert(existsSync('public/'+biomeBattleBackground(b).image.replace(/^\//,'')));
 for(const seed of [1,7,42,999]) {
  const w=createWorld(seed);addPlayer(w,'a','A');addPlayer(w,'b','B');const p=w.players.a;
  p.profile={hp:20,maxHp:80,gold:0,character:'WARRIOR',image:'',deckSize:0,deck:[]};p.hp=20;p.maxHp=80;
  const queue=[[p.x,p.y]],seen=new Set([p.y*WIDTH+p.x]);
  for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,key=ny*WIDTH+nx;if(nx<0||ny<0||nx>=WIDTH||ny>=HEIGHT||seen.has(key)||['water','forest'].includes(w.tiles[key]))continue;seen.add(key);queue.push([nx,ny]);}}
  for(const site of w.sites)assert(seen.has(site.y*WIDTH+site.x),'unreachable '+site.name);
  for(const [index,s] of STORIES.entries()){
   const npc=w.sites.find(t=>t.storyId===s.id&&t.storyRole==='npc'),goal=w.sites.find(t=>t.storyId===s.id&&t.storyRole==='goal');
   const act=(site,choice)=>applyAction(w,'a',{type:'story-choice',siteId:site.id,choice});
   p.x=0;p.y=0;assert.equal(act(npc,'accept'),false);
   p.x=goal.x;p.y=goal.y;assert.equal(act(goal,'search'),false);
   p.x=npc.x;p.y=npc.y;assert(act(npc,'accept'));assert.equal(act(npc,'restore'),false);
   p.x=goal.x;p.y=goal.y;assert(act(goal,'search'));
   p.x=npc.x;p.y=npc.y;assert(act(npc,index%2?'share':'restore'));assert.equal(p.stories[s.id].stage,'complete');
   const gold=p.gold;assert.equal(act(npc,'restore'),false);assert.equal(p.gold,gold);assert.equal(w.players.b.stories,undefined);
   assert(applyAction(w,'a',{type:'native-profile',profile:{...p.profile,mutationRevision:p.mutationRevision}}));
  }
  assert.equal(p.gold,195);assert.equal(p.hp,80);
  w.ended=true;assert.equal(applyAction(w,'b',{type:'story-choice',siteId:w.sites.find(s=>s.kind==='story').id,choice:'accept'}),false);
 }
 console.log('6 biomes reachable; story branches, isolated progress and reward replay protection passed');
} finally {await server.close();}
