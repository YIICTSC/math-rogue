import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import WebSocket from 'ws';
import { build } from 'esbuild';

const codec=await build({entryPoints:['src/mini-games/secret-mission/packets.ts'],bundle:true,format:'esm',write:false});
const {patchView}=await import('data:text/javascript;base64,'+Buffer.from(codec.outputFiles[0].text).toString('base64'));

const heartbeat=createServer();
heartbeat.listen(0,'127.0.0.1');await once(heartbeat,'listening');
const port=heartbeat.address().port;await new Promise(resolve=>heartbeat.close(resolve));
const child=spawn(process.execPath,['--preserve-symlinks-main','server/dist/index.mjs'],{env:{...process.env,PORT:String(port),ALLOWED_ORIGINS:''},stdio:['ignore','pipe','inherit']});
const sockets=new Set();

const avatar={species:0,body:0,outfit:0,hair:0,accessory:0,hairStyle:0,kart:0,expression:0};
async function waitFor(check,label,timeout=14000){
  const end=Date.now()+timeout;
  while(Date.now()<end){const result=await check();if(result)return result;await delay(18);}
  throw new Error('Timed out: '+label);
}
async function connect(options){
  const socket=new WebSocket('ws://127.0.0.1:'+port+'/secret-mission');
  sockets.add(socket);socket.on('error',()=>{});
  const peer={socket,state:null,receipt:null,bytes:[],send(type,extra={}){socket.send(JSON.stringify({type,...extra}));}};
  socket.on('message',raw=>{
    const packet=JSON.parse(String(raw));
    if(packet.type==='admitted')peer.receipt=packet;
    if(packet.type==='error')peer.error=packet.message;
    if(packet.type!=='view')return;
    peer.state=patchView(packet,peer.state);
    if(peer.state?.phase==='field')peer.bytes.push(raw.length);
  });
  await once(socket,'open');
  peer.send('connect',{protocol:1,version:1,name:'Co-pilot',avatar,...options});
  await waitFor(()=>peer.state||peer.error,'secret room socket admission');
  assert(!peer.error,peer.error);return peer;
}
const cleanup=(peers)=>{
  for(const p of peers){
    if(p.socket.readyState===WebSocket.OPEN){p.send('leave');p.socket.close();}
    sockets.delete(p.socket);
  }
};

try{
  await waitFor(()=>fetch('http://127.0.0.1:'+port+'/health').then(r=>r.json()).then(v=>v.features.secretMission).catch(()=>false),'server boot');
  for(const n of [6,10,15,20,30,40]){
    const mode=n>15?'large':'standard',started=Date.now();
    const host=await connect({create:true,name:'Host',settings:{mode,capacity:n,traitors:1,roles:{},split:n===30}});
    const code=host.receipt.code;
    assert(/^\d{6}$/.test(code));
    const peers=[host,...await Promise.all(Array.from({length:n-1},(_,i)=>connect({code,name:'Cadet '+(i+2)})))];
    for(const p of peers.slice(1))p.send('ready',{value:true});
    await waitFor(()=>host.state.canStart,n+' ready seats');
    host.send('start');
    await waitFor(()=>peers.every(p=>p.state.phase==='field'),n+' exploring',15000);
    const groups=host.state.groups.map(g=>g.count);
    assert.deepEqual(groups,n===30?[15,15]:[n]);
    for(const p of peers){
      assert(p.state.role&&p.state.self);
      assert(!p.state.roster.some(o=>o.role),'Other player roles must stay out of packets');
      assert(!p.state.reports&&!p.state.report&&!p.state.task);
    }
    const last=peers.at(-1),before={x:last.state.self.x,z:last.state.self.z},sent=Date.now();
    for(let i=0;i<10;i++){
      for(const p of peers)p.send('input',{x:i<5?1:-1,z:n%2?-.2:.2});
      await delay(55);
    }
    await waitFor(()=>Math.hypot(last.state.self.x-before.x,last.state.self.z-before.z)>.05,n+' movement');
    const response=Date.now()-sent;
    assert(response<2200);
    if(n===40){
      const guest=last.receipt;last.socket.terminate();await once(last.socket,'close');
      const resumed=await connect({code,resume:guest.token});
      assert.equal(resumed.receipt.id,guest.id);
      assert.equal(resumed.state.role,last.state.role);
      peers[peers.length-1]=resumed;
    }
    const samples=peers.flatMap(p=>p.bytes).sort((a,b)=>a-b),p95=samples[Math.floor(samples.length*.95)]??0;
    assert(p95<17000,n+' state packet budget '+p95);
    console.log('PASS',n,'WebSocket players · groups',groups.join('/'),'· p95 field payload',p95,'bytes · scenario',Date.now()-started,'ms');
    cleanup(peers);
    await delay(80);
  }
  const teacher=await connect({create:true,name:'Teacher',settings:{mode:'classroom',observer:true,bots:5,roles:{},difficulty:'easy'}});
  const pupil=await connect({code:teacher.receipt.code,name:'Cadet'});
  pupil.send('ready',{value:true});
  await waitFor(()=>teacher.state.canStart,'classroom can start');
  teacher.send('start');
  await waitFor(()=>teacher.state.phase==='field'&&pupil.state.phase==='field','classroom begins');
  assert(teacher.state.observer&&teacher.state.reports.length===1);
  assert(!pupil.state.reports);
  pupil.send('end');await delay(140);assert.equal(pupil.state.phase,'field');
  teacher.send('force-meeting');await waitFor(()=>pupil.state.phase==='talk','teacher opens a real meeting');
  teacher.send('end');await waitFor(()=>pupil.state.phase==='result','teacher ends match');
  teacher.send('rematch');await waitFor(()=>pupil.state.phase==='lobby','learners return to the same lobby');
  console.log('PASS teacher-only reports and commands, classroom meeting, result and rematch');
  cleanup([teacher,pupil]);
}finally{
  for(const socket of sockets)socket.terminate();
  if(child.exitCode===null&&child.signalCode===null){child.kill('SIGTERM');await once(child,'exit');}
}
