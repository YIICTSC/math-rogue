import manifest from './voiceCuts.json';
import {TECHNIQUES} from '../dungeons1/mastery';
const techniqueIds=new Set(TECHNIQUES.map(t=>t.id));
export type TechniqueSpeechMode='normal'|'combo-first'|'combo'|'finisher';
export type VoicePart={id:string;path:string;duration:number};
const bank=manifest as {cues:Record<string,{actor:string;name:VoicePart|null}>;prefixes:Record<string,VoicePart[]>};
/** Unknown names never fall back to another actor's recording. */
export function techniqueVoiceParts(key:string,mode:TechniqueSpeechMode='normal',random= Math.random):VoicePart[]{
 const cue=bank.cues[key],actor=cue?.actor||key.split('/').slice(0,2).join('/');
 if(!cue&&(!key.startsWith('d2/')||!techniqueIds.has(key.split('/')[2])))return [];
 const pool=bank.prefixes[actor]||[],prefix=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))],name=cue?.name;
 if(mode==='combo')return name?[name]:prefix?[prefix]:[];
 if(mode==='finisher'||mode==='combo-first')return [prefix,name].filter((p):p is VoicePart=>Boolean(p));
 if(prefix&&name)return random()<.5?[prefix]:[name];
 return name?[name]:prefix?[prefix]:[];
}
export function dungeonTechniqueKey(hero:string,id:string){return `${hero.startsWith('dungeons2-')?'d2/'+hero.slice(10):'d1/'+hero}/${id}`;}
