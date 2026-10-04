import { createServer } from 'node:http';
import { randomInt, randomUUID } from 'node:crypto';
import { WebSocket, WebSocketServer } from 'ws';
import { addPlayer, applyAction, advanceWorld, createWorld, removePlayer, setSpectator, validProfile, type World } from '../src/rpg/engine';
import { normalizeRpgAdventureSetup } from '../src/rpg/setup';
import {miniUpgrade,closeMiniRooms} from './miniRooms';
import {golfUpgrade,closeGolfRooms} from './golfRooms';

type Member = { socket: WebSocket; id: string; admitted: boolean; name: string; alive: boolean; at: number; count: number; stateRevision?:number };
type Room = { world: World; host: string; members: Map<string, Member>; revision: number; emptyAt: number; heroCache?: Map<string,World["players"][string]["hero"]> };
const rooms = new Map<string, Room>();
const allowed = new Set((process.env.ALLOWED_ORIGINS || '').split(',').map(s=>s.trim()).filter(Boolean));
const server = createServer((req,res)=>{
  res.setHeader('Content-Type','application/json');
  res.writeHead(req.url === '/health' ? 200 : 404);
  res.end(JSON.stringify(req.url === '/health' ? {ok:true,service:'learning-rogue',protocol:1,rooms:rooms.size} : {error:'not found'}));
});
const sockets = new WebSocketServer({noServer:true,maxPayload:512*1024,perMessageDeflate:false});
server.on('upgrade',(req,socket,head)=>{if(miniUpgrade(req,socket,head,allowed))return;if(golfUpgrade(req,socket,head,allowed))return;if(req.url!=='/online'){socket.destroy();return;}sockets.handleUpgrade(req,socket,head,ws=>sockets.emit('connection',ws,req));});
function send(m: Member, packet: unknown) {
  if(m.socket.readyState !== WebSocket.OPEN) return;
  m.socket.send(JSON.stringify(packet));
}
function init(room: Room,m: Member) {send(m,{type:'init',world:{...room.world,tiles:room.world.tiles.join(',')}});m.stateRevision=room.world.revision;}
function fail(m: Member,message: string) {send(m,{type:'error',message});}
sockets.on('connection',(socket,request)=>{
  if(allowed.size && (!request.headers.origin || !allowed.has(request.headers.origin))) {socket.close(1008,'Origin denied');return;}
  if(sockets.clients.size>160) {socket.close(1013,'Server busy');return;}
  const m: Member={socket,id:randomUUID(),admitted:false,name:'',alive:true,at:Date.now(),count:0};
  let room: Room | undefined;
  const timeout=setTimeout(()=>{if(!room)socket.close(1008,'Handshake timeout');},15000);
  socket.on('pong',()=>{m.alive=true;});
  socket.on('message',raw=>{
    let d: any;try{d=JSON.parse(raw.toString());}catch{return;}
    if(!d || typeof d !== 'object' || Array.isArray(d))return;
    const now=Date.now();if(now-m.at>=1000){m.at=now;m.count=0;}if(++m.count>35)return;
    if(d.type==='ping'){send(m,{type:'pong',at:d.at});return;}
    if(!room){
      if(d.type!=='connect' || d.protocol!==1 || typeof d.name!=='string')return;
      m.name=d.name.trim().slice(0,16)||'冒険者';
      let code: string;
      if(d.create){
        if(rooms.size>=4){fail(m,'サーバーの部屋数上限です。');return;}
        const setup=normalizeRpgAdventureSetup(d.setup);
        if(!setup){fail(m,'冒険設定が不正です。');return;}
        const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        do{code=Array.from({length:6},()=>alphabet[randomInt(alphabet.length)]).join('');}while(rooms.has(code));
        const minutes=d.minutes===0?0:Number.isFinite(d.minutes)?Math.min(180,Math.max(1,d.minutes)):30;
        const world=createWorld(randomInt(0x100000000),setup,minutes,now,d.gameMode==='BATTLE_ROYALE'?'BATTLE_ROYALE':'COOP');world.started=false;
        room={world,host:m.id,members:new Map(),revision:-1,emptyAt:0};
        rooms.set(code,room);
      }else{
        code=typeof d.code==='string'?d.code.trim().toUpperCase():'';
        room=rooms.get(code);
        if(!room){fail(m,'部屋が見つかりません。');return;}
      }
      if(room.world.ended){room=undefined;fail(m,'冒険は終了しています。');return;}
      if(room.members.size>=40){room=undefined;fail(m,'部屋は満員です（最大40人）。');return;}
      clearTimeout(timeout);room.emptyAt=0;room.members.set(m.id,m);
      send(m,{type:'connected',id:m.id,code,host:room.host===m.id});
      if(d.prepare && room.host!==m.id){send(m,{type:'lobby',setup:room.world.setup});return;}
      m.admitted=addPlayer(room.world,m.id,m.name);if(m.admitted)init(room,m);return;
    }
    if(d.type==='enter' && !m.admitted && validProfile(d.profile)){
      if(room.world.ended){fail(m,'冒険は終了しています。');setTimeout(()=>socket.close(1008,'Adventure ended'),300);return;}
      m.admitted=addPlayer(room.world,m.id,m.name);
      if(m.admitted){const p=room.world.players[m.id];p.profile=d.profile;p.hp=d.profile.hp;p.maxHp=d.profile.maxHp;p.gold=d.profile.gold;init(room,m);}return;
    }
    if(!m.admitted)return;
    if(d.type==='spectator' && room.host===m.id)setSpectator(room.world,m.id,d.enabled);
    if(d.type==='action' && d.action){try{applyAction(room.world,m.id,d.action);}catch{fail(m,'操作を処理できませんでした。');}}
    if(d.type==='dungeon-event' && d.event && typeof d.event.type==='string'){
      const dungeon=room.world.activities.dungeons.find(x=>x.status==='active'&&x.members.includes(m.id));
      const guest=['COOP_SELF_STATE','COOP_PLAYER_SNAPSHOT','COOP_STATE_SYNC_REQUEST','COOP_REWARD_SYNC_REQUEST','COOP_QUIZ_RESULT','COOP_BATTLE_SELECT_ENEMY','COOP_BATTLE_PLAY_CARD','COOP_BATTLE_USE_POTION','COOP_BATTLE_TURN_START','COOP_BATTLE_SELECTION_STATE','COOP_BATTLE_MODAL_RESOLVE','COOP_BATTLE_CODEX_SELECT','COOP_END_TURN','COOP_NODE_SELECT','COOP_REWARD_SELECT','COOP_REWARD_SKIP','COOP_TREASURE_OPEN','COOP_TREASURE_CLAIM','COOP_EVENT_OPTION','COOP_EVENT_CONTINUE','COOP_REST_ACTION','COOP_SHOP_ACTION','COOP_SUPPORT_USE'];
      if(!dungeon || !d.event.type.startsWith('COOP_') || (dungeon.leader!==m.id && !guest.includes(d.event.type)))return;
      for(const id of dungeon.members){if(id===m.id || (m.id!==dungeon.leader && id!==dungeon.leader) || (m.id===dungeon.leader && d.target && id!==d.target))continue;const target=room.members.get(id);if(target)send(target,{type:'dungeon-event',event:d.event,from:m.id});}
    }
  });
  socket.on('error',()=>{});
  socket.on('close',()=>{clearTimeout(timeout);if(!room)return;room.members.delete(m.id);if(m.admitted)removePlayer(room.world,m.id);if(!room.members.size)room.emptyAt=Date.now();});
});
const tick=setInterval(()=>{
  for(const [code,room]of rooms){
    if(room.emptyAt && Date.now()-room.emptyAt>60000){rooms.delete(code);continue;}
    if(!room.members.size)continue;
    advanceWorld(room.world);
    if(room.revision===room.world.revision&&[...room.members.values()].every(m=>!m.admitted||m.stateRevision===room.world.revision))continue;
    const {tiles,...rest}=room.world;
    const changed:Record<string,World['players'][string]['hero']|null>={};
    room.heroCache??=new Map();
    for(const p of Object.values(room.world.players))if(room.heroCache.get(p.id)!==p.hero){changed[p.id]=p.hero||null;room.heroCache.set(p.id,p.hero);}
    if(Object.keys(changed).length)for(const m of room.members.values())if(m.admitted)send(m,{type:'heroes',heroes:changed});
    for(const id of room.heroCache.keys())if(!room.world.players[id])room.heroCache.delete(id);
    const state={...rest,players:Object.fromEntries(Object.entries(rest.players).map(([id,p])=>{const {hero,...player}=p;return [id,player];}))};
    // Encode shared state once for all 40 players. Slow receivers get the next state.
    const packet=JSON.stringify({type:'state',state});
    for(const m of room.members.values())if(m.admitted && m.socket.readyState===WebSocket.OPEN && m.socket.bufferedAmount<65536){m.socket.send(packet);m.stateRevision=room.world.revision;}
    room.revision=room.world.revision;
  }
},100);
const heartbeat=setInterval(()=>{for(const socket of sockets.clients){const m=[...rooms.values()].flatMap(r=>[...r.members.values()]).find(m=>m.socket===socket);if(!m)continue;if(!m.alive){socket.terminate();continue;}m.alive=false;socket.ping();}},30000);
server.listen(Number(process.env.PORT||10000),'0.0.0.0',()=>console.log('Learning Rogue game server ready'));
process.on('SIGTERM',()=>{clearInterval(tick);clearInterval(heartbeat);closeMiniRooms();closeGolfRooms();for(const s of sockets.clients)s.close(1001,'Server restarting');server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),5000).unref();});
