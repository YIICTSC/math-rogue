import React,{useEffect,useRef,useState} from 'react';
import type {ClubView} from './model';
import {clubScoreAwards,SCORE_REASONS} from './scoreAwards';

export function ScoreFeedback({view,l}:{view:ClubView|null;l:(ja:string,en:string)=>string}){
  const previous=useRef<ClubView|null>(null),serial=useRef(0);
  const [items,setItems]=useState<{id:number;text:string}[]>([]);
  useEffect(()=>{
    const old=previous.current;
    previous.current=view?{...view,log:[...view.log]}:null;
    if(!view||!old||old.game!==view.game||old.round!==view.round||old.revision>view.revision){setItems([]);return;}
    const gains=clubScoreAwards(old,view).map(({player,amount,reasons:events})=>{
      const reasons=[...new Set(events.map(e=>l(...SCORE_REASONS[e.key])+(e.value?` +${e.value}`:'')))];
      if(reasons.length===1)reasons[0]=reasons[0].replace(/ \+\d+$/,'');
      return {id:++serial.current,text:`${player.name} · ${reasons.join(' / ')||l('得点','Points')}　+${amount}`};
    });
    if(gains.length)setItems(oldItems=>[...oldItems,...gains].slice(-8));
  },[view]);
  useEffect(()=>{
    if(!items.length)return;
    const timer=setTimeout(()=>setItems(oldItems=>oldItems.slice(1)),3200);
    return ()=>clearTimeout(timer);
  },[items]);
  return <div className="cc-score-feedback" role="status" aria-live="polite">{items.slice(0,3).map(item=><div key={item.id} data-score-reward>✦ {item.text}</div>)}</div>;
}
