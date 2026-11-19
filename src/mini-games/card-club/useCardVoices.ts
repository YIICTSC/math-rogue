import {useEffect,useRef} from 'react';
import {audioService} from '../../services/audioService';
import type {ClubView} from './model';
import {clubScoreAwards} from './scoreAwards';

export function useCardVoices(view:ClubView|null){
  const previous=useRef<ClubView|null>(null);
  const turnGeneration=useRef(0);
  const score=useRef<Promise<boolean>|null>(null);

  useEffect(()=>{
    const old=previous.current;
    previous.current=view?{...view,log:[...view.log]}:null;
    if(!view){
      turnGeneration.current++;
      score.current=null;
      audioService.stopCardClubVoices();
      return;
    }

    const newMatch=!old||old.game!==view.game||view.revision<old.revision;
    const inPlay=view.phase!=='round'&&view.phase!=='result';
    const newTurn=newMatch||old.round!==view.round||old.turn!==view.turn||
      (old.phase==='round'&&inPlay);
    if(newTurn||!inPlay)turnGeneration.current++;

    const award=clubScoreAwards(old,view).find(candidate=>candidate.reasons.some(event=>event.key!=='points'));
    if(award){
      const spoken=audioService.playCardClubScoreVoice(award.player.hero).catch(()=>false);
      score.current=spoken;
      void spoken.then(()=>{if(score.current===spoken)score.current=null;});
    }

    const player=view.players[view.turn];
    if(newTurn&&inPlay&&player&&!player.cpu){
      const generation=turnGeneration.current;
      const speak=()=>{if(generation===turnGeneration.current)void audioService.playCardClubVoice(player.hero,'play');};
      if(score.current)void score.current.then(speak);
      else speak();
    }else if(newMatch&&!award){
      void audioService.playCardClubVoice(view.players[view.self].hero,'start');
    }else if(!award&&view.phase==='result'&&old?.phase!=='result'&&!['draw','repetition','hostEnded'].includes(view.resultReason)){
      void audioService.playCardClubVoice(view.players[view.self].hero,view.winners.includes(view.self)?'win':'lose');
    }
  },[view]);

  useEffect(()=>()=>{turnGeneration.current++;audioService.stopCardClubVoices();},[]);
}
