import {createContext} from 'react';
import METRICS from './vacationArtMetrics.json';
import FACING from './vacationArtFacing.json';
export const LanternVacation=createContext(false);
export const GENERATED_VACATION_HEROES=['aster','lyra','dungeons2-lyria','dungeons2-celis','dungeons2-flora','dungeons2-noctia','dungeons2-aurene','dungeons2-ignis','dungeons2-leon','dungeons2-orion','dungeons2-leif','nagi','mio','sena','end-vesper','end-sable'];
const high=['warrior','caretaker','assassin','mage','dodgeball','bard','librarian','chef','gardener'];
const girls=['akari','shizuku','hiyori','tsubasa','rei','madoka','koharu','mirai','sera'];
const boys=['ren','soma','minato','riku','yamato','leon','elliot','sakuya'];
export const VACATION_DIALOGUE_HEROES=[...GENERATED_VACATION_HEROES,...high.map(id=>'high-school-'+id),...girls.map(id=>'magic-'+id),...boys.map(id=>'magic-'+id),'end-hikari','end-ren'];
type Action='ready'|'windup'|'attack'|'guard'|'hurt'|'ultimate';
const actions:Action[]=['ready','windup','attack','guard','hurt','ultimate'];
export function vacationBattleSource(id:string,action:Action,frame:number){
 if(GENERATED_VACATION_HEROES.includes(id))return {path:`sprites/lantern-war/vacation/actions-${id}.webp`,cols:3,rows:2,index:actions.indexOf(action)};
 const kind=action==='ready'||action==='guard'?'idle':action==='hurt'?'hit':action==='ultimate'?'skill':'attack';
 if(id.startsWith('high-school-')){const i=high.indexOf(id.slice(12));if(i>=0)return {path:`sprites/high-school/vacation-characters-${kind}-sheets/${i}.webp`,cols:2,rows:2,index:action==='windup'?0:frame};}
 if(id.startsWith('magic-')){const key=id.slice(6),i=girls.indexOf(key);return {path:i>=0?`sprites/magic/vacation-characters-${kind}-sheets/heroine-${String(i+1).padStart(2,'0')}-after.webp`:`sprites/magic/vacation-male-characters-${kind}-sheets/${key}-after.webp`,cols:2,rows:2,index:action==='windup'?0:frame};}
 return undefined;
}
export function vacationPortraitSource(id:string){
 if(VACATION_DIALOGUE_HEROES.includes(id))return {path:`sprites/lantern-war/vacation/dialogue-${id}.webp`,cols:4};
 return undefined;
}
export interface VacationMetric{x:number;y:number;w:number;h:number;bounds:{x:number;y:number;w:number;h:number};bodyBounds:{x:number;y:number;w:number;h:number};footX:number;footY:number;}
export function vacationMetric(id:string,action:Action,frame=0){return (METRICS as Record<string,Record<Action,VacationMetric[]>>)[id]?.[action]?.[frame];}
export function vacationPortraitMetric(id:string){return (METRICS as unknown as Record<string,{portrait?:VacationMetric}>)[id]?.portrait;}
export function vacationFacing(id:string,use:Action|'dialogue',frame:number){return (FACING as Record<string,Record<string,string>>)[id]?.[use]?.[frame];}
