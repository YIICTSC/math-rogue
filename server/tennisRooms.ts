import {randomInt,randomUUID} from 'node:crypto';
import type {IncomingMessage} from 'node:http';
import type {Duplex} from 'node:stream';
import {WebSocket,WebSocketServer} from 'ws';
import {buildLesson,type LessonSelection} from '../src/mini-games/gakuro-kart/questions';
import {validGolfSelection as validLessonSelection} from './golfRooms';
import {addPlayer,command,configure,createTennis,disconnectPlayer,MAX_MEMBERS,rematch,setSpectator,startTennis,tick,viewFor,type TennisWorld} from '../src/mini-games/tennis/engine';
import {TENNIS_PROTOCOL} from '../src/mini-games/tennis/protocol';
import {sessionResult} from '../src/services/sessionResults';
import {endSession} from './sessionEnd';
type Member={socket:WebSocket;id:string;alive:boolean;admitted:boolean;at:number;count:number;observed:string|null};
type Room={code:string;world:TennisWorld;host:string;members:Map<string,Member>;selection?:LessonSelection;sequence:number;lastActive:number};
export function createTennisServer({allowedOrigins=new Set<string>(),idleMs=45*60000}:{allowedOrigins?:Set<string>;idleMs?:number}={}){
 const sockets=new WebSocketServer({noServer:true,maxPayload:512*1024,perMessageDeflate:false}),rooms=new Map<string,Room>(),members=new Set<Member>();let closed=false;
 const send=(m:Member,packet:unknown)=>{if(m.socket.readyState===WebSocket.OPEN&&m.socket.bufferedAmount<131072)m.socket.send(JSON.stringify(packet));};
 const emit=(r:Room,only?:Member)=>{const sequence=++r.sequence;for(const m of only?[only]:r.members.values())send(m,{type:'state',version:TENNIS_PROTOCOL,sequence,hostId:r.host,state:viewFor(r.world,m.id,m.observed)});};
 const fail=(m:Member,message:string)=>send(m,{type:'error',message});
 const factory=(r:Room)=>r.selection?(history:string[])=>buildLesson(r.selection!,3,history):undefined;
 sockets.on('connection',(socket,request)=>{
  if(closed||sockets.clients.size>160||allowedOrigins.size&&(!request.headers.origin||!allowedOrigins.has(request.headers.origin))){socket.close(1008,'Unavailable');return;}
  const m:Member={socket,id:randomUUID(),alive:true,admitted:false,at:Date.now(),count:0,observed:null};members.add(m);let room:Room|undefined;
  const timeout=setTimeout(()=>{if(!m.admitted)socket.close(1008,'Join timeout');},15000);timeout.unref();socket.on('pong',()=>{m.alive=true;});socket.on('error',()=>{});
  socket.on('message',raw=>{
   const now=Date.now();if(now-m.at>1000){m.at=now;m.count=0;}if(++m.count>85)return;let d:any;try{d=JSON.parse(String(raw));}catch{return;}if(!d||typeof d!=='object')return;
   if(d.type==='ping'){send(m,{type:'pong'});return;}
   if(!m.admitted){
    if(d.type!=='connect'||d.protocol!==TENNIS_PROTOCOL||typeof d.name!=='string'||!d.name.trim()||d.name.length>16){fail(m,'参加名と通信バージョンを確認してください。');return;}
    if(d.create===true){if(rooms.size>=32){fail(m,'部屋が満員です。');return;}let code='';do{code=String(randomInt(500000,1000000));}while(rooms.has(code));room={code,world:createTennis(randomInt(1,0x7fffffff)),host:m.id,members:new Map(),sequence:0,lastActive:now};rooms.set(code,room);}
    else if(d.create===false&&typeof d.code==='string')room=rooms.get(d.code);
    if(!room||room.world.phase==='result'||room.members.size>=MAX_MEMBERS||!addPlayer(room.world,m.id,d.name)){fail(m,'参加できません。部屋の空き人数を確認してください。');return;}
    m.admitted=true;clearTimeout(timeout);room.members.set(m.id,m);room.lastActive=now;send(m,{type:'connected',id:m.id,code:room.code,host:room.host===m.id});emit(room);return;
   }
   if(!room)return;room.lastActive=now;
   try{
    if(d.type==='lesson'){if(room.host!==m.id||room.world.phase!=='lobby'||!validLessonSelection(d.selection)){fail(m,'ホストだけが問題を設定できます。');return;}const selection=structuredClone(d.selection),sample=buildLesson(selection,3);room.selection=selection;room.world.title=sample.title;emit(room);}
    else if(d.type==='configure'){if(m.id===room.host&&configure(room.world,d.mode,d.games))emit(room);}
    else if(d.type==='spectator'){if(setSpectator(room.world,m.id,d.enabled))emit(room);}
    else if(d.type==='observe'){m.observed=typeof d.id==='string'&&d.id.length<60?d.id:null;emit(room,m);}
    else if(d.type==='start'){const f=factory(room);if(m.id===room.host&&f&&startTennis(room.world,f))emit(room);}
    else if(d.type==='rematch'){if(m.id===room.host&&rematch(room.world))emit(room);}
    else if(d.type==='command'){if(command(room.world,m.id,d.command,factory(room))&&d.command?.type!=='move')emit(room,m);}
    else if(d.type==='session-end'&&m.id===room.host){if(endSession(sessionResult('tennis',room.world),room.members.values())){rooms.delete(room.code);room.world.phase='result';}}
   }catch{fail(m,'問題を準備できませんでした。');}
  });
  socket.on('close',()=>{clearTimeout(timeout);members.delete(m);if(!room)return;room.members.delete(m.id);disconnectPlayer(room.world,m.id);if(!room.members.size){rooms.delete(room.code);return;}if(room.host===m.id)room.host=room.members.keys().next().value!;emit(room);});
 });
 let previous=performance.now(),accumulator=0,broadcast=0;
 const simulation=setInterval(()=>{const now=performance.now(),dt=Math.min(.2,(now-previous)/1000);previous=now;accumulator+=dt;while(accumulator>=1/60){for(const room of rooms.values())try{tick(room.world,1/60,factory(room));}catch{room.world.paused=true;for(const m of room.members.values())fail(m,'問題を準備できませんでした。');}accumulator-=1/60;}broadcast+=dt;if(broadcast<.1)return;broadcast=0;for(const[code,r]of rooms){if(Date.now()-r.lastActive>idleMs){rooms.delete(code);for(const m of r.members.values())m.socket.close(1001,'Room expired');}else emit(r);}},1000/60);simulation.unref();
 const heartbeat=setInterval(()=>{for(const m of members){if(!m.alive){m.socket.terminate();continue;}m.alive=false;if(m.socket.readyState===WebSocket.OPEN)m.socket.ping();}},30000);heartbeat.unref();
 return {sockets,rooms,close(){if(closed)return;closed=true;clearInterval(simulation);clearInterval(heartbeat);for(const m of members)m.socket.close(1001,'Server restarting');rooms.clear();sockets.close();}};
}
let shared:ReturnType<typeof createTennisServer>|undefined;
export function tennisUpgrade(req:IncomingMessage,socket:Duplex,head:Buffer,allowed:Set<string>){if(req.url!=='/tennis')return false;if(allowed.size&&(!req.headers.origin||!allowed.has(req.headers.origin))){socket.destroy();return true;}shared??=createTennisServer({allowedOrigins:allowed});if(shared.sockets.clients.size>=160){socket.destroy();return true;}shared.sockets.handleUpgrade(req,socket,head,ws=>shared!.sockets.emit('connection',ws,req));return true;}
export function closeTennisRooms(){shared?.close();}
