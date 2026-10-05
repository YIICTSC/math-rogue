import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
process.env.VITE_WEB_PERFORMANCE_MODE = 'true';
const file=`.game-bgm-fixture-${process.pid}.tsx`;
let server,browser;
try {
  await fs.writeFile(file,`import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import HobbyGamesPanel from './src/mini-games/gakuro-craft/HobbyGamesPanel';import {gameCommand} from './src/mini-games/gakuro-craft/homeGames';import {GAME_BGM} from './src/mini-games/gakuro-craft/gameBgm';import {audioService} from './src/services/audioService';window.audio=audioService;window.tracks=GAME_BGM;
  function fixture(kind){const home={tile:9,level:1,furniture:[{slot:2,item:kind}]},w={tiles:[],homeViews:{9:home},players:{},games:{},time:10,paused:false};w.tiles[9]={homeOwner:'p0'};w.players.p0={id:'p0',name:'Player',indoors:true,homeTile:9,progress:{home}};gameCommand(w,w.players.p0,{type:'game_join',slot:2});return w;}
  function App(){const [w,sw]=useState(fixture('billiards'));window.choose=kind=>sw(fixture(kind));const send=c=>{gameCommand(w,w.players.p0,c);sw(structuredClone(w));};window.send=send;window.game=w.games['9:2'];return <><button onClick={()=>void audioService.playBGM('map')}>Background</button><HobbyGamesPanel world={w} me={w.players.p0} home={w.homeViews[9]} t={s=>s} send={send}/></>;};createRoot(document.getElementById('root')).render(<App/>);`);
  server=await createServer({cacheDir:'node_modules/.vite-game-bgm-browser',optimizeDeps:{noDiscovery:true,entries:[],include:['react','react-dom/client','react/jsx-runtime']},server:{host:'127.0.0.1',port:5231,strictPort:true,hmr:false},plugins:[{name:'game-bgm-test',configureServer(s){s.middlewares.use('/__bgm',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml('/__bgm',`<html><body><div id="root"></div><script type="module" src="/${file}"></script></body></html>`));});}}],logLevel:'error'});
  await server.listen();browser=await chromium.launch({headless:true});
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(30000);
  await page.goto('http://127.0.0.1:5231/__bgm');
  await page.getByRole('button',{name:'Background',exact:true}).click();
  await page.waitForFunction(()=>window.audio.currentHtmlAudio?.currentTime>0);
  const tracks=await page.evaluate(()=>window.tracks);
  for(const [kind,track] of Object.entries(tracks)){
    if(!track)continue;
    await page.evaluate(k=>window.choose(k),kind);
    await page.getByRole('button',{name:'ゲーム開始',exact:true}).click();
    await page.waitForFunction(t=>window.audio.getCurrentBgmType()===t&&window.audio.currentHtmlAudio?.currentTime>0,track);
    const state=await page.evaluate(()=>({phase:window.game.phase,loop:window.audio.currentHtmlAudio.loop,muted:window.audio.currentHtmlAudio.muted,url:window.audio.currentHtmlAudio.src}));
    assert.equal(state.phase,'playing');assert.equal(state.loop,true);assert.equal(state.muted,false);assert.ok(state.url.includes(track),JSON.stringify(state));
    await page.evaluate(()=>window.send({type:'game_leave',key:window.game.key}));
    await page.waitForFunction(()=>window.audio.getCurrentBgmType()==='map'&&window.audio.currentHtmlAudio?.currentTime>0);
  }
  await page.evaluate(()=>window.choose('billiards'));
  await page.evaluate(()=>window.audio.playBGM('poker_play',false));
  await page.getByRole('button',{name:'ゲーム開始',exact:true}).click();
  await page.waitForFunction(()=>window.audio.currentHtmlAudio?.loop===true);
  await page.evaluate(()=>window.send({type:'game_leave',key:window.game.key}));
  await page.waitForFunction(()=>window.audio.currentHtmlAudio?.loop===false);
  await page.evaluate(()=>window.audio.playBGM('map'));
  await page.evaluate(()=>window.choose('billiards'));
  await page.getByRole('button',{name:'ゲーム開始',exact:true}).click();
  await page.waitForFunction(()=>window.audio.getCurrentBgmType()==='poker_play');
  await page.evaluate(async()=>{await window.audio.playBGM('math');window.send({type:'game_leave',key:window.game.key});});
  assert.equal(await page.evaluate(()=>window.audio.getCurrentBgmType()),'math','Leaving must preserve a newer scene BGM');
  await page.evaluate(()=>window.choose('rhythm'));
  await page.waitForFunction(()=>window.audio.currentHtmlAudio?.muted);
  await page.getByRole('button',{name:'退出',exact:true}).click();
  await page.waitForFunction(()=>!window.audio.currentHtmlAudio?.muted);
  assert.deepEqual(errors,[]);
  console.log('Furniture BGM passed: nine real games start their selected looped BGM, exit restores map, newer scene music is preserved, rhythm lobby/exit silences/restores HTML audio.');
} finally {await browser?.close();await server?.close();await fs.rm(file,{force:true});}
