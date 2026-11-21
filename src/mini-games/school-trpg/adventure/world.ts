import {
  BIOMES,
  BIOME_IDS,
  RESIDENT_ROLE_IDS,
  type Biome,
  type Good,
  type ResidentRole,
  type Text,
} from './content';

export const ACADEMY_WORLD = 'bellreach';
export type Address = { world: string; x: number; y: number };
export type Point = Pick<Address, 'x' | 'y'>;
export const addressKey = ({ world, x, y }: Address) => JSON.stringify([world, x, y]);
export const pointKey = ({ x, y }: Point) => x + ',' + y;
export const STEPS: readonly Point[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];
export const DIRECTIONS: readonly Text[] = [
  ['北', 'North', 'きた'],
  ['東', 'East', 'ひがし'],
  ['南', 'South', 'みなみ'],
  ['西', 'West', 'にし'],
];
export const atOffset = <T extends Point>(point: T, direction: number): T => ({
  ...point,
  x: point.x + STEPS[direction].x,
  y: point.y + STEPS[direction].y,
});
export const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
export const sameAddress = (a: Address, b: Address) => samePoint(a, b) && a.world === b.world;

export function hash(value: string) {
  let seed = 2166136261;
  for (let i = 0; i < value.length; i++) seed = Math.imul(seed ^ value.charCodeAt(i), 16777619);
  return seed >>> 0;
}
export const choice = <T>(values: readonly T[], key: string): T =>
  values[hash(key) % values.length];

const CORE: Record<string, { name: Text; biome: Biome; lead: Text; landmark: Text }> = {
  '0,0': {
    name: ['鐘灯学園街', 'Bellwick Academy', 'しょうとうがくえんがい'],
    biome: 'academy',
    lead: [
      '夕方の鐘が鳴ると、机を片付けた生徒たちがそれぞれの行き先へ散っていく。',
      'When the evening bell sounds, students close their books and scatter toward roads of their own.',
    ],
    landmark: ['川辺の大鐘楼', 'Great River Belltower'],
  },
  '-1,0': {
    name: ['木影の里', 'Canopy Hollow', 'こかげのさと'],
    biome: 'grove',
    lead: [
      '木橋の隙間から、屋根の上で干された薬草が見える。',
      'Through the footbridge rails you can see herbs drying on the roofs below.',
    ],
    landmark: ['樹齢千年の橋', 'Thousand-Year Bridge'],
  },
  '1,0': {
    name: ['水鏡港', 'Mirrorharbor', 'みかがみこう'],
    biome: 'coast',
    lead: [
      '満ち潮に合わせて、市場の屋台も一緒に浮かび上がる。',
      'Market stalls rise gently with the incoming tide.',
    ],
    landmark: ['二つの灯台', 'Twin Lights'],
  },
  '0,-1': {
    name: ['雪鈴峠', 'Snowbell Pass', 'ゆきすずとうげ'],
    biome: 'alpine',
    lead: [
      '雪の底に沈む鈴が、峠を渡る旅人の足音に応える。',
      'Bells buried in snow answer the footfalls of travelers crossing the pass.',
    ],
    landmark: ['青氷の洞門', 'Blue Ice Arch'],
  },
  '0,1': {
    name: ['朱炉谷', 'Emberfurnace', 'しゅろだに'],
    biome: 'ember',
    lead: [
      '夕方になると、鍛冶場の火が対岸の窓に映る。',
      'In the evening, forge fires are reflected in windows across the ravine.',
    ],
    landmark: ['風を測る風車群', 'Windwatch Mills'],
  },
  '1,-1': {
    name: ['星架けの島', 'Starbridge Isle', 'ほしかけのしま'],
    biome: 'sky',
    lead: [
      '浮橋を渡りきるたび、眼下に別の町の灯りが見える。',
      'Each floating bridge reveals the lights of another distant town below.',
    ],
    landmark: ['真鍮の天文環', 'Brass Armillary'],
  },
};

const PLACE_PREFIX: Text[] = [
  ['夕凪', 'Stillwater'],
  ['真白', 'Whitesong'],
  ['遠鐘', 'Farbell'],
  ['黒曜', 'Obsidian'],
  ['霞芽', 'Mistbloom'],
  ['銀雨', 'Silverrain'],
  ['陽影', 'Sunshade'],
  ['緑笛', 'Greenwhistle'],
  ['灯夜', 'Lanternnight'],
  ['青帆', 'Bluesail'],
  ['白炎', 'Whiteflame'],
  ['風紋', 'Windmark'],
  ['星巡', 'Starwheel'],
  ['春暁', 'Springdawn'],
  ['月光', 'Moonbeam'],
  ['笙響', 'Reedcall'],
  ['蜜色', 'Honeygold'],
  ['群青', 'Ultramarine'],
  ['霜文', 'Frostscript'],
  ['山鳩', 'Dovehill'],
  ['鏡雨', 'Mirrorrain'],
  ['宵波', 'Duskweave'],
  ['東風', 'Eastwind'],
  ['琥珀', 'Amber'],
];
const PLACE_SUFFIX: Text[] = [
  ['宿場', 'Post'],
  ['広場', 'Square'],
  ['分水町', 'Fork'],
  ['市場', 'Market'],
  ['望楼', 'Watch'],
  ['渡し場', 'Crossing'],
  ['関所', 'Gate'],
  ['小路', 'Lane'],
  ['集落', 'Hollow'],
  ['野営地', 'Camp'],
  ['工房街', 'Works'],
  ['丘', 'Heights'],
];
const FEATURE: Text[] = [
  ['朝市の青いひさし', 'Blue market awnings'],
  ['三角屋根の道標', 'Gabled signposts'],
  ['苔むした古井戸', 'Mossy Well'],
  ['時間で色の変わる窓', 'Tinted clock windows'],
  ['風鳴る欄干', 'Singing railings'],
  ['石畳の水路', 'Stone channels'],
  ['柊の並木', 'Holly avenue'],
  ['星座を刻んだ石橋', 'Constellation Bridge'],
  ['真鍮の階段', 'Brass Stair'],
];
const FRONTIER: Record<Biome, Text[]> = {
  academy: [
    [
      '授業が終わると、書店の前に小さな屋台が並ぶ。',
      'When classes finish, a row of stalls springs up outside the bookstore.',
    ],
    [
      '土地の標本が窓に並び、旅人の持ち込んだ石も混じっている。',
      'Travelers’ stones mingle with local specimens in the windows.',
    ],
  ],
  grove: [
    [
      '昼の森は鳥の声に満ち、宿には採れたての薬草が届く。',
      'Birdsong fills the forest while bundles of herbs arrive at the inn.',
    ],
    [
      '住人は日が沈む前に木橋の灯りを一つずつ点けていく。',
      'Locals light the bridge lamps one by one before sunset.',
    ],
  ],
  coast: [
    [
      '潮の強い日は、漁師が網を繕いながら旅人に道を教える。',
      'On rough days, fishers mend their nets and give directions to travelers.',
    ],
    [
      '濡れた石畳を往来する人の足元で、潮が小さく引いていく。',
      'Water ebbs gently between the cobbles under passing feet.',
    ],
  ],
  alpine: [
    [
      '雪が降る前に、木箱と荷車が峠の宿へ運び込まれる。',
      'Crates and wagons are brought into the inn before the snow comes.',
    ],
    [
      '石壁の向こうから、鉱石を選り分ける音が聞こえる。',
      'Beyond the stone walls comes the sound of ore being sorted.',
    ],
  ],
  ember: [
    [
      '日陰の市では、焼いた薄パンと染めた糸が評判だ。',
      'Flatbread and dyed thread are the talk of the shaded bazaar.',
    ],
    [
      '冷たい風は井戸に溜まる。仕事帰りの人が縁に腰かけている。',
      'Cool air pools in the well. Workers gather at the rim on their way home.',
    ],
  ],
  sky: [
    [
      '夕暮れに風が止まると、空橋の向こうから鐘の音が届く。',
      'When the wind drops at dusk, bells carry across the skybridge.',
    ],
    [
      '住人は屋根に小さな旗をつけて、風の向きを遠くに知らせる。',
      'Tiny roof flags report the direction of the wind to distant settlements.',
    ],
  ],
};

export type Town = { biome: Biome; name: Text; lead: Text; landmark: Text };
export function townAt(address: Address): Town {
  const key = addressKey(address);
  const core = address.world === ACADEMY_WORLD ? CORE[pointKey(address)] : undefined;
  if (core) return core;
  const biome = choice(BIOME_IDS, key + '/biome');
  const prefix = choice(PLACE_PREFIX, key + '/prefix');
  const suffix = choice(PLACE_SUFFIX, key + '/suffix');
  return {
    name: [prefix[0] + suffix[0], prefix[1] + ' ' + suffix[1]],
    biome,
    lead: choice(FRONTIER[biome], key + '/lead'),
    landmark: choice(FEATURE, key + '/landmark'),
  };
}

export function realmName(world: string): Text {
  if (world === ACADEMY_WORLD) return ['鐘灯領', 'Bellreach', 'しょうとうりょう'];
  const prefix = choice(PLACE_PREFIX, world + '/world');
  return [prefix[0] + '界', 'Realm of ' + prefix[1]];
}

const NAMES: Text[] = [
  ['ミナ', 'Mina'],
  ['リュネ', 'Lyune'],
  ['テオ', 'Theo'],
  ['ハル', 'Haru'],
  ['セス', 'Seth'],
  ['イサナ', 'Isana'],
  ['アレッタ', 'Aletta'],
  ['レヴィ', 'Levi'],
  ['ノイ', 'Noi'],
  ['ラズ', 'Raz'],
  ['フィーア', 'Fia'],
  ['タリク', 'Tariq'],
  ['シオン', 'Shion'],
  ['ユエ', 'Yue'],
  ['カザリ', 'Kazari'],
  ['ソレン', 'Soren'],
  ['ミラ', 'Mira'],
  ['ニノ', 'Nino'],
  ['ネマ', 'Nema'],
  ['セラフ', 'Seraf'],
  ['イルマ', 'Irma'],
  ['リト', 'Rito'],
  ['シルケ', 'Silke'],
  ['カレン', 'Karen'],
  ['イヴァル', 'Ivar'],
  ['ローシャ', 'Rosha'],
  ['メイナ', 'Meina'],
  ['トウカ', 'Touka'],
  ['ルーク', 'Luke'],
  ['ベルナ', 'Berna'],
];
const CORE_CAST: Record<string, number[]> = {
  '0,0': [0, 11, 16, 1, 8, 27],
  '-1,0': [12, 24, 17, 14, 2, 29],
  '1,0': [7, 3, 6, 13, 26, 9],
  '0,-1': [21, 2, 18, 23, 10, 4],
  '0,1': [19, 20, 11, 5, 15, 22],
  '1,-1': [25, 28, 26, 9, 7, 1],
};

export type Resident = {
  id: string;
  name: Text;
  role: ResidentRole;
  art: number;
  site: Text;
  shift: 'day' | 'night' | 'all';
};
export function residentsAt(address: Address): Resident[] {
  const key = addressKey(address);
  const biome = BIOMES[townAt(address).biome];
  const roster = address.world === ACADEMY_WORLD ? CORE_CAST[pointKey(address)] : undefined;
  const start = hash(key + '/resident') % NAMES.length;
  return RESIDENT_ROLE_IDS.map((role, i) => ({
    id: key + '/' + role,
    name: NAMES[roster?.[i] ?? (start + i * 7) % NAMES.length],
    role,
    art: [0, 0, 1, 3, 2, 3][i],
    site: biome.sites[i % biome.sites.length],
    shift: i === 0 || i === 3 ? 'all' : i === 4 ? 'night' : 'day',
  }));
}

export const HOURS_PER_DAY = 24;
export const dayAt = (time: number) => Math.floor(time / HOURS_PER_DAY) + 1;
export const hourAt = (time: number) => time % HOURS_PER_DAY;
export const isNight = (time: number) => hourAt(time) >= 19 || hourAt(time) < 6;
export const residentPresent = (resident: Resident, time: number) =>
  resident.shift === 'all' || (resident.shift === 'night') === isNight(time);
export const weatherIndexAt = (address: Address, time: number) =>
  hash(addressKey(address) + '/weather/' + dayAt(time)) % 3;
export const weatherAt = (address: Address, time: number) =>
  BIOMES[townAt(address).biome].weather[weatherIndexAt(address, time)];
export const townArt = (address: Address) => {
  const town = townAt(address);
  const variant =
    address.world === ACADEMY_WORLD && CORE[pointKey(address)]
      ? ''
      : hash(addressKey(address) + '/art') % 2 === 0
        ? '-frontier'
        : '';
  return 'town-' + town.biome + variant;
};

type MissionKind = 'supply' | 'delivery' | 'survey' | 'guardian' | 'service' | 'craft';
export type Mission = {
  id: string;
  kind: MissionKind;
  title: Text;
  from: Address;
  target: Address;
  reward: number;
  goal: number;
  good?: Good;
  depth?: number;
};
const MISSIONS = {
  supply: ['市場の品不足', 'Market shortage'],
  delivery: ['封書を届ける', 'Carry a sealed letter'],
  survey: ['遺跡の見取り図', 'Map the ruins'],
  guardian: ['守護者の通行許可', 'Earn the guardian’s passage'],
  service: ['町の仕事を手伝う', 'Lend a hand in town'],
  craft: ['工房からの取り寄せ', 'Workshop order'],
} satisfies Record<MissionKind, Text>;

export function missionsAt(from: Address, time: number): Mission[] {
  const seed = addressKey(from) + '/board/' + dayAt(time);
  const local = BIOMES[townAt(from).biome].local;
  return (Object.keys(MISSIONS) as MissionKind[])
    .map((kind) => {
      const key = seed + '/' + kind;
      const depth = 1 + (hash(key) % 3);
      const target = kind === 'delivery' ? atOffset(from, hash(key) % 4) : from;
      return {
        id: key,
        kind,
        title: MISSIONS[kind],
        from,
        target,
        reward: (kind === 'guardian' ? 39 : kind === 'survey' ? 27 : 17) + depth * 3,
        goal:
          kind === 'survey'
            ? 13
            : kind === 'guardian' || kind === 'delivery'
              ? 1
              : 2 + (hash(key + '/goal') % 2),
        ...(kind === 'supply'
          ? { good: local }
          : kind === 'craft'
            ? { good: choice<Good>(['ration', 'tonic', 'lantern'], key) }
            : {}),
        ...(kind === 'guardian' ? { depth } : {}),
      };
    })
    .filter((_, i) => (dayAt(time) + i) % 5 !== 0);
}

export const SIDE = 9;
export const ENTRY_CELL = 10;
export type Feature =
  | 'pack'
  | 'cache'
  | 'runes'
  | 'trap'
  | 'sanctum'
  | 'vein'
  | 'guardian'
  | 'stairs';
export const FEATURES: Record<Feature, Text> = {
  pack: ['徘徊する魔物', 'Wandering creatures'],
  cache: ['古びた宝箱', 'Weathered chest'],
  runes: ['紋章扉', 'Runed door'],
  trap: ['床の仕掛け', 'Floor mechanism'],
  sanctum: ['静かな祭壇', 'Quiet altar'],
  vein: ['素材の採取場', 'Gathering site'],
  guardian: ['通路の守護者', 'Passage guardian'],
  stairs: ['地下への階段', 'Stairs down'],
};
export type Floor = {
  open: Set<number>;
  features: Partial<Record<number, Feature>>;
  answer: number;
  seal: number;
  stairs: number;
};
export const cellPoint = (cell: number): Point => ({ x: cell % SIDE, y: Math.floor(cell / SIDE) });
export function neighbor(cell: number, direction: number) {
  const { x, y } = atOffset(cellPoint(cell), direction);
  return x < 0 || y < 0 || x >= SIDE || y >= SIDE ? -1 : y * SIDE + x;
}
export const floorKey = (address: Address, depth: number) => addressKey(address) + '/' + depth;

export function generateFloor(address: Address, depth: number): Floor {
  const seed = floorKey(address, depth);
  const open = new Set([ENTRY_CELL]);
  const route = [ENTRY_CELL];
  // Carve a connected maze. Two loops afterward create optional detours.
  while (route.length) {
    const cell = route.at(-1)!;
    const paths = STEPS.flatMap((_, dir) => {
      const midpoint = neighbor(cell, dir);
      const next = midpoint < 0 ? -1 : neighbor(midpoint, dir);
      return next < 0 || open.has(next) ? [] : [{ midpoint, next }];
    });
    if (!paths.length) {
      route.pop();
      continue;
    }
    const { midpoint, next } = choice(paths, seed + '/turn/' + cell + '/' + open.size);
    open.add(midpoint);
    open.add(next);
    route.push(next);
  }
  const walls = Array.from({ length: SIDE * SIDE }, (_, i) => i).filter((i) => {
    const { x, y } = cellPoint(i);
    return (
      x > 0 &&
      x < SIDE - 1 &&
      y > 0 &&
      y < SIDE - 1 &&
      !open.has(i) &&
      ((open.has(i - 1) && open.has(i + 1)) || (open.has(i - SIDE) && open.has(i + SIDE)))
    );
  });
  walls.sort((a, b) => hash(seed + '/cross/' + a) - hash(seed + '/cross/' + b));
  walls.slice(0, 2 + (depth % 2)).forEach((cell) => open.add(cell));
  const distance = new Map([[ENTRY_CELL, 0]]);
  const queue = [ENTRY_CELL];
  for (const cell of queue)
    for (let dir = 0; dir < STEPS.length; dir++) {
      const next = neighbor(cell, dir);
      if (open.has(next) && !distance.has(next)) {
        distance.set(next, distance.get(cell)! + 1);
        queue.push(next);
      }
    }
  const stairs = queue.at(-1)!;
  const middle = queue.filter((cell) => distance.get(cell)! > 2 && cell !== stairs);
  const candidates = middle.filter((cell) => distance.get(cell)! >= distance.get(stairs)! - 4);
  const seal = choice(candidates, seed + '/guardian');
  const features: Floor['features'] = { [stairs]: 'stairs', [seal]: 'guardian' };
  const roomTypes: Feature[] = [
    'pack',
    'cache',
    'runes',
    'trap',
    'sanctum',
    'vein',
    'pack',
    'cache',
    'trap',
    'vein',
    'pack',
  ];
  const sorted = middle
    .filter((cell) => cell !== seal)
    .sort((a, b) => hash(seed + '/room/' + a) - hash(seed + '/room/' + b));
  roomTypes.forEach((feature, i) => {
    features[sorted[i]] = feature;
  });
  return { open, features, seal, stairs, answer: hash(seed + '/answer') % 3 };
}
