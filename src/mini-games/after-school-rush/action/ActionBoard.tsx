import {useLayoutEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import type { LanguageMode } from '../../../types';
import { assetUrl } from '../../../utils/assetPaths';
import { Sprite, type ArtName } from '../art';
import { THEMES, type Entry } from '../catalog';
import { gameText } from '../copy';
import { castFor, type Pose } from '../direction';
import type { Action, Outcome } from '../engine';
import { RushActor } from '../RoundEffects';
import { usesDashMovement } from '../actorSprite';
import type { State } from '../originals/model';
import { actionWorld, FLOOR, noteLane, S, sideView, survivalTime, timingGoal } from './physics';
import type { Point } from './types';

const at = (p: Point): CSSProperties => ({ left: `${p.x / 10}%`, top: `${p.y / 6}%` });
function ObjectArt({ p, art, className = '', children }: { p: Point; art: ArtName; className?: string; children?: ReactNode }) {
  return <div className={`asr-action-object ${className}`} style={at(p)}><Sprite name={art} />{children}</div>;
}
export function ActionBoard({ entry, state: s, elapsed, mode, action, outcome, feedbackElapsed = 0 }: {
  entry: Entry; state: State; elapsed: number; mode: LanguageMode; action?: Action; outcome?: Outcome; feedbackElapsed?: number;
}) {
  const field=useRef<HTMLDivElement>(null),[actorSize,setActorSize]=useState(72);
  useLayoutEffect(()=>{const node=field.current;if(!node)return;const measure=()=>setActorSize(Math.max(32,node.clientHeight*.2));measure();const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(measure);observer?.observe(node);window.addEventListener('resize',measure);return()=>{observer?.disconnect();window.removeEventListener('resize',measure);};},[]);
  const spec = entry.game.action!, w = actionWorld(spec, s), family = spec.family, t = s[S.T];
  const isSide = sideView(spec), cast = castFor(entry), a = t < s[S.A], b = t < s[S.B], hit = t - s[S.DAMAGE] < 900;
  const stationary = ['aim', 'timing', 'throw', 'rhythm'].includes(family);
  const player = stationary ? { x: family === 'timing' ? timingGoal(spec) : family === 'rhythm' ? 500 : 120, y: 530 } : { x: s[S.X], y: s[S.Y] };
  const rolling = a && ['collect', 'dodge'].includes(family);
  const grounded = isSide && w.platforms.some(p => s[S.X] >= p.x - 10 && s[S.X] <= p.x + p.w + 10 && Math.abs(s[S.Y] - p.y) < 3 && s[S.VY] >= 0);
  const dashMovement = usesDashMovement(family);
  const pose: Pose = outcome ? outcome === 'clear' ? 'win' : 'miss' : family === 'aim' ? 'aim'
    : family === 'flap' || isSide && !grounded ? 'jump' : rolling || family === 'hurdles' && b ? 'duck'
      : family === 'duel' && a ? 'strike' : family === 'throw' && a ? 'throw'
        : a && !dashMovement || family === 'carry' && s[S.CARRIED] ? 'use' : Math.abs(s[S.AX]) + Math.abs(s[S.AY]) > .1 ? 'walk' : 'idle';
  const progress = ['dodge', 'hurdles', 'flap', 'balance'].includes(family) ? Math.min(1, elapsed / survivalTime(spec))
    : family === 'push' ? Math.min(1, Math.abs(s[S.BOX_X] - (spec.variant % 2 ? 580 : 420)) / 430)
      : family === 'run' || family === 'climb' ? Math.min(1, Math.abs(s[S.X] - (spec.variant % 2 ? 880 : 120)) / 790)
        : family === 'carry' || family === 'brake' ? Math.min(1, s[S.X] / 870) : s[S.SCORE] / spec.goal;
  const title = gameText(mode, spec.boss ? THEMES[entry.chapter].boss : entry.game.title);
  const local = (ja: string, en: string, hira?: string) => gameText(mode, [ja, en, hira]);
  return <div className="asr-original asr-action-original">
    <div ref={field} className="asr-field asr-action-stage" data-family={family} data-side={isSide} data-hit={hit || undefined} data-outcome={outcome}
      role="img" aria-label={title} style={{ '--asr-scenery': `url("${assetUrl(THEMES[entry.chapter].art)}")` } as CSSProperties}>
      <div className="asr-action-backdrop" /><div className="asr-action-atmosphere" />
      {!isSide && <div className="asr-action-floor" data-flying={family === 'flap'} />}
      {w.platforms.map((p, i) => <div className="asr-action-platform" key={i} style={{ left: `${p.x / 10}%`, top: `${p.y / 6}%`, width: `${p.w / 10}%`, height: `${(600 - p.y) / 6}%` }}><i /></div>)}
      {['run', 'climb'].includes(family) && <ObjectArt p={w.goal} art={family === 'run' ? 'door' : 'bell'} className="asr-action-goal asr-action-feet"><span>★</span></ObjectArt>}
      {family === 'push' && <><div className="asr-action-box-goal" style={at(w.goal)} /><ObjectArt p={{ x: s[S.BOX_X], y: FLOOR }} art={spec.item} className="asr-action-feet asr-action-crate" /></>}
      {family === 'brake' && <div className="asr-action-parking" style={{ left: `${(w.goal.x - 100) / 10}%` }}><span>STOP</span></div>}
      {family === 'flap' ? w.hazards.map((gate, i) => <div className="asr-action-gate" key={i} style={{ left: `${gate.x / 10}%`, '--gap-top': `${(gate.y - w.gateGap! / 2) / 6}%`, '--gap-bottom': `${(gate.y + w.gateGap! / 2) / 6}%` } as CSSProperties}><i /><i /><span>→</span></div>)
        : w.hazards.map((h, i) => <div key={i} className={`asr-action-danger-zone ${isSide ? 'asr-action-solid' : ''} ${h.high ? 'asr-action-high-rope' : ''}`}
          style={{ ...at(h), width: `${(isSide ? h.width ?? 60 : h.radius * 2) / 10}%`, height: `${(isSide ? h.height ?? 50 : h.radius * 2) / 6}%` }}>
          <Sprite name={spec.hazard} />
        </div>)}
      {['collect', 'sweep', 'catch', 'aim'].includes(family) && w.targets.map((p, i) => <div key={i} className="asr-action-target" data-gone={family !== 'aim' && !!(s[S.MASK] & 1 << i)} data-catch={family === 'catch'}
        style={at(p)}><Sprite name={spec.item} /><i />{family === 'aim' && <b>＋</b>}</div>)}
      {family === 'aim' && <><div className="asr-action-reticle" style={at({ x: s[S.X], y: s[S.Y] })}><i /><i /><b>＋</b></div>
        {a && action && <svg className="asr-action-beam" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true"><line x1="140" y1="475" x2={s[S.X]} y2={s[S.Y]} /></svg>}</>}
      {family === 'timing' && <><div className="asr-action-catch-zone" style={at(w.goal)}><i /><span>A</span></div><ObjectArt p={w.targets[0]} art={spec.item} /></>}
      {family === 'balance' && <><div className="asr-action-balance-base"><i /></div><div className="asr-action-balance-beam" style={{ transform: `translateX(-50%) rotate(${s[S.LEAN] * 27}deg)` }} />
        <div className="asr-action-wind" data-reverse={spec.variant % 2}>➜ ➜ ➜</div><ObjectArt p={{ x: s[S.X], y: 370 }} art={spec.item} /></>}
      {family === 'duel' && w.enemy && <ObjectArt p={w.enemy} art={spec.item} className={`asr-action-feet asr-action-enemy ${t % 1600 > 400 && t % 1600 < 950 ? 'is-attacking' : 'is-open'}`}>
        <span>{Array.from({ length: Math.max(0, spec.goal - s[S.SCORE]) }, (_, i) => <i key={i}>◆</i>)}</span></ObjectArt>}
      {family === 'chase' && w.enemy && <ObjectArt p={w.enemy} art={spec.item} className="asr-action-runaway"><span>!</span></ObjectArt>}
      {family === 'throw' && <><ObjectArt p={w.goal} art="hoop" className="asr-action-hoop" />
        {s[S.BALL_X] >= 0 ? <ObjectArt p={{ x: s[S.BALL_X], y: s[S.BALL_Y] }} art={spec.item} className="asr-action-ball" />
          : <svg className="asr-action-trajectory" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => {
            const dt = i * .055, rad = s[S.ANGLE] * Math.PI / 180, x = 120 + Math.cos(rad) * s[S.POWER] * dt, y = 455 - Math.sin(rad) * s[S.POWER] * dt + 450 * dt * dt;
            return x < 980 && y < 530 ? <circle key={i} cx={x} cy={y} r={4} /> : null;
          })}</svg>}
        <small className="asr-action-angle">{Math.round(s[S.ANGLE])}° <span>↑↓ {local('強さ', 'Power', 'つよさ')}</span></small></>}
      {family === 'rhythm' && <div className="asr-action-drums"><div className="asr-action-hit-line" />{[0, 1].map(lane => <div className="asr-action-drum" key={lane} data-struck={lane ? b : a} style={at({ x: lane ? 650 : 350, y: 470 })}><Sprite name="cylinder" /><b>{lane ? 'B' : 'A'}</b></div>)}
        {Array.from({ length: spec.goal }, (_, i) => {
          const due = 1250 + i * 800, y = 450 - (due - t) * .32;
          return i >= s[S.NOTE] && y > -30 && y < 600 ? <div className="asr-action-note" key={i} style={at({ x: noteLane(s, i) ? 650 : 350, y })} data-lane={noteLane(s, i)}>♪</div> : null;
        })}</div>}
      {family === 'carry' && <><div className="asr-action-delivery" style={at(w.goal)}><Sprite name="satchel" /><span>★</span></div>
        <ObjectArt p={s[S.CARRIED] ? { x: s[S.X], y: s[S.Y] - 90 } : s[S.MASK] ? { x: s[S.BOX_X], y: s[S.BOX_Y] } : { x: 150, y: 300 }} art={spec.item} className="asr-action-parcel" /></>}
      <div className="asr-action-player" data-facing={s[S.FACING]} data-pose={pose} data-vehicle={family==='brake'||undefined} data-rolling={rolling && !outcome || undefined}
        data-dashing={b && ['run', 'climb', 'catch', 'chase'].includes(family) || undefined}
        data-guard={b && ['duel', 'dodge', 'collect'].includes(family)} style={{...at(player),width:actorSize,height:actorSize}}>
        <i className="asr-action-shadow" />
        <RushActor size={actorSize} id={cast.id} pose={pose} dashMovement={dashMovement}
          jumpVelocity={family === 'flap' ? 0 : s[S.VY]}
          actionRemaining={pose === 'duck' ? (rolling ? s[S.A] : s[S.B]) - t : undefined}
          age={outcome ? feedbackElapsed : pose === 'walk' ? t : pose === 'duck'
            ? Math.max(0, t - (rolling ? s[S.A] - 260 : s[S.B] - 650))
            : action ? Math.max(0, t - action.at) : elapsed} />
        {family==='brake'&&<Sprite name="truck" className="asr-action-vehicle"/>}
        {b && ['duel', 'dodge', 'collect'].includes(family) && <Sprite name="shield" className="asr-action-shield" />}
        {family === 'catch' && a && <div className="asr-action-open-arms"><Sprite name="satchel" /><i /></div>}
        {family === 'flap' && <Sprite name="glider" className="asr-action-glider" />}
        {a && ['chase', 'sweep', 'push', 'duel'].includes(family) && <i className="asr-action-swing" key={action?.at} />}
      </div>
      <div className="asr-action-status"><span>{Array.from({ length: spec.boss ? 3 : 2 }, (_, i) => <i key={i} data-lost={i >= s[S.HP]}>◆</i>)}</span>
        <span>{['collect', 'catch', 'aim', 'timing', 'duel', 'chase', 'sweep', 'throw', 'rhythm'].includes(family) ? `${s[S.SCORE]} / ${spec.goal}` : '★'}</span></div>
      <div className="asr-action-progress" aria-hidden="true"><span style={{ width: `${outcome === 'clear' ? 100 : Math.max(0, Math.min(1, progress)) * 100}%` }} /></div>
      {outcome === 'clear' && <div className="asr-action-clear-burst" aria-hidden="true">✦<span>✦</span><span>✦</span></div>}
    </div>
  </div>;
}
