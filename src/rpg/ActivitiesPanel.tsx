import React,{useEffect,useState} from 'react';
import GameCard from '../components/Card';
import CardInspectionModal from '../components/CardInspectionModal';
import TranslatedUiTree from '../components/TranslatedUiTree';
import type { LanguageMode, Card } from '../types';
import { distance, type Action, type World } from './engine';

export default function ActivitiesPanel({world,selfId,selectedPeer,send,languageMode,display='all'}:{display?:'all'|'cards'|'dialogs';languageMode:LanguageMode;world:World;selfId:string;selectedPeer:string|null;send:(action:Action)=>void}) {
 const [inspected,setInspected]=useState<Card|null>(null);
 const currentTradeId=world.activities.trades.find(t=>t.from===selfId||t.to===selfId)?.id;
 useEffect(()=>setInspected(null),[currentTradeId]);
 const me=world.players[selfId];
 if(!me)return null;
 const a=world.activities,e=a.event;
 const duel=world.duels.find(d=>d.id===me.duelId);
 const trade=a.trades.find(t=>t.from===selfId||t.to===selfId);
 const dungeon=a.dungeons.find(d=>d.id===me.dungeonId);

 const nearby=Object.values(world.players).filter(p=>p.id!==selfId&&distance(p,me)<=3);
 const target=world.players[selectedPeer || ''];
 const card=(id:string,owner:string)=>world.players[owner]?.profile?.deck?.find(c=>c.id===id);
 return <TranslatedUiTree mode={languageMode}>
  {display!=='dialogs'&&<>{!me.spectator&&<section data-rpg-panel="team" className="rpg-player-panel rpg-activities"><h2>仲間とトレード</h2><p>近くの仲間と冒険中のカードを交換できます。</p>
   {target && <p>選択中：{target.name}</p>}
   {nearby.length===0?<p>近くに仲間がいません。</p>:nearby.map(p=><div className="rpg-team-member-row" key={p.id}><span>{p.name}</span><button disabled={!!trade||!!me.duelId||!!p.duelId||!!me.dungeonId||!!me.nativeScene||!!p.nativeScene||!!p.dungeonId||world.ended} onClick={()=>send({type:'trade-request',target:p.id})}>トレード</button>{world.gameMode==='BATTLE_ROYALE'&&<button disabled={!!me.duelId||!!me.dungeonId||!!me.nativeScene||!!p.duelId||!!p.dungeonId||!!p.nativeScene||world.ended} onClick={()=>send({type:'duel-request',target:p.id})}>バトル</button>}</div>)}
  </section>}
  <section data-rpg-panel="event" className="rpg-player-panel rpg-activities"><h2>ワールド共通イベント</h2><strong>{e.title}</strong><p>{e.finished?(e.completed?'達成！ 共通報酬を獲得':'次のイベントを待っています'): <>{e.progress} / {e.target} · 残り {Math.max(0,Math.ceil((e.expires-Date.now())/1000))} 秒</>}</p><progress max={e.target} value={e.progress}/><p>{e.kind==='BATTLES'?'みんなで戦闘に勝利して図書館を取り戻そう。':e.kind==='ANSWERS'?'問題に正解して知識の灯をともそう。':'各地の封印装置を調べ、校長の攻撃力を弱めよう。'}</p>
   <h3>地図の秘密</h3><p>地図の断片 {a.secretsFound.length} / 3 · 発見した断片は全員に共有されます。</p>{a.secretsFound.length>=3&&<p>秘密の遺跡が開放されました！</p>}
   <h3>協力ダンジョン</h3>{world.sites.filter(s=>s.kind==='dungeon').map(s=><div key={s.id}><p>{s.name} ({s.x}, {s.y})</p><button disabled={distance(s,me)>2||!!me.dungeonId||!!trade||world.ended} onClick={()=>send({type:'dungeon-join',siteId:s.id})}>参加者を募集・参加</button></div>)}
  </section>

  </>}
  {display!=='cards'&&<>
  {duel?.status==='request'&&<div className="rpg-overlay"><section className="rpg-dialog rpg-trade-dialog"><h2>ライバルと対戦</h2><p>{world.players[duel.members[0]]?.name} ↔ {world.players[duel.members[1]]?.name}</p><p>先攻・後攻はランダム。先攻の最初のターンはアタックカードを使えません。</p>{selfId===duel.members[1]?<button onClick={()=>send({type:'duel-accept',duelId:duel.id})}>対戦を受ける</button>:<p>相手の承諾を待っています。</p>}<button onClick={()=>send({type:'duel-cancel',duelId:duel.id})}>キャンセル</button></section></div>}
  {trade&&<div className="rpg-overlay"><section className="rpg-dialog rpg-trade-dialog"><h2>カードトレード</h2><p>{world.players[trade.from]?.name} ↔ {world.players[trade.to]?.name}</p>
   {!trade.accepted?<><p>{trade.to===selfId?'トレードの申し込みが届きました。':'相手の承諾を待っています。'}</p>{trade.to===selfId&&<button onClick={()=>send({type:'trade-accept',tradeId:trade.id})}>申し込みを承諾</button>}</>:<>
    <div className="rpg-trade-columns">{[selfId,trade.from===selfId?trade.to:trade.from].map(owner=><div key={owner}><h3>{world.players[owner]?.name} の提示カード</h3>{trade.offers[owner].length===0&&<p>まだカードが選ばれていません。</p>}{trade.offers[owner].map(id=>{const c=card(id,owner);return c?<div className="rpg-trade-card" key={id}><GameCard card={c} languageMode={languageMode} disabled={false} onClick={()=>setInspected(c)} onInspect={setInspected}/> </div>:null;})}</div>)}</div>
    <h3>渡すカードを選択（最大5枚）</h3><div className="rpg-trade-deck">{me.profile?.deck?.map(c=>{const chosen=trade.offers[selfId].includes(c.id);return <div className={`rpg-trade-card ${chosen?'is-selected':''}`} key={c.id}><GameCard card={c} languageMode={languageMode} selected={chosen} disabled={!chosen&&trade.offers[selfId].length>=5} onInspect={setInspected} onClick={()=>send({type:'trade-offer',tradeId:trade.id,cards:chosen?trade.offers[selfId].filter(id=>id!==c.id):[...trade.offers[selfId],c.id]})}/>{chosen&&<span className="rpg-trade-selected" aria-hidden="true">✓</span>}</div>;})}</div>
    <p>提示内容が変わると双方の確定が解除されます。交換後のデッキは5枚以上必要です。</p><button disabled={trade.confirmed.includes(selfId)} onClick={()=>send({type:'trade-confirm',tradeId:trade.id})}>{trade.confirmed.includes(selfId)?'相手の確定待ち':'この内容で交換を確定'}</button>
   </>}
   <button onClick={()=>send({type:'trade-cancel',tradeId:trade.id})}>キャンセル</button><p role="status">{me.message}</p>
  </section></div>}
  {dungeon?.status==='lobby'&&<div className="rpg-overlay"><section className="rpg-dialog"><h2>協力ダンジョン</h2><p>最大4人 · リアルタイム協力戦闘 · 全5部屋</p><p>攻略中もワールドの制限時間は進みます。</p>{dungeon.members.map(id=><p key={id}>{world.players[id]?.name} {dungeon.ready.includes(id)?'準備完了':'準備中'}</p>)}<button onClick={()=>send({type:'dungeon-ready',dungeonId:dungeon.id})}>{dungeon.ready.includes(selfId)?'準備を取り消す':'準備完了'}</button>{dungeon.leader===selfId&&<button disabled={!dungeon.members.every(id=>dungeon.ready.includes(id))} onClick={()=>send({type:'dungeon-start',dungeonId:dungeon.id})}>ダンジョン開始</button>}<button onClick={()=>send({type:'dungeon-leave',dungeonId:dungeon.id})}>募集を離れる</button></section></div>}
 </>}
 {trade&&inspected&&<CardInspectionModal card={inspected} languageMode={languageMode} onClose={()=>setInspected(null)}/>}
 </TranslatedUiTree>;
}
