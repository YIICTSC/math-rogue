import type {CombatPose} from './mastery';
import {cueD2HeroAction,clearD2HeroAction} from '../dungeons2/heroActions';

import {D1_ACTION_ROWS,type StudentAction} from './actionLayout';
export {D1_ACTION_ROWS,D1_ACTION_CELL,type StudentAction} from './actionLayout';
const durations:Record<StudentAction,number>={walk:300,attack:360,throw:420,swing:480,read:720,use:600,shoot:420};
const motions=new Map<string,{action:StudentAction;started:number;duration:number;step:number;combatPose?:CombatPose}>();
const clock=()=>typeof performance==='undefined'?Date.now():performance.now();
/** Visual cues never advance the simulation or consume an extra turn. */
export function cueStudentAction(id:string,action:StudentAction){
 if(id.startsWith('dungeons2-')){cueD2HeroAction(id,action);return;}
 const previous=motions.get(id);
 motions.set(id,{action,started:clock(),duration:durations[action],step:action==='walk'?(previous?.step||0)+1:0});
}
export function cueStudentCombatPose(id:string,pose:CombatPose){cueStudentAction(id,'attack');const m=motions.get(id);if(m){m.combatPose=pose;m.duration=640;}}
export function studentActionSnapshot(id:string,now=clock()){
 const m=motions.get(id);if(!m||now<m.started||now-m.started>=m.duration)return null;
 const progress=(now-m.started)/m.duration,[first,count]=D1_ACTION_ROWS[m.action];
 const frame=m.action==='walk'?(Math.floor(progress*count)+(m.step%2)*3)%count:Math.min(count-1,Math.floor(progress*count));
 return {...m,progress,row:first+frame,frame};
}
export function clearStudentAction(id:string){motions.delete(id);clearD2HeroAction(id);}
