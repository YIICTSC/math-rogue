import {chronicleVoicePath} from '../chronicles/voices';
import {abyssHero} from '../dungeons2/roster';
import type {audioService} from '../../../services/audioService';

export type StudentAudioAction='walk'|'throw'|'swing'|'read'|'use'|'shoot'|'ultimate'|'attack'|'projectile'|'skill'|'damage'|'heal'|'item'|'pickup'|'equip'|'stairs'|'trap'|'transform'|'talk'|'win'|'defeat';
type AudioPort=Pick<typeof audioService,'playDungeons2VoiceFile'|'playDungeonsAbilitySound'|'playAttackEffectSound'|'playStatusEffectSound'|'playBattleSound'|'playHighSchoolVoiceFile'|'playMagicVoiceFile'|'canPlayConversationVoice'>&Partial<Pick<typeof audioService,'playDungeonChronicleVoiceFile'>>;
const chances:Partial<Record<StudentAudioAction,number>>={ultimate:.65,attack:.22,projectile:.22,skill:.35,damage:.18,heal:.2,item:.2,transform:1,win:1,defeat:1,walk:.08,throw:.55,swing:.55,read:.7,use:.45,shoot:.5,pickup:.35,equip:.55,stairs:.85,trap:.75,talk:.65};
export function studentVoice(heroId:string,action:StudentAudioAction,finish:boolean,random:()=>number,abilityName?:string){
 const original=abyssHero(heroId);if(original){const skill=original.skills.findIndex(s=>s.en===abilityName);const file=action==='ultimate'?(abilityName===original.card.en?'card':`ultimate-${Math.max(0,skill)+1}`):action==='transform'?'transform':action==='defeat'?'defeat':finish||action==='win'?'finish':action==='damage'?'damage':action==='heal'||action==='item'?'heal':action==='skill'?'ultimate-1':'attack';const variant=Math.max(0,Math.min(2,Math.floor(random()*3)));return {theme:'dungeons2',id:original.id.slice(10),file:variant?`${file}-alt-${variant}`:file}as const;}
 const theme=heroId.startsWith('high-school-')?'high-school':heroId.startsWith('magic-')?'magic':null;
 if(!theme)return null;
 const id=heroId.slice(theme.length+1).toUpperCase();
 const variant=1+Math.min(theme==='magic'?2:4,Math.floor(random()*(theme==='magic'?3:5)));
 const name=theme==='high-school'?(finish||action==='win'?'finish':action==='defeat'?'defeat':action==='damage'?'damage':action==='item'||action==='heal'?'item':action==='ultimate'||action==='skill'||action==='transform'?'power':'attack'):(action==='damage'||action==='defeat'?'damage':finish||action==='ultimate'||action==='skill'||action==='transform'||action==='heal'||action==='item'||action==='win'?'spell':'attack');
 return {theme,id,file:`${name}-${variant}`} as const;
}
/** Action-specific CPU Irodori voices; legacy banks remain available to older callers. */
export function createStudentAudio(audio:AudioPort,now=()=>performance.now(),random=()=>Math.random()){
 let lastVoice=-Infinity,pending=false;
 const effects=new Map<StudentAudioAction,number>();
 const previousD2=new Map<string,string>();
 return {play(heroId:string,action:StudentAudioAction,finish=false,element='star',abilityName?:string){
  const time=now();
  if(time-(effects.get(action)??-Infinity)<100)return;
  effects.set(action,time);
  if(action==='ultimate')audio.playDungeonsAbilitySound(element);
  else if(action==='attack')audio.playAttackEffectSound(finish?'finisher':'slash');
  else if(action==='projectile'||action==='throw'||action==='shoot')audio.playAttackEffectSound('projectile');
  else if(action==='skill'||action==='swing')audio.playAttackEffectSound('lightning');
  else if(action==='transform')audio.playAttackEffectSound('drain');
  else if(action==='damage')audio.playAttackEffectSound('impact');
  else if(action==='heal')audio.playStatusEffectSound('heal');
  else if(action==='trap')audio.playStatusEffectSound('debuff');
  else if(action==='equip')audio.playStatusEffectSound('block');
  else if(action==='item')audio.playStatusEffectSound('buff');
  else audio.playBattleSound(action==='win'?'win':action==='defeat'?'lose':action==='stairs'?'jump':'select');
  // No queued lines: an action that occurs during speech stays silent.
  if(pending||time-lastVoice<3200||!audio.canPlayConversationVoice())return;
  const chance=finish?1:chances[action]||0;
  if(!chance||random()>=chance)return;
  const specialized=({projectile:'throw',skill:'swing',item:'use'} as Partial<Record<StudentAudioAction,string>>)[action]||action;
  const legacyAvailable=heroId.startsWith('dungeons2-')||heroId.startsWith('high-school-')||heroId.startsWith('magic-');
  const expandedOnly=['walk','throw','swing','read','use','shoot','pickup','equip','stairs','trap','talk'].includes(action);
  if(audio.playDungeonChronicleVoiceFile&&chronicleVoicePath(heroId,finish?'win':specialized)&&(!legacyAvailable||expandedOnly||random()<.55)){
   lastVoice=time;pending=true;
   try{void Promise.resolve(audio.playDungeonChronicleVoiceFile(heroId,finish?'win':specialized)).catch(()=>false).finally(()=>{pending=false;});}catch{pending=false;}
   return;
  }
  let voice=studentVoice(heroId,action,finish,random,abilityName);if(!voice)return;
  if(voice.theme==='dungeons2'){
   const base=voice.file.replace(/-alt-[12]$/,''),key=voice.id+':'+base;
   if(previousD2.get(key)===voice.file){const variant=voice.file===base?1:voice.file.endsWith('-1')?2:0;voice={...voice,file:variant?`${base}-alt-${variant}`:base};}
   previousD2.set(key,voice.file);
  }
  lastVoice=time;pending=true;
  try{const played=voice.theme==='dungeons2'?audio.playDungeons2VoiceFile(voice.id,voice.file):voice.theme==='high-school'?audio.playHighSchoolVoiceFile(voice.id,voice.file):audio.playMagicVoiceFile(voice.id,voice.file);
   void Promise.resolve(played).catch(()=>false).finally(()=>{pending=false;});
  }catch{pending=false;}
 }};
}
