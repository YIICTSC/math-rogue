import {validSportsEvents} from '../shared/sportsEvents';
import {validLesson} from '../gakuro-kart/learning';
import {validAvatar} from '../gakuro-kart/avatar';
import type {TennisView} from './types';
export const TENNIS_PROTOCOL=1;
const finite=(x:unknown,max=1e8)=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=max;
const text=(x:unknown,max=100)=>typeof x==='string'&&x.length<=max;
/** Snapshots expose only the receiver's current question, never future questions or keys. */
export function validView(v:any):v is TennisView{
 if(!v||v.version!==1||!['lobby','playing','result'].includes(v.phase)||!['singles','doubles'].includes(v.mode)||![1,3,6].includes(v.targetGames)||!finite(v.clock)||typeof v.paused!=='boolean'||!text(v.title,160)||!Array.isArray(v.players)||v.players.length<1||v.players.length>40||!Array.isArray(v.teams)||v.teams.length>32||!Array.isArray(v.bracket)||v.bracket.length>63)return false;
 const ids=new Set<string>();
 for(const p of v.players){if(!p||!text(p.id)||ids.has(p.id)||!text(p.name,16)||!Number.isInteger(p.slot)||p.slot<0||p.slot>=40||typeof p.connected!=='boolean'||typeof p.spectator!=='boolean'||!Number.isInteger(p.correct)||p.correct<0||p.avatar!==undefined&&!validAvatar(p.avatar))return false;ids.add(p.id);}
 for(const t of v.teams)if(!t||!Number.isInteger(t.id)||t.id<0||t.id>=v.teams.length||!text(t.name,80)||!Array.isArray(t.members)||t.members.length<1||t.members.length>2||t.members.some((id:any)=>id!==null&&!ids.has(id)))return false;
 const validMatch=(m:any,full=false)=>{
  if(!m||!text(m.id,60)||!['study','serve','rally','point','finished'].includes(m.phase)||!Array.isArray(m.teams)||m.teams.length!==2||m.teams.some((n:any,i:number)=>!(i===1&&n===null)&&(!Number.isInteger(n)||n<0||n>=v.teams.length))||!Array.isArray(m.games)||!Array.isArray(m.points)||m.games.length!==2||m.points.length!==2||[...m.games,...m.points].some((n:any)=>!Number.isInteger(n)||n<0||n>1e6)||m.winner!==null&&!m.teams.includes(m.winner))return false;
  if(!full)return true;if(!validSportsEvents(m,'tennis'))return false;
  if(!m.ball||!['x','y','z','vx','vy','vz','spin'].every(k=>finite(m.ball[k],200))||!Array.isArray(m.ball.trail)||m.ball.trail.length>12||m.ball.trail.some((p:any)=>!Array.isArray(p)||p.length!==3||p.some((n:any)=>!finite(n,200)))||!Array.isArray(m.units)||m.units.length>4)return false;
  return m.units.every((u:any)=>u&&text(u.id,80)&&(u.owner===null||ids.has(u.owner))&&[0,1].includes(u.side)&&['x','y','vx','vy','energy','stamina','swing','dash','shotSeq'].every(k=>finite(u[k],1000000))&&(u.avatar===undefined||validAvatar(u.avatar)));
 };
 if(v.bracket.some((m:any)=>!validMatch(m))||v.match!==null&&!validMatch(v.match,true))return false;
 if(v.quiz!==null){const q=v.quiz;if(!q||!Number.isInteger(q.id)||q.id<1||![0,1,2].includes(q.index)||!q.question||Object.hasOwn(q.question,'correct')||![q.selected,q.answer].every(n=>n===null||Number.isInteger(n)&&n>=0&&n<4)||(q.selected===null)!==(q.answer===null)||!validLesson({title:'',questions:Array(3).fill({...q.question,correct:0})}))return false;}
 return true;
}
