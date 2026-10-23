import React from 'react';
import type { ClubView } from './model';
import { cardLabel } from './cards';
import { CardFace } from './CardFace';
import { TRADITIONAL_IDS } from './traditionalCatalog';
import { sedmaPartner,sevenValue } from './sevenGames';
export function TraditionalTable({view:v,l}:{view:ClubView;l:(jp:string,en:string)=>string}){
 if(!(TRADITIONAL_IDS as readonly string[]).includes(v.game))return null;
 const e=v.extra,c=e.classic!,over=v.phase==='round'||v.phase==='result';
 const hints:Record<string,string>={pitchBid:l('1〜4点を競り上げます。最大宣言者の最初の札で切札が決まります。','Overcall one to four points. Highest bidder sets trump with the first lead.'),allFourOffer:l('子は候補を採用するかベッグ。ベッグなら親へ選択を渡します。','Nondealer: stand with this candidate or beg to ask dealer.'),allFourReply:l('採用して子に1点渡すか、3枚ずつ追加して別の候補を探します。','Keep trump and gift nondealer one, or deal three more each and seek a new suit.'),allFourDiscard:l('手札が6枚になるまで1枚ずつ捨ててください。','Discard one at a time until your hand has six cards.'),sevenRetry:l('リード側の追撃。前と同じ数字か7を出して続行するか、場を相手へ渡します。','Leader may continue with the previous rank or seven, or concede the pile.'),putCheckpoint:l('最初の勝負が終了。子は必ずプットを宣言するか、降伏して相手へ1点を渡します。','First trick complete. Nondealer must put or surrender one point.'),bluffReply:l('提案を承諾して続けるか、降伏して引上げ前の点数を渡します。','Accept and continue, or concede the stake before the raise.'),trucRedealOffer:l('1回だけ配り直しを提案できます。親が拒否すれば今の手札で開始します。','Request one redeal, or keep the hand. Dealer may refuse.'),trucRedealReply:l('配り直しに同意するか、そのまま開始します。','Accept the redeal or begin with the current hands.')};
 return <div className="cc-traditional">
  {!over&&hints[e.step]&&<p className="cc-step" role="status">{hints[e.step]}</p>}
  {['pitch','allfour'].includes(v.game)&&<><p>{l('得点札','Scoring')}: {l('ハイ・ロー・切札J・ゲーム、各1点','High · Low · trump Jack · Game, one each')}</p>{v.game==='pitch'&&c.caller>=0&&<p>{v.players[c.caller].name}: {l('宣言','Bid')} {c.contract}</p>}{v.game==='allfour'&&e.board.length>1&&<details><summary>{l('切札候補の履歴','Trump candidate history')}</summary><div className="cc-public-hand">{e.board.map((card,i)=><CardFace key={i} card={card}/>)}</div></details>}</>}
  {['sedma','sedmice'].includes(v.game)&&<><p>{l('7があれば最後の7、なければリードと同数字の最後の札が勝ちます。Aと10は各10点。','Last seven wins; otherwise last card matching the lead rank. Aces and tens score ten.')}</p>{v.players.length===4&&<p>{l('相棒','Partner')}: {v.players[v.game==='sedma'?sedmaPartner(v.round,v.self):(v.self+2)%4].name}{v.game==='sedma'?` · ${l('組替え','Partner rotation')} ${Math.floor(v.round/4)+1}/3`:''}</p>}{v.game==='sedmice'&&<p>{l('持越しの場','Contested pile')}: {v.table.length} · {v.table.reduce((sum,card)=>sum+sevenValue(card),0)} {l('点','points')}</p>}{c.notices.length>0&&<details><summary>{l('山切れ時の味方の手札','Partner hand when stock ran out')}</summary><p>{c.notices.map(n=>cardLabel(n.card)).join(' · ')}</p></details>}</>}
  {v.game==='rollingstone'&&<p>{l('同スートがなければ場を取って自分がリード。手札0で即勝利。','If unable to follow, pick up and lead. Empty your hand to win immediately.')}</p>}
  {v.game==='rantergo'&&<p>{l('Kは交換を拒否。Aが最弱。最後に最弱全員がライフを失います。','Kings block swaps; aces are lowest. All tied lowest cards lose a life.')}</p>}
  {['put','truc'].includes(v.game)&&<><strong className="cc-stake">{l('このディールの点数','Hand stake')}: {c.revealed?l('ゲーム全体','Entire match'):v.game==='put'?5:c.contract}</strong>{e.step==='bluffReply'&&<p>{v.players[c.caller]?.name} → {c.bids[0]} · {l('降伏なら','If conceded')}: {v.game==='put'?1:c.bids[1]}</p>}<p>{v.game==='put'?'3 > 2 > A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4':'7 > 6 > A > K > Q > J > 10 > 9 > 8'}</p></>}
  {c.reveals.length>0&&<details><summary>{l('公開された札','Revealed cards')}</summary><div className="cc-public-hand">{c.reveals.map((n,i)=><figure key={i}><CardFace card={n.card}/><figcaption>{v.players[n.player]?.name}</figcaption></figure>)}</div></details>}
 </div>;
}
