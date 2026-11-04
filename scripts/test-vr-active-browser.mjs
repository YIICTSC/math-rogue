import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {build} from 'esbuild';
import {createServer as httpServer} from 'node:http';
import {createServer} from 'vite';
import {WebSocket} from 'ws';
import {chromium} from 'playwright';
const clients=[],errors=[],out='tmp/vr-active';let browser,vite,backend,api;
const wait=async fn=>{const end=Date.now()+15000;while(!fn()){if(Date.now()>end)throw Error('VR network timeout');await new Promise(r=>setTimeout(r,20));}};
try{
 await mkdir(out,{recursive:true});
 await build({stdin:{contents:(await readFile('server/vrRooms.ts','utf8'))+'\nexport const testRooms=rooms;export const testVersion=VR_PROTOCOL_VERSION;',resolveDir:process.cwd()+'/server',loader:'ts'},outfile:`${out}/server.mjs`,bundle:true,platform:'node',format:'esm',packages:'external',define:{'import.meta.env':'{}'}});api=await import('../tmp/vr-active/server.mjs');
 backend=httpServer((_,res)=>res.end('ok'));backend.on('upgrade',(req,socket,head)=>api.vrUpgrade(req,socket,head,new Set()));await new Promise(r=>backend.listen(0,'127.0.0.1',r));
 const port=backend.address().port,lesson={title:'Test',questions:Array.from({length:3},(_,i)=>({id:String(i),mode:'ADDITION',question:'1+1',options:['2','3','4','5'],correct:0}))};
 await build({entryPoints:['src/mini-games/gakuro-kart/avatar.ts'],outfile:`${out}/avatar.mjs`,bundle:true,platform:'node',format:'esm'});const{defaultAvatar}=await import('../tmp/vr-active/avatar.mjs');
 async function join(packet){const ws=new WebSocket(`ws://127.0.0.1:${port}/vr`),client={ws,info:null};clients.push(client);ws.on('message',raw=>{const p=JSON.parse(String(raw));if(p.type==='connected')client.info=p;});await new Promise(r=>ws.once('open',r));ws.send(JSON.stringify({type:'connect',protocol:1,version:api.testVersion,name:'Companion',avatar:defaultAvatar(),...packet}));await wait(()=>client.info);return client;}
 const host=await join({create:true,name:'Host',mode:'bomb',missionId:1,bombMap:1,limit:300,lesson});await join({code:host.info.code});
 await writeFile(`${out}/fixture.tsx`, `import React from'react';import{createRoot}from'react-dom/client';import{VrRoom}from'/src/mini-games/gakurogear/network';import Game from'/src/mini-games/gakurogear/BombGame';import'/src/mini-games/gakurogear/gakurogear.css';const root=createRoot(document.getElementById('root'));window.join=async(code,name)=>{const room=window.room=new VrRoom(w=>{window.world=w;if(w.phase==='playing'||w.phase==='result')root.render(<Game world={w} room={room} en={false} onBack={()=>{}}/>);},message=>window.error=message);room.transport='server';await room.join(name,code);};`);
 vite=await createServer({logLevel:'error',optimizeDeps:{noDiscovery:true,include:['react','react-dom/client','react/jsx-runtime','peerjs','three','lucide-react']},define:{'import.meta.env.VITE_VR_SERVER_URL':JSON.stringify(`http://127.0.0.1:${port}`)},server:{host:'127.0.0.1',port:0,watch:null,hmr:false},plugins:[{name:'vr-active',configureServer(s){s.middlewares.use('/__vr-active',async(_,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml('/__vr-active',`<meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;margin:0;background:#102638}</style><div id="root"></div><script type="module" src="/${out}/fixture.tsx"></script>`));});}}]});await vite.listen();
 browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});context.setDefaultTimeout(30000);context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 const url=`http://127.0.0.1:${vite.httpServer.address().port}/__vr-active`,page=await context.newPage();await page.goto(url);await page.waitForFunction(()=>window.join);await page.evaluate(code=>window.join(code,'Player'),host.info.code);host.ws.send(JSON.stringify({type:'start'}));await page.locator('.gear-bomb canvas').waitFor();
 const w=[...api.testRooms.values()][0].world,id=await page.evaluate(()=>room.selfId),p=w.players[id],a=w.bombArena;
 p.invulnerable=0;p.hits=2;a.flames.push({x:Math.round(p.run.player.x/1.8+(a.side-1)/2),z:Math.round(p.run.player.z/1.8+(a.side-1)/2),until:w.time+1,owner:host.info.id});
 await page.waitForFunction(()=>world.players[room.selfId].out&&!!world.bombPractice);assert.equal(w.phase,'playing');assert(await page.getByRole('button',{name:/^爆弾を設置/}).isEnabled());
 const practice=w.bombPractice;for(let x=2;x<8;x++)practice.cells[3*practice.side+x]=0;p.run.player={x:(3-(practice.side-1)/2)*1.8,z:(3-(practice.side-1)/2)*1.8,angle:0};
 await page.waitForFunction(x=>Math.abs(world.players[room.selfId].run.player.x-x)<.01,p.run.player.x);
 await page.locator('canvas').click({position:{x:180,y:250}});const before=p.run.player.x;await page.keyboard.down('ArrowRight');await wait(()=>p.run.player.x>before+.1);await page.keyboard.up('ArrowRight');
 await page.getByRole('button',{name:/^爆弾を設置/}).click();await wait(()=>practice.bombs.some(b=>b.owner===id));assert.equal(a.bombs.length,0,'Practice bombs must stay separate from the official arena');
 for(const[width,height]of [[390,844],[844,390]]){await page.setViewportSize({width,height});await page.screenshot({path:`${out}/practice-${width}.png`});}
 const late=await context.newPage();await late.goto(url);await late.waitForFunction(()=>window.join);await late.evaluate(code=>window.join(code,'Late'),host.info.code);await late.waitForFunction(()=>world?.phase==='playing'&&world.players[room.selfId].out);assert(await late.getByRole('button',{name:/^爆弾を設置/}).isEnabled());await late.screenshot({path:`${out}/late.png`});
 assert.deepEqual(errors,[]);console.log('PASS: real VR server, knockout to a visible controllable practice arena, keyboard movement, independent bombs, portrait/landscape and active-game late join.');
}finally{await browser?.close();await vite?.close();for(const c of clients)c.ws.terminate();api?.closeVrRooms();if(backend){backend.closeAllConnections();await new Promise(r=>backend.close(r));}}
