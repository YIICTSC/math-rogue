import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {mkdir} from 'node:fs/promises';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {chromium} from 'playwright';
import sharp from 'sharp';

const refresh=process.argv.includes('--refresh'),assets='public/sprites/gakurogear/tutorials',proof='tmp/vr-action-tutorials';
await mkdir(assets,{recursive:true});await mkdir(proof,{recursive:true});
const vite=await createServer({configFile:false,plugins:[react()],css:{postcss:{plugins:[]}},define:{__APP_ASSET_VERSION__:JSON.stringify('vr-tutorial-test'),'import.meta.env.VITE_LARGE_ASSET_BASE_URL':JSON.stringify('/')},server:{host:'127.0.0.1',port:0,watch:null,hmr:false},logLevel:'error'});
await vite.listen();
const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
let browser;
try{
 browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:existsSync(chrome)?{executablePath:chrome}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(60000);
 await page.goto(`http://127.0.0.1:${vite.httpServer.address().port}/scripts/fixtures/vr-action-tutorials.html`);
 await page.waitForFunction(()=>window.tutorialActions);
 const actions=await page.evaluate(()=>window.tutorialActions);
 if(refresh)for(const action of actions){
  const state=await page.evaluate(action=>window.captureTutorialAction(action),action);
  if(action==='hold')assert(state.holdProgress>0&&!state.crouch);
  if(['crouch','sensor'].includes(action))assert(state.crouch);
  if(action==='collect')assert(state.interact>0);
  if(action==='switch')assert(state.switchProgress>0);
  if(action==='defend')assert(state.defended>0);
  if(action==='decoy')assert(state.noise);
  if(action==='shoot')assert(state.bubble);
  await page.waitForTimeout(600);
  const buffer=await page.locator('#capture').screenshot();
  await sharp(buffer).webp({quality:86}).toFile(`${assets}/${action}.webp`);
  console.log(`Captured ${action}: 960×540`);
 }
 // File watching is disabled in this harness; rescan newly captured public assets.
 if(refresh){await vite.restart();await page.goto(`http://127.0.0.1:${vite.httpServer.address().port}/scripts/fixtures/vr-action-tutorials.html`);await page.waitForFunction(()=>window.tutorialActions);}
 for(const size of [{width:1280,height:800},{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(size);
  for(const en of [false,true])for(const action of actions){
   await page.evaluate(({action,en})=>window.showTutorial(action,en),{action,en});
   const dialog=page.getByRole('dialog');await dialog.waitFor();
   await page.waitForFunction(()=>{const i=document.querySelector('.gear-tutorial-figure img');return i?.complete&&i.naturalWidth===960;},null,{timeout:20000});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'No horizontal page overflow');
   const image=await dialog.locator('img').boundingBox();assert(image&&image.width>200&&image.x>=0&&image.x+image.width<=size.width);
   const button=dialog.getByRole('button');await button.scrollIntoViewIfNeeded();const box=await button.boundingBox();assert(box&&box.y>=0&&box.y+box.height<=size.height,'Continue button is reachable');
   if(!en&&['hold','crouch','collect'].includes(action))await page.screenshot({path:`${proof}/${action}-${size.width}.png`});
   if(en)assert(!/[ぁ-んァ-ヶ一-龠]/.test(await dialog.innerText()),'English guide has no Japanese text');
   await button.click();await dialog.waitFor({state:'detached'});
  }
  console.log(`PASS screenshot guides at ${size.width}×${size.height}`);
 }
 await page.setViewportSize({width:1280,height:800});await page.evaluate(()=>window.showGame());
 await page.locator('.gear-mission').nth(6).click();
 await page.getByRole('button',{name:/^訓練開始/}).click();
 await page.getByRole('dialog').waitFor();assert(await page.locator('.gear-tutorial-figure img').isVisible());
 const frozen=await page.locator('.gear-hud').innerText();await page.waitForTimeout(300);assert.equal(await page.locator('.gear-hud').innerText(),frozen,'Tutorial pauses mission');
 for(let i=0;i<8&&await page.getByRole('dialog').count();i++){
  if(await page.getByRole('heading',{name:'おやすみホールド',exact:true}).count())await page.screenshot({path:`${proof}/in-game-hold-1280.png`});
  await page.getByRole('button',{name:'わかった・続ける',exact:true}).click();
 }
 assert.equal(await page.getByRole('dialog').count(),0);
 await page.getByRole('button',{name:'操作ガイド',exact:true}).click();await page.getByRole('dialog').waitFor();
 assert.deepEqual(errors,[]);
 console.log('PASS 8 screenshot guides × Japanese/English × desktop/portrait/landscape; image loading, continue, mission pause and guide reopening.');
}finally{await browser?.close();await vite.close();}
