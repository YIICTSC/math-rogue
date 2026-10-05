import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import {randomInt,randomUUID} from 'node:crypto';
import {WebSocket,WebSocketServer} from 'ws';
import * as kart from '../src/mini-games/gakuro-kart/engine';
import {roster,encodeSnapshot} from '../src/mini-games/gakuro-kart/protocol';
import {validAvatar} from '../src/mini-games/gakuro-kart/avatar';
import {validLesson,type KartQuestion} from '../src/mini-games/gakuro-kart/learning';
import {COURSES,validCustomCourse} from '../src/mini-games/gakuro-kart/track';
import * as craft from '../src/mini-games/gakuro-craft/engine';
import {avatarOf} from '../src/mini-games/gakuro-craft/avatar';
import {MAP_WIDTH,MAP_HEIGHT} from '../src/mini-games/gakuro-craft/map';
import {homeAt,publicHome,roomTile} from '../src/mini-games/gakuro-craft/homeSocial';
import {loadIsland,type Saved} from '../src/mini-games/gakuro-craft/save';

type Member={observedId?:string;id:string;socket:WebSocket;revision:number;alive:boolean;at:number;count:number};
type Base={host:string;members:Map<string,Member>;emptyAt:number;broadcast:number;simulation:number};
type KartRoom=Base & {game:'kart';world:kart.Race;sequence:number};
type CraftRoom=Base & {game:'craft';world:craft.World;bank:craft.QuizBank;title:string;savedAt:number};
type Room=KartRoom|CraftRoom;
const rooms=new Map<string,Room>();
const sockets=new WebSocketServer({noServer:true,maxPayload:10*1024*1024,perMessageDeflate:false});
const send=(m:Member,data:unknown)=>{if(m.socket.readyState!==WebSocket.OPEN)return false;m.socket.send(JSON.stringify(data));return true;};
const error=(m:Member,message:string)=>send(m,{type:'error',message});
function remember(w:craft.World,id:string){const p=w.players[id];if(p)w.residents[p.profileId]={id:p.id,bag:{...p.bag},coins:p.coins,energy:p.energy,correct:p.correct,progress:structuredClone(p.progress)};}
function checkpoint(r:CraftRoom){
  for(const id of Object.keys(r.world.players))remember(r.world,id);
  const p=r.world.players[r.host],host=r.members.get(r.host);if(!p||!host||host.socket.bufferedAmount>65536)return;
  if(host.revision!==r.world.revision)publish(r);
  if(host.revision!==r.world.revision)return;
  // The host already has authoritative terrain patches; avoid resending the island.
  send(host,{type:'checkpoint',saved:{version:1,world:{...r.world,tiles:[],players:{},games:{},homeViews:{}},owner:r.host,player:p} satisfies Saved});
}
function craftState(r:CraftRoom,m:Member,shared:unknown[]){
  const w=r.world,viewer=w.players[m.id],p=viewer?.spectator&&r.host===m.id&&m.observedId&&!w.players[m.observedId]?.spectator?w.players[m.observedId]:viewer,tile=p?roomTile(p):-1,home=p?.indoors?homeAt(w,tile):undefined;
  return {type:'state',players:shared,time:w.time,paused:false,revision:w.revision,donated:w.donated,harvested:w.harvested,built:w.built,villageLevel:w.villageLevel,builtSites:w.builtSites,progress:viewer?.progress,coins:viewer?.coins,bag:viewer?.bag,games:Object.fromEntries(Object.entries(w.games).filter(([,g])=>g.homeTile===tile&&p?.indoors)),roomHome:home?publicHome(home):null};
}
function publish(r:Room){
  if(r.game==='kart'){
    const metadata=JSON.stringify(roster(r.world)),packet=Buffer.from(encodeSnapshot(r.world,++r.sequence));
    for(const m of r.members.values()){
      if(m.socket.readyState!==WebSocket.OPEN||m.socket.bufferedAmount>16384)continue;
      if(m.revision!==r.world.revision){m.socket.send(metadata);m.revision=r.world.revision;}
      m.socket.send(packet,{binary:true});
    }
  }else{
    const shared=Object.values(r.world.players).map(p=>[p.id,p.name,p.color,+p.x.toFixed(3),+p.z.toFixed(3),+p.energy.toFixed(2),p.correct,p.actions,p.avatar,p.lastAction,p.buffUntil,p.fishing,p.indoors,p.homeTile,p.spectator]);
    const patches=new Map<number,string[]>();
    for(const m of r.members.values()){
      if(m.socket.readyState!==WebSocket.OPEN||m.socket.bufferedAmount>65536)continue;
      let packets=patches.get(m.revision);
      if(!packets){const changed=r.world.tiles.flatMap((t,i)=>t.revision>m.revision?[[i,t]]:[]);packets=[];for(let i=0;i<changed.length;i+=64)packets.push(JSON.stringify({type:'tiles',entries:changed.slice(i,i+64)}));patches.set(m.revision,packets);}
      for(const packet of packets)m.socket.send(packet);
      send(m,craftState(r,m,shared));m.revision=r.world.revision;
    }
  }
}
function questionValid(q:any){return q&&typeof q.id==='string'&&typeof q.mode==='string'&&typeof q.question==='string'&&q.question.length<=12000&&Array.isArray(q.options)&&q.options.length===4&&q.options.every((s:any)=>typeof s==='string'&&s.length<=3000)&&Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4;}
sockets.on('connection',(socket,request)=>{
  const game=request.url==='/kart'?'kart':'craft';
  const m:Member={id:randomUUID(),socket,revision:0,alive:true,at:Date.now(),count:0};
  let room:Room|undefined;
  const handshake=setTimeout(()=>{if(!room)socket.close(1008,'Handshake timeout');},20000);
  socket.on('pong',()=>{m.alive=true;});socket.on('error',()=>{});
  socket.on('message',raw=>{
    let d:any;try{d=JSON.parse(raw.toString());}catch{return;}
    if(!d||typeof d!=='object'||Array.isArray(d))return;
    const now=Date.now();if(now-m.at>=1000){m.at=now;m.count=0;}if(++m.count>45)return;
    if(d.type==='ping'){send(m,{type:'pong'});return;}
    try{
      if(!room){
        if(d.type!=='connect'||d.protocol!==1||typeof d.name!=='string')return;
        if(game==='kart'&&(!validAvatar(d.avatar)||!Number.isInteger(d.hero)||d.hero<0||d.hero>2)){error(m,'キャラクター設定が不正です。');return;}
        if(game==='craft'&&(typeof d.profileId!=='string'||! /^[A-Za-z0-9-]{8,64}$/.test(d.profileId))){error(m,'プロフィールが不正です。');return;}
        let code:string;
        if(d.create){
          if(rooms.size>=4){error(m,'サーバーの部屋数上限です。');return;}
          const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';do{code=Array.from({length:6},()=>alphabet[randomInt(alphabet.length)]).join('');}while(rooms.has(code));
          const base:Base={host:m.id,members:new Map(),emptyAt:0,broadcast:0,simulation:0};
          if(game==='kart'){
            if(!Number.isInteger(d.course)||d.course<0||d.course>=COURSES.length){error(m,'コースが不正です。');return;}
            if(d.customCourse!==undefined&&(!validCustomCourse(d.customCourse)||d.customCourse.theme!==d.course)){error(m,'コースが不正です。');return;}
            room={...base,game,world:kart.createRace(d.course,randomInt(0x100000000),3,d.customCourse),sequence:0};
          }else{
            if(!Array.isArray(d.questions)||!d.questions.length||d.questions.length>2000||!d.questions.every(questionValid)){error(m,'問題設定が不正です。');return;}
            const saved=d.saved?loadIsland(JSON.stringify(d.saved)):null;
            if(d.saved&&!saved){error(m,'保存した島を読み込めませんでした。');return;}
            const world=saved?{...saved.world,players:{},paused:false}:craft.createWorld(randomInt(0x100000000));
            if(saved){const p=saved.player;world.residents[d.profileId]={id:saved.owner,bag:{...p.bag},coins:p.coins,energy:p.energy,correct:p.correct,progress:p.progress};}
            room={...base,game,world,bank:new craft.QuizBank(d.questions as KartQuestion[]),title:String(d.title||'').slice(0,160),savedAt:world.time};
          }
          rooms.set(code,room);
        }else{
          code=typeof d.code==='string'?d.code.trim().toUpperCase():'';room=rooms.get(code);
          if(!room||room.game!==game){room=undefined;error(m,'部屋が見つかりません。');return;}
        }
        if(room.members.size>=40){room=undefined;error(m,'部屋は満員です（最大40人）。');return;}
        const admitted=room.game==='kart'?kart.addRacer(room.world,m.id,d.name,d.hero):craft.addPlayer(room.world,m.id,d.name,d.color,avatarOf(d.avatar,d.color),d.profileId);
        if(!admitted){room=undefined;error(m,'参加できません。空き人数、終了状態、プロフィールを確認してください。');return;}
        if(room.game==='kart')room.world.players[m.id].avatar={...d.avatar};
        room.members.set(m.id,m);room.emptyAt=0;clearTimeout(handshake);
        send(m,{type:'connected',id:m.id,code,host:room.host===m.id});
        if(room.game==='craft')send(m,{type:'init',version:8,seed:room.world.seed,width:MAP_WIDTH,height:MAP_HEIGHT,title:room.title});
        publish(room);if(room.game==='craft'&&room.host===m.id)checkpoint(room);return;
      }
      if(d.type==='spectator' && room.host===m.id && typeof d.enabled==='boolean'){
        if(room.game==='kart')kart.setSpectator(room.world,m.id,d.enabled);
        else {craft.setSpectator(room.world,m.id,d.enabled);room.bank.forget(m.id);}
        m.observedId=undefined;publish(room);return;
      }
      if(d.type==='observe' && room.game==='craft' && room.host===m.id && room.world.players[m.id]?.spectator){
        m.observedId=typeof d.id==='string'&&room.world.players[d.id]&&!room.world.players[d.id].spectator?d.id:undefined;publish(room);return;
      }
      if(room.game==='kart'){
        const w=room.world;
        if(d.type==='command'){kart.command(w,m.id,d.command);return;}
        if(d.type==='avatar'&&w.phase==='lobby'&&validAvatar(d.avatar)){w.players[m.id].avatar={...d.avatar};w.revision++;publish(room);return;}
        if(room.host!==m.id)return;
        if(d.type==='lesson'&&w.phase==='lobby'&&validLesson(d.lesson)){w.lesson=structuredClone(d.lesson);w.revision++;}
        if(d.type==='laps')kart.setRaceLaps(w,d.laps);
        if(d.type==='start')kart.startRace(w,!!d.fill);
        if(d.type==='rematch'&&w.phase==='result'&&Number.isInteger(d.course)&&d.course>=0&&d.course<COURSES.length&&Number.isInteger(d.laps)&&d.laps>=1&&d.laps<=5){
          if(d.customCourse!==undefined&&(!validCustomCourse(d.customCourse)||d.customCourse.theme!==d.course)){error(m,'コースが不正です。');return;}
          const next=kart.createRace(d.course,w.seed+1,d.laps,d.customCourse);next.lesson=validLesson(d.lesson)?structuredClone(d.lesson):w.lesson;next.revision=w.revision+1;
          for(const p of Object.values(w.players)){kart.addRacer(next,p.id,p.name,p.hero,p.cpu);next.players[p.id].avatar={...p.avatar};next.players[p.id].spectator=p.spectator;}kart.startRace(next);room.world=next;
        }
        publish(room);
      }else if(d.type==='command'&&d.command&&typeof d.command==='object'){
        const c=d.command;
        const reply=c.type==='quiz'?room.bank.ask(room.world,m.id):c.type==='answer'?room.bank.answer(room.world,m.id,c.token,c.option):craft.applyCommand(room.world,m.id,c);
        if(reply)send(m,{type:'reply',reply});
        if(c.type!=='move')publish(room);
      }
    }catch{error(m,'操作を処理できませんでした。');}
  });
  socket.on('close',()=>{
    clearTimeout(handshake);if(!room)return;
    if(room.game==='craft'){remember(room.world,m.id);room.bank.forget(m.id);if(m.id===room.host)checkpoint(room);delete room.world.players[m.id];}
    else{const p=room.world.players[m.id];if(p){if(room.world.phase==='lobby')delete room.world.players[m.id];else{p.cpu=true;p.name=`${p.name.slice(0,10)} [BOT]`;}room.world.revision++;}}
    room.members.delete(m.id);
    // Reassign room controls if the teacher leaves; the server keeps simulating.
    if(m.id===room.host&&room.members.size){room.host=room.members.keys().next().value!;for(const member of room.members.values())send(member,{type:'host',host:member.id===room.host});}
    if(!room.members.size)room.emptyAt=Date.now();else publish(room);
  });
});
let previous=performance.now();
const timer=setInterval(()=>{
  const now=performance.now(),dt=Math.min(.15,(now-previous)/1000);previous=now;
  for(const [code,r]of rooms){if(r.emptyAt&&Date.now()-r.emptyAt>60000){rooms.delete(code);continue;}if(!r.members.size)continue;
    r.simulation+=dt;const step=r.game==='kart'?1/60:.05;
    while(r.simulation>=step){if(r.game==='kart')kart.tick(r.world,step);else craft.tick(r.world,step);r.simulation-=step;}
    r.broadcast+=dt;if(r.broadcast>=(r.game==='kart'?.1:.15)){r.broadcast=0;publish(r);}
    if(r.game==='craft'&&r.world.time-r.savedAt>=5){checkpoint(r);r.savedAt=r.world.time;}
  }
},1000/60);
const heartbeat=setInterval(()=>{for(const r of rooms.values())for(const m of r.members.values()){if(!m.alive)m.socket.terminate();else{m.alive=false;m.socket.ping();}}},30000);
export function miniUpgrade(req:IncomingMessage,socket:Duplex,head:Buffer,allowed:Set<string>){
  if(!['/kart','/craft'].includes(req.url||''))return false;
  if((allowed.size&&(!req.headers.origin||!allowed.has(req.headers.origin)))||sockets.clients.size>=160){socket.destroy();return true;}
  sockets.handleUpgrade(req,socket,head,ws=>sockets.emit('connection',ws,req));return true;
}
export function closeMiniRooms(){clearInterval(timer);clearInterval(heartbeat);for(const s of sockets.clients)s.close(1001,'Server restarting');}
