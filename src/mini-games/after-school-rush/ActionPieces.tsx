import type { CSSProperties } from 'react';
import { Sprite } from './art';
import { gameText } from './copy';
import { clamp } from './originals/model';
import type { SceneProps } from './SetPieces';

const css = (values: Record<`--${string}`, number | string>) => values as CSSProperties;

function Balance({ state, outcome }: SceneProps) {
  const lean = clamp((state[2] + state[3] - state[0] - state[1]) * 7, -24, 24);
  return <div className="asr-scale-piece" data-clear={outcome === 'clear'}>
    <div className="asr-scale-post" /><div className="asr-scale-arm" style={css({ '--asr-lean': outcome === 'clear' ? '0deg' : `${lean}deg` })}>
      {state.map((value, i) => <div key={i}><Sprite name="box" /><b>{value}</b></div>)}
    </div>
  </div>;
}

function Umbrellas({ state, outcome, action }: SceneProps) {
  return <div className="asr-umbrella-rack">{state.map((value, i) => <div key={i}
    data-up={Boolean(value) || outcome === 'clear'} data-chosen={action?.index === i}>
    <Sprite name="umbrella" /><b>{value || outcome === 'clear' ? '↑' : '↓'}</b>
  </div>)}</div>;
}

function Chalk({ state, outcome }: SceneProps) {
  return <div className="asr-chalk-pieces">
    {(outcome === 'clear' ? [3, 4] : state).map((count, i) => <div key={i} data-units={i === 1}>
      <b>{i === 0 ? 10 : 1} × {count}</b>
      <span>{Array.from({ length: count }, (_, j) => <i key={j} />)}</span>
    </div>)}
  </div>;
}

function MirrorChalk({ outcome }: SceneProps) {
  return <div className="asr-mirror-chalk">
    <div>← ○ △ →</div><Sprite name="mirror" /><div>{outcome ? '← △ ○ →' : '· · · ·'}</div>
  </div>;
}

function PaperFractions({ state, outcome }: SceneProps) {
  const cut = outcome === 'clear' ? 6 : state[0];
  return <div className="asr-paper-fractions">
    <div>{Array.from({ length: 8 }, (_, i) => <i key={i} data-cut={i < cut} data-next={i === cut && !outcome} />)}</div>
    <b>{cut}/8 · ¾</b>
  </div>;
}

function Conveyor({ state, scene, elapsed, action, outcome }: SceneProps) {
  const art = scene.props?.[0].art ?? 'raspberry';
  const position = clamp((elapsed - state[0] * 1280) / 1800);
  const routing = action && elapsed - action.at < 300;
  return <div className="asr-belt" data-route={routing ? action.index : undefined} data-clear={outcome === 'clear'}
    style={css({ '--asr-conveyor-x': `${10 + position * 72}%` })}>
    <div className="asr-belt-rail" /><div className="asr-belt-junction" />
    <div className="asr-belt-destination"><span>❄</span><span>▤</span></div>
    <Sprite name={art} />
  </div>;
}

function Temperature({ state, scene, outcome }: SceneProps) {
  return <div className="asr-temperature" data-hot={scene.props?.[0].mark === 'hot'} data-result={outcome}
    style={css({ '--asr-temp': `${clamp(scene.marker ?? 0) * 100}%` })}>
    <Sprite name={scene.zone?.[0] === .37 ? 'egg' : 'flask'} />
    <div className="asr-thermo"><i /><b>{Math.round(state[0])}°</b></div>
  </div>;
}

function Juice({ state, scene, outcome }: SceneProps) {
  const pressed = outcome === 'clear' ? 3 : state[0];
  return <div className="asr-juice" data-seeds={scene.props?.[0].mark === 'warn'}>
    <div><Sprite name="orange" /><b>{scene.props?.[0].mark === 'warn' ? '• • •' : '◉'}</b></div>
    <span>{Array.from({ length: 3 }, (_, i) => <i key={i} data-filled={pressed > i} />)}</span>
  </div>;
}

function Crosswind({ state, scene, actor }: SceneProps) {
  return <div className="asr-crosswind" data-side={scene.props?.[1].text?.[0] === '←' ? 'left' : 'right'}>
    <div className="asr-lane-deck" /><Sprite name="windsock" />
    <div className="asr-lane-actor" style={css({ '--asr-lane': state[0] })}>{actor}</div>
    <b>{scene.props?.[1].text?.[0]}</b>
  </div>;
}

function Puddle({ state, action, outcome }: SceneProps) {
  const jump = state[0] * 2;
  return <div className="asr-puddle" data-jump={action?.index === 1 && outcome} style={css({ '--asr-jump': `${jump * 7}%` })}>
    <div className="asr-puddle-water" /><div className="asr-puddle-goal" /><div className="asr-puddle-arc" />
    <Sprite name="sneaker" /><b>{jump} / 5 &lt; d ≤ 7</b>
  </div>;
}

function Kite({ state, scene, outcome }: SceneProps) {
  return <div className="asr-kite" data-gust={scene.props?.[0].mark === 'hot'} data-snapped={outcome === 'mistake'}
    style={css({ '--asr-kite-lean': `${(clamp(state[0] / 100) - .5) * 56}deg` })}>
    <div><i /><Sprite name="glider" /></div><Sprite name="windsock" />
  </div>;
}

function ShelfCipher({ scene, outcome, action }: SceneProps) {
  return <div className="asr-book-line">
    {['2', '4', '8', outcome && action ? scene.buttons[action.index].text?.[0] : '?', '32'].map((text, i) =>
      <b key={i} data-gap={i === 3} data-result={i === 3 ? outcome : undefined}>{text}</b>)}
  </div>;
}

function BookBalance({ state, action, outcome }: SceneProps) {
  return <div className="asr-book-towers">
    {state.map((v, i) => <div key={i}>{Array.from({ length: v - Number(outcome === 'clear' && action?.index === i) }, (_, j) =>
      <Sprite key={j} name="books" />)}</div>)}
  </div>;
}

function Bubble({ state, scene, outcome }: SceneProps) {
  const size = .4 + clamp(scene.meter ?? 0) * .85;
  return <div className="asr-bubble" data-shut={outcome === 'clear'} data-popped={outcome === 'mistake'} style={css({ '--asr-bubble-size': size })}>
    <div className="asr-bubble-container"><i /><Sprite name="slime" /></div>
    <b>{outcome === 'clear' ? 3 : state[0]}/3</b>
  </div>;
}

function TrianglePass({ state, action, outcome }: SceneProps) {
  const ball = outcome === 'clear' ? 1 : [0, 2, 0][state[0]];
  const blocked = [1, 1, 2][state[0]];
  return <div className="asr-pass-court">
    <div className="asr-pass-lines" />
    {['A', 'B', 'C'].map((label, i) => <div key={label} data-ball={ball === i}
      data-defense={blocked === i} data-hit={action?.index === i}>
      <b>{label}</b>{ball === i && <Sprite name="volleyball" />}{blocked === i && <Sprite name="shield" />}
    </div>)}
  </div>;
}

function Curl({ state, action, outcome }: SceneProps) {
  const nextSpeed = outcome && action ? Math.max(0, state[1] + (action.index ? -1 : 1)) : 0;
  const x = clamp((state[0] + nextSpeed) / 9);
  return <div className="asr-curl" style={css({ '--asr-curl-x': `${10 + x * 80}%`, '--asr-curl-speed': state[1] })}>
    <div className="asr-curl-course"><i /></div><Sprite name="splash" /><b>{state[1]} V</b>
  </div>;
}

function Pitch({ state, outcome }: SceneProps) {
  return <div className="asr-pitch" data-result={outcome}>
    {state.map((height, i) => <div key={i} style={css({ '--asr-pitch-shift': `${clamp(height, -4, 4) * -10}px` })}>
      <b>{['A', 'G'][i]} {height}</b><Sprite name="bell" />
    </div>)}
  </div>;
}

function Stereo({ state, outcome }: SceneProps) {
  return <div className="asr-stereo">{(outcome === 'clear' ? [2, 4] : state).map((value, i) => <div key={i}>
    <Sprite name="dial" /><b>{['L', 'R'][i]} {value}</b>
    <div>{Array.from({ length: 6 }, (_, j) => <i key={j} data-filled={j < value} />)}</div>
  </div>)}</div>;
}

function Pendulum({ scene }: SceneProps) {
  return <div className="asr-pendulum" style={css({ '--asr-pendulum-angle': `${((scene.marker ?? .5) - .5) * 78}deg` })}>
    <div><i /><Sprite name="bell" /></div>
  </div>;
}

function WaterTank({ state, scene }: SceneProps) {
  const leak = scene.props?.[1].text?.[0]?.slice(-1);
  return <div className="asr-tank" style={css({ '--asr-tank-level': `${clamp(state[0] / 100) * 100}%` })}>
    <div className="asr-tank-pipe"><span>{state[1] + 1}</span><span>{leak}</span></div>
    <div className="asr-tank-glass"><i /><b>{Math.round(state[0])}%</b></div>
  </div>;
}

function Vent({ state, scene }: SceneProps) {
  return <div className="asr-vent" data-open={state[0] === 1} data-out={scene.props?.[0].mark === 'cool'}>
    <div className="asr-vent-duct"><i /><i /><i /></div>
    <b>{scene.props?.[0].mark === 'cool' ? '→ → →' : '← ← ←'}</b><Sprite name="wind" />
  </div>;
}

function Lanterns({ state, outcome }: SceneProps) {
  return <div className="asr-lantern-chain">{[0, 1, 2, 3, 4].map(i => <div key={i} data-lit={state.includes(i) || outcome === 'clear'}>
    <Sprite name="lantern" /><b>{i + 1}</b>
  </div>)}</div>;
}

function ColorMix({ state, outcome }: SceneProps) {
  return <div className="asr-color-mix">
    {(outcome === 'clear' ? [1, 1, 0] : state).map((lit, i) => <div key={i} data-lit={lit > 0}><b>{['R ◆', 'G ●', 'B ▲'][i]}</b><i /></div>)}
  </div>;
}

function StageCue({ state, outcome, mode, scene }: SceneProps) {
  const step = outcome === 'clear' ? 3 : state[0];
  const next = scene.buttons[[2, 1, 0][step]]?.text;
  return <div className="asr-stage-cue" data-curtain={step >= 1} data-light={step >= 2} data-enter={step >= 3}>
    <div className="asr-stage-spot" /><Sprite name="podium" /><Sprite name="mic" />
    <div className="asr-stage-curtain"><i /><i /></div>
    {next && <span>{gameText(mode, next)}</span>}
  </div>;
}

export const ACTION_PIECES: Readonly<Partial<Record<string, (props: SceneProps) => React.JSX.Element>>> = {
  'gate/counterweight': Balance,
  'gate/umbrella-flip': Umbrellas,
  'classroom/chalk-borrow': Chalk,
  'classroom/mirror-letter': MirrorChalk,
  'classroom/fraction-tear': PaperFractions,
  'store/conveyor-divert': Conveyor,
  'store/hot-cold-order': Temperature,
  'store/lemon-squeeze': Juice,
  'yard/crosswind-lap': Crosswind,
  'yard/puddle-skip': Puddle,
  'yard/kite-tension': Kite,
  'library/shelf-cipher': ShelfCipher,
  'library/bookend-balance': BookBalance,
  'lab/thermostat': Temperature,
  'lab/gas-bubble': Bubble,
  'gym/passing-triangle': TrianglePass,
  'gym/floor-curl': Curl,
  'music/pitch-bend': Pitch,
  'music/stereo-balance': Stereo,
  'music/metronome-swing': Pendulum,
  'roof/water-tank': WaterTank,
  'roof/vent-fan': Vent,
  'festival/lantern-circuit': Lanterns,
  'festival/final-light-mix': ColorMix,
  'festival/stage-cue': StageCue,
};
