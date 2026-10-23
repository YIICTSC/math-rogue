import type { KochoHeroId } from './guests';
import { SUPER_MOVES, SUPER_VOICE_MS } from './superData';
export interface KochoSuperMove {
 id:string; hero:KochoHeroId; index:number; name:string; englishName:string; hiraganaName:string;
 steps:string[][]; style:string; damage:number; shield:number; heal:number;
}
export const kochoSupers = (hero:KochoHeroId) => SUPER_MOVES.filter(m=>m.hero===hero);
export function findKochoSuper(hero:KochoHeroId, names:readonly string[]) {
 if(names.length!==3)return undefined;
 return kochoSupers(hero).find(m=>m.steps.every((choices,i)=>choices.includes(names[i])));
}
export const kochoSuperCandidates = (hero:KochoHeroId,names:readonly string[]) => names.length>3?[]:kochoSupers(hero).filter(m=>names.every((name,i)=>m.steps[i].includes(name)));
export const kochoSuperVoice = (hero:KochoHeroId,clip:string) => SUPER_VOICE_MS[hero]?.[clip]??0;
export const superArtStyle = (move:KochoSuperMove) => ({backgroundImage:`url(sprites/kocho/super-${move.hero}.webp)`,backgroundSize:'300% 400%',backgroundPosition:`${move.index%3*50}% ${Math.floor(move.index/3)*100/3}%`});
interface SuperEntity {id:string;hp:number;pos:number;facing:1|-1;shield:number;intent?:{type:string;timer:number}}
export function resolveKochoSuper<P extends SuperEntity & {maxHp:number},E extends SuperEntity>(move:KochoSuperMove,player:P,enemies:readonly E[]) {
 const living=enemies.filter(e=>e.hp>0);
 const all=['all','sweep','pierce'].includes(move.style);
 const targets=all?living:[...living].sort((a,b)=>Math.abs(a.pos-player.pos)-Math.abs(b.pos-player.pos)||a.pos-b.pos).slice(0,1);
 const ids=new Set(targets.map(e=>e.id));
 const next=enemies.map(e=>ids.has(e.id)?{...e,hp:Math.max(0,e.hp-move.damage),...(move.style==='stun'&&e.intent?{intent:{...e.intent,timer:e.intent.timer+2}}:{})}:{...e});
 const p={...player,shield:player.shield+move.shield,hp:Math.min(player.maxHp,player.hp+move.heal)};
 if(move.style==='rush'&&targets[0]) {
  const target=targets[0];const free=[target.pos-player.facing,target.pos+player.facing].find(pos=>pos>=0&&pos<7&&!next.some(e=>e.hp>0&&e.pos===pos));
  if(free!==undefined){p.pos=free;p.facing=free<target.pos?1:-1;}
 }
 return {player:p,enemies:next,targets:targets.map(e=>e.pos)};
}
