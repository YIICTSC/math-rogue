import type {Mission,Obstacle,Point,Run} from './engine';

// Each shared doorway is locked independently for the player viewing/using it.
// Mission switches keep their original indices; room locks have no switch buttons.
export function buildRoomBoundaries(mission:Mission,zones:Point[],spacing:number) {
 const obstacles:Obstacle[]=[],doorIndices:number[]=[],first=mission.switches?.length??0;
 const half=spacing/2,gap=3,thickness=.3;
 const box=(point:Point,length:number,vertical:boolean,kind:'wall'|'door',switchId?:number)=>{
  obstacles.push({...point,w:vertical?thickness:length,d:vertical?length:thickness,h:3,kind,switchId});
 };
 for(const zone of zones)for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const neighbor=zones.some(q=>Math.abs(q.x-zone.x-dx*spacing)<.01&&Math.abs(q.z-zone.z-dz*spacing)<.01);
  if(neighbor&&(dx<0||dz<0))continue;
  const center={x:zone.x+dx*half,z:zone.z+dz*half},vertical=dx!==0;
  if(!neighbor){box(center,spacing+thickness,vertical,'wall');continue;}
  const length=(spacing-gap)/2,offset=(spacing+gap)/4;
  for(const sign of [-1,1])box({x:center.x+(vertical?0:sign*offset),z:center.z+(vertical?sign*offset:0)},length,vertical,'wall');
  const index=first+doorIndices.length;doorIndices.push(index);box(center,gap,vertical,'door',index);
 }
 return {obstacles,doorIndices};
}
export function syncRoomDoors(run:Run,indices:number[]){for(const index of indices)run.switches[index]=run.status==='clear';}
