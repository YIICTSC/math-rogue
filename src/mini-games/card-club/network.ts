import Peer, { type DataConnection, type PeerOptions } from 'peerjs';
import { createHostRoomCode, normalizeRoomInput } from '../../services/onlineTransport';
import { ClubSession, validProfile, type ClubPacket } from './session';
import type { Action, PlayerInput } from './model';
import type { GameId } from './catalog';
import { shouldReportPeerError } from './networkPolicy';

const PROTOCOL=5;
type Profile=Pick<PlayerInput,'name'|'hero'>;
export class CardClubRoom {
  private peer:Peer|null=null;private session:ClubSession|null=null;private channels=new Map<string,DataConnection>();private cpuTimer:ReturnType<typeof setInterval>|null=null;private timers=new Set<ReturnType<typeof setTimeout>>();
  private closed=false;private controller=new AbortController();private connecting=false;selfId='local';code='';host=false;last:ClubPacket|null=null;
  constructor(private update:(packet:ClubPacket)=>void,private status:(message:string)=>void){}
  private notify=(packet:ClubPacket)=>{if(this.closed)return;this.last=packet;this.update(packet);};
  private send(c:DataConnection,data:unknown){try{if(c.open)c.send(JSON.stringify(data));}catch{this.status('NETWORK_ERROR');}}
  private beginSession(profile:Profile){
    this.session=new ClubSession(this.selfId,this.code,(id,packet)=>{if(id===this.selfId)this.notify(packet);else{const c=this.channels.get(id);if(c)this.send(c,{type:'state',packet});}});
    this.session.join({id:this.selfId,...profile,cpu:false});this.cpuTimer=setInterval(()=>this.session?.tick(),550);
  }
  practice(profile:Profile){this.host=true;this.beginSession(profile);}
  private async open(id?:string){
    const env=import.meta.env,options:PeerOptions=env.VITE_RPG_PEER_HOST?{host:env.VITE_RPG_PEER_HOST,port:Number(env.VITE_RPG_PEER_PORT||443),path:env.VITE_RPG_PEER_PATH||'/',secure:env.VITE_RPG_PEER_SECURE!=='false'}:{};
    if(env.VITE_KART_ICE_SERVERS){try{options.config={iceServers:JSON.parse(env.VITE_KART_ICE_SERVERS)};}catch{throw Error('ICE_CONFIG_ERROR');}}
    const peer=id?new Peer(id,options):new Peer(options);this.peer=peer;
    await new Promise<void>((resolve,reject)=>{
      const finish=(error?:Error)=>{clearTimeout(timer);this.timers.delete(timer);this.controller.signal.removeEventListener('abort',abort);error?reject(error):resolve();};
      const abort=()=>finish(Error('CLOSED'));const timer=setTimeout(()=>finish(Error('TIMEOUT')),18000);this.timers.add(timer);this.controller.signal.addEventListener('abort',abort,{once:true});
      peer.once('open',()=>finish());peer.once('error',e=>finish(Error(e.type)));
    });
    if(this.closed){peer.destroy();throw Error('CLOSED');}this.selfId=peer.id;
    peer.on('error',e=>{if(!this.closed&&shouldReportPeerError(e.type,this.last?.phase==='game'&&this.last.view.phase!=='result',[...this.channels.values()].filter(c=>c.open).length))this.status('NETWORK_ERROR');});peer.on('disconnected',()=>{if(!this.closed&&!peer.destroyed)peer.reconnect();});return peer;
  }
  async create(profile:Profile){
    if(this.connecting||this.closed)return;this.connecting=true;this.host=true;
    try{
      let peer:Peer|undefined;
      for(let attempt=0;attempt<3;attempt++){this.code=createHostRoomCode();try{peer=await this.open(`learning-card-club-v${PROTOCOL}-${this.code}`);break;}catch(e){this.peer?.destroy();if(String(e).includes('unavailable-id')&&attempt<2)continue;throw e;}}
      if(!peer)throw Error('NETWORK_ERROR');this.beginSession(profile);
      peer.on('connection',c=>{
        if(this.closed||this.channels.size>=7){c.close();return;}this.channels.set(c.peer,c);
        const timer=setTimeout(()=>{if(!this.session?.members.some(p=>p.id===c.peer))c.close();this.timers.delete(timer);},12000);this.timers.add(timer);
        let windowAt=0,count=0;
        c.on('data',raw=>{
          if(this.closed||typeof raw!=='string'||raw.length>4096)return;
          const now=Date.now();if(now-windowAt>1000){windowAt=now;count=0;}if(++count>25)return;
          let d:any;try{d=JSON.parse(raw);}catch{return;}if(!d||typeof d!=='object'||Array.isArray(d))return;
          if(d.type==='hello'){
            const p={id:c.peer,name:d.name,hero:d.hero,cpu:false};
            if(d.protocol!==PROTOCOL||!validProfile(p)||!this.session?.join(p)){this.send(c,{type:'error',message:'ROOM_FULL_OR_STARTED'});return;}
            clearTimeout(timer);this.timers.delete(timer);
          }else if(d.type==='action'&&d.action&&typeof d.action==='object')this.session?.command(c.peer,d.action,d.revision);
          else if(d.type==='leave')c.close();
        });
        c.on('close',()=>{clearTimeout(timer);this.timers.delete(timer);this.channels.delete(c.peer);this.session?.leave(c.peer);});c.on('error',()=>c.close());
      });
    }finally{this.connecting=false;}
  }
  async join(profile:Profile,code:string){
    if(this.connecting||this.closed)return;this.connecting=true;
    try{
      this.code=normalizeRoomInput(code);if(!/^\d{6}$/.test(this.code))throw Error('INVALID_CODE');
      const peer=await this.open(),c=peer.connect(`learning-card-club-v${PROTOCOL}-${this.code}`,{reliable:true});this.channels.set('host',c);
      await new Promise<void>((resolve,reject)=>{
        let admitted=false;const timer=setTimeout(()=>{reject(Error('TIMEOUT'));c.close();this.timers.delete(timer);},20000);this.timers.add(timer);
        c.on('open',()=>this.send(c,{type:'hello',protocol:PROTOCOL,...profile}));
        c.on('data',raw=>{if(this.closed||typeof raw!=='string'||raw.length>500000)return;let d:any;try{d=JSON.parse(raw);}catch{return;}
          if(d?.type==='state'&&d.packet?.selfId===this.selfId){admitted=true;clearTimeout(timer);this.timers.delete(timer);this.notify(d.packet);resolve();}
          else if(d?.type==='error'){clearTimeout(timer);this.timers.delete(timer);reject(Error(d.message));}
        });
        c.on('close',()=>{clearTimeout(timer);this.timers.delete(timer);if(!this.closed){if(this.last?.phase!=='game'||this.last.view.phase!=='result')this.status('HOST_DISCONNECTED');if(!admitted)reject(Error('HOST_DISCONNECTED'));}});
        c.on('error',()=>{clearTimeout(timer);this.timers.delete(timer);reject(Error('NETWORK_ERROR'));});
      });
    }finally{this.connecting=false;}
  }
  configure(game:GameId,count:number){if(this.host)this.session?.configure(game,count);}
  start(){if(this.host)this.session?.start(crypto.getRandomValues(new Uint32Array(1))[0]);}
  command(action:Action){const revision=this.last?.phase==='game'?this.last.view.revision:-1;if(this.host)this.session?.command(this.selfId,action,revision);else{const c=this.channels.get('host');if(c)this.send(c,{type:'action',action,revision});}}
  rematch(){if(this.host)this.session?.rematch();}
  finish(){if(this.host)this.session?.finish();}
  close(){
    if(this.closed)return;this.closed=true;this.controller.abort();if(this.cpuTimer)clearInterval(this.cpuTimer);for(const t of this.timers)clearTimeout(t);this.timers.clear();
    // End snapshots are sent before callers leave the screen. Data channels are
    // closed after a short drain, so the last result is not discarded.
    const peer=this.peer,channels=[...this.channels.values()];this.peer=null;this.channels.clear();setTimeout(()=>{for(const c of channels)c.close();peer?.destroy();},250);
  }
}
