import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir,readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
await mkdir('tmp/availability',{recursive:true});
await build({stdin:{contents:`import React,{useState}from'react';import{createRoot}from'react-dom/client';import Picker from './src/mini-games/shared/TransportPicker';function App(){const[v,s]=useState('host');return <Picker game={new URLSearchParams(location.search).get('game')} value={v} onChange={s}/>;}createRoot(document.getElementById('root')).render(<App/>);`,resolveDir:process.cwd(),loader:'tsx'},outfile:'tmp/availability/app.js',bundle:true,format:'esm',define:{'import.meta.env.VITE_ONLINE_SERVER_URL':'"http://127.0.0.1:10125"'},plugins:[{name:'short-probe-test',setup(b){b.onLoad({filter:/serverAvailability\.ts$/},async a=>({contents:(await readFile(a.path,'utf8')).replace('timeout=15000','timeout=300'),loader:'ts'}));}}]});
const serve=()=>createServer(async(req,res)=>{if(req.url?.startsWith('/app.js')){res.setHeader('Content-Type','text/javascript');res.end(await readFile('tmp/availability/app.js'));}else if(req.url?.startsWith('/style.css')){res.setHeader('Content-Type','text/css');res.end(await readFile('src/mini-games/shared/lobby.css'));}else res.end('<html><head><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');});
const web=serve(),denied=serve();await new Promise(r=>web.listen(5199,'127.0.0.1',r));await new Promise(r=>denied.listen(5200,'127.0.0.1',r));let backend,browser;
const start=async()=>{backend=spawn(process.execPath,['server/dist/index.mjs'],{env:{...process.env,PORT:'10125',ALLOWED_ORIGINS:'http://127.0.0.1:5199'},stdio:['ignore','pipe','pipe']});await new Promise((r,j)=>{backend.stdout.once('data',r);backend.once('exit',c=>j(Error('server exit '+c)));});};
try{
 browser=await chromium.launch({headless:true});
 // Unreachable on initial load, including a cached/persisted server selection.
 const page=await browser.newPage();await page.goto('http://127.0.0.1:5199/?game=online');const serverButton=page.getByRole('button',{name:'サーバー通信 · beta',exact:true}),hostButton=page.getByRole('button',{name:'ホスト通信',exact:true});await page.getByText(/サーバーに接続できません/).waitFor();assert(await serverButton.isDisabled());assert(!(await hostButton.isDisabled()));
 await start();
 for(const game of ['online','kart','golf']){
  await page.goto('http://127.0.0.1:5199/?game='+game);await page.getByText('サーバー接続可能です。',{exact:true}).waitFor();assert(!(await serverButton.isDisabled()));await serverButton.click();assert.equal(await serverButton.getAttribute('aria-pressed'),'true');
  await page.context().setOffline(true);await page.getByText(/サーバーに接続できません/).waitFor();assert(await serverButton.isDisabled());assert.equal(await hostButton.getAttribute('aria-pressed'),'true');await page.context().setOffline(false);await page.getByText('サーバー接続可能です。',{exact:true}).waitFor();
  const blocked=await browser.newPage();await blocked.goto('http://127.0.0.1:5200/?game='+game);await blocked.getByText(/サーバーに接続できません/).waitFor();assert(await blocked.getByRole('button',{name:'サーバー通信 · beta'}).isDisabled());await blocked.close();
 }
 await new Promise(r=>{backend.once('exit',r);backend.kill();});await page.getByRole('button',{name:'ホスト通信',exact:true}).click();await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.getByText(/サーバーに接続できません/).waitFor();assert(await serverButton.isDisabled());
 await start();await page.getByRole('button',{name:'再確認',exact:true}).click();await page.getByText('サーバー接続可能です。',{exact:true}).waitFor();assert(!(await serverButton.isDisabled()));
 assert.equal((await fetch('http://127.0.0.1:10125/health').then(r=>r.json())).rooms,0);
 console.log('PASS: all three actual server endpoints, unreachable/Origin denied states, host remains selectable, recovery and no probe-created rooms.');
}finally{await browser?.close();backend?.kill();await new Promise(r=>web.close(r));await new Promise(r=>denied.close(r));}
