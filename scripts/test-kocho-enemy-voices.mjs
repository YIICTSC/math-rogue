import assert from 'node:assert/strict';
export async function testKochoEnemyVoices(page, base) {
 const selection=await page.evaluate(async()=>{
  const {selectKochoEnemyVoice:pick}=await import('/src/mini-games/kocho/enemyVoiceEvents.ts');
  const {kochoEnemyVoice:lookup}=await import('/src/mini-games/kocho/enemyVoices.ts');
  const e={id:'boss',name:'校長',hp:25,bossPhase:1,intent:{type:'ATTACK',timer:1}};
  const outputs=[pick([], [e],false),pick([e],[{...e,intent:{type:'WAIT',timer:2}}],true),
   pick([{...e,intent:{type:'SUMMON',timer:1}}],[{...e,intent:{type:'WAIT',timer:2}}],true),
   pick([e],[{...e,name:'激怒校長',bossPhase:2,hp:30}],true),pick([e],[{...e,hp:20}],false),pick([e],[],false),
   pick([e],[e],false),pick([e],[{...e,intent:{type:'WAIT',timer:2}}],false),pick([{...e,hp:0}],[e],false)];
  return {outputs,known:lookup('真・校長','skill'),unknown:lookup('unknown','attack')};
 });
 assert.deepEqual(selection.outputs.map(e=>e?.action),['spawn','attack','skill','spawn','damage','defeat',undefined,undefined,'spawn']);
 assert.equal(selection.outputs[3].name,'激怒校長');assert.ok(selection.known.duration>0);assert.equal(selection.unknown,undefined);
 await page.evaluate(async()=>{
  const {audioService:a}=await import('/src/services/audioService.ts');window.__enemyCalls=[];
  a.playKochoEnemyVoice=(name,action,priority)=>{__enemyCalls.push({name,action,priority});return Promise.resolve(false);};
  a.playKochoVoice=()=>Promise.resolve(false);
  const s=__kocho.initial();s.phase='BATTLE';s.player.hp=50;s.player.maxHp=50;s.player.pos=2;
  s.enemies=[{id:'boss',type:'ENEMY',name:'校長',hp:25,maxHp:25,pos:3,facing:-1,bossPhase:1,shield:0,strength:0,spriteName:'BOSS|#FFD700',intent:{type:'ATTACK',timer:1,damage:5,range:[1]}}];
  __kocho.setState(s);
 });
 await page.waitForFunction(()=>__enemyCalls.some(e=>e.action==='spawn'));
 await page.evaluate(()=>__kocho.wait());
 await page.waitForFunction(()=>__enemyCalls.some(e=>e.action==='attack'));
 await page.evaluate(()=>__kocho.setState({...__kocho.state,enemies:__kocho.state.enemies.map(e=>({...e,name:'激怒校長',bossPhase:2,hp:30}))}));
 await page.waitForFunction(()=>__enemyCalls.some(e=>e.name==='激怒校長'&&e.action==='spawn'));
 await page.evaluate(()=>__kocho.setState({...__kocho.state,enemies:__kocho.state.enemies.map(e=>({...e,name:'教頭',bossPhase:undefined,intent:{type:'SPECIAL',timer:1,specialName:'LECTURE'}}))}));
 await page.evaluate(()=>__kocho.wait());
 await page.waitForFunction(()=>__enemyCalls.some(e=>e.name==='教頭'&&e.action==='skill'));
 await page.evaluate(()=>__kocho.setState({...__kocho.state,enemies:__kocho.state.enemies.map(e=>({...e,name:'真・校長',bossPhase:3,intent:{type:'SUMMON',timer:1,summonTarget:'教頭'}}))}));
 await page.evaluate(()=>__kocho.wait());
 await page.waitForFunction(()=>__enemyCalls.some(e=>e.name==='真・校長'&&e.action==='skill'));
 const count=await page.evaluate(()=>__enemyCalls.length);
 await page.evaluate(()=>__kocho.setState({...__kocho.state}));
 assert.equal(await page.evaluate(()=>__enemyCalls.length),count,'Rerender repeats an enemy line');
 await page.evaluate(()=>localStorage.clear());await page.goto(base+'?voice=1');await page.waitForFunction(()=>Boolean(window.__kocho));
 const service=await page.evaluate(async()=>{
  const {audioService:a}=await import('/src/services/audioService.ts');a.init();a.setVoiceVolume(.8);
  const original=a.playVoiceFile;const pending=[];const paths=[];
  a.playVoiceFile=(name,urls)=>{paths.push(urls[0]);return new Promise(resolve=>pending.push(resolve));};
  const hero=a.playKochoVoice('original','action-special',3);
  const blocked=await a.playKochoEnemyVoice('校長','damage',.5);
  const afterBlocked=paths.length;a.stopKochoVoices();await hero;
  const enemy=a.playKochoEnemyVoice('校長','attack',2.5);
  const heroDamage=await a.playKochoVoice('original','action-damage',2);
  const afterDamage=paths.length;a.setVoiceVolume(0);const cancelled=await enemy;
  const muted=await a.playKochoEnemyVoice('校長','spawn');
  a.playVoiceFile=original;pending.forEach(r=>r(false));a.setVoiceVolume(.8);
  return {blocked,afterBlocked,heroDamage,afterDamage,cancelled,muted,enemyPath:paths[1]};
 });
 assert.equal(service.afterBlocked,1);assert.equal(service.afterDamage,2);
 for(const key of ['blocked','heroDamage','cancelled','muted'])assert.equal(service[key],false);
 assert.ok(service.enemyPath.includes('/sfx/kocho-enemy-voices/enemy-09/attack.ogg'));
 const reactions=await page.evaluate(async()=>{
  const {audioService:a}=await import('/src/services/audioService.ts');a.setVoiceVolume(.8);
  const original=a.playVoiceFile;const realTimer=window.setTimeout;const pending=[];let flush;let count=0;
  a.playVoiceFile=()=>{count++;return new Promise(resolve=>pending.push(resolve));};
  window.setTimeout=(fn,ms,...rest)=>ms===500?(flush=fn,0):realTimer(fn,ms,...rest);
  const technique=a.playKochoVoice('original','action-special',3);
  await a.playKochoEnemyVoice('不良生徒','damage',.5);
  pending.shift()(true);await technique;
  if(!flush)throw Error('Missing deferred reaction');flush();const afterFlush=count;
  a.stopKochoVoices();pending.splice(0).forEach(r=>r(false));
  const next=a.playKochoVoice('original','action-special',3);
  await a.playKochoEnemyVoice('不良生徒','defeat',.75);pending.shift()(true);await next;
  const stale=flush;a.stopKochoVoices();stale();const afterStop=count;
  flush=undefined;const third=a.playKochoVoice('original','action-special',3);
  await a.playKochoEnemyVoice('不良生徒','damage',.5);
  await a.playKochoVoice('original','action-wait',1);
  pending.shift()(true);await third;
  const discardedByAction=!flush;
  a.stopKochoVoices();a.playVoiceFile=original;window.setTimeout=realTimer;pending.forEach(r=>r(false));
  return {afterFlush,afterStop,discardedByAction};
 });
 assert.deepEqual(reactions,{afterFlush:2,afterStop:3,discardedByAction:true});
 const played=await page.evaluate(async()=>{const {audioService:a}=await import('/src/services/audioService.ts');const played=await a.playKochoEnemyVoice('不良生徒','attack');a.stopKochoVoices();a.setVoiceVolume(0);return played;});
 assert.equal(played,true);
 console.log('Kocho enemy voices: committed spawn/attack/damage/defeat/summon/evolution, no duplicate rerender, shared priority/mute/cancellation and real OGG passed');
}
