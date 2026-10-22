import assert from 'node:assert/strict';

export async function testKochoVoices(page,base) {
 const result=await page.evaluate(async()=>{
  const {kochoSkillVoice,kochoVoiceDuration}=await import('/src/mini-games/kocho/voices.ts');
  const {KOCHO_GUEST_CARDS}=await import('/src/mini-games/kocho/guests.ts');
  const counts={};const paths=new Set();
  for(const hero of ['original','rebel','akari']){
   const cards=__kocho.cards.filter(c=>!KOCHO_GUEST_CARDS.some(g=>g.name===c.name)||KOCHO_GUEST_CARDS.some(g=>g.hero===hero&&g.name===c.name));
   counts[hero]=cards.length;
   for(const card of cards){const clip=kochoSkillVoice(hero,card.name);if(!clip||!kochoVoiceDuration(hero,clip))throw Error(`Missing ${hero}/${card.name}`);paths.add(`${hero}/${clip}`);}
   for(const action of ['start','forward','back','turn','wait','special','damage','wave-clear','victory','defeat','item'])if(!kochoVoiceDuration(hero,`action-${action}`))throw Error(`Missing ${hero}/${action}`);
  }
  return {counts,uniqueSkills:paths.size};
 });
 assert.deepEqual(result.counts,{original:77,rebel:157,akari:157});assert.equal(result.uniqueSkills,391);
 // Exercise the real controller and spy only on the audio boundary.
 await page.evaluate(async()=>{
  const {audioService:a}=await import('/src/services/audioService.ts');
  window.__voiceCalls=[];window.__voicePending=[];
  a.playKochoVoice=(hero,clip,priority)=>{__voiceCalls.push({hero,clip,priority});return window.__holdVoice?new Promise(resolve=>__voicePending.push(resolve)):Promise.resolve(false);};
 });
 await page.locator('.kocho-level-button').first().click();
 await page.waitForFunction(()=>__voiceCalls.some(v=>v.hero==='original'&&v.clip==='action-start'));
 const arena=async(hero='original')=>page.evaluate(hero=>{
  const s=__kocho.initial(hero);s.phase='BATTLE';s.player.pos=2;s.player.hp=50;s.player.maxHp=100;
  s.enemies=[{...s.player,id:'enemy',type:'ENEMY',name:'不良生徒',pos:3,facing:-1,hp:1000,maxHp:1000,intent:{type:'WAIT',timer:99}}];
  __kocho.setState(s);__voiceCalls.length=0;
 },hero);
 for(const hero of ['original','rebel','akari']){
  await arena(hero);
  await page.evaluate(()=>__kocho.special());
  assert.ok((await page.evaluate(()=>__voiceCalls)).some(v=>v.clip==='action-special'&&v.hero===hero));
 }
 await arena();await page.evaluate(()=>__kocho.move(1));
 assert.equal((await page.evaluate(()=>__voiceCalls)).length,0,'Blocked movement must stay silent');
 await arena();await page.evaluate(()=>{__kocho.setState({...__kocho.state,specialActionCooldown:3});return __kocho.special();});
 assert.equal((await page.evaluate(()=>__voiceCalls)).length,0,'Cooldown must stay silent');
 await arena();await page.evaluate(()=>{__kocho.setState({...__kocho.state,enemies:__kocho.state.enemies.map(e=>({...e,pos:5}))});return __kocho.move(1);});
 assert.ok((await page.evaluate(()=>__voiceCalls)).some(v=>v.clip==='action-forward'));
 for(const [hero,name] of [['original','定規スラッシュ'],['rebel','紅蓮連拳・解放'],['akari','スターライト・フィナーレ']]){
  await arena(hero);
  await page.evaluate(name=>{const s=__kocho.state;s.queue=[{...__kocho.cards.find(c=>c.name===name),id:'voice-test',currentCooldown:0,usedSlots:0}];__kocho.setState(s);},name);
  await page.evaluate(()=>__kocho.execute());
  const calls=await page.evaluate(()=>__voiceCalls);assert.ok(calls.some(v=>v.hero===hero&&v.clip.startsWith('skill-')&&v.priority===3));
 }
 await arena();await page.evaluate(()=>__kocho.move(-1));
 assert.ok((await page.evaluate(()=>__voiceCalls)).some(v=>v.clip==='action-back'));
 await arena();await page.evaluate(()=>__kocho.turn());
 assert.ok((await page.evaluate(()=>__voiceCalls)).some(v=>v.clip==='action-turn'));
 await arena();await page.evaluate(()=>{__kocho.setState({...__kocho.state,consumables:[__kocho.consumables.find(c=>c.type==='HEAL')]});__kocho.consume(0);});
 assert.ok((await page.evaluate(()=>__voiceCalls)).some(v=>v.clip==='action-item'));
 await arena();await page.evaluate(()=>__kocho.wait());
 assert.ok((await page.evaluate(()=>__voiceCalls)).some(v=>v.clip==='action-wait'));
 await arena();await page.evaluate(()=>__kocho.setState({...__kocho.state,player:{...__kocho.state.player,hp:49}}));
 await page.waitForFunction(()=>__voiceCalls.some(v=>v.clip==='action-damage'));
 await page.evaluate(()=>__kocho.setState({...__kocho.state,status:'WAVE_CLEAR'}));
 await page.waitForFunction(()=>__voiceCalls.some(v=>v.clip==='action-wave-clear'));
 await arena();await page.evaluate(()=>__kocho.setState({...__kocho.state,status:'VICTORY'}));
 await page.waitForFunction(()=>__voiceCalls.some(v=>v.clip==='action-victory'));
 await arena();await page.evaluate(()=>__kocho.setState({...__kocho.state,status:'GAME_OVER'}));
 await page.waitForFunction(()=>__voiceCalls.some(v=>v.clip==='action-defeat'));
 // A queued follow-up must wait for the preceding call to finish.
 await arena();await page.evaluate(()=>{
  __holdVoice=true;const s=__kocho.state;
  s.queue=['定規スラッシュ','コンパス突き'].map((name,i)=>({...__kocho.cards.find(c=>c.name===name),id:`queued-${i}`,currentCooldown:0,usedSlots:0}));
  __kocho.setState(s);void __kocho.execute();
 });
 await page.waitForFunction(()=>__voicePending.length===1);
 await page.waitForTimeout(600);
 assert.equal(await page.evaluate(()=>__voiceCalls.filter(v=>v.clip.startsWith('skill-')).length),1);
 const checkpoint=await page.evaluate(()=>JSON.parse(localStorage.pixel_spire_kocho_state_v1));
 assert.equal(checkpoint.status,'PLAYING');assert.equal(checkpoint.queue.length,2);assert.equal(checkpoint.enemies[0].hp,1000);
 await page.evaluate(()=>__voicePending.shift()(true));
 await page.waitForFunction(()=>__voicePending.length===1);
 assert.equal(await page.evaluate(()=>__voiceCalls.filter(v=>v.clip.startsWith('skill-')).length),2);
 await page.evaluate(()=>{__holdVoice=false;__voicePending.shift()(true);});
 await page.waitForFunction(()=>__kocho.state.status!=='EXECUTING');
 // Reload for real AudioService priority, mute and cancellation checks.
 await page.evaluate(()=>localStorage.clear());
 await page.goto(base+'?voice=1');await page.waitForFunction(()=>Boolean(window.__kocho));
 const service=await page.evaluate(async()=>{
  const {audioService:a}=await import('/src/services/audioService.ts');
  a.init();a.setVoiceVolume(.8);
  const original=a.playVoiceFile;const pending=[];let played=0;
  a.playVoiceFile=()=>{played++;return new Promise(resolve=>pending.push(resolve));};
  const first=a.playKochoVoice('original','action-special',3);
  const ignored=await a.playKochoVoice('original','action-damage',2);
  const countAfterIgnored=played;
  const last=a.playKochoVoice('akari','action-victory',4);
  const cancelled=await first;
  a.setVoiceVolume(0);const cancelledByMute=await last;
  const muted=await a.playKochoVoice('original','action-start',2);
  a.setVoiceVolume(.8);const background=a.playKochoVoice('original','action-wait',2);
  a.handleAppBackground();const cancelledBackground=await background;await a.handleAppForeground();
  const realTimer=window.setTimeout;let expire;
  // Derive the duration rather than hard-coding a generated take's length.
  const {kochoVoiceDuration}=await import('/src/mini-games/kocho/voices.ts');
  const limit=kochoVoiceDuration('original','action-wait')+5000;
  window.setTimeout=(fn,ms,...rest)=>{if(ms===limit){expire=fn;return 0;}return realTimer(fn,ms,...rest);};
  const delayed=a.playKochoVoice('original','action-wait',2);window.setTimeout=realTimer;
  if(!expire)throw Error('Missing bounded voice wait');expire();const timedOut=await delayed;
  a.playVoiceFile=original;pending.forEach(resolve=>resolve(false));
  return {ignored,countAfterIgnored,cancelled,cancelledByMute,muted,cancelledBackground,timedOut,played};
 });
 assert.deepEqual(service,{ignored:false,countAfterIgnored:1,cancelled:false,cancelledByMute:false,muted:false,cancelledBackground:false,timedOut:false,played:4});
 const playback=await page.evaluate(async()=>{
  const {audioService:a}=await import('/src/services/audioService.ts');
  const {kochoVoiceDuration}=await import('/src/mini-games/kocho/voices.ts');
  a.setVoiceVolume(.8);const start=performance.now();
  const played=await a.playKochoVoice('original','action-forward',2);
  return {played,elapsed:performance.now()-start,expected:kochoVoiceDuration('original','action-forward')};
 });
 assert.equal(playback.played,true);assert.ok(playback.elapsed>=playback.expected*.75&&playback.elapsed<playback.expected+2000,JSON.stringify(playback));
 await page.evaluate(async()=>{const {audioService:a}=await import('/src/services/audioService.ts');a.stopKochoVoices();a.setVoiceVolume(0);});
 console.log('Kocho voices: 391 skill mappings + 33 actions; controller, combo pacing, priority, cancellation, mute and real OGG playback passed');
}
