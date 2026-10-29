import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {chromium} from 'playwright';
const b=await build({stdin:{contents:"export * from './src/mini-games/kotoba-life/model';export * from './src/mini-games/kotoba-life/cozyDialogue';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
// Exercise the real component through its supported fallback, without software 3D rendering.
const directory='tmp/kotoba-cozy-browser';await mkdir(directory,{recursive:true});
await writeFile(directory+'/index.html','<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module" src="./entry.tsx"></script>');
await writeFile(directory+'/entry.tsx',`import React from 'react';import{createRoot}from'react-dom/client';import KotobaLife from '/src/mini-games/kotoba-life/KotobaLife';import '/src/styles.css';createRoot(document.getElementById('root')).render(<KotobaLife onBack={()=>{}} problemMode="ADDITION" languageMode={location.search.includes('en')?'ENGLISH':'JAPANESE'}/>);`);
const server=await createServer({configFile:false,cacheDir:'node_modules/.vite-kotoba-cozy-test',plugins:[react()],base:'/math-rogue/',optimizeDeps:{entries:[directory+'/index.html'],include:['lucide-react','three','react','react-dom/client','react/jsx-runtime','react/jsx-dev-runtime']},define:{__APP_ASSET_VERSION__:JSON.stringify('cozy-test')},server:{host:'127.0.0.1',port:0,watch:null,hmr:false},logLevel:'error'});await server.listen();
const browser=await chromium.launch({args:['--disable-gpu']});const errors=[];
try{for(const [hero,en,width,height] of [['mugi',false,1280,800],['pico',false,390,844],['kohaku',true,844,390]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>errors.push(e.message));
 const state=api.selectCharacter(api.freshState(),hero);state.started=true;state.companions[hero].affinity=60;
 await page.addInitScript(({state,key})=>{localStorage.setItem(key,JSON.stringify(state));localStorage.setItem('learning-rogue:kotoba-life:voice','off');const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /^webgl/.test(kind)?null:get.call(this,kind,...args);};},{state,key:api.SAVE_KEY});
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/math-rogue/tmp/kotoba-cozy-browser/index.html${en?'?en':''}`,{timeout:90000,waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:en?'Visit Kohaku':hero==='mugi'?'むぎに会いにいく':'ぴこに会いにいく',exact:true}).click();
 await page.getByRole('button',{name:en?'Chat':'おしゃべり',exact:true}).click();
 const scene=api.cozyChat(hero,0,60),field=en?'en':'ja';
 assert.equal(await page.locator('.kl-dialogue>p').innerText(),scene.lines[0][field]);
 await page.getByRole('button',{name:en?'Go on':'つぎのおはなし',exact:true}).click();
 const choices=page.locator('.kl-reply-choices button');await choices.first().waitFor();assert.equal(await choices.count(),3);
 assert.equal(await choices.nth(2).innerText(),scene.choices[2].label[field]);await choices.nth(2).click();
 assert.equal(await page.locator('.kl-dialogue>p').innerText(),scene.replies.playful[field]);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:`tmp/kotoba-cozy-browser/cozy-${hero}.png`});await page.close();
}assert.deepEqual(errors,[]);console.log('PASS contextual choices and replies in desktop Japanese, phone portrait and landscape English using supported fallback.');}finally{await browser.close();await server.close();}
