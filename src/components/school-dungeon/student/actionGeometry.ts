import type {StudentAction} from '../dungeons1/actionLayout';

/** Same screen-space order as the original direction sheets. Never mirror art. */
export const ACTION_DIRECTIONS=[{x:0,y:1},{x:0,y:-1},{x:1,y:0},{x:-1,y:0},{x:1,y:1},{x:-1,y:1},{x:1,y:-1},{x:-1,y:-1}] as const;
export const directedAction=(action:StudentAction)=>['attack','throw','swing','shoot'].includes(action);
export function actionGeometry(facing:number,frame:number,action:StudentAction){
 const dir=ACTION_DIRECTIONS[facing]||ACTION_DIRECTIONS[0];
 const length=Math.hypot(dir.x,dir.y),x=dir.x/length,y=dir.y/length;
 const phase=Math.max(0,Math.min(2,frame));
 const reach=action==='throw'||action==='shoot'?[5,17,10][phase]:[6,15,8][phase];
 const angle=Math.atan2(y,x)+(action==='attack'||action==='swing'?[-.55,0,.3][phase]:0);
 return {x,y,reach,angle,behind:dir.y<0};
}
/** All non-walking actions have three distinct anticipation/impact/recovery poses. */
export function actionPoseFrame(action:StudentAction,progress:number,step=0){
 const count=action==='walk'?6:3,frame=Math.min(count-1,Math.max(0,Math.floor(progress*count)));
 return action==='walk'?(frame+(step%2)*3)%6:frame;
}
