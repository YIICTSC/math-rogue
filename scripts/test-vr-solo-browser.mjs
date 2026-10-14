import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
await mkdir('tmp/vr-solo-browser',{recursive:true});const shots=process.env.VR_SOLO_SCREENSHOTS||'tmp/vr-solo-browser';await mkdir(shots,{recursive:true});
await writeFile('tmp/vr-solo-browser/entry.tsx',`import React from'react';import{createRoot}from'react-dom/client';import Title from'/src/mini-games/gakurogear/VrTitle';import{VrRoom}from'/src/mini-games/gakurogear/network';import{storageService}from'/src/services/storageService';import'/src/styles.css';storageService.saveProblemSetView('standard');const create=VrRoom.prototype.createSolo;VrRoom.prototype.createSolo=function(...args){const result=create.apply(this,args);window.soloRoom=this;return result;};createRoot(document.getElementById('root')).render(<Title languageMode="JAPANESE" onBack={()=>{}}/>);`);
await writeFile('tmp/vr-solo-browser/index.html','<html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><div id="root"></div><script type="module" src="./entry.tsx"></script></body></html>');
const vite=await createServer({logLevel:'error',optimizeDeps:{entries:['tmp/vr-solo-browser/index.html']},server:{host:'127.0.0.1',port:0,watch:null,hmr:false}});await vite.listen();const browser=await chromium.launch({...process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{},args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});page.setDefaultTimeout(90000);
 await page.addInitScript(()=>{window.connectionAttempts=0;const native=window.WebSocket;window.WebSocket=class extends native{constructor(url,protocol){if(protocol==='vite-hmr'||protocol==='vite-ping')super(url,protocol);else{window.connectionAttempts++;throw new Error('Solo must not connect');}}};});
 await page.goto(`http://127.0.0.1:${vite.httpServer.address().port}/tmp/vr-solo-browser/index.html`);await page.getByRole('button',{name:'ソロ対戦',exact:true}).waitFor();
 for(const size of [{width:1280,height:800},{width:390,height:844},{width:844,height:390}]){await page.setViewportSize(size);const box=await page.getByRole('button',{name:'ソロ対戦',exact:true}).boundingBox();assert(box&&box.y>=0&&box.y+box.height<=size.height);}
 await page.setViewportSize({width:1280,height:800});
 for(const mode of ['royale','bomb']){
  await page.getByRole('button',{name:'ソロ対戦',exact:true}).click();await page.getByLabel('モード').waitFor();assert.equal(await page.getByLabel('モード').locator('option').count(),2);assert.equal(await page.getByLabel('CPUの人数').inputValue(),'3');
  await page.getByLabel('モード').selectOption(mode);if(mode==='bomb'){await page.getByLabel('爆弾バトルのマップ').selectOption('1');await page.locator('.gear-bomb-preview canvas').waitFor();}
  await page.screenshot({path:`${shots}/${mode}-setup.png`});await page.getByRole('button',{name:'問題を選んでソロ対戦',exact:true}).click();await page.getByRole('button',{name:'この条件で開始',exact:true}).click();
  await page.locator('.gear-canvas canvas').waitFor();await page.waitForFunction(()=>window.soloRoom?.world?.phase==='playing');assert.equal(await page.evaluate(()=>Object.keys(soloRoom.world.players).length),4);assert(await page.locator('.gear-header').textContent().then(t=>t.includes('ソロ対戦')));
  const before=await page.evaluate(()=>({...soloRoom.world.players['solo-cpu-1'].run.player}));await page.waitForTimeout(2200);assert.notDeepEqual(await page.evaluate(()=>({...soloRoom.world.players['solo-cpu-1'].run.player})),before);
  await page.screenshot({path:`${shots}/${mode}-solo.png`});
  for(const size of [{width:1280,height:800},{width:390,height:844},{width:844,height:390}]){
   await page.setViewportSize(size);const stick=await page.locator('.gear-bomb-stick').boundingBox(),actions=await page.locator('.gear-battle-actions').boundingBox();
   assert(stick&&actions&&stick.x<size.width*.3&&actions.x+actions.width>size.width*.85,'Left stick / right actions');
   assert(stick.y+stick.height<=size.height&&actions.y+actions.height<=size.height,'Controls fit viewport');
   assert(actions.x>stick.x+stick.width,'Controls never overlap');
   await page.screenshot({path:`${shots}/${mode}-touch-${size.width}.png`});
  }
  await page.setViewportSize({width:1280,height:800});
  const start=await page.evaluate(()=>({...soloRoom.world.players[soloRoom.selfId].run.player}));
  await page.locator('.gear-bomb-stick').evaluate(el=>{const r=el.getBoundingClientRect();const init={bubbles:true,pointerId:71,pointerType:'touch',clientX:r.left+r.width*.8,clientY:r.top+r.height*.5};el.setPointerCapture=()=>{};el.dispatchEvent(new PointerEvent('pointerdown',init));});
  if(mode==='royale'){
   await page.getByRole('button',{name:'ホールド F',exact:true}).evaluate(el=>{el.setPointerCapture=()=>{};el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:72,pointerType:'touch'}));});
  }
  await page.waitForTimeout(300);
  assert.notDeepEqual(await page.evaluate(()=>({...soloRoom.world.players[soloRoom.selfId].run.player})),start,'Touch stick moves player');
  await page.locator('.gear-bomb-stick').evaluate(el=>el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:71,pointerType:'touch'})));
  if(mode==='royale')await page.getByRole('button',{name:'ホールド F',exact:true}).evaluate(el=>el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:72,pointerType:'touch'})));

  await page.setViewportSize({width:844,height:390});await page.getByRole('button',{name:'一時停止',exact:true}).waitFor();await page.setViewportSize({width:1280,height:800});await page.getByRole('button',{name:'一時停止',exact:true}).click();await page.waitForFunction(()=>soloRoom.world.paused);const pauseTime=await page.evaluate(()=>soloRoom.world.time);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>soloRoom.world.time),pauseTime);await page.locator('.gear-overlay').getByRole('button',{name:'再開',exact:true}).click();await page.waitForFunction(()=>!soloRoom.world.paused);
  if(mode==='bomb'){
   await page.getByRole('button',{name:/^爆弾を設置/}).click();await page.waitForFunction(()=>soloRoom.world.bombArena.bombs.some(b=>b.owner===soloRoom.selfId));
   const stock=await page.evaluate(()=>soloRoom.world.players[soloRoom.selfId].bomb.stock);await page.getByRole('button',{name:/^爆弾を補充/}).click();await page.getByRole('dialog',{name:'爆弾を補充'}).waitFor();
   const correct=await page.evaluate(()=>{const p=soloRoom.world.players[soloRoom.selfId];return soloRoom.world.lesson.questions[p.quizQuestions[0]].correct;});await page.locator('.gear-bomb-answers button').nth(correct).click();await page.waitForFunction(stock=>soloRoom.world.players[soloRoom.selfId].bomb.stock===stock+1,stock);await page.getByRole('button',{name:'閉じる',exact:true}).click();
   await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'全体マップ',exact:true}).click();await page.screenshot({path:`${shots}/bomb-solo-mobile.png`});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.setViewportSize({width:1280,height:800});
  }else{
   await page.getByRole('button',{name:'キャラクタークリエイト',exact:true}).click();await page.getByRole('dialog',{name:'キャラクタークリエイト'}).waitFor();await page.waitForFunction(()=>soloRoom.world.paused);const paused=await page.evaluate(()=>soloRoom.world.time);await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>soloRoom.world.time),paused);await page.getByRole('button',{name:'完了',exact:true}).click();await page.waitForFunction(time=>soloRoom.world.time>time,paused);
   await page.getByRole('button',{name:/^問題で補給/}).click();await page.getByRole('heading',{name:/単元チェック/}).waitFor();for(let i=0;i<3;i++){const correct=await page.evaluate(()=>{const p=soloRoom.world.players[soloRoom.selfId];return soloRoom.world.lesson.questions[p.quizQuestions[p.answers.length]].correct;});await page.locator('.gear-overlay section button').nth(correct).click();await page.waitForTimeout(900);}await page.waitForFunction(()=>!soloRoom.world.players[soloRoom.selfId].quiz);
  }
  // Force the normal simulation's time-limit transition, then exercise the real rematch button.
  await page.evaluate(()=>{soloRoom.world.time=soloRoom.world.limit-.01;});await page.getByRole('button',{name:'同じ部屋で再戦',exact:true}).waitFor();await page.getByRole('button',{name:'同じ部屋で再戦',exact:true}).click();await page.waitForFunction(()=>soloRoom.world.phase==='playing'&&soloRoom.world.round===2);
  await page.getByRole('button',{name:'退室',exact:true}).click();await page.getByRole('button',{name:'ソロ対戦',exact:true}).waitFor();const stopped=await page.evaluate(()=>soloRoom.world.time);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>soloRoom.world.time),stopped);
 }
 assert.equal(await page.evaluate(()=>connectionAttempts),0);assert.deepEqual(errors,[]);console.log('PASS: Actual title/setup/lesson paths, offline CPU matches in both modes, 3 viewport title buttons, movement, human bomb and refill, royale quiz, creator pause, result/rematch, leave cleanup, zero application WebSockets/page errors.');
}finally{await browser.close();await vite.close();}
