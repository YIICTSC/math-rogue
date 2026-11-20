import type { Mission } from './combat';
import type { Lesson } from './courses';
import { ADVANCED_ROUTES, ROUTES, makeRouteLesson, surfaceHeight } from './routes';

export const ADVANCED_MISSIONS: Mission[] = [
  {
    id: 'deck',
    required: 2,
    region: 'kix-ukb',
    name: ['大阪湾・海上発艦', 'Osaka Bay deck launch', 'おおさかわん・かいじょうはっかん'],
    brief: [
      '洋上の飛行甲板を離れ、僚機と神戸へ。',
      'Launch from the offshore deck and join your wingmate on the way to Kobe.',
      'こうはんから とびたち、りょうきと こうべへ。',
    ],
    waves: [
      ['drone', 'drone'],
      ['ace', 'drone'],
    ],
    seconds: 80,
  },
  {
    id: 'valley',
    required: 4,
    region: 'mmj-toy',
    name: ['峰間のリレー', 'Valley relay', 'みねまの リレー'],
    brief: [
      '谷の航点を縫い、移動する編隊と飛びながら競う。',
      'Thread the valley gates and engage moving formations along the course.',
      'たにの こうてんを ぬい、へんたいを おいかけよう。',
    ],
    waves: [
      ['drone', 'ace'],
      ['relay', 'drone'],
      ['ace', 'ace'],
    ],
    seconds: 100,
  },
  {
    id: 'ceiling',
    required: 6,
    region: 'hnd-kix',
    name: ['成層圏ランデブー', 'Stratosphere rendezvous', 'せいそうけん ランデブー'],
    brief: [
      '高度12,000 mの合流点を通り、東海道上空で僚機と編隊戦。',
      'Climb to the 12,000 m rendezvous for a formation chase above the Tokaido.',
      'こうど いちまんにせん メートルで ごうりゅう。りょうきと へんたいせんへ。',
    ],
    waves: [
      ['ace', 'ace'],
      ['drone', 'ace', 'drone'],
      ['ace', 'relay', 'ace'],
    ],
    seconds: 115,
  },
];
export function advancedLesson(mission: Mission, assist: boolean): Lesson {
  const chart = [...ROUTES, ...ADVANCED_ROUTES].find((r) => r.key === mission.region)!;
  const lesson = makeRouteLesson(chart, false, assist),
    r = lesson.route!;
  const gates = lesson.gates;
  if (mission.id === 'deck') {
    // A separate floating strip west of the island airport, on Osaka Bay.
    const x = r.from.x - 4500,
      z = r.from.z;
    const ux = 0,
      uz = -1,
      length = 270,
      elevation = 12;
    r.from = {
      ...r.from,
      x,
      z,
      ux,
      uz,
      length,
      elevation,
      width: 46,
      ends: [
        [x, z],
        [x, z - length],
      ],
    };
    lesson.start = { x, z: z - 22, y: elevation };
    lesson.carrier = true;
    gates[0] = { x, z: z - 1100, y: 170, radius: 420 };
  } else if (mission.id === 'ceiling') {
    for (const gate of gates.slice(1, -1)) {
      const climb = Math.hypot(gate.x - lesson.start.x, gate.z - lesson.start.z) * 0.14;
      const descent = Math.hypot(gate.x - lesson.target.x, gate.z - lesson.target.z) * 0.12;
      gate.y = Math.max(gate.y, Math.min(12000, climb, descent));
    }
  } else {
    // Select lower saddles along cross-sections of the actual DEM.
    const dx = r.to.x - r.from.x,
      dz = r.to.z - r.from.z,
      len = Math.hypot(dx, dz);
    for (const g of gates.slice(2, -2)) {
      const candidates = [-3500, -1750, 0, 1750, 3500].map((d) => {
        const x = g.x + (dz * d) / len,
          z = g.z - (dx * d) / len;
        return { x, z, y: surfaceHeight(r, x, z) + 330 };
      });
      Object.assign(
        g,
        candidates.reduce((a, b) => (a.y < b.y ? a : b)),
      );
    }
    // Sample between gates too, so a turn cannot send the assist through a ridge.
    for (let i = 1; i < gates.length - 2; i++) {
      const a = gates[i],
        b = gates[i + 1];
      let safe = 0;
      for (let k = 0; k <= 20; k++)
        safe = Math.max(
          safe,
          surfaceHeight(r, a.x + ((b.x - a.x) * k) / 20, a.z + ((b.z - a.z) * k) / 20) + 240,
        );
      a.y = Math.max(a.y, safe);
      b.y = Math.max(b.y, safe);
    }
  }
  return lesson;
}
