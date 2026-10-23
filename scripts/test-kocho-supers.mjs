import assert from 'node:assert/strict';
export async function testKochoSupers(page,base) {
 const result=await page.evaluate(async()=>{
  const {SUPER_MOVES}=await import('/src/mini-games/kocho/superData.ts');
  const {findKochoSuper,kochoSuperCandidates,resolveKochoSuper}=await import('/src/mini-games/kocho/superMoves.ts');
  const player={id:'p',hp:10,maxHp:20,pos:0,facing:1,shield:0};
  const enemies=[{id:'a',hp:100,pos:4,facing:-1,shield:30,intent:{type:'ATTACK',timer:1}},{id:'b',hp:100,pos:6,facing:-1,shield:0,intent:{type:'WAIT',timer:2}}];
  let recipes=0;
  for(const m of SUPER_MOVES){
   for(const a of m.steps[0])for(const b of m.steps[1])for(const c of m.steps[2]){
    if(findKochoSuper(m.hero,[a,b,c])?.id!==m.id)throw Error(`Ambiguous recipe ${m.name}`);recipes++;
   }
   if(kochoSuperCandidates(m.hero,[m.steps[0][0]]).length===0)throw Error('Missing prefix hint');
   if(m.steps.flat().some(name=>!__kocho.cards.some(c=>c.name===name)))throw Error(`Unknown card ${m.name}`);
   const before=JSON.stringify({player,enemies});const r=resolveKochoSuper(m,player,enemies);
   if(JSON.stringify({player,enemies})!==before)throw Error('Mutation');
   if(r.enemies[0].hp!==100-m.damage)throw Error('Finisher must pierce shields');
   if(r.player.hp>20||r.player.shield!==m.shield)throw Error('Invalid support bonus');
   if(new Set([r.player.pos,...r.enemies.filter(e=>e.hp>0).map(e=>e.pos)]).size!==3)throw Error('Overlapping actors');
   if(m.style==='stun'&&r.enemies[0].intent.timer!==3)throw Error('Missing stun');
  }
  if(findKochoSuper('original',['定規スラッシュ','チョーク投げ','回し蹴り']))throw Error('Order must matter');
  if(findKochoSuper('rebel',SUPER_MOVES[0].steps.map(s=>s[0])))throw Error('Wrong hero');
  return {recipes,moves:SUPER_MOVES};
 });
 assert.equal(result.recipes,1422);assert.equal(result.moves.length,36);
 await page.locator('[data-kocho-super-guide]').click();
 await page.getByRole('dialog').waitFor();assert.equal(await page.locator('[data-super-recipe]').count(),12);
 await page.screenshot({path:'tmp/kocho-qa/super-guide-desktop.png'});
 await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
 assert.equal(await page.locator('[data-kocho-super-guide]').evaluate(e=>e===document.activeElement),true);
 await page.evaluate(async()=>{
  const {audioService:a}=await import('/src/services/audioService.ts');
  a.playKochoVoice=()=>Promise.resolve(false);a.playKochoEnemyVoice=()=>Promise.resolve(false);
  window.__superCalls=[];a.playKochoSuperVoice=(hero,clip)=>{__superCalls.push({hero,clip});return new Promise(()=>{});};
 });
 const arena=async(move,reverse=false,miss=false)=>page.evaluate(({move,reverse,miss})=>{
  const s=__kocho.initial(move.hero);s.phase='BATTLE';s.player.hp=30;s.player.maxHp=50;s.player.pos=miss?0:3;s.focus=10;
  const positions=miss?[6]:[0,1,2,4,5,6];s.enemies=positions.map((pos,i)=>({id:`e${i}`,type:'ENEMY',name:'不良生徒',hp:1000,maxHp:1000,pos,facing:pos<s.player.pos?1:-1,shield:0,strength:0,spriteName:'SENIOR|#a855f7',intent:{type:'WAIT',timer:99}}));
  const steps=move.steps.map(s=>s[0]);if(reverse)steps.reverse();
  s.queue=steps.map((name,i)=>({...__kocho.cards.find(c=>c.name===name),id:`super-test-${i}`,currentCooldown:0,usedSlots:0}));s.hand=[];__superCalls.length=0;__kocho.setState(s);
 },{move,reverse,miss});
 for(const m of result.moves){
  await arena(m);
  assert.equal(await page.locator('[data-kocho-combo-hint]').count(),1);
  await page.evaluate(()=>{void __kocho.execute();});
  await page.waitForFunction(()=>__superCalls.length===1,null,{timeout:7000});
  assert.deepEqual(await page.evaluate(()=>__superCalls[0]),{hero:m.hero,clip:m.id});
  await page.locator(`[data-kocho-super="${m.id}"]`).waitFor();
  assert.ok(await page.locator('.kocho-super-afterimage').count()>0);
  if(m.index===0){await page.waitForTimeout(140);await page.screenshot({path:`tmp/kocho-qa/super-${m.hero}-desktop.png`});}
  await page.waitForFunction(()=>__kocho.state.status==='PLAYING',null,{timeout:3500});
  assert.equal(await page.locator('[data-kocho-super]').count(),0,'Cut-in must not linger or wait for voice');
  assert.ok(await page.evaluate(damage=>__kocho.state.enemies.some(e=>e.hp<=1000-damage),m.damage),'Finisher must apply bonus damage');
 }
 await arena(result.moves[0],false,true);await page.evaluate(()=>__kocho.execute());assert.equal(await page.evaluate(()=>__superCalls.length),0,'A missed final attack must not trigger');
 await arena(result.moves[0],true);await page.evaluate(()=>__kocho.execute());assert.equal(await page.evaluate(()=>__superCalls.length),0,'Wrong order must not trigger');
 // Defeating a boss must evolve exactly once, without carrying bonus damage into the next form.
 for(const phase of [1,2,3]){
  await arena(result.moves[0]);
  await page.evaluate(phase=>{const s=__kocho.state;s.battleStage=7;s.enemies=[{...s.enemies.find(e=>e.pos===4),name:phase===1?'校長':phase===2?'激怒校長':'真・校長',hp:12,maxHp:50,bossPhase:phase}];__kocho.setState(s);},phase);
  await page.evaluate(()=>__kocho.execute());
  const state=await page.evaluate(()=>__kocho.state);
  assert.equal(await page.evaluate(()=>__superCalls.length),1);
  if(phase<3){assert.equal(state.status,'PLAYING');assert.equal(state.enemies[0].bossPhase,phase+1);assert.equal(state.enemies[0].hp,state.enemies[0].maxHp);}
  else {assert.equal(state.status,'WAVE_CLEAR');await page.waitForTimeout(1100);}
 }
 // The final ordinary hit can defeat the target and must still show the dedicated finisher.
 await arena(result.moves[0]);
 await page.evaluate(()=>{const s=__kocho.state;s.enemies=[{...s.enemies.find(e=>e.pos===4),hp:7,maxHp:7}];__kocho.setState(s);});
 await page.evaluate(()=>__kocho.execute());assert.equal(await page.evaluate(()=>__superCalls.length),1);assert.equal(await page.evaluate(()=>__kocho.state.status),'WAVE_CLEAR');await page.waitForTimeout(1100);
 // Mobile guide, modal input gate and English/Hiragana strings.
 await page.setViewportSize({width:390,height:844});
 await arena(result.moves.find(m=>m.hero==='akari'));
 await page.locator('[data-kocho-super-guide]').click();
 const pos=await page.evaluate(()=>__kocho.state.player.pos);await page.evaluate(()=>__kocho.move(-1));
 assert.equal(await page.evaluate(()=>__kocho.state.player.pos),pos,'Guide must block gameplay');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:'tmp/kocho-qa/super-guide-mobile.png'});
 await page.keyboard.press('Escape');
 for(const lang of ['en','hi']){
  await page.evaluate(()=>{__kocho.setState(__kocho.initial());localStorage.clear();});await page.goto(base+`?lang=${lang}`);await page.locator('.kocho-lobby').waitFor();
  await page.locator('[data-kocho-super-guide]').click();const text=await page.getByRole('dialog').innerText();
  if(lang==='en')assert.equal(/[ぁ-んァ-ン一-龯]/.test(text),false,text);
  else assert.equal(/[一-龯]/.test(text),false,text);
 }
 console.log('Kocho supers: 36 actual controller finishers, 1422 recipes, all effects, misses/order, stalled voice, modal, desktop/mobile screenshots and translations passed');
}

export async function testKochoSuperAudio(page,base) {
 await page.goto(base+'?voice=1');await page.waitForFunction(()=>Boolean(window.__kocho));
 const priority=await page.evaluate(async()=>{
  const {audioService:a}=await import('/src/services/audioService.ts');a.init();a.setVoiceVolume(.8);
  const old=a.playVoiceFile;let count=0;const pending=[];
  a.playVoiceFile=()=>{count++;return new Promise(resolve=>pending.push(resolve));};
  const superVoice=a.playKochoSuperVoice('original','super-00');
  const skill=await a.playKochoVoice('original','action-special',3);
  const enemy=await a.playKochoEnemyVoice('校長','attack',2.5);
  const afterIgnored=count;
  const win=a.playKochoVoice('original','action-victory',4);const cancelled=await superVoice;
  a.setVoiceVolume(0);const muted=await win;
  const unknown=await a.playKochoSuperVoice('original','unknown');
  a.playVoiceFile=old;pending.forEach(r=>r(false));a.setVoiceVolume(.8);
  return {skill,enemy,afterIgnored,cancelled,muted,unknown};
 });
 assert.deepEqual(priority,{skill:false,enemy:false,afterIgnored:1,cancelled:false,muted:false,unknown:false});
 const real=await page.evaluate(async()=>{
  const {audioService:a}=await import('/src/services/audioService.ts');
  const {kochoSuperVoice}=await import('/src/mini-games/kocho/superMoves.ts');
  await a.preloadKochoSuperVoice('original','super-00');
  if(!a.voiceBuffers['kocho-voice-original-super-00'])throw Error('Missing decoded super preload');
  const start=performance.now();const played=await a.playKochoSuperVoice('original','super-00');
  a.stopKochoVoices();a.setVoiceVolume(0);
  return {played,elapsed:performance.now()-start,duration:kochoSuperVoice('original','super-00')};
 });
 assert.equal(real.played,true);assert.ok(real.elapsed>real.duration*.7&&real.elapsed<real.duration+2000,JSON.stringify(real));
 console.log('Kocho super audio: priority, victory interruption, mute, cancellation and actual generated OGG playback passed');
}
