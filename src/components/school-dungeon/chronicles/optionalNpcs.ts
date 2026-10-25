import type {AdventureState} from '../adventure';
import {chronicleStage} from './story';

export const isConversationNpc=(event?:{kind:string})=>Boolean(event&&['CHRONICLE','PERSONAL','FRIEND'].includes(event.kind));

/** Place optional encounters on reachable, empty tiles without closing a route. */
export function syncOptionalNpcs(state:AdventureState,map:string[][],player:{x:number;y:number},entities:{x:number;y:number}[],goal:number,acts:{floor:number}[]){
 const before=JSON.stringify(state.events),key=(x:number,y:number)=>`${x},${y}`;
 const desired=new Set<string>();
 if(state.chronicle&&!state.chronicle.completed&&chronicleStage(state.floor,goal,state.chronicle)>=0)desired.add('CHRONICLE');
 if(state.mode==='STORY'&&acts.some(a=>a.floor<21&&a.floor<=state.floor&&!state.storySeen?.includes(a.floor)))desired.add('PERSONAL');
 for(const [k,event]of Object.entries(state.events))if(['CHRONICLE','PERSONAL'].includes(event.kind)&&(!desired.has(event.kind)||event.done))delete state.events[k];
 const reachable=new Set<string>(),queue=[[player.x,player.y]];
 for(let i=0;i<queue.length;i++){const [x,y]=queue[i],k=key(x,y);if(reachable.has(k)||!map[y]?.[x]||map[y][x]==='WALL')continue;reachable.add(k);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])queue.push([x+dx,y+dy]);}
 const occupied=new Set(entities.map(e=>key(e.x,e.y)));occupied.add(key(player.x,player.y));
 const candidates=[...reachable].map(k=>{const[x,y]=k.split(',').map(Number);return {k,x,y,d:Math.abs(x-player.x)+Math.abs(y-player.y)};}).filter(c=>c.d>=2&&map[c.y][c.x]==='FLOOR'&&!occupied.has(c.k)&&!state.terrain[c.k]);
 candidates.sort((a,b)=>a.d-b.d||a.y-b.y||a.x-b.x);
 const keepsPathsOpen=(blocked:Set<string>)=>{
  const visited=new Set<string>(),q=[[player.x,player.y]];
  for(let i=0;i<q.length;i++){const[x,y]=q[i],k=key(x,y);if(visited.has(k)||blocked.has(k)||!reachable.has(k))continue;visited.add(k);for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])q.push([x+dx,y+dy]);}
  return visited.size===reachable.size-[...blocked].filter(k=>reachable.has(k)).length;
 };
 const blocked=new Set(Object.entries(state.events).filter(([,e])=>isConversationNpc(e)&&!e.done&&!e.passable).map(([k])=>k));
 for(const kind of desired){if(Object.values(state.events).some(e=>e.kind===kind&&!e.done))continue;
  const solid=candidates.find(c=>!state.events[c.k]&&keepsPathsOpen(new Set([...blocked,c.k]))),cell=solid||candidates.find(c=>!state.events[c.k]);if(!cell)continue;
  // Fixed puzzles may be a single narrow lane. Keep the NPC passable in that case.
  state.events[cell.k]={kind,done:false,...(!solid?{passable:true}:{})};if(solid)blocked.add(cell.k);
 }
 return before!==JSON.stringify(state.events);
}
