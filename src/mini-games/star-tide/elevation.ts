/** Authored side pockets leave all story lanes, consoles, exits and camp approaches at level zero. */
export type Terrace={x:number;y:number;width:number;height:number;level:number;rampX:number};
const cache=new Map<string,Terrace[]>();
export function terracesFor(chapter:number,room:number):Terrace[]{
 if(room>=8)return [];const key=chapter+':'+room;if(cache.has(key))return cache.get(key)!;
 const pockets:Terrace[]=[{x:2,y:2,width:3,height:3,level:1,rampX:3},{x:11,y:2,width:3,height:3,level:room%3===0?2:1,rampX:12},{x:6,y:10,width:3,height:2,level:1,rampX:7}];
 const list=room===0?pockets.slice(0,2):room%2?pockets:pockets.filter((_,i)=>i!==room%3);
 cache.set(key,list);return list;
}
export function elevationAt(chapter:number,room:number,x:number,y:number){
 for(const t of terracesFor(chapter,room))if(x>=t.x&&x<t.x+t.width&&y>=t.y&&y<t.y+t.height){
  const u=x-t.x,v=y-t.y,cx=Math.max(.5,Math.min(t.width-.5,u)),cy=Math.max(.5,Math.min(t.height-.5,v));if(Math.hypot(u-cx,v-cy)>.5)return 0;
  if(Math.floor(x)===t.rampX&&y>=t.y+t.height-1)return t.level*(t.y+t.height-y);
  return t.level;
 }return 0;
}
export function canTraverseHeight(chapter:number,room:number,from:{x:number;y:number},to:{x:number;y:number},glide=false){
 const stair=terracesFor(chapter,room).some(t=>Math.floor(from.x)===t.rampX&&Math.floor(to.x)===t.rampX&&Math.min(from.y,to.y)>=t.y+t.height-1.5&&Math.max(from.y,to.y)<=t.y+t.height+.5&&Math.abs(to.y-from.y)<=.6);if(stair)return true;
 const delta=elevationAt(chapter,room,to.x,to.y)-elevationAt(chapter,room,from.x,from.y);
 return delta<=.45&&(glide||delta>=-.45);
}
export const vistaPoint=(t:Terrace)=>({x:t.x+.65,y:t.y+.65});
