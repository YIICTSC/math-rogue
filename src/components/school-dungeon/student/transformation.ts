import {abyssHero} from '../dungeons2/roster';
import {MAGIC_HEROES,MAGIC_MALE_PROTAGONISTS} from '../../../data/magicHeroes';
/** Transformation never changes stats or healing; it multiplies final HP damage. */
export function studentDamage(amount:number,active:boolean){return Math.max(0,amount)*(active?2:1);}
export function magicForm(id:string){
 const original=abyssHero(id);if(original)return {title:original.transformedTitle,color:original.color,portrait:original.afterPortrait};
 const key=id.replace(/^magic-/,'').toUpperCase();
 const hero=MAGIC_HEROES.find(h=>h.id===key)||MAGIC_MALE_PROTAGONISTS.find(h=>h.id===key);
 return hero?{title:hero.transformedTitle,color:hero.color,portrait:'index' in hero?`sprites/magic/characters/heroine-${String(hero.index).padStart(2,'0')}-after.webp`:`sprites/magic/male-characters/${hero.assetId}-after.webp`}:undefined;
}
