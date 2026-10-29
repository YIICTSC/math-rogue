import type {VoiceMora} from './residentVoiceSynth';
import type {ConversationVoice} from './conversationVoice';
export interface ResidentPhrase { offset:number; duration:number; question:boolean; final:boolean }
const smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
/** Phrase timing includes geminate closures; they do not restart the pitch contour. */
export function planResidentPhrases(moras:readonly VoiceMora[]):ResidentPhrase[]{
 const plan:ResidentPhrase[]=[],length=moras.length;let start=0;
 for(let end=0;end<=length;end++){
  if(end<length&&!(moras[end].vowel<0&&moras[end].duration>=.09))continue;
  const span=moras.slice(start,end),duration=span.reduce((n,m)=>n+m.duration,0),question=span.some(m=>m.question),final=end===length||moras[end].duration>=.2;let offset=0;
  for(let i=start;i<end;i++){plan[i]={offset,duration,question,final};offset+=moras[i].duration;}
  if(end<length)plan[end]={offset:0,duration:0,question:false,final};start=end+1;
 }
 return plan;
}
/** A continuous phrase arch and declination, with restrained character vibrato. */
export function residentPitchSemitones(phrase:ResidentPhrase,time:number,voice:ConversationVoice):number{
 if(voice.style==='robot'||voice.intonation===0||!phrase.duration)return 0;
 const expression=voice.intonation??.65,bright=voice.style==='bouncy'||voice.style==='playful';
 const t=Math.max(0,Math.min(phrase.duration,time)),p=t/phrase.duration;
 const rise=smooth(t/Math.min(.28,phrase.duration*.32));
 const ending=smooth((t-Math.max(0,phrase.duration-.24))/Math.min(.24,phrase.duration));
 const depth=voice.style==='calm'?.65:voice.style==='warm'?.85:bright?1.05:1;
 const contour=.9*rise-1.15*p+(phrase.question?2.6*ending:-(phrase.final?.8:.3)*ending);
 const vibrato=Math.sin(t*2*Math.PI*(bright?5.6:4.6))*(bright?.07:.045)*smooth(t/.08);
 return expression*(depth*contour+vibrato);
}
