import type { CSSProperties } from 'react';
import { Sprite } from '../art';
import { assetUrl } from '../../../utils/assetPaths';
import type { LanguageMode } from '../../../types';
import { gameText } from '../copy';
import type { State } from '../originals/model';
import { fishX, fishingWindow, golfMeter, parryPhase, parryWindow, pitchBall, soccerGoalHalfHeight, S } from './physics';
import type { ActionSpec, Point, World } from './types';
const at = (p: Point): CSSProperties => ({ left: `${p.x / 10}%`, top: `${p.y / 6}%` });
function Ball({ p, kind }: { p: Point; kind: string }) { return <div className="asr-sport-ball" data-ball={kind} style={at(p)}><i /><i /></div>; }
/** Compact views of familiar sports, exploration and gathering systems. */
export function CrossoverScene({ spec, state: s, world: w, mode }: { spec: ActionSpec; state: State; world: World; mode: LanguageMode }) {
 const f=spec.family,t=s[S.T],l=(ja:string,en:string,hira?:string)=>gameText(mode,[ja,en,hira]);
 const sport=f==='bat'?'baseball':f==='soccer'?'soccer':f==='volley'?'volleyball':null;
 return <>
  {sport&&<span className="asr-crossover-action-art" style={{backgroundImage:`url(${assetUrl(`sprites/academy-sports/${sport}-actions-v1.webp`)})`}}/>}
  {['bat','rally','soccer','volley'].includes(f)&&<div className="asr-sport-court" data-court={f}><i/><i/><b/></div>}
  {(f==='bat'||f==='rally')&&<><div className="asr-sport-hit-zone" style={at({x:s[S.X],y:465})}><b>A</b></div><Ball p={pitchBall(s,spec)} kind={f==='bat'?'baseball':'tennis'}/><div className="asr-sport-opponent" style={at({x:500,y:130})}><Sprite name={f==='bat'?'mimic':'ghost-cat'}/></div></>}
  {f==='soccer'&&<><div className="asr-soccer-goal" style={{...at(w.goal),height:`${soccerGoalHalfHeight(spec)/3}%`}}><i/><i/></div><div className="asr-sport-opponent asr-goalkeeper" style={at(w.enemy!)}><Sprite name="mimic"/></div><Ball p={{x:s[S.BALL_X],y:s[S.BALL_Y]}} kind="soccer"/></>}
  {f==='golf'&&<><div className="asr-golf-green" style={at(w.goal)}/><div className="asr-golf-flag" style={at(w.goal)}><i/>⚑</div><div className="asr-golf-aim" style={at({x:w.goal.x,y:s[S.ANGLE]})}>＋</div>
   <svg className="asr-crossover-lines" viewBox="0 0 1000 600" preserveAspectRatio="none"><path d={`M140 470 Q490 100 ${w.goal.x} ${s[S.ANGLE]}`} strokeDasharray="10 16"/></svg>
   <Ball p={s[S.BALL_X]>=0?{x:s[S.BALL_X],y:s[S.BALL_Y]}:{x:140,y:470}} kind="golf"/>
   <div className="asr-crossover-meter"><b>{s[S.PHASE]===0?l('Aでショット開始','A: Start shot','Aでショットかいし'):s[S.PHASE]===1?l('黄色でパワー決定','Set power in yellow','きいろでパワーけってい'):s[S.PHASE]===2?l('中央でインパクト','Impact in the middle','ちゅうおうでインパクト'):l('飛んでいけ！','Fly!','とんでいけ！')}</b><div data-gauge={s[S.PHASE]===1?'power':'impact'}><i style={{left:`${golfMeter(s)*100}%`}}/></div></div></>}
  {f==='kart'&&<><div className="asr-kart-road" style={{backgroundPositionY:`${s[S.PROGRESS]/3}px`}}><i/><i/></div><div className="asr-kart-finish" style={{top:`${Math.max(6,(1500*spec.goal-s[S.PROGRESS])/10)}%`}}/>{t<s[S.A]&&<div className="asr-kart-speedlines"/>}</>}
  {f==='parry'&&<><div className="asr-parry-warning" data-ready={parryPhase(spec,t)>parryWindow(spec)[0]&&parryPhase(spec,t)<parryWindow(spec)[1]} style={at(w.enemy!)}><i style={{scale:String(.4+parryPhase(spec,t)/1500)}}/><Sprite name="mimic"/><b>{s[S.COMBO]>t?'A!':'B'}</b></div>{s[S.COMBO]>t&&<div className="asr-parry-counter">{l('反撃チャンス！','COUNTER!','はんげきチャンス！')}</div>}</>}
  {f==='grapple'&&<><div className="asr-grapple-abyss"/>{w.targets.map((p,i)=><div className="asr-grapple-anchor" key={i} style={at(p)}><Sprite name="hook"/><b>{i+1}</b></div>)}
   {s[S.PHASE]===1&&<svg className="asr-crossover-lines asr-grapple-rope" viewBox="0 0 1000 600" preserveAspectRatio="none"><line x1={s[S.X]} y1={s[S.Y]-55} x2={s[S.BALL_X]} y2={s[S.BALL_Y]}/></svg>}<div className="asr-grapple-exit" style={at(w.goal)}>★</div></>}
  {f==='fishing'&&<><div className="asr-fishing-water"/><div className="asr-fishing-track"><i/></div><div className="asr-fishing-window" style={{...at({x:s[S.X],y:310}),width:`${fishingWindow(spec)/5}%`}}/><div className="asr-fish" style={at({x:fishX(s,spec),y:310})}><i/><b>●</b></div><div className="asr-fishing-line" style={{left:`${s[S.X]/10}%`}}/><div className="asr-fishing-bars"><label>{l('つかまえる','Catch','つかまえる')}<i><b style={{width:`${Math.min(1,s[S.PROGRESS])*100}%`}}/></i></label><label data-danger={s[S.TENSION]>.7}>{l('糸のはり','Line tension','いとのはり')}<i><b style={{width:`${s[S.TENSION]*100}%`}}/></i></label></div></>}
  {f==='mining'&&w.targets.map((p,i)=><div key={i} className="asr-mining-rock" data-gone={!!(s[S.MASK]&1<<i)} data-cracked={!!(s[S.AMMO]&1<<i)} style={at(p)}><Sprite name="block"/><Sprite name="crystal"/><i/></div>)}
  {f==='volley'&&<><div className="asr-volley-shadow" style={at({x:s[S.BALL_X],y:520})}/><Ball p={{x:s[S.BALL_X],y:s[S.BALL_Y]}} kind="volley"/><div className="asr-sport-hit-zone" style={at({x:s[S.X],y:460})}><b>{s[S.PHASE]===1?'B':'A'}</b></div><div className="asr-volley-combo">{s[S.PHASE]===1?l('Bでスパイク！','B: Spike!','Bでスパイク！'):l('Aでレシーブ','A: Receive','Aでレシーブ')}</div></>}
 </>;
}
