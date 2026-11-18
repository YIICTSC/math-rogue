import type { Gate, Lesson, Phrase, Point, Position } from './courses';
import { AIRPORTS } from './courses';
import { clamp } from './terrain';
import atlas from './route-atlas.json';

export const ROUTES = atlas;
export type Region = (typeof atlas)[number];
type Strip = Region['ports'][number];
export const PORT_NAMES: Record<string, Phrase> = {
  KIX: AIRPORTS[5].name,
  UKB: ['神戸', 'Kobe', 'こうべ'],
  HND: AIRPORTS[2].name,
  NRT: ['成田', 'Narita', 'なりた'],
  MMJ: AIRPORTS[3].name,
  TOY: ['富山', 'Toyama', 'とやま'],
  OKA: AIRPORTS[7].name,
  UEO: ['久米島', 'Kumejima', 'くめじま'],
};
export const ROUTE_SCENERY: Record<string, Phrase> = {
  'kix-ukb': [
    '大阪湾の海上空港',
    'The island airports of Osaka Bay',
    'おおさかわんの かいじょうくうこう',
  ],
  'hnd-nrt': [
    '東京湾から関東平野へ',
    'Tokyo Bay and the Kanto Plain',
    'とうきょうわんと かんとうへいや',
  ],
  'mmj-toy': ['北アルプス越え', 'Across the Northern Alps', 'きたアルプスごえ'],
  'oka-ueo': [
    '慶良間諸島と東シナ海',
    'Kerama Islands and the East China Sea',
    'けらましょとうと ひがしシナかい',
  ],
};
export const photo = (key: string) => 'sprites/flight-school/routes/' + key.toLowerCase() + '.webp';
export const center = (p: Strip): Point => ({
  x: (p.ends[0][0] + p.ends[1][0]) / 2,
  z: (p.ends[0][1] + p.ends[1][1]) / 2,
});
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);
export function orient(port: Strip, dx: number, dz: number) {
  const [a, b] = port.ends;
  const order = (b[0] - a[0]) * dx + (b[1] - a[1]) * dz >= 0 ? [a, b] : [b, a];
  const [first, last] = order,
    length = Math.hypot(last[0] - first[0], last[1] - first[1]);
  return {
    ...port,
    x: first[0],
    z: first[1],
    length,
    ux: (last[0] - first[0]) / length,
    uz: (last[1] - first[1]) / length,
  };
}
type Runway = ReturnType<typeof orient>;
export function runwayOffset(r: Runway, p: Point) {
  const dx = p.x - r.x,
    dz = p.z - r.z;
  return { along: dx * r.ux + dz * r.uz, cross: dx * r.uz - dz * r.ux };
}
export const onStrip = (r: Runway, p: Point) => {
  const { along, cross } = runwayOffset(r, p);
  return along >= 0 && along <= r.length && Math.abs(cross) <= r.width / 2;
};
export function createRoute(region: Region, reverse: boolean, assist: boolean) {
  const a = region.ports[reverse ? 1 : 0],
    b = region.ports[reverse ? 0 : 1];
  const start = center(a),
    end = center(b),
    dx = end.x - start.x,
    dz = end.z - start.z;
  const from = orient(a, dx, dz),
    to = orient(b, dx, dz);
  // Level the sampled DEM within each runway. Outside the airport, use the original heights.
  const grid = region.grid.map((height, i) => {
    const x = ((i % region.cols) / (region.cols - 1) - 0.5) * region.width;
    const z = (Math.floor(i / region.cols) / (region.rows - 1) - 0.5) * region.height;
    for (const strip of [from, to]) {
      const { along, cross } = runwayOffset(strip, { x, z });
      const d = Math.hypot(cross, Math.max(0, -along, along - strip.length));
      if (d < 1400)
        return strip.elevation + (height - strip.elevation) * clamp((d - 750) / 650, 0, 1);
    }
    return height;
  });
  return { region, from, to, assist, grid, distance: dist(start, end) };
}
export type Route = ReturnType<typeof createRoute>;
/** Matches the two triangles actually rendered inside each DEM cell. */
export function surfaceHeight(r: Route, x: number, z: number) {
  const { cols, rows, width, height } = r.region;
  const u = clamp(x / width + 0.5, 0, 1) * (cols - 1),
    v = clamp(z / height + 0.5, 0, 1) * (rows - 1);
  const c = Math.min(Math.floor(u), cols - 2),
    j = Math.min(Math.floor(v), rows - 2) * cols + c;
  const fx = u - c,
    fy = v - Math.floor(j / cols),
    g = r.grid;
  return fx + fy <= 1
    ? g[j] + fx * (g[j + 1] - g[j]) + fy * (g[j + cols] - g[j])
    : g[j + cols + 1] +
        (1 - fx) * (g[j + cols] - g[j + cols + 1]) +
        (1 - fy) * (g[j + 1] - g[j + cols + 1]);
}
function along(r: Runway, d: number): Position {
  return { x: r.x + r.ux * d, z: r.z + r.uz * d, y: r.elevation };
}
export function makeRouteLesson(region: Region, reverse: boolean, assist: boolean): Lesson {
  const route = createRoute(region, reverse, assist),
    { from, to } = route;
  const start = along(from, 70),
    target = along(to, Math.min(350, to.length * 0.2));
  const outbound = along(from, from.length + 800),
    approach = along(to, -3200);
  const gates: Gate[] = [];
  const legs = Math.ceil(dist(outbound, approach) / 7000);
  for (let i = 0; i <= legs; i++) {
    const t = i / legs,
      x = outbound.x + (approach.x - outbound.x) * t,
      z = outbound.z + (approach.z - outbound.z) * t;
    let high = 0;
    for (let k = 0; k <= 12; k++) {
      const f = Math.min(1, (i + k / 12) / legs);
      high = Math.max(
        high,
        surfaceHeight(
          route,
          outbound.x + (approach.x - outbound.x) * f,
          outbound.z + (approach.z - outbound.z) * f,
        ),
      );
    }
    gates.push({
      x,
      z,
      y: i === legs ? to.elevation + 190 : high + (i === 0 ? 260 : 650),
      radius: i === legs ? 480 : 1150,
    });
  }
  const cruise = Math.max(...gates.map((g) => g.y));
  for (const gate of gates.slice(1, -1)) {
    gate.y = Math.max(
      gate.y,
      Math.min(
        cruise,
        from.elevation + 300 + dist(outbound, gate) * 0.16,
        to.elevation + 190 + dist(approach, gate) * 0.13,
      ),
    );
  }
  return {
    aircraft: 'plane',
    airport: AIRPORTS.find((p) => p.code === region.ports[0].code)!,
    mode: 'practice',
    start,
    target,
    gates,
    thermal: start,
    route,
  };
}
export function cruiseRate(s: Point & { airborne: boolean }, r: Route) {
  if (!s.airborne) return 1;
  const d = Math.min(dist(s, center(r.from)), dist(s, center(r.to)));
  return 1 + 31 * clamp((d - 1400) / 7800, 0, 1);
}
