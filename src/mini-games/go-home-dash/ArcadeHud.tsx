import React from 'react';
import type { LanguageMode } from '../../types';
import { MISSION_TARGETS, missionProgress, multiplier, type ArcadeState } from './arcade';
export const ARCADE_COPY:Record<string,[string,string,string]>={
 fever:['フィーバー！','FEVER!','フィーバー！'],star:['レアスター！','RARE STAR!','レアスター！'],perfect:['パーフェクト！','PERFECT!','パーフェクト！'],bounce:['スプリング！','BOUNCE!','スプリング！'],boost:['加速！','BOOST!','かそく！'],
 magnet:['コインマグネット','COIN MAGNET','コインマグネット'],shield:['シールド','SHIELD','シールド'],double:['スコア2倍','DOUBLE SCORE','スコア2ばい'],sneakers:['スーパージャンプ','SUPER JUMP','スーパージャンプ'],board:['ホバーボード','HOVERBOARD','ホバーボード'],lowGravity:['低重力！','LOW GRAVITY!','ていじゅうりょく！'],
 gravity:['タップで重力反転','TAP TO FLIP GRAVITY','タップでじゅうりょくはんてん'],wave:['長押しで上・離して下','HOLD UP · RELEASE DOWN','ながおしでうえ・はなしてした'],rocket:['ロケット！長押しで上昇','ROCKET · HOLD TO RISE','ロケット！ながおしでじょうしょう'],landing:['通常モードに戻る','BACK TO RUNNING','つうじょうモードにもどる'],
 mission:['ミッション達成！','MISSION COMPLETE!','ミッションたっせい！'],nearMiss:['ギリギリ回避！','CLOSE CALL!','ギリギリかいひ！'],smash:['ダッシュブレイク！','DASH BREAK!','ダッシュブレイク！'],saved:['シールドガード！','SHIELD SAVE!','シールドガード！'],boardBreak:['身代わりガード！','VEHICLE SAVE!','みがわりガード！'],charge:['ダッシュ再使用可能','DASH RECHARGED','ダッシュさいしようかのう'],
 slideHint:['低い通路はスライド！','SLIDE UNDER THE TUNNEL','ひくいつうろはスライド！'],dashHint:['壁はダッシュで破壊！','DASH THROUGH THE WALL','かべはダッシュではかい！'],laserHint:['レーザーの予告を見よう','WATCH THE LASER WARNING','レーザーのよこくをみよう'],upperHint:['上段にレアスター！','RARE STAR ON THE HIGH ROAD','じょうだんにレアスター！'],bossHint:['追撃ドローン！ダッシュで反撃','DRONE ATTACK · DASH TO STRIKE','ついげきドローン！ダッシュではんげき'],bossHit:['ボスにヒット！','BOSS HIT!','ボスにヒット！'],bossWin:['ドローン撃破！','DRONE DEFEATED!','ドローンげきは！'],bossEscape:['ドローンが去っていった','DRONE ESCAPED','ドローンがさっていった'],checkpoint:['チェックポイント！','CHECKPOINT!','チェックポイント！'],
};
export function arcadeCopy(key:string,mode:LanguageMode){const c=ARCADE_COPY[key];return c?.[mode==='ENGLISH'?1:mode==='HIRAGANA'?2:0]||key;}
export function ArcadeHud({state:s,languageMode,paused,onPause}:{state:ArcadeState;languageMode:LanguageMode;paused:boolean;onPause:()=>void}) {
 const L=(a:string,b:string,c:string)=>languageMode==='ENGLISH'?b:languageMode==='HIRAGANA'?c:a;
 const active=(['magnet','double','sneakers','shield','board','lowGravity'] as const).filter(k=>s[k]>0);
 return <>
  <div className={`dash-arcade-strip${s.fever>0?' is-fever':''}`}>
   <span className="dash-coin-total">◉ {s.stats.coins} <i>✦ {s.stats.stars}</i></span>
   <b className="dash-combo">×{multiplier(s)} <small>{s.combo} COMBO</small></b>
   <div className="dash-fever"><small>{s.fever>0?'FEVER':'FLOW'}</small><i><b style={{width:`${s.fever>0?s.fever/480*100:s.energy}%`}}/></i></div>
   <button className="dash-pause" onClick={onPause} aria-label={paused?L('再開','Resume','さいかい'):L('一時停止','Pause','いちじていし')}>Ⅱ</button>
  </div>
  <div className="dash-effect-row">{active.map(k=><span key={k}>{arcadeCopy(k,languageMode)} <b>{Math.ceil(s[k]/60)}</b></span>)}{s.vehicle!=='normal'&&<span>{arcadeCopy(s.vehicle,languageMode)} <b>{Math.ceil(s.vehicleTime/60)}</b></span>}</div>
  {s.noticeTime>0&&<div className="dash-arcade-notice" role="status">{arcadeCopy(s.notice,languageMode)}</div>}
  <div className="dash-mission-line">{s.missionDone.every(Boolean)?L('全ミッション達成！','ALL MISSIONS CLEAR!','ぜんミッションたっせい！'):[L('コイン','Coins','コイン'),L('回避','Dodges','かいひ'),L('破壊','Breaks','はかい')].map((name,i)=><span key={i} className={s.missionDone[i]?'complete':''}>{s.missionDone[i]?'✓ ':''}{name} {Math.min(missionProgress(s)[i],MISSION_TARGETS[i])}/{MISSION_TARGETS[i]}</span>)}</div>
 </>;
}
