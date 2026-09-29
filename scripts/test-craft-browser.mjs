import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {PeerServer} from 'peer';
import {chromium} from 'playwright';
const root=path.resolve('tmp/craft-qa');await fs.mkdir(root,{recursive:true});
await fs.writeFile(path.join(root,'index.html'),'<html><head><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="margin:0"><div id="root"></div><script type="module" src="./fixture.tsx"></script></body></html>');
await fs.writeFile(path.join(root,'fixture.tsx'),`import '/src/styles.css';import React from 'react';import{createRoot}from'react-dom/client';import GakuroCraft from '/src/mini-games/gakuro-craft/GakuroCraft.tsx';import{CraftRoom,loadIsland}from'/src/mini-games/gakuro-craft/network.ts';window.CraftRoom=CraftRoom;window.loadIsland=loadIsland;const practice=CraftRoom.prototype.practice;CraftRoom.prototype.practice=function(...a){window.room=this;return practice.apply(this,a)};const create=CraftRoom.prototype.create;CraftRoom.prototype.create=function(...a){window.room=this;return create.apply(this,a)};const params=new URLSearchParams(location.search);if(!params.has('network'))createRoot(document.getElementById('root')).render(<GakuroCraft allowHost={!params.has('guest')} inviteCode={params.get('guest')||''} languageMode={params.has('english')?'ENGLISH':'JAPANESE'} onClose={()=>{window.exited=true}}/>);`);
let signal;
const signaling=PeerServer({port:9021,path:'/craft',host:'127.0.0.1'},s=>signal=s);
const server=await createServer({configFile:false,cacheDir:'node_modules/.vite-craft-qa',optimizeDeps:{entries:['tmp/craft-qa/index.html']},plugins:[react()],logLevel:'error',define:{'import.meta.env.VITE_RPG_PEER_HOST':'"127.0.0.1"','import.meta.env.VITE_RPG_PEER_PORT':'"9021"','import.meta.env.VITE_RPG_PEER_PATH':'"/craft"','import.meta.env.VITE_RPG_PEER_SECURE':'"false"','import.meta.env.VITE_CRAFT_ICE_SERVERS':JSON.stringify('[]')},server:{host:'127.0.0.1',port:5273,strictPort:true}});await server.listen();
const browser=await chromium.launch({headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const url='http://127.0.0.1:5273/tmp/craft-qa/index.html',errors=[];
try{
  if(!process.argv.includes('--main-only')){
  const page=await browser.newPage({viewport:{width:1280,height:900}});page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});await page.getByRole('button',{name:'ひとりで遊ぶ',exact:true}).click();
  const subject=page.getByRole('button',{name:'算数・数学',exact:true}),before=await subject.evaluate(b=>getComputedStyle(b).backgroundColor);await subject.click();await page.waitForTimeout(200);assert.notEqual(await subject.evaluate(b=>getComputedStyle(b).backgroundColor),before);
  const unit=page.getByRole('button',{name:/かずとすうじ/}),unitBefore=await unit.evaluate(b=>getComputedStyle(b).backgroundColor);await unit.click();await page.waitForTimeout(200);assert.notEqual(await unit.evaluate(b=>getComputedStyle(b).backgroundColor),unitBefore);
  assert.equal(await page.getByRole('button',{name:'入力',exact:true}).count(),0);
  await page.getByRole('button',{name:'この条件で開始',exact:true}).click();await page.getByRole('button',{name:'島に戻る',exact:true}).click();await page.waitForFunction(()=>window.room?.world?.players.local);
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(500);await page.keyboard.up('ArrowRight');
  assert(await page.evaluate(()=>window.room.world.players.local.x>18.5&&window.room.world.players.local.z<18.5),'Right input moves screen-right');
  await page.evaluate(()=>{window.room.world.players.local.energy=0});await page.waitForTimeout(200);
  await page.getByRole('button',{name:/問題で回復/}).click();await page.getByRole('dialog',{name:'問題で回復'}).waitFor();
  let correct=await page.evaluate(()=>window.room.bank.pending.get('local').q.correct);await page.locator('.gc-options button').nth(correct).click();await page.locator('.gc-feedback.good').waitFor();
  assert.equal(await page.evaluate(()=>window.room.world.players.local.energy),30);await page.getByRole('button',{name:'島に戻る',exact:true}).click();
  await page.screenshot({path:path.join(root,'island-desktop.png')});
  for(const[label,width,height]of[['phone',390,844],['tablet',820,1180],['landscape',844,390]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(300);assert(await page.evaluate(()=>document.querySelector('.gc-root').scrollWidth<=innerWidth+1));
    for(const selector of ['.gc-study','.gc-pad','.gc-toolbar']){const box=await page.locator(selector).boundingBox();assert(box&&box.y>=0&&box.y+box.height<=height+1,`${label} ${selector} fits`);}
    assert(await page.evaluate(()=>[...document.querySelectorAll('.gc-pad button,.gc-tools button,.gc-study')].every(b=>{const r=b.getBoundingClientRect();return b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})),`${label} all movement/tools/recharge controls are unobscured`);
    await page.screenshot({path:path.join(root,`island-${label}.png`)});
  }
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:/持ち物とクラフト/}).click();await page.getByRole('dialog').waitFor();await page.screenshot({path:path.join(root,'inventory-phone.png')});await page.getByRole('button',{name:'閉じる',exact:true}).click();
  await page.evaluate(()=>window.room.save());assert(await page.evaluate(()=>window.loadIsland()?.world.tiles.length===1600));
  await page.close();
  const touch=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});touch.setDefaultTimeout(60000);touch.on('pageerror',e=>errors.push(e.message));await touch.goto(url);await touch.getByRole('button',{name:'ひとりで遊ぶ',exact:true}).tap();await touch.getByRole('button',{name:'この条件で開始',exact:true}).tap();await touch.getByRole('button',{name:'島に戻る',exact:true}).tap();
  await touch.evaluate(()=>{const w=window.room.world,p=w.players.local;p.x=16.5;p.z=20.5;Object.assign(w.tiles[816],{nature:null,blocks:[],crop:null,ground:'grass'});});await touch.waitForTimeout(600);
  await touch.touchscreen.tap(195,403);await touch.getByRole('button',{name:'🌱 種まき',exact:true}).tap();await touch.getByRole('button',{name:'選んだ場所で作業',exact:true}).tap();await touch.waitForFunction(()=>window.room.world.tiles[816].crop!==null);
  const cd=await touch.context().newCDPSession(touch),right=await touch.getByRole('button',{name:'右',exact:true}).boundingBox();await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:right.x+right.width/2,y:right.y+right.height/2}]});await touch.waitForTimeout(350);await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert(await touch.evaluate(()=>window.room.world.players.local.x>16.5&&window.room.world.players.local.z<20.5),'Held touch moves screen-right');await cd.detach();await touch.close();console.log('PASS touch: tile picking, planting, held directional input');
  const guest=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});guest.on('pageerror',e=>errors.push(e.message));guest.setDefaultTimeout(60000);await guest.goto(url+'?guest=ABC234');await guest.getByRole('button',{name:'島に参加',exact:true}).waitFor();assert.equal(await guest.getByRole('button',{name:'みんなの島を開く',exact:true}).count(),0);assert.equal(await guest.getByRole('button',{name:'ひとりで遊ぶ',exact:true}).count(),0);await guest.screenshot({path:path.join(root,'invite-phone.png')});await guest.close();
  const english=await browser.newPage();english.on('pageerror',e=>errors.push(e.message));await english.goto(url+'?english');await english.getByRole('button',{name:'Play solo',exact:true}).waitFor();assert(!/[\u3040-\u30ff\u4e00-\u9fff]/.test(await english.locator('.gc-lobby').innerText()));await english.close();
  console.log('PASS craft responsive UI: question selection highlighting, four choices, movement, zero-energy recovery, save, debug-free invite lobby, English lobby');
  const net=await browser.newPage();net.on('pageerror',e=>errors.push(e.message));await net.goto(url+'?network');await net.waitForFunction(()=>window.CraftRoom);
  await net.evaluate(async()=>{
    const q={id:'q',mode:'ADDITION',question:'2 + 2',options:['1','2','3','4'],correct:3};window.events=[];window.guests=[];window.host=new window.CraftRoom(()=>{},()=>{},s=>window.events.push(s));await window.host.create('Host',0,[q],'QA');
    for(let batch=0;batch<39;batch+=5)await Promise.all(Array.from({length:Math.min(5,39-batch)},async(_,k)=>{const n=batch+k,r=new window.CraftRoom(()=>{},reply=>{r.lastReply=reply},s=>window.events.push(s));window.guests.push(r);await r.join(window.host.code,'Guest '+n,n%6);}));
  });
  await net.waitForFunction(()=>Object.keys(window.host.world.players).length===40&&window.guests.every(g=>Object.keys(g.world?.players||{}).length===40),null,{timeout:60000});
  const overflow=await net.evaluate(async()=>{const r=new window.CraftRoom(()=>{},()=>{},()=>{});try{await r.join(window.host.code,'Overflow',0);return false}catch{return true}finally{r.close()}});assert(overflow,'41st participant is rejected');
  await net.evaluate(()=>{const r=window.guests[0],p=window.host.world.players[r.selfId];p.energy=0;r.sendCommand({type:'quiz'});});await net.waitForFunction(()=>window.guests[0].lastReply?.type==='quiz');
  assert(await net.evaluate(()=>!('correct' in window.guests[0].lastReply.question)));
  await net.evaluate(()=>{const r=window.guests[0];r.sendCommand({type:'answer',token:r.lastReply.token,option:3});});
  await net.waitForFunction(()=>window.guests[0].world.players[window.guests[0].selfId].energy===30);
  await net.evaluate(()=>{const r=window.guests[0],p=window.host.world.players[r.selfId];p.x=16.5;p.z=20.5;Object.assign(window.host.world.tiles[816],{nature:null,blocks:[],crop:null,ground:'grass'});r.sendCommand({type:'act',tool:'plant',tile:816});});
  await net.waitForFunction(()=>window.guests.every(g=>g.world.tiles[816].crop!==null));
  await net.evaluate(()=>{for(const g of window.guests)g.sendCommand({type:'move',dx:.4,dz:-.4});});await net.waitForTimeout(400);
  assert(await net.evaluate(()=>window.guests.every(g=>g.world.players[g.selfId]&&Object.keys(g.world.players).length===40)));
  await net.evaluate(()=>{window.guests[0].close()});await net.waitForFunction(()=>Object.keys(window.host.world.players).length===39);
  await net.evaluate(()=>window.host.close());await net.waitForFunction(()=>window.guests.slice(1).every(g=>g.world===null));
  await net.close();assert.deepEqual(errors,[]);console.log('PASS craft real WebRTC: 40 simultaneous peers, reject 41, host-graded quiz, energy and tile synchronization, movement, disconnect cleanup');
  }
  const main=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});main.setDefaultTimeout(90000);await main.goto('http://127.0.0.1:5273/?craftRoom=ABC234',{waitUntil:'domcontentloaded',timeout:120000});await main.locator('.gc-lobby').waitFor();if(await main.getByRole('button',{name:'小学1年生',exact:true}).isVisible())await main.getByRole('button',{name:'小学1年生',exact:true}).tap();assert.equal(await main.getByRole('button',{name:'みんなの島を開く',exact:true}).count(),0);await main.screenshot({path:path.join(root,'main-invite-phone.png')});await main.getByRole('button',{name:'タイトルへ戻る',exact:true}).tap();await main.waitForFunction(()=>!document.querySelector('.gc-root'));assert.equal(await main.getByRole('button',{name:'学ロクラフト',exact:true}).count(),0);await main.close();console.log('PASS main application: invite route without debug; normal title hides Craft');
}finally{await browser.close();await server.close();signal?.close();signaling.emit('close');}
// PeerServer 1.x retains maintenance timers after closing its HTTP server.
process.exit(0);
