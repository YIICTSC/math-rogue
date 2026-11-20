import React from 'react';

export function TableStock({count,discard,pile,l,aces}:{count:number;discard:number;pile?:number;aces?:number;l:(jp:string,en:string)=>string}){
  return <div className="cc-stock-row">
    <div className={`cc-stock ${count?'':'cc-stock-empty'}`} data-stock-count={count} aria-label={`${l('山札','Stock')}: ${count}`}>
      <span className="cc-stock-stack" aria-hidden="true">{Array.from({length:Math.min(4,count)},(_,i)=><i key={i} style={{'--cc-layer':i} as React.CSSProperties}>✦</i>)}</span>
      <span>{l('山札','Stock')} <strong>{count}</strong></span>
    </div>
    {discard>0&&<span className="cc-discard-count">{l('捨て札','Discard')} · {discard}</span>}
    {aces!==undefined&&<div className="cc-ace-counter" aria-label={`${l('引かれたA','Aces drawn')}: ${aces}/3`}><b>{l('引かれたA','Aces drawn')} {aces}/3</b><div>{Array.from({length:3},(_,i)=><span key={i} className={i<aces?'is-drawn':''}>{i<aces?<i aria-hidden="true">A</i>:<small>A</small>}</span>)}</div></div>}
    {pile!==undefined&&<span>{l('場','Pile')} · {pile}</span>}
  </div>;
}
