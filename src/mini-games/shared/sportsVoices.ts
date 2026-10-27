import {GENERIC_SPORTS_VOICES,SPORTS_HEROES} from '../../data/sportsPerformances';
import durations from '../../data/sportsVoiceDurations.json';
import type {KartAvatar} from '../gakuro-kart/avatar';
import {OFFICIAL_CALLS,type Sport} from './sportsEvents';
export {GENERIC_SPORTS_VOICES,SPORTS_HEROES};
export function isGenericSportsVoice(value:unknown):value is string{return GENERIC_SPORTS_VOICES.some(v=>v.id===value);}
export function sportsSpeaker(avatar?:KartAvatar,slot=0){
 if(avatar?.protagonist&&Object.hasOwn(SPORTS_HEROES,avatar.protagonist))return avatar.protagonist;
 return isGenericSportsVoice(avatar?.sportsVoice)?avatar!.sportsVoice!:GENERIC_SPORTS_VOICES[avatar?0:slot%8].id;
}
export function sportsVoicePath(id:string){
 const [speaker,sport,event,...rest]=id.split('/');if(rest.length)return null;
 if(isGenericSportsVoice(speaker)&&sport==='preview'&&event===undefined)return `sfx/sports/${speaker}/preview.ogg`;
 if(!Object.hasOwn(OFFICIAL_CALLS,sport))return null;
 const valid=speaker==='referee'?(OFFICIAL_CALLS[sport as Sport] as readonly string[]).includes(event):
  (Object.hasOwn(SPORTS_HEROES,speaker)||isGenericSportsVoice(speaker))&&['action','special'].includes(event);
 return valid?`sfx/sports/${id}.ogg`:null;
}
export function sportsVoiceDuration(id:string){return (durations as Record<string,number>)[id]??6000;}

/** Only packaged clips may be fetched; the remaining cast can be added by regenerating the catalog. */
export function sportsVoiceAvailable(id:string){return !!sportsVoicePath(id)&&Object.hasOwn(durations,id);}
