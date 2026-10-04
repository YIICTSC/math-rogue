import {assetUrl} from '../../utils/assetPaths';
import React from 'react';
import type {HomeGame,HomeGameWorld,GameCommand} from './homeGames';
import {RELICS,HAZARDS} from './gameExpedition';
import './gameRoom.css';
export default function ExpeditionPanel({g,world,selfId,t,send}:{g:HomeGame;world:HomeGameWorld;selfId:string;t:(s:string)=>string;send:(c:GameCommand)=>void}){
 const e=g.expedition,leader=g.players[0]===selfId,editable=g.phase!=='playing'&&!world.paused;
 return <section className="gc-expedition">
 <div className="gc-game-modes"><button aria-pressed={!e} disabled={!editable||!leader} onClick={()=>send({type:'game_expedition',key:g.key,enabled:false})}>{t('一戦対戦')}</button><button aria-pressed={!!e} disabled={!editable||!leader} onClick={()=>send({type:'game_expedition',key:g.key,enabled:true})}>{t('5階層の冒険')}</button>{!e&&g.kind!=='rhythm'&&<button aria-pressed={!!g.arranged} disabled={!editable||!leader} onClick={()=>send({type:'game_rules',key:g.key,arranged:!g.arranged})}>{t(g.arranged?'アレンジ個人戦':'通常ルール')}</button>}</div>
 {e&&<><div className="gc-expedition-hud"><b>{t('階層')} {e.floor}/5</b><b aria-label={t('共有ライフ')}>{'♥'.repeat(Math.max(0,e.hp))}{'♡'.repeat(3-Math.max(0,e.hp))}</b><span>{t(HAZARDS[e.hazard])}</span><span>{t('目標冒険点')} {e.goal}</span>{g.phase==='playing'&&e.endsAt!==undefined&&<span>{t('残り時間')} {Math.max(0,Math.ceil(e.endsAt-world.time))}s</span>}</div><div className="gc-expedition-path" aria-hidden="true">{[1,2,3,4,5].map(n=><span key={n} className={n===e.floor?'active':n<e.floor?'done':''}>{n===5?'♛':n}</span>)}</div>
 <details><summary>{t('冒険ルールとレリック')}</summary><p>{t('全員の冒険点の平均で階層を攻略。目標未達成で共有ライフが減少。各階層後に3択レリックを獲得し、5階層を生き抜こう。総冒険点で個人順位も決まります。')}</p><p>{t('急ぐ階層では手番時間が短縮、試練の階層では目標が上昇。音ゲーの譜面と判定は変わりません。')}</p>{g.players.map((id,i)=><p key={id}><b>{g.names[i]} · {e.renown[id]||0}</b> · {(e.relics[id]||[]).map(r=>t(RELICS.find(v=>v.id===r)!.name)).join(' / ')||'—'}</p>)}</details>
 {e.settled&&<p role="status"><span>{t("今回の冒険点")} {e.average||0}/{e.goal} · </span><b>{t(e.complete?e.hp>0?'冒険を踏破しました！':'冒険はここまで。もう一度挑戦！':e.cleared?'階層クリア！レリックを選んで次へ。':'目標未達成。レリックを選んで立て直そう。')}</b></p>}
 {e.settled&&!e.complete&&<><h4>{t(e.picked.includes(selfId)?'仲間のレリック選択を待っています':'レリックを1つ選ぶ')}</h4><div className="gc-relic-choices">{(e.choices[selfId]||[]).map(id=>{const r=RELICS.find(v=>v.id===id)!;return <button key={id} disabled={world.paused||e.picked.includes(selfId)} onClick={()=>send({type:'game_relic',key:g.key,relic:id,floor:e.floor})}><img src={assetUrl(`sprites/rpg/game-room/relic-${id}.webp`)} alt=""/><b>{t(r.name)}</b><small>{t(r.detail)}</small></button>;})}</div><p>{e.picked.filter(id=>g.players.includes(id)).length}/{g.players.length} · {t('選択完了')}</p></>}
 </>}
 </section>;
}
