import {battleMission} from './royale';
import {blocked,clearSight,distance,WEAPONS,type Point} from './engine';
import {answer,type OnlineWorld,type Participant,type VrInput} from './onlineEngine';
import {completeQuiz,requestSupply,safeRadius,magazineSize} from './onlineRules';
import {CELL,cellPoint,pointCell,type BombArena,type ArenaBomb} from './bombEngine';

const idle=():VrInput=>({x:0,z:0,crouch:false,interact:false,decoy:false});
const directions=[[1,0],[-1,0],[0,1],[0,-1]] as const;
type Brain={input:VrInput;path:Point[];thinkAt:number;answerAt:number;bombAt:number};

/** Local opponents use the same inputs, damage, pickups and refill rules as a player. */
export class SoloBots {
 private clock=0;
 private brains=new Map<string,Brain>();
 private navigation=new Map<string,boolean>();
 private coverKey='';
 constructor(readonly ids:string[]){}
 update(w:OnlineWorld,controls:Record<string,VrInput>,dt:number){
  if(w.paused)return;this.clock+=dt;
  for(const id of this.ids){
   const p=w.players[id];if(!p?.connected){delete controls[id];continue;}
   let b=this.brains.get(id);if(!b){b={input:idle(),path:[],thinkAt:0,answerAt:this.clock+.8,bombAt:0};this.brains.set(id,b);}
   if(p.quiz){
    controls[id]=idle();
    if(this.clock>=b.answerAt){
     const index=p.quizQuestions[w.mode==='bomb'?0:p.answers.length],q=w.lesson.questions[index];
     if(q)answer(w,id,q.correct,p.quizRound);
     if(w.mode==='bomb'){if(p.bomb.stock>=3||w.phase==='result')p.quiz=false;}else if(p.answers.length===3)completeQuiz(w,id);
     b.answerAt=this.clock+.8;
    }
    continue;
   }
   b.answerAt=this.clock+.8;
   if(w.phase!=='playing'||p.out){controls[id]=idle();continue;}
   if(this.clock>=b.thinkAt){
    b.input=w.mode==='bomb'?this.bomb(w,p,b):this.royale(w,p,b);
    b.thinkAt=this.clock+(w.mode==='bomb'?.2:.65);
   }
   const next=b.path[0];
   if(next){
    if(distance(p.run.player,next)<.18)b.path.shift();
    const goal=b.path[0];if(goal){const dx=goal.x-p.run.player.x,dz=goal.z-p.run.player.z,n=Math.max(1,Math.hypot(dx,dz));b.input.x=dx/n;b.input.z=dz/n;}else b.input.x=b.input.z=0;
   }
   controls[id]={...b.input};b.input.bomb=b.input.remote=b.input.useItem=false;
  }
 }
 private route(w:OnlineWorld,from:Point,to:Point):Point[]{
  const clear=(a:Point,b:Point)=>{const n=Math.ceil(distance(a,b)/.3);for(let i=1;i<=n;i++)if(blocked(w.mission,{x:a.x+(b.x-a.x)*i/n,z:a.z+(b.z-a.z)*i/n},.32))return false;return true;};
  if(clear(from,to))return [{...to}];
  const start={x:Math.round(from.x*2),z:Math.round(from.z*2)},goal={x:Math.round(to.x*2),z:Math.round(to.z*2)},key=(p:Point)=>`${p.x},${p.z}`;
  const heuristic=(p:Point)=>Math.abs(p.x-goal.x)+Math.abs(p.z-goal.z);
  const open=[{...start,g:0,f:heuristic(start)}],cost=new Map([[key(start),0]]),parents=new Map<string,Point>(),closed=new Set<string>();let best=start,bestH=heuristic(start);
  for(let budget=0;open.length&&budget<1800;budget++){
   let pick=0;for(let i=1;i<open.length;i++)if(open[i].f<open[pick].f)pick=i;
   const node=open.splice(pick,1)[0],id=key(node);if(closed.has(id))continue;closed.add(id);
   const h=heuristic(node);if(h<bestH){best=node;bestH=h;}if(h===0)break;
   for(const [dx,dz]of directions){
    const next={x:node.x+dx,z:node.z+dz},nid=key(next),g=node.g+1;
    if(closed.has(nid)||g>=(cost.get(nid)??Infinity))continue;
    let pass=this.navigation.get(nid);if(pass===undefined){pass=!blocked(w.mission,{x:next.x/2,z:next.z/2},.32);this.navigation.set(nid,pass);}
    if(!pass)continue;cost.set(nid,g);parents.set(nid,node);open.push({...next,g,f:g+heuristic(next)});
   }
  }
  const path:Point[]=[];for(let q:Point|undefined=best;q&&key(q)!==key(start);q=parents.get(key(q)))path.unshift({x:q.x/2,z:q.z/2});
  if(bestH===0&&path.length&&clear(path.at(-1)!,to))path.push({...to});return path;
 }
 private royale(w:OnlineWorld,p:Participant,b:Brain):VrInput{
  const coverKey=(w.royale?.covers??[]).map(c=>c.id).join(',');if(coverKey!==this.coverKey){this.navigation.clear();this.coverKey=coverKey;}
  w={...w,mission:battleMission(w)};
  const input=idle(),own=p.run.player,weapon=WEAPONS[p.run.weapon],armed=p.weapons[p.run.weapon];
  const enemies=Object.values(w.players).filter(q=>q!==p&&q.connected&&!q.spectator&&!q.out&&!q.quiz&&(q.run.stealth<=0||distance(own,q.run.player)<2)).sort((a,c)=>distance(own,a.run.player)-distance(own,c.run.player));
  const target=enemies[0],radius=safeRadius(w);let goal:Point|undefined;
  if(Math.hypot(own.x,own.z)>radius-1.5)goal={x:own.x*.7,z:own.z*.7};
  else if(!armed){goal=w.supplies.filter(s=>s.kind==='weapon'&&s.readyAt<=w.time).sort((a,c)=>distance(own,a)-distance(own,c))[0];}
  else if(p.hits>0){goal=w.supplies.filter(s=>s.kind==='repair'&&s.readyAt<=w.time&&distance(own,s)<8).sort((a,c)=>distance(own,a)-distance(own,c))[0];}
  if(!goal&&p.battle.shield<2)goal=w.supplies.filter(s=>s.kind==='shield'&&s.readyAt<=w.time&&distance(own,s)<7).sort((a,c)=>distance(own,a)-distance(own,c))[0];
  if(armed&&p.run.ammo<weapon.cost){
   if(p.run.items[1]>0){input.item=1;input.useItem=true;}
   else if(p.energy>=25)input.reload=true;
   else if(w.time>=p.nextSupplyAt)requestSupply(w,p.id);
  }
  if(target){
   const d=distance(own,target.run.player),sight=clearSight(w.mission,own,target.run.player,false);
   input.facing=Math.atan2(target.run.player.x-own.x,target.run.player.z-own.z)+Math.sin(w.time+p.id.length)*.035;
   input.shoot=!!armed&&d<weapon.range-.1&&sight;
   if(!goal&&(!armed||!sight||d>weapon.range*.65))goal=target.run.player;
  }
  input.sprint=!!goal&&!input.shoot&&distance(own,goal)>5;
  input.cover=w.time-p.battle.hitAt<1.2&&!!target&&p.battle.materials>0&&!w.royale?.covers.some(c=>c.owner===p.id);
  b.path=goal?this.route(w,own,goal):[];
  if(!armed&&!goal)b.path=this.route(w,own,{x:0,z:0});
  return input;
 }
 private danger(a:BombArena,bombs:readonly ArenaBomb[],w:OnlineWorld):Set<number>{
  const cells=new Set(a.flames.filter(f=>f.until>w.time).map(f=>f.z*a.side+f.x));
  for(const bomb of bombs){
   cells.add(bomb.z*a.side+bomb.x);
   for(const [dx,dz]of directions)for(let i=1;i<=bomb.range;i++){
    const x=bomb.x+dx*i,z=bomb.z+dz*i,index=z*a.side+x;
    if(x<0||z<0||x>=a.side||z>=a.side||a.cells[index]===1)break;
    cells.add(index);if(a.cells[index]===2)break;
   }
  }
  return cells;
 }
 private cells(a:BombArena,p:Participant){
  const start=pointCell(a,p.run.player),key=(v:Point)=>v.z*a.side+v.x,queue=[start],parents=new Map<number,Point|null>([[key(start),null]]);
  for(let i=0;i<queue.length;i++)for(const [dx,dz]of directions){
   const next={x:queue[i].x+dx,z:queue[i].z+dz},id=key(next);
   if(next.x<0||next.z<0||next.x>=a.side||next.z>=a.side||parents.has(id)||a.cells[id]!==0||a.bombs.some(b=>b.x===next.x&&b.z===next.z))continue;
   parents.set(id,queue[i]);queue.push(next);
  }
  const path=(goal:Point)=>{const points:Point[]=[];for(let q:Point|null|undefined=goal;q&&parents.get(key(q));q=parents.get(key(q)))points.unshift(cellPoint(a,q.x,q.z));return points;};
  return {start,key,queue,path};
 }
 private bomb(w:OnlineWorld,p:Participant,b:Brain):VrInput{
  const a=w.bombArena!,input=idle(),search=this.cells(a,p),danger=this.danger(a,a.bombs,w),current=search.key(search.start);
  const destination=b.path.at(-1);
  if(destination&&!danger.has(search.key(pointCell(a,destination)))&&b.path.every(point=>{const c=pointCell(a,point);return a.cells[search.key(c)]===0&&!a.flames.some(f=>f.x===c.x&&f.z===c.z)&&!a.bombs.some(q=>q.x===c.x&&q.z===c.z&&!q.pass.includes(p.id));}))return input;
  const safe=search.queue.find(c=>!danger.has(search.key(c)));
  if(danger.has(current)){b.path=safe?search.path(safe):[];return input;}
  if(p.bomb.remote&&a.bombs.some(q=>q.owner===p.id)){input.remote=true;}
  if(p.bomb.stock<3&&!a.bombs.some(q=>q.owner===p.id)&&w.phase==='playing'){requestSupply(w,p.id);if(p.quiz){b.path=[];return input;}}
  const enemies=Object.values(w.players).filter(q=>q!==p&&q.connected&&!q.spectator&&!q.out);
  const nearEnemy=enemies.some(q=>{const c=pointCell(a,q.run.player);return (c.x===search.start.x||c.z===search.start.z)&&Math.abs(c.x-search.start.x)+Math.abs(c.z-search.start.z)<=p.bomb.range;});
  const nearCrate=directions.some(([dx,dz])=>a.cells[(search.start.z+dz)*a.side+search.start.x+dx]===2);
  if((nearEnemy||nearCrate)&&p.bomb.stock&&this.clock>=b.bombAt&&distance(p.run.player,cellPoint(a,search.start.x,search.start.z))<.22){
   const candidate={id:-1,owner:p.id,...search.start,range:p.bomb.range,fuse:2.5,remote:false,pass:[p.id],dx:0,dz:0,move:0};
   const threat=this.danger(a,[...a.bombs,candidate],w),escape=search.queue.find(c=>!threat.has(search.key(c)));
   if(escape){const path=search.path(escape);if(path.length*CELL/p.bomb.speed+.3<2.5){input.bomb=true;b.bombAt=this.clock+1.8;b.path=path;return input;}}
  }
  const foe=enemies.sort((x,y)=>distance(p.run.player,x.run.player)-distance(p.run.player,y.run.player))[0];
  const goals=search.queue.filter(c=>!danger.has(search.key(c))&&(!(nearCrate||nearEnemy)||search.key(c)!==current));
  const rank=(c:Point)=>{
   const point=cellPoint(a,c.x,c.z),drop=a.drops.some(d=>d.x===c.x&&d.z===c.z);
   const crate=directions.some(([dx,dz])=>a.cells[(c.z+dz)*a.side+c.x+dx]===2);
   return (drop?-12:crate?-4:0)+(foe?distance(point,foe.run.player)*.25:0)+distance(p.run.player,point)*.08;
  };
  goals.sort((x,y)=>rank(x)-rank(y));b.path=goals[0]?search.path(goals[0]):[];
  if(!b.path.length&&goals[0]&&distance(p.run.player,cellPoint(a,goals[0].x,goals[0].z))>.18)b.path=[cellPoint(a,goals[0].x,goals[0].z)];
  return input;
 }
}
