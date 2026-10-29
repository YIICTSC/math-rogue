import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const dir='tmp/vr-royale-browser';await mkdir(dir,{recursive:true});
await writeFile(`${dir}/entry.tsx`,`import React from 'react';import{createRoot}from'react-dom/client';import Game from'/src/mini-games/gakurogear/OnlineGame';import{createWorld,addPlayer,startWorld,tickWorld}from'/src/mini-games/gakurogear/onlineEngine';import{clearVrPulses,vrCommand}from'/src/mini-games/gakurogear/roomCommands';import{defaultAvatar}from'/src/mini-games/gakuro-kart/avatar';import'/src/styles.css';import'/src/mini-games/gakurogear/gakurogear.css';
window.world=createWorld('royale',1,{title:'Test',questions:[{id:'1',mode:'ADDITION',question:'1+1',options:['2','3','4','5'],correct:0}]},300);for(const id of ['self','guest','third']){addPlayer(world,id,id);world.players[id].avatar={...defaultAvatar(),protagonist:id==='self'?'high-school-warrior':undefined};}startWorld(world,42);window.controls={};window.room={selfId:'self',host:true,solo:true,input(v){vrCommand(world,'self',{type:'input',input:v},controls,{})},pauseSolo(value){world.paused=value},supply(){},answer(){},completeQuiz(){},rematch(){}};world.players.self.run.player={x:0,z:0,angle:0};world.players.guest.run.player={x:4,z:6,angle:3.14};world.players.third.run.player={x:-8,z:9,angle:3.14};window.setupCombat=()=>{world.paused=false;world.mission.obstacles=[];world.supplies=[];world.royale.covers=[];for(const p of Object.values(world.players)){p.hits=0;p.out=false;p.invulnerable=0;}world.players.self.run.player={x:0,z:0,angle:0};world.players.self.run.ammo=12;world.players.self.battle.materials=2;world.players.guest.run.player={x:0,z:3,angle:3.14};};const root=createRoot(document.getElementById('root'));window.render=()=>root.render(<Game room={room} world={{...world}} en={new URLSearchParams(location.search).has('en')} onBack={()=>{}}/>);setInterval(()=>{if(!window.freezeSimulation)tickWorld(world,controls,.05);clearVrPulses(controls);render();},50);render();`);
await writeFile(`${dir}/index.html`,'<html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><div id="root"></div><script type="module" src="./entry.tsx"></script></body></html>');
const vite=await createServer({cacheDir:`${dir}/.vite`,logLevel:'error',optimizeDeps:{entries:[`${dir}/index.html`]},server:{host:'127.0.0.1',port:0,watch:null,hmr:false}});await vite.listen();
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(45000);
 await page.goto(`http://127.0.0.1:${vite.httpServer.address().port}/${dir}/index.html`);await page.locator('.gear-canvas canvas').waitFor();await page.waitForTimeout(2000);
 assert.equal(await page.locator('.gear-canvas').getAttribute('data-view'),'third');await page.evaluate(()=>window.freezeSimulation=true);
 for(const size of [{width:1440,height:900},{width:390,height:844},{width:844,height:390},{width:667,height:375},{width:320,height:568}]){
  await page.setViewportSize(size);await page.waitForTimeout(200);
  await page.screenshot({path:`${dir}/royale-${size.width}.png`});
  const bounds=await page.locator('.gear-battle-actions button,.gear-royale-loadout,.gear-bomb-stick,.gear-royale-status,.gear-radar-panel').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,name:e.getAttribute('aria-label')||e.textContent}}));
  for(const b of bounds)assert(b.x>=0&&b.y>=0&&b.x+b.w<=size.width+1&&b.y+b.h<=size.height+1,`Outside ${size.width}: ${JSON.stringify(b)}`);
  const slots=bounds.find(b=>b.name==='装備スロット'),buttons=bounds.filter(b=>b.name!=='装備スロット');
  for(const b of buttons)assert(!(b.x<slots.x+slots.w&&b.x+b.w>slots.x&&b.y<slots.y+slots.h&&b.y+b.h>slots.y),`Loadout overlaps ${size.width}: ${JSON.stringify({slots,b})}`);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:`${dir}/royale-${size.width}.png`});
 }
 await page.setViewportSize({width:1440,height:900});await page.evaluate(()=>{window.freezeSimulation=false;setupCombat();});
 await page.keyboard.down('KeyR');await page.waitForFunction(()=>world.players.guest.hits>=1);await page.keyboard.up('KeyR');const ammo=await page.evaluate(()=>world.players.self.run.ammo);await page.waitForTimeout(900);assert.equal(await page.evaluate(()=>world.players.self.run.ammo),ammo,'Release stops firing');
 await page.evaluate(()=>{setupCombat();world.players.guest.run.player={x:8,z:8,angle:0};});await page.keyboard.down('KeyW');await page.keyboard.down('ShiftLeft');await page.waitForTimeout(450);await page.keyboard.up('ShiftLeft');await page.keyboard.up('KeyW');assert(await page.evaluate(()=>world.players.self.battle.stamina<100),'Sprint consumes stamina');
 await page.evaluate(()=>{setupCombat();world.time=0;world.phase='playing';});await page.getByRole('button',{name:'カバー設置',exact:true}).click();await page.waitForFunction(()=>world.royale.covers.length===1);assert.equal(await page.evaluate(()=>world.players.self.battle.materials),1);
 await page.screenshot({path:`${dir}/cover.png`});
 await page.getByRole('button',{name:'一人称',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.gear-canvas').dataset.view==='first');await page.getByRole('button',{name:'俯瞰',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.gear-canvas').dataset.view==='overhead');
 await page.getByRole('button',{name:'全体マップ',exact:true}).click();await page.screenshot({path:`${dir}/overview.png`});
 await page.goto(`http://127.0.0.1:${vite.httpServer.address().port}/${dir}/index.html?en`);await page.getByRole('button',{name:'Build cover',exact:true}).waitFor();assert(!/[ぁ-んァ-ヶ一-龯]/.test(await page.locator('.gear-royale-status,.gear-royale-loadout,.gear-royale-vitals,.gear-battle-actions').allTextContents().then(t=>t.join(''))));
 assert.deepEqual(errors,[]);console.log('PASS royale: three-person scene, 5 viewport controls/loadout bounds, no overlap, held fire release, sprint, cover, cameras, English UI, no page errors.');
}finally{await browser.close();await vite.close();}
