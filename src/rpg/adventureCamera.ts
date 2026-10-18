import type {World} from './engine';
import {blockAt,solid} from './voxel';
export interface Point3 {x:number;y:number;z:number}
/** Swept camera volume against authoritative voxels, not just loaded render meshes. */
export interface CameraBox {min:Point3;max:Point3}
export function cameraBoom(w:World,focus:Point3,direction:Point3,distance:number,buildings:CameraBox[]=[]){
 const radius=.22;
 for(let d=0;d<=distance;d+=.12){
  const p={x:focus.x+direction.x*d,y:focus.y+direction.y*d,z:focus.z+direction.z*d};
  if(buildings.some(b=>p.x+radius>b.min.x&&p.x-radius<b.max.x&&p.y+radius>b.min.y&&p.y-radius<b.max.y&&p.z+radius>b.min.z&&p.z-radius<b.max.z))return Math.max(0,d-.18);
  for(const [x,y,z] of [[0,0,0],[radius,0,0],[-radius,0,0],[0,radius,0],[0,-radius,0],[0,0,radius],[0,0,-radius]])
   if(solid(blockAt(w,Math.floor(p.x+x),Math.floor(p.y+y),Math.floor(p.z+z))))return Math.max(0,d-.18);
 }
 return distance;
}
/** Slow recovery avoids pumping resolution on transient frame spikes. Explicit quality is untouched. */
export class AdventureQuality {
 level=1;private elapsed=0;private frames=0;private cooldown=0;
 sample(dt:number,automatic:boolean){
  if(!automatic||dt<=0||dt>2)return false;dt=Math.min(.25,dt);
  this.elapsed+=dt;this.frames++;this.cooldown+=dt;
  if(this.elapsed<3)return false;
  const average=this.elapsed/this.frames;this.elapsed=0;this.frames=0;
  const next=average>1/28?Math.max(.6,this.level-.15):average<1/55&&this.cooldown>12?Math.min(1,this.level+.1):this.level;
  if(next===this.level)return false;this.level=next;this.cooldown=0;return true;
 }
}
