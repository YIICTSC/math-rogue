import {useEffect,useRef,useState} from 'react';
import {speakConversation,stopConversationSpeech,conversationSpeechSupported} from '../../rpg/conversationSpeech';
import {unlockResidentVoice,residentVoiceMoras} from '../../rpg/residentVoiceSynth';
import type {DialogueLine,LearnedWord} from './model';
import type {CharacterId,NpcId} from './data';
import {VOICES,kotobaReading} from './voice';
export function useKotobaVoice({line,characterId,npcId,words,enabled,voiceEnabled,languageMode,utteranceKey}:{line?:DialogueLine;characterId:CharacterId;npcId?:NpcId|null;words:LearnedWord[];enabled:boolean;voiceEnabled:boolean;languageMode:string;utteranceKey:string}){
 const [speaking,setSpeaking]=useState(false),[finished,setFinished]=useState(true),[replayCount,setReplay]=useState(0);
 const generation=useRef(0);const supported=conversationSpeechSupported();
 const reading=line?kotobaReading(line.text.ja,words):null;
 const unreadable=languageMode!=='ENGLISH'&&!!line&&line.speaker!=='narrator'&&(!reading||!residentVoiceMoras(reading));
 useEffect(()=>{const unlock=()=>unlockResidentVoice();window.addEventListener('pointerdown',unlock,{passive:true});window.addEventListener('keydown',unlock);return()=>{window.removeEventListener('pointerdown',unlock);window.removeEventListener('keydown',unlock);};},[]);
 useEffect(()=>{
  const token=++generation.current;stopConversationSpeech();setSpeaking(false);setFinished(true);
  if(!enabled||!voiceEnabled||!line||line.speaker==='narrator'||document.hidden||unreadable)return;
  setFinished(false);setSpeaking(true);
  const config=VOICES[line.speaker==='npc'&&npcId?npcId:characterId];
  void speakConversation(languageMode==='ENGLISH'?line.text.en:reading!,config,languageMode).finally(()=>{if(generation.current===token){setSpeaking(false);setFinished(true);}});
  const hide=()=>{if(document.hidden){generation.current++;stopConversationSpeech();setSpeaking(false);setFinished(true);}};
  document.addEventListener('visibilitychange',hide);
  return()=>{generation.current++;stopConversationSpeech();document.removeEventListener('visibilitychange',hide);};
 },[enabled,voiceEnabled,utteranceKey,replayCount,languageMode,characterId,npcId,unreadable]);
 return {speaking,finished,unreadable,supported,replay:()=>{unlockResidentVoice();setReplay(n=>n+1);}};
}
