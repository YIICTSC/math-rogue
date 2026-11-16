import {REWARD_ITEMS} from './courses';
import {DEBRIS_LIMIT} from './debris';
import type {SideState} from './physics';
const finite=(n:unknown,limit=10000)=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=limit;
const point=(p:any)=>p&&finite(p.x)&&finite(p.y);
const indices=(a:any,max:number)=>Array.isArray(a)&&a.length<=max&&a.every((n:any)=>Number.isInteger(n)&&n>=0&&n<max)&&new Set(a).size===a.length;
export function validSideState(s:any,id:number):s is SideState{
 if(!s||s.courseId!==id||!point(s.ball)||!finite(s.ball.vx)||!finite(s.ball.vy)||!point(s.origin)||!['aim','flight','holed'].includes(s.phase)||!finite(s.time,1e9)||!finite(s.flight,100)||!finite(s.still,100)||!Number.isInteger(s.strokes)||s.strokes<0||s.strokes>19||!Number.isInteger(s.serial)||s.serial<0||typeof s.conceded!=='boolean'||!['normal',...REWARD_ITEMS.filter(v=>v!=='undo'&&v!=='brake'),'special'].includes(s.shot))return false;
 if(!['shot','land','coin','warp','spring','break','water','goal','brake','undo'].includes(s.event)||!finite(s.warpCooldown,10)||s.warpCooldown<0||!s.inventory||!['normal',...REWARD_ITEMS].every(k=>Number.isInteger(s.inventory[k])&&s.inventory[k]>=0&&s.inventory[k]<=999)||!indices(s.broken,100)||!indices(s.frozen,100)||!indices(s.coins,3)||!Array.isArray(s.fragments)||s.fragments.length>DEBRIS_LIMIT)return false;
 const ids=new Set();for(const f of s.fragments){if(!f||!Number.isInteger(f.id)||ids.has(f.id)||!Number.isInteger(f.source)||f.source<0||!point(f)||!['angle','vx','vy','spin','rest'].every(k=>finite(f[k]))||typeof f.fixed!=='boolean'||typeof f.sleeping!=='boolean'||!['grass','sand','ice','sticky','fragile'].includes(f.material)||!Array.isArray(f.points)||f.points.length<3||f.points.length>20||!f.points.every(point))return false;ids.add(f.id);}
 if(s.attached&&(!point(s.attached.offset)||s.attached.solid!==undefined&&(!Number.isInteger(s.attached.solid)||s.attached.solid<0||s.attached.solid>99)||s.attached.fragment!==undefined&&!ids.has(s.attached.fragment)))return false;
 return s.canUndo===undefined||typeof s.canUndo==='boolean';
}
