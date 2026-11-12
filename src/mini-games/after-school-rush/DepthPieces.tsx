import type { CSSProperties } from 'react';
import { Sprite } from './art';
import { clamp } from './originals/model';
import type { SceneProps } from './SetPieces';

function Forklight({ state, scene, outcome, action, actor }: SceneProps) {
  const arrow = scene.props?.[0].text?.[0];
  const turn = outcome === 'clear' ? 4 : state[0];
  return <div className="asr-forklight" style={{ '--asr-turn': turn, '--asr-lane': action?.index ?? 1 } as CSSProperties}>
    <div className="asr-lane-deck" />
    <div className="asr-fork-sign"><Sprite name="sign" /><b>{outcome === 'clear' ? '✓' : arrow}</b></div>
    <div className="asr-lane-actor">{actor}</div>
  </div>;
}

function Turnstile({ scene }: SceneProps) {
  return <div className="asr-depth-turnstile">
    <div className="asr-depth-rotor">
      {scene.buttons.map((button, i) => <div key={i} data-open={button.mark === 'good'}
        style={{ '--asr-facing': `${i * 90}deg` } as CSSProperties}><span /></div>)}
      <Sprite name="hook" />
    </div>
  </div>;
}

function Seating({ state, action, outcome }: SceneProps) {
  const seats = outcome === 'clear' ? [2, 0, 0, 1] : state;
  return <div className="asr-depth-seating">
    <div className="asr-seat-row">{seats.map((person, i) => <div key={i} data-chosen={action?.index === i}>
      <Sprite name="desk" /><b data-occupied={person > 0}>{['·', 'A', 'B'][person]}</b>
    </div>)}</div>
  </div>;
}

function Slalom({ state, outcome, action, actor }: SceneProps) {
  const blocked = (state[0] % 2) * 2;
  const lane = outcome === 'clear' ? action?.index ?? state[1] : state[1];
  return <div className="asr-depth-slalom" data-clear={outcome === 'clear'}>
    <div className="asr-lane-deck" />
    <div className="asr-depth-obstacle" style={{ '--asr-lane': blocked } as CSSProperties}><Sprite name="cone" /></div>
    <div className="asr-lane-actor" style={{ '--asr-lane': lane } as CSSProperties}>{actor}</div>
  </div>;
}

function Librarian({ scene, state, outcome }: SceneProps) {
  const watching = scene.props?.[0].mark === 'warn';
  const taken = outcome === 'clear' ? 2 : state[0];
  return <div className="asr-depth-librarian" data-watching={watching}>
    <div className="asr-librarian-shelf"><Sprite name="bookcase" /><Sprite name="bookcase" /></div>
    <div className="asr-librarian-look"><Sprite name="ghost-cat" /></div>
    <div className="asr-librarian-books">
      {[0, 1].map(i => <Sprite key={i} name={i < taken ? 'satchel' : 'notebook'} />)}
    </div>
  </div>;
}

function Focus({ scene }: SceneProps) {
  const marker = scene.marker ?? .5;
  const size = 12 + Math.abs(marker - .5) * 140;
  return <div className="asr-depth-focus" style={{ '--asr-lens': `${12 + marker * 56}%`, '--asr-projection': `${size}px` } as CSSProperties}>
    <Sprite name="ship-lantern" /><div className="asr-light-beam" /><div className="asr-optical-lens" /><div className="asr-optical-image" />
  </div>;
}

function Mirror({ action, outcome }: SceneProps) {
  const rotations = [-45, 45, 0, 90];
  return <div className="asr-depth-mirror" data-reflect={outcome && (outcome === 'clear' ? 'up' : 'wrong')}
    style={{ '--asr-mirror-angle': `${rotations[action?.index ?? 2]}deg` } as CSSProperties}>
    <div className="asr-light-beam" /><div className="asr-optical-lens" /><div className="asr-mirror-exit">↑</div>
    <div className="asr-mirror-reflection" />
  </div>;
}

function Serve({ scene, action, outcome }: SceneProps) {
  const marker = scene.marker ?? 0;
  return <div className="asr-depth-serve" data-shot={action && outcome} style={{ '--asr-aim': `${(marker - .5) * 73}deg` } as CSSProperties}>
    <div className="asr-lane-deck" />
    <div className="asr-serve-landing" /><div className="asr-serve-aim" />
    <Sprite name="volleyball" />
  </div>;
}

function Rebound({ state, elapsed, actor }: SceneProps) {
  const flight = clamp((elapsed - state[1] * 1450) / 1450);
  const side = state[1] % 2 === 0 ? 1 : -1;
  const lane = 1 + side * (flight < .5 ? -2 * flight : 4 * flight - 3);
  return <div className="asr-depth-rebound">
    <div className="asr-lane-deck" />
    <div className="asr-depth-obstacle" style={{ '--asr-lane': lane, '--asr-fall': `${flight * 57}%` } as CSSProperties}><Sprite name="volleyball" /></div>
    <div className="asr-lane-actor" style={{ '--asr-lane': state[0] } as CSSProperties}>{actor}</div>
  </div>;
}

function Hoop({ scene, outcome }: SceneProps) {
  const face = scene.props?.[0].text?.[0];
  return <div className="asr-depth-hoop" data-forward={face === '○'} data-shot={outcome}
    style={{ '--asr-hoop-angle': face === '○' ? '0deg' : face === '|' ? '83deg' : '45deg' } as CSSProperties}>
    <div className="asr-lane-deck" /><Sprite name="hoop" /><Sprite name="volleyball" />
  </div>;
}

function Vane({ scene, elapsed, outcome }: SceneProps) {
  const compass = scene.props?.[0].text?.[0] ?? 'N';
  return <div className="asr-depth-vane" data-ready={elapsed >= 1720 && compass === 'N'} data-clear={outcome === 'clear'}>
    <div className="asr-compass">
      {['N', 'E', 'S', 'W'].map(d => <b key={d}>{d}</b>)}
      <i style={{ '--asr-compass-angle': `${'NESW'.indexOf(compass) * 90}deg` } as CSSProperties} />
    </div>
    <Sprite name="windsock" />
  </div>;
}

function Antenna({ state, outcome }: SceneProps) {
  let high = false;
  return <div className="asr-depth-antenna" data-sent={outcome}>
    <div className="asr-lane-deck" />
    <div className="asr-antenna-nodes"><span><Sprite name="dial" /><b>TX</b></span>
      {['↗', '▲', 'RX'].map((name, i) => {
        const battery = Boolean(state[0] & (1 << i));
        high = high !== battery;
        return <span key={name} data-high={high} data-battery={battery}><b>{name}</b>{battery && <i>▰</i>}</span>;
      })}
    </div>
  </div>;
}

function Tether({ state, outcome }: SceneProps) {
  return <div className="asr-depth-tether" data-clear={outcome === 'clear'} data-danger={state[0] >= 6}
    style={{ '--asr-rope-length': `${clamp(state[0] / 7) * 80}%` } as CSSProperties}>
    <div className="asr-lane-deck" /><i />
    <span className="asr-tether-anchor">0</span><span className="asr-tether-tool"><Sprite name="hook" />4</span>
    <span className="asr-tether-edge">6</span>
  </div>;
}

function Shadow({ scene, outcome }: SceneProps) {
  const marker = scene.marker ?? 0;
  const inShade = scene.props?.[0].mark === 'muted';
  return <div className="asr-depth-shadow" data-shaded={inShade} data-photo={outcome}
    style={{ '--asr-cloud': `${10 + marker * 100}%` } as CSSProperties}>
    <div className="asr-photo-frame" /><i /><Sprite name="windsock" />
  </div>;
}

function RotateSign({ action, outcome }: SceneProps) {
  return <div className="asr-depth-sign" data-turned={Boolean(action && outcome)}>
    <div className="asr-sign-card"><span>A B C</span><span>C B A</span></div>
    <Sprite name="sign" />
  </div>;
}

function CableWalk({ state, outcome }: SceneProps) {
  const at = outcome === 'clear' ? 0 : state[0];
  return <div className="asr-depth-walk" style={{ '--asr-walk': `${at * 60}deg` } as CSSProperties}>
    <div className="asr-walk-track">{Array.from({ length: 6 }, (_, i) =>
      <span key={i} data-blocked={i === 1 || i === 4} data-current={i === at}
        style={{ '--asr-node': `${i * 60}deg` } as CSSProperties}><b>{i + 1}</b></span>)}</div>
    <Sprite name="sneaker" />
  </div>;
}

function Windows({ scene, action, outcome }: SceneProps) {
  return <div className="asr-depth-windows">
    <div className="asr-window-wall">{scene.buttons.map((button, i) =>
      <div key={i} data-lit={button.mark === 'good'} data-hit={action?.index === i} data-clear={outcome === 'clear'}><b>{i + 1}</b></div>)}</div>
    <Sprite name="ship-lantern" />
  </div>;
}

function Booths({ state, outcome }: SceneProps) {
  return <div className="asr-depth-booths" data-place={outcome === 'clear' ? 3 : state[0]}>
    <div className="asr-lane-deck" />
    <div className="asr-booth-gate"><Sprite name="door" /></div>
    <div className="asr-booth-shop"><Sprite name="kiosk" /><Sprite name="orange" /></div>
    <div className="asr-booth-stage"><Sprite name="podium" /></div>
  </div>;
}

export const DEPTH_PIECES: Readonly<Partial<Record<string, (props: SceneProps) => React.JSX.Element>>> = {
  'gate/forklight': Forklight,
  'gate/turnstile': Turnstile,
  'classroom/seating-cross': Seating,
  'yard/cone-slalom': Slalom,
  'library/whisper-watch': Librarian,
  'lab/lens-focus': Focus,
  'lab/laser-reflect': Mirror,
  'gym/serve-angle': Serve,
  'gym/rebound-race': Rebound,
  'gym/basket-orbit': Hoop,
  'roof/weathervane-freeze': Vane,
  'roof/antenna-grid': Antenna,
  'roof/edge-tether': Tether,
  'roof/cloud-shade': Shadow,
  'roof/rotate-sign': RotateSign,
  'roof/string-walk': CableWalk,
  'roof/window-signal': Windows,
  'festival/booth-map': Booths,
};
