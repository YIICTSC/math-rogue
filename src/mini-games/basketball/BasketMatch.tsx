import React from 'react';
import {assetUrl} from '../../utils/assetPaths';
import type {BasketView,Match,Unit} from './types';
import {ROLES,CHARGE_MAX,shotChance,contest} from './rules';
import {actionButtons,actionDisabled,tutorialExpected,type CourtAction} from './controls';
import {tutorialText,tutorialOrder} from './tutorial';
import BasketCanvas from './BasketCanvas';
const iconCells:Record<string,[number,number]>={shoot:[0,0],pass:[1,0],dash:[2,0],block:[0,1],rebound:[1,1],steal:[2,1],screen:[0,2],call:[1,2],special:[2,2]};
export function ActionIcon({kind}:{kind:string}){const[col,row]=iconCells[kind]||iconCells.shoot;return <span className="bk-action-illustration" aria-hidden="true" data-action-art={kind} style={{backgroundImage:`url(${assetUrl('sprites/basketball/action-icons-v1.webp')})`,backgroundPosition:`${col*50}% ${row*50}%`}}/>;}
export interface MatchProps {
 view:BasketView;m:Match;u?:Unit;self:string;active:boolean;menu:boolean;t:(s:string)=>string;
 field:React.RefObject<HTMLDivElement|null>;pad:{x:number;y:number};
 onPadDown:(e:React.PointerEvent<HTMLDivElement>)=>void;onPadMove:(e:React.PointerEvent<HTMLDivElement>)=>void;onPadUp:()=>void;
 onAction:(action:CourtAction,phase?:'start'|'release'|'cancel')=>void;onMenu:()=>void;onQuit:()=>void;onContinue:()=>void;
}
export default function BasketMatch(p:MatchProps){
 const{view,m,u,self,active,t}=p,held=!!u&&m.ball.holder===u.id,attack=!!u&&m.possession===u.side;
 const mode=m.tutorial?t('チュートリアル'):m.inbound>0?t('チェックボール'):m.mustClear?t('外側へボールを運ぼう'):!m.ball.holder?t('リバウンド'):attack?t('オフェンス'):t('ディフェンス');
 const role=u?ROLES[u.role]:null,actions=u?actionButtons(m,u):[],skillUnit=m.units.find(v=>v.actionSeq===m.serial),event=m.notice==='SKILL'&&skillUnit?ROLES[skillUnit.role].skill:m.notice;
 const eventText:Record<string,string>={'SHOT':'シュート','DUNK':'ダンク！','3 POINTS!':'3ポイント！','BASKET!':'ナイスシュート！','PERFECT RELEASE':'パーフェクト！','CONTESTED':'シュート妨害','PASS':'パス','STEAL':'スティール！','INTERCEPT':'パスカット！','BLOCK':'ブロック！','REBOUND':'リバウンド','REBOUND WIN':'リバウンド獲得！','SHOT CLOCK':'ショットクロック','CLEARED':'クリア！','OUT':'アウト','SCREEN':'スクリーン','BLOCK ATTEMPT':'','REBOUND ATTEMPT':''};
 return <section className="bk-match" aria-label={t('バスケットボールの試合')}>
  <div ref={p.field} className="bk-playfield"><BasketCanvas view={view} selfId={self} suspended={p.menu}/></div>
  <header className="bk-match-top">
   <button className="bk-exit" aria-label={t('バスケットボールの入口へ')} onClick={p.onQuit}>‹</button>
   <div className="bk-scoreboard" aria-label={t('スコア')}><div data-own={u?.side===0}><small>TEAM {m.teams[0]+1}</small><strong>{m.score[0]}</strong></div><section><small>GAKURO · 3×3</small><b>{Math.floor(Math.max(0,180-m.time)/60)}:{String(Math.floor(Math.max(0,180-m.time)%60)).padStart(2,'0')}</b><span data-danger={m.shotClock<=5}>{Math.ceil(Math.max(0,m.shotClock))}</span></section><div data-own={u?.side===1}><strong>{m.score[1]}</strong><small>TEAM {(m.teams[1]??0)+1}</small></div></div>
   <button className="bk-menu" onClick={p.onMenu} aria-label={t('メニュー')}>☰</button>
  </header>
  <div className="bk-possession" data-attack={attack}><i/>{mode}{u&&<span>{u.role} · {t(role!.tag)}</span>}</div>
  {!!event&&(view.clock-m.noticeAt<1.45)&&!m.tutorial&&eventText[event]!==''&&<div className={'bk-event '+(event==='3 POINTS!'||event==='BASKET!'?'is-score':'')} key={m.serial} role="status">{t(eventText[event]??event)}</div>}
  {m.tutorial&&m.phase==='play'&&<aside className="bk-tutorial" role="status" data-stage={m.tutorial.stage}><small>{t('はじめてのバスケットボール')} · {Math.min(6,tutorialOrder.indexOf(m.tutorial.stage)+1)} / 6</small><p>{t(tutorialText[m.tutorial.stage])}</p>{m.tutorial.stage==='complete'&&<button autoFocus aria-label={t('CPU戦を始める')} onClick={p.onContinue}>{t('CPU戦を始める')} →</button>}</aside>}
  {view.paused&&<p className="bk-pause-note" role="status">{t('一時停止中')}</p>}
  {!u&&<p className="bk-watch-note">{t('あなたの試合が始まるまで観戦できます。')}</p>}
  {u&&<>
   <div className="bk-player-card"><span>{u.role}</span><div><strong data-allow-japanese="true">{u.name}</strong><div className="bk-stamina" role="meter" aria-label={t('スタミナ')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(u.stamina*100)}><i style={{width:`${u.stamina*100}%`}}/></div></div><small>{u.stats.points} PTS · {u.stats.assists} AST · {u.stats.rebounds} REB</small></div>
   <div className="bk-stick" role="group" aria-label={t('バーチャルパッド')} onPointerDown={p.onPadDown} onPointerMove={p.onPadMove} onPointerUp={p.onPadUp} onPointerCancel={p.onPadUp} onLostPointerCapture={p.onPadUp}><i/><b style={{transform:`translate(${p.pad.x*31}px,${-p.pad.y*31}px)`}}/><span>✥</span></div>
   {held&&!m.tutorial&&!u.charging&&<div className="bk-shot-advice" data-contested={contest(m,u)>.4}>{m.mustClear?t('外側へボールを運ぼう'):contest(m,u)>.4?t('守備の少ない場所へ'):t('シュート長押し・黄色で離す')}<small>{t('成功率の目安')} {Math.round(shotChance(m,u,.75)*100)}%</small></div>}
   {u.charging&&<div className="bk-shot-gauge" role="meter" aria-label={t('シュートタイミング')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(u.charge/CHARGE_MAX*100)}><div><i/><b style={{left:`${Math.min(100,u.charge/CHARGE_MAX*100)}%`}}/></div><span>{t('黄色で離してシュート')}</span></div>}
   <div className="bk-actions" aria-label={t('アクション')}>
    {actions.map(a=>{const special=a.id==='special',disabled=actionDisabled(a.id,m,u,active),cooldown=a.id==='dash'?u.dashCooldown:special?u.skillCooldown:['block','steal','rebound','screen'].includes(a.id)?u.cooldown:0;
     return <button key={a.id} className={'bk-action bk-action-'+a.id+(a.main?' is-main':'')} aria-label={t(a.label)} disabled={disabled} data-tutorial-next={!!m.tutorial&&tutorialExpected[m.tutorial.stage]===a.id} style={special?{'--skill-charge':`${u.energy*360}deg`} as React.CSSProperties:undefined}
      onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();if(a.id==='shoot'){e.currentTarget.setPointerCapture(e.pointerId);p.onAction('shoot','start');}else p.onAction(a.id);}}
      onPointerUp={()=>{if(a.id==='shoot')p.onAction('shoot','release');}} onPointerCancel={()=>{if(a.id==='shoot')p.onAction('shoot','cancel');}} onLostPointerCapture={()=>{if(a.id==='shoot')p.onAction('shoot','release');}}
      onClick={e=>{if(e.detail===0){if(a.id==='shoot'){p.onAction('shoot','start');p.onAction('shoot','release');}else p.onAction(a.id);}}}>
      <span className="bk-action-face"><ActionIcon kind={a.icon}/>{cooldown>0&&<b className="bk-cooldown">{Math.ceil(cooldown)}</b>}</span><strong>{t(a.label)}</strong><small>{special?`${Math.round(u.energy*100)}%`:a.key}</small>
     </button>;
    })}
   </div>
   {role&&<div className="bk-skill-name">{u.role} · {t(role.skill)}</div>}
  </>}
 </section>;
}
