import {setVrSpectator} from '../src/mini-games/gakurogear/onlineRules';
import { randomInt,randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocket,WebSocketServer } from 'ws';
import { addPlayer,createWorld,startWorld,tickWorld,type OnlineWorld,type VrInput } from '../src/mini-games/gakurogear/onlineEngine';
import { returnToLobby } from '../src/mini-games/gakurogear/onlineRules';
import { vrCommand,clearVrPulses } from '../src/mini-games/gakurogear/roomCommands';
import { vrPacket,VrStateEncoder } from '../src/mini-games/gakurogear/vrProtocol';
import {updateVrSettings} from '../src/mini-games/gakurogear/roomSettings';
import { validLesson } from '../src/mini-games/gakuro-kart/learning';
import { validAvatar } from '../src/mini-games/gakuro-kart/avatar';
type Member={id:string;socket:WebSocket;alive:boolean;rate:number;at:number;metadata:string};
type Room={host:string;world:OnlineWorld;members:Map<string,Member>;controls:Record<string,VrInput>;lastInput:Record<string,number>;emptyAt:number;encoder:VrStateEncoder};
const rooms=new Map<string,Room>(),sockets=new WebSocketServer({noServer:true,maxPayload:512*1024,perMessageDeflate:false});
function send(m:Member,p:unknown){if(m.socket.readyState===WebSocket.OPEN&&m.socket.bufferedAmount<131072)m.socket.send(JSON.stringify(p));}
function emit(r:Room){const key=`${r.world.round}:${r.world.phase}:${r.world.missionId}`,state=JSON.stringify(r.encoder.delta(r.world));let full:string|undefined;for(const m of r.members.values()){if(m.socket.readyState!==WebSocket.OPEN||m.socket.bufferedAmount>131072){m.metadata='';continue;}if(m.metadata!==key){full??=JSON.stringify(vrPacket(r.world,true));m.socket.send(full);m.metadata=key;}else m.socket.send(state);}}
sockets.on('connection',socket=>{
 const m:Member={id:randomUUID(),socket,alive:true,rate:0,at:Date.now(),metadata:''};let room:Room|undefined;
 const handshake=setTimeout(()=>{if(!room)socket.close(1008,'Handshake timeout');},20000);
 socket.on('pong',()=>{m.alive=true;});socket.on('error',()=>{});
 socket.on('message',raw=>{let d:any;try{d=JSON.parse(raw.toString());}catch{return;}if(!d||typeof d!=='object'||Array.isArray(d))return;const now=Date.now();if(now-m.at>=1000){m.at=now;m.rate=0;}if(++m.rate>50)return;if(d.type==='ping'){send(m,{type:'pong'});return;}
  try{if(!room){if(d.type!=='connect'||d.protocol!==1||d.version!==6||typeof d.name!=='string'||!validAvatar(d.avatar)){send(m,{type:'error',message:'Invalid VR connection'});return;}
   let code='';if(d.create){if(rooms.size>=4||!['coop','royale','bomb'].includes(d.mode)||!Number.isInteger(d.missionId)||d.missionId<1||d.missionId>100||!validLesson(d.lesson,120)||!Number.isFinite(d.limit)||!Number.isInteger(d.bombMap??0)||(d.bombMap??0)<0||(d.bombMap??0)>2){send(m,{type:'error',message:'Invalid room settings or server full'});return;}
    const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';do{code=Array.from({length:6},()=>alphabet[randomInt(alphabet.length)]).join('');}while(rooms.has(code));
    room={host:m.id,world:createWorld(d.mode,d.missionId,d.lesson,d.limit),members:new Map(),controls:{},lastInput:{},emptyAt:0,encoder:new VrStateEncoder()};room.world.bombMap=d.bombMap??0;rooms.set(code,room);
   }else{code=String(d.code??'').toUpperCase();room=rooms.get(code);}
   if(!room||!addPlayer(room.world,m.id,d.name)){room=undefined;send(m,{type:'error',message:'Room full, missing, or already started'});return;}
   room.world.players[m.id].avatar=d.avatar;room.members.set(m.id,m);room.emptyAt=0;clearTimeout(handshake);send(m,{type:'connected',id:m.id,code,host:m.id===room.host});emit(room);return;
  }
  if(d.type==='start'){if(m.id===room.host){room.controls={};room.lastInput={};startWorld(room.world,randomInt(0x100000000));emit(room);}return;}
  if(d.type==='spectator'){if(m.id===room.host&&setVrSpectator(room.world,m.id,d.enabled)){delete room.controls[m.id];emit(room);}return;}
  if(d.type==='settings'){if(m.id===room.host&&updateVrSettings(room.world,d.settings)){for(const q of room.members.values())q.metadata='';emit(room);}return;}
  if(d.type==='rematch'){if(m.id===room.host&&returnToLobby(room.world,d.next===true)){room.controls={};room.lastInput={};emit(room);}return;}
  vrCommand(room.world,m.id,d,room.controls,room.lastInput);if(d.type!=='input')emit(room);
  }catch{send(m,{type:'error',message:'Unable to process VR command'});}
 });
 socket.on('close',()=>{clearTimeout(handshake);if(!room)return;delete room.controls[m.id];delete room.lastInput[m.id];if(room.world.phase==='lobby')delete room.world.players[m.id];else if(room.world.players[m.id]){room.world.players[m.id].connected=false;room.world.players[m.id].quiz=false;}room.members.delete(m.id);if(!room.members.size){room.emptyAt=Date.now();return;}if(room.host===m.id){room.host=room.members.keys().next().value!;for(const q of room.members.values())send(q,{type:'host',host:q.id===room.host});}emit(room);});
});
let pulses=0,previous=performance.now();
const timer=setInterval(()=>{const now=performance.now(),dt=Math.min(.05,(now-previous)/1000);previous=now;for(const[code,r]of rooms){if(!r.members.size){if(Date.now()-r.emptyAt>60000)rooms.delete(code);continue;}for(const id of Object.keys(r.controls))if(Date.now()-(r.lastInput[id]??0)>600)delete r.controls[id];tickWorld(r.world,r.controls,dt);clearVrPulses(r.controls);if(pulses%2===0)emit(r);}pulses++;},50);
const heartbeat=setInterval(()=>{for(const r of rooms.values())for(const m of r.members.values()){if(!m.alive)m.socket.terminate();else{m.alive=false;m.socket.ping();}}},30000);
export function vrUpgrade(req:IncomingMessage,socket:Duplex,head:Buffer,allowed:Set<string>){if(req.url!=='/vr')return false;if((allowed.size&&(!req.headers.origin||!allowed.has(req.headers.origin)))||sockets.clients.size>=160){socket.destroy();return true;}sockets.handleUpgrade(req,socket,head,ws=>sockets.emit('connection',ws));return true;}
export function closeVrRooms(){clearInterval(timer);clearInterval(heartbeat);for(const s of sockets.clients)s.close(1001,'Server restarting');}
