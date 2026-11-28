import type { World } from '../engine';
import { MAP_HEIGHT, MAP_WIDTH } from '../worldDimensions';
import type { CityLot, CityState } from './model';

const adjacent=(x:number,z:number)=>[[x-1,z],[x+1,z],[x,z-1],[x,z+1]];
const tile=(x:number,z:number)=>z*MAP_WIDTH+x;
const point=(index:number)=>({x:index%MAP_WIDTH,z:Math.floor(index/MAP_WIDTH)});
const commuteCache=new WeakMap<CityState,{revision:number; routes:Map<string,ReturnType<typeof point>[]>;roads:Set<number>}>();

export function cityCommute(w:World,home:CityLot,job:CityLot) {
  const city=w.city!;
  let cache=commuteCache.get(city);
  if(!cache||cache.revision!==city.revision){
    cache={revision:city.revision,routes:new Map(),roads:new Set(city.roads)};
    commuteCache.set(city,cache);
  }
  const key=`${home.id}/${job.id}`;
  const found=cache.routes.get(key);
  if(found)return found;
  const road=(index:number)=>cache!.roads.has(index)||w.tiles[index]==='road';
  const goal=new Set(adjacent(job.x,job.y).map(([x,z])=>tile(x,z)).filter(road));
  const start=tile(home.x,home.y),queue=adjacent(home.x,home.y).map(([x,z])=>tile(x,z)).filter(road);
  const parents=new Map(queue.map(index=>[index,start]));
  const range=28;
  let end:number|undefined;
  for(let i=0;i<queue.length&&i<2048;i++){
    const index=queue[i],{x,z}=point(index);
    if(goal.has(index)){end=index;break;}
    for(const [nx,nz] of adjacent(x,z)){
      const next=tile(nx,nz);
      if(nx<1||nz<1||nx>=MAP_WIDTH-1||nz>=MAP_HEIGHT-1||Math.abs(nx-home.x)+Math.abs(nz-home.y)>range||parents.has(next)||!road(next))continue;
      queue.push(next);parents.set(next,index);
    }
  }
  const route:ReturnType<typeof point>[]=[];
  if(end!==undefined){
    route.push({x:job.x,z:job.y});
    for(let index=end;index!==start;index=parents.get(index)!)route.push(point(index));
    route.push(point(start));route.reverse();
  }
  cache.routes.set(key,route);
  return route;
}
