import { useEffect,useRef } from 'react';
import { audioService } from '../../services/audioService';
import type { CardClubVoiceEvent } from '../../data/cardClubVoices';
import type { Action,ClubView } from './model';

/** The local protagonist speaks; CPU seats never compete for the voice channel. */
export function useCardVoices(view:ClubView|null){
 const previous=useRef<{game:string;round:number;revision:number;phase:string}|null>(null),lastSpoken=useRef(0);
 const speak=(event:CardClubVoiceEvent)=>{if(!view)return;lastSpoken.current=Date.now();void audioService.playCardClubVoice(view.players[view.self].hero,event);};
 useEffect(()=>{
  if(!view){previous.current=null;lastSpoken.current=0;audioService.stopCardClubVoices();return;}
  const old=previous.current;previous.current={game:view.game,round:view.round,revision:view.revision,phase:view.phase};
  if(!old||old.game!==view.game||view.revision<old.revision)speak('start');
  else if(view.phase==='result'&&old.phase!=='result'&&!['draw','repetition','hostEnded'].includes(view.resultReason))speak(view.winners.includes(view.self)?'win':'lose');
 },[view]);
 useEffect(()=>()=>audioService.stopCardClubVoices(),[]);
 return (action:Action)=>{
  if(view?.self!==view?.turn||!view||view.phase==='round'||view.phase==='result'||Date.now()-lastSpoken.current<7000)return;
  if(['play','pick','reveal','bid','swap','exchange','name','knock'].includes(action.type))speak('play');
 };
}
