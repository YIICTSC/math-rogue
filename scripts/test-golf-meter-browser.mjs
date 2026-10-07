import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { build } from 'esbuild';
import { chromium } from 'playwright';
const bundle = await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`import React from 'react';import {createRoot} from 'react-dom/client';import ShotMeter from './src/mini-games/gakuro-golf/ShotMeter';window.clock=0;performance.now=()=>window.clock;window.shots=[];function App(){const[disabled,setDisabled]=React.useState(false);window.disable=setDisabled;return <ShotMeter disabled={disabled} t={s=>s} onPower={v=>window.power=v} onActive={v=>window.active=v} onShot={(power,impact)=>window.shots.push({power,impact})}/>;}createRoot(document.getElementById('root')).render(<App/>);`},bundle:true,write:false,format:'esm',jsx:'automatic'});
const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/app.js'?'text/javascript':'text/html');res.end(req.url==='/app.js'?bundle.outputFiles[0].text:'<div id="root"></div><div id="course" style="width:300px;height:200px">Course</div><script type="module" src="/app.js"></script>');});await new Promise(r=>server.listen(5211,'127.0.0.1',r));const browser=await chromium.launch();const page=await browser.newPage({hasTouch:true});
const advance=async n=>{await page.evaluate(n=>window.clock=n,n);await page.waitForTimeout(40);};
try{
 await page.goto('http://127.0.0.1:5211');const start=page.getByRole('button',{name:'ショット',exact:true});await start.waitFor();
 await start.tap();await advance(770);await page.locator('#course').tap();assert.equal(await page.evaluate(()=>window.power),.7);
 await advance(900);await page.locator('#course').tap();assert.equal(await page.evaluate(()=>window.shots.length),0,'outbound second taps cannot fire');
 assert.equal(await page.locator('.gg-impact-cue').innerText(),'↑');await advance(1100);assert.equal(await page.locator('.gg-timing').getAttribute('data-returning'),'true');assert.equal(await page.locator('.gg-meter-cursor').evaluate(e=>e.style.left),'100%','power tap did not restart or stop sweep');
 await advance(2068);await page.locator('#course').tap();let shots=await page.evaluate(()=>window.shots);assert.equal(shots.length,1);assert(Math.abs(shots[0].impact)<1e-10);assert.equal(shots[0].power,.7);assert.equal(await page.evaluate(()=>window.active),false);
 await start.focus();await page.keyboard.press('Enter');await advance(2618);await page.keyboard.press('Space');await advance(4136);await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>window.shots.length),2);assert.equal(await page.evaluate(()=>window.active),false,'impact key cannot start a new sweep');
 await start.tap();await advance(4906);await page.locator('#course').tap();await page.evaluate(()=>window.disable(true));await page.waitForTimeout(40);await advance(8000);assert.equal(await page.evaluate(()=>window.shots.length),2,'paused meter never submits');await page.evaluate(()=>window.disable(false));await page.waitForTimeout(40);
 await start.tap();await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await advance(11000);assert.equal(await page.evaluate(()=>window.shots.length),2,'blur cancels');
 assert.equal(await page.getByRole('button',{name:'中止',exact:true}).count(),0);
 await start.tap();await advance(15440);await page.locator('#course').tap();await advance(17200);shots=await page.evaluate(()=>window.shots);assert.equal(shots.length,3);assert.equal(shots[2].impact,1,'missed return automatically makes a miss');
 console.log('Golf timing UI: touch/keyboard two taps, uninterrupted outward travel, early tap rejection, nice target, pause/blur, no cancel button and missed-return shot passed.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
