import {build} from 'esbuild';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const backend=spawn(process.execPath,['server/dist/index.mjs'],{env:{...process.env,PORT:'10093',ALLOWED_ORIGINS:''},stdio:['ignore','pipe','pipe']});
backend.stderr.on('data',data=>process.stderr.write(data));
await new Promise((resolve,reject)=>{backend.stdout.once('data',resolve);backend.once('exit',()=>reject(Error('Server exited')));});
const bundle=await build({stdin:{contents:'import{KartRoom}from"./src/mini-games/gakuro-kart/network.ts";import{CraftRoom,loadIsland}from"./src/mini-games/gakuro-craft/network.ts";window.KartRoom=KartRoom;window.CraftRoom=CraftRoom;window.loadIsland=loadIsland;',resolveDir:process.cwd()},bundle:true,write:false,format:'esm',define:{'import.meta.env':'{"VITE_ONLINE_SERVER_URL":"http://127.0.0.1:10093"}'}});
const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/bundle.js'?'text/javascript':'text/html');res.end(req.url==='/bundle.js'?bundle.outputFiles[0].text:'<script type="module" src="/bundle.js"></script>');});
await new Promise(r=>server.listen(5199,'127.0.0.1',r));
const browser=await chromium.launch({headless:true});
try{
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5199');await page.waitForFunction(()=>window.KartRoom&&window.CraftRoom);
const result=await page.evaluate(async()=>{
const until=async(fn,timeout=15000)=>{const end=Date.now()+timeout;while(Date.now()<end){if(fn())return;await new Promise(r=>setTimeout(r,30));}throw Error('Condition timed out');};
const q={id:'q',mode:'ADDITION',question:'1+1',options:['1','2','3','4'],correct:1};const lesson={title:'test',questions:[q,{...q,id:'q2'},{...q,id:'q3'}]};
const karts=[],crafts=[],kartStates=[],craftStates=[],replies=[];
try{
const k=new window.KartRoom(w=>kartStates[0]=w,()=>{});karts.push(k);await k.create('Host',0,0);k.setLaps(2);k.setLesson(lesson);await until(()=>kartStates[0].laps===2&&kartStates[0].lesson);
await Promise.all(Array.from({length:39},async(_,i)=>{const g=new window.KartRoom(w=>kartStates[i+1]=w,()=>{});karts.push(g);await g.join(k.code,'Guest '+i,i%3);}));await until(()=>Object.keys(kartStates[0].players).length===40);
const denied=new window.KartRoom(()=>{},()=>{});let rejected=false;try{await denied.join(k.code,'Overflow',0);}catch{rejected=true;}finally{denied.close();}if(!rejected)throw Error('41st racer admitted');
k.start(false);await until(()=>kartStates[0].phase==='race',7000);
for(const room of karts)room.send({type:'input',steer:.5,brake:false,drift:false});await until(()=>Object.values(kartStates[0].players).every(p=>p.speed>0));
Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));const time=kartStates[0].time;await until(()=>kartStates[0].time>time+.3);if(kartStates[0].paused)throw Error('Server paused for browser visibility');
Object.defineProperty(document,'hidden',{configurable:true,value:false});
k.close();await until(()=>karts.some(room=>room!==k&&room.host));
const c=new window.CraftRoom(w=>craftStates[0]=w,r=>replies.push(r),()=>{});crafts.push(c);await c.create('Host',0,[q],'test');await until(()=>window.loadIsland());
await Promise.all(Array.from({length:39},async(_,i)=>{const g=new window.CraftRoom(w=>craftStates[i+1]=w,()=>{},()=>{});crafts.push(g);await g.join(c.code,'Guest '+i,i%6);}));await until(()=>Object.keys(craftStates[0].players).length===40);
const deniedCraft=new window.CraftRoom(()=>{},()=>{},()=>{});rejected=false;try{await deniedCraft.join(c.code,'Overflow',0);}catch{rejected=true;}finally{deniedCraft.close();}if(!rejected)throw Error('41st crafter admitted');
c.sendCommand({type:'quiz'});await until(()=>replies.some(r=>r.type==='quiz'));const quiz=replies.find(r=>r.type==='quiz');if('correct' in quiz.question)throw Error('Answer leaked');c.sendCommand({type:'answer',token:quiz.token,option:1});await until(()=>replies.some(r=>r.type==='answer'&&r.correct));
const before=craftStates[0].players[c.selfId];c.sendCommand({type:'move',dx:1,dz:0});await until(()=>craftStates[0].players[c.selfId].x!==before.x);c.sendCommand({type:'move',dx:0,dz:0});
const guestId=crafts[1].selfId;if(Object.values(craftStates[0].players[guestId].bag).some(v=>v!==0))throw Error('Guest inventory leaked');
await until(()=>window.loadIsland().player.correct===1,8000);
const saved=window.loadIsland();for(const room of crafts)room.close();const resumed=new window.CraftRoom(w=>craftStates[0]=w,()=>{},()=>{});crafts.push(resumed);await resumed.create('Host',0,[q],'test',true);if(craftStates[0].players[resumed.selfId].correct!==saved.player.correct)throw Error('Island progress lost');
return {kartPlayers:40,craftPlayers:40,quiz:true,resume:true,hostTransfer:true,backgroundSimulation:true};
}finally{for(const room of karts)room.close();for(const room of crafts)room.close();}
});
assert.deepEqual(errors,[]);console.log('PASS dedicated minigames:',JSON.stringify(result));
}finally{await browser.close();await new Promise(r=>server.close(r));backend.kill();}
