import type { CSSProperties } from 'react';
import AttackEffectSprite from '../../../components/AttackEffectSprite';
import { ATTACK_EFFECTS } from '../../../data/attackEffects';
import type { Entry } from '../catalog';
import { directionFor } from '../direction';
import type { Action, Outcome } from '../engine';
import type { State } from '../originals/model';
import { S } from './physics';
import type { Point } from './types';
import './action-feedback.css';

/** Reuse the main game's animation strips at the action, rather than over the HUD. */
export function ActionFeedback({ entry, state: s, elapsed, action, outcome, player, attackAngle = 0 }: {
  entry: Entry; state: State; elapsed: number; action?: Action; outcome?: Outcome; player: Point; attackAngle?: number;
}) {
  const family = entry.game.action!.family, age = action ? Math.max(0, elapsed - action.at) : Infinity;
  const hitAge = elapsed - s[S.LAST_HIT], freshHit = hitAge >= 0 && hitAge < 430 && s[S.SCORE] > 0;
  const direction = action && directionFor(entry, action.index), effect = direction?.effect;
  const def = effect && ATTACK_EFFECTS[effect];
  const contactAge=s[S.T]-s[S.CONTACT_AT],melee=['duel','parry'].includes(family),contactNow=melee&&contactAge>=0&&contactAge<430;
  const contactPlace={left:`${s[S.CONTACT_X]/10}%`,top:`${s[S.CONTACT_Y]/6}%`} as CSSProperties;
  const place = { left: `${player.x / 10}%`, top: `${(player.y - 35) / 6}%` } as CSSProperties;
  const boost = elapsed < s[S.B] && ['run', 'climb', 'catch', 'chase', 'soccer', 'kart'].includes(family);
  return <div className="asr-action-feedback" aria-hidden="true">
    {!outcome && boost && <div className="asr-velocity-trails" style={place} data-facing={s[S.FACING]}><i /><i /><i /></div>}
    {def && effect && age < 290 && outcome !== 'mistake' && (family !== 'golf' || s[S.PHASE] === 3) && <div className="asr-contact-effect" style={{...(contactNow?contactPlace:place),rotate:`${contactNow?(s[S.CONTACT_DIRECTION]<0?180:0):attackAngle}deg`}} key={`${action?.at}-${action?.index}`}>
      <AttackEffectSprite effectKey={effect} size={92} fixedFrame={Math.min(def.frames - 1, Math.floor(age / def.frameMs))} />
    </div>}
    {contactNow&&<div key={`${s[S.CONTACT_AT]}-${s[S.CONTACT_KIND]}`} className="asr-combat-impact" data-kind={s[S.CONTACT_KIND]} style={contactPlace}><i/><i/><i/><b>{s[S.CONTACT_KIND]===2?'PARRY!':'HIT!'}</b></div>}
    {freshHit && <div className="asr-score-flash" key={s[S.LAST_HIT]} style={contactNow?contactPlace:place}><b>NICE!</b><i>✦</i><i>✦</i><i>✦</i></div>}
  </div>;
}
