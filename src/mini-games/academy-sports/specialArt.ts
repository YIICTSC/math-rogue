import type {Event,SportId} from './core';
import {specialHero} from './specials';
import {SPECIAL_HEROES} from './specialCatalog';
export function specialArt(id:string,sport:SportId,move?:Event['move']) {
 const hero=specialHero(id);
 const key=Object.hasOwn(SPECIAL_HEROES,id)?id:'elementary-warrior';
 if(sport==='baseball'&&move==='drive')return {path:`sprites/academy-sports/cutins/batting/${key}-v1.webp`,size:'100% 100%',position:'50% 50%'};
 if((id==='magic-tsubasa'&&sport!=='festival')||(id==='magic-madoka'&&sport==='baseball'))return {path:`sprites/academy-sports/cutins/corrections/${id}-${sport}-v2.webp`,size:'100% 100%',position:'50% 50%'};
 const column=sport==='baseball'?0:sport==='soccer'?1:2;
 return {path:`sprites/academy-sports/cutins/cast-${hero.sheet}-v1.webp`,size:`300% ${hero.rows*100}%`,position:`${column*50}% ${hero.row/(hero.rows-1)*100}%`};
}
