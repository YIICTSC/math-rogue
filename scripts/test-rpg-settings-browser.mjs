import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const file='.rpg-settings-fixture.tsx';let server,browser;
try{
 await fs.mkdir('tmp',{recursive:true});
 await fs.writeFile(file,`import React from 'react';import {createRoot} from 'react-dom/client';import './src/styles.css';import Settings from './src/rpg/RpgSettings';import TouchPad from './src/rpg/TouchPad';createRoot(document.getElementById('root')).render(<><TouchPad disabled={false} onMove={()=>{}} languageMode="JAPANESE"/><Settings languageMode="JAPANESE" onClose={()=>{}}/></>);`);
 server=await createServer({server:{host:'127.0.0.1',port:4247,hmr:false},plugins:[{name:'fixture',configureServer(s){s.middlewares.use('/settings',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml('/settings',`<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module" src="/${file}"></script>`));});}}],logLevel:'error'});await server.listen();browser=await chromium.launch();
 const p=await browser.newPage({viewport:{width:390,height:844}});p.setDefaultTimeout(90000);const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{if(!localStorage.getItem('rpg-preferences-v1'))localStorage.setItem('rpg-preferences-v1',JSON.stringify({control:'dpad',hand:'right'}));});
 await p.goto('http://127.0.0.1:4247/settings');const select=p.locator('.rpg-settings-content select').nth(0);await select.waitFor();assert.equal(await select.inputValue(),'stick');assert.equal(await p.locator('.rpg-settings-content select').nth(1).inputValue(),'right');assert.equal(await p.locator('.rpg-stick').count(),1);
 const colors=await select.evaluate(el=>({color:getComputedStyle(el).color,background:getComputedStyle(el).backgroundColor,label:getComputedStyle(el.parentElement).color}));assert.equal(colors.color,'rgb(23, 47, 51)');assert.equal(colors.background,'rgb(250, 247, 237)');assert.equal(colors.label,'rgb(245, 242, 232)');await p.screenshot({path:'tmp/rpg-settings-readable.png'});
 await select.selectOption('dpad');await p.reload();await select.waitFor();assert.equal(await select.inputValue(),'dpad');assert.equal(await p.locator('.rpg-dpad').count(),1);assert.deepEqual(errors,[]);console.log('PASS: stick migration, preserved hand preference, readable colors and saved explicit dpad selection.');
}finally{await browser?.close();await server?.close();await fs.rm(file,{force:true});}
