import React,{useLayoutEffect,useRef} from 'react';
import { SUITS,cardLabel } from './cards';
import { audioService } from '../../services/audioService';
export function CardFace({card,selected,onClick,label,showRank}:{card:number;selected?:boolean;onClick?:()=>void;label?:string;showRank?:boolean}){
  const back=card<0,red=!back&&[1,2].includes(Math.floor(card/13));
  const face=back?'?':cardLabel(card);
  const body=useRef<HTMLSpanElement|null>(null),previous=useRef(card);
  useLayoutEffect(()=>{
    const changed=previous.current>=0&&card>=0&&previous.current!==card;previous.current=card;
    // A newly exposed lower card can replace a face-up card in the same layout slot.
    if(!changed||matchMedia('(prefers-reduced-motion: reduce)').matches||!body.current?.animate)return;
    const animation=body.current.animate([{transform:'rotateY(180deg)'},{transform:'rotateY(0)'}],{duration:260,easing:'ease-out'});
    return ()=>animation.cancel();
  },[card]);
  return <button type="button" data-card={card} className={`cc-card ${back?'cc-back':''} ${red?'cc-red':''} ${selected?'cc-selected':''}`} onClick={onClick?()=>{audioService.playCardClubSound('select');onClick();}:undefined} disabled={!onClick} aria-pressed={onClick?!!selected:undefined} aria-label={label||face}>
    <span ref={body} className="cc-card-body" aria-hidden="true"><span className="cc-card-front">{!back&&<><small>{face}</small><strong>{showRank&&card<52&&<b>{face.slice(1)}</b>}{card>=52?'★':SUITS[Math.floor(card/13)]}</strong><i>{face}</i></>}</span><span className="cc-card-reverse"><b>✦</b></span></span>
  </button>;
}
