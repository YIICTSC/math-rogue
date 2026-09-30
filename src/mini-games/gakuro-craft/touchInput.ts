export type TouchControl='dpad'|'stick';
export const TOUCH_CONTROL_KEY='gakuro-craft-touch-control';
export function loadTouchControl():TouchControl{try{return localStorage.getItem(TOUCH_CONTROL_KEY)==='stick'?'stick':'dpad';}catch{return 'dpad';}}
export function saveTouchControl(value:TouchControl){try{localStorage.setItem(TOUCH_CONTROL_KEY,value);}catch{}}
// Convert a screen direction to the quarter-view map, with a radial dead zone.
export function stickVector(x:number,y:number,radius:number){
 if(![x,y,radius].every(Number.isFinite)||radius<=0)return {x:0,y:0,dx:0,dz:0};
 const distance=Math.hypot(x,y),length=Math.min(1,distance/radius),tx=distance?x/distance*length:0,ty=distance?y/distance*length:0,strength=Math.max(0,(length-.14)/.86);
 const dx=tx+ty*2,dz=ty*2-tx,n=Math.hypot(dx,dz)||1;
 return {x:tx,y:ty,dx:dx/n*strength,dz:dz/n*strength};
}
