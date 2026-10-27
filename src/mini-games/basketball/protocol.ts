import {validAvatar} from '../gakuro-kart/avatar';
import {validLesson} from '../gakuro-kart/learning';
import {POSITIONS} from './rules';
import type {BasketView} from './types';
export const BASKETBALL_PROTOCOL=2;
const finite=(n:any,max=1e6)=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=max;
const integer=(n:any,max=1e6)=>Number.isInteger(n)&&n>=0&&n<=max;
const text=(s:any,max=100)=>typeof s==='string'&&s.length<=max;
const stats=(s:any)=>!!s&&['points','assists','rebounds','blocks','steals'].every(k=>integer(s[k]));
export function validView(v:any):v is BasketView {
 if(!v||v.version!==2||!['lobby','playing','result'].includes(v.phase)||!finite(v.clock)||typeof v.practice!=='boolean'||typeof v.paused!=='boolean'||!text(v.title,160)||!Array.isArray(v.players)||!v.players.length||v.players.length>32||!Array.isArray(v.teams)||v.teams.length>8||!Array.isArray(v.bracket)||v.bracket.length>15)return false;
 const ids=new Set<string>();for(const p of v.players){if(!p||!text(p.id)||ids.has(p.id)||!text(p.name,16)||!integer(p.slot,31)||typeof p.connected!=='boolean'||typeof p.spectator!=='boolean'||typeof p.studying!=='boolean'||!integer(p.correct)||!POSITIONS.includes(p.role)||!stats(p.stats)||p.avatar!==undefined&&!validAvatar(p.avatar))return false;ids.add(p.id);}
 for(let i=0;i<v.teams.length;i++){const t=v.teams[i];if(!t||t.id!==i||!text(t.name,80)||!Array.isArray(t.members)||t.members.length!==3||t.members.some((id:any)=>id!==null&&!ids.has(id)))return false;}
 const match=(m:any,full=false)=>{
  if(!m||!text(m.id,60)||!integer(m.round,8)||!['study','play','finished'].includes(m.phase)||!Array.isArray(m.teams)||m.teams.length!==2||m.teams.some((id:any,i:number)=>!(i===1&&id===null)&&(!integer(id,7)||!v.teams[id]))||m.winner!==null&&!m.teams.includes(m.winner)||!Array.isArray(m.score)||m.score.length!==2||!m.score.every((n:any)=>integer(n,100000)))return false;
  if(!full)return true;
  if(m.tutorial!==undefined){const t=m.tutorial;if(!v.practice||!t||!['move','dash','pass','receive','steal','shoot','complete'].includes(t.stage)||!ids.has(t.owner)||!finite(t.startX,10)||!finite(t.startY,10)||!finite(t.elapsed))return false;}
  if(![0,1].includes(m.possession)||typeof m.mustClear!=='boolean'||!finite(m.inbound,3)||!finite(m.shotClock,25)||!finite(m.time)||!finite(m.studyAt)||!finite(m.noticeAt)||!integer(m.serial)||!text(m.notice,80)||!Array.isArray(m.units)||m.units.length>6||m.units.length<3)return false;
  const us=new Set<string>();for(const u of m.units){if(!u||!text(u.id,80)||us.has(u.id)||u.owner!==null&&!ids.has(u.owner)||![0,1].includes(u.side)||!POSITIONS.includes(u.role)||!text(u.name,16)||typeof u.cpu!=='boolean'||typeof u.charging!=='boolean'||!stats(u.stats)||!['idle','shot','dunk','pass','drive','block','rebound','screen','steal','celebrate'].includes(u.motion)||!['x','y','vx','vy','charge','release','catch','cooldown','dodge','dashCooldown','skillCooldown','hurt','jump','screen','buff','action','aiAt'].every(k=>finite(u[k],1e5))||!['energy','stamina','focus'].every(k=>finite(u[k],1)&&u[k]>=0)||!integer(u.actionSeq)||u.avatar!==undefined&&!validAvatar(u.avatar))return false;us.add(u.id);}
  const b=m.ball;if(!b||!['x','y','z','vx','vy','vz','age','flight','lock'].every(k=>finite(b[k],1e4))||!['holder','shooter','receiver','assist'].every(k=>b[k]===null||us.has(b[k]))||b.side!==null&&![0,1].includes(b.side)||typeof b.pass!=='boolean'||typeof b.special!=='boolean'||typeof b.success!=='boolean'||![2,3].includes(b.points)||!Array.isArray(b.trail)||b.trail.length>12||b.trail.some((p:any)=>!Array.isArray(p)||p.length!==3||p.some((n:any)=>!finite(n,1e4))))return false;return true;
 };
 if(v.bracket.some((m:any)=>!match(m))||v.match!==null&&!match(v.match,true)||v.champion!==null&&(!integer(v.champion,7)||!v.teams[v.champion]))return false;
 if(v.quiz!==null){const q=v.quiz;if(!q||!integer(q.id)||q.id<1||![0,1,2].includes(q.index)||!q.question||Object.hasOwn(q.question,'correct')||![q.selected,q.answer].every(n=>n===null||integer(n,3))||(q.selected===null)!==(q.answer===null)||!validLesson({title:'',questions:Array(3).fill({...q.question,correct:0})}))return false;}
 return true;
}
