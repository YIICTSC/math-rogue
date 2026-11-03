import {heroById,pairKey} from './roster';
import {capacity,level} from './engine';
import {PERSONAL_TECHNIQUES} from './techniques';
import {SUPPORTS} from './story';
import type {Campaign} from './types';

export type FormationPlan='balanced'|'assault'|'sustain';
/** Only this squad and reserves participate; other squads are never dismantled. */
export function recommendFormation(s:Campaign,squad:number,plan:FormationPlan='balanced'){
 const formation=s.formations[squad];if(!formation)return false;
 const locked=new Set(s.formations.flatMap((f,i)=>i===squad?[]:f.slots.filter(Boolean)));
 const pool=s.recruited.filter(id=>!locked.has(id)),count=Math.min(capacity(s),pool.length);
 if(!count)return false;
 const chosen:string[]=[],slots:(string|null)[]=Array(6).fill(null);
 const ranged=(id:string)=>['staff','magic','bow'].includes(heroById(id).weapon);
 const heals=(id:string)=>heroById(id).weapon==='staff'||(PERSONAL_TECHNIQUES[id]||[]).some(t=>t.level<=level(s,id)&&['mend','renew'].includes(t.effect));
 const score=(id:string,front:boolean)=>{
  const h=heroById(id),lv=level(s,id);
  const bond=chosen.reduce((n,p)=>n+Math.min(15,s.bonds[pairKey(id,p)]||0)*.8+(SUPPORTS.some(v=>v.a===id&&v.b===p||v.b===id&&v.a===p)?4:0),0);
  return (front?h.hp*.22+h.def*2.5+(ranged(id)?-35:16):h.atk*1.6+(ranged(id)?20:-8))
   +lv*2+(s.forge[id]||0)*3+bond+(plan==='assault'?h.atk*.8+h.speed*.6:plan==='sustain'?h.def*.8+(heals(id)?8:0):0);
 };
 const put=(id:string,slot:number)=>{chosen.push(id);slots[slot]=id;};
 const best=(filter:(id:string)=>boolean,front:boolean)=>pool.filter(id=>!chosen.includes(id)&&filter(id)).sort((a,b)=>score(b,front)-score(a,front)||a.localeCompare(b))[0];
 // Keep the protagonist deployed, and provide at least one durable front unit.
 if(pool.includes(s.hero))put(s.hero,0);else put(best(()=>true,true)!,0);
 if(count>1){const healer=best(heals,false);if(healer)put(healer,3);}
 const frontGoal=Math.min(3,Math.max(1,Math.ceil(count/2)));
 while(chosen.length<count){
  const front=slots.slice(0,3).filter(Boolean).length<frontGoal;
  const slot=slots.findIndex((id,i)=>id===null&&(front?i<3:i>=3));
  const id=best(id=>front?!ranged(id):ranged(id),front)||best(()=>true,front);if(!id||slot<0)break;put(id,slot);
 }
 formation.slots=slots;return true;
}
