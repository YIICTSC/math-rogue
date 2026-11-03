import {audioService}from'../../services/audioService';
import manifest from'./voiceManifest.json';
import {battleVoiceText,type BattleVoiceKind} from './battleVoiceLines';
const clips=manifest as Record<string,{id:string;path:string;duration:number}>;
let token=0;const spoken=new Set<string>();
export function stopLanternVoice(){token++;audioService.stopLanternWarVoices();}
export function beginLanternBattleVoice(){stopLanternVoice();spoken.clear();}
export async function playLanternLine(speaker:string,text:string){stopLanternVoice();const clip=clips[speaker+'\n'+text];if(!clip||!audioService.canPlayConversationVoice())return false;return audioService.playLanternWarVoiceFile(clip.id);}
export function battleVoice(actor:string,kind:BattleVoiceKind,eventKey:string,ally?:string,technique?:string){
 if(spoken.has(eventKey))return;spoken.add(eventKey);if(spoken.size>500)spoken.delete(spoken.values().next().value!);
 if(!audioService.canPlayConversationVoice()||actor.startsWith('enemy-'))return;
 const text=battleVoiceText(actor,kind,ally,technique);
 if(clips[actor+'\n'+text]){void audioService.playLanternWarVoiceFile(clips[actor+'\n'+text].id,true);return;}
 if(kind==='technique'){const fallback=battleVoiceText(actor,'attack');if(clips[actor+'\n'+fallback])void audioService.playLanternWarVoiceFile(clips[actor+'\n'+fallback].id,true);}
}

export async function playLanternSequence(lines:{speaker:string;text:string}[]){for(const line of lines){const expected=token+1;await playLanternLine(line.speaker,line.text);if(token!==expected)return false;}return true;}
