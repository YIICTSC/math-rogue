import { canStand, sight, type MissionMap, type Point } from './maps';

const stride=.6;
interface Grid { columns:number; rows:number; open:Uint8Array }
const gridCache = new WeakMap<MissionMap,Map<number,Grid>>();

function navigation(map:MissionMap,door:number){
  let variants=gridCache.get(map);
  if(!variants)gridCache.set(map,variants=new Map());
  const existing=variants.get(door);if(existing)return existing;
  const columns=Math.floor(map.w/stride),rows=Math.floor(map.d/stride);
  const open=new Uint8Array(columns*rows);
  for(let i=0;i<open.length;i++) open[i]=Number(canStand(map,cell(i,columns),door));
  const grid={columns,rows,open};variants.set(door,grid);return grid;
}
const cell=(i:number,cols:number):Point=>({x:(i%cols+.5)*stride,z:(Math.floor(i/cols)+.5)*stride});

export function pathTo(map:MissionMap,from:Point,to:Point,door:number):Point[]{
  if(sight(map,from,to,door)&&Array.from({length:9},(_,i)=>i/8).every(t=>canStand(map,{x:from.x+(to.x-from.x)*t,z:from.z+(to.z-from.z)*t},door)))return [to];
  const {columns,rows,open}=navigation(map,door);
  const closest=(p:Point)=>{
    const x=Math.floor(p.x/stride),z=Math.floor(p.z/stride);
    let nearest=-1,best=Infinity;
    for(let j=Math.max(0,z-2);j<=Math.min(rows-1,z+2);j++)for(let i=Math.max(0,x-2);i<=Math.min(columns-1,x+2);i++){
      const id=j*columns+i;
      if(!open[id])continue;
      const d=(i+.5-p.x/stride)**2+(j+.5-p.z/stride)**2;
      if(d<best){nearest=id;best=d;}
    }
    return nearest;
  };
  const start=closest(from),end=closest(to);
  if(start<0||end<0)return [];
  const previous=new Int32Array(open.length).fill(-1),queue=new Int32Array(open.length);
  let read=0,write=1;queue[0]=start;previous[start]=start;
  while(read<write&&previous[end]<0){
    const here=queue[read++],col=here%columns;
    for(const next of [col>0?here-1:-1,col<columns-1?here+1:-1,here-columns,here+columns]){
      if(next>=0&&next<open.length&&open[next]&&previous[next]<0){previous[next]=here;queue[write++]=next;}
    }
  }
  if(previous[end]<0)return [];
  const points=[to];
  for(let i=end;i!==start;i=previous[i])points.push(cell(i,columns));
  return points.reverse();
}
