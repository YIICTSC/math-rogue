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
import { clamp } from './originals/model';

type ActorProps = {
  id: CastId;
  pose: Pose;
  age: number;
  facing?: 'side' | 'rear' | 'front';
  className?: string;
  size?: number;
};

const ACTION_ROW: Record<Pose, number> = {
  idle: 0, walk: 0, jump: 0, duck: 0, strike: 2, throw: 3, swing: 4, read: 5, use: 6, aim: 7, win: 6, miss: 0,
};

export function RushPortrait({ id }: { id: CastId }) {
  return <span className="asr-cast-portrait" aria-hidden="true">
    <img src={assetUrl(DASH_HERO_ART[id])} alt="" draggable={false} />
  </span>;
}

export function RushActor({ id, pose, age, facing = 'side', className = '', size }: ActorProps) {
  const walk = pose === 'walk';
  const dashPose = pose === 'jump' || pose === 'duck';
  const rearRun = facing === 'rear' && walk;
  const dashPath = 'sprites/go-home-dash/';
  let row = ACTION_ROW[pose];
  let column = facing === 'rear' ? 1 : facing === 'front' || pose === 'win' || pose === 'miss' ? 0 : 2;
  let rows = 8;
  let columns = 8;
  let path = `sprites/dungeons1/actions/${id}.webp`;
  if (dashPose || rearRun) {
    columns = 4;
    rows = rearRun || (pose === 'duck' && facing !== 'rear') ? 1 : 2;
    path = `${dashPath}${facing === 'rear' ? rearRun ? 'rush/rear/' : 'rush/actions/' : pose === 'duck' ? 'slides/' : 'heroes/'}${id}.webp`;
    column = clamp(Math.floor(age / 75), 0, 3);
    row = rows === 2 && (facing !== 'rear' || pose === 'duck') ? 1 : 0;
  } else if (walk) {
    row = Math.floor(age / 85) % 2;
  }
  const aspect = rearRun ? 128 / 160 : dashPose ? (rows === 1 ? 1 : 128 / 160) : 1;
  const style = {
    ...(size ? {width:size*aspect,height:size} : {}),
    '--asr-actor-sheet': `url("${assetUrl(path)}")`,
    '--asr-actor-columns': columns,
    '--asr-actor-rows': rows,
    '--asr-actor-frame-x': `${column * 100 / (columns - 1)}%`,
    '--asr-actor-frame-y': `${rows > 1 ? row * 100 / (rows - 1) : 0}%`,
    '--asr-actor-ratio': aspect,
  } as CSSProperties;
  return <div className={`asr-cast-actor ${className}`} data-actor={id} data-pose={pose}
    data-atlas={dashPose || rearRun ? 'dash' : 'dungeon'} style={style} aria-hidden="true">
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
