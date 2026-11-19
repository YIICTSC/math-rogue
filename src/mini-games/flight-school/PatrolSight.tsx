import React from 'react';
import { Crosshair } from 'lucide-react';
import { aircraftScreen, shielded, underSight, type Sortie } from './combat';
export function PatrolSight({ s }: { s: Sortie }) {
  const position = (x: number, y: number) => ({
    left: (1 + x) * 50 + '%',
    top: (1 - y) * 50 + '%',
  });
  return (
    <>
      {' '}
      {s.targets
        .filter((o) => o.hp > 0)
        .map((o) => (
          <span
            key={o.id}
            className={'fs-contact' + (shielded(s, o) ? ' protected' : '')}
            style={position(o.x, o.y)}
          >
            {shielded(s, o) ? '◇ ' : ''}
            {o.hp}
          </span>
        ))}
      {s.warnings.map((w, i) => (
        <i
          key={i}
          className="fs-danger"
          style={{
            ...position(aircraftScreen(w.x, w.y).x, aircraftScreen(w.x, w.y).y),
            opacity: Math.min(1, 1.7 - w.life * 0.5),
          }}
        />
      ))}
      <Crosshair
        className={
          'fs-sight' +
          (s.targets.some((o) => o.hp > 0 && !shielded(s, o) && underSight(s, o)) ? ' locked' : '')
        }
        style={position(s.x, s.y)}
      />
    </>
  );
}
