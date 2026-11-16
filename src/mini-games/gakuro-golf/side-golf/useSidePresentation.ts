import {useEffect,useRef,useState} from 'react';
import type {GolfView,PublicGolfer} from '../engine';
import type {SportsReaction} from '../../shared/SportsPresentation';

/** Presentation follows accepted snapshots, so reconnects and rejected card clicks cannot replay rewards. */
export function useSidePresentation(view:GolfView,player:PublicGolfer){
 const [reaction,setReaction]=useState<SportsReaction|null>(null),[draftVisible,setDraftVisible]=useState(false);
 const previous=useRef<{player:PublicGolfer;reward:GolfView['reward'];bag:number}|null>(null),serial=useRef(0);
 const state=view.sideState!,bag=Object.entries(state.inventory).reduce((total,[item,n])=>total+(item==='normal'?0:n),0);
 useEffect(()=>{
  const before=previous.current;let kind:SportsReaction['kind']|undefined;
  if(!before||before.player.id!==player.id||before.player.hole!==player.hole)kind='equip';
  else if(before.reward&&!view.reward&&bag>before.bag)kind='pickup';
  else if(player.scores.length>before.player.scores.length&&!player.capped)kind='cheer';
  else if(player.penalty&&(!before.player.penalty||player.shotId!==before.player.shotId))kind='recover';
  else if((before.player.starEnergy??0)<.999&&(player.starEnergy??0)>=.999)kind='equip';
  previous.current={player,reward:view.reward,bag};
  if(kind)setReaction({key:`${player.id}:${++serial.current}`,hero:player.avatar?.protagonist||'',kind});
 },[player,view.reward,bag]);
 useEffect(()=>{
  setDraftVisible(false);if(!view.reward)return;
  // Give the front-facing golfer a moment to celebrate before offering the cards.
  const timer=setTimeout(()=>setDraftVisible(true),950);return()=>clearTimeout(timer);
 },[view.reward?.id,view.reward?.hole,player.id]);
 return {reaction,draftVisible};
}
