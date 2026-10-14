import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {chromium} from 'playwright';
await mkdir('tmp/vr-view-browser',{recursive:true});
const shots=process.env.VR_VIEW_SCREENSHOTS||'tmp/vr-view-browser';await mkdir(shots,{recursive:true});
await writeFile('tmp/vr-view-browser/index.html','<html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><div id="root"></div><script type="module" src="./entry.tsx"></script></body></html>');
await writeFile('tmp/vr-view-browser/entry.tsx',`import React from 'react';import{createRoot}from'react-dom/client';import{flushSync}from'react-dom';import Online from '/src/mini-games/gakurogear/OnlineGame';import Bomb from '/src/mini-games/gakurogear/BombGame';import{createWorld,addPlayer,startWorld}from'/src/mini-games/gakurogear/onlineEngine';import{defaultAvatar}from'/src/mini-games/gakuro-kart/avatar';import '/src/mini-games/gakurogear/gakurogear.css';const root=createRoot(document.getElementById('root'));let serial=0;window.captureState=(mode,count,spectator=false,en=false)=>{const w=createWorld(mode,1,{title:'Test',questions:[{id:'1',mode:'ADDITION',question:'1+1',options:['2','3'],correct:0}]});for(let i=0;i<count;i++){addPlayer(w,'p'+i,'Player '+(i+1));w.players['p'+i].avatar={...defaultAvatar(),outfit:i%8};}if(spectator)w.players.p0.spectator=true;startWorld(w,20261014);for(const p of Object.values(w.players))p.invulnerable=0;window.world=w;const room={selfId:'p0',host:spectator,input(){},answer(){},completeQuiz(){},retry(){},supply(){},rematch(){},setSpectator(){}};flushSync(()=>root.render(mode==='bomb'?<Bomb key={++serial} world={w} room={room} en={en} onBack={()=>{}}/>:<Online key={++serial} world={w} room={room} en={en} onBack={()=>{}}/>));};window.captureState('coop',2);`);
const vite=await createServer({configFile:false,plugins:[react()],css:{postcss:{plugins:[]}},define:{__APP_ASSET_VERSION__:JSON.stringify('vr-view-test')},server:{host:'127.0.0.1',port:0,watch:null,hmr:false},logLevel:'error'});await vite.listen();
const browser=await chromium.launch({...process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{},args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(60000);
try{
 await page.goto(`http://127.0.0.1:${vite.httpServer.address().port}/tmp/vr-view-browser/index.html`);await page.waitForFunction(()=>window.captureState);
 let cases=0;
 for(const mode of ['coop','royale','bomb'])for(const count of [2,10,20,40])for(const size of [{width:1280,height:800},{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(size);await page.evaluate(({mode,count})=>window.captureState(mode,count),{mode,count});
  await page.waitForFunction(()=>document.querySelector('.gear-canvas')?.dataset.focusVisible==='true');
  await page.locator('.gear-map-marker.is-self:not([hidden])').waitFor();assert.equal(await page.locator('.gear-mission-hud details').evaluate(e=>e.open),false);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(count===40)await page.screenshot({path:`${shots}/${mode}-40-follow-${size.width}.png`});
  await page.getByRole('button',{name:'全体マップ',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.gear-canvas')?.dataset.overview==='true');
  assert.equal(await page.locator('.gear-map-marker:not([hidden])').count(),count);
  if(count===40)await page.screenshot({path:`${shots}/${mode}-40-overview-${size.width}.png`});
  if(mode!=='bomb'){await page.getByRole('button',{name:'レーダーを拡大',exact:true}).click();await page.getByRole('img',{name:'全体レーダー'}).waitFor();}
  await page.getByText('操作とヒント',{exact:true}).click();await page.getByRole('button',{name:'ヒントを閉じる',exact:true}).click();assert.equal(await page.locator('.gear-mission-hud details').evaluate(e=>e.open),false);cases++;
 }
 await page.setViewportSize({width:1280,height:800});await page.evaluate(()=>window.captureState('coop',40));await page.getByRole('button',{name:'三人称',exact:true}).click();await page.waitForTimeout(500);await page.screenshot({path:`${shots}/coop-40-third.png`});
 await page.mouse.move(600,350);await page.mouse.down();await page.mouse.move(824,350,{steps:12});await page.mouse.up();await page.waitForTimeout(800);assert((await page.locator('.gear-canvas').getAttribute('data-player-opacity'))<.65);await page.screenshot({path:`${shots}/coop-40-third-wall.png`});
 for(const mode of ['coop','royale']){await page.evaluate(mode=>window.captureState(mode,40),mode);await page.getByRole('button',{name:'一人称',exact:true}).click();await page.waitForTimeout(300);await page.screenshot({path:`${shots}/${mode}-40-first.png`});}
 await page.evaluate(()=>window.captureState('coop',40,true));await page.locator('.gear-map-marker.is-self:not([hidden])').waitFor();const canvas=await page.locator('.gear-canvas canvas').elementHandle();
 await page.getByRole('button',{name:'対象を固定',exact:true}).click();const target=await page.locator('.gear-canvas').getAttribute('data-target');await page.waitForTimeout(8500);assert.equal(await page.locator('.gear-canvas').getAttribute('data-target'),target);
 await page.getByRole('button',{name:'次のプレイヤー',exact:true}).click();await page.waitForFunction(target=>document.querySelector('.gear-canvas')?.dataset.target!==target,target);assert(await canvas.evaluate(e=>e.isConnected));await page.waitForFunction(()=>document.querySelector('.gear-canvas')?.dataset.focusVisible==='true');
 await page.getByRole('button',{name:'三人称',exact:true}).click();const thirdTarget=await page.locator('.gear-canvas').getAttribute('data-target');await page.getByRole('button',{name:'次のプレイヤー',exact:true}).click();await page.waitForFunction(target=>document.querySelector('.gear-canvas')?.dataset.target!==target,thirdTarget);assert(await canvas.evaluate(e=>e.isConnected));await page.getByRole('button',{name:'俯瞰',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.gear-canvas')?.dataset.focusVisible==='true');await page.getByRole('button',{name:'自動切替を再開',exact:true}).click();await page.screenshot({path:`${shots}/coop-40-spectator.png`});
 for(const mode of ['coop','bomb']){await page.evaluate(mode=>window.captureState(mode,40,false,true),mode);await page.getByRole('button',{name:'Overview',exact:true}).waitFor();await page.waitForTimeout(300);assert(!/[ぁ-んァ-ヶ一-龠]/.test(await page.locator('.gear-mission-hud').textContent()));}
 assert.deepEqual(errors,[]);console.log(`PASS: ${cases} population/viewport cases; full-map seat labels; follow/frustum; radar; tips; wall fade; fixed/manual spectator; canvas preserved; English HUD; no page errors.`);
}finally{await browser.close();await vite.close();}
