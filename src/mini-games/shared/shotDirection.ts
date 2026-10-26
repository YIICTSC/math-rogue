export type DirectionInput={x:number;y:number};
export const FOLLOW_THROUGH_SECONDS=.4;
export function shotDirection(keys:ReadonlySet<string>,pad:DirectionInput):DirectionInput{
 const x=pad.x+Number(keys.has('arrowright')||keys.has('d'))-Number(keys.has('arrowleft')||keys.has('a'));
 const y=pad.y+Number(keys.has('arrowup')||keys.has('w'))-Number(keys.has('arrowdown')||keys.has('s'));
 const n=Math.max(1,Math.hypot(x,y));return{x:x/n,y:y/n};
}
/** The wide dodgeball camera turns the court by 90 degrees; input uses the same axes. */
export function dodgeDirection(input:DirectionInput,side:number,wide:boolean):DirectionInput{
 const flip=side===1?-1:1;return wide?{x:-input.y*flip,y:input.x*flip}:{x:input.x*flip,y:input.y*flip};
}
/** Speed-preserving, bounded follow-through. Only simulation time advances its window. */
export function bendShot(vx:number,vy:number,input:DirectionInput,elapsed:number,dt:number):DirectionInput{
 const span=Math.max(0,Math.min(dt,FOLLOW_THROUGH_SECONDS-(elapsed-dt))),speed=Math.hypot(vx,vy);
 if(!span||speed<.01)return{x:vx,y:vy};
 const turn=(vy*input.x-vx*input.y)/speed*(35*Math.PI/180)*span*Math.max(0,1-Math.max(0,elapsed-span/2)/FOLLOW_THROUGH_SECONDS);
 const c=Math.cos(turn),s=Math.sin(turn);return{x:vx*c+vy*s,y:vy*c-vx*s};
}
