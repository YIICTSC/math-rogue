import React from 'react';
import type { ClubView } from './model';
import { CardFace } from './CardFace';
import { petrangolaScore } from './petrangola';
export function DiversityTable({view:v,l}:{view:ClubView;l:(jp:string,en:string)=>string}){
 const c=v.extra.classic!,over=v.phase==='round'||v.phase==='result';
 const strength=(cards:number[])=>{const n=petrangolaScore(cards);return n>=400?l('Aの3枚組','Three aces'):n>=300?l('同スートの連続3枚','Suited three-card run'):n>=200?l('同じ数字の3枚組','Three of a rank'):`${l('同スートの合計','Same-suit total')}: ${n}`;};
 const instructions:Record<string,string>={
  guessTurn:l('質問か推理を選びます。質問の返事を聞いたら相手の番になります。','Ask or guess. After an answer, your opponent takes their turn.'),
  specOffer:l('現在の最強札を保持するか、最低価格を決めて競売します。','Keep the highest card, or set a minimum auction price.'),
  specTurn:l('最強札を持つ人はめくれません。裏札の売却は手番に1回です。','The highest owner cannot reveal. A blind card can be offered once per turn.'),
  specAuction:l('購入額を上乗せするか、競りから降ります。代金は売主へ渡ります。','Overbid or pass. The buyer pays the seller.'),
  suitOffer:l('左隣へ渡すカードを1枚選びます。','Choose one card to give to your left neighbour.'),
  suitReply:l('受け取った数字と同じ合計を返すか、山札から引きます。','Return the same total, or draw from stock.'),
  suitReturn:l('合計が一致するまで、返すカードを1枚ずつ選びます。','Choose return cards one at a time until the total matches.'),
  suitBottom:l('任意で3枚まで、1枚ずつ山札の底へ戻せます。','Optionally put up to three cards under stock, one at a time.'),
  suitFinish:l('任意でA・2を山の底へ戻し、手番を終えて勝利条件を確認します。','Optionally put aces/twos under stock, then end your turn to check victory.'),
  petrDealer:l('親の手札はまだ伏せています。場の3枚を見て、全交換か保持を選びます。','Dealer hand remains hidden. Inspect the three central cards, then swap all or keep.'),
  petrTurn:l('0〜3枚を交換。0枚・3枚交換はノックとなり、他の人があと1回ずつ行動します。','Exchange zero to three. Zero or three knocks, leaving one final turn for every other player.'),
  dogBet:l('宣言後に山札を公開。同スートの強い手札があれば獲得できます。','Stake, then reveal stock. A higher hand card of that suit wins.'),
 };
 return <div className="cc-diversity">
  {v.phase==='play'&&instructions[v.extra.step]&&<p className="cc-step" role="status">{instructions[v.extra.step]}</p>}
  {v.game==='guessit'&&<><div className="cc-public-hand"><CardFace card={c.hidden[0][0]??-1}/><span>{l('推理する中央札','Hidden card to identify')}</span></div><div className="cc-answers">{c.notes.map((n,i)=><p key={i}>{v.players[n.player].name} · {n.points===1?'A':n.points===11?'J':n.points===12?'Q':n.points===13?'K':n.points} · {n.label==='answerYes'?l('持っています','Yes, held'):l('持っていません','No, not held')}</p>)}</div></>}
  {v.game==='speculation'&&<>{c.reveals.length>0&&<div className="cc-public-hand"><CardFace card={c.reveals[c.reveals.length-1].card}/><span>{l('最後にめくった札','Last revealed card')}</span></div>}<p>{l('プール','Pool')}: {v.pool} · {l('最強札の持主','Highest card owner')}: {v.players[c.caller]?.name}</p>{v.extra.step==='specAuction'&&<p>{c.defender?l('裏札1枚の競売','One blind card auction'):l('公開札の競売','Exposed card auction')} · {l('最低価格','Minimum')}: {c.banned} · {l('現在額','Current bid')}: {c.contract} · {c.partner>=0?v.players[c.partner].name:'—'}</p>}<div className="cc-public-hand">{Array.from({length:v.players[v.self].handCount},(_,i)=><CardFace key={i} card={v.players[v.self].hand[i]??-1}/>)}</div></>}
  {v.game==='suitmatch'&&<>{c.reveals.length>0&&<div className="cc-public-hand"><CardFace card={c.reveals[0].card}/><span>{l('渡された札','Offered card')}</span></div>}<p>{l('ターナー','Turnor')}: {v.players[c.first]?.name} · {l('レフター','Lefter')}: {v.players[c.last]?.name}</p>{['suitReply','suitReturn'].includes(v.extra.step)&&<p>{l('返す残りの合計','Remaining return total')}: {c.contract}</p>}</>}
  {v.game==='petrangola'&&<>{over&&<div className="cc-layouts">{v.players.filter(p=>p.hand.length===3).map(p=><article key={p.id}><h3>{p.name} · {strength(p.hand)}</h3><div className="cc-public-hand">{p.hand.map(card=><CardFace key={card} card={card}/>)}</div></article>)}</div>}{v.players[v.self].hand.length===3&&<p>{l('自分の手の強さ','Your hand strength')}: {strength(v.players[v.self].hand)}</p>}{c.closedBy>=0&&<p>{l('ノック','Knock')}: {v.players[c.closedBy].name} · {l('残りの手番','Final turns')}: {c.remaining.length}</p>}</>}
  {v.game==='reddog'&&<><p>{l('プール','Pool')}: {v.pool} · {l('宣言の上限','Stake limit')}: {Math.min(10,v.pool)}</p><div className="cc-public-hand">{c.reveals.map((r,i)=><figure key={i}><CardFace card={r.card}/><figcaption>{i===0?l('公開された山札','Revealed stock card'):l('勝てる証明札','Winning proof card')}</figcaption></figure>)}</div></>}
 </div>;
}
