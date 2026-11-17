import assert from 'node:assert/strict';
export async function testKochoFusion(page,out){
 // A debug menu session unlocks choices temporarily without recording any campaign victory.
 assert.equal(await page.locator('[data-kocho-hero=rebel]').isDisabled(),true);
 await page.evaluate(async()=>{const {enableDebugRewards}=await import('/src/point-exchange/debug.ts');enableDebugRewards();});
 for(const hero of ['original','rebel','akari'])assert.equal(await page.locator(`[data-kocho-hero=${hero}]`).isDisabled(),false);
 const realClears=await page.evaluate(async()=>{const {storageService}=await import('/src/services/storageService.ts');return storageService.getKochoClearedHeroes();});assert.deepEqual(realClears,[]);
 for(const hero of ['original','rebel','akari']){
  await page.locator(`[data-kocho-hero=${hero}]`).click();await page.locator('[data-kocho-endless]').click();await page.waitForFunction(hero=>__kocho.state.isEndless&&__kocho.state.heroId===hero&&__kocho.state.enemies.length>0,hero);
  assert.equal(await page.locator('[data-kocho-field]').count(),0);
  await page.evaluate(()=>__kocho.setState(__kocho.initial()));
 }
 console.log('PASS debug session: all 3 heroes and endless playable, real clears unchanged, shelved field mode remains hidden.');
 await page.evaluate(async()=>{const {audioService:a}=await import('/src/services/audioService.ts');window.__fusionSuperCalls=[];a.playKochoSuperVoice=(hero,id)=>{__fusionSuperCalls.push({hero,id});return Promise.resolve(true);};a.playKochoVoice=()=>Promise.resolve(false);});
 const setShop=async(hero,names)=>page.evaluate(({hero,names})=>{const s=__kocho.initial(hero);s.phase='SHOP';s.battleStage=2;s.money=100;s.hand=names.map((name,i)=>({...__kocho.cards.find(c=>c.name===name),id:'ingredient-'+i,currentCooldown:0,usedSlots:0}));__kocho.setState(s);},{hero,names});
 const select=async(count)=>{await page.locator('[data-kocho-fusion-open]').click();for(let i=0;i<count;i++)await page.locator('[data-fusion-ingredient]').nth(i).click();};
 const superMoves=await page.evaluate(async()=>{const {kochoSupers}=await import('/src/mini-games/kocho/superMoves.ts');return ['original','rebel','akari'].map(hero=>kochoSupers(hero)[0]);});
 for(const move of superMoves){
  await setShop(move.hero,move.steps.map(step=>step[0]));await select(3);
  assert(await page.locator('[data-fusion-preview]').innerText().then(text=>text.includes(move.name)));
  assert(await page.locator('.kocho-fusion-preview-art .kocho-fused-super-picture').evaluate((el,hero)=>el.style.backgroundImage.includes(`super-${hero}.webp`),move.hero));
  // Two clicks in the same JS task may only charge/create once.
  await page.evaluate(()=>{const button=document.querySelector('[data-fusion-confirm]');button.click();button.click();});
  const merged=await page.evaluate(()=>__kocho.state.hand[0]);assert.equal(merged.fusionParts.length,3);assert.equal(merged.fusionSuper.hero,move.hero);assert.equal(merged.fusionSuper.id,move.id);assert.equal(merged.name,move.name);
  assert.equal(await page.evaluate(()=>__kocho.state.money),80);assert.equal(await page.evaluate(()=>__kocho.state.hand.length),1);assert.equal(await page.evaluate(()=>__kocho.state.shopUpgradeUsed),false);assert.equal(await page.locator('[data-kocho-fusion-open]').isDisabled(),true);
  if(move.hero==='original'){
   // Exercise the actual autosave and browser reload, including nested action hydration.
   await page.waitForFunction(async()=>{const {storageService}=await import('/src/services/storageService.ts');return storageService.loadKochoState()?.shopFusionUsed===true;});await page.reload({waitUntil:'domcontentloaded',timeout:90000});await page.locator('[data-kocho-fusion-open]').waitFor();
   assert.equal(await page.locator('[data-kocho-fusion-open]').isDisabled(),true);assert.equal(await page.evaluate(()=>__kocho.state.hand[0].fusionParts.length),3);
   await page.evaluate(async()=>{const {audioService:a}=await import('/src/services/audioService.ts');window.__fusionSuperCalls=[];a.playKochoSuperVoice=(hero,id)=>{__fusionSuperCalls.push({hero,id});return Promise.resolve(true);};a.playKochoVoice=()=>Promise.resolve(false);});
  }
  await page.evaluate(()=>{const s=__kocho.state;s.phase='BATTLE';s.status='PLAYING';s.player.pos=3;s.player.hp=s.player.maxHp=100;s.enemies=[0,1,2,4,5,6].map((pos,i)=>({id:'e'+i,name:'不良生徒',type:'ENEMY',pos,hp:1000,maxHp:1000,shield:0,facing:pos<3?1:-1,intent:{type:'WAIT',timer:99}}));window.__fusionSuperCalls=[];__kocho.setState(s);});
  await page.locator('[data-kocho-hand-index="0"]').click();assert.equal(await page.evaluate(()=>__kocho.state.queue.length),1);assert.equal(await page.evaluate(()=>__kocho.state.hand.length),0);
  await page.evaluate(()=>{window.__fusionActions=[];window.__fusionPoll=setInterval(()=>{const a=__kocho.action;if(a&&__fusionActions.at(-1)!==a)__fusionActions.push(a);},15);});
  await page.locator('.kocho-queue-panel>button').click();await page.waitForFunction(()=>__kocho.state.status==='PLAYING'&&__kocho.state.queue.length===0,null,{timeout:12000});await page.evaluate(()=>clearInterval(__fusionPoll));
  assert.deepEqual(await page.evaluate(()=>__fusionSuperCalls),[{hero:move.hero,id:move.id}]);assert.deepEqual(await page.evaluate(()=>__fusionActions),move.steps.map(step=>step[0]));
  assert.equal(await page.evaluate(()=>__kocho.state.hand.length),1);assert.equal(await page.evaluate(()=>__kocho.state.hand[0].currentCooldown),merged.cooldown);assert(await page.evaluate(damage=>__kocho.state.enemies.some(e=>e.hp<=1000-damage),move.damage));
  await page.screenshot({path:`${out}/fusion-${move.hero}-battle.png`});
 }
 console.log('PASS all 3 super-card artworks, one-card action order/finisher/voice/cooldown, single charge, independent upgrade allowance and actual save/reload.');
 // A new chapter shop restores exactly one fusion; returning to the existing shop does not.
 await page.evaluate(()=>{const s=__kocho.state;s.phase='MATH';s.pendingPhase='SHOP';s.shopFusionUsed=true;__kocho.setState(s);__kocho.math(3);});await page.waitForFunction(()=>__kocho.state.phase==='SHOP');assert.equal(await page.locator('[data-kocho-fusion-open]').isDisabled(),false);
 // Ordinary fusions preserve order-dependent movement and damage in the existing combat engine.
 for(const reversed of [false,true]){
  const names=reversed?['定規スラッシュ','ダッシュ']:['ダッシュ','定規スラッシュ'];await setShop('original',names);await select(2);await page.locator('[data-fusion-confirm]').click();
  await page.evaluate(()=>{const s=__kocho.state;s.phase='BATTLE';s.status='PLAYING';s.player.pos=2;s.player.hp=s.player.maxHp=100;s.enemies=[{id:'target',name:'不良生徒',type:'ENEMY',pos:5,hp:1000,maxHp:1000,shield:0,facing:-1,intent:{type:'WAIT',timer:99}}];__kocho.setState(s);});
  await page.locator('[data-kocho-hand-index="0"]').click();await page.waitForFunction(()=>!__kocho.animating&&__kocho.state.queue.length===1);const timer=await page.evaluate(()=>__kocho.state.enemies[0].intent.timer);await page.locator('.kocho-queue-panel>button').click();await page.waitForFunction(()=>__kocho.state.status==='PLAYING'&&__kocho.state.queue.length===0,null,{timeout:10000});
  assert.equal(await page.evaluate(()=>__kocho.state.player.pos),4);const hp=await page.evaluate(()=>__kocho.state.enemies[0].hp);assert.equal(hp,reversed?1000:997);assert.equal(await page.evaluate(()=>__kocho.state.enemies[0].intent.timer),timer-1,'Enemy reacts once after both actions');
 }
 for(const [width,height]of[[1280,720],[390,844],[320,568],[844,390],[568,320]]){
  await page.setViewportSize({width,height});await setShop('original',superMoves[0].steps.map(step=>step[0]));await select(3);
  const button=page.locator('[data-fusion-confirm]');await button.scrollIntoViewIfNeeded();assert(await button.evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'Fusion confirm remains visible and touchable '+width);
  await page.screenshot({path:`${out}/fusion-shop-${width}x${height}.png`});await button.tap();assert.equal(await page.evaluate(()=>__kocho.state.hand.length),1);
 }
 await page.goto(page.url()+'?lang=en',{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>window.__kocho);await setShop('original',superMoves[0].steps.map(step=>step[0]));await select(3);const text=await page.locator('.kocho-fusion-workshop').innerText();assert(!/[ぁ-んァ-ヶ一-龯]/.test(text),'Fusion modal uses English for all copy and ingredient descriptions');
 console.log('PASS shop renewal, order-dependent dash/attack, five screen sizes, real touch hits and English fusion copy.');
}
