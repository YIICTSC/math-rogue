import type { CSSProperties, ReactNode } from 'react';
import type { LanguageMode } from '../../types';
import { Sprite } from './art';
import { gameText, translate } from './copy';
import type { Action, Outcome } from './engine';
import { clamp, type Display, type State } from './originals/model';
import {
  CYLINDER_CAPACITY, ENSEMBLE_BEATS, ENSEMBLE_BEAT_MS, FESTIVAL_ORDER, GLIDER_ALTITUDE,
  GLIDER_WIND, PASSAGE_COST, ROPE_FIRST, ROPE_INTERVAL, ROPE_MARGIN, TOAST_BURNT, TOAST_READY,
} from './sceneSignals';

export type SceneProps = {
  state: State;
  elapsed: number;
  scene: Display;
  mode: LanguageMode;
  action?: Action;
  outcome?: Outcome;
  actor?: ReactNode;
};

const numberStyle = (name: string, value: number | string) => ({ [name]: value } as CSSProperties);

function Passage({ state: [step, noise], elapsed, action, outcome, mode }: SceneProps) {
  const l = (ja: string, en: string, hira: string) => translate(mode, [ja, en, hira]);
  const materials = [l('砂利', 'Gravel', 'じゃり'), l('草', 'Grass', 'くさ'), l('石板', 'Slabs', 'せきばん')];
  const clear = outcome === 'clear';
  return <div className="asr-passage" data-step={clear ? 3 : step} data-lane={action?.index}>
    <div className="asr-passage-camera" aria-hidden="true">
      <div className="asr-passage-ceiling" />
      <div className="asr-passage-wall" />
      <div className="asr-passage-wall asr-passage-wall-right" />
      <div className="asr-passage-end"><Sprite name="door" /><Sprite name="ship-lantern" /></div>
      <div className="asr-passage-floor">
        {Array.from({ length: 12 }, (_, i) =>
          <span key={i} data-material={i % 3} data-blocked={i % 3 === 3 - Math.floor(i / 3) + step} />)}
      </div>
    </div>
    {action && elapsed - action.at < 350 && <div key={action.at} className="asr-foot-ring"
      style={numberStyle('--asr-noise-size', `${25 + PASSAGE_COST[action.index] * 24}px`)} aria-hidden="true" />}
    <div className="asr-passage-map">
      <span>{l('足音', 'Noise', 'あしおと')} {clear ? noise + PASSAGE_COST[action?.index ?? 0] : noise}/3</span>
      <span>{clear ? 3 : step}/3</span>
    </div>
    <div className="asr-passage-lanes">
      {materials.map((name, i) => <span key={name} data-blocked={i === step && !clear}
        data-chosen={i === action?.index && Boolean(outcome)}>
        {i === step && !clear && <b aria-hidden="true">× </b>}{name} +{PASSAGE_COST[i]}
      </span>)}
    </div>
  </div>;
}

function ShelfEscape({ state: [left, right], outcome }: SceneProps) {
  return <div className="asr-escape" data-empty={!left && !right} data-open={outcome === 'clear'}>
    <div className="asr-passage-camera" aria-hidden="true">
      <div className="asr-passage-wall" /><div className="asr-passage-wall asr-passage-wall-right" />
      <div className="asr-passage-floor" />
      <div className="asr-passage-end"><Sprite name="door" /><Sprite name="ship-lantern" /></div>
    </div>
    <div className="asr-escape-shelf" aria-hidden="true">
      <Sprite name="bookcase" />
      <div className="asr-shelf-beam" style={numberStyle('--asr-angle', `${(right - left) * 10}deg`)}>
        <div>{Array.from({ length: left }, (_, i) => <Sprite key={i} name="books" />)}</div>
        <Sprite name="key" />
        <div>{Array.from({ length: right }, (_, i) => <Sprite key={i} name="books" />)}</div>
      </div>
    </div>
  </div>;
}

function Toast({ state, outcome, action, elapsed, actor }: SceneProps) {
  const served = outcome === 'clear';
  return <div className="asr-toast" data-side={state[2]} data-served={served}
    data-burnt={outcome === 'mistake' && (action?.index !== 1 || action.at !== elapsed)}>
    <div className="asr-toast-faces">
      {state.slice(0, 2).map((heat, i) => <div key={i} data-active={!served && i === state[2]}
        data-ready={heat >= TOAST_READY}>
        <Sprite name="toast" />
        <i style={numberStyle('--asr-toast-heat', clamp(heat / TOAST_BURNT))} />
        <span>{['A', 'B'][i]} · {heat >= TOAST_READY ? '✓' : `${Math.floor(heat / 10)}%`}</span>
      </div>)}
    </div>
    <div className="asr-toast-cook">{actor}</div>
    <Sprite className="asr-toast-pan" name="pan" /><Sprite className="asr-toast-plate" name="plate" />
    <Sprite className="asr-toast-main" name="toast" />
  </div>;
}

function Cylinders({ state, action, elapsed, outcome }: SceneProps) {
  const level = outcome === 'clear' ? [4, CYLINDER_CAPACITY[1]] : state;
  return <div className="asr-cylinders" data-pour={action?.index === 2 && (outcome === 'clear' || elapsed - action.at < 280)}>
    {CYLINDER_CAPACITY.map((capacity, i) => <div className="asr-cylinder" key={capacity}>
      <b>{['A', 'B'][i]} · {level[i]}/{capacity}</b>
      <div className="asr-cylinder-glass" style={{ '--asr-liquid': `${level[i] / capacity * 100}%`, '--asr-ticks': capacity } as CSSProperties}>
        <div className="asr-cylinder-liquid" />
        {Array.from({ length: capacity }, (_, j) => <span key={j} data-goal={j === 3}>{j + 1}</span>)}
      </div>
    </div>)}
    <Sprite name="splash" className="asr-cylinder-splash" />
  </div>;
}

function Rope({ state: [step], elapsed, action, outcome, actor }: SceneProps) {
  const arrival = ROPE_FIRST + step * ROPE_INTERVAL;
  const approaching = arrival - elapsed;
  const moving = action && elapsed - action.at < 320;
  const contact = Math.abs(approaching) <= ROPE_MARGIN;
  const ropeX = clamp(31 + approaching / 17, 0, 106);
  return <div className="asr-rope" data-window={contact} data-pose={moving ? action.index === 0 ? 'jump' : 'duck' : 'run'}>
    <div className="asr-rope-floor" />
    <span className="asr-rope-contact" aria-hidden="true" />
    <div className="asr-rope-hero">{actor}</div>
    <Sprite name="rope" className="asr-rope-obstacle" />
    <div className="asr-rope-mover" data-high={step % 2 === 1} style={numberStyle('--asr-rope-x', `${ropeX}%`)} />
    {outcome && <i className="asr-rope-contact-mark" />}
  </div>;
}

function Glider({ state: [alt, trim, leg], outcome, action, actor }: SceneProps) {
  const altitude = outcome && action?.index === 2 ? alt + trim + GLIDER_WIND[leg] : alt;
  return <div className="asr-glider" data-leg={outcome === 'clear' ? 3 : leg}
    style={{ '--asr-alt': altitude, '--asr-trim': `${trim * -19}deg` } as CSSProperties}>
    <div className="asr-glider-runway" aria-hidden="true" />
    <div className="asr-glider-hoops" aria-hidden="true"><i /><i /><i /></div>
    <span className="asr-glider-wind">{GLIDER_WIND[leg] > 0 ? '↑ +' : '↓ −'}{Math.abs(GLIDER_WIND[leg])}</span>
    <div className="asr-glider-pilot">{actor}<Sprite name="glider" /></div>
    <div className="asr-glider-alt"><span>{GLIDER_ALTITUDE.join('–')}</span><b>{altitude}</b></div>
  </div>;
}

function Ensemble({ state, elapsed, action }: SceneProps) {
  const beat = Math.min(ENSEMBLE_BEATS.length - 1, Math.floor(elapsed / ENSEMBLE_BEAT_MS));
  const lit = state[1] === beat + 1 || (action?.at === elapsed && action.index === ENSEMBLE_BEATS[beat]);
  return <div className="asr-ensemble">
    <div className="asr-ensemble-players" aria-hidden="true">
      {['A', 'B', 'C'].map((part, i) => <div key={part} data-cue={i === ENSEMBLE_BEATS[beat]}
        data-played={i === action?.index && lit}>
        <Sprite name={i === 1 ? 'podium' : i === 0 ? 'mic' : 'bell'} /><b>{part}</b>
      </div>)}
    </div>
    <div className="asr-ensemble-score" aria-hidden="true">
      {ENSEMBLE_BEATS.map((part, i) =>
        <span key={i} data-current={i === beat} data-past={i < beat}>{['A', 'B', 'C'][part] ?? '𝄽'}</span>)}
    </div>
  </div>;
}

function Festival({ state, outcome, scene }: SceneProps) {
  const ringing = Boolean(scene.zone && scene.marker !== undefined && scene.marker >= scene.zone[0] && scene.marker <= scene.zone[1]);
  return <div className="asr-festival" data-ringing={ringing} data-all={outcome === 'clear'} aria-hidden="true">
    <div className="asr-festival-kiosks"><Sprite name="kiosk" /><Sprite name="bell" /><Sprite name="kiosk" /></div>
    <div className="asr-festival-lanterns">
      {['R ◆', 'B ●', 'G ▲'].map((label, i) => <div key={label} data-color={i} data-lit={Boolean(state[0] & (1 << i))}
        data-next={FESTIVAL_ORDER[state[1]] === i}><Sprite name="lantern" /><b>{label}</b></div>)}
    </div>
  </div>;
}

function Mimic({ state, elapsed, scene, action, outcome, mode }: SceneProps) {
  const threat = scene.props?.[0].mark;
  return <div className="asr-mimic" data-threat={threat} data-dodge={action?.index === 0 && elapsed - action.at < 420}
    data-clear={outcome === 'clear'}>
    <div className="asr-passage-camera" aria-hidden="true">
      <div className="asr-passage-wall" /><div className="asr-passage-wall asr-passage-wall-right" />
      <div className="asr-passage-floor" />
    </div>
    <div className="asr-mimic-shadow" aria-hidden="true" />
    <Sprite name="mimic" className="asr-mimic-enemy" />
    <Sprite name="bell" className="asr-mimic-bell" />
    <div className="asr-set-hint">{scene.props?.[1].text && gameText(mode, scene.props[1].text)}</div>
    <div className="asr-mimic-wins">{[0, 1, 2].map(i =>
      <Sprite key={i} name="crystal" className={state[0] > i || outcome === 'clear' ? 'asr-win-lit' : ''} />)}</div>
  </div>;
}

function Blackboard({ state, outcome }: SceneProps) {
  return <div className="asr-board-machine" data-clear={outcome === 'clear'} aria-hidden="true">
    <Sprite name="board" />
    <div className="asr-board-slots">
      <span>{state[0] ?? '□'}</span><i>×</i><span>{state[1] ?? '□'}</span>
      <i>+</i><span>{state[2] ?? '□'}</span><i>= 13</i>
    </div>
  </div>;
}

function Kitchen({ state, elapsed }: SceneProps) {
  const order = state.findIndex(finish => finish > elapsed);
  const food = ['egg', 'drumstick', 'orange'] as const;
  return <div className="asr-kitchen" aria-hidden="true">
    <div className="asr-kitchen-orders">
      {state.map((finish, i) => <div key={i} data-ready={finish > 0 && finish <= elapsed} data-current={order === i}>
        <Sprite name={food[i]} /><b>{finish ? finish <= elapsed ? '✓' : `${Math.ceil((finish - elapsed) / 1000)}s` : '—'}</b>
        <small>{['0–5s', '0–7s', '4–8s'][i]}</small>
      </div>)}
    </div>
    <div className="asr-kitchen-oven" data-active={order >= 0}>
      <Sprite name="pan" />{order >= 0 && <Sprite name={food[order]} className="asr-kitchen-food" />}
    </div>
  </div>;
}

function WindGarden({ state, scene, outcome, actor }: SceneProps) {
  const planted = [0, 2, 1].slice(0, outcome === 'clear' ? 3 : state[1]);
  const direction = scene.props?.[1].text?.[0];
  return <div className="asr-wind-garden" aria-hidden="true">
    <div className="asr-lane-deck" />
    <div className="asr-wind-garden-pots">{[0, 1, 2].map(i => <div key={i}
      data-ready={planted.includes(i)} data-cue={[0, 2, 1][state[1]] === i && outcome !== 'clear'}>
      <Sprite name={planted.includes(i) ? 'raspberry' : 'vase'} />
    </div>)}</div>
    <div className="asr-lane-actor" data-anchored={state[2] > 0} style={numberStyle('--asr-lane', state[0])}>
      {actor}<Sprite name="egg" /><b>{state[2] ? '⊓' : direction}</b>
    </div>
  </div>;
}

function VanishingIndex({ scene, action, mode }: SceneProps) {
  return <div className="asr-index-room" aria-hidden="true">
    <div className="asr-passage-wall" /><div className="asr-passage-wall asr-passage-wall-right" />
    <div className="asr-set-hint">{scene.props?.[0].text && gameText(mode, scene.props[0].text)}</div>
    <div className="asr-index-shelves">{scene.buttons.map((button, i) =>
      <div key={i} data-glowing={button.mark === 'good'} data-checked={action?.index === i}>
        <Sprite name="bookcase" /><b>{i + 1}</b>
      </div>)}</div>
  </div>;
}

function RunawayCircuit({ state, outcome }: SceneProps) {
  const disconnected = outcome === 'clear' ? 3 : state[0];
  return <div className="asr-circuit-board" aria-hidden="true">
    <div className="asr-set-hint">{Math.round(state[1])}V</div>
    <div className="asr-circuit-lines">{[0, 1, 2].map(i => <div key={i}
      data-disconnected={disconnected > i} data-live={disconnected === i} data-high={state[1] > 70}>
      <Sprite name="crystal" /><i /><b>{disconnected > i ? '×' : i + 1}</b>
    </div>)}</div>
  </div>;
}

function Tournament({ state, elapsed, scene, action, outcome, actor }: SceneProps) {
  const target = Number(scene.props?.[1].text?.[0]) - 1;
  const shot = action?.index === 2 && elapsed - action.at < 350;
  return <div className="asr-tournament" aria-hidden="true">
    <div className="asr-lane-deck" />
    <div className="asr-tournament-target" style={numberStyle('--asr-lane', target)}>
      <Sprite name={state[2] ? 'target' : 'shield'} /><b>{target + 1}</b>
    </div>
    <div className="asr-lane-actor" data-shot={shot} style={numberStyle('--asr-lane', state[0])}>{actor}<Sprite name="volleyball" /></div>
    <div className="asr-mimic-wins">{[0, 1, 2].map(i =>
      <Sprite key={i} name="target" className={state[1] > i || outcome === 'clear' ? 'asr-win-lit' : ''} />)}</div>
  </div>;
}

function StormVane({ state, scene, outcome, actor }: SceneProps) {
  const fixed = [2, 0, 1].slice(0, state[0]);
  return <div className="asr-storm" data-gust={scene.props?.[0].mark === 'hot'} data-clear={outcome === 'clear'} aria-hidden="true">
    <div className="asr-lane-deck" />
    <div className="asr-storm-mast"><Sprite name="windsock" /></div>
    <div className="asr-storm-ropes">{[0, 1, 2].map(i => <div key={i}
      data-fixed={fixed.includes(i)} data-cue={[2, 0, 1][state[0]] === i}>
      <i /><Sprite name="hook" />
    </div>)}</div>
    <div className="asr-lane-actor" style={numberStyle('--asr-lane', state[1])}>{actor}</div>
  </div>;
}

export const SET_PIECES: Readonly<Partial<Record<string, (props: SceneProps) => React.JSX.Element>>> = {
  'gate/quiet-zone': Passage,
  'gate/mimic-gate': Mimic,
  'classroom/blackboard-cipher': Blackboard,
  'store/last-call': Kitchen,
  'yard/whirlwind-crossing': WindGarden,
  'library/vanishing-index': VanishingIndex,
  'lab/runaway-circuit': RunawayCircuit,
  'gym/three-lane-tournament': Tournament,
  'roof/storm-vane': StormVane,
  'store/toast-flip': Toast,
  'library/hidden-shelf': ShelfEscape,
  'lab/water-divider': Cylinders,
  'yard/jump-rope-gap': Rope,
  'roof/launch-glider': Glider,
  'music/fading-ensemble': Ensemble,
  'festival/festival-lighting': Festival,
};
