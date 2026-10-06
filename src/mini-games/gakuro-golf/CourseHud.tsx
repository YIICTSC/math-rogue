import React from 'react';
import { HOLES, type Hole } from './course';
import type { PublicGolfer } from './engine';

/** Course positions share the exact world coordinates used by the simulation. */
export default function CourseHud({player,hole,remaining,aim,players,holeCount,t}:{player:PublicGolfer;hole:Hole;remaining:number;aim:number;players:PublicGolfer[];holeCount:number;t:(s:string)=>string}){
  const score=player.scores.reduce((sum,n,i)=>sum+n-HOLES[i].par,0);
  const windAngle=(Math.atan2(hole.wind.x,hole.wind.z)-aim)*180/Math.PI;
  const length=Math.hypot(hole.cup.x,hole.cup.z);
  const zScale=112/(hole.cup.z+60),mapZ=(z:number)=>130-(z+25)*zScale;
  const ballX=80+player.x*.65,ballZ=mapZ(player.z);
  const bounds={x:Math.max(5,Math.min(155,ballX)),z:Math.max(5,Math.min(135,ballZ))};
  return <>
    <div className="gg-hud" role="group" aria-label={t('ホール情報')}>
      <div className="gg-hole-ribbon"><small>HOLE / {holeCount}</small><strong>{player.hole+1}</strong><span>PAR {hole.par} · {Math.round(length)} m</span></div>
      <div className="gg-player-readout"><b data-allow-japanese="true">{player.name}</b><span className="gg-total-score">{score===0?'±0':score>0?'+'+score:score}</span><span>{t('打数')} <strong>{player.strokes}</strong></span><span>{t('残り')} <strong>{remaining.toFixed(1)}<small> m</small></strong></span></div>
    </div>
    <aside className="gg-wind" aria-label={t('風')}><span className="gg-wind-arrow" style={{transform:`rotate(${windAngle}deg)`}} aria-hidden="true">↑</span><div><small>{t('風')}</small><strong>{Math.hypot(hole.wind.x,hole.wind.z).toFixed(1)}</strong></div></aside>
    <details className="gg-minimap"><summary>{t('コースマップ')}</summary><svg viewBox="0 0 160 140" role="img" aria-label={t('コースマップ')}>
      <rect width="160" height="140" rx="10" fill="#234d34"/>
      <path d={`M ${80-hole.fairway*.65} ${mapZ(-6)} L ${80+hole.cup.x*.65-hole.fairway*.65} ${mapZ(hole.cup.z)} L ${80+hole.cup.x*.65+hole.fairway*.65} ${mapZ(hole.cup.z)} L ${80+hole.fairway*.65} ${mapZ(-6)} Z`} fill="#81ad55"/>
      {hole.water.map((h,i)=><ellipse key={'w'+i} cx={80+h.x*.65} cy={mapZ(h.z)} rx={h.rx*.65} ry={h.rz*zScale} fill="#65bed2"/>)}
      {hole.sand.map((h,i)=><ellipse key={'s'+i} cx={80+h.x*.65} cy={mapZ(h.z)} rx={h.rx*.65} ry={h.rz*zScale} fill="#edda9b"/>)}
      <ellipse cx={80+hole.cup.x*.65} cy={mapZ(hole.cup.z)} rx="11" ry={17*zScale} fill="#b1d779"/>
      {players.filter(p=>!p.spectator&&p.connected&&p.hole===player.hole&&p.id!==player.id).map(p=><circle key={p.id} cx={80+p.x*.65} cy={mapZ(p.z)} r="2" fill="#80dcff"/>)}
      <path d={`M ${bounds.x} ${bounds.z} l ${Math.sin(aim)*12} ${-Math.cos(aim)*12}`} stroke="#fff5a6" strokeWidth="2"/>
      <circle cx={bounds.x} cy={bounds.z} r="3.5" fill="white" stroke="#132d2a" strokeWidth="1.5"/>
      <path d={`M ${80+hole.cup.x*.65} ${mapZ(hole.cup.z)} v -10 l 7 2 -7 2`} stroke="#fff" strokeWidth="1.5" fill="#ff6c59"/>
    </svg></details>
  </>;
}
export function ClubIcon({club}:{club:string}){
 return <svg className="gg-club-icon" viewBox="0 0 64 64" aria-hidden="true"><path d="M 40 5 L 22 48" stroke="#f1f4eb" strokeWidth="4" strokeLinecap="round"/><path d="M40 5l-5 12" stroke="#253c47" strokeWidth="6" strokeLinecap="round"/>{club==='driver'?<ellipse cx="19" cy="50" rx="13" ry="9" fill="#233748" stroke="#e2eef1" strokeWidth="2"/>:club==='putter'?<rect x="8" y="47" width="24" height="7" rx="2" fill="#d9e9e9"/>:<path d="M9 51l10-12 14 7-5 11z" fill="#d9e9e9" stroke="#798f9b" strokeWidth="2"/>}</svg>;
}
