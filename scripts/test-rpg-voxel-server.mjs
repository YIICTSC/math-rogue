import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {WebSocket} from 'ws';
const proc=spawn(process.execPath,['server/dist/index.mjs'],{env:{...process.env,PORT:'10133'},stdio:['ignore','pipe','pipe']}),clients=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));let logs='';proc.stderr.on('data',b=>logs+=b);
const until=async(fn)=>{for(let i=0;i<150;i++){if(fn())return;await pause(40);}throw new Error('Timed out: '+logs);};
try{
 for(let i=0;i<150;i++){try{if((await fetch('http://127.0.0.1:10133/health')).ok)break;}catch{}await pause(100);}
 const connect=async(packet)=>{const ws=new WebSocket('ws://127.0.0.1:10133/online'),messages=[];clients.push(ws);ws.on('message',s=>messages.push(JSON.parse(s)));await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});ws.send(JSON.stringify({type:'connect',protocol:1,...packet}));await until(()=>messages.some(m=>m.type==='init'));const c=messages.find(m=>m.type==='connected'),initial=messages.find(m=>m.type==='init').world;return {ws,messages,...c,initial,state:()=>messages.filter(m=>m.type==='state').at(-1)?.state||initial,send:a=>ws.send(JSON.stringify({type:'action',action:a}))};};
 const a=await connect({create:true,name:'Builder',minutes:0,setup:{visualTheme:'high-school',mode:'MULTIPLICATION',answerMode:'CHOICE',difficultyLevel:1}}),b=await connect({code:a.code,name:'Friend'});
 a.send({type:'rpg-start'});await until(()=>b.state().started);
 a.send({type:'voxel-move',dx:.13,dy:.11});await until(()=>b.state().players[a.id].position3D);assert(!Number.isInteger(b.state().players[a.id].position3D.x));
 const p=a.state().players[a.id],w=a.initial,tiles=w.tiles.split(',');let tile;
 for(let z=p.y-3;z<=p.y+3;z++)for(let x=p.x-3;x<=p.x+3;x++)if(!tile&&Math.hypot(x+.5-(p.position3D?.x??p.x+.5),z+.5-(p.position3D?.z??p.y+.5))<3&&tiles[z*192+x]==='road'&&!w.sites.some(s=>Math.abs(s.x-x)+Math.abs(s.y-z)<=1)&&!Object.values(a.state().players).some(q=>q.x===x&&q.y===z))tile={x,y:0,z};
 assert(tile,'A buildable nearby tile exists');const key=`${tile.x},0,${tile.z}`;
 a.send({type:'voxel-place',...tile,block:'wood'});await until(()=>b.state().voxels?.edits[key]==='wood');assert.equal(b.state().players[a.id].life.bag.wood,3);
 b.send({type:'voxel-break',...tile});await until(()=>a.state().voxels?.edits[key]===null);assert.equal(a.state().players[b.id].life.bag.wood,5);assert(Math.abs(a.state().players[b.id].life.energy-5.9)<1e-8);assert(Math.abs(a.state().players[a.id].life.energy-5.9)<1e-8);
 await pause(250);a.send({type:'voxel-break',...tile,y:-1});await until(()=>b.state().voxels?.edits[`${tile.x},-1,${tile.z}`]===null);assert(Math.abs(b.state().players[a.id].life.energy-5.8)<1e-8);assert.equal(['dirt','sand','snow'].reduce((n,k)=>n+(b.state().players[a.id].life.bag[k]||0),0),1);
 const revision=a.state().voxels.revision;b.send({type:'voxel-place',x:150,y:0,z:70,block:'wood'});await pause(350);assert.equal(a.state().voxels.revision,revision);
 a.send({type:'voxel-snap'});await until(()=>!b.state().players[a.id].position3D);
 console.log('PASS: two actual server clients synchronize continuous coordinates, place/mine/materials/energy, reject remote edits and synchronize the 2D snap.');
}finally{clients.forEach(ws=>ws.close());proc.kill('SIGTERM');}
