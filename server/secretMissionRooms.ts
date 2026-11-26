import { randomInt, randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocket, WebSocketServer } from 'ws';
import { MissionRoom } from '../src/mini-games/secret-mission/authority';
import { ViewEncoder } from '../src/mini-games/secret-mission/packets';
import { ENDPOINT, PUSH_MS, TICK_MS, VERSION, sanitizeSettings } from '../src/mini-games/secret-mission/rules';
import type { Command } from '../src/mini-games/secret-mission/rules';
import { validAvatar } from '../src/mini-games/gakuro-kart/avatar';

type Peer={id:string;socket:WebSocket;alive:boolean;encoder:ViewEncoder};
type Room={code:string;game:MissionRoom;members:Map<string,Peer>;leases:Map<string,string>;emptyAt:number;lessonSource?:unknown;english:boolean};
const rooms=new Map<string,Room>();
const sockets=new WebSocketServer({noServer:true,maxPayload:96*1024,perMessageDeflate:false});
const send=(socket:WebSocket,packet:unknown)=>{
  if(socket.readyState===WebSocket.OPEN&&socket.bufferedAmount<96*1024)socket.send(JSON.stringify(packet));
};
function publish(r:Room,now:number){
  for(const [id,peer] of r.members){
    if(!r.game.players.has(id)){
      send(peer.socket,{type:'removed'});peer.socket.close(1008,'Room exited');r.members.delete(id);r.leases.delete(id);continue;
    }
    if(peer.socket.readyState!==WebSocket.OPEN||peer.socket.bufferedAmount>=96*1024)continue;
    send(peer.socket,peer.encoder.encode(r.game.view(id,now)));
  }
}
const makeLesson=async(source:unknown,difficulty:'easy'|'normal'|'hard',english:boolean)=>{
  const {missionLesson}=await import('../src/mini-games/secret-mission/lessons');
  return missionLesson(source,difficulty,english);
};

sockets.on('connection',socket=>{
  let peer:Peer|undefined,room:Room|undefined,rate=0,at=0,working=false,failed=0;
  const timeout=setTimeout(()=>{if(!peer)socket.close(1008,'Handshake timeout');},35000);
  const fail=(code:string)=>send(socket,{type:'error',message:code});
  socket.on('error',()=>{});
  socket.on('pong',()=>{if(peer)peer.alive=true;});
  socket.on('message',async raw=>{
    const now=Date.now();
    if(now-at>=1000){at=now;rate=0;}
    if(++rate>38||working)return;
    let msg:Record<string,unknown>;
    try{msg=JSON.parse(raw.toString());}catch{return;}
    if(!msg||typeof msg!=='object'||Array.isArray(msg))return;
    if(msg.type==='ping'){send(socket,{type:'pong'});return;}
    if(!peer){
      if(msg.type!=='connect'||msg.protocol!==1||msg.version!==VERSION){fail('VERSION');return;}
      if(++failed>4){socket.close(1008,'Too many attempts');return;}
      working=true;
      try{
        let id:string=randomUUID(),token:string=randomUUID();
        if(msg.resume!==undefined){
          if(typeof msg.code!=='string'||typeof msg.resume!=='string'||msg.resume.length!==36){fail('EXPIRED');return;}
          room=rooms.get(msg.code);
          const seat=room&&[...room.leases].find(([,value])=>value===msg.resume)?.[0];
          if(!room||!seat||!room.game.reconnect(seat)){room=undefined;fail('EXPIRED');return;}
          id=seat;token=msg.resume;
        }else if(msg.create===true){
          if(rooms.size>=8){fail('BUSY');return;}
          const settings=sanitizeSettings(msg.settings);
          const english=msg.english===true;
          const lesson=await makeLesson(msg.lesson,settings.difficulty,english);
          if(socket.readyState!==WebSocket.OPEN)return;
          if(rooms.size>=8){fail('BUSY');return;}
          let code:string;do{code=String(randomInt(100000,1000000));}while(rooms.has(code));
          const game=new MissionRoom(randomUUID(),id,settings,lesson);
          if(!game.add(id,msg.name,msg.avatar,now)){fail('NAME');return;}
          room={code,game,members:new Map(),leases:new Map(),emptyAt:0,lessonSource:msg.lesson,english};
          rooms.set(code,room);
        }else {
          if(typeof msg.code!=='string'||!/^\d{6}$/.test(msg.code)){fail('CODE');return;}
          room=rooms.get(msg.code);
          if(!room){fail('CODE');return;}
          if(!room.game.add(id,msg.name,msg.avatar,now)){
            if(!validAvatar(msg.avatar))fail('NAME');else fail('CLOSED');
            room=undefined;return;
          }
        }
        if(!room)return;
        room.members.get(id)?.socket.close(1000,'Replaced by reconnection');
        peer={id,socket,alive:true,encoder:new ViewEncoder()};
        room.members.set(id,peer);room.leases.set(id,token);room.emptyAt=0;clearTimeout(timeout);
        send(socket,{type:'admitted',code:room.code,token,id});
        publish(room,Date.now());
      }catch{fail('LESSON');}
      finally{working=false;}
      return;
    }
    if(!room||room.members.get(peer.id)!==peer)return;
    try{
      if(msg.type==='lesson'){
        if(peer.id!==room.game.host||room.game.groups.length)return;
        const selected=room;
        working=true;
        try{
          const lesson=await makeLesson(msg.value,selected.game.settings.difficulty,selected.english);
          if(selected.members.get(peer.id)!==peer||selected.game.host!==peer.id||selected.game.groups.length)return;
          selected.game.lesson=lesson;selected.lessonSource=msg.value;
          for(const p of selected.game.players.values())p.ready=p.id===peer.id;
          publish(selected,Date.now());
        }finally{working=false;}
        return;
      }
      if(msg.type==='settings'&&peer.id===room.game.host&&!room.game.groups.length&&room.lessonSource===undefined){
        const settings=sanitizeSettings(msg.value);
        if(settings.difficulty!==room.game.settings.difficulty){
          working=true;
          try{const lesson=await makeLesson(undefined,settings.difficulty,room.english);
            if(room.members.get(peer.id)!==peer||room.game.host!==peer.id||room.game.groups.length)return;
            room.game.lesson=lesson;
          }finally{working=false;}
        }
      }
      room.game.command(peer.id,msg as Command,now);
      if(msg.type!=='input')publish(room,Date.now());
    }catch{fail('COMMAND');}
  });
  socket.on('close',()=>{
    clearTimeout(timeout);
    if(!peer||!room||room.members.get(peer.id)!==peer)return;
    room.members.delete(peer.id);room.game.disconnect(peer.id,Date.now());
    if(!room.members.size)room.emptyAt=Date.now();
  });
});

let previous=Date.now(),lastPush=0;
const tick=setInterval(()=>{
  const now=Date.now(),dt=Math.min(75,Math.max(0,now-previous));previous=now;
  const broadcast=now-lastPush>=PUSH_MS;
  if(broadcast)lastPush=now;
  for(const [code,room] of rooms){
    if(room.emptyAt&&now-room.emptyAt>45000){rooms.delete(code);continue;}
    room.game.tick(now,dt);
    for(const id of room.leases.keys())if(!room.game.players.has(id))room.leases.delete(id);
    if(broadcast&&room.members.size)publish(room,now);
  }
},TICK_MS);
const heartbeat=setInterval(()=>{
  for(const room of rooms.values())for(const peer of room.members.values()){
    if(!peer.alive)peer.socket.terminate();else{peer.alive=false;peer.socket.ping();}
  }
},18000);

export function secretMissionUpgrade(req:IncomingMessage,socket:Duplex,head:Buffer,allowed:Set<string>){
  if(req.url!=='/'+ENDPOINT)return false;
  if((allowed.size&&(!req.headers.origin||!allowed.has(req.headers.origin)))||sockets.clients.size>=185){socket.destroy();return true;}
  sockets.handleUpgrade(req,socket,head,ws=>sockets.emit('connection',ws));
  return true;
}
export function closeSecretMissionRooms(){
  clearInterval(tick);clearInterval(heartbeat);
  for(const socket of sockets.clients)socket.close(1001,'Restarting');
}
