import type { Biome, Good, Stat, Text } from './content';

export const DISCIPLINES = {
  explorer: {
    name: ['街道の旅人', 'Wayfarer', 'かいどうの たびびと'],
    hint: [
      '流派を問わず技能を学び、荷物を多く運ぶ。',
      'Learn any field skill and carry extra supplies.',
    ],
  },
  resonant: {
    name: ['響き手', 'Resonant', 'ひびきて'],
    hint: [
      '身体や感覚に宿る力を伸ばす。力を使い続けると遺跡の番人に気づかれる。',
      'Develop innate powers. Repeated use may draw sentinels in the ruins.',
    ],
  },
  artificer: {
    name: ['機巧士', 'Artificer', 'きこうし'],
    hint: [
      '古い機械を見分け、義装の取り付けや改造に長ける。',
      'Identify old machinery and excel at fitting and modifying devices.',
    ],
  },
} satisfies Record<string, { name: Text; hint: Text }>;
export type Discipline = keyof typeof DISCIPLINES;

export const FIELD_SKILLS = {
  wayfinding: {
    name: ['道読み', 'Wayfinding', 'みちよみ'],
    hint: [
      '長い街道移動を1時間短縮。探索時は危険を手前で察知。',
      'Shortens road travel by one hour and detects hazards while exploring.',
    ],
    stat: 'finesse',
    minimum: 2,
  },
  herbalism: {
    name: ['野草学', 'Herbalism', 'やそうがく'],
    hint: [
      '食材探しで薬草を追加取得し、手当てが強くなる。',
      'Find an extra herb when foraging and improve field treatment.',
    ],
    stat: 'insight',
    minimum: 2,
  },
  cookery: {
    name: ['野営料理', 'Camp cooking', 'やえいりょうり'],
    hint: ['配合料理の持続時間が延びる。', 'Extends the duration of custom meals.'],
    stat: 'insight',
    minimum: 2,
  },
  appraisal: {
    name: ['鑑定', 'Appraisal', 'かんてい'],
    hint: [
      '古機具を安全に鑑定。紀行誌を寄贈したときの経験値も増える。',
      'Identify devices safely and gain more XP from donated books.',
    ],
    stat: 'insight',
    minimum: 3,
  },
  salvage: {
    name: ['分解技術', 'Salvage', 'ぶんかいぎじゅつ'],
    hint: [
      '分解で得る部品が増え、古機具を改造できる。',
      'Recover more parts and learn to modify devices.',
    ],
    stat: 'finesse',
    minimum: 3,
  },
  stance: {
    name: ['踏ん張り', 'Footwork', 'ふんばり'],
    hint: [
      '戦術戦闘で回避しやすくなり、足の負傷の影響も抑える。',
      'Improves evasion and reduces the effects of injured feet.',
    ],
    stat: 'finesse',
    minimum: 3,
  },
  medicine: {
    name: ['野戦手当て', 'Field medicine', 'やせんてあて'],
    hint: [
      '薬草の手当てで負傷と異常をまとめて治せる。',
      'Treat injuries and ailments together with herbs.',
    ],
    stat: 'insight',
    minimum: 3,
  },
  diplomacy: {
    name: ['口伝と折衝', 'Oratory', 'くでんと せっしょう'],
    hint: [
      '交渉判定が有利になり、旅先の紹介を受けやすくなる。',
      'Improves negotiations and introductions on the road.',
    ],
    stat: 'presence',
    minimum: 2,
  },
  marksman: {
    name: ['狙い撃ち', 'Marksmanship', 'ねらいうち'],
    hint: [
      '戦術戦闘で弓の射程と命中が上がる。',
      'Increases bow range and accuracy in tactical combat.',
    ],
    stat: 'finesse',
    minimum: 3,
  },
} satisfies Record<string, { name: Text; hint: Text; stat: Stat; minimum: number }>;
export type FieldSkill = keyof typeof FIELD_SKILLS;

export const GIFTS = {
  chisel: {
    name: ['石ほぐし', 'Stonebinding', 'いしほぐし'],
    hint: ['正面の壁を1マス掘る。', 'Carve one wall tile directly ahead.'],
    stat: 'might',
    cooldown: 5,
  },
  wing: {
    name: ['渡り羽', 'Wind feathers', 'わたりばね'],
    hint: [
      '湿地や氷を安全に越え、街道を早く渡る。',
      'Cross wet or icy terrain safely and travel faster.',
    ],
    stat: 'finesse',
    cooldown: 12,
  },
  echo: {
    name: ['地響き読み', 'Echo mapping', 'じひびきよみ'],
    hint: ['同じ階の近くの地形を見取図に記録。', 'Map nearby passages on the current floor.'],
    stat: 'insight',
    cooldown: 5,
  },
  veil: {
    name: ['薄明の結界', 'Twilight ward', 'はくめいの けっかい'],
    hint: [
      '熱・電気・胞子を遮り、短時間だけ防御が上がる。',
      'Blocks heat, static, and spores and briefly improves armor.',
    ],
    stat: 'presence',
    cooldown: 7,
  },
  roots: {
    name: ['手のひらの芽', 'Palm sprouts', 'てのひらの め'],
    hint: ['体力を回復し、感染と負傷を静める。', 'Heal and treat infections and injuries.'],
    stat: 'might',
    cooldown: 10,
  },
  chorus: {
    name: ['木霊の分身', 'Echo double', 'こだまの ぶんしん'],
    hint: ['数ターン、分身が援護する。', 'An echo assists for several turns.'],
    stat: 'presence',
    cooldown: 9,
  },
  clock: {
    name: ['先見の一拍', 'Foresight', 'せんけんの いっぱく'],
    hint: [
      '次の出目を見て、もう一つの出目から有利な方を取る。',
      'See the next die result and keep the higher of it and a second roll.',
    ],
    stat: 'insight',
    cooldown: 8,
  },
  stagger: {
    name: ['反響打', 'Resonant pulse', 'はんきょうだ'],
    hint: [
      '近くの魔物をひるませ、反撃を止める。',
      'Stagger nearby foes and interrupt their response.',
    ],
    stat: 'finesse',
    cooldown: 7,
  },
  guide: {
    name: ['影渡し', 'Shadow steering', 'かげわたし'],
    hint: [
      '射線内の魔物に意識を渡し、短い間その場所から動きや攻撃を指示する。',
      'Steer a creature in sight for a few turns. Move it or strike from its position.',
    ],
    stat: 'presence',
    cooldown: 12,
  },
  phase: {
    name: ['すき間渡り', 'Threshold step', 'すきまわたり'],
    hint: [
      '正面の薄い壁を抜け、短時間だけすり抜けやすくなる。',
      'Slip through a thin wall ahead and briefly improve evasion.',
    ],
    stat: 'finesse',
    cooldown: 8,
  },
} satisfies Record<string, { name: Text; hint: Text; stat: Stat; cooldown: number }>;
export type Gift = keyof typeof GIFTS;

export const EQUIPMENT_SOCKETS = {
  head: ['頭部', 'Head', 'とうぶ'],
  wrist: ['腕', 'Wrist', 'うで'],
  pack: ['背負い具', 'Pack', 'せおいぐ'],
  support: ['補助腕', 'Auxiliary mount', 'ほじょううで'],
} satisfies Record<string, Text>;
export type Socket = keyof typeof EQUIPMENT_SOCKETS;
export const BODY_ZONES = {
  head: ['頭部', 'Head', 'とうぶ'],
  grip: ['手・腕', 'Hands and arms', 'てと うで'],
  feet: ['足', 'Feet', 'あし'],
} satisfies Record<string, Text>;
export type BodyZone = keyof typeof BODY_ZONES;

type DeviceSpec = {
  name: Text;
  socket: Socket;
  power: Gift | 'lamp' | 'spray';
  charge: number;
  parts: number;
  material: Good;
  art: string;
};
export const DEVICES = {
  atlas: {
    name: ['折図の羅針機', 'Foldchart compass', 'おりずの らしんき'],
    socket: 'head',
    power: 'echo',
    charge: 1,
    parts: 3,
    material: 'thread',
    art: 'atlas',
  },
  wick: {
    name: ['格子灯ランタン', 'Lattice lantern', 'こうしとう ランタン'],
    socket: 'pack',
    power: 'lamp',
    charge: 1,
    parts: 2,
    material: 'lantern',
    art: 'wick',
  },
  spray: {
    name: ['霧吹き瓶', 'Mist atomizer', 'きりふきびん'],
    socket: 'wrist',
    power: 'spray',
    charge: 1,
    parts: 3,
    material: 'herb',
    art: 'spray',
  },
  auger: {
    name: ['翡翠の穿孔器', 'Jade auger', 'ひすいの せんこうき'],
    socket: 'wrist',
    power: 'chisel',
    charge: 2,
    parts: 5,
    material: 'ore',
    art: 'auger',
  },
  fork: {
    name: ['紫紺の調律機', 'Indigo tuner', 'しこんの ちょうりつき'],
    socket: 'head',
    power: 'stagger',
    charge: 2,
    parts: 4,
    material: 'ore',
    art: 'fork',
  },
  brace: {
    name: ['銅輪の手甲', 'Copper brace', 'どうわの てっこう'],
    socket: 'wrist',
    power: 'veil',
    charge: 1,
    parts: 4,
    material: 'ore',
    art: 'brace',
  },
  bird: {
    name: ['柳織りの使い鳥', 'Willow familiar', 'やなぎおりの つかいどり'],
    socket: 'pack',
    power: 'chorus',
    charge: 2,
    parts: 5,
    material: 'timber',
    art: 'bird',
  },
  timeglass: {
    name: ['青硝子の懐時計', 'Blueglass timepiece', 'あおがらすの かいちゅうどけい'],
    socket: 'head',
    power: 'clock',
    charge: 2,
    parts: 5,
    material: 'relic',
    art: 'timeglass',
  },
} satisfies Record<string, DeviceSpec>;
export type Device = keyof typeof DEVICES;
export const DEVICE_IDS = Object.keys(DEVICES) as Device[];
export const DEVICE_MODS = {
  reservoir: {
    name: ['予備電槽', 'Reserve cell', 'よびでんそう'],
    hint: ['蓄えられる電気が2増える。', 'Holds two more charges.'],
  },
  insulation: {
    name: ['絶縁張り', 'Insulation', 'ぜつえんばり'],
    hint: ['装着中は機具を帯電で失わない。', 'Protects equipped devices from static drain.'],
  },
  focus: {
    name: ['精密調整', 'Focusing lens', 'せいみつちょうせい'],
    hint: ['起動時の必要電力が1減る。', 'Uses one less charge per activation.'],
  },
} satisfies Record<string, { name: Text; hint: Text }>;
export type DeviceMod = keyof typeof DEVICE_MODS;

const liquid = (name: Text, hint: Text, color: string) => ({ name, hint, color });
export const LIQUIDS = {
  water: liquid(
    ['澄み水', 'Clear water', 'すみみず'],
    [
      '飲むと渇きが和らぐ。熱を冷まし、菌を洗う。',
      'Slakes thirst, cools heat, and washes off spores.',
    ],
    '#82d9ec',
  ),
  brine: liquid(
    ['塩水', 'Brine', 'しおみず'],
    ['電気をよく通す。飲むと疲れる。', 'Conducts electricity. Drinking it adds fatigue.'],
    '#afd6de',
  ),
  oil: liquid(
    ['灯油', 'Lamp oil', 'とうゆ'],
    [
      '熱した足場で燃え広がる。普通の地面では滑る。',
      'Feeds fire on hot terrain and makes ordinary ground slippery.',
    ],
    '#f2b55d',
  ),
  sap: liquid(
    ['森の樹液', 'Woodland sap', 'もりの じゅえき'],
    [
      '治療に使える。粉を混ぜると粘着液になる。',
      'Restorative. It forms a binding resin when mixed with mineral dust.',
    ],
    '#99ce8e',
  ),
  chalk: liquid(
    ['石灰乳', 'Chalk wash', 'せっかいにゅう'],
    [
      '油の熱を抑え、地面にある液を吸い取る。',
      'Smothers hot oil and absorbs liquids on the ground.',
    ],
    '#eee7bd',
  ),
  resin: liquid(
    ['樹脂液', 'Binding resin', 'じゅしえき'],
    ['魔物の足を止める。', 'Slows creatures crossing it.'],
    '#b79765',
  ),
} satisfies Record<string, { name: Text; hint: Text; color: string }>;
export type Liquid = keyof typeof LIQUIDS;
export const LIQUID_IDS = Object.keys(LIQUIDS) as Liquid[];

export const TERRAIN = {
  floor: { name: ['乾いた床', 'Dry floor', 'かわいた ゆか'], mark: '·', color: '#354d4a' },
  puddle: { name: ['水たまり', 'Water', 'みずたまり'], mark: '≈', color: '#2d6680' },
  ice: { name: ['薄氷', 'Ice', 'うすごおり'], mark: '◇', color: '#527789' },
  heat: { name: ['熱した床', 'Hot floor', 'あつい ゆか'], mark: '▲', color: '#894d38' },
  steam: { name: ['湯気', 'Steam', 'ゆげ'], mark: '≋', color: '#647376' },
  moss: { name: ['菌糸', 'Spore bed', 'きんし'], mark: '✤', color: '#52683b' },
  wire: { name: ['帯電床', 'Live conductor', 'たいでん ゆか'], mark: 'ϟ', color: '#676487' },
  fire: { name: ['燃える油', 'Burning oil', 'もえる あぶら'], mark: '✹', color: '#a94332' },
  resin: { name: ['粘る樹脂', 'Sticky resin', 'ねばる じゅし'], mark: '●', color: '#79633e' },
  oil: { name: ['油膜', 'Oil slick', 'ゆまく'], mark: '◒', color: '#806b4b' },
} satisfies Record<string, { name: Text; mark: string; color: string }>;
export type Terrain = keyof typeof TERRAIN;

export const CONDITIONS = {
  soaked: ['濡れ', 'Soaked', 'ぬれ'],
  chill: ['冷え', 'Chilled', 'ひえ'],
  burn: ['熱傷', 'Scorched', 'ねっしょう'],
  spore: ['胞子感染', 'Spore growth', 'ほうしかんせん'],
  static: ['帯電', 'Static', 'たいでん'],
  ward: ['結界', 'Warded', 'けっかい'],
  wing: ['渡り羽', 'Gliding', 'わたりばね'],
  chorus: ['分身', 'Echo double', 'ぶんしん'],
  foresight: ['先見', 'Foresight', 'せんけん'],
  lost: ['道迷い', 'Disoriented', 'みちまよい'],
  phase: ['薄身', 'Phased', 'うすみ'],
} satisfies Record<string, Text>;
export type Condition = keyof typeof CONDITIONS;

export const RECIPES_LAB = {
  broth: {
    name: ['山野の薬膳', 'Wild herb broth', 'さんやの やくぜん'],
    cost: { fish: 1, herb: 1 },
    trigger: 'hazard',
    hint: [
      '危険な地面を踏んだとき一度だけ軽減し、体を温める。',
      'Absorb your next hazardous tile and warm up.',
    ],
  },
  grain: {
    name: ['すばやい旅の粥', 'Roadrunner porridge', 'すばやい たびの かゆ'],
    cost: { grain: 1, seed: 1 },
    trigger: 'road',
    hint: ['次の街道移動が短縮される。', 'Shortens the next road journey.'],
  },
  fry: {
    name: ['火守の香草揚げ', 'Hearth herb fry', 'ひもりの こうそうあげ'],
    cost: { meat: 1, herb: 1 },
    trigger: 'hit',
    hint: [
      '次に反撃を受けたとき体力と集中を戻す。',
      'Restore HP and Focus after the next enemy hit.',
    ],
  },
  tea: {
    name: ['語らいの麦茶', 'Diplomat’s barley tea', 'かたらいの むぎちゃ'],
    cost: { grain: 1, herb: 1 },
    trigger: 'talk',
    hint: ['次の交渉判定が有利になる。', 'Boosts your next negotiation check.'],
  },
} satisfies Record<
  string,
  { name: Text; cost: Partial<Record<Good, number>>; trigger: string; hint: Text }
>;
export type LabMeal = keyof typeof RECIPES_LAB;
export type MealTrigger = (typeof RECIPES_LAB)[LabMeal]['trigger'];

export const BLEND_BASES = {
  fish: {
    trigger: 'hazard',
    hint: ['危険な床を踏んだとき一度だけ影響を打ち消す。', 'Negate the next hazardous tile.'],
  },
  meat: {
    trigger: 'hit',
    hint: ['次の被弾で体力と集中が戻る。', 'Recover HP and Focus after the next hit.'],
  },
  grain: { trigger: 'road', hint: ['次の街道移動が短くなる。', 'Shorten your next road journey.'] },
  ration: {
    trigger: 'talk',
    hint: ['次の交渉判定が上がる。', 'Gain an edge in the next negotiation.'],
  },
} satisfies Record<string, { trigger: MealTrigger; hint: Text }>;
export type BlendBase = keyof typeof BLEND_BASES;
export const BLEND_SPICES = {
  herb: {
    name: ['薬草', 'Herbs', 'やくそう'],
    hint: ['発動時に追加で体力を回復。', 'Restore extra HP when triggered.'],
  },
  seed: {
    name: ['煎り種', 'Toasted seeds', 'いりだね'],
    hint: ['発動時に疲労を1回復。', 'Reduce fatigue by one when triggered.'],
  },
  sap: {
    name: ['樹液', 'Woodland sap', 'じゅえき'],
    hint: ['発動時に集中を追加回復。', 'Restore extra Focus when triggered.'],
  },
} satisfies Record<string, { name: Text; hint: Text }>;
export type BlendSpice = keyof typeof BLEND_SPICES;

export const FOLLOWER_ORDERS = {
  strike: ['前衛', 'Vanguard', 'ぜんえい'],
  support: ['援護', 'Support', 'えんご'],
  hold: ['待機', 'Stand by', 'たいき'],
} satisfies Record<string, Text>;
export type FollowerOrder = keyof typeof FOLLOWER_ORDERS;

export const ENCOUNTER_RULES = {
  classic: {
    name: ['自由冒険', 'Open journey', 'じゆうぼうけん'],
    hint: ['好きな設定で世界を旅する。', 'Travel freely with your chosen rules.'],
  },
  daily: {
    name: ['日替わりの旅', 'Daily journey', 'ひがわりの たび'],
    hint: [
      '同じ日と出身から、同じ地形と出目で始まる。',
      'The same day and background start with the same terrain and dice.',
    ],
  },
  weekly: {
    name: ['週替わりの旅', 'Weekly journey', 'しゅうがわりの たび'],
    hint: ['週ごとに共通の世界を調査する。', 'Explore a shared world seed for the week.'],
  },
  wander: {
    name: ['探訪の旅', 'Wandering journey', 'たんぼうの たび'],
    hint: [
      '闇の不意打ちを避け、敗北時は町で旅を再開できる。',
      'Avoid surprise attacks in darkness and recover in town after defeat.',
    ],
  },
} satisfies Record<string, { name: Text; hint: Text }>;
export type RunKind = keyof typeof ENCOUNTER_RULES;
export const ADDRESS_NAMES = {
  name: ['名前で呼ぶ', 'Use my name', 'なまえで よぶ'],
  they: ['中性の呼び方', 'They / them', 'ちゅうせいの よびかた'],
  she: ['女性の呼び方', 'She / her', 'じょせいの よびかた'],
  he: ['男性の呼び方', 'He / him', 'だんせいの よびかた'],
} satisfies Record<string, Text>;
export type AddressName = keyof typeof ADDRESS_NAMES;

export const SITE_TITLES = {
  academy: ['埋もれた校庭', 'Sunken schoolyard', 'うもれた こうてい'],
  grove: ['梢の集落', 'Canopy hamlet', 'こずえの しゅうらく'],
  coast: ['波待ちの水車', 'Tidemill', 'なみまちの すいしゃ'],
  alpine: ['雪晶の避難所', 'Snowglass refuge', 'せっしょうの ひなんじょ'],
  ember: ['余熱の工場', 'Ember workshop', 'よねつの こうじょう'],
  sky: ['風読みの観測舎', 'Windwatch station', 'かぜよみの かんそくしゃ'],
} satisfies Record<Biome, Text>;

export const REGION_EPISODES = {
  academy: {
    inquiry: [
      '校庭の泥の下から、違う高さに三本の白線が出てきた。鐘番は、昔の生徒が何を記したのか知りたがっている。',
      'Three white lines emerge from beneath the schoolyard mud. The bellkeeper wants to know what the old students were marking.',
    ],
    record: [
      '白線は洪水の水位だった。一番高い線には「ここまで来れば大人も子どもも二人ずつ運ぶ」と書いてあった。',
      'The lines mark flood levels. The highest one says to start carrying people in pairs, grown-ups and children alike.',
    ],
  },
  grove: {
    inquiry: [
      '枝の渡り廊下には、誰も住んでいないのに洗濯ばさみが並ぶ。持ち主を探して、風で落ちた札を拾うことになった。',
      'Clothespins line an empty treetop walk. You collect the windblown tags to find out who used to live here.',
    ],
    record: [
      '洗濯ばさみは街道の伝言板だった。空いた一か所は、どこの町から来た人でも使える場所だ。',
      'The clothespins formed a message board for travelers. One was kept empty for whoever came next.',
    ],
  },
  coast: {
    inquiry: [
      '引き潮なのに水車が動かない。渡し守は水車の下で、小さな手が描かれた板を大事そうに抱えている。',
      'At low tide the wheel still refuses to turn. Beneath it, the ferryman holds a plank painted with a tiny hand.',
    ],
    record: [
      '板には、昔の渡し守が水車を開ける時刻を手の形で伝える方法が残っていた。遠い岸にも、聞こえない子にも届く合図だ。',
      'The painted hands show when to open the wheel. The signal reaches the far bank and children who cannot hear the bell.',
    ],
  },
  alpine: {
    inquiry: [
      '雪に埋もれた扉の向こうから、湯気の通る細い穴が見える。ここに冬を越した人の記録があるらしい。',
      'A narrow vent pokes through the snow above a buried door. Somewhere inside is a record of the people who wintered here.',
    ],
    record: [
      '名簿の最後の頁は伝言になっていた。「来年の旅人へ。困ったら扉の横を三回たたいて。中に人がいる」。',
      'The last page of the shelter register is a note. “For next winter’s travelers. If you need help, knock beside the door three times. Someone will be inside.”',
    ],
  },
  ember: {
    inquiry: [
      '止まった炉の横で、何十本もの鍋の柄が冷えている。親方が最後にここで何を作ったのか、帳簿が破れていてわからない。',
      'Dozens of cold pot handles lie beside a shuttered furnace. A torn ledger conceals the foreman’s final commission.',
    ],
    record: [
      '最後の注文は避難所の鍋だった。品代の欄には金額の代わりに「温かいうちに食べて」と書いてある。',
      'The final order was a set of pots for refuges. In place of the price, the ledger says, “Eat while it’s warm.”',
    ],
  },
  sky: {
    inquiry: [
      '屋根のない観測舎に、六本の旗とからまった糸が残る。風読みの見習いが、失われた旗の順番を探している。',
      'Six flags and a knot of thread are all that remain in the roofless station. An apprentice wind-reader is piecing together their order.',
    ],
    record: [
      '旗は風向きだけでなく、下の町が無事かを知らせていた。六本目には「返事がなければ、知らせに行く」と刺しゅうされていた。',
      'The flags reported the towns’ safety as well as the wind. The sixth says, “If they send no reply, go and see.”',
    ],
  },
} satisfies Record<Biome, { inquiry: Text; record: Text }>;
