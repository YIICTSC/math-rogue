import Peer,{type DataConnection,type PeerOptions} from 'peerjs';
import {DedicatedConnection} from '../../services/dedicatedConnection';
import {createHostRoomCode,roomAddress,type OnlineTransport} from '../../services/onlineTransport';
import {SessionEnd,sendFinalResult} from '../../services/sessionResultDisplay';
import {sessionResult} from '../../services/sessionResults';
import {addPlayer,command,createBasketball,disconnectPlayer,MAX_MEMBERS,rematch,setSpectator,startBasketball,tick,viewFor} from './engine';
import type {LessonFactory,BasketCommand,BasketView,BasketWorld} from './types';
import type {LessonSelection} from '../gakuro-kart/questions';
import {validLesson} from '../gakuro-kart/learning';
import {BASKETBALL_PROTOCOL,validView} from './protocol';
const prefix='gakuro-basketball-v1-';
export class BasketRoom{
 selfId='local';code='';host=false;transport:OnlineTransport='host';
 private world:BasketWorld|null=null;private lastView:BasketView|null=null;private factory?:LessonFactory;
 private peer:Peer|null=null;private dedicated:DedicatedConnection|null=null;private channels=new Map<string,DataConnection>();
 private timer:ReturnType<typeof setInterval>|null=null;private pending=new Set<ReturnType<typeof setTimeout>>();private cancel=new Set<()=>void>();private closed=false;
 private sequence=0;private received=-1;private lastPacket=0;private observed:string|null=null;
 private ending=new SessionEnd('basketball',()=>this.close(false));
 get serverHosted(){return !!this.dedicated;}
 constructor(private update:(v:BasketView|null)=>void,private status:(s:string)=>void){}
 private packet(c:DataConnection,data:object){if(c.open&&(c.dataChannel?.bufferedAmount||0)<131072)try{c.send(JSON.stringify(data));}catch{c.close();}}
 private emit(){if(this.closed||!this.world)return;this.lastView=viewFor(this.world,this.selfId,this.observed);this.update(this.lastView);const sequence=++this.sequence;for(const c of this.channels.values())if(this.world.players[c.peer]?.connected)this.packet(c,{type:'state',version:BASKETBALL_PROTOCOL,sequence,view:viewFor(this.world,c.peer,this.observations.get(c.peer))});}
 private observations=new Map<string,string|null>();
 private visibility=()=>{if(this.world){this.world.paused=document.hidden;this.emit();}};
 private run(){let last=performance.now(),acc=0,broadcast=0;document.addEventListener('visibilitychange',this.visibility);this.visibility();this.timer=setInterval(()=>{const now=performance.now(),dt=Math.min(.2,(now-last)/1000);last=now;acc+=dt;while(acc>=1/60){if(this.world)try{tick(this.world,1/60,this.factory);}catch{this.status('問題を準備できませんでした。');this.world.paused=true;}acc-=1/60;}broadcast+=dt;if(broadcast>=.1){broadcast=0;this.emit();}},1000/60);}
 practice(name:string){if(this.closed)return;this.host=true;this.world=createBasketball(crypto.getRandomValues(new Uint32Array(1))[0],true);addPlayer(this.world,this.selfId,name);this.run();}
 private async open(id?:string){
  const env=import.meta.env,options:PeerOptions=env.VITE_RPG_PEER_HOST?{host:env.VITE_RPG_PEER_HOST,port:Number(env.VITE_RPG_PEER_PORT||443),path:env.VITE_RPG_PEER_PATH||'/',secure:env.VITE_RPG_PEER_SECURE!=='false'}:{};
  const ice=env.VITE_BASKETBALL_ICE_SERVERS||env.VITE_GOLF_ICE_SERVERS||env.VITE_KART_ICE_SERVERS;if(ice)options.config={iceServers:JSON.parse(ice)};
  const peer=id?new Peer(id,options):new Peer(options);this.peer=peer;
  await new Promise<void>((resolve,reject)=>{let settled=false;const finish=(error?:Error)=>{if(settled)return;settled=true;clearTimeout(timer);this.pending.delete(timer);this.cancel.delete(abort);error?reject(error):resolve();},abort=()=>finish(new Error('接続を終了しました。')),timer=setTimeout(()=>finish(new Error('接続がタイムアウトしました。')),25000);this.pending.add(timer);this.cancel.add(abort);peer.once('open',()=>finish());peer.once('error',e=>finish(new Error(`Network: ${e.type}`)));});
  if(this.closed){peer.destroy();throw new Error('接続を終了しました。');}
  peer.on('error',e=>{if(!this.closed)this.status(`Network: ${e.type}`);});peer.on('disconnected',()=>{if(!this.closed&&!peer.destroyed)peer.reconnect();});this.selfId=peer.id;return peer;
 }
 private accept(v:unknown,sequence:unknown){if(!Number.isInteger(sequence)||Number(sequence)<=this.received||!validView(v)||!v.players.some(p=>p.id===this.selfId))return false;this.received=Number(sequence);this.lastPacket=performance.now();this.lastView=v;this.update(v);return true;}
 private async server(hello:object){const next=new DedicatedConnection(packet=>{if(this.ending.receive(packet))return true;if(this.closed)return false;if(packet.type==='connected'){if(typeof packet.id==='string'&&typeof packet.code==='string'&&/^[A-Z0-9]{6}$/.test(packet.code)){this.selfId=packet.id;this.code=packet.code;this.host=packet.host===true;}}if(packet.type==='error')this.status(packet.message);if(['state','init'].includes(packet.type)&&packet.version===BASKETBALL_PROTOCOL){if(typeof packet.hostId==='string')this.host=packet.hostId===this.selfId;return this.accept(packet.state,packet.sequence);}return false;},()=>{if(!this.closed){this.close(false);this.update(null);this.status('サーバーとの接続が終了しました。部屋に入り直してください。');}});this.dedicated=next;await next.open('basketball',{...hello,protocol:BASKETBALL_PROTOCOL});}
 async create(name:string){if(this.transport==='server'){await this.server({create:true,name});return;}this.host=true;this.code=createHostRoomCode();const peer=await this.open(prefix+this.code);this.world=createBasketball(crypto.getRandomValues(new Uint32Array(1))[0]);addPlayer(this.world,this.selfId,name);
  peer.on('connection',c=>{if(this.closed||this.channels.has(c.peer)||this.channels.size>=MAX_MEMBERS-1){c.close();return;}this.channels.set(c.peer,c);let admitted=false,at=performance.now(),count=0;const timeout=setTimeout(()=>{if(!admitted)c.close();this.pending.delete(timeout);},25000);this.pending.add(timeout);
   c.on('data',raw=>{if(this.closed||!this.world||typeof raw!=='string'||raw.length>2048)return;const now=performance.now();if(now-at>1000){at=now;count=0;}if(++count>85)return;let d:any;try{d=JSON.parse(raw);}catch{return;}if(!d||typeof d!=='object')return;
    if(d.type==='hello'){if(admitted||d.version!==BASKETBALL_PROTOCOL||!addPlayer(this.world,c.peer,d.name)){this.packet(c,{type:'error',message:'参加できません。部屋の空き人数を確認してください。'});return;}admitted=true;clearTimeout(timeout);this.pending.delete(timeout);this.emit();}
    else if(admitted&&d.type==='command')this.apply(c.peer,d.command);
    else if(admitted&&d.type==='observe'){this.observations.set(c.peer,typeof d.id==='string'?d.id:null);}
    else if(admitted&&d.type==='spectator'){if(setSpectator(this.world,c.peer,d.enabled))this.emit();}
   });
   let dropped=false;const drop=()=>{if(dropped)return;dropped=true;clearTimeout(timeout);this.pending.delete(timeout);this.channels.delete(c.peer);this.observations.delete(c.peer);if(this.world)disconnectPlayer(this.world,c.peer);this.emit();};c.on('close',drop);c.on('error',drop);
  });this.run();
 }
 async join(code:string,name:string){const address=roomAddress(code,this.transport);this.transport=address.transport;this.code=address.code;if(!/^[A-Z0-9]{6}$/.test(this.code))throw new Error('6桁の数字の招待コードを入力してください。');if(this.transport==='server'){await this.server({create:false,code:this.code,name});return;}
  const peer=await this.open(),c=peer.connect(prefix+this.code,{reliable:true,serialization:'raw'});this.channels.set('host',c);
  await new Promise<void>((resolve,reject)=>{let settled=false;const finish=(error?:Error)=>{if(settled)return;settled=true;clearTimeout(timer);this.pending.delete(timer);this.cancel.delete(abort);error?reject(error):resolve();},abort=()=>finish(new Error('接続を終了しました。')),timer=setTimeout(()=>finish(new Error('部屋が見つからないか、接続できません。')),25000);this.pending.add(timer);this.cancel.add(abort);
   c.on('open',()=>this.packet(c,{type:'hello',version:BASKETBALL_PROTOCOL,name:name.slice(0,16)}));
   c.on('data',raw=>{if(this.closed||typeof raw!=='string'||raw.length>160000)return;let d:any;try{d=JSON.parse(raw);}catch{return;}if(this.ending.receive(d)){finish();return;}if(d?.type==='error'){finish(new Error(d.message||'Connection rejected'));return;}if(d?.type==='state'&&d.version===BASKETBALL_PROTOCOL&&this.accept(d.view,d.sequence))finish();});
   const lost=()=>{finish(new Error('ホストとの接続が終了しました。'));if(!this.closed){this.close(false);this.update(null);this.status('ホストとの接続が終了しました。部屋に入り直してください。');}};c.on('close',lost);c.on('error',lost);
  });this.timer=setInterval(()=>{if(performance.now()-this.lastPacket>15000){this.close(false);this.update(null);this.status('通信が途切れました。部屋に入り直してください。');}},1000);
 }
 pause(enabled:boolean){if(this.world?.practice){this.world.paused=enabled;this.emit();}}
 setLesson(factory:LessonFactory,selection?:LessonSelection){if(this.closed||!this.host)return;if(this.dedicated){if(selection)this.dedicated.send({type:'lesson',selection});return;}if(!this.world||this.world.phase!=='lobby')return;const sample=factory([]);if(!validLesson(sample))throw new Error('問題を準備できませんでした。');this.factory=factory;this.world.title=sample.title;this.emit();}
 setSpectator(enabled:boolean){if(this.closed)return;if(this.dedicated){this.dedicated.send({type:'spectator',enabled});return;}if(this.host){if(this.world&&setSpectator(this.world,this.selfId,enabled))this.emit();}else{const c=this.channels.get('host');if(c)this.packet(c,{type:'spectator',enabled});}}
 observe(id:string|null){this.observed=id;if(this.dedicated)this.dedicated.send({type:'observe',id});else if(this.host)this.emit();else{const c=this.channels.get('host');if(c)this.packet(c,{type:'observe',id});}}
 start(){if(this.closed||!this.host)return;if(this.dedicated){this.dedicated.send({type:'start'});return;}if(this.world&&this.factory&&startBasketball(this.world,this.factory))this.emit();}
 rematch(){if(this.closed||!this.host)return;if(this.dedicated){this.dedicated.send({type:'rematch'});return;}if(this.world&&rematch(this.world))this.emit();}
 private apply(id:string,c:unknown){if(!this.world)return;try{if(command(this.world,id,c,this.factory)&&(c as any)?.type!=='move')this.emit();}catch{this.status('問題を準備できませんでした。');}}
 send(c:BasketCommand){if(this.closed)return;if(this.dedicated){this.dedicated.send({type:'command',command:c});return;}if(this.host)this.apply(this.selfId,c);else{const channel=this.channels.get('host');if(channel)this.packet(channel,{type:'command',command:c});}}
 close(results=true){if(this.closed)return;const snapshot=this.world||this.lastView;if(results&&this.host&&this.code&&this.ending.end(snapshot?sessionResult('basketball',snapshot):null,this.dedicated,packet=>sendFinalResult(this.channels.values(),packet)))return;this.closed=true;this.dedicated?.close();this.dedicated=null;this.cancel.forEach(c=>c());this.cancel.clear();this.pending.forEach(clearTimeout);this.pending.clear();if(this.timer)clearInterval(this.timer);document.removeEventListener('visibilitychange',this.visibility);this.channels.forEach(c=>c.close());this.channels.clear();this.peer?.destroy();this.world=null;}
}
