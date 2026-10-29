import assert from 'node:assert/strict';
import {build} from 'esbuild';import{createServer}from'node:http';import WebSocket from'ws';
await build({entryPoints:['server/vrRooms.ts'],outfile:'tmp/vr-royale-server.mjs',bundle:true,platform:'node',format:'esm',packages:'external',define:{'import.meta.env':'{}'}});
const rooms=await import('../tmp/vr-royale-server.mjs');
await build({entryPoints:['src/mini-games/gakurogear/vrProtocol.ts'],outfile:'tmp/vr-royale-protocol.mjs',bundle:true,platform:'node',format:'esm'});const{readVrWorld,VR_PROTOCOL_VERSION}=await import('../tmp/vr-royale-protocol.mjs');
const http=createServer();http.on('upgrade',(req,socket,head)=>rooms.vrUpgrade(req,socket,head,new Set()));await new Promise(r=>http.listen(0,'127.0.0.1',r));
await build({entryPoints:['src/mini-games/gakuro-kart/avatar.ts'],outfile:'tmp/vr-royale-avatar.mjs',bundle:true,platform:'node',format:'esm'});const {defaultAvatar}=await import('../tmp/vr-royale-avatar.mjs');
const clients=[],lesson={title:'Test',questions:Array.from({length:3},(_,i)=>({id:String(i),mode:'ADDITION',question:'1+1',options:['2','3','4','5'],correct:0}))};
const wait=async fn=>{const end=Date.now()+12000;while(!fn()){if(Date.now()>end)throw Error('Timeout');await new Promise(r=>setTimeout(r,20));}};
const send=(c,d)=>c.ws.send(JSON.stringify(d));
async function join(hello,expectError=false){const ws=new WebSocket(`ws://127.0.0.1:${http.address().port}/vr`),c={ws,world:null,info:null,error:null,seenCover:false,seenTrace:false,bytes:[]};clients.push(c);ws.on('message',raw=>{const d=JSON.parse(raw.toString());if(d.type==='connected')c.info=d;if(d.type==='host')c.host=d.host;if(d.type==='error')c.error=d.message;if(d.type==='world'||d.type==='state'){c.world=readVrWorld(d,c.world);c.seenCover||=c.world.royale?.covers.length>0;c.seenTrace||=c.world.royale?.traces.length>0;c.bytes.push(raw.length);}});await new Promise(r=>ws.once('open',r));send(c,{type:'connect',protocol:1,version:VR_PROTOCOL_VERSION,name:`P${clients.length}`,avatar:defaultAvatar(),...hello});await wait(()=>c.world||c.error);assert.equal(!!c.error,expectError,c.error);return c;}
const idle={x:0,z:0,crouch:false,interact:false,decoy:false};
try{
 const host=await join({create:true,mode:'royale',missionId:1,lesson,limit:120});const obsolete=await join({code:host.info.code,version:VR_PROTOCOL_VERSION-1},true);assert(obsolete.error);obsolete.ws.terminate();clients.pop();for(let i=1;i<40;i++)await join({code:host.info.code});await wait(()=>Object.keys(host.world.players).length===40);
 send(host,{type:'start'});await wait(()=>clients.every(c=>c.world?.phase==='playing'));assert(clients.every(c=>c.world.mission.arena==='royale'));
 const id=host.info.id,guest=clients[1];send(host,{type:'input',input:{...idle,cover:true}});await wait(()=>clients.every(c=>c.seenCover));assert(clients.every(c=>c.world.players[id].battle.materials===1));
 let timer=setInterval(()=>send(host,{type:'input',input:{...idle,shoot:true}}),55);try{await wait(()=>clients.every(c=>c.seenTrace));await wait(()=>clients.every(c=>c.world.royale.covers.length===0));}finally{clearInterval(timer);send(host,{type:'input',input:idle});}
 const before=guest.world.players[guest.info.id].run.player.x;timer=setInterval(()=>send(guest,{type:'input',input:{...idle,x:.7,z:.7,sprint:true}}),55);try{await wait(()=>host.world.players[guest.info.id].battle.stamina<90);}finally{clearInterval(timer);send(guest,{type:'input',input:idle});}
 await wait(()=>clients.every(c=>c.world.players[guest.info.id].run.player.x!==before));await wait(()=>clients.every(c=>!c.world.players[guest.info.id].battle.sprinting));
 // Malformed inputs cannot spend materials or add client-authored cover geometry.
 const materials=host.world.players[guest.info.id].battle.materials;send(guest,{type:'input',input:{...idle,cover:'yes',sprint:999}});await new Promise(r=>setTimeout(r,150));assert.equal(host.world.players[guest.info.id].battle.materials,materials);
 send(guest,{type:'supply'});await wait(()=>host.world.players[guest.info.id].quiz);for(let i=0;i<3;i++)send(guest,{type:'answer',choice:0});send(guest,{type:'quizComplete'});await wait(()=>clients.every(c=>!c.world.players[guest.info.id].quiz&&c.world.players[guest.info.id].energy===100));
 host.ws.terminate();await wait(()=>guest.host===true);assert.equal(guest.world.phase,'playing');
 console.log('PASS 40 real royale WebSockets: seeded arena, cover placement/destruction, remote firing effects, sprint movement/stamina, input rejection, quiz refill, host handover. Last state bytes:',guest.bytes.at(-1));
}finally{for(const c of clients)c.ws.terminate();await rooms.closeVrRooms();await new Promise(r=>http.close(r));}
