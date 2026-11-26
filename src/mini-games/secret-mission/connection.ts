import { DedicatedConnection, onlineServerUrl, vrServerUrl } from '../../services/dedicatedConnection';
import { clearMissionInvite, inviteUrl } from './invite';
import type { KartAvatar } from '../gakuro-kart/avatar';
import type { LessonSelection } from '../gakuro-kart/questions';
import { MissionRoom } from './authority';
import { patchView } from './packets';
import { ENDPOINT, TICK_MS, VERSION, normalizeCode, type Command, type Settings, type View } from './rules';

const CACHE='gakuro-secret-mission-seat';
type Ticket={code:string;token:string};
type Enter={name:string;avatar:KartAvatar;code?:string;settings?:Settings;lesson?:LessonSelection;english:boolean};
type Update=(view:View)=>void;
type Status=(message:string)=>void;

export const secretMissionServer=()=>onlineServerUrl()||vrServerUrl();
export function savedTicket(code:string):Ticket|undefined{
  try{
    const ticket=JSON.parse(sessionStorage.getItem(CACHE)??'null') as Ticket|null;
    if(ticket?.code===code&&typeof ticket.token==='string'&&ticket.token.length===36)return ticket;
  }catch{}
}
export interface MissionConnection {
  code:string; local:boolean; send(action:Command):void; setLesson(selection?:LessonSelection):Promise<void>; close(leave?:boolean):void;
}
export class OnlineMission implements MissionConnection {
  readonly local=false;
  code='';
  private ticket?:Ticket;
  private link?:DedicatedConnection;
  private state:View|null=null;
  private closed=false;
  private retry?:ReturnType<typeof setTimeout>;
  private expired=false;
  constructor(private update:Update,private status:Status){}
  async open(enter:Enter){
    const base=secretMissionServer();
    if(!base)throw new Error('OFFLINE');
    const code=normalizeCode(enter.code??'');
    const ticket=code?savedTicket(code):undefined;
    try{
      if(ticket){this.ticket=ticket;await this.connect({code,resume:ticket.token},16000);return;}
      await this.connect({create:!code,code,name:enter.name,avatar:enter.avatar,settings:enter.settings,lesson:enter.lesson,english:enter.english},55000);
    }catch(error){
      if(this.expired)this.discard();
      throw error;
    }
  }
  private async connect(hello:object,timeout:number){
    this.link?.close();
    this.state=null;
    const link=this.link=new DedicatedConnection(packet=>{
      if(this.closed||this.link!==link)return false;
      if(packet.type==='admitted'){
        this.ticket={code:packet.code,token:packet.token};this.code=packet.code;
        try{sessionStorage.setItem(CACHE,JSON.stringify(this.ticket));history.replaceState(null,'',inviteUrl(this.code));}catch{}
        this.status('');return false;
      }
      if(packet.type==='removed'){
        this.expired=true;this.discard();this.close(false);this.status('REMOVED');return false;
      }
      if(packet.type==='error'){
        if(packet.message==='EXPIRED')this.expired=true;
        this.status(packet.message??'NETWORK');return false;
      }
      if(packet.type!=='view')return false;
      const next=patchView(packet,this.state);
      if(!next)return false;
      this.state=next;this.update(next);return true;
    },()=>this.resume(),secretMissionServer());
    await link.open(ENDPOINT,{version:VERSION,...hello},timeout);
  }
  private resume(){
    if(this.closed||!this.ticket)return;
    if(this.expired){this.discard();this.status('EXPIRED');return;}
    const {code,token}=this.ticket,deadline=Date.now()+30000;
    this.status('RECONNECTING');
    const attempt=async()=>{
      if(this.closed)return;
      try{await this.connect({code,resume:token},10000);}
      catch{
        if(this.closed)return;
        if(this.expired||Date.now()>=deadline){this.discard();this.status('EXPIRED');return;}
        this.status('RECONNECTING');this.retry=setTimeout(()=>void attempt(),1200);
      }
    };
    void attempt();
  }
  private discard(){try{sessionStorage.removeItem(CACHE);}catch{}}
  send(command:Command){this.link?.send(command);}
  async setLesson(selection?:LessonSelection){this.link?.send({type:'lesson',value:selection});}
  close(leave=true){
    this.closed=true;clearTimeout(this.retry);
    if(leave){this.send({type:'leave'});this.discard();clearMissionInvite();}
    this.link?.close();
  }
}

export async function createPractice(enter:Enter,update:Update,status:Status):Promise<MissionConnection>{
  const {missionLesson}=await import('./lessons');
  const settings=enter.settings!;
  let source=enter.lesson;
  const seat='local-player',game=new MissionRoom(crypto.randomUUID(),seat,settings,missionLesson(source,settings.difficulty,enter.english));
  if(!game.add(seat,enter.name,enter.avatar,Date.now()))throw new Error('NAME');
  let last=Date.now(),frames=0,closed=false;
  const publish=()=>{if(!closed)update(game.view(seat,Date.now()));};
  const timer=setInterval(()=>{
    const now=Date.now(),step=Math.min(75,now-last);last=now;
    if(document.hidden)return;
    game.tick(now,step);if(frames++%2===0)publish();
  },TICK_MS);
  publish();
  return {
    code:'',local:true,
    send(c){
      if(closed)return;
      try{
        if(c.type==='settings'&&!game.groups.length&&!source)game.lesson=missionLesson(undefined,c.value.difficulty,enter.english);
        game.command(seat,c,Date.now());if(c.type!=='input')publish();
      }catch{status('COMMAND');}
    },
    async setLesson(s){
      game.lesson=missionLesson(s,game.settings.difficulty,enter.english);source=s;publish();
    },
    close(){closed=true;clearInterval(timer);},
  };
}
