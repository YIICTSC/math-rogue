import assert from 'node:assert/strict';
import {createServer as viteServer} from 'vite';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {build} from 'esbuild';
import {chromium} from 'playwright';
const vite = await viteServer({configFile:false,server:{middlewareMode:true,watch:null,hmr:false},optimizeDeps:{noDiscovery:true,include:[]},appType:'custom',logLevel:'error'});
try {
  const {sessionResult,validSessionResult} = await vite.ssrLoadModule('/src/services/sessionResults.ts');
  const golf = await vite.ssrLoadModule('/src/mini-games/gakuro-golf/engine.ts');
  const w = golf.createGolf(); for(const id of ['a','b','c','observer'])golf.addPlayer(w,id,id);
  assert.equal(sessionResult('golf',w),null); w.players.observer.spectator=true; w.title='Test';golf.startGolf(w,w.title);
  w.players.a.scores=[4];w.players.a.strokes=2;w.players.b.scores=[4];w.players.c.strokes=1;
  const before=JSON.stringify(w),result=sessionResult('golf',w);
  assert.equal(JSON.stringify(w),before,'building results cannot grant rewards or change the world');
  assert.deepEqual(result.rows.map(r=>r.rank),[1,1,3]);assert.equal(result.rows.length,3);
  assert.deepEqual(sessionResult('golf',golf.viewFor(w,'a')),result,'private views and authoritative world produce identical scores');
  assert(validSessionResult(result,'golf'));assert(!validSessionResult(result,'vr'));
  assert(!validSessionResult({...result,rows:[{...result.rows[0],rank:NaN}]},'golf'));
  const {golfAdvanceCommand} = await vite.ssrLoadModule('/src/mini-games/gakuro-golf/keyboard.ts');
  for(const key of ['Enter',' ']){assert.deepEqual(golfAdvanceCommand('ready',key),{type:'quiz'});assert.deepEqual(golfAdvanceCommand('holed',key),{type:'next'});assert.equal(golfAdvanceCommand('aim',key),null);}
  const kart=await vite.ssrLoadModule('/src/mini-games/gakuro-kart/engine.ts');const race=kart.createRace();
  for(const id of ['a','b','c'])kart.addRacer(race,id,id);race.phase='race';race.players.a.distance=30;race.players.b.distance=60;race.players.c.finish=12;
  assert.deepEqual(sessionResult('kart',race).rows.map(r=>r.id),['c','b','a']);
  console.log('PASS: immutable interim results, tied ranks, golf private views, spectators, race ordering and keyboard commands.');
} finally {await vite.close();}

const reserve=createServer();await new Promise(r=>reserve.listen(0,'127.0.0.1',r));const port=reserve.address().port;await new Promise(r=>reserve.close(r));
const processServer=spawn(process.execPath,['server/dist/index.mjs'],{env:{...process.env,PORT:String(port),ALLOWED_ORIGINS:''},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server startup timeout')),15000);processServer.stdout.once('data',()=>{clearTimeout(timer);resolve();});processServer.once('error',reject);});
const source=`import{GolfRoom}from'./src/mini-games/gakuro-golf/network.ts';import{KartRoom}from'./src/mini-games/gakuro-kart/network.ts';import{VrRoom}from'./src/mini-games/gakurogear/network.ts';import{RpgRoom}from'./src/rpg/network.ts';import{defaultAvatar}from'./src/mini-games/gakuro-kart/avatar.ts';import React from'react';import{createRoot}from'react-dom/client';import QuizPanel from'./src/mini-games/gakuro-golf/QuizPanel.tsx';window.classes={golf:GolfRoom,kart:KartRoom,vr:VrRoom,rpg:RpgRoom};window.avatar=defaultAvatar();window.lesson={title:'Test',questions:[0,1,2].map(i=>({id:'q'+i,mode:'ADDITION',question:'1+1=?',options:['2','3','4','5'],correct:0}))};window.renderQuiz=quiz=>{window.quizRoot??=createRoot(document.getElementById('app'));window.quizRoot.render(React.createElement(QuizPanel,{quiz,languageMode:'JAPANESE',disabled:false,send:c=>(window.commands??=[]).push(c)}));};`;
const peerReserve=createServer();await new Promise(r=>peerReserve.listen(0,'127.0.0.1',r));const peerPort=peerReserve.address().port;await new Promise(r=>peerReserve.close(r));
const signaling=spawn(process.execPath,['--input-type=module','-e',`import{PeerServer}from'peer';PeerServer({host:'127.0.0.1',port:${peerPort},path:'/peer'},()=>process.send('ready'));`],{stdio:['ignore','ignore','inherit','ipc']});
await new Promise((r,reject)=>{const t=setTimeout(()=>reject(Error('Signaling timeout')),10000);signaling.once('message',()=>{clearTimeout(t);r();});});
const bundle=await build({stdin:{contents:source,resolveDir:process.cwd()},bundle:true,write:false,format:'esm',loader:{'.css':'empty'},define:{'import.meta.env':JSON.stringify({VITE_ONLINE_SERVER_URL:`http://127.0.0.1:${port}`,VITE_VR_SERVER_URL:`http://127.0.0.1:${port}`,VITE_RPG_PEER_HOST:'127.0.0.1',VITE_RPG_PEER_PORT:peerPort,VITE_RPG_PEER_PATH:'/peer',VITE_RPG_PEER_SECURE:'false',VITE_GOLF_ICE_SERVERS:'[]',VITE_KART_ICE_SERVERS:'[]',VITE_RPG_ICE_SERVERS:'[]'})}});
const fixture=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/bundle.js'?'text/javascript':'text/html');res.end(req.url==='/bundle.js'?bundle.outputFiles[0].text:'<div id="app"></div><script type="module" src="/bundle.js"></script>');});await new Promise(r=>fixture.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chrome'});const pages=[];
try {
  for(const transport of ['server','host'])for(const game of ['golf','kart','vr','rpg']){
    const pair=[];
    for(const role of ['Host','Guest']){const page=await browser.newPage();pages.push(page);pair.push(page);page.on('pageerror',error=>console.error(game,role,error));await page.goto(`http://127.0.0.1:${fixture.address().port}`);await page.waitForFunction(()=>window.classes);await page.evaluate(({game,role,transport})=>{window.room=new window.classes[game](v=>window.view=v,m=>(window.statuses??=[]).push(m));window.room.transport=transport;window.role=role;}, {game,role,transport});}
    const [host,guest]=pair;
    await host.evaluate(async game=>{if(game==='golf')await room.create('Host');if(game==='kart')await room.create('Host',0,0);if(game==='vr')await room.create('Host','coop',1,lesson,300,avatar,0);if(game==='rpg')await room.create('Host',{},30);},game);
    const code=await host.evaluate(()=>room.code);
    await guest.evaluate(async({game,code})=>{if(game==='golf')await room.join(code,'Guest');if(game==='kart')await room.join(code,'Guest',0);if(game==='vr')await room.join('Guest',code,avatar);if(game==='rpg')await room.join(code,'Guest');},{game,code});
    // A guest cannot terminate the room, and neither can an owner in the lobby.
    if(transport==='server')await guest.evaluate(()=>{const c=room.dedicated||room.serverConnection;c.send({type:'session-end'});});
    if(transport==='server')await host.evaluate(()=>{const c=room.dedicated||room.serverConnection;c.send({type:'session-end'});});
    await host.waitForTimeout(100);assert.equal(await host.locator('#online-session-result').count(),0);
    await host.evaluate(game=>{if(game==='golf'){room.setLesson(()=>lesson,{mode:'ADDITION',title:'Test'});room.start();}else if(game==='rpg')room.send({type:'rpg-start'});else room.start(false);},game);
    for(const page of pair)await page.waitForFunction(game=>game==='rpg'?view?.started:view&&view.phase!=='lobby',game);
    if(transport==='server')await guest.evaluate(()=>{const c=room.dedicated||room.serverConnection;c.send({type:'session-end'});});await host.waitForTimeout(100);assert.equal(await host.locator('#online-session-result').count(),0);
    // Remove the host game DOM immediately, as navigating to title does.
    await host.evaluate(()=>{room.close();document.getElementById('app').replaceChildren();});
    for(const page of pair)await page.locator('#online-session-result').waitFor();
    if(transport==='host')await host.waitForTimeout(550);
    const hostRows=await host.locator('#online-session-result tbody').innerText();assert.equal(await guest.locator('#online-session-result tbody').innerText(),hostRows);assert(hostRows.includes('Host')&&hostRows.includes('Guest'));
    assert.equal(await host.evaluate(()=>room.closed),true);assert.equal(await guest.evaluate(()=>room.closed),true);
    for(const page of pair){await page.getByRole('button',{name:'閉じる / Close'}).click();assert.equal(await page.locator('#online-session-result').count(),0);await page.close();}
    console.log(`PASS: ${transport}/${game}: host + guest clients show identical authoritative results, survive title navigation, reject guest/lobby end, and close their connections.`);
  }
  const page=await browser.newPage();pages.push(page);await page.goto(`http://127.0.0.1:${fixture.address().port}`);await page.waitForFunction(()=>window.renderQuiz);
  await page.evaluate(()=>{window.quiz={shotId:1,index:0,question:lesson.questions[0],selected:null,answer:null};renderQuiz(quiz);});
  await page.locator('.gg-options button').first().waitFor();await page.keyboard.press('3');await page.keyboard.press('3');assert.equal(await page.evaluate(()=>commands.length),1);assert.equal(await page.evaluate(()=>commands[0].option),2);
  await page.evaluate(()=>renderQuiz({...quiz,selected:2,answer:0}));await page.getByRole('button',{name:'次へ'}).focus();await page.keyboard.press('Enter');await page.waitForTimeout(950);assert.equal(await page.evaluate(()=>commands.filter(c=>c.type==='continue').length),1,'keyboard + auto-continue cannot double advance');
  await page.evaluate(()=>renderQuiz({...quiz,index:1}));await page.locator('.gg-options button').first().focus();await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>commands.at(-1).option),0);
  console.log('PASS: quiz number keys, focused Enter/Space, duplicate answer and auto-continue suppression.');
} finally {await browser.close();await new Promise(r=>fixture.close(r));processServer.kill();signaling.kill();}
