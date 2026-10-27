import React from 'react';
import type {DodgeView} from './types';
import {assetUrl} from '../../utils/assetPaths';
import {MATCH_SECONDS} from './engine';
export default function MatchHud({view,selfId,t}:{view:DodgeView;selfId:string;t:(s:string)=>string}){
 const m=view.match;if(!m)return null;const self=m.units.find(u=>u.owner===selfId),sides=self?.side===1?[1,0] as const:[0,1] as const,seconds=Math.max(0,Math.ceil(MATCH_SECONDS-m.time));
 return <div className="dg-scoreboard" aria-label={t('チームの体力')}>
 {sides.map((side,i)=><React.Fragment key={side}>{i===1&&<div className="dg-clock"><small>{t('残り時間')}</small><b>{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</b><span>{m.time>=MATCH_SECONDS?'SUDDEN DEATH':t('内野')} {m.units.filter(u=>u.side===sides[0]&&!u.out).length} : {m.units.filter(u=>u.side===sides[1]&&!u.out).length}</span></div>}<section className={`dg-team dg-team-${i}`}><header><strong>{view.teams[m.teams[side]??0]?.name}</strong><small>{t(self?.side===side?'自分のチーム':'相手チーム')}</small></header><div className="dg-team-members">{m.units.filter(u=>u.side===side).map((u,n)=><div key={u.id} className="dg-member" data-self={u.owner===selfId} data-out={u.out} data-holder={m.ball.holder===u.id}><span className="dg-member-face">{u.avatar?.protagonist?<img src={assetUrl(`models/protagonists/${u.avatar.protagonist}.png`)} alt=""/>:<b>{n+1}</b>}</span><div><span data-allow-japanese="true">{u.owner===selfId?'◆ ':''}{u.name}</span><div className="dg-health" role="meter" aria-label={u.name} aria-valuemin={0} aria-valuemax={3} aria-valuenow={u.hp}>{[0,1,2].map(i=><i key={i} data-filled={u.hp>i}/>)}</div><small>{u.out?t('外野'):m.ball.holder===u.id?t('ボール所持'):t('内野')}</small></div></div>)}</div></section></React.Fragment>)}
 </div>;
}
