import {assetUrl} from '../../../utils/assetPaths';
import {abyssHero} from '../dungeons2/roster';
import {STUDENT_ABILITIES} from './abilities';

/** Cards share their hero's finisher; named ultimates each have their own art. */
export function abilityCutin(heroId:string,abilityName:string,transformed=false){
 const hero=abyssHero(heroId);
 if(hero){
  const slot=hero.card.en===abilityName?2:hero.skills.findIndex(skill=>skill.en===abilityName);
  return slot<0?undefined:{heroId,slot,url:assetUrl(`sprites/ultimate-cutins/${heroId}-skill-${slot+1}${transformed?'-transformed':''}.webp`)};
 }
 const skill=STUDENT_ABILITIES[heroId as keyof typeof STUDENT_ABILITIES];
 if(skill?.en===abilityName){
  return {heroId,slot:0,url:assetUrl(`sprites/ultimate-cutins/${heroId}-skill-1${transformed&&heroId.startsWith('magic-')?'-transformed':''}.webp`)};
 }
 return undefined;
}

export function preloadAbilityCutins(heroId:string){
 if(typeof Image==='undefined')return;
 const hero=abyssHero(heroId);
 const names=hero?.skills.map(skill=>skill.en)||[STUDENT_ABILITIES[heroId as keyof typeof STUDENT_ABILITIES]?.en];
 const urls=new Set<string>();
 for(const name of names){
  if(!name)continue;
  for(const transformed of [false,true]){
   const cutin=abilityCutin(heroId,name,transformed);
   if(cutin)urls.add(cutin.url);
  }
 }
 for(const url of urls){const image=new Image();image.src=url;}
}
