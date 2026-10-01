import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {build} from 'esbuild';
import {chromium} from 'playwright';
const built=await build({stdin:{contents:'import{RpgRoom}from"./src/rpg/network.ts";window.RpgRoom=RpgRoom;',resolveDir:process.cwd()},bundle:true,write:false,format:'esm',define:{'import.meta.env':'{"VITE_ONLINE_SERVER_URL":"http://127.0.0.1:10092"}'}});
const backend=spawn(process.execPath,['server/dist/index.mjs'],{env:{...process.env,PORT:'10092',ALLOWED_ORIGINS:'http://127.0.0.1:5198'},stdio:['ignore','pipe','pipe']});
await new Promise((resolve,reject)=>{backend.stdout.once('data',resolve);backend.once('exit',()=>reject(Error('Server exited')));});
const http=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/bundle.js'?'text/javascript':'text/html');res.end(req.url==='/bundle.js'?built.outputFiles[0].text:'<script type="module" src="/bundle.js"></script>');});
await new Promise(r=>http.listen(5198,'127.0.0.1',r));const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5198');await page.waitForFunction(()=>window.RpgRoom);
 const result=await page.evaluate(async()=>{
  let h,g;const host=new window.RpgRoom(w=>h=w,()=>{});const guest=new window.RpgRoom(w=>g=w,()=>{});
  await host.create('Host',{visualTheme:'elementary',mode:'MULTIPLICATION',answerMode:'CHOICE',difficultyLevel:1});await guest.join(host.code,'Guest');
  await new Promise(r=>setTimeout(r,300));
  const value={host:host.host,guest:guest.host,count:Object.keys(g.players).length,tiles:g.tiles.length};
  guest.send({type:'move',dx:1,dy:0});await new Promise(r=>setTimeout(r,300));value.moved=g.players[guest.selfId].moveCount>0;
  host.close();guest.close();return value;
 });
 assert.equal(result.host,true);assert.equal(result.guest,false);assert.equal(result.count,2);assert.equal(result.tiles,16896);assert.equal(result.moved,true);assert.deepEqual(errors,[]);
 console.log('PASS: browser RPG host/join, terrain hydration, authoritative movement');
}finally{await browser.close();await new Promise(r=>http.close(r));backend.kill();}
