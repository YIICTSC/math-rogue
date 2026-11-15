import React from 'react';
import type {LanguageMode} from '../../types';
import type {Volleyball} from './volleyball';
import {volleySetTarget} from './volleyball';
import {local,TEAM_NAMES} from './copy';
import './volleyball-hud.css';

/** Broadcast information follows authoritative points, never notices or animation timing. */
export default function VolleyballHud({match:s,languageMode}:{match:Volleyball;languageMode:LanguageMode}) {
 const L=local(languageMode),name=(t:number)=>L(...TEAM_NAMES[t]);
 const target=volleySetTarget(s),setsToWin=Math.floor(s.config.sets/2)+1;
 const pointTeam=[0,1].find(t=>s.points[t]>=target-1&&s.points[t]-s.points[1-t]>=1);
 const matchPoint=pointTeam!==undefined&&s.score[pointTeam]===setsToWin-1;
 const deuce=s.points.every(n=>n>=target-1)&&pointTeam===undefined;
 const last=s.lastPoint&&s.clock-s.lastPoint.at<2.8?s.lastPoint:undefined;
 const reasons:Record<string,readonly[string,string,string]>={'アウト！':['アウト！','OUT','アウト！'],'ボールがコートに落ちた！':['コート内に決まった！','BALL DOWN IN COURT','コートないにきまった！'],'サーブミス':['サーブミス','SERVICE FAULT','サーブミス'],'ダブルコンタクト':['ダブルコンタクト','DOUBLE CONTACT','ダブルコンタクト'],'フォーヒット':['フォーヒット','FOUR HITS','フォーヒット'],'リベロのアタック反則':['リベロのアタック反則','LIBERO ATTACK FAULT','リベロのアタックはんそく']};
 const reason=last?L(...(reasons[last.reason]||[last.reason,'POINT','とくてん'])):'';
 const receivingSide=s.stage==='rally'?(s.ball.z>=0?0:1):s.server;
 const contacts=s.contactTeam===receivingSide?s.contacts:0;
 const tired=s.stage==='rally'&&(s.players.find(p=>p.id===s.selected)?.spirit??100)<5;
 const step=tired?L('スタミナ回復中','RECOVERING STAMINA','スタミナかいふくちゅう'):s.stage==='serve'?L('サーブ待ち','READY TO SERVE','サーブまち'):s.stage==='toss'?L('トス → サーブ','TOSS → SERVE','トス → サーブ'):contacts===1?L('レシーブ → トス','RECEIVE → SET','レシーブ → トス'):contacts>=3?L('相手コートへ返球','RETURN TO OPPONENT','あいてコートへへんきゅう'):contacts===2?L('トス → スパイク','SET → SPIKE','トス → スパイク'):L('レシーブに備えよう','GET READY TO RECEIVE','レシーブにそなえよう');
 return <div className="ac-broadcast ac-broadcast-volleyball" data-broadcast="volleyball">
  <section className="ac-vb-scoreboard" aria-label={L('セットと得点・サーブ権','Sets, points and serve possession','セットととくてん・サーブけん')}>
   <header><span><i/>LIVE</span><b>{L('第','SET ','だい')}{s.setNumber}{L('セット','','セット')}</b><small>{target}{L('点先取',' POINT TARGET','てんせんしゅ')}</small></header>
   <div className="ac-vb-columns"><span>GAKURO VOLLEY</span><span>{L('セット','SETS','セット')}</span><span>{L('得点','PTS','とくてん')}</span></div>
   {[0,1].map(t=><div className="ac-vb-score-row" key={t} data-serving={s.server===t} style={{'--vb-team':t===0?'#54d9ed':'#ff7899'} as React.CSSProperties}>
    <span className="ac-vb-team"><i aria-label={s.server===t?L('サーブ権','Serving','サーブけん'):undefined}>{s.server===t?'●':''}</i><b>{name(t)}</b></span><span className="ac-vb-sets" data-sets={t}>{s.score[t]}</span><strong data-points={t} key={`${t}-${s.points[t]}`}>{s.points[t]}</strong>
   </div>)}
   <footer><span>{step}</span><span className="ac-vb-touches" aria-label={`${name(receivingSide)} ${contacts} / 3`}>{[1,2,3].map(n=><i key={n} data-lit={s.stage==='rally'&&contacts>=n}/>)}</span></footer>
   {!!s.setScores?.length&&<div className="ac-vb-history" aria-label={L('終了セットの得点','Completed set scores','しゅうりょうセットのとくてん')}>{s.setScores.map((score,i)=><span key={i}>{i+1}: <b>{score.join('–')}</b></span>)}</div>}
  </section>
  {(pointTeam!==undefined||deuce)&&<div className="ac-vb-stakes" data-match-point={matchPoint} role="status"><b>{deuce?L('デュース','DEUCE','デュース'):matchPoint?L('マッチポイント','MATCH POINT','マッチポイント'):L('セットポイント','SET POINT','セットポイント')}</b>{pointTeam!==undefined&&<span>{name(pointTeam)}</span>}</div>}
  {last&&!s.practice&&<div className="ac-vb-point" role="status" key={s.pointSerial} data-point-team={last.team} data-set-won={last.wonSet}>
   <small>{last.wonSet?L('セット獲得','SET WON','セットかくとく'):last.sideout?L('サイドアウト · サーブ権獲得','SIDE OUT · SERVE WON','サイドアウト・サーブけんかくとく'):L('ポイント獲得','POINT WON','ポイントかくとく')}</small>
   <div><strong>{name(last.team)}</strong><b>{last.points.join(' – ')}</b></div>
   <span>{last.wonSet?`${L('第','SET ','だい')}${last.set}${L('セット','','セット')} · `:''}{reason}</span>
  </div>}
 </div>;
}
