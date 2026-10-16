import {ROAD_WIDTH,type Point,type Track} from './track';

export type SceneryBounds={min:Point;max:Point};
// Include the foundation/rails and enough space for racers, jumps and the camera.
export const SCENERY_ROAD_MARGIN=ROAD_WIDTH/2+4;
export const SCENERY_HEADROOM=8;

/** Test the complete closed circuit, including other bends and elevated sections. */
export class SceneryClearance {
 constructor(private track:Track){}
 firstIntersection(bounds:SceneryBounds):number{
  const min={x:bounds.min.x-SCENERY_ROAD_MARGIN,y:bounds.min.y-SCENERY_HEADROOM,z:bounds.min.z-SCENERY_ROAD_MARGIN};
  const max={x:bounds.max.x+SCENERY_ROAD_MARGIN,y:bounds.max.y+.6,z:bounds.max.z+SCENERY_ROAD_MARGIN};
  const points=this.track.points;
  for(let i=0;i<points.length;i++){
   const a=points[i],b=points[(i+1)%points.length];
   if(Math.max(a.x,b.x)<min.x||Math.min(a.x,b.x)>max.x||Math.max(a.z,b.z)<min.z||Math.min(a.z,b.z)>max.z||Math.max(a.y,b.y)<min.y||Math.min(a.y,b.y)>max.y)continue;
   let from=0,to=1;
   for(const axis of ['x','y','z'] as const){
    const delta=b[axis]-a[axis];
    if(Math.abs(delta)<1e-9){if(a[axis]<min[axis]||a[axis]>max[axis]){from=1;to=0;break;}}
    else{const t1=(min[axis]-a[axis])/delta,t2=(max[axis]-a[axis])/delta;from=Math.max(from,Math.min(t1,t2));to=Math.min(to,Math.max(t1,t2));if(from>to)break;}
   }
   if(from<=to)return i;
  }
  return -1;
 }
}
