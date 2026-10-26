import {createServer} from 'vite';
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const entry=`.star-tide-actions-${process.pid}.tsx`;let server,browser;
try {
 await fs.writeFile(entry,`import React from 'react';import{createRoot}from'react-dom/client';import Game from './src/mini-games/star-tide/StarTide';import{GameMode}from './src/types';createRoot(document.getElementById('root')).render(<Game onBack={()=>{}} problemMode={GameMode.ADDITION} languageMode={location.search.includes('en')?'ENGLISH':undefined}/>);`);
 server=await createServer({logLevel:'error',cacheDir:'node_modules/.vite-star-actions',optimizeDeps:{noDiscovery:true,include:['react','react-dom/client','react/jsx-runtime']},server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{name:'action-fixture',enforce:'pre',transform(code,id){if(id.endsWith('/star-tide/StarTide.tsx'))return code.replace('const w=world.current;','const w=world.current;(window as any).__starWorld=w;');},configureServer(s){s.middlewares.use('/__actions',async(req,res)=>res.end(await s.transformIndexHtml('/__actions',`<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>html,body,#root{height:100%;margin:0}*{box-sizing:border-box}</style><div id="root"></div><script type="module" src="/${entry}"></script>`)));}}]});
 await server.listen();browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:932,height:430},hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__actions`);
 await page.getByRole('button',{name:'航海を続ける'}).click();await page.getByRole('button',{name:'人と記憶をつなぐ',exact:true}).click();
 await page.evaluate(async()=>{const w=window.__starWorld;w.tick=()=>{};Object.assign(w.s,{ownedTools:[0,1,2,3,4,5,6,7],hp:30,maxHp:30});Object.assign(w,{x:10,y:7,map:Array.from({length:14},()=>Array(20).fill(0)),enemies:[],hurt:0,attack:0,stamina:2});await Promise.all(['walk','profile','combo','tools'].map(id=>new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src='/sprites/star-tide/hero-nagi-'+id+'.webp';})));});
 await page.getByRole('button',{name:'冒険手帳',exact:true}).click();
 await page.getByRole('button',{name:'A: 星弓',exact:true}).click();await page.getByRole('button',{name:'B: 岩砕きの槌',exact:true}).click();
 assert.deepEqual(await page.evaluate(()=>[window.__starWorld.s.weaponA,window.__starWorld.s.tool]),[5,4]);
 assert.equal(await page.getByRole('button',{name:'A: 星弓',exact:true}).getAttribute('aria-pressed'),'true');
 await fs.mkdir('tmp/star-tide/actions',{recursive:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'tmp/star-tide/actions/loadout-portrait.png'});
 await page.getByRole('button',{name:'再開',exact:true}).click();
 await page.keyboard.press('z');assert.equal(await page.evaluate(()=>window.__starWorld.activeWeapon),5);assert.equal(await page.evaluate(()=>window.__starWorld.combo),0);
 await page.keyboard.press('z');const serial=await page.evaluate(()=>window.__starWorld.attackSerial);
 await page.evaluate(()=>{const w=window.__starWorld;for(let i=0;i<35;i++)Object.getPrototypeOf(w).tick.call(w,.01,0,0);});assert.equal(await page.evaluate(()=>window.__starWorld.combo),1);assert.equal(await page.evaluate(()=>window.__starWorld.attackSerial),serial+1);
 await page.getByRole('button',{name:'A 装備武器・調べる',exact:true}).tap();
 await page.evaluate(()=>{const w=window.__starWorld;for(let i=0;i<35;i++)Object.getPrototypeOf(w).tick.call(w,.01,0,0);});assert.equal(await page.evaluate(()=>window.__starWorld.combo),2);
 await page.screenshot({path:'tmp/star-tide/actions/bow-combo-portrait.png'});
 await page.getByRole('button',{name:'冒険手帳',exact:true}).click();assert.equal(await page.evaluate(()=>window.__starWorld.queuedSlot),null);await page.getByRole('button',{name:'再開',exact:true}).click();
 await page.evaluate(()=>{const w=window.__starWorld;w.attack=0;w.cancelCombo();w.strikePending=false;});await page.getByRole('button',{name:'B 装備武器',exact:true}).tap();assert.equal(await page.evaluate(()=>window.__starWorld.activeWeapon),4);
 await page.evaluate(()=>{const w=window.__starWorld;for(let i=0;i<18;i++)Object.getPrototypeOf(w).tick.call(w,.01,0,0);});await page.screenshot({path:'tmp/star-tide/actions/hammer-portrait.png'});
 // Freeze exact simulation poses and capture every profile in-between at game scale.
 await page.setViewportSize({width:932,height:430});
 for(const direction of [-1,1])for(let frame=0;frame<8;frame++){
  await page.evaluate(({direction,frame})=>Object.assign(window.__starWorld,{attack:0,gliding:false,hurt:0,dash:0,dx:direction,dy:0,moving:true,walk:(frame+.1)/14}),{direction,frame});await page.waitForTimeout(30);await page.locator('canvas').screenshot({path:`tmp/star-tide/actions/walk-${direction}-${frame}.png`});
 }
 for(const weapon of [0,4,5,6,7])for(let stage=0;stage<3;stage++){
  await page.evaluate(({weapon,stage})=>{const w=window.__starWorld;Object.assign(w,{moving:false,dx:1,dy:0,combo:stage,activeWeapon:weapon,attackDuration:.4,attack:.22,hurt:0});},{weapon,stage});await page.waitForTimeout(30);await page.locator('canvas').screenshot({path:`tmp/star-tide/actions/weapon-${weapon}-${stage}.png`});
 }
 await page.getByRole('button',{name:'冒険手帳',exact:true}).click();const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('learning-rogue:star-tide:v1')));assert.equal(saved.weaponA,5);assert.equal(saved.tool,4);assert.equal(saved.hero,'nagi');await page.reload();assert.equal(await page.getByRole('group',{name:'操作する仲間'}).count(),0);assert.deepEqual(await page.evaluate(()=>[window.__starWorld.s.weaponA,window.__starWorld.s.tool]),[5,4]);
 const english=await browser.newPage({viewport:{width:390,height:844}});english.on('pageerror',e=>errors.push(e.message));await english.goto(`http://127.0.0.1:${server.httpServer.address().port}/__actions?en`);await english.getByRole('button',{name:'Continue voyage'}).click();await english.getByRole('button',{name:'Connect people and memories',exact:true}).click();await english.evaluate(()=>{window.__starWorld.s.ownedTools=[0,1,2,3,4,5,6,7];});await english.getByRole('button',{name:'Journal',exact:true}).click();await english.getByRole('button',{name:'A: Stone hammer',exact:true}).click();await english.getByRole('button',{name:'B: Tide boomerang',exact:true}).click();await english.getByRole('button',{name:'Resume',exact:true}).first().click();assert.deepEqual(await english.locator('.st-buttons button small').allTextContents(),['Ring','Hammer']);assert(await english.locator('.st-buttons button small').evaluateAll(nodes=>nodes.every(n=>n.scrollWidth<=n.clientWidth+1)),'English weapon labels must fit inside the face buttons');await english.screenshot({path:'tmp/star-tide/actions/english-controls.png'});await english.close();
 assert.deepEqual(errors,[]);console.log('PASS: journal equips/persists A and B independently, keyboard and touch buffer a real three-stage bow combo, B uses hammer, journal clears queued input, all 16 profile frames and 15 weapon/combo poses render; zero browser exceptions.');
} finally {await browser?.close();await server?.close();await fs.rm(entry,{force:true});}
