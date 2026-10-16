import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const baseline=process.env.ONLINE_SAFE_BASELINE==='1',dir='tmp/online-safe-area',shots=process.env.ONLINE_SAFE_SCREENSHOTS||dir;
await fs.mkdir(dir,{recursive:true});await fs.mkdir(shots,{recursive:true});
const originals=new Map();
if(baseline)for(const file of ['src/mini-games/shared/GameTitleScreen.tsx','src/mini-games/shared/launch.css','src/mini-games/gakuro-kart/kart.css','src/mini-games/gakuro-golf/golf.css'])originals.set(file,execFileSync('git',['show','HEAD:'+file],{encoding:'utf8'}));
await fs.writeFile(`${dir}/entry.tsx`, `import React from 'react';import{createRoot}from'react-dom/client';import'/src/styles.css';import RpgTitle from'/src/rpg/RpgTitle';import RpgOnline from'/src/rpg/RpgOnline';import Kart from'/src/mini-games/gakuro-kart/GakuroKart';import Golf from'/src/mini-games/gakuro-golf/GakuroGolf';import Vr from'/src/mini-games/gakurogear/VrTitle';import Online from'/src/mini-games/gakurogear/OnlineGame';import Bomb from'/src/mini-games/gakurogear/BombGame';import{VrRoom}from'/src/mini-games/gakurogear/network';import{defaultAvatar}from'/src/mini-games/gakuro-kart/avatar';import Mode from'/src/components/ModeSelectionScreen';import{storageService}from'/src/services/storageService';storageService.saveProblemSetView('standard');const query=new URLSearchParams(location.search),kind=query.get('kind');const noop=()=>{};const player={id:'WARRIOR',currentHp:72,maxHp:72,gold:100,deck:[],relics:[],potions:[],imageData:'',hand:[],discardPile:[],drawPile:[],powers:{},relicCounters:{},turnFlags:{},typesPlayedThisTurn:[],currentEnergy:3,maxEnergy:3,block:0,strength:0,echoes:0,nextTurnEnergy:0,nextTurnDraw:0,attacksPlayedThisTurn:0,cardsPlayedThisTurn:0,floatingText:null};const root=createRoot(document.getElementById('root'));window.battle=mode=>{window.room?.close();const room=window.room=new VrRoom(w=>root.render(mode==='bomb'?<Bomb world={w} room={room} en={false} onBack={noop}/>:<Online world={w} room={room} en={false} onBack={noop}/>),console.error);room.createSolo('Player',mode,{title:'Test',questions:Array.from({length:3},(_,i)=>({id:String(i),mode:'ADDITION',question:'1+1',options:['2','3','4','5'],correct:0}))},300,defaultAvatar(),1,1);};window.setup=()=>root.render(<RpgOnline player={player} active languageMode="JAPANESE" onRoom={noop} onSnapshot={noop} onSetup={noop} onClose={noop} initialIntent="online"/>);if(kind==='mode'||kind==='mainmode'){document.documentElement.classList.toggle('rpg-intro-active',kind==='mode');root.render(<div style={{height:'100dvh'}}><Mode languageMode="JAPANESE" onBack={noop} onSelectMode={()=>window.selected=true}/></div>);}else root.render(kind==='rpg'?<RpgTitle languageMode="JAPANESE" onNew={()=>window.setup()} onContinue={noop} onClose={noop}/>:kind==='kart'?<Kart languageMode="JAPANESE" onClose={noop}/>:kind==='golf'?<Golf languageMode="JAPANESE" onClose={noop}/>:<Vr languageMode="JAPANESE" onBack={noop}/>);`);
await fs.writeFile(`${dir}/index.html`,'<html class="app-platform-ios"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><body style="margin:0"><div class="app-shell ios-edge-active"><div id="root" class="app-screen-stage w-full h-full relative overflow-hidden"></div></div><script type="module" src="./entry.tsx"></script></body></html>');
let server,browser;const errors=[],results=[];
try{
 server=await createServer({cacheDir:'node_modules/.vite-online-safe',optimizeDeps:{entries:[`${dir}/index.html`]},server:{host:'127.0.0.1',port:0,hmr:false,watch:null},plugins:[{name:'safe-area-baseline',enforce:'pre',load(id){const key=id.split('/math-rogue-review/')[1];return originals.get(key)||null;}}],logLevel:'error'});await server.listen();
 browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));const cdp=await page.context().newCDPSession(page);
 const base=`http://127.0.0.1:${server.httpServer.address().port}/${dir}/index.html`;
 async function shot({path}){const capture=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});await fs.writeFile(path,Buffer.from(capture.data,'base64'));}
 async function safe(size,insets){await page.setViewportSize(size);await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets});}
 async function top(selector,min){await page.locator(selector).first().waitFor();const box=await page.locator(selector).first().boundingBox();assert(box);results.push({selector,y:box.y,min});if(!baseline)assert(box.y>=min-1,`${selector} y=${box.y} overlaps safe top ${min}`);}
 await safe({width:390,height:844},{top:59,bottom:34,left:0,right:0});
 for(const kind of (process.env.ONLINE_SAFE_PLAY_ONLY==='1'?[]:['rpg','kart','golf','vr'])){
  await page.goto(base+'?kind='+kind,{waitUntil:'domcontentloaded',timeout:120000});await page.locator('.game-launch-menu button').first().waitFor();await top('.game-launch-back',59);
  if(!baseline)for(const button of await page.locator('.game-launch-menu button').all()){const b=await button.boundingBox();assert(b.y>=59&&b.y+b.height<=810,`${kind} title actions outside safe viewport`);}
  await shot({path:`${shots}/${kind}-title-${baseline?'before':'after'}.png`});
  await page.getByRole('button',{name:kind==='rpg'?'オンラインで遊ぶ':'オンラインの部屋を作る',exact:true}).click();
  await top(kind==='rpg'?'.rpg-header':'.online-entry-header',59);
  await shot({path:`${shots}/${kind}-entry-${baseline?'before':'after'}.png`});console.log('Title/entry:',kind);
 }
 for(const kind of (process.env.ONLINE_SAFE_PLAY_ONLY==='1'?[]:['mode','mainmode']))for(const size of [{width:844,height:390},{width:667,height:375},{width:932,height:430}]){
  await safe(size,{top:0,bottom:21,left:44,right:44});await page.goto(base+'?kind='+kind,{waitUntil:'domcontentloaded',timeout:120000});await page.locator('.mode-category-button').first().waitFor();
  const geometry=await page.locator('.mode-category-list').evaluate(el=>({list:el.getBoundingClientRect().toJSON(),buttons:[...el.querySelectorAll('button')].map(b=>b.getBoundingClientRect().toJSON()),overflow:getComputedStyle(el).overflowY}));
  results.push({kind,size,geometry});if(!baseline){
   assert(geometry.list.width>size.width*.75,'RPG categories use full width');
   assert(geometry.buttons.every(b=>b.width>=65&&b.height>=30),'Readable subject button dimensions');
   if(kind==='mode'){await page.getByRole('button',{name:'計算',exact:true}).click();await page.getByRole('button',{name:'この条件で開始',exact:true}).click();assert(await page.evaluate(()=>window.selected),'RPG lesson selection still starts');}
  }
  await shot({path:`${shots}/${kind}-${size.width}-${baseline?'before':'after'}.png`});
 }
 if(!baseline){
  for(const kind of ['kart','golf']){
   await safe({width:390,height:844},{top:59,bottom:34,left:0,right:0});
   await page.goto(base+'?kind='+kind,{waitUntil:'domcontentloaded',timeout:120000});
   await page.getByRole('button',{name:kind==='kart'?'ひとりでレース':'ひとりで練習',exact:true}).click();
   await page.locator('.online-entry-primary').click();
   await page.locator('.online-lesson-picker').waitFor();
   await top('.online-lesson-picker>header',59);
   await page.getByRole('button',{name:'計算',exact:true}).click();
   await page.getByRole('button',{name:'この条件で開始',exact:true}).click();
   await top(kind==='kart'?'.gk-root>.gk-header':'.gg-root>.gg-header',59);
   await shot({path:`${shots}/${kind}-lobby-after.png`});
   await page.getByRole('button',{name:kind==='kart'?/レースを開始/:/ラウンド開始/}).click();
   await page.locator(kind==='kart'?'.gk-root.gk-playing:not(.gk-preparing)':'.gg-root.gg-playing').waitFor();
   await top(kind==='kart'?'.gk-root>.gk-header':'.gg-root>.gg-header',59);
   for(const button of await page.locator(kind==='kart'?'.gk-controls button':'.gg-control-dock button').all()){
    if(!await button.isVisible())continue;
    const box=await button.boundingBox();assert(box.y>=59&&box.y+box.height<=811,`${kind} play control outside the safe viewport`);
   }
   await shot({path:`${shots}/${kind}-play-after.png`});
   await safe({width:844,height:390},{top:0,bottom:21,left:44,right:44});
   const canvas=await page.locator(kind==='kart'?'.gk-race-view>.gk-canvas':'.gg-stage>.gg-canvas').boundingBox();
   assert(canvas&&canvas.x<1&&Math.abs(canvas.width-844)<1,`${kind}: landscape renderer must reach both display edges ${JSON.stringify(canvas)}`);
   for(const button of await page.locator(kind==='kart'?'.gk-controls button':'.gg-control-dock button').all()){
    if(!await button.isVisible())continue;const b=await button.boundingBox();assert(b.x>=44&&b.x+b.width<=800&&b.y>=0&&b.y+b.height<=369,`${kind}: landscape play control outside safe area ${JSON.stringify(b)}`);
   }
   await shot({path:`${shots}/${kind}-landscape-after.png`});
  }
  await safe({width:390,height:844},{top:59,bottom:34,left:0,right:0});await page.goto(base+'?kind=vr',{waitUntil:'domcontentloaded',timeout:120000});
  for(const mode of ['royale','bomb']){await page.evaluate(mode=>window.battle(mode),mode);await page.locator('.gear-field canvas').waitFor();await top('.gear-header button',59);await top('.gear-equipment',59);if(mode==='royale')await top('.gear-viewbar',59);await shot({path:`${shots}/vr-${mode}-play-after.png`});}
  await page.evaluate(()=>window.room.close());
 }
 if(!baseline){
  const before=JSON.parse(await fs.readFile(`${shots}/geometry-before.json`,'utf8').catch(()=>'[]'));
  for(const row of results.filter(r=>r.kind==='mainmode')){
   const original=before.find(r=>r.kind==='mainmode'&&r.size.width===row.size.width);
   if(original){assert(Math.abs(original.geometry.list.width-row.geometry.list.width)<1,'Main game category width unchanged');assert(Math.abs(original.geometry.list.height-row.geometry.list.height)<1,'Main game category height unchanged');}
  }
 }
 assert.deepEqual(errors,[]);await fs.writeFile(`${shots}/geometry-${baseline?'before':'after'}.json`,JSON.stringify(results,null,2));console.log(`PASS online safe area (${baseline?'baseline recorded':'notch insets verified'}): ${process.env.ONLINE_SAFE_PLAY_ONLY==='1'?'live-play subset':'four titles/preparation screens, RPG/main lesson selection at three landscape sizes'}${baseline?'':', kart/golf live play, VR battle and bomb overlays'}; zero page errors.`);
}finally{await browser?.close();await server?.close();}
