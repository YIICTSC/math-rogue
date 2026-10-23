import { applyAction, cpuAction, createClubGame, viewFor } from './engine';
import { definition, type GameId } from './catalog';
import type { Action, ClubState, ClubView, PlayerInput } from './model';
import { PROTAGONISTS } from '../../three/protagonistCatalog';

export const CARD_CLUB_HEROES=PROTAGONISTS.filter(h=>!h.id.startsWith('elementary-'));
export const validProfile=(p:unknown):p is PlayerInput=>!!p&&typeof p==='object'&&typeof (p as PlayerInput).id==='string'&&typeof (p as PlayerInput).name==='string'&&(p as PlayerInput).name.trim().length>0&&(p as PlayerInput).name.length<=32&&CARD_CLUB_HEROES.some(h=>h.id===(p as PlayerInput).hero);
export type ClubLobby={phase:'lobby';game:GameId;count:number;members:PlayerInput[];hostId:string;selfId:string;code:string};
export type ClubPacket=ClubLobby|{phase:'game';view:ClubView;hostId:string;selfId:string;code:string};

/** Shared local/host authority. Socket identity, never a supplied player index, selects the actor. */
export class ClubSession {
  game:GameId='whist';count=4;members:PlayerInput[]=[];state:ClubState|null=null;
  constructor(readonly hostId:string,readonly code:string,private emit:(id:string,packet:ClubPacket)=>void){}
  join(profile:PlayerInput){if(!validProfile(profile)||this.state||this.members.length>=this.count||this.members.some(m=>m.id===profile.id))return false;this.members.push({...profile,cpu:false});this.publish();return true;}
  configure(game:GameId,count:number){if(this.state||!definition(game)?.players.includes(count)||count<this.members.length)return false;this.game=game;this.count=count;this.publish();return true;}
  start(seed:number){
    if(this.state||!this.members.length||this.members[0].id!==this.hostId)return false;
    const players=[...this.members];for(let i=players.length;i<this.count;i++)players.push({id:`cpu-${i}`,name:`CPU ${i+1}`,hero:CARD_CLUB_HEROES[(i*7)%CARD_CLUB_HEROES.length].id,cpu:true});
    this.state=createClubGame(this.game,players,seed);this.publish();return true;
  }
  command(id:string,action:Action,revision:number){
    const s=this.state;if(!s)return false;const player=s.players.findIndex(p=>p.id===id);
    if(player<0||s.players[player].cpu||s.revision!==revision)return false;
    // Deal progression is controlled by the host, even if their playing seat is eliminated.
    if(s.phase==='round'&&id!==this.hostId)return false;
    const ok=applyAction(s,player,action);if(ok)this.publish();return ok;
  }
  tick(){const s=this.state;if(!s||s.phase==='result'||s.phase==='round'||!s.players[s.turn].cpu)return;const a=cpuAction(viewFor(s,s.turn));if(a&&applyAction(s,s.turn,a))this.publish();}
  leave(id:string){
    this.members=this.members.filter(p=>p.id!==id);
    if(this.state){const p=this.state.players.find(p=>p.id===id);if(p&&!p.cpu){p.cpu=true;p.name=p.name+' · CPU';}}
    this.publish();
  }
  finish(){if(this.state&&this.state.phase!=='result'){this.state.phase='result';this.state.resultReason='hostEnded';const max=Math.max(...this.state.players.map(p=>p.score));this.state.winners=this.state.players.flatMap((p,i)=>p.score===max?[i]:[]);this.state.revision++;this.publish();}}
  rematch(){this.state=null;this.publish();}
  publish(){for(const m of this.members){if(this.state){const i=this.state.players.findIndex(p=>p.id===m.id);if(i>=0)this.emit(m.id,{phase:'game',view:viewFor(this.state,i),hostId:this.hostId,selfId:m.id,code:this.code});}else this.emit(m.id,{phase:'lobby',game:this.game,count:this.count,members:this.members.map(p=>({...p})),hostId:this.hostId,selfId:m.id,code:this.code});}}
}
