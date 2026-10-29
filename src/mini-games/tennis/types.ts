import type {CpuSpecialBudget} from '../shared/cpuSpecialBudget';
import type {SportsEventBuffer} from '../shared/sportsEvents';
import type {KartAvatar} from '../gakuro-kart/avatar';
import type {KartLesson,KartQuestion} from '../gakuro-kart/learning';
export type Mode='singles'|'doubles';
export type Shot='topspin'|'slice'|'lob'|'drop'|'special';
export type Side=0|1;
export type LessonFactory=(history:string[])=>KartLesson;
export interface Player {id:string;name:string;slot:number;connected:boolean;spectator:boolean;avatar?:KartAvatar;correct:number;history:string[];quiz:Quiz|null;input:{x:number;y:number;at:number};}
export interface Quiz {id:number;index:number;lesson:KartLesson;selected:number|null;feedback:number|null;}
export interface Team {id:number;name:string;members:(string|null)[];}
export interface Unit {id:string;owner:string|null;name:string;side:Side;x:number;y:number;vx:number;vy:number;energy:number;stamina:number;swing:number;shot:Shot;shotSeq:number;buffer:number;aim:number;directionY:number;power:number;dash:number;cpu:boolean;avatar?:KartAvatar;}
export interface Ball {x:number;y:number;z:number;vx:number;vy:number;vz:number;spin:number;lastSide:Side;bounces:number;serve:boolean;netLet:boolean;trail:number[][];}
export type CourtPhase='study'|'serve'|'rally'|'point'|'finished';
export interface Match extends SportsEventBuffer, CpuSpecialBudget {id:string;round:number;teams:[number,number|null];units:Unit[];games:[number,number];points:[number,number];tiebreak:boolean;phase:CourtPhase;winner:number|null;reason:'ace'|'double-fault'|'out'|'net'|'bounce'|'winner'|'forfeit'|'bye'|'let'|'';server:Side;serverUnit:number;receiver:string;faults:number;ball:Ball;time:number;wait:number;rally:number;longest:number;pointSerial:number;shotSerial:number;studyAt:number;pendingWinner:number|null;afterStudy:'serve'|'finish';}
export interface TennisWorld {version:1;seed:number;random:number;clock:number;phase:'lobby'|'playing'|'result';mode:Mode;targetGames:1|3|6;practice:boolean;paused:boolean;title:string;players:Record<string,Player>;teams:Team[];matches:Match[];round:number;nextRoundAt:number;champion:number|null;quizSerial:number;}
export interface PublicPlayer {id:string;name:string;slot:number;connected:boolean;spectator:boolean;avatar?:KartAvatar;correct:number;studying:boolean;}
export type PublicQuiz={id:number;index:number;question:Omit<KartQuestion,'correct'>;selected:number|null;answer:number|null};
export type BracketMatch=Pick<Match,'id'|'round'|'teams'|'games'|'points'|'tiebreak'|'phase'|'winner'|'reason'>;
export interface TennisView {version:1;clock:number;phase:TennisWorld['phase'];mode:Mode;targetGames:1|3|6;practice:boolean;paused:boolean;title:string;players:PublicPlayer[];teams:Team[];bracket:BracketMatch[];round:number;champion:number|null;match:Match|null;quiz:PublicQuiz|null;}
export type TennisCommand={type:'move';x:number;y:number}|{type:'swing';shot:Shot;aim:number;directionY?:number;power:number}|{type:'dash'}|{type:'answer';id:number;index:number;option:number}|{type:'continue';id:number;index:number}|{type:'avatar';avatar:KartAvatar};
