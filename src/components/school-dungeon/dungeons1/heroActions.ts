import {cueD2HeroAction} from '../dungeons2/heroActions';

export type StudentAction='walk'|'attack'|'throw'|'swing'|'read'|'use'|'shoot';
export const D1_ACTION_ROWS={walk:[0,6],attack:[6,3],throw:[9,3],swing:[12,3],read:[15,3],use:[18,3],shoot:[21,3]} as const;
export const D1_ACTION_CELL=96;
const durations:Record<StudentAction,number>={walk:300,attack:360,throw:420,swing:480,read:720,use:600,shoot:420};
const motions=new Map<string,{action:StudentAction;started:number;duration:number;step:number}>();
const clock=()=>typeof performance==='undefined'?Date.now():performance.now();
/** Visual cues never advance the simulation or consume an extra turn. */
export function cueStudentAction(id:string,action:StudentAction){
 if(id.startsWith('dungeons2-')){cueD2HeroAction(id,action);return;}
 const previous=motions.get(id);
 motions.set(id,{action,started:clock(),duration:durations[action],step:action==='walk'?(previous?.step||0)+1:0});
}
export function studentActionSnapshot(id:string,now=clock()){
 const m=motions.get(id);if(!m||now<m.started||now-m.started>=m.duration)return null;
 const progress=(now-m.started)/m.duration,[first,count]=D1_ACTION_ROWS[m.action];
 const frame=m.action==='walk'?(Math.floor(progress*count)+(m.step%2)*3)%count:Math.min(count-1,Math.floor(progress*count));
 return {...m,progress,row:first+frame,frame};
}
export function clearStudentAction(id:string){motions.delete(id);}
