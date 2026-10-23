import React,{useEffect,useState} from 'react';
import {CardFace} from './CardFace';
import {isMeld} from './rummy';
import {retainHandGroups,automaticHandGroups} from './rummyHandGroups';
export function RummyHand({hand,selected,select,clearSelection,sorting,l}:{sorting:React.ReactNode;hand:number[];selected:number[];select:(cards:number|number[])=>void;clearSelection:()=>void;l:(jp:string,en:string)=>string}){
 const [saved,setSaved]=useState<number[][]>([]),groups=retainHandGroups(saved,hand),grouped=new Set(groups.flat());
 const handKey=[...hand].sort((a,b)=>a-b).join(',');
 useEffect(()=>{setSaved(old=>retainHandGroups(old,hand));},[handKey]);
 const chosen=selected.filter(card=>hand.includes(card)),canGroup=chosen.length===selected.length&&isMeld(chosen);
 const makeGroup=()=>{if(canGroup){setSaved([...groups.filter(group=>!group.some(card=>chosen.includes(card))),[...chosen]]);clearSelection();}};
 const cards=(list:number[])=>list.map(card=><CardFace key={card} card={card} selected={selected.includes(card)} onClick={()=>select(card)}/>);
 return <><div className="cc-rummy-toolbar"><div className="cc-rummy-tools"><button onClick={()=>{setSaved(automaticHandGroups(hand));clearSelection();}}>{l('組を自動整理','Auto-group melds')}</button><button disabled={!canGroup} onClick={makeGroup}>{l('選択札を組にする','Group selected cards')}</button></div>{sorting}</div><div className="cc-hand cc-rummy-hand">{groups.map((group,index)=><section className="cc-rummy-group" key={group.join(',')} aria-label={`${l('組','Meld')} ${index+1}`}><header><button onClick={()=>select(group)}>{l('組を選択','Select meld')} {index+1}</button><button aria-label={`${l('組を解除','Ungroup meld')} ${index+1}`} onClick={()=>setSaved(groups.filter((_,i)=>i!==index))}>×</button></header><div>{cards([...group].sort((a,b)=>a%13-b%13||a-b))}</div></section>)}<section className="cc-rummy-loose" aria-label={l('余り札','Unmatched cards')}><small>{l('余り札','Unmatched cards')}</small><div>{cards(hand.filter(card=>!grouped.has(card)))}</div></section></div></>;
}
