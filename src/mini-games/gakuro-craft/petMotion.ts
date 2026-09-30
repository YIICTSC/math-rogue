import type {Home} from './progression';
export function petPose(home:Home,time:number){
 const tile=Math.max(0,home.tile),size=Math.max(1,home.level)*2+2,free=Array.from({length:size*size},(_,i)=>i).filter(i=>!home.furniture.some(f=>f.slot===i)),available=new Set(free),origin=free[0]??size*size-1,reachable=[origin],seen=new Set([origin]);
 for(let n=0;n<reachable.length;n++){const i=reachable[n];for(const j of [i-size,i+size,...(i%size?[i-1]:[]),...(i%size<size-1?[i+1]:[])])if(available.has(j)&&!seen.has(j)){seen.add(j);reachable.push(j);}}
 const cells=reachable,cycle=Math.floor(time/42),phase=time%42,a=cells[(cycle*7+tile)%cells.length],b=cells[((cycle+1)*7+tile)%cells.length],parents=new Map<number,number>(),queue=[a];parents.set(a,a);
 for(let n=0;n<queue.length&&!parents.has(b);n++){const i=queue[n];for(const j of [i-size,i+size,...(i%size?[i-1]:[]),...(i%size<size-1?[i+1]:[])])if(seen.has(j)&&!parents.has(j)){parents.set(j,i);queue.push(j);}}
 const path=[b];while(path[0]!==a&&parents.has(path[0]))path.unshift(parents.get(path[0])!);const walking=phase<12,position=(walking?phase/12:1)*Math.max(0,path.length-1),index=Math.min(path.length-1,Math.floor(position)),from=path[index],to=path[Math.min(index+1,path.length-1)],mix=position-index,happy=time-(home.pet?.careAt??-100)<4;
 const affection=home.pet?.affection??30,frame=happy?(affection>=100?5:4):walking?Math.floor(time*5)%2:phase<24?2:phase<34?3:affection>=100&&Math.floor(time*2)%2?5:4;
 return {x:from%size*(1-mix)+to%size*mix,z:Math.floor(from/size)*(1-mix)+Math.floor(to/size)*mix,frame,flip:(to%size-Math.floor(to/size))<(from%size-Math.floor(from/size)),behavior:frame===5?'おなかを見せています':happy?'遊んでいます':walking?'歩いています':phase<24?'毛づくろい中':phase<34?'お昼寝中':'遊んでいます'};
}
