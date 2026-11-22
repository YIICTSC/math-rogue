import { BIOMES, GOODS, type Biome, type Good, type Text } from './content';
import { SITE_TITLES, type Liquid, type Terrain } from './frontierContent';
import { alterationAt, fieldCondition, fieldSkill } from './frontierState';
import { circuitAt, ruinFloor } from './ruinSystems';
import { consumeFieldRecipe, type Adventure } from './state';
import {
  addressKey,
  atOffset,
  cellPoint,
  ENTRY_CELL,
  floorKey,
  hash,
  neighbor,
  SIDE,
  townAt,
  type Address,
  type Floor,
} from './world';

const HABITAT: Record<Biome, readonly Terrain[]> = {
  academy: ['puddle', 'wire', 'steam'],
  grove: ['moss', 'resin', 'puddle'],
  coast: ['puddle', 'puddle', 'wire'],
  alpine: ['ice', 'ice', 'steam'],
  ember: ['heat', 'steam', 'oil'],
  sky: ['wire', 'ice', 'moss'],
};

export function fieldFloor(s: Adventure, depth = s.delve!.floor): Floor {
  const floor = ruinFloor(
    s.location,
    depth,
    s.delve?.floor === depth ? circuitAt(s)?.mode : undefined,
  );
  for (const cell of alterationAt(s, depth)?.dug ?? []) floor.open.add(cell);
  return floor;
}

export function terrainAt(
  s: Adventure,
  cell: number,
  depth: number,
  base = fieldFloor(s, depth),
): Terrain {
  const patch = alterationAt(s, depth)?.patches[cell];
  if (patch && (patch.until === null || patch.until > s.time)) return patch.terrain;
  if (
    !s.frontier.rules.weather ||
    cell === ENTRY_CELL ||
    !base.open.has(cell) ||
    base.features[cell]
  )
    return 'floor';
  const seed = hash(floorKey(s.location, depth) + '/terrain/' + cell);
  const options = HABITAT[townAt(s.location).biome];
  return seed % 7 < 2 ? options[(seed >>> 16) % options.length] : 'floor';
}

function mutableFloor(s: Adventure) {
  return (s.frontier.alterations[floorKey(s.location, s.delve!.floor)] ??= {
    dug: [],
    patches: {},
  });
}

export const canDig = (s: Adventure) => {
  const d = s.delve;
  if (!d || d.encounter) return false;
  const cell = neighbor(d.cell, d.direction);
  if (cell < 0) return false;
  const point = cellPoint(cell);
  return (
    point.x > 0 &&
    point.y > 0 &&
    point.x < SIDE - 1 &&
    point.y < SIDE - 1 &&
    !fieldFloor(s).open.has(cell)
  );
};

export function dig(s: Adventure) {
  if (!canDig(s)) return false;
  const d = s.delve!;
  mutableFloor(s).dug.push(neighbor(d.cell, d.direction));
  return true;
}

export function neighbors(cell: number) {
  return [0, 1, 2, 3].map((direction) => neighbor(cell, direction)).filter((other) => other >= 0);
}

export function pathsFrom(
  start: number,
  passable: (next: number, from: number) => boolean,
  limit = Infinity,
) {
  const queue = [start];
  const previous = new Map<number, { from: number; steps: number }>([
    [start, { from: start, steps: 0 }],
  ]);
  for (const from of queue) {
    const steps = previous.get(from)!.steps;
    if (steps >= limit) continue;
    for (const cell of neighbors(from)) {
      if (previous.has(cell) || !passable(cell, from)) continue;
      previous.set(cell, { from, steps: steps + 1 });
      queue.push(cell);
    }
  }
  return previous;
}

export function pathTo(previous: ReturnType<typeof pathsFrom>, start: number, target: number) {
  const path: number[] = [];
  for (let cell = target; cell !== start; ) {
    const parent = previous.get(cell);
    if (!parent) return [];
    path.unshift(cell);
    cell = parent.from;
  }
  return path;
}

export function plannedWalk(s: Adventure, destination?: number) {
  const d = s.delve;
  if (!d || d.encounter) return [];
  const floor = fieldFloor(s);
  const record = s.floors[floorKey(s.location, d.floor)];
  if (!record) return [];
  const seen = new Set(record.seen);
  const avoid = (cell: number) => {
    const type = floor.features[cell];
    return Boolean(
      type &&
        !record.cleared.includes(cell) &&
        ['guardian', 'pack', 'trap', 'runes', 'stairs'].includes(type),
    );
  };
  const paths = pathsFrom(
    d.cell,
    (cell, from) =>
      floor.open.has(cell) &&
      seen.has(from) &&
      (!avoid(from) || (from === d.cell && cell === d.previous)) &&
      !avoid(cell) &&
      (!s.frontier.rules.safeWalk || terrainAt(s, cell, d.floor, floor) === 'floor'),
  );
  const target = destination ?? [...paths.keys()].find((cell) => !seen.has(cell));
  if (target === undefined || (destination !== undefined && !seen.has(destination))) return [];
  return pathTo(paths, d.cell, target).slice(0, 12);
}

export function glancingSight(floor: Floor, from: number, to: number, maximum: number) {
  const a = cellPoint(from),
    b = cellPoint(to);
  const dx = b.x - a.x,
    dy = b.y - a.y;
  if (Math.abs(dx) + Math.abs(dy) > maximum) return false;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  let before = a;
  for (let i = 1; i <= steps; i++) {
    const x = Math.round(a.x + (dx * i) / steps),
      y = Math.round(a.y + (dy * i) / steps);
    const cell = y * SIDE + x;
    if (
      !floor.open.has(cell) ||
      (i < steps && ['runes', 'guardian'].includes(floor.features[cell] ?? ''))
    )
      return false;
    if (
      x !== before.x &&
      y !== before.y &&
      !floor.open.has(before.y * SIDE + x) &&
      !floor.open.has(y * SIDE + before.x)
    )
      return false;
    before = { x, y };
  }
  return true;
}

export const liquidMix = (a: Liquid, b: Liquid): Liquid | null => {
  const pair = [a, b].sort().join('/');
  if (pair === 'chalk/sap') return 'resin';
  if (pair === 'brine/water') return 'brine';
  if (pair === 'oil/sap') return 'oil';
  return null;
};

export function react(ground: Terrain, poured: Liquid): Terrain {
  if (poured === 'chalk')
    return ['fire', 'heat', 'oil', 'puddle', 'moss', 'wire'].includes(ground) ? 'floor' : ground;
  if (poured === 'water' || poured === 'brine') {
    if (ground === 'heat' || ground === 'fire') return 'steam';
    if (ground === 'wire') return 'wire';
    return 'puddle';
  }
  if (poured === 'oil') return ['heat', 'fire', 'wire'].includes(ground) ? 'fire' : 'oil';
  return 'resin';
}

export function pourAt(s: Adventure, cell: number, liquid: Liquid) {
  const floor = fieldFloor(s);
  const d = s.delve!;
  if (!floor.open.has(cell) || !glancingSight(floor, d.cell, cell, 3)) return null;
  const surface = terrainAt(s, cell, d.floor, floor);
  const near = neighbors(cell).filter((other) => floor.open.has(other));
  const around = near.map((other) => ({
    cell: other,
    terrain: terrainAt(s, other, d.floor, floor),
  }));
  const conducts =
    liquid === 'brine' &&
    (surface === 'wire' ||
      (surface !== 'fire' && surface !== 'heat' && around.some((tile) => tile.terrain === 'wire')));
  const terrain = conducts ? 'wire' : react(surface, liquid);
  const patches = mutableFloor(s).patches;
  patches[cell] = {
    terrain,
    until: conducts || ['steam', 'fire', 'puddle'].includes(terrain) ? s.time + 4 : null,
  };
  for (const other of around) {
    if (terrain === 'fire' && other.terrain === 'oil')
      patches[other.cell] = { terrain: 'fire', until: s.time + 3 };
    if (conducts && other.terrain === 'puddle')
      patches[other.cell] = { terrain: 'wire', until: s.time + 3 };
  }
  return terrain;
}

export function fieldHazard(
  s: Adventure,
  cell: number,
  depth: number,
  floor = fieldFloor(s, depth),
): Text | null {
  const terrain = terrainAt(s, cell, depth, floor);
  if (terrain === 'floor' || terrain === 'steam' || terrain === 'resin') return null;
  if (
    fieldCondition(s, 'ward') ||
    (fieldCondition(s, 'wing') && ['puddle', 'ice', 'oil'].includes(terrain))
  )
    return null;
  if (consumeFieldRecipe(s, 'hazard'))
    return ['野営料理の効果で、足元の危険をしのいだ。', 'Your meal wards off the terrain hazard.'];
  switch (terrain) {
    case 'puddle':
      s.frontier.conditions.soaked = s.time + 4;
      return [
        '足元が濡れた。帯電した床には気を付けよう。',
        'You get soaked. Take care near live conductors.',
      ];
    case 'ice':
      s.frontier.conditions.chill = s.time + 5;
      if (!fieldSkill(s, 'stance')) s.fatigue = Math.min(9, s.fatigue + 1);
      return ['薄氷で足が冷えた。', 'The thin ice chills your feet.'];
    case 'fire':
    case 'heat':
      s.hp = Math.max(0, s.hp - (terrain === 'fire' ? 4 : 2));
      s.frontier.conditions.burn = s.time + 5;
      return ['熱した床でやけどをした。', 'The hot floor scorches you.'];
    case 'moss':
      s.frontier.conditions.spore = s.time + 42;
      return [
        '菌糸がついた。水で洗うか、野営で手当てできる。',
        'Spores cling to you. Wash them off or treat them at camp.',
      ];
    case 'wire': {
      const soaked = fieldCondition(s, 'soaked');
      s.hp = Math.max(0, s.hp - (soaked ? 5 : 2));
      s.frontier.conditions.static = s.time + 4;
      for (const item of s.frontier.devices) {
        if (Object.values(s.frontier.sockets).includes(item.serial) && item.mod !== 'insulation')
          item.charge = Math.max(0, item.charge - 1);
      }
      return soaked
        ? ['水を含んだ服に電気が走った。', 'The current arcs through your soaked clothes.']
        : ['床から電気が走った。', 'A current runs through the floor.'];
    }
    case 'oil':
      s.fatigue = Math.min(9, s.fatigue + 1);
      return ['油膜で足を滑らせた。', 'You slip on an oil slick.'];
  }
}

const SUFFIXES: Text[] = [
  ['外れの旧道', 'Old road beyond town', 'はずれの きゅうどう'],
  ['風見台の下', 'Beneath the wind vane', 'かざみだいの した'],
  ['坂の途中', 'Halfway up the hill', 'さかの とちゅう'],
  ['境界標の先', 'Beyond the boundary stone', 'きょうかいひょうの さき'],
];
const WITNESSES: Text[] = [
  ['図工部の記録係', 'a workshop archivist'],
  ['旅回りの修理屋', 'an itinerant repairer'],
  ['鐘番の見習い', 'an apprentice bellkeeper'],
  ['町を離れた渡し守', 'a ferryman who left town'],
];
const SITE_TASKS = ['repair', 'deal', 'trace', 'gather'] as const;
export type SiteTask = (typeof SITE_TASKS)[number];
export const SITE_GOALS = {
  repair: ['古い設備を修理する', 'Repair the old fittings'],
  deal: ['地元の使者と折り合う', 'Negotiate with the local emissary'],
  trace: ['記録を読み解く', 'Decipher the records'],
  gather: ['向こう岸の目印を回収する', 'Recover a marker from the further bank'],
} satisfies Record<SiteTask, Text>;

export function surveySite(place: Address) {
  const town = townAt(place);
  const key = addressKey(place);
  const seed = hash(key + '/surveys');
  const biome = town.biome;
  const witness = WITNESSES[(seed >>> 12) % WITNESSES.length];
  const sequel = atOffset(place, (seed >>> 20) % 4);
  const named = SITE_TITLES[biome];
  const material: Good = BIOMES[biome].local;
  const title: Text = [named[0] + '・' + town.name[0], named[1] + ' of ' + town.name[1]];
  const tale: Text = [
    SUFFIXES[(seed >>> 8) % SUFFIXES.length][0] +
      'で、' +
      witness[0] +
      'が書いた紀行誌を発見した。' +
      townAt(sequel).name[0] +
      'へ続く、' +
      GOODS[material].name[0] +
      'の運び道が記されている。',
    'You find a travel book ' +
      SUFFIXES[(seed >>> 8) % SUFFIXES.length][1].toLowerCase() +
      ', written by ' +
      witness[1] +
      '. It describes a route carrying ' +
      GOODS[material].name[1].toLowerCase() +
      ' toward ' +
      townAt(sequel).name[1] +
      '.',
  ];
  return {
    title,
    biome,
    material,
    tale,
    sequel,
    task: SITE_TASKS[seed % SITE_TASKS.length],
    quality: 1 + ((seed >>> 24) % 3),
  };
}
