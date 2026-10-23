import React from 'react';
import type { Action,ClubView } from './model';
import { CardFace } from './CardFace';
import { cardLabel } from './cards';
export function GameTableExtras({view:v,l,send}:{view:ClubView;l:(jp:string,en:string)=>string;send:(a:Action)=>void}){
  const e=v.extra,active=v.turn===v.self&&v.phase==='play';
  const instructions:Record<string,string>={exchange:l('渡す3枚を選んでください。全員の選択が終わるまで受取札は公開されません。','Select three cards to pass. Incoming cards stay hidden until everyone selects.'),trump:l('親が切札のスートを選びます。','The dealer chooses the trump suit.'),discard:v.game==='ciapano'?l('親は最後のトリック獲得者へ渡す1枚を捨ててください。','Dealer: discard one card for the last-trick winner.'):l('好きなカードをもう1枚出してください。','Play any one extra card.'),draw:v.game==='rummy'?l('山札か捨て札から1枚引いてください。','Draw from stock or the discard pile.'):l('山札から1枚引いてください。','Draw one card from stock.'),revealed:l('公開された数字に合わせるか、見送ってください。','Match the exposed rank or pass.'),meld:l('組を公開、付け札、または1枚捨てて手番終了。','Expose melds, lay off, or discard one card to end your turn.'),mismatch:l('同じ数字ではありませんでした。確認してから次へ進みます。','No match. Look at the cards before continuing.')};
  return <div className="cc-table-extras">
    {!e.classic&&instructions[e.step]&&v.phase==='play'&&<p className="cc-step" role="status">{instructions[e.step]}</p>}
    {e.indicator>=0&&<div className="cc-indicator"><span>{['rummy','ginrummy','golf','empatsatu'].includes(v.game)?l('捨て札の一番上','Top discard'):v.game==='cribbage'?l('スターター','Starter'):e.classic?l('切札・候補の表示札','Trump / candidate indicator'):v.game==='sueca'?l('切札表示札（配札時に公開）','Trump card (exposed when dealt)'):v.game==='briscola'?l('切札表示札（最後に補充）','Trump indicator (last drawn)'):l('最後に配られる札','Last stock card')}</span><CardFace card={e.indicator}/></div>}
    {v.game==='kalter'&&<p>{l('宣言の倍数','Declaration multiplier')} ×{e.multiplier}</p>}
    {v.game==='memory'&&v.phase==='play'&&<><p>{l('場のカードを2枚めくってください。同じ数字なら続けて遊べます。','Flip two table cards. Match ranks to play again.')}</p>{e.step==='mismatch'&&active&&<button className="cc-primary" onClick={()=>send({type:'continue'})}>{l('確認したので裏返して次の人へ','Turn back over and continue')}</button>}<div className="cc-memory-board">{e.board.map((c,i)=>c===-2?<span className="cc-memory-empty" key={i}/>:<CardFace key={i} card={c} label={`${l('位置','Position')} ${i+1}${c<0?'':` · ${cardLabel(c)}`}`} onClick={active&&v.actions.some(a=>a.type==='pick'&&a.index===i)?()=>send({type:'pick',index:i}):undefined}/>)}</div></>}
    {e.melds.length>0&&<section className="cc-melds"><h2>{l('公開済みの組（付け札できます）','Exposed melds (available for layoffs)')}</h2>{e.melds.map((m,i)=><article key={i}><small>{i+1} · {v.players[m.owner].name}</small><div>{[...m.cards].sort((a,b)=>a%13-b%13).map(c=><CardFace key={c} card={c}/>)}</div></article>)}</section>}
    {e.piles.length>0&&<section className="cc-foundations">{e.piles.map((cs,i)=><article key={i}><h3>#{i+1} · {i<4?l('中央の列','Side pile'):l('キングの隅','King corner')}</h3><div>{cs.map(c=><CardFace key={c} card={c}/>)}</div>{!cs.length&&<small>{i<4?l('好きな札で開始','Start with any card'):l('キングで開始','Start with a king')}</small>}</article>)}</section>}
    {(v.phase==='round'||v.phase==='result')&&e.points.some(Boolean)&&<p>{l('この配札の獲得札の点数','Captured-card points this deal')}: {v.players.map((p,i)=>`${p.name} ${v.game==='ciapano'&&e.points.reduce((a,b)=>a+b,0)===32?e.points[i]/3:e.points[i]}`).join(' / ')}</p>}
  </div>;
}
