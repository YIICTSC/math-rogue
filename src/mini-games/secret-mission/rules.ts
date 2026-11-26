import type { KartAvatar } from '../gakuro-kart/avatar';
import type { KartQuestion } from '../gakuro-kart/learning';
import { MAPS, type MapId, type Point } from './maps';

export const TITLE='学習ローグ SECRET MISSION';
export const ENDPOINT='secret-mission', VERSION=1, TICK_MS=50, PUSH_MS=100, REACH=1.75, INPUT_TIMEOUT=350;
export const MODES=['standard','large','classroom','tag'] as const;
export type Mode=typeof MODES[number];
export type Side='crew'|'shade'|'neutral';
export type Phase='lobby'|'briefing'|'field'|'talk'|'vote'|'eject'|'result';
export const ROLES={
  crew:['クルー','Crew','crew','端末の任務を進め、会議で裏切り者を見つける。','Complete terminals and find the infiltrators.'],
  shade:['裏切り者','Infiltrator','shade','正体を隠し、妨害とシャボンでクルーを行動不能にする。','Blend in, sabotage and stun crew with a bubble.'],
  engineer:['エンジニア','Engineer','crew','整備通路を使え、設備をすばやく復旧できる。','Use service tunnels and bypass repair puzzles.'],
  detective:['探偵','Detective','crew','正解で、近くの施設を使った人の記録を調べられる。','Correct answers reveal activity near the terminal.'],
  guardian:['ガーディアン','Guardian','crew','近くの仲間をシャボンから守る。','Shield a nearby teammate from one bubble.'],
  medic:['メディック','Medic','crew','会議の前に気絶した仲間を一度救助できる。','Rescue one stunned teammate before a meeting.'],
  monitor:['監視員','Observer','crew','離れた場所から監視カメラを使える。','Check a camera remotely for a short interval.'],
  mimic:['シェイプシフター','Mimic','shade','目の前の相手の姿と名札を短時間借りる。','Borrow a visible player’s name and appearance.'],
  hacker:['ハッカー','Hacker','shade','通信設備を妨害して地図やカメラを停止する。','Jam the map and security cameras.'],
  shadow:['ステルス','Shadow','shade','数秒だけ他の人から姿を隠す。','Vanish from other players’ sight for a few seconds.'],
  trickster:['トリックスター','Trickster','neutral','投票で追放されると単独で勝利。','Earn a solo win by being voted out.'],
  survivor:['サバイバー','Survivor','neutral','最後まで活動できれば勝利陣営と一緒に勝つ。','Stay active until the end to share the winning side’s victory.'],
} as const satisfies Record<string,readonly [string,string,Side,string,string]>;
export type Role=keyof typeof ROLES;
export type SpecialRole=Exclude<Role,'crew'|'shade'>;
export const SPECIAL_ROLES=(Object.keys(ROLES) as Role[]).filter((r):r is SpecialRole=>r!=='crew'&&r!=='shade');
export type PuzzleKind='sequence'|'wire'|'memory'|'tiles'|'pulse';
export type Disruption='lights'|'signal'|'doors'|'critical';
export type Emote='wave'|'spark'|'check'|'signal'|'orbit'|'lantern';
export const EMOTES:Record<Emote,string>={wave:'✋',spark:'✦',check:'✓',signal:'⚡',orbit:'🪐',lantern:'🏮'};
export const EMOTE_NAMES:Record<Emote,[string,string]>={
  wave:['手を振る','Wave'],spark:['ひらめき','Spark'],check:['了解','OK'],
  signal:['点灯','Light up'],orbit:['星を送る','Orbit'],lantern:['鐘灯を掲げる','Raise the lantern'],
};
export const EMOTE_COSTS={signal:4,orbit:8,lantern:12} as const;
export const QUICK_CHAT=[
  ['どこにいましたか？','Where were you?'],['誰と一緒にいましたか？','Who were you with?'],
  ['見かけました。','I saw them.'],['タスクをしていました。','I was working on a task.'],
  ['怪しい行動を見ました。','I saw something suspicious.'],['監視カメラを確認しました。','I checked a security camera.'],
  ['まだ判断できません。','I’m not sure yet.'],['投票をスキップします。','I’ll skip this vote.'],
] as const;

export interface Settings {
  mode:Mode; map:MapId; capacity:number; traitors:number; bots:number; seconds:number; speed:number;
  crewSight:number; shadeSight:number; stunDelay:number; sabotageDelay:number; meetings:number; talk:number; vote:number;
  votes:'open'|'secret'; reveal:boolean; tie:'none'|'random'; tasks:number; difficulty:'easy'|'normal'|'hard';
  style:'choice'|'mixed'; ghosts:boolean; chat:'quick'|'text'|'off'; sfx:boolean; late:boolean; split:boolean;
  observer:boolean; rotate:boolean; roles:Partial<Record<SpecialRole,number>>;
}
const standard:Settings={
  mode:'standard',map:'school',capacity:15,traitors:0,bots:0,seconds:420,speed:5.2,crewSight:8.4,shadeSight:10.1,
  stunDelay:27,sabotageDelay:48,meetings:1,talk:32,vote:24,votes:'secret',reveal:false,tie:'none',tasks:3,difficulty:'normal',
  style:'mixed',ghosts:true,chat:'quick',sfx:true,late:true,split:false,observer:false,rotate:true,roles:{engineer:55,medic:35,detective:40},
};
export const PRESETS:Record<Mode|'beginner'|'practice',Settings>={
  standard,
  beginner:{...standard,bots:5,talk:25,stunDelay:38,sabotageDelay:60,tasks:2,difficulty:'easy',style:'choice',reveal:true,roles:{engineer:100}},
  classroom:{...standard,mode:'classroom',capacity:40,seconds:600,observer:true,talk:45,vote:32,difficulty:'easy',style:'choice',tasks:2,roles:{}},
  large:{...standard,mode:'large',capacity:40,seconds:540,talk:42,vote:30,tasks:2},
  tag:{...standard,mode:'tag',seconds:170,tasks:3,speed:5.8,stunDelay:7,roles:{},style:'choice'},
  practice:{...standard,bots:5,seconds:360,talk:10,vote:10,tasks:2,difficulty:'easy',style:'choice',reveal:true,roles:{}},
};
export function sanitizeSettings(value:unknown):Settings {
  const v=value&&typeof value==='object'?value as Partial<Settings>:{};
  const mode=MODES.includes(v.mode as Mode)?v.mode!:standard.mode, base=PRESETS[mode];
  const n=(key:keyof Settings,min:number,max:number,integer=true)=>{
    const raw=v[key], number=typeof raw==='number'&&Number.isFinite(raw)?raw:Number(base[key]);
    const bound=Math.max(min,Math.min(max,number));return integer?Math.round(bound):bound;
  };
  const b=(key:keyof Settings)=>typeof v[key]==='boolean'?Boolean(v[key]):Boolean(base[key]);
  const roles:Settings['roles']={};
  for(const key of SPECIAL_ROLES){
    const rate=v.roles?v.roles[key]:base.roles[key];
    if(typeof rate==='number'&&Number.isFinite(rate)&&rate>0)roles[key]=Math.min(100,Math.round(rate));
  }
  const max=mode==='large'||mode==='classroom'?40:15;
  return {
    mode,map:typeof v.map==='string'&&Object.hasOwn(MAPS,v.map)?v.map:base.map,
    capacity:n('capacity',mode==='large'?16:6,max),traitors:n('traitors',0,8),bots:n('bots',0,39),seconds:n('seconds',60,1200),
    speed:n('speed',3.5,7,false),crewSight:n('crewSight',4,13,false),shadeSight:n('shadeSight',5,16,false),
    stunDelay:n('stunDelay',6,70),sabotageDelay:n('sabotageDelay',15,150),meetings:n('meetings',0,3),talk:n('talk',8,90),vote:n('vote',8,75),
    votes:v.votes==='open'?'open':'secret',reveal:b('reveal'),tie:v.tie==='random'?'random':'none',tasks:n('tasks',1,6),
    difficulty:v.difficulty==='easy'||v.difficulty==='hard'||v.difficulty==='normal'?v.difficulty:base.difficulty,
    style:v.style==='choice'||v.style==='mixed'?v.style:base.style,ghosts:b('ghosts'),
    chat:v.chat==='off'||v.chat==='text'||v.chat==='quick'?v.chat:base.chat,sfx:b('sfx'),late:b('late'),rotate:b('rotate'),
    split:max===40&&b('split'),observer:mode==='classroom'&&b('observer'),roles,
  };
}

export type PublicQuestion=Omit<KartQuestion,'correct'|'problemId'|'options'>&{options?:string[]};
export type QuizFormat='choice'|'number'|'text';
export type Presence='active'|'ghost'|'watching';
export type Animation='idle'|'walk'|'run'|'task'|'surprise'|'report'|'sabotage'|'stunned'|'rescue'|'ghost'|'win'|'lose'|'emote';
export interface Actor extends Point {id:string;name:string;avatar:KartAvatar;face:number;presence:Presence;animation:Animation;emote?:Emote;shield?:boolean}
export interface Roster {id:string;name:string;color:number;species:number;connected:boolean;ready:boolean;bot:boolean;presence:Presence;voted?:boolean;role?:Role}
export interface TaskView {
  token:number;station:number;purpose:'study'|'repair';format:QuizFormat;question?:PublicQuestion;
  puzzle?:{kind:PuzzleKind;pieces:string[];started:number;pattern?:number[]};wrong?:boolean;
}
export interface StudyStats {tasks:number;answers:number;correct:number;repairs:number;cooperation:number;units:Record<string,{answers:number;correct:number}>}
export interface StudyReport extends StudyStats {id:string;name:string;questions:Record<string,{prompt:string;unit:string;answers:number;correct:number}>}
export interface MeetingMessage {id:number;from:string;line?:number;text?:string;station?:number;target?:string}
export interface MeetingView {by:string;victim?:string;messages:MeetingMessage[];voted:boolean;ejected?:string;revealed?:Role;totals?:Record<string,number>;ballots?:Record<string,string>}
export interface Alarm {kind:Disruption;ends:number;stations:number[];repaired:number[];door?:number}
export interface ActionHint {terminal?:number;repair?:number;body?:string;stun?:string;special?:string;meeting?:boolean;camera?:boolean;tunnel?:boolean;door?:boolean;hide?:boolean}
export interface Winner {side:Side|'ended';reason:'duties'|'vote'|'parity'|'failure'|'time'|'tagged'|'trick'|'ended'}
export type EventKind='correct'|'wrong'|'task'|'repair'|'stunned'|'rescue'|'block'|'alert'|'camera'|'portal'|'bonus';
export interface View {
  round:string;who:string;host:boolean;observer:boolean;settings:Settings;phase:Phase;now:number;deadline:number;paused:boolean;
  lesson:string;map:MapId;large:boolean;roster:Roster[];group:number;groups:{id:number;count:number;phase:Phase;done:number;total:number}[];
  canStart:boolean;canRematch:boolean;self?:Actor;actors:Actor[];bodies:{id:string;x:number;z:number;name:string}[];
  role?:Role;allies:string[];hint:ActionHint;completed:number[];assigned:number[];task?:TaskView;
  clock:number;done:number;total:number;alarm?:Alarm;meeting?:MeetingView;winner?:Winner;won?:boolean;report?:StudyStats;
  reports?:StudyReport[];stunReady?:number;sabotageReady?:number;abilityReady?:number;notes?:string[];camera?:number;
  event?:{serial:number;kind:EventKind};
}

export type Command=
  | {type:'input';x:number;z:number;run?:boolean}
  | {type:'ready';value:boolean}
  | {type:'profile';avatar:KartAvatar;name?:string}
  | {type:'settings';value:Settings}
  | {type:'start'|'rematch'|'leave'|'close-task'|'meeting'|'tunnel'|'hide'|'unseal'|'pause'|'end'|'force-meeting'|'finish-vote'|'extend'|'extend-talk'|'practice-task'}
  | {type:'task'|'repair'|'camera'|'group';id:number}
  | {type:'answer';token:number;choice?:number;text?:string;puzzle?:number[]}
  | {type:'stun'|'report'|'vote'|'kick';id:string}
  | {type:'ability';id?:string}
  | {type:'sabotage';kind:Disruption;door?:number}
  | {type:'say';line?:number;text?:string;station?:number;target?:string}
  | {type:'emote';emote:Emote};
export const normalizeCode=(value:string)=>value.normalize('NFKC').replace(/[^\d]/g,'').slice(0,6);
const scrub=(value:unknown,max:number)=>typeof value==='string'?value.normalize('NFKC').replace(/[\p{Cc}\p{Cf}]/gu,' ').trim().slice(0,max):'';
export const safeName=(value:unknown)=>scrub(value,18);
export const safeMessage=(value:unknown)=>scrub(value,100);
