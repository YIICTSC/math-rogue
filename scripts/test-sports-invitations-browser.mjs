import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer as netServer} from 'node:net';
import {spawn} from 'node:child_process';
import {createServer} from 'vite';
import {chromium} from 'playwright';

const entry=`.sports-invitations-${process.pid}.tsx`,out='tmp/sports-invitations',errors=[];
let server,browser,signaling,dedicated;
const freePort=()=>new Promise(resolve=>{const s=netServer();s.listen(0,'127.0.0.1',()=>{const port=s.address().port;s.close(()=>resolve(port));});});
try{
 await fs.mkdir(out,{recursive:true});
 const peerPort=await freePort(),serverPort=await freePort();
 signaling=spawn(process.execPath,['--input-type=module','-e',`import{PeerServer}from'peer';PeerServer({host:'127.0.0.1',port:${peerPort},path:'/sports'},()=>process.send('ready'));`],{stdio:['ignore','ignore','inherit','ipc']});
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Signaling startup timeout')),15000);signaling.once('message',()=>{clearTimeout(timer);resolve();});signaling.once('error',reject);});
 dedicated=spawn(process.execPath,['server/dist/index.mjs'],{env:{...process.env,PORT:String(serverPort)},stdio:['ignore','pipe','inherit']});
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Dedicated startup timeout')),15000);dedicated.stdout.once('data',()=>{clearTimeout(timer);resolve();});dedicated.once('error',reject);});
 await fs.writeFile(entry,`import React,{StrictMode}from'react';import{createRoot}from'react-dom/client';import Hub from'./src/mini-games/sports/SportsHub';import{audioService as audio}from'./src/services/audioService';import'./src/styles.css';const release=()=>{};release.update=()=>{};audio.acquireBgmScene=()=>release;audio.playBGM=async()=>{};audio.playSound=()=>{};const p=new URLSearchParams(location.search);createRoot(document.getElementById('root')).render(<StrictMode><Hub languageMode={(p.get('lang')||'JAPANESE')as any} golfInviteCode={p.get('golfRoom')||''} tennisInviteCode={p.get('tennisRoom')||''} dodgeballInviteCode={p.get('dodgeballRoom')||''} basketballInviteCode={p.get('basketballRoom')||''} onClose={()=>{(window as any).left=true;}}/></StrictMode>);`);
 server=await createServer({logLevel:'error',cacheDir:'node_modules/.vite-sports-invitations',optimizeDeps:{noDiscovery:true,include:['react','react-dom','react-dom/client','react/jsx-runtime','peerjs','three','lucide-react']},define:{'import.meta.env.VITE_ONLINE_SERVER_URL':JSON.stringify(`ws://127.0.0.1:${serverPort}`),'import.meta.env.VITE_RPG_PEER_HOST':'"127.0.0.1"','import.meta.env.VITE_RPG_PEER_PORT':JSON.stringify(String(peerPort)),'import.meta.env.VITE_RPG_PEER_PATH':'"/sports"','import.meta.env.VITE_RPG_PEER_SECURE':'"false"','import.meta.env.VITE_GOLF_ICE_SERVERS':'"[]"','import.meta.env.VITE_TENNIS_ICE_SERVERS':'"[]"','import.meta.env.VITE_DODGEBALL_ICE_SERVERS':'"[]"'},server:{watch:null,host:'127.0.0.1',port:0,hmr:false},plugins:[{name:'sports-invitations',enforce:'pre',transform(code,id){const sport=id.endsWith('/gakuro-golf/GakuroGolf.tsx')?'golf':id.endsWith('/tennis/Tennis.tsx')?'tennis':id.endsWith('/dodgeball/Dodgeball.tsx')?'dodgeball':id.endsWith('/basketball/Basketball.tsx')?'basketball':null;if(sport)return code.replace('useSportsInvitation(inviteCode,inviteName,join);',`(window as any).__sportsGame={sport:'${sport}',view,room:room.current,busy,name,code};useSportsInvitation(inviteCode,inviteName,join);`);},configureServer(s){s.middlewares.use('/__sports',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml('/__sports',`<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>html,body,#root{height:100%;margin:0}</style><div id="root"></div><script type="module" src="/${entry}"></script>`));});s.middlewares.use('/__net',(_req,res)=>{res.setHeader('Content-Type','text/html');res.end(`<script type="module">import{GolfRoom}from'/src/mini-games/gakuro-golf/network.ts';import{TennisRoom}from'/src/mini-games/tennis/network.ts';import{DodgeRoom}from'/src/mini-games/dodgeball/network.ts';import{BasketRoom}from'/src/mini-games/basketball/network.ts';window.rooms={golf:GolfRoom,tennis:TennisRoom,dodgeball:DodgeRoom,basketball:BasketRoom};</script>`);});}}]});
 await server.listen();browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});context.setDefaultTimeout(90000);
 await context.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'||type==='webgl2'?null:original.call(this,type,...args);};});
 context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 const base=`http://127.0.0.1:${server.httpServer.address().port}`,page=await context.newPage();
 await page.goto(base+'/__sports',{waitUntil:'domcontentloaded',timeout:120000});
 for(const[width,height]of(process.argv.includes('--basketball-only')?[]:[[390,844],[320,568],[844,390],[568,320],[1280,720]])){
  await page.setViewportSize({width,height});await page.locator('.sports-art').evaluate(el=>el.decode());
  const source=await page.locator('.sports-art').evaluate(el=>el.currentSrc);assert.equal(source.endsWith('sports-portrait-v1.webp'),height>width,'orientation uses its dedicated artwork');
  const heading=page.locator('.sports-dodgeball strong');assert(await heading.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);return range.getClientRects().length===1&&el.scrollWidth<=el.clientWidth+1;}),'Dodgeball stays on one line');
  if(width===390||width===844||width===1280){for(const el of await page.locator('.sports-choices button,.sports-invite-cta button').all()){const b=await el.boundingBox();assert(b.x>=0&&b.y>=0&&b.x+b.width<=width+1&&b.y+b.height<=height+1,`${width}x${height} ${JSON.stringify(b)}`);}}
  await page.screenshot({path:`${out}/title-${width}.png`});
  await page.getByRole('button',{name:'招待に参加する',exact:true}).click();await page.locator('.sports-invitation').waitFor();
  for(const selector of['.online-invite-name input','.online-invite-code input','.online-invite-submit','.online-invite-close']){const el=page.locator(selector);await el.scrollIntoViewIfNeeded();const b=await el.boundingBox();assert(b.x>=0&&b.x+b.width<=width+1&&b.y>=0&&b.y+b.height<=height+1,'invitation actions stay reachable');}
  assert(await page.locator('.online-invite-submit').isDisabled());await page.screenshot({path:`${out}/invite-${width}.png`});await page.locator('.online-invite-close').click();
 }
 for(const lang of['ENGLISH','HIRAGANA']){await page.goto(base+'/__sports?lang='+lang);await page.locator('.sports-invite-cta button').click();const copy=await page.locator('.sports-invitation').innerText();assert(lang!=='ENGLISH'||!/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(copy),'English invitation has no Japanese labels');if(lang==='HIRAGANA')assert(copy.includes('しょうたいされたしゅもく'));}
 console.log('PASS: portrait artwork, five responsive layouts, one-line Dodgeball, shared invitation inputs and English/Hiragana.');
 await page.close();
 if(!process.argv.includes('--layouts-only')){
 for(const transport of['host','server'])for(const sport of(process.argv.includes('--basketball-only')?['basketball']:['tennis','golf','dodgeball','basketball'])){
  const host=await context.newPage();await host.goto(base+'/__net');await host.waitForFunction(()=>window.rooms);
  await host.evaluate(async({sport,transport})=>{window.room=new window.rooms[sport](v=>window.view=v,m=>window.message=m);window.room.transport=transport;await window.room.create('Host');},{sport,transport});
  const code=await host.evaluate(()=>window.room.code);assert(/^\d{6}$/.test(code));
  const guest=await context.newPage();await guest.goto(base+'/__sports');await guest.getByRole('button',{name:'招待に参加する',exact:true}).click();
  await guest.getByRole('radio',{name:{tennis:'テニス',golf:'ゴルフ',dodgeball:'ドッジボール',basketball:'バスケットボール'}[sport],exact:true}).click();await guest.getByLabel('参加名',{exact:true}).fill(sport==='basketball'?'Guest basketball':' Guest '+sport+' ');await guest.getByLabel('招待コード',{exact:true}).fill(code.replace(/[0-9]/g,d=>String.fromCharCode(d.charCodeAt(0)+65248)));assert.equal(await guest.getByLabel('招待コード',{exact:true}).inputValue(),code);
  await guest.locator('.online-invite-submit').click();await guest.waitForFunction(sport=>window.__sportsGame?.sport===sport&&window.__sportsGame.view?.phase==='lobby',sport);
  await host.waitForFunction(()=>window.view.players.length===2);assert.equal(await host.evaluate(()=>window.view.players.filter(p=>p.name.startsWith('Guest ')).length),1,'StrictMode admits a single participant');assert.equal(await host.evaluate(()=>window.view.players.find(p=>p.name.startsWith('Guest ')).name),'Guest '+sport);assert.equal(await guest.getByRole('dialog',{name:'キャラクタークリエイト',exact:true}).count(),0,'common invite reaches the lobby directly');
  if(sport !== 'golf'){
   const url = await guest.getByLabel('招待リンク',{exact:true}).inputValue();
   assert.equal(new URL(url).searchParams.get(sport+'Room'),code);
   await guest.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.copiedInvite=value;}}}));
   await guest.getByRole('button',{name:'招待URLをコピー',exact:true}).click();
   await guest.getByRole('button',{name:'コピーしました',exact:true}).waitFor();
   assert.equal(await guest.evaluate(()=>window.copiedInvite),url);
  }
  if(sport==='basketball'){
   await host.evaluate(async()=>{const {buildLesson}=await import('/src/mini-games/gakuro-kart/questions.ts');window.room.setLesson(h=>buildLesson({mode:'ADDITION'},3,h),{mode:'ADDITION'});window.room.start();});
   try{await guest.waitForFunction(()=>window.__sportsGame?.view?.phase==='playing');}catch(error){console.log('Basketball start diagnostic',await host.evaluate(()=>({phase:window.view?.phase,title:window.view?.title,message:window.message,players:window.view?.players,match:window.view?.match})),await guest.evaluate(()=>({phase:window.__sportsGame?.view?.phase,alerts:document.querySelector('[role=alert]')?.textContent})));throw error;}
   await guest.screenshot({path:`${out}/basketball-learning-${transport}.png`});
   await guest.evaluate(()=>{const v=window.__sportsGame.view;window.__sportsGame.room.send({type:'answer',id:v.quiz.id,index:v.quiz.index,option:0});});
   await guest.waitForFunction(()=>window.__sportsGame.view.quiz?.selected!==null);
   for(let index=0;index<3;index++){
    if(index>0){await guest.evaluate(()=>{const v=window.__sportsGame.view;window.__sportsGame.room.send({type:'answer',id:v.quiz.id,index:v.quiz.index,option:0});});await guest.waitForFunction(()=>window.__sportsGame.view.quiz?.selected!==null);}
    await guest.evaluate(()=>{const v=window.__sportsGame.view;window.__sportsGame.room.send({type:'continue',id:v.quiz.id,index:v.quiz.index});});
    await guest.waitForFunction(index=>index===2?!window.__sportsGame.view.quiz:window.__sportsGame.view.quiz?.index===index+1,index);
   }
   await host.evaluate(()=>{if(window.room.world){const p=window.room.world.players[window.room.selfId];while(p.quiz){const q=p.quiz;window.room.send({type:'answer',id:q.id,index:q.index,option:0});window.room.send({type:'continue',id:q.id,index:q.index});}}else{const timer=setInterval(()=>{const q=window.view.quiz;if(q){window.room.send(q.selected===null?{type:'answer',id:q.id,index:q.index,option:0}:{type:'continue',id:q.id,index:q.index});}else clearInterval(timer);},150);}});
   await guest.waitForFunction(()=>window.__sportsGame.view.match?.phase==='play');
   for(const[width,height]of [[390,844],[844,390]]){await guest.setViewportSize({width,height});for(const selector of ['.bk-stick','.bk-actions button'])for(const el of await guest.locator(selector).all()){const box=await el.boundingBox();assert(box&&box.y>=0&&box.y+box.height<=height+1&&box.x>=0&&box.x+box.width<=width+1,'basketball controls stay on screen');}await guest.screenshot({path:`${out}/basketball-play-${transport}-${width}.png`});}
   const time=await guest.evaluate(()=>window.__sportsGame.view.match.time);await guest.waitForFunction(time=>window.__sportsGame.view.match.time>time+.2,time);

  }
  await guest.screenshot({path:`${out}/${sport}-${transport}.png`});await guest.close();await host.evaluate(()=>window.room.close(false));await host.close();console.log('PASS shared invitation:',sport,transport);
 }
 const invalid=await context.newPage();await invalid.goto(base+'/__sports');await invalid.locator('.sports-invite-cta button').click();await invalid.getByRole('radio',{name:'ゴルフ',exact:true}).click();await invalid.getByLabel('参加名',{exact:true}).fill('Retry');await invalid.getByLabel('招待コード',{exact:true}).fill('999999');await invalid.locator('.online-invite-submit').click();await invalid.getByRole('alert').waitFor();await invalid.locator('.online-invite-close').click();await invalid.locator('.sports-hub').waitFor();await invalid.locator('.sports-invite-cta button').click();assert.equal(await invalid.getByLabel('参加名',{exact:true}).inputValue(),'Retry');assert.equal(await invalid.getByLabel('招待コード',{exact:true}).inputValue(),'999999');await invalid.close();
 // Existing URL invitations continue to ask for the participant's name.
 const linked=await context.newPage();await linked.goto(base+'/__sports?golfRoom=000001');await linked.locator('[data-invite-entry]').waitFor();assert.equal(await linked.getByLabel('参加名',{exact:true}).inputValue(),'');assert(await linked.locator('.online-invite-submit').isDisabled());await linked.close();
 }
 assert.deepEqual(errors,[]);console.log(process.argv.includes('--layouts-only')?'PASS: sports title and shared invitation layouts.':'PASS: all four sports join actual WebRTC and dedicated rooms with one name entry, six-digit/full-width codes, no duplicate joins, failure retry and existing URL invitation compatibility.');
}finally{await browser?.close();await server?.close();signaling?.kill();dedicated?.kill();await fs.rm(entry,{force:true});}
