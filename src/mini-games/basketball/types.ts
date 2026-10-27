import type {KartAvatar} from '../gakuro-kart/avatar';
import type {Player as BasePlayer,PublicPlayer as BasePublicPlayer,PublicQuiz,LessonFactory,Team} from '../tennis/types';
export type {LessonFactory,Team};
export type Side=0|1;
export type Position='PG'|'SG'|'SF'|'PF'|'C';
export type Motion='idle'|'shot'|'dunk'|'pass'|'drive'|'block'|'rebound'|'screen'|'steal'|'celebrate';
export interface Stats {points:number;assists:number;rebounds:number;blocks:number;steals:number;}
export type Player=BasePlayer&{role?:Position;stats?:Stats};
export type PublicPlayer=BasePublicPlayer&{role:Position;stats:Stats};
export interface Unit {
 id:string;owner:string|null;name:string;side:Side;role:Position;avatar?:KartAvatar;cpu:boolean;
 x:number;y:number;vx:number;vy:number;energy:number;stamina:number;focus:number;
 charge:number;charging:boolean;release:number;motion:Motion;action:number;actionSeq:number;
 cooldown:number;dashCooldown:number;skillCooldown:number;dodge:number;catch:number;hurt:number;
 jump:number;screen:number;buff:number;aiAt:number;stats:Stats;
}
export interface Ball {
 x:number;y:number;z:number;vx:number;vy:number;vz:number;holder:string|null;side:Side|null;
 flight:number;special:boolean;pass:boolean;age:number;lock:number;trail:number[][];
 shooter:string|null;receiver:string|null;assist:string|null;points:2|3;success:boolean;
}
export type TutorialStage='move'|'dash'|'pass'|'receive'|'steal'|'shoot'|'complete';
export interface Tutorial {stage:TutorialStage;owner:string;startX:number;startY:number;elapsed:number;}
export interface Match {
 tutorial?:Tutorial;id:string;round:number;teams:[number,number|null];units:Unit[];
 phase:'study'|'play'|'finished';winner:number|null;reason:'bye'|'time'|'forfeit'|'';
 score:[number,number];shotClock:number;time:number;studyAt:number;ball:Ball;serial:number;
 notice:string;noticeAt:number;possession:Side;mustClear:boolean;inbound:number;
}
export interface BasketWorld {
 tutorialRequested?:boolean;version:2;seed:number;random:number;clock:number;
 phase:'lobby'|'playing'|'result';practice:boolean;paused:boolean;title:string;
 players:Record<string,Player>;teams:Team[];matches:Match[];round:number;nextRoundAt:number;champion:number|null;quizSerial:number;
}
export interface BasketView {
 version:2;clock:number;phase:BasketWorld['phase'];practice:boolean;paused:boolean;title:string;
 players:PublicPlayer[];teams:Team[];bracket:Pick<Match,'id'|'round'|'teams'|'phase'|'winner'|'reason'|'score'>[];
 round:number;champion:number|null;match:Match|null;quiz:PublicQuiz|null;
}
export type BasketCommand=
 |{type:'tutorial-complete'}|{type:'move';x:number;y:number}
 |{type:'throw';aim:number;special:boolean}|{type:'shot-start'}|{type:'shot-release'}|{type:'shot-cancel'}
 |{type:'catch'}|{type:'dodge'}|{type:'pass';target?:string}|{type:'block'}|{type:'rebound'}|{type:'screen'}|{type:'call'}|{type:'special'}
 |{type:'role';role:Position}|{type:'avatar';avatar:KartAvatar}
 |{type:'answer';id:number;index:number;option:number}|{type:'continue';id:number;index:number};
