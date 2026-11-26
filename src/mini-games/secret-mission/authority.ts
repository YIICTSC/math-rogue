import { defaultAvatar, validAvatar, type KartAvatar } from '../gakuro-kart/avatar';
import type { KartLesson, KartQuestion } from '../gakuro-kart/learning';
import { matchesSchoolAnswer, normalizeSchoolNumber, schoolAnswerOptions, schoolQuestionNeedsChoices } from '../../utils/schoolAnswer';
import { canStand, distance, missionMap, near, sight, type MissionMap, type Point } from './maps';
import { pathTo } from './pathfinding';
import {
  EMOTES, INPUT_TIMEOUT, PRESETS, QUICK_CHAT, REACH, ROLES, SPECIAL_ROLES, safeMessage, safeName, sanitizeSettings,
  type ActionHint, type Actor, type Alarm, type Animation, type Command, type Disruption, type Emote, type EventKind,
  type MeetingMessage, type Phase, type Presence, type PuzzleKind, type Role, type Settings, type StudyReport,
  type StudyStats, type TaskView, type View, type Winner,
} from './rules';

const BRIEF_MS=5100, EJECT_MS=4500, GRACE_MS=35000, REPORT_DISTANCE=2.2, STUN_DISTANCE=2.35;
const SHAPES=['◆','●','▲','■','✦','⬟'];
const isNum=(n:unknown):n is number=>typeof n==='number'&&Number.isFinite(n);
const isId=(n:unknown):n is number=>isNum(n)&&Number.isInteger(n);
const skip='skip';
type Input=Point&{run:boolean; at:number};
type Puzzle=NonNullable<TaskView['puzzle']>&{answer:number[]};
type ActiveTask={token:number; station:number; purpose:'study'|'repair'; format:TaskView['format']; question:KartQuestion; puzzle?:Puzzle; wrong?:boolean; practice?:boolean; lastAnswer?:number; botAnswerAt?:number};
type Body=Point&{id:string;name:string};
type Brain={path:Point[];goal?:Point;planAt:number;reactAt:number;suspicion:Map<string,number>};
type Player=Point&{
  id:string; name:string; avatar:KartAvatar; connected:boolean; ready:boolean; bot:boolean; awayAt:number;
  group:number; role:Role; presence:Presence; publicOut:boolean; face:number; input?:Input; animation:Animation;
  poseUntil:number; task?:ActiveTask; assigned:number[]; completed:Set<number>; used:number; nextStun:number; nextSabotage:number;
  nextAbility:number; nextChat:number; shieldUntil:number; hiddenUntil:number; speedUntil:number; canHide:boolean; taggedAt:number;
  rescueLeft:number; camera?:number; cameraUntil:number; emote?:Emote; mimic?:{id:string; alias:string; until:number};
  stats:StudyStats; questions:StudyReport['questions']; notes:string[]; event?:{serial:number;kind:EventKind}; brain?:Brain;
};
type Meeting={
  by:string; victim?:string; messages:MeetingMessage[]; ballots:Map<string,string>; ejected?:string;
  totals?:Record<string,number>; revealed?:Role;
};
type Group={
  id:number; ids:string[]; map:MissionMap; large:boolean; phase:Phase; deadline:number; clock:number; done:number; total:number;
  bodies:Map<string,Body>; alarm?:Alarm; repairers:Set<string>; meeting?:Meeting; log:{id:string;station:number;at:number;label:string}[];
  winner?:Winner; trick?:string; earliestMeeting:number; immunityUntil:number;
};
const emptyStats=():StudyStats=>({tasks:0,answers:0,correct:0,repairs:0,cooperation:0,units:Object.create(null)});
const side=(p:Player)=>ROLES[p.role][2];

export class MissionRoom {
  readonly players=new Map<string,Player>();
  readonly privateHost:string;
  groups:Group[]=[];
  host:string;
  settings:Settings;
  round=0;
  paused=false;
  hostPause=false;
  serial=0;
  private questionIndex=0;
  private deck:KartQuestion[]=[];
  private observerGroup=0;
  private previousShades=new Set<string>();
  private departedReports=new Map<string,StudyReport>();
  constructor(readonly id:string, host:string, settings:Settings, public lesson:KartLesson, private random=Math.random){
    this.host=this.privateHost=host;this.settings=sanitizeSettings(settings);
  }

  add(id:string,name:unknown,avatar:unknown,now:number,bot=false){
    if(this.players.has(id)||!validAvatar(avatar)||!safeName(name))return false;
    const seats=[...this.players.values()].filter(p=>!p.bot&&!(this.settings.observer&&p.id===this.host));
    if(!bot&&id!==this.host&&seats.length>=this.settings.capacity)return false;
    if(this.groups.length&&(!this.settings.late||this.groups.every(g=>g.phase==='result')))return false;
    const p:Player={
      id,name:safeName(name),avatar,bot,connected:true,ready:bot||id===this.host,awayAt:0,x:0,z:0,face:0,group:-1,
      role:'crew',presence:'watching',publicOut:false,animation:'idle',poseUntil:0,assigned:[],completed:new Set(),
      used:0,nextStun:0,nextSabotage:0,nextAbility:0,nextChat:0,shieldUntil:0,hiddenUntil:0,speedUntil:0,canHide:false,taggedAt:0,
      rescueLeft:1,cameraUntil:0,stats:emptyStats(),questions:Object.create(null),notes:[],
      brain:bot?{path:[],planAt:0,reactAt:now,suspicion:new Map()}:undefined,
    };
    this.players.set(id,p);
    if(this.groups.length){
      const g=this.groups.filter(g=>g.phase!=='result').sort((a,b)=>a.ids.length-b.ids.length)[0];
      this.place(p,g,g.ids.length,now);
      p.presence='ghost';p.publicOut=true;p.animation='ghost';g.ids.push(id);
    }
    return true;
  }

  reconnect(id:string){
    const p=this.players.get(id);if(!p)return false;
    p.connected=true;p.awayAt=0;
    if(id===this.host)this.hostPause=false;
    return true;
  }

  disconnect(id:string,now:number,leave=false){
    const p=this.players.get(id);if(!p)return;
    p.input=undefined;p.task=undefined;p.connected=false;p.awayAt=now;
    if(leave)this.remove(id,now);
    else if(id===this.host&&this.settings.mode==='classroom')this.hostPause=true;
  }

  private remove(id:string,now:number){
    const p=this.players.get(id);if(!p)return;
    if(this.settings.mode==='classroom'&&!p.bot&&p.group>=0)this.departedReports.set(id,this.studyReport(p));
    this.players.delete(id);
    const g=this.groups[p.group];
    if(g){g.ids=g.ids.filter(x=>x!==id);g.bodies.delete(id);if(p.presence==='active')this.checkWinner(g);}
    if(this.host===id){
      if(this.settings.mode==='classroom')this.finish();
      else this.host=[...this.players.values()].find(p=>p.connected&&!p.bot)?.id??'';
    }
    if(this.host===id||!this.host)this.hostPause=false;
    this.advanceVotes(now);
  }

  private eligible(){
    return [...this.players.values()].filter(p=>p.connected&&!p.bot&&!(this.settings.observer&&p.id===this.host));
  }
  get canStart(){
    const players=this.eligible();
    const minimum=this.settings.mode==='large'?16:6;
    return !this.groups.length&&players.length>0&&players.every(p=>p.ready)
      && players.length<=this.settings.capacity&&Math.min(this.settings.capacity,players.length+this.settings.bots)>=minimum;
  }
  private pick<T>(values:readonly T[]):T {return values[Math.floor(this.random()*values.length)];}
  private shuffle<T>(values:readonly T[]){
    const shuffled=[...values];
    for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
    return shuffled;
  }

  private start(now:number){
    if(!this.canStart)return;
    const humans=this.eligible();
    const bots=Math.min(this.settings.bots,this.settings.capacity-humans.length);
    for(let i=0;i<bots;i++){
      this.add('cpu-'+i,'CPU '+(i+1),{...defaultAvatar(i+1),species:i%8,hairStyle:i%12},now,true);
    }
    const participants=this.shuffle([...humans,...[...this.players.values()].filter(p=>p.bot)]);
    const groupCount=this.settings.split&&participants.length>15?Math.ceil(participants.length/15):1;
    const lastShades=this.previousShades;this.previousShades=new Set();
    this.round++;this.questionIndex=0;this.deck=this.shuffle(this.lesson.questions);this.observerGroup=0;
    this.groups=Array.from({length:groupCount},(_,id)=>{
      const members=participants.filter((_,i)=>i%groupCount===id), large=members.length>15;
      const g:Group={
        id,ids:members.map(p=>p.id),map:missionMap(this.settings.map,large),large,phase:'briefing',deadline:now+BRIEF_MS,
        clock:this.settings.seconds*1000,done:0,total:0,bodies:new Map(),repairers:new Set(),log:[],earliestMeeting:now+BRIEF_MS+12000,immunityUntil:now+BRIEF_MS+6000,
      };
      const max=Math.max(1,Math.min(8,Math.floor(members.length/3)));
      const count=Math.max(1,Math.min(max,this.settings.traitors||Math.floor(members.length/(this.settings.mode==='tag'?9:6))));
      const candidates=this.shuffle(members);
      if(this.settings.rotate)candidates.sort((a,b)=>Number(lastShades.has(a.id))-Number(lastShades.has(b.id)));
      const shades=new Set(candidates.slice(0,count));
      for(const p of members){p.role=shades.has(p)?'shade':'crew';if(p.role==='shade')this.previousShades.add(p.id);}
      if(this.settings.mode!=='tag'){
        const available=new Set(members);
        for(const role of this.shuffle(SPECIAL_ROLES)){
          if(this.random()*100>=(this.settings.roles[role]??0))continue;
          const pool=[...available].filter(p=>side(p)===(ROLES[role][2]==='shade'?'shade':'crew'));
          if(!pool.length||(ROLES[role][2]==='neutral'&&members.filter(p=>side(p)==='crew').length<=count+2))continue;
          const p=this.pick(pool);p.role=role;available.delete(p);
        }
      }
      members.forEach((p,i)=>this.place(p,g,i,now));
      g.total=Math.max(1,Math.ceil(members.filter(p=>side(p)==='crew').length*this.settings.tasks*(this.settings.mode==='tag'?.64:.83)));
      return g;
    });
  }

  private place(p:Player,g:Group,index:number,now:number){
    let x=0,z=0;
    const around=g.map.meeting;
    for(let i=0;i<60;i++){
      const angle=(i*.27+index*.382)*Math.PI*2, range=(index<12?1.2:2.1)+(i%5)*.32;
      x=around.x+Math.cos(angle)*range;z=around.z+Math.sin(angle)*range;
      if(canStand(g.map,{x,z}))break;
    }
    const assignments=this.shuffle(g.map.facilities.map(f=>f.id)).slice(0,this.settings.tasks);
    Object.assign(p,{
      x,z,group:g.id,presence:'active',publicOut:false,face:Math.PI,input:undefined,animation:'idle',poseUntil:0,task:undefined,
      assigned:assignments,completed:new Set<number>(),used:0,nextStun:now+BRIEF_MS+this.settings.stunDelay*500,
      nextSabotage:now+BRIEF_MS+9000,nextAbility:now+BRIEF_MS,shieldUntil:0,hiddenUntil:0,speedUntil:0,canHide:false,
      taggedAt:0,rescueLeft:1,camera:undefined,cameraUntil:0,emote:undefined,mimic:undefined,stats:emptyStats(),
      questions:Object.create(null),notes:[],event:undefined,
    });
    if(p.brain){p.brain.path=[];p.brain.goal=undefined;p.brain.reactAt=now+BRIEF_MS+1500;p.brain.suspicion.clear();}
  }

  private reset(){
    this.groups=[];this.paused=false;this.hostPause=false;this.departedReports.clear();
    for(const [id,p] of this.players){
      if(p.bot||!p.connected){this.players.delete(id);continue;}
      p.group=-1;p.presence='watching';p.ready=id===this.host;p.task=undefined;p.event=undefined;
    }
  }

  private event(p:Player,kind:EventKind){p.event={kind,serial:++this.serial};}
  private door(g:Group){return g.alarm?.kind==='doors'?g.alarm.door??-1:-1;}
  private canInteract(g:Group,p:Point,b:Point,limit=REACH){return near(g.map,p,b,limit,this.door(g));}
  private visible(g:Group,me:Player,other:Player,now:number,viewPoint:Point=me,cam=false){
    if(other.id===me.id||other.hiddenUntil>now||(!other.connected&&other.awayAt+GRACE_MS<now))return false;
    if(other.presence==='watching'||(me.presence==='active'&&other.presence==='ghost'))return false;
    const radius=cam?6:side(me)==='shade'?this.settings.shadeSight:g.alarm?.kind==='lights'?3.6:this.settings.crewSight;
    return near(g.map,viewPoint,other,radius,this.door(g));
  }
  private lookup(g:Group,me:Player,token:unknown,now:number){
    if(typeof token!=='string')return;
    return this.members(g).find(p=>(p.mimic&&p.mimic.until>now&&p.id!==me.id?p.mimic.alias:p.id)===token&&this.visible(g,me,p,now));
  }
  private members(g:Group){return g.ids.map(id=>this.players.get(id)!).filter(Boolean);}
  private living(g:Group){return this.members(g).filter(p=>p.presence==='active');}
  private voters(g:Group){return this.living(g).filter(p=>p.connected);}
  private own(p:Player,kind:EventKind,animation:Animation,now:number,duration=720){
    p.animation=animation;p.poseUntil=now+duration;this.event(p,kind);
  }

  private hints(g:Group,p:Player,now:number):ActionHint{
    if(g.phase!=='field'||this.paused||this.hostPause||p.presence==='watching'||(p.presence==='ghost'&&!this.settings.ghosts))return {};
    const terminal=p.assigned.find(id=>!p.completed.has(id)&&this.canInteract(g,p,g.map.facilities[id]));
    const hint:ActionHint={terminal};
    if(p.presence==='ghost')return hint;
    const tag=this.settings.mode==='tag';
    const alarm=g.alarm;
    hint.repair=alarm&&side(p)!=='shade'?alarm.stations.find(id=>!alarm.repaired.includes(id)&&this.canInteract(g,p,g.map.facilities[id])):undefined;
    hint.door=alarm?.kind==='doors'&&!!g.map.doors[this.door(g)]&&distance(p,g.map.doors[this.door(g)])<REACH;
    hint.body=tag?undefined:[...g.bodies.values()].find(b=>this.canInteract(g,p,b,REPORT_DISTANCE))?.id;
    hint.meeting=!tag&&p.used<this.settings.meetings&&now>=g.earliestMeeting&&alarm?.kind!=='critical'&&this.canInteract(g,p,g.map.meeting);
    hint.camera=!tag&&alarm?.kind!=='signal'&&(p.role==='monitor'||g.map.cameras.some(c=>this.canInteract(g,p,c)));
    hint.tunnel=!tag&&(side(p)==='shade'||p.role==='engineer')&&now>=p.nextAbility&&g.map.tunnels.some(c=>this.canInteract(g,p,c));
    hint.hide=tag&&p.canHide&&g.map.facilities.some(f=>(f.kind==='garden'||f.kind==='books')&&this.canInteract(g,p,f,2.5));
    const inRange=this.living(g).filter(o=>this.visible(g,p,o,now)&&distance(p,o)<=STUN_DISTANCE);
    const apparent=(o:Player)=>o.mimic&&o.mimic.until>now?o.mimic.alias:o.id;
    const target=inRange.find(o=>side(o)!=='shade');
    hint.stun=side(p)==='shade'&&target&&p.nextStun<=now&&g.immunityUntil<=now?apparent(target):undefined;
    if(now>=p.nextAbility){
      if(p.role==='medic'&&p.rescueLeft>0&&hint.body&&now-(this.players.get(hint.body)?.taggedAt??0)<=38000)hint.special=hint.body;
      if(p.role==='guardian'||p.role==='mimic'){const o=inRange[0];if(o)hint.special=apparent(o);}
      if(p.role==='shadow'||(p.role==='hacker'&&!alarm))hint.special='self';
    }
    return hint;
  }

  private question(){
    const i=this.questionIndex++;
    return this.deck[i%this.deck.length];
  }
  private openTask(g:Group,p:Player,station:number,purpose:ActiveTask['purpose'],now:number,practice=false){
    if(p.task)return;
    const q=this.question();
    if(!q)return;
    const answer=q.options[q.correct];
    const format=this.settings.style==='choice'||schoolQuestionNeedsChoices(q.question)?'choice'
      : normalizeSchoolNumber(answer)!==null?'number':station%3===0&&answer.length<=120?'text':'choice';
    p.task={token:++this.serial,station,purpose,format,question:q,practice,botAnswerAt:p.bot?now+1500+this.random()*2200:undefined};
    p.input=undefined;
    if(!practice){p.animation='task';p.poseUntil=now+300;}
    if(!practice&&p.presence==='active'&&g.alarm?.kind!=='signal'){
      const disguise=p.mimic&&p.mimic.until>now?this.players.get(p.mimic.id):p;
      const label=disguise?.name??p.name;
      g.log.push({id:disguise?.id??p.id,label,station,at:now});
      if(g.log.length>80)g.log.shift();
    }
  }
  private circuit(station:number,now:number):Puzzle{
    const kind=(['sequence','wire','memory','tiles','pulse'] as PuzzleKind[])[station%5];
    const length=this.settings.difficulty==='hard'?5:this.settings.difficulty==='easy'?3:4;
    const sorted=Array.from({length},(_,i)=>i), order=this.shuffle(sorted);
    if(kind==='pulse')return {kind,pieces:['●'],answer:[0],started:now};
    if(kind==='memory')return {kind,pieces:SHAPES.slice(0,length),pattern:order,answer:order,started:now};
    if(kind==='wire')return {kind,pieces:this.shuffle(SHAPES.slice(0,length)),pattern:order,answer:order,started:now};
    if(kind==='tiles'){
      const chosen=this.shuffle(Array.from({length:9},(_,i)=>i)).slice(0,length).sort((a,b)=>a-b);
      return {kind,pieces:Array.from({length:9},(_,i)=>chosen.includes(i)?'◆':'·'),answer:chosen,started:now};
    }
    return {kind,pieces:order.map(i=>String(i+1)),answer:sorted.map(i=>order.indexOf(i)),started:now};
  }
  private answer(g:Group,p:Player,c:Extract<Command,{type:'answer'}>,now:number){
    const task=p.task;
    if(!task||c.token!==task.token||now-(task.lastAnswer??0)<330)return;
    if(!task.practice&&(!g.map.facilities[task.station]||!this.canInteract(g,p,g.map.facilities[task.station])))return;
    task.lastAnswer=now;
    const q=task.question;
    if(task.puzzle){
      const elapsed=now-task.puzzle.started, pulse=((elapsed%1600)+1600)%1600;
      const correct=task.puzzle.kind==='pulse'?Array.isArray(c.puzzle)&&c.puzzle.length===1&&c.puzzle[0]===0&&pulse>=430&&pulse<=1260
        :Array.isArray(c.puzzle)&&c.puzzle.length===task.puzzle.answer.length&&task.puzzle.answer.every((piece,i)=>piece===c.puzzle?.[i]);
      if(correct)this.completeTask(g,p,task,now);
      else{task.wrong=true;this.event(p,'wrong');}
      return;
    }
    const correct=task.format==='choice'?isId(c.choice)&&c.choice===q.correct
      :typeof c.text==='string'&&c.text.length<=240&&matchesSchoolAnswer(c.text,q.options[q.correct],schoolAnswerOptions(q.mode,q.question));
    if(!task.practice){
      const unit=q.unitName||q.mode;
      const perUnit=p.stats.units[unit]??={answers:0,correct:0};
      const detail=p.questions[q.id]??={prompt:q.question,unit,answers:0,correct:0};
      for(const score of [p.stats,perUnit,detail]){score.answers++;if(correct)score.correct++;}
    }
    if(!correct){task.wrong=true;this.event(p,'wrong');return;}
    if(task.practice||this.settings.difficulty==='easy'||(task.purpose==='repair'&&p.role==='engineer')){
      this.completeTask(g,p,task,now);return;
    }
    task.puzzle=this.circuit(task.station,now);task.wrong=false;this.event(p,'correct');
  }
  private completeTask(g:Group,p:Player,task:ActiveTask,now:number){
    p.task=undefined;
    if(task.practice){this.event(p,'correct');return;}
    if(task.purpose==='repair'){
      const a=g.alarm;
      if(!a||a.repaired.includes(task.station)||!a.stations.includes(task.station))return;
      a.repaired.push(task.station);p.stats.repairs++;g.repairers.add(p.id);this.own(p,'repair','rescue',now);
      if(a.repaired.length===a.stations.length){
        if(a.kind==='critical'&&g.repairers.size>1)for(const id of g.repairers){const who=this.players.get(id);if(who)who.stats.cooperation++;}
        g.alarm=undefined;
      }
      return;
    }
    if(p.completed.has(task.station))return;
    p.completed.add(task.station);p.stats.tasks++;
    if(side(p)==='crew')g.done++;
    this.own(p,'task','rescue',now);
    if(p.role==='detective'){
      p.notes=g.log.filter(row=>row.id!==p.id&&now-row.at<58000&&distance(g.map.facilities[row.station],p)<12)
        .slice(-3).map(row=>row.label+' · '+(row.station+1));
    }
    if(this.settings.mode==='tag'&&side(p)!=='shade'&&p.presence==='active'){
      const effect=(p.stats.tasks-1)%3;
      if(effect===0)p.speedUntil=now+6000;
      else if(effect===1)p.canHide=true;
      else g.clock=Math.max(1000,g.clock-10000);
      this.event(p,'bonus');
    }
    this.checkWinner(g);
  }

  private sabotage(g:Group,p:Player,kind:Disruption,now:number,door?:number,remoteHack=false){
    if(this.settings.mode==='tag'||g.alarm||side(p)!=='shade'||(!remoteHack&&p.nextSabotage>now))return;
    if(!['lights','signal','doors','critical'].includes(kind))return;
    if(kind==='doors'&&(!isId(door)||!g.map.doors[door]))return;
    const stations=kind==='critical'?[...g.map.repair]:kind==='lights'?[g.map.repair[1]]:kind==='signal'?[g.map.signal]:[];
    g.alarm={kind,ends:now+(kind==='critical'?(g.large?100000:84000):kind==='doors'?10500:49000),stations,repaired:[],door:kind==='doors'?door:undefined};
    g.repairers.clear();p.nextSabotage=Math.max(p.nextSabotage,now+this.settings.sabotageDelay*1000);
    for(const person of this.members(g)){
      if(kind!=='doors')person.task=undefined;
      if(kind==='signal'){person.camera=undefined;person.cameraUntil=0;person.notes=[];}
      this.event(person,'alert');
    }
    p.animation='sabotage';p.poseUntil=now+850;
  }
  private stun(g:Group,p:Player,target:Player,now:number){
    if(p.nextStun>now||g.immunityUntil>now||side(p)!=='shade'||side(target)==='shade'||!this.canInteract(g,p,target,STUN_DISTANCE))return;
    p.nextStun=now+this.settings.stunDelay*1000;
    p.hiddenUntil=0;p.mimic=undefined;
    if(target.shieldUntil>now){target.shieldUntil=0;this.own(target,'block','surprise',now);return;}
    const tag=this.settings.mode==='tag';
    target.presence='ghost';target.input=undefined;target.task=undefined;target.taggedAt=now;target.publicOut=tag;
    target.hiddenUntil=0;target.camera=undefined;
    if(!tag)g.bodies.set(target.id,{id:target.id,name:target.name,x:target.x,z:target.z});
    this.own(target,'stunned','stunned',now,1000);p.animation='sabotage';p.poseUntil=now+600;
    for(const witness of this.living(g)){
      if(witness.id!==p.id&&witness.brain&&near(g.map,witness,p,this.settings.crewSight,this.door(g))){
        const book=witness.brain.suspicion;book.set(p.id,(book.get(p.id)??0)+5);
      }
    }
    this.checkWinner(g);
  }

  private emergency(g:Group,now:number,by:string,victim?:string){
    if(g.phase!=='field'||this.settings.mode==='tag')return;
    g.phase='talk';g.deadline=now+this.settings.talk*1000;
    g.meeting={by,victim,messages:[],ballots:new Map()};
    for(const p of this.members(g)){
      p.publicOut=p.presence==='ghost';p.input=undefined;p.task=undefined;p.hiddenUntil=0;p.mimic=undefined;p.camera=undefined;
      if(p.id===by){p.animation='report';p.poseUntil=now+800;}
      if(p.brain)p.brain.reactAt=g.deadline+800+this.random()*4000;
    }
  }
  private advanceVotes(now:number){
    for(const g of this.groups)if(g.phase==='vote'&&this.voters(g).every(p=>g.meeting?.ballots.has(p.id)))this.resolveVote(g,now);
  }
  private resolveVote(g:Group,now:number){
    const m=g.meeting;if(g.phase!=='vote'||!m)return;
    const totals:Record<string,number>=Object.create(null);
    for(const p of this.voters(g)){const id=m.ballots.get(p.id)??skip;totals[id]=(totals[id]??0)+1;}
    const best=Math.max(0,...Object.values(totals));const leaders=Object.keys(totals).filter(id=>totals[id]===best);
    const choice=leaders.includes(skip)?undefined:leaders.length===1?leaders[0]:this.settings.tie==='random'&&leaders.length?this.pick(leaders):undefined;
    const target=choice?this.players.get(choice):undefined;
    if(target?.presence==='active'){
      target.presence='ghost';target.publicOut=true;target.taggedAt=now;target.animation='stunned';target.poseUntil=now+1500;
      m.ejected=target.id;m.revealed=this.settings.reveal?target.role:undefined;
      if(target.role==='trickster')g.trick=target.id;
    }
    m.totals=totals;g.bodies.clear();g.phase='eject';g.deadline=now+EJECT_MS;
  }
  private finish(){for(const g of this.groups){if(g.phase!=='result')this.win(g,'ended','ended');}this.hostPause=false;}
  private win(g:Group,side:Winner['side'],reason:Winner['reason']){
    g.winner={side,reason};g.phase='result';g.alarm=undefined;
    for(const p of this.members(g)){p.input=undefined;p.task=undefined;p.animation=this.won(g,p)?'win':'lose';}
  }
  private won(g:Group,p:Player){
    return g.winner?.side===side(p)&&side(p)!=='neutral'||g.trick===p.id||
      (g.winner?.side!=='ended'&&p.role==='survivor'&&p.presence==='active');
  }
  private checkWinner(g:Group){
    if(g.phase!=='field')return;
    const live=this.living(g),shades=live.filter(p=>side(p)==='shade').length,others=live.length-shades;
    const tag=this.settings.mode==='tag';
    if(g.trick)this.win(g,'neutral','trick');
    else if(g.done>=g.total)this.win(g,'crew','duties');
    else if(!shades)this.win(g,'crew','vote');
    else if(tag?others===0:shades>=others)this.win(g,'shade',tag?'tagged':'parity');
    else if(g.clock<=0)this.win(g,tag?'crew':'shade','time');
  }

  private ability(g:Group,p:Player,hint:ActionHint,id:string|undefined,now:number){
    if(!hint.special||id!==hint.special)return;
    const target=this.lookup(g,p,id,now);
    if(p.role==='guardian'&&target){
      target.shieldUntil=now+9500;p.nextAbility=now+32000;this.own(p,'block','rescue',now);
    }else if(p.role==='medic'){
      const body=g.bodies.get(id),person=this.players.get(id);
      if(!body||!person||now-person.taggedAt>38000)return;
      p.rescueLeft--;g.bodies.delete(id);person.presence='active';person.publicOut=false;person.x=body.x;person.z=body.z;
      person.shieldUntil=now+3600;this.own(person,'rescue','rescue',now);this.own(p,'rescue','rescue',now);
    }else if(p.role==='mimic'&&target){
      p.mimic={id:target.id,alias:'echo-'+(++this.serial),until:now+11500};p.nextAbility=now+39000;
    }else if(p.role==='shadow'){
      p.hiddenUntil=now+5200;p.nextAbility=now+37000;p.animation='sabotage';p.poseUntil=now+600;
    }else if(p.role==='hacker'){
      this.sabotage(g,p,'signal',now,undefined,true);p.nextAbility=now+56000;
    }
  }

  command(id:string,c:Command,now:number){
    const p=this.players.get(id);if(!p?.connected||!c||typeof c!=='object')return;
    const g=this.groups[p.group];
    const host=id===this.host,admin=host&&(this.settings.mode!=='classroom'||id===this.privateHost);
    const selected=g??(admin?this.groups[this.observerGroup]:undefined);
    switch(c.type){
      case 'leave':this.disconnect(id,now,true);return;
      case 'settings':{
        if(!admin||this.groups.length)return;
        const next=sanitizeSettings(c.value);
        if(next.mode==='classroom'&&id!==this.privateHost)return;
        this.settings=next;
        for(const member of this.players.values())member.ready=member.id===this.host;
        return;
      }
      case 'ready':if(!this.groups.length&&typeof c.value==='boolean')p.ready=c.value;return;
      case 'profile':
        if(!this.groups.length&&validAvatar(c.avatar)){p.avatar=c.avatar;const name=safeName(c.name);if(name)p.name=name;}
        return;
      case 'start':if(admin)this.start(now);return;
      case 'rematch':if(admin&&this.groups.length&&this.groups.every(g=>g.phase==='result'))this.reset();return;
      case 'group':if(admin&&isId(c.id)&&this.groups[c.id])this.observerGroup=c.id;return;
      case 'pause':if(admin&&selected){this.paused=!this.paused;for(const p of this.players.values())p.input=undefined;}return;
      case 'end':if(admin)this.finish();return;
      case 'force-meeting':if(admin&&selected)this.emergency(selected,now,id);return;
      case 'finish-vote':if(admin&&selected)this.resolveVote(selected,now);return;
      case 'extend':if(admin&&selected&&selected.phase!=='result')selected.clock=Math.min(1200000,selected.clock+60000);return;
      case 'extend-talk':if(admin&&selected?.phase==='talk')selected.deadline=Math.min(now+120000,selected.deadline+20000);return;
      case 'kick':if(admin&&typeof c.id==='string'&&c.id!==id)this.remove(c.id,now);return;
      case 'close-task':p.task=undefined;return;
    }
    if(!g)return;
    if(c.type==='practice-task'&&(g.phase==='result'||p.presence==='ghost'&&!this.settings.ghosts)){
      this.openTask(g,p,-1,'study',now,true);return;
    }
    if(c.type==='answer'&&p.task?.practice){this.answer(g,p,c,now);return;}
    if(this.paused||this.hostPause)return;
    if(g.phase==='talk'||g.phase==='vote'){
      if(p.presence!=='active'||!g.meeting)return;
      if(c.type==='vote'&&g.phase==='vote'&&!g.meeting.ballots.has(id)&&
        (c.id===skip||this.living(g).some(o=>o.id===c.id))){
        g.meeting.ballots.set(id,c.id);this.advanceVotes(now);
      }
      if(c.type==='say'&&this.settings.chat!=='off'&&now>=p.nextChat){
        const line=isId(c.line)&&QUICK_CHAT[c.line]?c.line:undefined;
        const text=this.settings.chat==='text'?safeMessage(c.text):'';
        if(line===undefined&&!text)return;
        const target=typeof c.target==='string'&&g.ids.includes(c.target)?c.target:undefined;
        const station=isId(c.station)&&g.map.facilities[c.station]?c.station:undefined;
        g.meeting.messages.push({id:++this.serial,from:id,line,text,station,target});
        if(g.meeting.messages.length>40)g.meeting.messages.shift();
        p.nextChat=now+1750;
      }
      return;
    }
    if(g.phase!=='field'||p.presence==='watching'||(p.presence==='ghost'&&!this.settings.ghosts))return;
    if(c.type==='input'){
      if(!isNum(c.x)||!isNum(c.z))return;
      const scale=Math.max(1,Math.hypot(c.x,c.z));
      if(!Number.isFinite(scale))return;
      p.input={x:c.x/scale,z:c.z/scale,run:c.run===true,at:now};
      return;
    }
    if(c.type==='answer'&&p.task){this.answer(g,p,c,now);return;}
    if(p.task)return;
    const hint=this.hints(g,p,now);
    if(c.type==='task'&&isId(c.id)&&hint.terminal===c.id){this.openTask(g,p,c.id,'study',now);return;}
    if(p.presence!=='active')return;
    switch(c.type){
      case 'repair':if(isId(c.id)&&hint.repair===c.id)this.openTask(g,p,c.id,'repair',now);break;
      case 'stun':{const target=this.lookup(g,p,c.id,now);if(target&&hint.stun)this.stun(g,p,target,now);break;}
      case 'report':if(typeof c.id==='string'&&hint.body===c.id)this.emergency(g,now,p.id,c.id);break;
      case 'meeting':if(hint.meeting){p.used++;this.emergency(g,now,p.id);}break;
      case 'sabotage':this.sabotage(g,p,c.kind,now,c.door);break;
      case 'unseal':if(hint.door&&side(p)!=='shade'){g.alarm=undefined;this.event(p,'repair');}break;
      case 'ability':this.ability(g,p,hint,c.id,now);break;
      case 'tunnel':if(hint.tunnel){
        const at=g.map.tunnels.findIndex(point=>this.canInteract(g,p,point));
        Object.assign(p,g.map.tunnels[(at+1)%g.map.tunnels.length]);
        p.nextAbility=now+17000;this.own(p,'portal','surprise',now);
      }break;
      case 'camera':if(hint.camera&&isId(c.id)&&g.map.cameras[c.id]&&now>=p.nextAbility&&
          (p.role==='monitor'||this.canInteract(g,p,g.map.cameras[c.id]))){
        p.camera=c.id;p.cameraUntil=now+5200;p.nextAbility=now+14500;this.event(p,'camera');
      }break;
      case 'hide':if(hint.hide){p.canHide=false;p.hiddenUntil=now+5900;this.event(p,'bonus');}break;
      case 'emote':if(typeof c.emote==='string'&&Object.hasOwn(EMOTES,c.emote)&&now>=p.nextChat){
        p.emote=c.emote;p.poseUntil=now+1050;p.animation='emote';p.nextChat=now+1000;
      }break;
    }
  }

  private move(g:Group,p:Player,now:number,dt:number){
    if(p.task){p.animation='task';return;}
    const input=p.input, moving=input&&now-input.at<INPUT_TIMEOUT&&Math.hypot(input.x,input.z)>.04&&p.camera===undefined;
    if(moving){
      const boosted=p.speedUntil>now;
      const v=this.settings.speed*(input.run?1.18:1)*(boosted?1.24:1)*(p.presence==='ghost'?1.14:1);
      const step=dt/1000*v;
      const x=p.x+input.x*step,z=p.z+input.z*step;
      if(canStand(g.map,{x,z:p.z},this.door(g)))p.x=x;
      if(canStand(g.map,{x:p.x,z},this.door(g)))p.z=z;
      p.face=Math.atan2(input.x,input.z);
      if(Math.hypot(input.x,input.z)>.2&&p.hiddenUntil>now&&this.settings.mode==='tag')p.hiddenUntil=0;
    }
    if(now>=p.poseUntil){p.emote=undefined;p.animation=p.presence==='ghost'?'ghost':moving?input.run?'run':'walk':'idle';}
  }

  private bot(g:Group,p:Player,now:number){
    const brain=p.brain;if(!brain)return;
    if(g.phase==='vote'&&p.presence==='active'&&now>=brain.reactAt&&!g.meeting?.ballots.has(p.id)){
      const perceived=this.voters(g).filter(o=>o.id!==p.id&&(side(p)!=='shade'||side(o)!=='shade'));
      const suspect=perceived.sort((a,b)=>(brain.suspicion.get(b.id)??0)-(brain.suspicion.get(a.id)??0))[0];
      const choice=suspect&&((brain.suspicion.get(suspect.id)??0)>0||this.random()<.31)?suspect.id:skip;
      this.command(p.id,{type:'vote',id:choice},now);return;
    }
    if(g.phase!=='field'||p.presence==='watching'||p.presence==='ghost'&&!this.settings.ghosts)return;
    if(p.task){
      if(now>=(p.task.botAnswerAt??Infinity)){
        if(p.task.practice){p.task=undefined;return;}
        if(!p.task.puzzle){
          const good=this.random()>.17;
          const value=good?p.task.question.correct:(p.task.question.correct+1)%p.task.question.options.length;
          this.answer(g,p,{type:'answer',token:p.task.token,choice:value,text:p.task.question.options[value]},now);
        }else this.completeTask(g,p,p.task,now);
        if(p.task)p.task.botAnswerAt=now+2200+this.random()*2000;
      }
      return;
    }
    if(now>=brain.reactAt){
      const hint=this.hints(g,p,now);
      brain.reactAt=now+320+this.random()*440;
      if(hint.special&&p.role==='medic'){this.ability(g,p,hint,hint.special,now);return;}
      if(hint.body&&side(p)!=='shade'){this.command(p.id,{type:'report',id:hint.body},now);return;}
      if(hint.stun){this.command(p.id,{type:'stun',id:hint.stun},now);return;}
      if(hint.repair!==undefined){this.openTask(g,p,hint.repair,'repair',now);return;}
      if(hint.terminal!==undefined){this.openTask(g,p,hint.terminal,'study',now);return;}
      if(p.presence==='active'&&side(p)==='shade'&&!g.alarm&&now>=p.nextSabotage&&this.random()<.031){
        const kind=this.pick(['lights','signal','critical','doors'] as const);
        this.sabotage(g,p,kind,now,Math.floor(this.random()*g.map.doors.length));return;
      }
    }
    if(now>=brain.planAt){
      brain.planAt=now+800+this.random()*550;
      const seen=this.living(g).filter(other=>this.visible(g,p,other,now));
      const chase=side(p)==='shade'&&now>=p.nextStun-1400?seen.find(other=>side(other)!=='shade'):undefined;
      const danger=this.settings.mode==='tag'&&side(p)!=='shade'?seen.find(other=>side(other)==='shade'):undefined;
      const flee=danger&&g.map.facilities.filter(f=>distance(f,danger)>distance(p,danger)+2).sort((a,b)=>distance(a,p)-distance(b,p))[0];
      const repairs=p.presence==='active'&&side(p)!=='shade'?g.alarm?.stations.filter(i=>!g.alarm?.repaired.includes(i)):undefined;
      const targets=(repairs?.length?repairs:p.assigned.filter(i=>!p.completed.has(i))).map(i=>g.map.facilities[i]).sort((a,b)=>distance(a,p)-distance(b,p));
      const goal=chase??flee??targets[0]??(brain.goal&&distance(p,brain.goal)>1.6?brain.goal:this.pick(g.map.facilities));
      brain.goal=goal;brain.path=pathTo(g.map,p,goal,this.door(g));
    }
    while(brain.path.length&&distance(p,brain.path[0])<.29)brain.path.shift();
    if(brain.path[0]){
      const q=brain.path[0],d=Math.max(.001,distance(p,q));
      p.input={x:(q.x-p.x)/d,z:(q.z-p.z)/d,run:this.settings.mode==='tag'||side(p)==='shade',at:now};
    }else p.input=undefined;
  }

  tick(now:number,dt:number){
    for(const p of this.players.values())if(!p.connected&&!p.bot&&now-p.awayAt>=GRACE_MS)this.remove(p.id,now);
    for(const g of this.groups){
      if(g.phase==='result')continue;
      if(this.paused||this.hostPause){
        g.deadline+=dt;if(g.alarm)g.alarm.ends+=dt;continue;
      }
      if(g.phase!=='field'&&g.alarm)g.alarm.ends+=dt;
      if(g.phase==='briefing'&&now>=g.deadline)g.phase='field';
      if(g.phase==='talk'&&now>=g.deadline){g.phase='vote';g.deadline=now+this.settings.vote*1000;}
      if(g.phase==='vote'){
        if(now>=g.deadline)this.resolveVote(g,now);
        else for(const p of this.members(g))if(p.bot)this.bot(g,p,now);
      }
      if(g.phase==='eject'&&now>=g.deadline){
        g.phase='field';g.earliestMeeting=now+18000;g.immunityUntil=now+3400;
        for(const p of this.members(g)){p.input=undefined;p.task=undefined;}
        this.checkWinner(g);
      }
      if(g.phase!=='field')continue;
      g.clock=Math.max(0,g.clock-dt);
      if(g.alarm&&now>=g.alarm.ends){
        if(g.alarm.kind==='critical'){this.win(g,'shade','failure');continue;}
        g.alarm=undefined;
      }
      for(const p of this.members(g)){
        if(g.phase!=='field')break;
        if(p.camera!==undefined&&now>=p.cameraUntil)p.camera=undefined;
        if(p.bot)this.bot(g,p,now);
        if(p.connected&&(p.presence==='active'||p.presence==='ghost'&&this.settings.ghosts))this.move(g,p,now,dt);
      }
      this.checkWinner(g);
    }
  }

  private actor(p:Player,now:number,observer=false):Actor{
    const disguise=!observer&&p.mimic&&p.mimic.until>now?p.mimic:undefined;
    const model=disguise&&this.players.get(disguise.id)||p;
    return {
      id:disguise?.alias??p.id,name:model.name,avatar:model.avatar,
      x:Math.round(p.x*100)/100,z:Math.round(p.z*100)/100,face:Math.round(p.face*100)/100,
      presence:p.presence,animation:p.animation,emote:p.emote,shield:p.shieldUntil>now||undefined,
    };
  }
  private taskView(task:ActiveTask):TaskView{
    const {token,station,purpose,format,wrong}=task;
    if(task.puzzle){const {answer:_,...puzzle}=task.puzzle;return {token,station,purpose,format,wrong,puzzle};}
    const {correct:_,problemId:__,options,...question}=task.question;
    return {token,station,purpose,format,wrong,question:{...question,options:format==='choice'?options:undefined}};
  }
  private studyReport(p:Player):StudyReport{
    return {...p.stats,id:p.id,name:p.name,questions:p.questions};
  }

  view(id:string,now:number):View{
    const p=this.players.get(id)!;
    const host=id===this.host,observer=host&&this.settings.observer&&p.group<0, teacher=host&&id===this.privateHost&&this.settings.mode==='classroom';
    const g=this.groups[p.group]??(observer?this.groups[this.observerGroup]:undefined);
    const phase=g?.phase??'lobby', meeting=g?.meeting, camera=g&&p.camera!==undefined?g.map.cameras[p.camera]:undefined;
    const point=camera??p, owns=!!g&&!observer;
    const members=g?this.members(g):[...this.players.values()];
    const showDead=phase==='talk'||phase==='vote'||phase==='eject'||phase==='result';
    const voting=phase==='eject'||phase==='result';
    const field=phase==='field';
    const role=owns?p.role:undefined;
    return {
      round:this.id+'-'+this.round,who:id,host,observer,settings:this.settings,phase,now,deadline:g?.deadline??0,
      paused:this.paused||this.hostPause,lesson:this.lesson.title,map:this.settings.map,large:g?.large??false,group:g?.id??0,
      groups:this.groups.map(group=>({id:group.id,count:group.ids.length,phase:group.phase,done:group.done,total:group.total})),
      canStart:host&&this.canStart,canRematch:host&&!!this.groups.length&&this.groups.every(group=>group.phase==='result'),
      roster:members.map(o=>({id:o.id,name:o.name,color:o.avatar.outfit,species:o.avatar.species,connected:o.connected,ready:o.ready,bot:o.bot,
        presence:o.id===id||showDead||o.publicOut||observer||o.presence==='watching'?o.presence:'active',
        voted:phase==='vote'?!!meeting?.ballots.has(o.id):undefined,role:phase==='result'||observer?o.role:undefined})),
      actors:!g||!field||p.presence==='watching'&&!observer?[]:members.filter(o=>o.id!==id&&(observer||this.visible(g,p,o,now,point,!!camera))).map(o=>this.actor(o,now,observer)),
      self:owns?this.actor(p,now,true):undefined,role,
      bodies:!g||!field?[]:[...g.bodies.values()].filter(b=>observer||near(g.map,point,b,camera?6:(g.alarm?.kind==='lights'&&side(p)!=='shade'?3.6:this.settings.crewSight),this.door(g))),
      allies:owns&&side(p)==='shade'?members.filter(o=>o.id!==id&&side(o)==='shade').map(o=>o.id):[],
      hint:owns&&g?this.hints(g,p,now):{},assigned:owns?[...p.assigned]:[],completed:owns?[...p.completed]:[],
      task:p.task?this.taskView(p.task):undefined,clock:g?.clock??0,done:g?.done??0,total:g?.total??0,alarm:g?.alarm,
      meeting:meeting&&showDead?{by:meeting.by,victim:meeting.victim,messages:meeting.messages,voted:meeting.ballots.has(id),ejected:meeting.ejected,
        revealed:meeting.revealed,totals:voting?meeting.totals:undefined,ballots:voting&&this.settings.votes==='open'?Object.fromEntries(meeting.ballots):undefined}:undefined,
      winner:g?.winner,won:g?.winner&&owns?this.won(g,p):undefined,report:g?.winner&&owns?p.stats:undefined,
      reports:teacher&&this.groups.length?[
        ...this.departedReports.values(),...[...this.players.values()].filter(o=>!o.bot&&o.group>=0).map(o=>this.studyReport(o)),
      ]:undefined,
      stunReady:role&&side(p)==='shade'?p.nextStun:undefined,sabotageReady:role&&side(p)==='shade'?p.nextSabotage:undefined,
      abilityReady:role?p.nextAbility:undefined,notes:p.notes,camera:p.camera,event:p.event,
    };
  }
}

export function localPracticeSettings(mode:Settings['mode']):Settings{
  return sanitizeSettings(mode==='tag'?{...PRESETS.tag,bots:5}:PRESETS.practice);
}
