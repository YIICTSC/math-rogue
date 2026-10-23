import React from 'react';
import { SUITS,cardLabel } from './cards';
export function CardFace({card,selected,onClick,label}:{card:number;selected?:boolean;onClick?:()=>void;label?:string}){
  const back=card<0,red=!back&&[1,2].includes(Math.floor(card/13));
  return <button type="button" className={`cc-card ${back?'cc-back':''} ${red?'cc-red':''} ${selected?'cc-selected':''}`} onClick={onClick} disabled={!onClick} aria-pressed={onClick?!!selected:undefined} aria-label={label|| (back?'?':cardLabel(card))}>{back?'✦':<><small>{cardLabel(card)}</small><strong>{card===52?'★':SUITS[Math.floor(card/13)]}</strong></>}</button>;
}
