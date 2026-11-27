import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {WebSocket} from 'ws';
const proc=spawn(process.execPath,['server/dist/index.mjs'],{env:{...process.env,PORT:'10133'},stdio:['ignore','pipe','pipe']}),clients=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));let logs='';proc.stderr.on('data',b=>logs+=b);
const until=async(fn)=>{for(let i=0;i<150;i++){if(fn())return;await pause(40);}throw new Error('Timed out: '+logs);};
try{
 for(let i=0;i<150;i++){try{if((await fetch('http://127.0.0.1:10133/health')).ok)break;}catch{}await pause(100);}
 const connect=async(packet)=>{const ws=new WebSocket('ws://127.0.0.1:10133/online'),messages=[];clients.push(ws);ws.on('message',s=>messages.push(JSON.parse(s)));await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});ws.send(JSON.stringify({type:'connect',protocol:1,...packet}));await until(()=>messages.some(m=>m.type==='init'));const c=messages.find(m=>m.type==='connected'),joined=messages.find(m=>m.type==='init'),initial=joined.world;return {ws,messages,...c,initial,resumeToken:joined.resumeToken,state:()=>messages.filter(m=>m.type==='state').at(-1)?.state||initial,send:a=>ws.send(JSON.stringify({type:'action',action:a}))};};
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

 const engineer=await connect({create:true,name:'Engineer',minutes:0,machineryProtocol:1,
  setup:{visualTheme:'high-school',mode:'MULTIPLICATION',answerMode:'CHOICE',difficultyLevel:1}});
 engineer.send({type:'rpg-start'});await until(()=>engineer.state().started);
 engineer.send({type:'voxel-craft',recipe:'plank',amount:1});
 await until(()=>engineer.state().players[engineer.id].life.bag.plank>=4);
 await pause(220);
 engineer.send({type:'voxel-craft',recipe:'stick',amount:1});
 await until(()=>engineer.state().players[engineer.id].life.bag.stick>=4);
 await pause(220);
 engineer.send({type:'voxel-craft',recipe:'crystal_lever',amount:1});
 await until(()=>engineer.state().players[engineer.id].life.bag.crystal_lever===1);

 const builder=engineer.state().players[engineer.id],plan=engineer.initial,worldTiles=plan.tiles.split(',');
 const buildCells=[];
 for(let z=builder.y-3;z<=builder.y+3;z++)for(let x=builder.x-3;x<=builder.x+3;x++){
  if(Math.hypot(x-builder.x,z-builder.y)<3 && worldTiles[z*192+x]==='road' &&
    !plan.sites.some(s=>Math.abs(s.x-x)+Math.abs(s.y-z)<=1) && (x!==builder.x||z!==builder.y))buildCells.push({x,y:0,z});
 }
 assert.ok(buildCells.length);
 const lever=buildCells[0],leverKey=`${lever.x},0,${lever.z}`;
 engineer.send({type:'voxel-place',block:'crystal_lever',...lever});
 await until(()=>engineer.state().voxels?.edits[leverKey]==='crystal_lever');
 assert.equal(engineer.state().players[engineer.id].life.bag.crystal_lever,0);
 await pause(250);
 engineer.send({type:'voxel-device',command:'use',...lever});
 await until(()=>engineer.state().voxels?.machinery?.devices[leverKey]?.signal===15);
 const partner=await connect({code:engineer.code,name:'Late arrival',machineryProtocol:1});
 assert.equal(partner.initial.voxels.machinery.devices[leverKey].signal,15);
 partner.send({type:'voxel-device',command:'rotate',...lever});
 partner.send({type:'voxel-break',...lever});
 await pause(350);
 assert.equal(partner.state().voxels.edits[leverKey],'crystal_lever');
 assert.equal(partner.state().voxels.rotations[leverKey],0);
 partner.send({type:'voxel-device',command:'use',...lever});
 await until(()=>engineer.state().voxels.machinery.devices[leverKey].signal===0);
 console.log('PASS: WebSocket peers share devices and late-join state, respect ownership, and can operate a cooperative switch.');
 const reservedEnergy=engineer.state().players[engineer.id].life.energy;
 assert(engineer.resumeToken);
 assert(!JSON.stringify(partner.initial).includes(engineer.resumeToken));
 engineer.ws.terminate();
 await until(()=>partner.state().players[engineer.id]?.spectator===true);
 await until(()=>partner.messages.some(packet=>packet.type==='connected'&&packet.host===true));
 const returning=await connect({code:engineer.code,name:'Engineer',machineryProtocol:1,resumeToken:engineer.resumeToken});
 assert.equal(returning.id,engineer.id);
 assert.notEqual(returning.resumeToken,engineer.resumeToken);
 assert.equal(returning.initial.players[returning.id].life.energy,reservedEnergy);
 assert(!returning.initial.players[returning.id].spectator);
 assert.equal(returning.initial.voxels.placedBy[leverKey],returning.id);
 returning.send({type:'voxel-device',command:'rotate',...lever});
 await until(()=>partner.state().voxels.rotations[leverKey]===1);
 console.log('PASS: the new host and returning builder retain the same live world, inventory and equipment access.');
 const lobby=await connect({create:true,name:'Lobby host',minutes:0,machineryProtocol:1,
  setup:{visualTheme:'high-school',mode:'MULTIPLICATION',answerMode:'CHOICE',difficultyLevel:1}});
 const replacement=await connect({code:lobby.code,name:'New host',machineryProtocol:1});
 lobby.ws.terminate();
 await until(()=>replacement.messages.some(packet=>packet.type==='connected'&&packet.host===true));
 replacement.send({type:'rpg-start'});
 await until(()=>replacement.state().started);
 assert.equal(replacement.state().hostId,replacement.id);
 console.log('PASS: the replacement host can start the adventure after the creator disconnects in the lobby.');
}finally{clients.forEach(ws=>ws.close());proc.kill('SIGTERM');}
