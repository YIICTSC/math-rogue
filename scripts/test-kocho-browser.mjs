import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createServer } from 'vite';
import { chromium } from 'playwright';
let server,browser;
const out='tmp/kocho-qa';await fs.mkdir(out,{recursive:true});
try {
 server=await createServer({logLevel:'error',cacheDir:'node_modules/.vite-kocho-qa',optimizeDeps:{entries:['scripts/fixtures/kocho.tsx']},server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{name:'kocho-qa',enforce:'pre',
  configureServer(s){s.middlewares.use('/kocho-test',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml(req.url,'<html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><div id="root" style="height:100dvh"></div><script type="module" src="/scripts/fixtures/kocho.tsx"></script></body></html>'));});},
  transform(source,id){if(!id.endsWith('/components/KochoShowdown.tsx'))return;return "import {flushSync as qaFlush} from 'react-dom';\n"+source.replace('    // --- MAIN RENDER ---',`    Object.assign(window,{__kocho:{state:gameState,initial:getInitialState,cards:ALL_KOCHO_CARD_DB,rewards:rewardCards,pool:getUnlockedKochoCardTemplates,hydrate:hydrateState,generateRewards,execute:executeQueue,move:handleMove,special:handleSwapPosition,turn:handleTurn,wait:handleWait,consume:useConsumable,consumables:CONSUMABLE_DB,setState:(v:any)=>qaFlush(()=>{stateRef.current=v;setGameState({...v});})}});\n    // --- MAIN RENDER ---`);},
 }]});await server.listen();
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox',...((process.env.KOCHO_VOICE_TEST||process.env.KOCHO_ENEMY_VOICE_TEST)?['--autoplay-policy=no-user-gesture-required']:[])]});
 const page=await browser.newPage({viewport:{width:1280,height:900},hasTouch:true});page.setDefaultTimeout(60000);
 const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
 page.on('response',res=>{if(res.url().includes('/sprites/kocho/')&&res.status()>=400)errors.push(`${res.status()} ${res.url()}`);});
 const base=`http://127.0.0.1:${server.httpServer.address().port}/kocho-test`;
 await page.goto(base+((process.env.KOCHO_VOICE_TEST||process.env.KOCHO_ENEMY_VOICE_TEST)?'?voice=1':''));await page.locator('.kocho-lobby').waitFor();
 if(process.env.KOCHO_VOICE_EXPORT){
  const catalog=await page.evaluate(async()=>{const {KOCHO_GUEST_CARDS}=await import('/src/mini-games/kocho/guests.ts');return {shared:__kocho.cards.filter(c=>!KOCHO_GUEST_CARDS.some(g=>g.name===c.name)).map(({name,type})=>({name,type})),guests:KOCHO_GUEST_CARDS.map(({hero,name,type,hiraganaName})=>({hero,name,type,hiraganaName}))};});
  await fs.writeFile('tmp/kocho-voice-cards.json',JSON.stringify(catalog,null,2));console.log('Exported voice cards',catalog.shared.length,catalog.guests.length);await browser.close();await server.close();process.exit(0);
 }
 if(process.env.KOCHO_ENEMY_VOICE_TEST){
  const {testKochoEnemyVoices}=await import('./test-kocho-enemy-voices.mjs');
  await testKochoEnemyVoices(page,base);assert.deepEqual(errors,[]);await browser.close();await server.close();process.exit(0);
 }
 if(process.env.KOCHO_VOICE_TEST){
  const {testKochoVoices}=await import('./test-kocho-voices.mjs');
  await testKochoVoices(page,base);
  assert.deepEqual(errors,[]);await browser.close();await server.close();process.exit(0);
 }
 await page.locator('.kocho-title-art img').evaluate(img=>img.decode());
 assert.equal(await page.locator('[data-kocho-hero=rebel]').isDisabled(),true);
 assert.equal(await page.locator('[data-kocho-hero=akari]').isDisabled(),true);
 await page.screenshot({path:`${out}/title-desktop.png`});
 const core=await page.evaluate(async()=>{
   const {KOCHO_GUEST_CARDS,unlockedKochoHeroes}=await import('/src/mini-games/kocho/guests.ts');
   const {resolveHeroTechnique}=await import('/src/mini-games/kocho/techniques.ts');
   const {resolveKochoSpecial}=await import('/src/mini-games/kocho/movement.ts');
   const counts=['rebel','akari'].map(h=>KOCHO_GUEST_CARDS.filter(c=>c.hero===h).length);
   const p={id:'p',pos:2,facing:1,hp:10},en=[{id:'e',pos:3,facing:-1,hp:10}];
   let movementCases=0;
   for(const hero of ['original','rebel','akari'])for(let pos=0;pos<7;pos++)for(const facing of [-1,1])for(const enemyFacing of [-1,1])for(let blocker=-1;blocker<7;blocker++) {
     const target=pos+facing;if(target<0||target>6||blocker===pos||blocker===target)continue;
     const player={...p,pos,facing},enemies=[{...en[0],pos:target,facing:enemyFacing},...(blocker>=0?[{id:'block',pos:blocker,facing:1,hp:10}]:[])];
     const before=JSON.stringify({player,enemies});const result=resolveKochoSpecial(hero,player,enemies);
     if(JSON.stringify({player,enemies})!==before)throw Error('Special action mutated its input');
     if(result.ok) {
       const positions=[result.player.pos,...result.enemies.filter(e=>e.hp>0).map(e=>e.pos)];
       if(positions.some(p=>p<0||p>6)||new Set(positions).size!==positions.length)throw Error('Special action produced an illegal placement');
     } movementCases++;
   }
   return {counts,unique:new Set(KOCHO_GUEST_CARDS.map(c=>c.name)).size,
    movementCases,
    unlocked:unlockedKochoHeroes(['original','rebel']),focus:resolveHeroTechnique(8,{gain:5,spend:3,bonusPerFocus:1,repeat:2}),
    rebel:resolveKochoSpecial('rebel',p,en),akari:resolveKochoSpecial('akari',p,en),original:resolveKochoSpecial('original',p,en),
    blocked:resolveKochoSpecial('rebel',p,[...en,{id:'wall',pos:4,facing:-1,hp:1}]),
    capped:resolveKochoSpecial('akari',p,[...en,{id:'wall',pos:5,facing:-1,hp:1}]),
    left:resolveKochoSpecial('rebel',{...p,pos:4,facing:-1},[{...en[0],pos:3,facing:1}]),
    legacy:__kocho.hydrate({...__kocho.initial(),heroId:undefined,focus:undefined}).heroId};
 });
 assert.deepEqual(core.counts,[80,80]);assert.equal(core.unique,160);assert.deepEqual(core.unlocked,['original','rebel','akari']);
 assert.ok(core.movementCases>400);console.log(`${core.movementCases} special-action placements checked`);
 assert.equal(core.focus.focus,10);assert.equal(core.focus.bonusDamage,3);assert.equal(core.focus.repeat,2);
 assert.equal(core.rebel.player.pos,4);assert.equal(core.rebel.player.facing,-1);assert.equal(core.rebel.enemies[0].pos,3);
 assert.equal(core.akari.player.pos,3);assert.equal(core.akari.enemies[0].pos,6);assert.equal(core.original.enemies[0].pos,2);
 assert.equal(core.blocked.ok,false);assert.equal(core.capped.enemies[0].pos,4);assert.equal(core.left.player.pos,2);assert.equal(core.left.player.facing,1);assert.equal(core.legacy,'original');
 // Actual victory effect: unlock once, persist, then select the guest.
 await page.evaluate(()=>{const s=__kocho.initial();s.status='VICTORY';s.phase='VICTORY';s.battleStage=7;__kocho.setState(s);});
 await page.getByText('ゲスト主人公解放！',{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.pixel_spire_kocho_ranking_v1).length),1);
 await page.getByRole('button',{name:'主人公選択へ',exact:true}).click();
 await page.locator('[data-kocho-hero=rebel]').click();
 await page.getByRole('button',{name:/専用カードを見る/}).click();
 assert.equal(await page.locator('.kocho-card-catalog-grid article').count(),80);
 await page.screenshot({path:`${out}/rebel-cards.png`});
 await page.getByRole('button',{name:'閉じる',exact:true}).click();
 await page.locator('.kocho-level-button').first().click();
 await page.waitForFunction(()=>__kocho.state.phase==='BATTLE'&&__kocho.state.enemies.length>0);
 assert.equal(await page.evaluate(()=>__kocho.state.heroId),'rebel');
 assert.equal(await page.evaluate(()=>__kocho.state.hand.every(c=>['叛逆ナックル','紅蓮タックル','不屈のガード'].includes(c.name))),true);
 const setArena=async(hero='rebel')=>page.evaluate(hero=>{const s=__kocho.initial(hero);s.phase='BATTLE';s.battleStage=2;s.player.pos=2;s.player.maxHp=100;s.player.hp=50;s.enemies=[{...s.player,id:'enemy',type:'ENEMY',name:'不良生徒',pos:3,facing:-1,maxHp:1000,hp:1000,intent:{type:'WAIT',timer:99}}];__kocho.setState(s);},hero);
 await setArena();await page.locator('[data-kocho-special]').click();await page.waitForFunction(()=>__kocho.state.specialActionCooldown===3);
 assert.equal(await page.evaluate(()=>__kocho.state.player.pos),4);assert.equal(await page.evaluate(()=>__kocho.state.player.facing),-1);
 await setArena();await page.evaluate(()=>{const s=__kocho.state;s.focus=5;s.queue=[{...__kocho.cards.find(c=>c.name==='紅蓮連拳・解放'),id:'test-card',currentCooldown:0,usedSlots:0}];__kocho.setState(s);});
 await page.evaluate(()=>__kocho.execute());
 assert.equal(await page.evaluate(()=>__kocho.state.enemies[0].hp),990); // (2+3) x 2
 assert.equal(await page.evaluate(()=>__kocho.state.focus),2);
 assert.equal(await page.evaluate(()=>__kocho.state.player.shield),2);
 await setArena();await page.evaluate(()=>{const s=__kocho.state;s.status='VICTORY';s.phase='VICTORY';s.battleStage=7;__kocho.setState(s);});
 await page.getByText('ゲスト主人公解放！',{exact:true}).waitFor();
 await page.getByRole('button',{name:'主人公選択へ',exact:true}).click();
 await page.locator('[data-kocho-hero=akari]').click();
 await page.getByRole('button',{name:/専用カードを見る/}).click();
 assert.equal(await page.locator('.kocho-card-catalog-grid article').count(),80);
 await page.screenshot({path:`${out}/akari-cards.png`});
 await page.getByRole('button',{name:'閉じる',exact:true}).click();
 await setArena('akari');await page.evaluate(()=>__kocho.move(1));
 assert.equal(await page.evaluate(()=>__kocho.state.player.pos),3);assert.equal(await page.evaluate(()=>__kocho.state.enemies[0].pos),6);
 await page.evaluate(()=>{const s=__kocho.state;s.specialActionCooldown=0;s.player.pos=2;s.enemies[0].pos=3;s.enemies.push({...s.enemies[0],id:'block',pos:4});__kocho.setState(s);});
 await page.evaluate(()=>__kocho.move(1));assert.equal(await page.evaluate(()=>__kocho.state.player.pos),2);assert.equal(await page.evaluate(()=>__kocho.state.specialActionCooldown),0);
 // Run every new card through the real combat executor, not a duplicate model.
 const guestNames=await page.evaluate(async()=>{const {KOCHO_GUEST_CARDS}=await import('/src/mini-games/kocho/guests.ts');return KOCHO_GUEST_CARDS.map(c=>({name:c.name,hero:c.hero}));});
 for(const [index,{name,hero}] of (process.env.KOCHO_QUICK?[]:guestNames).entries()) {
   await setArena(hero);
   const result=await page.evaluate(async({name})=>{
     const {resolveHeroTechnique}=await import('/src/mini-games/kocho/techniques.ts');
     const card=__kocho.cards.find(c=>c.name===name),s=__kocho.state;
     s.focus=5;s.enemies[0].pos=s.player.pos+(card.range.find(r=>r>0)??1);
     s.hand=[{...__kocho.cards.find(c=>c.name==='定規スラッシュ'),id:'cooldown-probe',currentCooldown:4,usedSlots:0}];
     s.queue=[{...card,id:'executed',currentCooldown:0,usedSlots:0}];__kocho.setState(s);
     const effect=resolveHeroTechnique(5,card.technique,card.type==='UTILITY');
     await __kocho.execute();
     await new Promise(r=>setTimeout(r,30));
     return {state:__kocho.state,expected:{damage:card.type==='ATTACK'?(card.damage+effect.bonusDamage)*effect.repeat:0,
      hp:50+(card.effectType==='HEAL'?3:0)+(card.effectType==='DRAIN'?effect.repeat:0)+effect.heal,
      shield:(card.shield??0)+effect.shield,focus:effect.focus,barrier:effect.barrier,strength:effect.strength,
      cooldown:Math.max(0,4-effect.reduceCooldown-1)}};
   },{name});
   assert.equal(result.state.enemies[0].hp,1000-result.expected.damage,`${name}: damage`);
   assert.equal(result.state.player.hp,result.expected.hp,`${name}: healing`);
   assert.equal(result.state.player.shield,result.expected.shield,`${name}: shield`);
   assert.equal(result.state.focus,result.expected.focus,`${name}: focus`);
   assert.equal(result.state.player.barrier,result.expected.barrier,`${name}: barrier`);
   assert.equal(result.state.player.strength,result.expected.strength,`${name}: next-hit strength`);
   assert.equal(result.state.hand.find(c=>c.id==='cooldown-probe').currentCooldown,result.expected.cooldown,`${name}: cooldown`);
   if((index+1)%40===0)console.log(`Combat executor: ${index+1}/160 exclusive cards passed`);
 }
 for(const hero of ['rebel','akari']) {
   await setArena(hero);
   const pools=await page.evaluate(hero=>({own:__kocho.pool(hero,7).filter(c=>c.name.includes('フィナーレ')||c.name.includes('最終宣言')).length,wrong:__kocho.pool(hero,7).some(c=>c.name===(hero==='rebel'?'星のひかり':'叛逆ナックル'))}),hero);
   assert.equal(pools.own,1);assert.equal(pools.wrong,false);
   for(const [label,width,height] of [['desktop',1280,900],['portrait',390,844],['landscape',844,390]]) {
     await page.setViewportSize({width,height});await page.screenshot({path:`${out}/${hero}-${label}.png`});
     assert.equal(await page.locator('[data-kocho-cell]').count(),7);
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   }
 }
 // Preview must not grant progress or save a score.
 await page.goto(`${base}?preview=1`);const before=await page.evaluate(()=>localStorage.pixel_spire_kocho_ranking_v1);
 await page.evaluate(()=>{const s=__kocho.initial();s.status='VICTORY';s.phase='VICTORY';__kocho.setState(s);});
 await page.getByRole('button',{name:'主人公選択へ'}).waitFor();assert.equal(await page.evaluate(()=>localStorage.pixel_spire_kocho_ranking_v1),before);
 for(const lang of ['en','hi']) {
   await page.evaluate(()=>localStorage.removeItem('pixel_spire_kocho_state_v1'));
   await page.goto(`${base}?lang=${lang}`);await page.locator('.kocho-lobby').waitFor();await page.locator('[data-kocho-hero=akari]').click();
   await page.screenshot({path:`${out}/title-${lang}.png`});
   if(lang==='en') {
     assert.equal(/[ぁ-んァ-ヶ一-龠]/.test(await page.locator('.kocho-lobby').innerText()),false);
     await page.getByRole('button',{name:/View exclusive cards/}).click();
     assert.equal(/[ぁ-んァ-ヶ一-龠]/.test(await page.locator('.kocho-card-catalog').innerText()),false);
   }
 }
 assert.deepEqual(errors,[]);console.log('Kocho: 160 cards, effects, guest unlocks, legacy saves, special actions and responsive layouts PASS');
} finally {
 console.log('Closing Kocho browser verification...');
 await browser?.close();
 server?.httpServer?.closeAllConnections();
 await server?.close();
 console.log('Kocho verification cleaned up.');
}
