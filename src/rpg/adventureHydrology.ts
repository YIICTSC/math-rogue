import type {AdventurePeak} from './adventureTerrain';
export interface SpringWater {surface:number;depth:number;flowX:number;flowZ:number;kind:'waterfall'}
/** A spring cuts a one-block bed and follows downhill cells; no uphill or floating water. */
export function traceAdventureSprings(peaks:readonly AdventurePeak[],height:(x:number,z:number)=>number,allowed:(x:number,z:number)=>boolean){
 const cells=new Map<string,SpringWater>();
 for(const peak of peaks.slice(0,2)){
  let x=peak.x+Math.max(3,Math.floor(peak.radius*.23)),z=peak.z;
  if(!allowed(x,z)||height(x,z)<10)continue;
  const visited=new Set<string>();let previous={x:1,z:0};
  for(let step=0;step<64;step++){
   const key=x+','+z,h=height(x,z);if(visited.has(key)||!allowed(x,z))break;visited.add(key);
   const next=[[1,0],[0,1],[0,-1],[-1,0]].map(([dx,dz])=>({x:x+dx,z:z+dz,dx,dz,h:height(x+dx,z+dz)}))
    .filter(p=>allowed(p.x,p.z)&&!visited.has(p.x+','+p.z)&&p.h<=h)
    .sort((a,b)=>a.h-b.h-(a.dx*previous.x+a.dz*previous.z-b.dx*previous.x-b.dz*previous.z)*.01)[0];
   cells.set(key,{surface:h,depth:1,flowX:next?.dx||0,flowZ:next?.dz||0,kind:'waterfall'});
   if(!next||h<=0)break;x=next.x;z=next.z;previous={x:next.dx,z:next.dz};
  }
 }
 return cells;
}
