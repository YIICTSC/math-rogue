import type{KartAvatar}from'../gakuro-kart/avatar';
import type{Player,PublicPlayer,PublicQuiz,LessonFactory,Team}from'../tennis/types';
export type{Player,LessonFactory,Team};
export type Side=0|1;
export interface Unit{id:string;owner:string|null;name:string;side:Side;x:number;y:number;vx:number;vy:number;hp:number;out:boolean;cpu:boolean;avatar?:KartAvatar;energy:number;catch:number;cooldown:number;dodge:number;dashCooldown:number;hurt:number;action:number;actionSeq:number;}
export interface Ball{x:number;y:number;z:number;vx:number;vy:number;vz:number;holder:string|null;side:Side|null;flight:number;special:boolean;pass:boolean;age:number;lock:number;trail:number[][];}
export interface Match{id:string;round:number;teams:[number,number|null];units:Unit[];phase:'study'|'play'|'finished';winner:number|null;reason:'bye'|'eliminated'|'time'|'forfeit'|'';time:number;studyAt:number;ball:Ball;serial:number;notice:string;}
export interface DodgeWorld{version:1;seed:number;random:number;clock:number;phase:'lobby'|'playing'|'result';practice:boolean;paused:boolean;title:string;players:Record<string,Player>;teams:Team[];matches:Match[];round:number;nextRoundAt:number;champion:number|null;quizSerial:number;}
export interface DodgeView{version:1;clock:number;phase:DodgeWorld['phase'];practice:boolean;paused:boolean;title:string;players:PublicPlayer[];teams:Team[];bracket:Pick<Match,'id'|'round'|'teams'|'phase'|'winner'|'reason'>[];round:number;champion:number|null;match:Match|null;quiz:PublicQuiz|null;}
export type DodgeCommand={type:'move';x:number;y:number}|{type:'throw';aim:number;special:boolean}|{type:'catch'}|{type:'dodge'}|{type:'pass'}|{type:'avatar';avatar:KartAvatar}|{type:'answer';id:number;index:number;option:number}|{type:'continue';id:number;index:number};
