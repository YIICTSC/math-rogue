import type { CSSProperties } from 'react';
import type { LanguageMode } from '../../types';
import { assetUrl } from '../../utils/assetPaths';
import { CHOICE_KEYS, Sprite } from './art';
import { gameText, PROP_NAMES } from './copy';
import { THEMES, type Entry } from './catalog';
import type { Action, Outcome } from './engine';
import { clamp, type Piece, type State } from './originals/model';
import { SET_PIECES } from './SetPieces';
import { DEPTH_PIECES } from './DepthPieces';
import { ACTION_PIECES } from './ActionPieces';
import { visualFor } from './visuals';
import { actorFor, RoundEffects, RushActor } from './RoundEffects';

const STAGED_ACTORS = new Set([
  'gate/forklight', 'store/toast-flip', 'yard/crosswind-lap', 'yard/jump-rope-gap', 'yard/cone-slalom', 'yard/whirlwind-crossing',
  'gym/rebound-race', 'gym/three-lane-tournament', 'roof/launch-glider', 'roof/storm-vane',
]);
const percent = (value: number) => `${clamp(value) * 100}%`;

export function OriginalBoard({
  entry,
  state,
  elapsed,
  mode,
  select,
  action,
  outcome,
  preview,
  feedbackElapsed = 0,
}: {
  entry: Entry;
  state: State;
  elapsed: number;
  mode: LanguageMode;
  select: (index: number) => void;
  action?: Action;
  outcome?: Outcome;
  preview?: boolean;
  feedbackElapsed?: number;
}) {
  const { mechanic, genre } = entry.game;
  const scene = mechanic.display(state, { now: elapsed, before: elapsed, dt: 0 });
  const [view, set, prop, motion] = visualFor(entry);
  const theme = THEMES[entry.chapter];
  const stagedActor = !preview && STAGED_ACTORS.has(entry.key);
  const actorProps = actorFor(entry, preview ? 0 : elapsed, action, outcome, feedbackElapsed);
  const actor = <RushActor {...actorProps} facing={view === 'chase' ? 'rear' : 'side'} />;
  const SetPiece = SET_PIECES[entry.key] ?? DEPTH_PIECES[entry.key] ?? ACTION_PIECES[entry.key];
  const text = (value: Piece) => (value.text ? gameText(mode, value.text) : '');
  const body = (value: Piece) => (
    <>
      {value.art && <Sprite name={value.art} />}
      {value.text && <span>{text(value)}</span>}
    </>
  );
  const count = scene.buttons.length;
  const cols = mechanic.layout === 'grid'
    ? count === 8 ? 4 : count === 4 ? 2 : count >= 6 ? 3 : Math.max(1, count)
    : count > 5 ? Math.ceil(count / 2) : Math.max(1, count);
  const locked = Boolean(outcome || preview);
  const chosen = action && (outcome ? elapsed === action.at : elapsed - action.at < 350) ? action.index : -1;
  const direct = !SetPiece && mechanic.direct;
  const timeBand = scene.marker !== undefined && scene.zone && scene.marker >= scene.zone[0] && scene.marker <= scene.zone[1];

  const controls = (
    <div className="asr-original-controls" data-count={count}>
      {scene.buttons.map((value, i) => {
        const label = text(value) || (value.art ? gameText(mode, PROP_NAMES[value.art]) : String(i + 1));
        return (
          <button
            type="button"
            key={value.key ?? i}
            data-asr-choice
            data-asr-index={i}
            data-gamepad-initial-choice={i === 0 && !locked || undefined}
            data-mark={value.mark}
            data-struck={i === chosen || undefined}
            aria-label={label}
            aria-disabled={locked || value.disabled || undefined}
            onClick={() => {
              if (!locked && !value.disabled) select(i);
            }}
          >
            {body(value)}
            {i === chosen && <span className="asr-choice-spark" key={action?.at} aria-hidden="true" />}
            <kbd aria-hidden="true">{CHOICE_KEYS[i]}</kbd>
          </button>
        );
      })}
    </div>
  );

  return (
    <div
      className="asr-original"
      data-layout={mechanic.layout}
      data-genre={genre}
      data-game={entry.key}
      data-view={view}
      data-set={set}
      data-motion={motion}
      data-outcome={outcome}
      data-preview={preview || undefined}
      inert={locked}
      style={{
        '--asr-columns': cols,
        '--asr-scenery': `url("${assetUrl(theme.art)}")`,
        '--asr-marker': percent(scene.marker ?? .5),
        '--asr-direction': chosen % 2 === 1 ? 1 : -1,
        '--asr-progress': percent(outcome === 'clear' ? 1 : scene.meter ?? 0),
      } as CSSProperties}
    >
      {scene.note && entry.key !== 'gate/quiet-zone' && <p className="asr-original-note">{gameText(mode, scene.note)}</p>}
      <div className="asr-field" data-custom={Boolean(SetPiece)} data-direct={Boolean(direct)} data-window={Boolean(timeBand)}
        data-marker={scene.marker !== undefined} data-props={Boolean(scene.props?.length)}>
        {SetPiece ? <div className="asr-set-piece">
          {preview ? <Sprite name={prop} className="asr-field-object" /> : <SetPiece {...{ state, elapsed, scene, mode, action, outcome }} actor={stagedActor ? actor : undefined} />}
        </div> : <>
          <div className="asr-space" aria-hidden="true">
            <div className="asr-space-floor" /><div className="asr-space-wall" /><div className="asr-space-wall asr-space-wall-right" />
            <div className="asr-space-horizon" />
          </div>
          {action && chosen >= 0 && <div className="asr-field-ripple" key={action.at} aria-hidden="true" />}
          <div className="asr-object-position">
            <div key={chosen >= 0 ? action?.at : 'idle'} className="asr-object-pose" data-acting={chosen >= 0}>
              <Sprite name={prop} className="asr-field-object" />
            </div>
          </div>
        </>}
        {!stagedActor && view !== 'first-person' && <div className="asr-actor-edge">{actor}</div>}
        {!preview && <RoundEffects {...{ entry, elapsed, action, outcome, feedbackElapsed }} />}
        {scene.props && scene.props.length > 0 && (
          <div className={SetPiece ? "asr-original-props asr-visually-hidden" : "asr-original-props"}>
            {scene.props.map((value, i) => (
              <div key={value.key ?? i} className="asr-original-piece" data-mark={value.mark}>
                {body(value)}
              </div>
            ))}
          </div>
        )}
        {scene.marker !== undefined && (
          <div className="asr-original-track" aria-hidden="true">
            {scene.zone && (
              <span className="asr-original-zone" style={{ left: percent(scene.zone[0]), right: percent(1 - scene.zone[1]) }} />
            )}
            <span className="asr-original-marker" />
          </div>
        )}
        {direct && controls}
      </div>
      {scene.meter !== undefined && (
        <div className="asr-original-meter" aria-hidden="true"><span /></div>
      )}
      {!direct && controls}
    </div>
  );
}
