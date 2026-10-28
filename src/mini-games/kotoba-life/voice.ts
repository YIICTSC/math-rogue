import readings from './readings.json';
import type {CharacterId,NpcId} from './data';
import type {LearnedWord} from './model';
import {DEFAULT_CONVERSATION_VOICE, type ConversationVoice} from '../../rpg/conversationVoice';
const profile=(pitch:number,timbre:number,rate:number,style:ConversationVoice['style']):ConversationVoice=>({...DEFAULT_CONVERSATION_VOICE,engine:'original',pitch,timbre,rate,style});
export const VOICES:Record<CharacterId|NpcId,ConversationVoice>={mugi:profile(1.1,0,.84,'warm'),momo:profile(1.85,1,1.08,'playful'),sora:profile(1.45,2,1.12,'bouncy'),kohaku:profile(1.55,0,.92,'calm'),pico:profile(1.3,1,1,'smooth'),bakery:profile(1.6,0,.96,'warm'),florist:profile(1,2,1.02,'smooth'),station:profile(.8,3,.86,'calm')};
const fragments=Object.entries(readings).sort((a,b)=>b[0].length-a[0].length);
/** Use authored readings and explicitly taught pronunciations, never invent unknown kanji readings. */
export function kotobaReading(text:string,words:LearnedWord[]=[]):string|null{
 const learned=words.filter(w=>w.reading).map(w=>[w.value,w.reading!] as [string,string]).sort((a,b)=>b[0].length-a[0].length);
 let result='',at=0;
 while(at<text.length){
  const match=learned.find(([key])=>text.startsWith(key,at))||fragments.find(([key])=>text.startsWith(key,at));
  if(match){result+=match[1];at+=match[0].length;continue;}
  const c=text[at++];if(/[一-龯A-Za-z0-9]/u.test(c))return null;result+=c;
 }
 return result.replace(/[—―〜～]/g,'ー').replace(/[「」『』！？]/g,c=>({'「':' ','」':' ','『':' ','』':' ','！':'!','？':'?'}[c]||c));
}
