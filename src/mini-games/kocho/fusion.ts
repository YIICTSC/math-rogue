import type {KochoHeroId} from './guests';
import {findKochoSuper,kochoSupers,type KochoSuperMove} from './superMoves';
export const KOCHO_FUSION_PRICE=20;
export const KOCHO_FUSION_MAX_PARTS=4;
export interface FusionSuper {hero:KochoHeroId;id:string}
export interface FusionCard<C> {
 id:string;name:string;description:string;type:'ATTACK'|'MOVE'|'UTILITY';range:number[];damage:number;shield?:number;
 cooldown:number;currentCooldown:number;energyCost:number;maxSlots:number;usedSlots:number;color:string;
 fusionParts?:C[];fusionSuper?:FusionSuper;
}
export function fusionParts<C extends FusionCard<C>>(card:C):C[]{return card.fusionParts?.flatMap(part=>fusionParts(part))??[card];}
export function fusionSuper(card:{fusionSuper?:FusionSuper}):KochoSuperMove|undefined{
 const key=card.fusionSuper;return key?kochoSupers(key.hero).find(m=>m.id===key.id):undefined;
}
export function fusionRecipe<C extends FusionCard<C>>(hero:KochoHeroId,cards:readonly C[]){
 return findKochoSuper(hero,cards.flatMap(c=>fusionParts(c)).map(c=>c.name));
}
/** Immutable snapshots keep upgrades, ordering and action artwork when a save is restored. */
export function makeKochoFusion<C extends FusionCard<C>>(hero:KochoHeroId,cards:readonly C[],id:string):C|null{
 if(cards.length<2||cards.length>3||new Set(cards.map(c=>c.id)).size!==cards.length||cards.some(c=>c.fusionSuper||c.currentCooldown>0))return null;
 const parts=cards.flatMap(c=>fusionParts(c)).map(c=>({...c,range:[...c.range],currentCooldown:0}));
 if(parts.length>KOCHO_FUSION_MAX_PARTS)return null;
 const move=fusionRecipe(hero,cards);
 return {...parts[0],id,name:move?.name??parts.map(c=>c.name).join('＋'),description:parts.map((c,i)=>`${i+1}. ${c.name}：${c.description}`).join('\n'),
  type:parts.some(c=>c.type==='ATTACK')?'ATTACK':parts.some(c=>c.type==='MOVE')?'MOVE':'UTILITY',
  range:[...new Set(parts.flatMap(c=>c.range))],damage:parts.reduce((sum,c)=>sum+c.damage,0)+(move?.damage??0),shield:parts.reduce((sum,c)=>sum+(c.shield??0),0)+(move?.shield??0),
  cooldown:Math.max(...cards.map(c=>c.cooldown)),currentCooldown:0,energyCost:1,maxSlots:Math.max(...cards.map(c=>c.maxSlots)),usedSlots:0,
  color:move?'bg-amber-500':parts[0].color,fusionParts:parts,fusionSuper:move?{hero:move.hero,id:move.id}:undefined};
}
export function fusionName<C extends FusionCard<C>>(card:C,language:string,tr:(text:string)=>string):string{
 const move=fusionSuper(card);if(move)return language==='ENGLISH'?move.englishName:language==='HIRAGANA'?move.hiraganaName:move.name;
 return card.fusionParts?card.fusionParts.map(c=>fusionName(c,language,tr)).join('＋'):tr(card.name);
}
export function fusionDescription<C extends FusionCard<C>>(card:C,language:string,tr:(text:string)=>string):string{
 if(!card.fusionParts)return tr(card.description);
 const parts=card.fusionParts.map((c,i)=>`${i+1}. ${fusionName(c,language,tr)}：${tr(c.description)}`).join('\n');
 const move=fusionSuper(card);
 const detail=move?(language==='ENGLISH'?`${move.damage} damage, shield +${move.shield}, heal ${move.heal}`:`${move.damage}ダメージ、シールド+${move.shield}、HP+${move.heal}`):'';
 return parts+(move?`\n${language==='ENGLISH'?'Finisher':language==='HIRAGANA'?'きめわざ':'決め技'}：${fusionName(card,language,tr)} (${detail})`:'');
}
/** Damage upgrades on a combined card improve its last damaging action once. */
export function applyFusionDamageUpgrade<C extends FusionCard<C>>(card:C,delta:number):C{
 if(!card.fusionParts||!delta)return card;
 const parts=card.fusionParts.map(c=>({...c,range:[...c.range]}));let index=-1;for(let i=parts.length-1;i>=0;i--)if(parts[i].type==='ATTACK'||parts[i].damage>0){index=i;break;}
 if(index>=0)parts[index].damage=Math.max(0,parts[index].damage+delta);
 return {...card,fusionParts:parts,damage:parts.reduce((sum,c)=>sum+c.damage,0)+(fusionSuper(card)?.damage??0)};
}
