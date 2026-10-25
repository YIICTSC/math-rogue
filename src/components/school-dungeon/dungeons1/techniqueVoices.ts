import {PROTAGONISTS} from '../../../three/protagonistCatalog';
import {TECHNIQUES} from './mastery';
const heroes=new Set<string>(PROTAGONISTS.map(h=>h.id)),techniques=new Set(TECHNIQUES.map(t=>t.id));
/** Both forms share the same protagonist's individual recording for each technique. */
export function techniqueVoicePath(heroId:string,techniqueId:string){
 if(!heroes.has(heroId)||!techniques.has(techniqueId))return undefined;
 return `sfx/dungeons1-techniques/${heroId}/${techniqueId}.ogg`;
}
