import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {chromium} from 'playwright';
await mkdir('tmp/vr-actions-browser',{recursive:true});
const shots=process.env.VR_VIEW_SCREENSHOTS||'tmp/vr-actions-browser';await mkdir(shots,{recursive:true});
await writeFile('tmp/vr-actions-browser/index.html','<html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><div id="root"></div><script type="module" src="./entry.tsx"></script></body></html>');
await writeFile('tmp/vr-actions-browser/entry.tsx',`import React from 'react';import{createRoot}from'react-dom/client';import{flushSync}from'react-dom';import {VrRoom} from '/src/mini-games/gakurogear/network';import Stealth from '/src/mini-games/gakurogear/GakuroGear';import Online from '/src/mini-games/gakurogear/OnlineGame';import Bomb from '/src/mini-games/gakurogear/BombGame';import{createWorld,addPlayer,startWorld}from'/src/mini-games/gakurogear/onlineEngine';import{defaultAvatar}from'/src/mini-games/gakuro-kart/avatar';import '/src/mini-games/gakurogear/gakurogear.css';const root=createRoot(document.getElementById('root'));let serial=0;window.startRealBattle=mode=>{window.realRoom?.close();const room=window.realRoom=new VrRoom(w=>{window.realWorld=w;root.render(mode==='bomb'?<Bomb world={w} room={room} en={false} onBack={()=>{}}/>:<Online world={w} room={room} en={false} onBack={()=>{}}/>);},console.error);room.createSolo('Player',mode,{title:'Test',questions:[0,1,2].map(i=>({id:String(i),mode:'ADDITION',question:'1+1',options:['2','1','3','4'],correct:0}))},300,defaultAvatar(),1,3);};window.showStealth=()=>root.render(<Stealth languageMode="JAPANESE" onBack={()=>{}}/>);window.captureState=(mode,count,spectator=false,en=false)=>{const w=createWorld(mode,1,{title:'Test',questions:[{id:'1',mode:'ADDITION',question:'1+1',options:['2','3'],correct:0}]});for(let i=0;i<count;i++){addPlayer(w,'p'+i,'Player '+(i+1));w.players['p'+i].avatar={...defaultAvatar(),outfit:i%8};}if(spectator)w.players.p0.spectator=true;startWorld(w,20261014);for(const p of Object.values(w.players))p.invulnerable=0;window.world=w;const room={selfId:'p0',host:spectator,input(value){window.lastVrInput={...value};},answer(){},completeQuiz(){},retry(){},supply(){},rematch(){},setSpectator(){}};flushSync(()=>root.render(mode==='bomb'?<Bomb key={++serial} world={w} room={room} en={en} onBack={()=>{}}/>:<Online key={++serial} world={w} room={room} en={en} onBack={()=>{}}/>));};window.captureState('coop',2);`);
const vite=await createServer({configFile:false,plugins:[react()],css:{postcss:{plugins:[]}},define:{__APP_ASSET_VERSION__:JSON.stringify('vr-view-test')},server:{host:'127.0.0.1',port:0,watch:null,hmr:false},logLevel:'error'});await vite.listen();
const browser=await chromium.launch({...process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{},args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(60000);
try{
 await page.goto(`http://127.0.0.1:${vite.httpServer.address().port}/tmp/vr-actions-browser/index.html`);await page.waitForFunction(()=>window.captureState);

 const sizes=[{width:320,height:568},{width:390,height:844},{width:568,height:320},{width:844,height:390},{width:1280,height:800}];
 for(const mode of (process.env.VR_ACTION_MODES?.split(',')||['coop','royale','bomb','stealth'])){
  await page.setViewportSize({width:1280,height:800});
  if(mode==='stealth'){
   await page.evaluate(()=>window.showStealth());await page.getByRole('button',{name:/^訓練開始/}).click();
   await page.locator('.gear-action-tutorial').waitFor();while(await page.locator('.gear-action-tutorial').count())await page.getByRole('button',{name:'わかった・続ける',exact:true}).click();
   const crouch=page.locator('.gear-battle-actions button:has([data-vr-action=crouch])');await crouch.click();await page.waitForFunction(()=>document.querySelector('.gear-battle-actions button:has([data-vr-action=crouch])')?.getAttribute('aria-pressed')==='true');await crouch.click();
  }else await page.evaluate(mode=>window.captureState(mode,2,false,mode==='royale'),mode);
  await page.locator('.gear-action-art').first().waitFor();
  await page.evaluate(async()=>{const im=new Image();im.src='/sprites/gakurogear/action-icons-v1.webp';await im.decode();});
  if(mode==='coop'){
   const hold=page.locator('.gear-battle-actions button:has([data-vr-action=hold])');
   await hold.evaluate(el=>{el.setPointerCapture=()=>{};el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:17,pointerType:'touch',button:0}));});
   await page.waitForFunction(()=>window.lastVrInput?.hold===true);
   await hold.evaluate(el=>el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:17,pointerType:'touch'})));
   await page.waitForFunction(()=>window.lastVrInput?.hold===false);
  }
  for(const size of sizes){
   await page.setViewportSize(size);
   const nodes=await page.locator('.gear-battle-actions button:visible,.gear-bomb-stick,.gear-controls>.gear-loadout select').evaluateAll(ns=>ns.map(n=>({name:n.textContent,box:n.getBoundingClientRect().toJSON()})));
   for(const {name,box:r} of nodes)assert(r.left>=0&&r.top>=0&&r.right<=size.width+.5&&r.bottom<=size.height+.5,`${mode} ${size.width} ${name}: ${JSON.stringify(r)}`);
   for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i].box,b=nodes[j].box;assert(!(a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1),`${mode} ${size.width} controls overlap`);}
   for(const r of await page.locator('.gear-battle-actions button:visible').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().toJSON())))assert(r.width>=44&&r.height>=44,'44px touch targets');
   const r=await page.locator('.gear-battle-actions').boundingBox();assert(r.x+r.width>size.width-30&&r.y+r.height>size.height-30&&r.y>=size.height*.4,'Right-bottom actions');
   if(size.width>size.height&&size.height<=550){
    const layout=await page.evaluate(()=>{const a=document.querySelector('.gear-battle-actions'),r=document.querySelector('.gear-field').getBoundingClientRect();return {columns:getComputedStyle(a).gridTemplateColumns.split(' ').length,field:{left:r.left,right:r.right,width:r.width},center:(r.left+r.right)/2};});
    assert.equal(layout.columns,2,'Landscape actions use two vertical columns');
    assert(layout.field.left>=76,'Left HUD has its own space');
    assert(Math.abs(layout.center-size.width/2)<size.width*.09,'Arena moves toward the screen center');
    assert(layout.field.right<r.x,'Arena stays clear of the action dock');
    const radar=page.locator('.gear-field>.gear-radar-panel,.gear-field>.gear-radar');
    if(await radar.count()){const b=await radar.first().boundingBox();assert(b.x>=0&&b.x+b.width<=layout.field.left+4,'Radar stays in the left HUD space');}
   }

   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({path:`${shots}/${mode}-${size.width}.png`});console.log('Layout',mode,size.width);
  }
 }

 for(const mode of ['royale','bomb']){
  await page.setViewportSize({width:390,height:844});await page.evaluate(mode=>window.startRealBattle(mode),mode);
  await page.waitForFunction(()=>window.realWorld?.phase==='playing');
  const initial=await page.evaluate(()=>({...realRoom.world.players[realRoom.selfId].run.player}));
  await page.locator('.gear-bomb-stick').evaluate(el=>{const r=el.getBoundingClientRect();el.setPointerCapture=()=>{};el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:31,pointerType:'touch',clientX:r.left+r.width*.85,clientY:r.top+r.height*.5}));});
  if(mode==='bomb'){
   await page.locator('.gear-battle-actions button:has([data-vr-action=bomb])').evaluate(el=>el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:32,pointerType:'touch',button:0})));
   await page.waitForFunction(()=>realRoom.world.bombArena.bombs.some(b=>b.owner===realRoom.selfId));
  }
  await page.waitForFunction(initial=>{const p=realRoom.world.players[realRoom.selfId].run.player;return Math.hypot(p.x-initial.x,p.z-initial.z)>.1;},initial);
  await page.locator('.gear-bomb-stick').evaluate(el=>el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:31,pointerType:'touch'})));
  await page.locator('.gear-battle-actions button:has([data-vr-action=supply])').click();
  if(mode==='bomb'){
   await page.getByRole('dialog',{name:'爆弾を補充'}).waitFor();const stock=await page.evaluate(()=>realRoom.world.players[realRoom.selfId].bomb.stock);
   await page.locator('.gear-bomb-answers button').first().click();await page.waitForFunction(stock=>realRoom.world.players[realRoom.selfId].bomb.stock===stock+1,stock);
  }else await page.getByRole('heading',{name:/単元チェック/}).waitFor();
  await page.evaluate(()=>window.realRoom.close());console.log('Gameplay',mode);
 }
 assert.deepEqual(errors,[]);console.log('PASS: illustrated controls in all four VR modes at five sizes, clear right thumb dock, no overlaps, 44px targets, actual crouch toggle and pointer-held action/release.');
}finally{await browser.close();await vite.close();}
