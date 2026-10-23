import React from 'react';
import type { Action,ClubView } from './model';
import { CardFace } from './CardFace';
import { cardLabel,SUITS } from './cards';
import { empatScore } from './empatSatu';
import { WORLD_IDS } from './worldCatalog';
export function WorldTable({view:v,l,send,selected,select}:{view:ClubView;l:(jp:string,en:string)=>string;send:(a:Action)=>void;selected:number[];select:(card:number|number[])=>void}){
 if(!(WORLD_IDS as readonly string[]).includes(v.game))return null;
 const c=v.extra.classic!,e=v.extra,active=v.self===v.turn&&v.phase==='play',over=v.phase==='round'||v.phase==='result';
 const hints:Record<string,string>={
  hokmTrump:l('ハーケムが最初の5枚だけで切札を選びます。他の手札はその後に配ります。','Hâkem chooses trump from the first five cards. Other hands are dealt afterward.'),callBid:l('獲得するトリック数を2〜12で宣言。宣言ちょうどか＋1勝だけ成功です。','Bid two to twelve tricks. Only your bid or bid plus one succeeds.'),
  sergentExchange:l('前回の不足者へ渡す札を1枚選択。同スートの最強札が強ければ自動で戻ります。','Offer one card to the previous deficit player. Their strongest card of that suit is returned automatically if stronger.'),sergentTrump:l('親が切札を選びます。その後、キティーを見る前に4枚捨てます。','Dealer chooses trump, then discards four cards before seeing the kitty.'),sergentDiscard:l('手札から4枚を選び、キティー4枚と交換してください。','Select four cards to discard, then take the four-card kitty.'),
  ecarteOffer:l('子は交換を提案するか、そのままプレイ。初回交換を断って負けると相手に2点です。','Nondealer: propose an exchange or play. Refusing the first exchange and losing concedes two points.'),ecarteReply:l('親は交換を承諾するか拒否。承諾後、子1〜5枚、親0〜5枚を選びます。','Dealer: accept or refuse the exchange. If accepted, nondealer selects one to five cards, dealer zero to five.'),ecarteDiscard:l('交換する札を選んでください。親はパスで交換0枚にもできます。','Select cards to exchange. Dealer may pass to exchange zero.'),
  worldPass:v.game==='blacklady'?c.contract===2?l('右隣へ渡す2枚を選択。全員が選ぶまで札は渡しません。','Select two cards to pass right. Nothing is delivered until everyone selects.'):l('2回目のパス。右隣へもう1枚を渡します。','Second pass: send one more card right.'):l('右隣へ渡す3枚を選択。全員が選ぶまで内容は秘密です。','Select three cards to pass right. Choices stay secret until everyone selects.'),
  palaceSetup:l('手札と自分の公開札を交換できます。手札を1枚選び、公開札を押して交換。「準備完了」で進みます。','Swap hand and exposed cards: select one hand card, then tap an exposed card. Choose Ready when finished.'),
  empatDraw:l('山札か捨て札から1枚引きます。同スート4枚なら引く前にストップできます。','Draw from stock or top discard. Before drawing, stop with four cards of one suit.'),empatDiscard:l('1枚捨ててください。捨て札から引いたカードはすぐには捨てられません。','Discard one card. You cannot immediately return a card drawn from discards.'),
 };
 if(v.game==='ecarte')hints.play=l('同スートで勝てるなら勝ち、なければ同スート、同スートなしなら切札。最初の札の前に切札Kを宣言できます。','Follow and beat if possible; otherwise follow, or trump when void. Declare trump king before your first card.');
 const isMarriage=['66','schnapsen'].includes(v.game);
 const role=(seat:number)=>v.game==='sergent'?`${l('目標','Target')} ${seat===v.dealer?8:(v.dealer+1)%3===seat?5:3}`:seat===c.caller?l('ハーケム','Hâkem'):'';
 return <div className="cc-world">
  {!over&&hints[e.step]&&<p className="cc-step" role="status">{hints[e.step]}</p>}
  {isMarriage&&<><p className="cc-step">{l('カード点は自動表示し、66点で勝利宣言します。マリッジ付きの操作でKとQを公開できます。','Card points are shown and victory is claimed automatically at 66. A marriage action reveals your king and queen.')}</p><div className="cc-world-scores">{v.players.map((p,i)=><article key={p.id}><strong>{p.name}</strong><span>{e.points[i]} / 66</span><small>{l('ゲーム点','Game points')}: {p.score} / 7</small></article>)}</div><p>{c.closedBy>=0?`${l('クローズ','Closed')}: ${v.players[c.closedBy].name}`:v.stock?l('山札あり：自由にプレイ','Open stock: play freely'):v.game==='schnapsen'?l('山切れ：フォロー・勝てる札・切札の義務','Stock exhausted: follow, beat if able, or trump'):l('山切れ：フォロー義務','Stock exhausted: follow suit')}</p></>}
  {['hokm','sergent'].includes(v.game)&&<div className="cc-world-roles">{v.players.map((p,i)=><span key={p.id}>{p.name} · {role(i)||l('参加者','Player')}{v.game==='sergent'&&v.round>0?` · ${l('前回差','Previous surplus')} ${p.bags>0?'+':''}${p.bags}`:''}</span>)}</div>}
  {v.game==='sergent'&&e.step==='sergentExchange'&&<p>{v.players[c.remaining[0]]?.name} → {v.players[c.remaining[1]]?.name} · {l('残り交換枚数','Exchanges remaining')}: {c.remaining[2]}</p>}
  {['blacklady','blackmaria'].includes(v.game)&&<><p>{v.game==='blacklady'?l('♥−1 · ♠Q−13 · クリアした人で26点と持越しを等分','Hearts −1 · ♠Q −13 · Clear players share 26 plus carry'):l('罰点：♥1 · ♠A7 · ♠K10 · ♠Q13','Penalties: hearts 1 · ♠A 7 · ♠K 10 · ♠Q 13')}</p>{v.game==='blacklady'&&<p>{l('持越し','Carry')}: {v.players[0].bags}</p>}{e.board.length>0&&<div className="cc-kitty"><span>{l('最後の勝者が取る札','Cards for the last trick winner')}</span>{e.board.map((card,index)=><CardFace key={index} card={card}/>)}</div>}</>}
  {v.game==='cangkul'&&<p className="cc-step">{l('同スートがなければドロー。山切れのパスでは、出札をパスした人に配ります。手札0で即勝利。','Draw if you cannot follow suit. Empty-stock passes share the played cards. Empty your hand to win immediately.')}</p>}
  {v.game==='getaway'&&<p className="cc-step">{l('別スートが出た時点で勝負終了。リードスート最強の人が場を引き取ります。最後に残ると負け。','An off-suit play ends the trick. Highest led-suit card picks up the pile. Last remaining player loses.')}</p>}
  {v.game==='empatsatu'&&v.players[v.self].hand.length===4&&<p>{l('自分の手札点','Your hand value')}: {empatScore(v.players[v.self].hand).points} · {l('加算スート','Positive suit')}: {SUITS[empatScore(v.players[v.self].hand).suit]}</p>}
  {v.game==='shithead2'&&<>{e.step!=='palaceSetup'&&<p className="cc-step">{l('手札→公開札→伏せ札の順。2はリセット、10か同数字4枚で場を焼いて連続プレイ。伏せ札は見ずに選びます。','Use hand, then exposed, then unseen cards. Two resets; ten or four equal ranks burns the pile for another turn. Choose hidden cards without looking.')}</p>}<div className="cc-palace-layouts">{v.players.map((p,seat)=><article key={p.id} className={seat===v.self?'cc-own-layout':''}><h3>{p.name}{p.out?` · ${l('脱出','Escaped')}`:''}</h3><div className="cc-public-hand">{c.rows[seat].map((card,index)=>{
   const own=seat===v.self&&active,swap=own&&e.step==='palaceSetup'?v.actions.find(a=>a.type==='swap'&&a.index===index&&selected.includes(a.cards![0])):undefined,play=own&&e.step!=='palaceSetup'?v.actions.find(a=>['play','take'].includes(a.type)&&a.cards?.includes(card)):undefined;
   return <CardFace key={card} card={card} selected={selected.includes(card)} onClick={swap?()=>send(swap):play?()=>select(card):undefined}/>;
  })}</div><small>{l('伏せ札','Unseen cards')}</small><div className="cc-public-hand">{c.hidden[seat].map((card,index)=>{const pick=seat===v.self&&active?v.actions.find(a=>a.type==='pick'&&a.index===index):undefined;return <CardFace key={index} card={card} label={`${p.name} · ${l('伏せ札','Unseen card')} ${index+1}`} onClick={pick?()=>send(pick):undefined}/>;})}</div></article>)}</div></>}
  {c.reveals.length>0&&<details className="cc-declarations" open={isMarriage}><summary>{l('宣言で公開した札','Cards revealed by declarations')}</summary><div className="cc-public-hand">{c.reveals.map((notice,index)=><figure key={index}><CardFace card={notice.card}/><figcaption>{v.players[notice.player]?.name}</figcaption></figure>)}</div></details>}
  {c.notices.length>0&&<details className="cc-declarations"><summary>{l('自分への交換確認','Your private exchange notices')}</summary>{c.notices.map((notice,index)=><p key={index}>{v.players[notice.from]?.name}: {cardLabel(notice.card)}</p>)}</details>}
 </div>;
}
