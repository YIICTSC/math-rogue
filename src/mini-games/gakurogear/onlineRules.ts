import { blocked, clearSight, distance, floorHeight, MISSIONS, type Input, type Point } from './engine';
import type { KartLesson } from '../gakuro-kart/learning';
import type { OnlineWorld, Participant } from './onlineEngine';

export type Supply = Point & { id: number; kind: 'ammo' | 'energy' | 'repair'; readyAt: number };
export const magazineSize=(weapon:number)=>[6,4,4,12,0,0][weapon]??6;
export const newStats = () => ({ assists: 0, rescues: 0, hits: 0, correct: 0 });
function random(seed: number) { let n=seed>>>0;return()=>{n+=0x6d2b79f5;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;}; }
export function safeRadius(w: OnlineWorld): number {
 const initial=(w.mission.size??18)-1, begin=w.limit*.2, end=w.limit*.85;
 return initial+(3-initial)*Math.max(0,Math.min(1,(w.time-begin)/(end-begin)));
}
export function zoneOffset(w:OnlineWorld,index:number):Point {
 const count=Object.keys(w.players).length,columns=Math.ceil(Math.sqrt(count)),rows=Math.ceil(count/columns),base=MISSIONS[w.missionId-1],spacing=2*(base.size??8)+1;
 return {x:(index%columns-(columns-1)/2)*spacing,z:(Math.floor(index/columns)-(rows-1)/2)*spacing};
}
export function beginQuiz(w:OnlineWorld,p:Participant,reason:Participant['quizReason']='recovery') {
 if(p.quiz)return;
 const unique=[...new Map(w.lesson.questions.map((q,i)=>[JSON.stringify([q.mode,q.question,q.passage??'',q.options[q.correct]]),i])).values()];
 p.quizQuestions=[];
 for(let i=0;i<3;i++){
  if(!p.quizDeck.length){
   const rand=random(w.seed+p.id.split('').reduce((n,c)=>n+c.charCodeAt(0),0)+p.quizCycle++*7919);
   p.quizDeck=[...unique];for(let j=p.quizDeck.length-1;j>0;j--){const k=Math.floor(rand()*(j+1));[p.quizDeck[j],p.quizDeck[k]]=[p.quizDeck[k],p.quizDeck[j]];}
   if(p.quizDeck.length>1&&p.quizDeck[0]===p.lastQuestion)p.quizDeck.push(p.quizDeck.shift()!);
  }
  const next=p.quizDeck.shift()!;p.quizQuestions.push(next);p.lastQuestion=next;
 }
 p.quiz=true;p.quizRound++;p.answers=[];p.quizCorrect=0;p.quizReason=reason;p.nextSupplyAt=w.time+30;
}
export function quizLesson(w:OnlineWorld,p:Participant):KartLesson {
 return {...w.lesson,questions:(p.quizQuestions.length===3?p.quizQuestions:[0,1,2]).map(i=>w.lesson.questions[i])};
}
export function requestSupply(w:OnlineWorld,id:string) {
 const p=w.players[id];if(w.phase!=='playing'||!p?.connected||p.quiz||w.paused||w.time<p.nextSupplyAt)return false;
 beginQuiz(w,p,'supply');return true;
}
export function completeQuiz(w:OnlineWorld,id:string) {
 const p=w.players[id];if(!p?.quiz||p.answers.length!==3)return false;
 p.quiz=false;p.stats.correct+=p.quizCorrect;
 if(w.mode==='royale') {p.energy=Math.max(p.energy,40+p.quizCorrect*20);p.run.ammo=Math.max(p.run.ammo,magazineSize(p.run.weapon));p.reloading=0;p.invulnerable=2;p.zoneExposure=0;
  // Return learners safely to the active zone after their question break.
  if(Math.hypot(p.run.player.x,p.run.player.z)>safeRadius(w)-.8){const q=openPoint(w,safeRadius(w)-1,p.id.length);p.run.player={...q,angle:p.run.player.angle};}
 } else {p.run.ammo=Math.min(w.mission.ammo+12,p.run.ammo+2+p.quizCorrect*2);p.run.detection=Math.max(0,p.run.detection-p.quizCorrect*15);if(p.quizCorrect===3&&p.run.items[0]<3){p.run.items[0]++;p.run.decoys=p.run.items[0];}}
 return true;
}
export function respawnRoyale(w:OnlineWorld,p:Participant) {
 p.out=true;p.respawnHits=0;p.run.status='playing';
 p.run.player={...openPoint(w,safeRadius(w)-1,p.id.length+Math.floor(w.time)*31),angle:p.run.player.angle};
 p.run.ammo=magazineSize(p.run.weapon);p.energy=100;p.reloading=0;p.zoneExposure=0;p.invulnerable=3;
 p.run.holdProgress=0;p.run.holdTarget=-1;p.run.stealth=0;
}
function openPoint(w:OnlineWorld,radius:number,seed:number):Point {
 const rand=random(w.seed+seed);for(let n=0;n<300;n++){const a=rand()*Math.PI*2,r=Math.sqrt(rand())*Math.max(1,radius),q={x:Math.sin(a)*r,z:Math.cos(a)*r};if(!blocked(w.mission,q,.4))return q;}
 return {x:0,z:0};
}
export function spawnSupplies(w:OnlineWorld) {
 w.supplies=Array.from({length:Math.min(12,Object.keys(w.players).length+4)},(_,id)=>({...openPoint(w,(w.mission.size??18)*.7,id*97),id,kind:['ammo','energy','repair'][id%3] as Supply['kind'],readyAt:8+id*2}));
}
export function tickArena(w:OnlineWorld,dt:number) {
 const active=Object.values(w.players).filter(p=>p.connected&&!p.quiz);
 for(const p of active){
  p.zoneExposure=Math.hypot(p.run.player.x,p.run.player.z)>safeRadius(w)?p.zoneExposure+dt:0;
  if(p.zoneExposure>=6){p.zoneExposure=0;if(p.out)p.respawnHits++;else p.hits++;p.invulnerable=2;if((p.out?p.respawnHits:p.hits)>=3)respawnRoyale(w,p);}
 }
 for(const s of w.supplies){
  if(s.readyAt>w.time)continue;
  if(Math.hypot(s.x,s.z)>safeRadius(w)-.8)Object.assign(s,openPoint(w,safeRadius(w)-1,s.id+Math.floor(w.time)*23));
  const collector=active.filter(p=>!p.out&&distance(p.run.player,s)<.85&&(s.kind==='ammo'?p.run.ammo<12:s.kind==='energy'?p.energy<100:p.hits>0)).sort((a,b)=>distance(a.run.player,s)-distance(b.run.player,s))[0];
  if(!collector)continue;
  if(s.kind==='ammo'&&collector.run.ammo<12)collector.run.ammo=Math.min(12,collector.run.ammo+3);
  else if(s.kind==='energy'&&collector.energy<100)collector.energy=Math.min(100,collector.energy+25);
  else if(s.kind==='repair'&&collector.hits>0)collector.hits--;
  else continue;
  s.readyAt=w.time+(s.kind==='repair'?40:25);
 }
}
export function assistTeam(w:OnlineWorld,p:Participant,input:Input,dt:number) {
 const others=Object.values(w.players).filter(q=>q!==p&&q.connected),base=MISSIONS[w.missionId-1];
 if(!input.interact||Math.hypot(input.x,input.z)>.1||p.quiz){p.helpTarget='';p.helpProgress=0;return;}
 let target='',needed=1.2,complete:(()=>void)|undefined;
 for(const other of others){
  if(other.run.status==='caught'&&!other.quiz&&distance(p.run.player,other.run.player)<1.5&&clearSight(w.mission,p.run.player,other.run.player,true,p.run)){
   target=`revive:${other.id}`;needed=1.5;complete=()=>{other.run.status='playing';other.run.detection=0;other.invulnerable=3;p.stats.rescues++;};break;
  }
  if(other.run.status!=='playing')continue;
  const offset=zoneOffset(w,Object.keys(w.players).indexOf(other.id));
  const i=base.targets.findIndex((q,i)=>{const point={x:q.x+offset.x,z:q.z+offset.z};return !other.run.collected[i]&&distance(p.run.player,{...point,y:floorHeight(w.mission,point)})<1.2&&clearSight(w.mission,p.run.player,point,true,p.run);});
  if(i>=0){target=`file:${other.id}:${i}`;needed=base.targetKinds?.[i]==='relay'?1.5:base.targetKinds?.[i]==='rescue'?1.2:.8;complete=()=>{other.run.collected[i]=true;p.stats.assists++;};break;}
 }
 if(!target){p.helpTarget='';p.helpProgress=0;return;}
 if(p.helpTarget!==target){p.helpTarget=target;p.helpProgress=0;}
 p.helpProgress+=dt;
 if(p.helpProgress>=needed){complete?.();p.helpProgress=0;if(!p.helped.includes(target))p.helped.push(target);}
}
export function finishWorld(w:OnlineWorld,winners:string[]) {
 if(w.phase==='result')return;w.phase='result';w.winner=winners;winners.forEach(id=>{w.players[id].wins++;});
}
export function returnToLobby(w:OnlineWorld,next=false) {
 if(w.phase!=='result'||Object.values(w.players).some(p=>p.connected&&p.quiz))return false;
 if(next&&w.mode==='coop')w.missionId=Math.min(MISSIONS.length,w.missionId+1);
 Object.keys(w.players).forEach(id=>{if(!w.players[id].connected)delete w.players[id];});
 w.mission=structuredClone(MISSIONS[w.missionId-1]);w.phase='lobby';w.time=0;w.winner=[];w.supplies=[];w.paused=false;return true;
}

export function readyToExtract(w:OnlineWorld,p:Participant){
 const m=MISSIONS[w.missionId-1],index=Object.keys(w.players).indexOf(p.id),count=m.switches?.length??0;
 return p.run.collected.every(Boolean)&&p.run.holds>=m.requiredHolds&&p.run.shots>=m.requiredShots&&p.run.defended>=(m.defend?.seconds??0)&&(!m.requireSwitches||p.run.switches.slice(index*count,(index+1)*count).every(Boolean));
}
