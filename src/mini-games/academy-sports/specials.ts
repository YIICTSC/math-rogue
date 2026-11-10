import {SPECIAL_HEROES} from './specialCatalog';
import type {LanguageMode} from '../../types';
import type {SportId,Event} from './core';
export function specialHero(id:string){return SPECIAL_HEROES[id as keyof typeof SPECIAL_HEROES]||SPECIAL_HEROES['elementary-warrior'];}
export function specialName(hero:string,sport:SportId,language:LanguageMode='JAPANESE',move?:Event['move']){
 const i=language==='ENGLISH'?1:language==='HIRAGANA'?2:0;
 const suffix=move==='drive'?['飛翔打','Sky Drive','ひしょうだ']:move==='serve'?['サーブ','Serve','サーブ']:sport==='baseball'?['流星球','Meteor Pitch','りゅうせいきゅう']:sport==='soccer'?['シュート','Shot','シュート']:sport==='volleyball'?['スパイク','Spike','スパイク']:['バースト','Burst','バースト'];
 return specialHero(hero).prefix[i]+(i===1?' ':'')+suffix[i];
}
export const SIGNATURE_COST=40;
