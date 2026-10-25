import {DUNGEON_CHRONICLE_VOICE_ACTORS} from '../../../data/dungeonChronicleVoiceActors';
export const CHRONICLE_AUDIO_ACTIONS=['attack','throw','swing','read','use','shoot','pickup','equip','stairs','trap','damage','heal','win','defeat','talk','ultimate','transform','ending-release','ending-accord','ending-defy'] as const;
export type ChronicleVoiceAction=typeof CHRONICLE_AUDIO_ACTIONS[number];
const actors=new Set<string>(DUNGEON_CHRONICLE_VOICE_ACTORS);
export function chronicleVoicePath(actor:string,action:string){
 if(!actors.has(actor))return undefined;
 if(actor.startsWith('npc-')?!['talk','reveal'].includes(action):!CHRONICLE_AUDIO_ACTIONS.includes(action as ChronicleVoiceAction))return undefined;
 return `sfx/dungeons-chronicles/${actor}/${action}.ogg`;
}
