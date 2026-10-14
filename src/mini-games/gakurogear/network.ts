import {SoloBots} from './soloBots';
import {DedicatedConnection,vrServerUrl} from '../../services/dedicatedConnection';
import {updateVrSettings,type VrSettings} from './roomSettings';
import {roomAddress,shareRoomCode,type OnlineTransport} from '../../services/onlineTransport';
import {vrCommand,clearVrPulses} from './roomCommands';
import {vrPacket,readVrWorld} from './vrProtocol';
import {setVrSpectator,completeQuiz,requestSupply,returnToLobby} from './onlineRules';
import {validAvatar,defaultAvatar,type KartAvatar} from '../gakuro-kart/avatar';
import Peer, { type DataConnection, type PeerOptions } from 'peerjs';
import { validLesson, type KartLesson } from '../gakuro-kart/learning';
import { addPlayer, answer, createWorld, startWorld, retryCoop, tickWorld, validInput, type OnlineMode, type OnlineWorld } from './onlineEngine';
import type { Input } from './engine';
export {vrServerUrl} from '../../services/dedicatedConnection';
export class VrRoom {
  solo=false;private bots:SoloBots|null=null;private soloPaused=false;private soloEditing=false;
  transport:OnlineTransport=vrServerUrl()?'server':'host';
  private dedicated:DedicatedConnection|null=null;
  get shareCode(){return shareRoomCode(this.code,this.transport);}
  host = false; selfId = ''; code = ''; world: OnlineWorld | null = null;
  private peer: Peer | null = null; private connections = new Map<string, DataConnection>(); private timer: ReturnType<typeof setInterval> | null = null;
  private controls: Record<string, Input & { reload?: boolean }> = {}; private lastInput: Record<string, number> = {}; private closed = false;
  constructor(private update: (w: OnlineWorld) => void, private status: (s: string) => void) {}
  private send(c: DataConnection, data: unknown) { if (c.open && (c.dataChannel?.bufferedAmount ?? 0) < 200000) c.send(JSON.stringify(data)); }
  private emit() { if (!this.world || this.closed) return; this.update(structuredClone(this.world)); this.connections.forEach(c=>this.send(c,vrPacket(this.world!))); }
  private visibility = () => { if (this.host && this.world) { this.world.paused = document.hidden||this.soloPaused||this.soloEditing; this.emit(); } };
  private async open(id?: string) {
    const env = import.meta.env;
    const options: PeerOptions = env.VITE_RPG_PEER_HOST ? { host: env.VITE_RPG_PEER_HOST, port: Number(env.VITE_RPG_PEER_PORT || 443), path: env.VITE_RPG_PEER_PATH || '/', secure: env.VITE_RPG_PEER_SECURE !== 'false' } : {};
    const peer = this.peer = id ? new Peer(id, options) : new Peer(options);
    await new Promise<void>((resolve, reject) => { const timeout = setTimeout(() => reject(new Error('Connection timeout')), 15000); peer.once('open', () => { clearTimeout(timeout); resolve(); }); peer.once('error', e => { clearTimeout(timeout); reject(new Error(e.type)); }); });
    if (this.closed) { peer.destroy(); throw new Error('Closed'); } this.selfId = peer.id;
    peer.on('error', e => this.status(`Network: ${e.type}`)); return peer;
  }
  createSolo(name:string,mode:'royale'|'bomb',lesson:KartLesson,limit:number,avatar:KartAvatar=defaultAvatar(),bombMap=0,botCount=3){
    if(this.closed||this.world)throw new Error('Room already created');
    if(!validLesson(lesson,120)||!['royale','bomb'].includes(mode)||!Number.isFinite(limit)||!Number.isInteger(bombMap)||bombMap<0||bombMap>2)throw new Error('Invalid solo battle settings');
    this.solo=this.host=true;this.selfId='solo-player';this.world=createWorld(mode,1,lesson,limit);this.world.bombMap=bombMap;
    addPlayer(this.world,this.selfId,name);this.world.players[this.selfId].avatar=avatar;
    const count=Math.max(1,Math.min(39,Math.floor(Number.isFinite(botCount)?botCount:3))),ids=Array.from({length:count},(_,i)=>`solo-cpu-${i+1}`);
    ids.forEach((id,i)=>{addPlayer(this.world!,id,`CPU ${i+1}`);this.world!.players[id].avatar={...defaultAvatar(),outfit:(i+1)%8,hair:(i+2)%6};});
    this.bots=new SoloBots(ids);startWorld(this.world,crypto.getRandomValues(new Uint32Array(1))[0]);
    document.addEventListener('visibilitychange',this.visibility);let pulses=0;
    this.timer=setInterval(()=>{if(!this.world||this.closed)return;this.bots?.update(this.world,this.controls,.05);tickWorld(this.world,this.controls,.05);clearVrPulses(this.controls);if(++pulses%2===0)this.emit();},50);
    this.emit();
  }
  pauseSolo(paused:boolean){if(!this.solo||!this.world)return;this.soloPaused=paused;this.world.paused=paused||this.soloEditing||document.hidden;this.emit();}
  pauseSoloEditor(paused:boolean){if(!this.solo||!this.world)return;this.soloEditing=paused;this.world.paused=paused||this.soloPaused||document.hidden;this.emit();}
  async create(name: string, mode: OnlineMode, missionId: number, lesson: KartLesson, limit: number, avatar: KartAvatar = defaultAvatar(), bombMap=0) {
    if(this.transport==='server'){await this.connectDedicated({create:true,name,mode,missionId,lesson,limit,avatar,bombMap});return;}
    this.host = true; const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; this.code = Array.from(crypto.getRandomValues(new Uint8Array(6)), n => alphabet[n % alphabet.length]).join('');
    const peer = await this.open(`gakuro-vr-v6-${this.code}`); this.world = createWorld(mode, missionId, lesson, limit); this.world.bombMap=bombMap;addPlayer(this.world, this.selfId, name); this.world.players[this.selfId].avatar = avatar;
    peer.on('connection', c => {
      c.on('data', raw => { if (typeof raw !== 'string' || raw.length > 2000 || !this.world) return; let d: any; try { d = JSON.parse(raw); } catch { return; }
        if (d.type === 'hello' && d.version === 6 && validAvatar(d.avatar) && typeof d.name === 'string' && addPlayer(this.world, c.peer, d.name)) { this.world.players[c.peer].avatar = d.avatar; this.connections.set(c.peer,c);this.send(c,vrPacket(this.world,true));this.emit(); }
        else if (this.world.players[c.peer]) this.receive(c.peer, d);
        else { this.send(c, { type: 'error', text: 'Room full or already started' }); c.close(); }
      });
      c.on('close', () => { this.connections.delete(c.peer); delete this.controls[c.peer]; if (this.world?.players[c.peer]) { if (this.world.phase === 'lobby') delete this.world.players[c.peer]; else this.world.players[c.peer].connected = false; this.emit(); } });
    });
    let pulses = 0; document.addEventListener('visibilitychange', this.visibility);
    this.timer = setInterval(() => { if (!this.world) return; for (const id of Object.keys(this.controls)) if (Date.now() - (this.lastInput[id] ?? 0) > 600) delete this.controls[id]; tickWorld(this.world, this.controls, .05); clearVrPulses(this.controls); if (++pulses % 2 === 0) this.emit(); }, 50); this.emit();
  }
  async join(name: string, code: string, avatar: KartAvatar = defaultAvatar()) {
    const address=roomAddress(code,this.transport);this.transport=address.transport;this.code=address.code;if(this.transport==='server'){await this.connectDedicated({create:false,name,code:this.code,avatar});return;} if (!/^[A-Z2-9]{6}$/.test(this.code)) throw new Error('Invalid room code');
    const peer = await this.open(); const c = peer.connect(`gakuro-vr-v6-${this.code}`, { reliable: true }); this.connections.set('host', c);
    await new Promise<void>((resolve, reject) => { const timeout = setTimeout(() => reject(new Error('Room connection timeout')), 20000); c.on('open', () => this.send(c, { type: 'hello', version: 6, name, avatar })); c.on('data', raw => { let d: any; try { d = JSON.parse(String(raw)); } catch { return; } if (d.type === 'error') { clearTimeout(timeout); reject(new Error(d.text)); } if(d.type==='world'||d.type==='state'){const world=readVrWorld(d,this.world);if(!world||!world.players[this.selfId]||!validLesson(world.lesson,120))return;clearTimeout(timeout);this.world=world;this.update(world);resolve();} }); c.on('error', e => { clearTimeout(timeout); reject(e); }); c.on('close', () => this.status('Host disconnected. Return to title to reconnect.')); });
  }
  private receive(id:string,d:any){if(this.world)vrCommand(this.world,id,d,this.controls,this.lastInput);}
  private transmit(d:object){if(this.dedicated){this.dedicated.send(d);return;}const c=this.connections.get('host');if(c)this.send(c,d);}
  private async connectDedicated(hello:object){this.dedicated=new DedicatedConnection(packet=>{if(packet.type==='connected'){this.selfId=packet.id;this.code=packet.code;this.host=packet.host;return false;}if(packet.type==='host')this.host=!!packet.host;if(packet.type==='error')this.status(packet.message);if(packet.type==='world'||packet.type==='state'){const world=readVrWorld(packet,this.world);if(world&&world.players[this.selfId]&&validLesson(world.lesson,120)){this.world=world;this.update(world);return true;}}return false;},()=>this.status('Server disconnected. Return to title to reconnect.'),vrServerUrl());await this.dedicated.open('vr',{version:6,...hello});}
  private action(d:object){if(this.dedicated||!this.host)this.transmit(d);else{this.receive(this.selfId,d);this.emit();}}
  input(input:Input&{reload?:boolean;bomb?:boolean;remote?:boolean}){if(this.dedicated||!this.host)this.transmit({type:'input',input});else this.receive(this.selfId,{type:'input',input});}
  answer(choice:number,round?:number){this.action({type:'answer',choice,round});}
  completeQuiz(){this.action({type:'quizComplete'});}
  supply(){this.action({type:'supply'});}
  closeBombQuiz(){this.action({type:'closeBombQuiz'});}
  rematch(next=false){if(this.dedicated){if(this.host)this.transmit({type:'rematch',next});return;}if(this.host&&this.world&&returnToLobby(this.world,next)){this.controls={};this.lastInput={};if(this.solo){this.soloPaused=this.soloEditing=false;this.bots=new SoloBots(Object.keys(this.world.players).filter(id=>id!==this.selfId));startWorld(this.world,crypto.getRandomValues(new Uint32Array(1))[0]);}this.connections.forEach(c=>this.send(c,vrPacket(this.world!,true)));this.emit();}}
  setAvatar(avatar:KartAvatar){if(validAvatar(avatar))this.action({type:'avatar',avatar});}
  retry(){this.action({type:'retry'});}
  setSpectator(enabled:boolean){if(!this.host||this.closed)return;if(this.dedicated){this.transmit({type:'spectator',enabled});return;}if(this.world&&setVrSpectator(this.world,this.selfId,enabled)){delete this.controls[this.selfId];this.emit();}}
  setSettings(settings:VrSettings){if(!this.host||this.closed)return;if(this.dedicated){this.transmit({type:'settings',settings});return;}if(this.world&&updateVrSettings(this.world,settings)){this.connections.forEach(c=>this.send(c,vrPacket(this.world!,true)));this.emit();}}
  start(){if(this.dedicated){if(this.host)this.transmit({type:'start'});return;}if(this.host&&this.world){this.controls={};this.lastInput={};startWorld(this.world,crypto.getRandomValues(new Uint32Array(1))[0]);this.connections.forEach(c=>this.send(c,vrPacket(this.world!,true)));this.emit();}}
  close() { this.closed = true; this.dedicated?.close(); if (this.timer) clearInterval(this.timer); document.removeEventListener('visibilitychange', this.visibility); this.connections.forEach(c => c.close()); this.peer?.destroy(); }
}
