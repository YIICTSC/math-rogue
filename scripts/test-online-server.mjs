import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { WebSocket } from 'ws';
const processServer=spawn(process.execPath,['server/dist/index.mjs'],{env:{...process.env,PORT:'10091',ALLOWED_ORIGINS:''},stdio:['ignore','pipe','pipe']});
const clients=[];
let ready=false;
processServer.stdout.on('data',()=>{ready=true;});
processServer.stderr.on('data',data=>process.stderr.write(data));
const connect=async packet=>{
  const socket=new WebSocket('ws://127.0.0.1:10091/online');clients.push(socket);
  const packets=[];socket.on('message',data=>packets.push(JSON.parse(data.toString())));
  await new Promise((resolve,reject)=>{socket.once('open',resolve);socket.once('error',reject);});
  socket.send(JSON.stringify({type:'connect',protocol:1,name:'Test',...packet}));
  return {socket,packets};
};
async function until(fn){const deadline=Date.now()+15000;while(Date.now()<deadline){const value=fn();if(value)return value;await new Promise(r=>setTimeout(r,20));}throw Error('Timed out');}
try{
  await until(asyncReady);
  const host=await connect({create:true,setup:{},minutes:30});
  const info=await until(()=>host.packets.find(p=>p.type==='connected'));
  assert(info.host);
  await until(()=>host.packets.find(p=>p.type==='init'));
  const guests=await Promise.all(Array.from({length:39},()=>connect({code:info.code})));
  await until(()=>guests.every(g=>g.packets.some(p=>p.type==='init')));
  const state=await until(()=>host.packets.findLast(p=>p.type==='state'&&Object.keys(p.state.players).length===40));
  assert.equal(Object.keys(state.state.players).length,40);
  const full=await connect({code:info.code});
  assert.match((await until(()=>full.packets.find(p=>p.type==='error'))).message,/満員/);
  host.socket.send(JSON.stringify({type:'action',action:{type:'rpg-start'}}));
  await until(()=>host.packets.findLast(p=>p.type==='state'&&p.state.started));
  const playerId=info.id;
  const before=state.state.players[playerId];
  for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    host.socket.send(JSON.stringify({type:'action',action:{type:'move',dx,dy}}));
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  await until(()=>host.packets.findLast(p=>p.type==='state'&&(p.state.players[playerId].x!==before.x||p.state.players[playerId].moveCount>before.moveCount)));
  host.socket.close();
  await until(()=>guests[0].packets.findLast(p=>p.type==='state'&&Object.keys(p.state.players).length===39));
  const invited=await connect({code:info.code,prepare:true});
  await until(()=>invited.packets.find(p=>p.type==='lobby'));
  assert(!invited.packets.some(p=>p.type==='init'));
  console.log('PASS: 40 connections, full-room rejection, authoritative movement, disconnect cleanup, invite setup');
}finally{for(const c of clients)c.terminate();processServer.kill();}
function asyncReady(){return ready;}
