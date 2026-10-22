import type { KochoHeroId } from './guests';
interface Body { id:string; pos:number; facing:1|-1; hp:number; }
export type SpecialFailure = 'no-enemy' | 'blocked' | 'already-behind';
export function resolveKochoSpecial<P extends Body,E extends Body>(hero:KochoHeroId,player:P,enemies:E[],size=7): {ok:true;player:P;enemies:E[]} | {ok:false;reason:SpecialFailure} {
  const target=enemies.find(e=>e.hp>0 && e.pos===player.pos+player.facing);
  if(!target) return {ok:false,reason:'no-enemy'};
  const occupied=(pos:number,excluded?:string)=>enemies.some(e=>e.hp>0&&e.id!==excluded&&e.pos===pos);
  if(hero==='rebel') {
    // Behind is defined by the enemy's own facing, not by the player's approach.
    const behind=target.pos-target.facing;
    if(behind===player.pos) return {ok:false,reason:'already-behind'};
    if(behind<0||behind>=size||occupied(behind)) return {ok:false,reason:'blocked'};
    return {ok:true,player:{...player,pos:behind,facing:target.facing},enemies:enemies.map(e=>({...e}))};
  }
  if(hero==='akari') {
    let destination=target.pos;
    for(let step=1;step<=3;step++) {
      const next=target.pos+player.facing*step;
      if(next<0||next>=size||occupied(next,target.id)) break;
      destination=next;
    }
    if(destination===target.pos) return {ok:false,reason:'blocked'};
    return {ok:true,player:{...player,pos:target.pos},enemies:enemies.map(e=>e.id===target.id?{...e,pos:destination}:{...e})};
  }
  return {ok:true,player:{...player,pos:target.pos},enemies:enemies.map(e=>e.id===target.id?{...e,pos:player.pos}:{...e})};
}
export const kochoSpecialLabel = (hero:KochoHeroId) => hero==='rebel'?'背後へ回り込み (CD: 3)':hero==='akari'?'押し出す (CD: 3)':'位置交換 (CD: 3)';
export const kochoSpecialDescription = (hero:KochoHeroId) => hero==='rebel'?'目の前の敵の背後へ移動し、敵の方を向く。背後が塞がっている場合は使えません。':hero==='akari'?'目の前の敵へ前進すると、敵を最大3マス押し出し、その場所へ進みます。壁や別の敵で押せない場合は移動しません。':'目の前の敵と位置を交換します。';
