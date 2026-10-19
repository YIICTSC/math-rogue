import type {audioService} from '../../../services/audioService';

export type StudentAudioAction='attack'|'projectile'|'skill'|'damage'|'heal'|'item'|'pickup'|'equip'|'stairs'|'trap'|'transform'|'talk'|'win'|'defeat';
type AudioPort=Pick<typeof audioService,'playAttackEffectSound'|'playStatusEffectSound'|'playBattleSound'|'playHighSchoolVoiceFile'|'playMagicVoiceFile'|'canPlayConversationVoice'>;
const chances:Partial<Record<StudentAudioAction,number>>={attack:.22,projectile:.22,skill:.35,damage:.18,heal:.2,item:.2,transform:1,win:1,defeat:1};
export function studentVoice(heroId:string,action:StudentAudioAction,finish:boolean,random:()=>number){
 const theme=heroId.startsWith('high-school-')?'high-school':heroId.startsWith('magic-')?'magic':null;
 if(!theme)return null;
 const id=heroId.slice(theme.length+1).toUpperCase();
 const variant=1+Math.min(theme==='magic'?2:4,Math.floor(random()*(theme==='magic'?3:5)));
 const name=theme==='high-school'?(finish||action==='win'?'finish':action==='defeat'?'defeat':action==='damage'?'damage':action==='item'||action==='heal'?'item':action==='skill'||action==='transform'?'power':'attack'):(action==='damage'||action==='defeat'?'damage':finish||action==='skill'||action==='transform'||action==='heal'||action==='item'||action==='win'?'spell':'attack');
 return {theme,id,file:`${name}-${variant}`} as const;
}
/** References existing Springin' assets and existing hero voice banks; owns no audio files. */
export function createStudentAudio(audio:AudioPort,now=()=>performance.now(),random=()=>Math.random()){
 let lastVoice=-Infinity,pending=false;
 const effects=new Map<StudentAudioAction,number>();
 return {play(heroId:string,action:StudentAudioAction,finish=false){
  const time=now();
  if(time-(effects.get(action)??-Infinity)<100)return;
  effects.set(action,time);
  if(action==='attack')audio.playAttackEffectSound(finish?'finisher':'slash');
  else if(action==='projectile')audio.playAttackEffectSound('projectile');
  else if(action==='skill')audio.playAttackEffectSound('lightning');
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
  const voice=studentVoice(heroId,action,finish,random);if(!voice)return;
  lastVoice=time;pending=true;
  try{const played=voice.theme==='high-school'?audio.playHighSchoolVoiceFile(voice.id,voice.file):audio.playMagicVoiceFile(voice.id,voice.file);
   void Promise.resolve(played).catch(()=>false).finally(()=>{pending=false;});
  }catch{pending=false;}
 }};
}
