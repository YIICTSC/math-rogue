import {audioService}from'../../services/audioService';
import manifest from'./voiceManifest.json';
import {heroById}from'./roster';
import {SUPPORTS}from'./story';
const clips=manifest as Record<string,{id:string;path:string;duration:number}>;
let token=0,active=false,lastBattle=0;const spoken=new Set<string>();
export function stopLanternVoice(){token++;active=false;audioService.stopLanternWarVoices();}
export function beginLanternBattleVoice(){stopLanternVoice();spoken.clear();lastBattle=0;}
export async function playLanternLine(speaker:string,text:string){stopLanternVoice();const clip=clips[speaker+'\n'+text];if(!clip||!audioService.canPlayConversationVoice())return false;active=true;const current=token;try{return await audioService.playLanternWarVoiceFile(clip.id);}finally{if(current===token)active=false;}}
export function battleVoice(actor:string,kind:'attack'|'damage'|'heal'|'ultimate'|'support'|'win'|'defeat',eventKey:string,ally?:string){
 if(spoken.has(eventKey))return;spoken.add(eventKey);if(spoken.size>500)spoken.delete(spoken.values().next().value!);
 if((active||Date.now()-lastBattle<1100)&&kind!=='ultimate'&&kind!=='support'&&kind!=='win'&&kind!=='defeat'||!audioService.canPlayConversationVoice()||actor.startsWith('enemy-'))return;lastBattle=Date.now();
 const h=heroById(actor);let text=kind==='ultimate'?`${h.skill}！仲間と道を切り開く！`:kind==='support'?'ここは任せて！':({attack:'道を切り開く！',damage:'まだ、立てる！',heal:'ありがとう。もう一度！',win:actor==='lyra'?'みんなで、つかんだ明日だね。':'みんなで、つかんだ明日だ。',defeat:'この灯を、託す。'} as Record<string,string>)[kind];
 if(kind==='support'&&ally&&SUPPORTS.some(p=>p.a===actor&&p.b===ally||p.b===actor&&p.a===ally))text=`${heroById(ally).name}、合わせるよ！`;
 if(clips[actor+'\n'+text]){void playLanternLine(actor,text);return;}
}

export async function playLanternSequence(lines:{speaker:string;text:string}[]){for(const line of lines){const expected=token+1;await playLanternLine(line.speaker,line.text);if(token!==expected)return false;}return true;}
