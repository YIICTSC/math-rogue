import type { CSSProperties } from 'react';
import AttackEffectSprite from '../../components/AttackEffectSprite';
import { ATTACK_EFFECTS } from '../../data/attackEffects';
import type { AttackEffectKey } from '../../types';
import { assetUrl } from '../../utils/assetPaths';
import { DASH_HERO_ART } from '../go-home-dash/heroes';
import { Sprite } from './art';
import type { Entry } from './catalog';
import { castFor, directionFor, type CastId, type Pose } from './direction';
import type { Action, Outcome } from './engine';
import { rushActorSprite, type ActorSpriteOptions } from './actorSprite';

type ActorProps = ActorSpriteOptions & { className?: string; size?: number };

export function RushPortrait({ id }: { id: CastId }) {
  return <span className="asr-cast-portrait" aria-hidden="true">
    <img src={assetUrl(DASH_HERO_ART[id])} alt="" draggable={false} />
  </span>;
}

export function RushActor({ className = '', size, ...options }: ActorProps) {
  const { id, pose } = options;
  const sprite = rushActorSprite(options);
  const { path, row, column, rows, columns, aspect, heightScale, atlas } = sprite;
  const style = {
    ...(size ? {width:size*heightScale*aspect,height:size*heightScale} : {}),
    '--asr-actor-sheet': `url("${assetUrl(path)}")`,
    '--asr-actor-columns': columns,
    '--asr-actor-rows': rows,
    '--asr-actor-frame-x': `${column * 100 / (columns - 1)}%`,
    '--asr-actor-frame-y': `${rows > 1 ? row * 100 / (rows - 1) : 0}%`,
    '--asr-actor-ratio': aspect,
    '--asr-frame-foot': `${'feet' in sprite ? sprite.feet : 5}%`,
    '--asr-frame-shift': `${'shift' in sprite ? sprite.shift : 0}%`,
  } as CSSProperties;
  return <div className={`asr-cast-actor ${className}`} data-actor={id} data-pose={pose}
    data-atlas={atlas} style={style} aria-hidden="true">
    <span className="asr-actor-frame"><img className="asr-actor-sheet" src={assetUrl(path)} alt="" draggable={false} style={{width:`${columns*100}%`,height:`${rows*100}%`,left:`${-column*100}%`,top:`${-row*100}%`}}/></span>
  </div>;
}

export function getRoundPose(entry: Entry, elapsed: number, action?: Action, outcome?: Outcome, feedbackElapsed = 0) {
  const actionAge = action ? Math.max(0, elapsed - action.at) : Infinity;
  const direction = action && actionAge < 420 ? directionFor(entry, action.index) : undefined;
  // Let the winning jump or shot complete before the celebration pose.
  const finishingAction = outcome === 'clear' && actionAge === 0 && feedbackElapsed < 240;
  const pose: Pose = outcome && !finishingAction ? outcome === 'clear' ? 'win' : 'miss' : direction?.pose ?? 'idle';
  return { pose, age: outcome ? feedbackElapsed : direction ? actionAge : 0 };
}

function Fx({ effect, age, className }: { effect: AttackEffectKey; age: number; className: string }) {
  const def = ATTACK_EFFECTS[effect];
  return <AttackEffectSprite effectKey={effect} className={className} size={104}
    fixedFrame={Math.min(def.frames - 1, Math.floor(age / def.frameMs))} />;
}

export function RoundEffects({ entry, elapsed, action, outcome, feedbackElapsed }: {
  entry: Entry;
  elapsed: number;
  action?: Action;
  outcome?: Outcome;
  feedbackElapsed: number;
}) {
  const age = action ? (outcome ? feedbackElapsed + elapsed - action.at : elapsed - action.at) : Infinity;
  const effect = action && age < 330 ? directionFor(entry, action.index).effect : undefined;
  const clear = outcome === 'clear';
  const terminal = Boolean(outcome && feedbackElapsed >= (effect && clear ? 200 : 0));
  return <div className="asr-round-effects" aria-hidden="true">
    {effect && outcome !== 'mistake' && <div className="asr-action-fx" key={action?.at} data-effect={effect}>
      <Fx effect={effect} age={age} className="asr-action-art" />
    </div>}
    {terminal && <div className="asr-result-fx" data-result={outcome} data-boss={entry.game.boss || undefined}>
      <i /><i /><i />
      {clear && <Sprite name="bell" className="asr-result-bell" />}
      <Fx effect={clear ? entry.game.boss ? 'graduation' : 'critical' : outcome === 'time' ? 'wind' : 'impact'}
        age={Math.max(0, feedbackElapsed - 140)} className="asr-result-art" />
    </div>}
  </div>;
}

export function actorFor(entry: Entry, elapsed: number, action: Action | undefined, outcome: Outcome | undefined, feedbackElapsed: number) {
  return { id: castFor(entry).id, ...getRoundPose(entry, elapsed, action, outcome, feedbackElapsed) };
}
