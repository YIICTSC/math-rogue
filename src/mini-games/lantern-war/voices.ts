import {audioService}from'../../services/audioService';
import manifest from'./voiceManifest.json';
import {battleVoiceText,type BattleVoiceKind} from './battleVoiceLines';
const clips=manifest as Record<string,{id:string;path:string;duration:number}>;
let token=0,active=false,lastBattle=0;const spoken=new Set<string>();
export function stopLanternVoice(){token++;active=false;audioService.stopLanternWarVoices();}
export function beginLanternBattleVoice(){stopLanternVoice();spoken.clear();lastBattle=0;}
export async function playLanternLine(speaker:string,text:string){stopLanternVoice();const clip=clips[speaker+'\n'+text];if(!clip||!audioService.canPlayConversationVoice())return false;active=true;const current=token;try{return await audioService.playLanternWarVoiceFile(clip.id);}finally{if(current===token)active=false;}}
export function battleVoice(actor:string,kind:BattleVoiceKind,eventKey:string,ally?:string,technique?:string){
 if(spoken.has(eventKey))return;spoken.add(eventKey);if(spoken.size>500)spoken.delete(spoken.values().next().value!);
 if((active||Date.now()-lastBattle<1100)&&kind!=='ultimate'&&kind!=='technique'&&kind!=='support'&&kind!=='win'&&kind!=='defeat'||!audioService.canPlayConversationVoice()||actor.startsWith('enemy-'))return;lastBattle=Date.now();
 const text=battleVoiceText(actor,kind,ally,technique);
 if(clips[actor+'\n'+text]){void playLanternLine(actor,text);return;}
 if(kind==='technique'){const fallback=battleVoiceText(actor,'attack');if(clips[actor+'\n'+fallback])void playLanternLine(actor,fallback);}
}

export async function playLanternSequence(lines:{speaker:string;text:string}[]){for(const line of lines){const expected=token+1;await playLanternLine(line.speaker,line.text);if(token!==expected)return false;}return true;}
