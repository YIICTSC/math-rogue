import assert from 'node:assert/strict';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const dir=await mkdtemp('tmp/spectator-switch-');
await writeFile(`${dir}/index.html`,'<div id="root"></div><script type="module" src="./fixture.tsx"></script>');
await writeFile(`${dir}/fixture.tsx`, `
import React,{useState} from 'react';import{createRoot}from'react-dom/client';
import KartCanvas from '/src/mini-games/gakuro-kart/KartCanvas';import GolfCanvas from '/src/mini-games/gakuro-golf/GolfCanvas';
import{createRace,addRacer,startRace}from'/src/mini-games/gakuro-kart/engine';
import{createGolf,addPlayer,setSpectator,viewFor}from'/src/mini-games/gakuro-golf/engine';import{GolfRoom}from'/src/mini-games/gakuro-golf/network';
const race=createRace(0,1,3);for(const id of ['a','b'])addRacer(race,id,id,0);startRace(race);race.players.b.distance=200;
const golf=createGolf(1);for(const id of ['host','a','b'])addPlayer(golf,id,id);setSpectator(golf,'host',true);golf.players.b.x=12;
let sends=0,updates=0;const room=new GolfRoom(()=>updates++,()=>{});room.host=true;room.selfId='host';room.world=golf;room.channels.set('a',{peer:'a',open:true,send:()=>sends++});room.observe('a');room.observe('b');window.networkResult={sends,updates};
function App(){const[id,setId]=useState('a');window.switchTarget=()=>setId(v=>v==='a'?'b':'a');return <><h1>Observer: {id}</h1><div style={{display:'flex',height:480}}><div style={{width:'50%'}}><KartCanvas world={race} selfId={id}/></div><div style={{width:'50%'}}><GolfCanvas view={viewFor(golf,'host',id)} selfId={id} aim={0} overview={false} spectator/></div></div></>};createRoot(document.getElementById('root')).render(<App/>);
`);
const server=await createServer({server:{host:'127.0.0.1',port:0},logLevel:'error'});await server.listen();const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{const page=await browser.newPage({viewport:{width:1200,height:600}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{localStorage.setItem('storybook-3d-quality-v1','low');window.glCalls=0;const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(...args){if(args[0]==='webgl2')window.glCalls++;return original.apply(this,args)}});await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/${dir}/index.html`);await page.waitForFunction(()=>window.glCalls>=2&&window.switchTarget);await page.waitForTimeout(4000);const baseline=await page.evaluate(()=>window.glCalls);assert.deepEqual(await page.evaluate(()=>window.networkResult),{sends:0,updates:2});for(let i=0;i<6;i++){await page.evaluate(()=>window.switchTarget());await page.waitForTimeout(300);}assert.equal(await page.evaluate(()=>window.glCalls),baseline,'Changing observation target must not recreate either renderer');assert.equal(await page.locator('[role="alert"]').count(),0);assert.deepEqual(errors,[]);await page.screenshot({path:'tmp/spectator-switch-after.png'});console.log('PASS: Six camera switches reused race/golf WebGL renderers; golf observer updates sent no participant packets.');}finally{await browser.close();await server.close()}
