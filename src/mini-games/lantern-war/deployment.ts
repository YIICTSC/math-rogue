import type {Battle} from './types';

const steps=[[1,0],[-1,0],[0,1],[0,-1]];
/** Repair old saves and random spawns without paving over rivers or siege walls. */
export function repairDeployments(b:Battle){
 const passable=(x:number,y:number)=>!!b.map[y]?.[x]&&!['w','#'].includes(b.map[y][x]);
 const cells:{x:number;y:number;region:number}[]=[],regions=new Map<string,number>(),sizes:number[]=[];
 for(let y=0;y<b.map.length;y++)for(let x=0;x<b.map[y].length;x++){
  if(!passable(x,y)||regions.has(x+','+y))continue;
  const region=sizes.length,queue=[{x,y}];let size=0;regions.set(x+','+y,region);
  for(let i=0;i<queue.length;i++){const p=queue[i];size++;cells.push({...p,region});
   for(const [dx,dy]of steps){const nx=p.x+dx,ny=p.y+dy,key=nx+','+ny;if(passable(nx,ny)&&!regions.has(key)){regions.set(key,region);queue.push({x:nx,y:ny});}}
  }sizes.push(size);
 }
 const usable=cells.filter(p=>sizes[p.region]>1),occupied=new Set<string>();
 // Reserve valid placements first so a displaced unit cannot move onto another squad.
 for(const q of b.squads)if(q.members.some(f=>f.hp>0)&&sizes[regions.get(q.x+','+q.y)??-1]>1)occupied.add(q.x+','+q.y);
 for(const q of b.squads){
  if(!q.members.some(f=>f.hp>0)||sizes[regions.get(q.x+','+q.y)??-1]>1)continue;
  const candidates=usable.filter(p=>!occupied.has(p.x+','+p.y));
  candidates.sort((a,z)=>Math.abs(a.x-q.x)+Math.abs(a.y-q.y)-Math.abs(z.x-q.x)-Math.abs(z.y-q.y)||sizes[z.region]-sizes[a.region]||a.y-z.y||a.x-z.x);
  const p=candidates[0];if(p){q.x=p.x;q.y=p.y;q.path=[];q.moving=false;occupied.add(p.x+','+p.y);}
 }
}
