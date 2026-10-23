import React from 'react';

/** Decorative piles use counts only, including when an opponent's hand is hidden. */
export function HandBacks({count}:{count:number}){
  return <span className="cc-hand-backs" aria-hidden="true">{Array.from({length:Math.min(5,count)},(_,i)=><i key={i} style={{'--cc-back-index':i} as React.CSSProperties}/>)}</span>;
}
export function TableStock({count,discard,pile,l}:{count:number;discard:number;pile?:number;l:(jp:string,en:string)=>string}){
  return <div className="cc-stock-row">
    <div className={`cc-stock ${count?'':'cc-stock-empty'}`} data-stock-count={count} aria-label={`${l('山札','Stock')}: ${count}`}>
      <span className="cc-stock-stack" aria-hidden="true">{Array.from({length:Math.min(4,count)},(_,i)=><i key={i} style={{'--cc-layer':i} as React.CSSProperties}>✦</i>)}</span>
      <span>{l('山札','Stock')} <strong>{count}</strong></span>
    </div>
    {discard>0&&<span className="cc-discard-count">{l('捨て札','Discard')} · {discard}</span>}
    {pile!==undefined&&<span>{l('場','Pile')} · {pile}</span>}
  </div>;
}
