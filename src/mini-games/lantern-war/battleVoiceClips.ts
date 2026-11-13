import manifest from './voiceManifest.json';
import {crossGameBattleVoices} from './battleVoiceBank';
import {battleVoiceText,type BattleVoiceKind} from './battleVoiceLines';

const clips=manifest as Record<string,{id:string;path:string;duration:number}>;
export function battleVoiceClip(actor:string,kind:BattleVoiceKind,ally?:string,technique?:string):{id:string;path:string;duration:number}|undefined{
 const text=battleVoiceText(actor,kind,ally,technique);
 // Keep recorded pair support and personal techniques. Missing pair lines use the
 // actor's own support recording rather than going silent.
 if(kind!=='technique'){
  const original=crossGameBattleVoices[actor]?.[kind];
  return original&&text===original.text?original:clips[actor+'\n'+text]||original;
 }
 return clips[actor+'\n'+text]||battleVoiceClip(actor,'attack');
}
