import type { LanguageMode } from '../../../types';

export type Text = readonly [ja: string, en: string, kana?: string];
export function text(language: LanguageMode, copy: Text) {
  return language === 'ENGLISH'
    ? copy[1]
    : language === 'HIRAGANA'
      ? (copy[2] ?? copy[0])
      : copy[0];
}

export const STATS = {
  might: ['体力', 'Might', 'たいりょく'],
  finesse: ['器用', 'Finesse', 'きよう'],
  insight: ['知恵', 'Insight', 'ちえ'],
  presence: ['魅力', 'Presence', 'みりょく'],
} satisfies Record<string, Text>;
export type Stat = keyof typeof STATS;
export const STAT_IDS = Object.keys(STATS) as Stat[];

export const GOODS = {
  herb: { name: ['薬草', 'Herbs'], price: 4 },
  timber: { name: ['木材', 'Timber'], price: 6 },
  ore: { name: ['鉱石', 'Ore'], price: 8 },
  fish: { name: ['魚', 'Fish'], price: 5 },
  grain: { name: ['穀物', 'Grain', 'こくもつ'], price: 4 },
  meat: { name: ['魔獣の肉', 'Beast meat', 'まじゅうの にく'], price: 7 },
  thread: { name: ['魔糸', 'Moonthread'], price: 9 },
  seed: { name: ['野菜の種', 'Seeds'], price: 3 },
  tonic: { name: ['回復薬', 'Tonic'], price: 12 },
  strongTonic: { name: ['濃い回復薬', 'Greater tonic', 'こい かいふくやく'], price: 25 },
  fieldKit: { name: ['野営道具', 'Camp kit', 'やえいどうぐ'], price: 15 },
  lantern: { name: ['灯油', 'Lamp oil'], price: 9 },
  ration: { name: ['温かな弁当', 'Hot meal'], price: 10 },
  relic: { name: ['遺物片', 'Relic shard'], price: 21 },
} satisfies Record<string, { name: Text; price: number }>;
export type Good = keyof typeof GOODS;
export const GOOD_IDS = Object.keys(GOODS) as Good[];
export type Goods = Record<Good, number>;

export const CALLINGS = {
  vanguard: {
    name: ['剣の護り手', 'Vanguard'],
    hint: ['体力の判定＋2。防御後の反撃が得意。', '+2 Might checks and stronger counters.'],
    stat: 'might',
    gear: 'sabre',
    good: 'tonic',
  },
  scout: {
    name: ['道標の斥候', 'Trail Scout'],
    hint: [
      '器用の判定＋2。探索中に使う灯りが長持ち。',
      '+2 Finesse checks. Your lamp lasts longer.',
    ],
    stat: 'finesse',
    gear: 'knife',
    good: 'lantern',
  },
  scholar: {
    name: ['遺跡学徒', 'Relic Scholar'],
    hint: [
      '知恵の判定＋2。技に使う集中の上限が高い。',
      '+2 Insight checks and more Focus for techniques.',
    ],
    stat: 'insight',
    gear: 'wand',
    good: 'lantern',
  },
  envoy: {
    name: ['灯街の交渉人', 'Lantern Envoy'],
    hint: ['魅力の判定＋2。町で信頼を得やすい。', '+2 Presence checks and extra trust in towns.'],
    stat: 'presence',
    gear: 'wand',
    good: 'thread',
  },
  artisan: {
    name: ['歯車の工匠', 'Gearwright'],
    hint: [
      '知恵の判定＋2。装備製作に使う鉱石を節約。',
      '+2 Insight checks. Use less ore when smithing.',
    ],
    stat: 'insight',
    gear: 'hammer',
    good: 'ore',
  },
  naturalist: {
    name: ['野辺の薬師', 'Field Medic'],
    hint: ['器用の判定＋2。採集で薬草を追加獲得。', '+2 Finesse checks. Gather extra herbs.'],
    stat: 'finesse',
    gear: 'knife',
    good: 'herb',
  },
  captain: {
    name: ['波路の荷運び', 'Tide Courier'],
    hint: ['体力の判定＋2。配達の報酬が増える。', '+2 Might checks and better delivery rewards.'],
    stat: 'might',
    gear: 'sabre',
    good: 'fish',
  },
  bard: {
    name: ['夜市の吟遊詩人', 'Market Bard'],
    hint: [
      '魅力の判定＋2。宿で仲間の士気も回復。',
      '+2 Presence checks. Inns restore your party’s resolve.',
    ],
    stat: 'presence',
    gear: 'knife',
    good: 'ration',
  },
} satisfies Record<string, { name: Text; hint: Text; stat: Stat; gear: Weapon; good: Good }>;
export type Calling = keyof typeof CALLINGS;

export const ORIGINS = {
  academy: {
    name: ['学園の奨学生', 'Academy Scholar'],
    hint: ['鐘灯学園街から出発。灯油と弁当を携帯。', 'Start in Bellwick with oil and a meal.'],
    start: [0, 0],
    good: 'ration',
  },
  harbor: {
    name: ['港の手伝い', 'Harbor Hand'],
    hint: ['水鏡港から出発。魚と旅費を携帯。', 'Start in Mirrorharbor with fish and extra coins.'],
    start: [1, 0],
    good: 'fish',
  },
  forest: {
    name: ['森の育ち', 'Forest Born'],
    hint: ['木影の里から出発。種と薬草を携帯。', 'Start in Canopy Hollow with seeds and herbs.'],
    start: [-1, 0],
    good: 'seed',
  },
  hills: {
    name: ['山道の旅人', 'Mountain Traveler'],
    hint: [
      '雪鈴峠から出発。鉱石と防寒具を携帯。',
      'Start in Snowbell Pass with ore and a warm coat.',
    ],
    start: [0, -1],
    good: 'ore',
  },
} satisfies Record<string, { name: Text; hint: Text; start: [number, number]; good: Good }>;
export type Origin = keyof typeof ORIGINS;

export const IDEALS = {
  discovery: {
    name: ['好奇心', 'Discovery'],
    hint: ['初めて訪れる町でひらめきを得る。', 'Gain Inspiration when you reach a new town.'],
  },
  kindness: {
    name: ['思いやり', 'Kindness'],
    hint: [
      '初めて友達ができるたび、ひらめきを得る。',
      'Gain Inspiration when you make a new friend.',
    ],
  },
  ambition: {
    name: ['向上心', 'Ambition'],
    hint: [
      '手ごわい守護者を越えると、ひらめきを得る。',
      'Gain Inspiration when you overcome a guardian.',
    ],
  },
  freedom: {
    name: ['自由', 'Freedom'],
    hint: [
      '別の世界へ渡ると、ひらめきを得る。',
      'Gain Inspiration when you cross into another realm.',
    ],
  },
} satisfies Record<string, { name: Text; hint: Text }>;
export type Ideal = keyof typeof IDEALS;

export const BIOMES = {
  academy: {
    name: ['学園街', 'Academy'],
    art: 'academy',
    local: 'grain',
    sites: [
      ['時計広場', 'Clock Square'],
      ['青灯書庫', 'Blue Lantern Library'],
      ['放課後の温室', 'Glasshouse'],
      ['紅茶の工房', 'Tea Workshop'],
    ],
    ruin: ['旧校舎の地下回廊', 'Old School Catacombs'],
    risk: 0,
    weather: [
      ['晴れ', 'Clear'],
      ['小雨', 'Drizzle'],
      ['霞', 'Haze'],
    ],
  },
  grove: {
    name: ['樹林', 'Woodlands'],
    art: 'grove',
    local: 'herb',
    sites: [
      ['樹冠の市場', 'Canopy Market'],
      ['雨音の薬園', 'Rain Garden'],
      ['木橋の宿', 'Footbridge Inn'],
      ['森番の広場', 'Rangers’ Green'],
    ],
    ruin: ['根の神殿', 'Temple of Roots'],
    risk: 1,
    weather: [
      ['木漏れ日', 'Dappled sun'],
      ['霧', 'Mist'],
      ['通り雨', 'Showers'],
    ],
  },
  coast: {
    name: ['海岸', 'Coast'],
    art: 'coast',
    local: 'fish',
    sites: [
      ['白帆の波止場', 'White Sail Pier'],
      ['浮き市', 'Floating Market'],
      ['窓辺の食堂', 'Harbor Kitchen'],
      ['岬の灯台', 'Headland Light'],
    ],
    ruin: ['潮汐の聖堂', 'Tidal Cathedral'],
    risk: 1,
    weather: [
      ['潮風', 'Sea breeze'],
      ['曇り', 'Overcast'],
      ['晴れ間', 'Sunbreak'],
    ],
  },
  alpine: {
    name: ['高山', 'Highlands'],
    art: 'alpine',
    local: 'ore',
    sites: [
      ['稜線の宿', 'Ridge Inn'],
      ['雪棚の鍛冶場', 'Snowledge Forge'],
      ['冬囲いの市', 'Winter Market'],
      ['山岳観測所', 'Peak Station'],
    ],
    ruin: ['銀晶の坑道', 'Silverglass Mine'],
    risk: 2,
    weather: [
      ['快晴', 'Clear'],
      ['雪', 'Snow'],
      ['薄曇り', 'Cloud cover'],
    ],
  },
  ember: {
    name: ['赤岩峡谷', 'Red Canyons'],
    art: 'ember',
    local: 'thread',
    sites: [
      ['夕映えの市', 'Dusk Bazaar'],
      ['水時計の宿', 'Waterclock Inn'],
      ['赤銅の炉', 'Copper Furnace'],
      ['巡礼の井戸', 'Pilgrim Well'],
    ],
    ruin: ['眠れる歯車炉', 'Sleeping Gearworks'],
    risk: 2,
    weather: [
      ['乾いた風', 'Dry wind'],
      ['夕立', 'Sudden rain'],
      ['快晴', 'Clear'],
    ],
  },
  sky: {
    name: ['浮島', 'Skylands'],
    art: 'sky',
    local: 'thread',
    sites: [
      ['空橋の発着場', 'Skybridge Landing'],
      ['雲海茶房', 'Cloud Tea House'],
      ['真鍮の気象台', 'Brass Observatory'],
      ['月糸の市場', 'Moonthread Market'],
    ],
    ruin: ['星見台の迷宮', 'Starlight Labyrinth'],
    risk: 3,
    weather: [
      ['青空', 'Blue skies'],
      ['上昇気流', 'Updraft'],
      ['雲海', 'Sea of clouds'],
    ],
  },
} satisfies Record<
  string,
  { name: Text; art: string; local: Good; sites: Text[]; ruin: Text; risk: number; weather: Text[] }
>;
export type Biome = keyof typeof BIOMES;
export const BIOME_IDS = Object.keys(BIOMES) as Biome[];

export const RESIDENT_ROLES = {
  host: {
    job: ['宿の主人', 'Innkeeper'],
    lines: [
      ['旅人の噂を集めるのも宿の仕事ね。', 'Keeping track of travelers is part of running an inn.'],
      [
        '窓際は空けてあるよ。風の音がよく聞こえる席だ。',
        'I kept the window seat free. You can hear the wind from there.',
      ],
      ['今夜も食事を温めておくよ。', 'I’ll keep something warm for you tonight.'],
    ],
    gift: 'ration',
    stat: 'presence',
  },
  broker: {
    job: ['市の仲買人', 'Market Broker'],
    lines: [
      [
        '朝市の値段で今日の天気がわかるよ。',
        'I can tell what weather we’ll get from the morning prices.',
      ],
      [
        'あんたの見立て、当たったね。次の市では一緒に仕入れようか。',
        'You called it. Want to source goods together next market day?',
      ],
      [
        '帳簿を見せるよ。最初の一行は、私の屋台を買った日だ。',
        'Here’s my ledger. The first line is from the day I bought my stall.',
      ],
    ],
    gift: 'grain',
    stat: 'presence',
  },
  smith: {
    job: ['町の工匠', 'Town Smith'],
    lines: [
      [
        '良い刃にはね、手首へ返る音がある。聞いてごらん。',
        'A good blade carries a note back to the wrist. Listen.',
      ],
      [
        '前に預かった鉱石で、君に合う金具を試してみた。',
        'I tried forging a fitting for you with the ore you brought.',
      ],
      [
        '工房の鍵を渡しておく。冷ました炉ならいつでも使える。',
        'Take the workshop key. The forge is yours whenever it’s cold.',
      ],
    ],
    gift: 'ore',
    stat: 'might',
  },
  keeper: {
    job: ['道の見張り', 'Road Warden'],
    lines: [
      [
        '道標が風で向きを変えることがある。地形も覚えておくといい。',
        'Wind turns the signposts. Best to learn the shape of the land too.',
      ],
      [
        '君となら、閉じた見張り台まで行けるかもしれない。',
        'With you beside me, I might make it to the shuttered watchtower.',
      ],
      [
        '迷った夜は火を二度振ってくれ。どこでも見つけに行く。',
        'If you get lost after dark, swing your lamp twice. I’ll find you.',
      ],
    ],
    gift: 'lantern',
    stat: 'finesse',
  },
  reader: {
    job: ['郷土の聞き書き手', 'Local Historian'],
    lines: [
      [
        'この町の昔話は、聞く家ごとに結末が違うんだ。',
        'Every household tells a different ending to our old stories.',
      ],
      [
        '古い扉の音を覚えている？ 記号と同じくらい大事な手がかりだよ。',
        'Remember how that old door sounded? That matters as much as the symbols.',
      ],
      [
        '君の旅も書いていいかな。話したくなったところからでいいよ。',
        'May I write down your journey? Start wherever you feel like.',
      ],
    ],
    gift: 'relic',
    stat: 'insight',
  },
  grower: {
    job: ['種と薬草の世話役', 'Seedkeeper'],
    lines: [
      [
        '帰ってくるまで、土が水を離さない植え方を教えようか。',
        'Want to see how to plant so the soil holds water until you return?',
      ],
      ['芽が出たんだ。君が持ってきてくれた種から。', 'They sprouted, the seeds you brought me.'],
      [
        '新しい株に君の名前をつけたい。小さくて丈夫な花なんだよ。',
        'I’d like to name a new plant after you. It’s small and hardy.',
      ],
    ],
    gift: 'seed',
    stat: 'insight',
  },
} satisfies Record<string, { job: Text; lines: [Text, Text, Text]; gift: Good; stat: Stat }>;
export type ResidentRole = keyof typeof RESIDENT_ROLES;
export const RESIDENT_ROLE_IDS = Object.keys(RESIDENT_ROLES) as ResidentRole[];

export const RECIPES = {
  tonic: { name: ['薬草を調合', 'Brew tonic'], cost: { herb: 2 }, good: 'tonic' },
  ration: { name: ['弁当を作る', 'Cook a meal'], cost: { grain: 1, fish: 1 }, good: 'ration' },
  lantern: {
    name: ['灯油を精製', 'Refine lamp oil'],
    cost: { herb: 1, thread: 1 },
    good: 'lantern',
  },
  seed: { name: ['穀物から種を採る', 'Save seeds from grain'], cost: { grain: 1 }, good: 'seed' },
} satisfies Record<string, { name: Text; cost: Partial<Goods>; good: Good }>;
export type Recipe = keyof typeof RECIPES;

export const WEAPONS = {
  sabre: { name: ['旅路のサーベル', 'Road Sabre'], style: 'steel', stat: 'might', effect: 'edge' },
  knife: { name: ['風読みの短剣', 'Wind Knife'], style: 'steel', stat: 'finesse', effect: 'quick' },
  wand: {
    name: ['星灰の指揮杖', 'Star Ash Wand'],
    style: 'arcane',
    stat: 'insight',
    effect: 'spark',
  },
  hammer: { name: ['工匠の鎚', 'Artisan Hammer'], style: 'steel', stat: 'might', effect: 'break' },
  spear: { name: ['風渡りの槍', 'Gale Pike', 'かぜわたりの やり'], style: 'wind', stat: 'might', effect: 'break' },
  bow: { name: ['木霊の弓', 'Echo Bow', 'こだまの ゆみ'], style: 'wind', stat: 'finesse', effect: 'quick' },
  staff: { name: ['月読の杖', 'Moonreader Staff', 'つきよみの つえ'], style: 'arcane', stat: 'insight', effect: 'spark' },
} satisfies Record<string, { name: Text; style: DamageType; stat: Stat; effect: string }>;
export type Weapon = keyof typeof WEAPONS;
export type DamageType = 'steel' | 'arcane' | 'wind';
export const COMPANION_ROLES = {
  host: { style: 'arcane', healer: true, ward: false, copy: ['負傷者へ手当て', 'Treats injured allies', 'けがを てあて'] },
  broker: { style: 'wind', healer: false, ward: false, copy: ['風属性のけん制', 'Wind attacks and bargaining', 'かぜぞくせいの けんせい'] },
  smith: { style: 'steel', healer: false, ward: true, copy: ['前衛で攻撃を受ける', 'Takes hits on the front line', 'ぜんえいで うける'] },
  keeper: { style: 'steel', healer: false, ward: true, copy: ['前衛で攻撃を受ける', 'Takes hits on the front line', 'ぜんえいで うける'] },
  reader: { style: 'arcane', healer: false, ward: false, copy: ['術属性で攻撃', 'Attacks with arcane magic', 'じゅつぞくせいで こうげき'] },
  grower: { style: 'wind', healer: true, ward: false, copy: ['薬草で手当て', 'Heals with herbs', 'やくそうで てあて'] },
} satisfies Record<ResidentRole, { style: DamageType; healer: boolean; ward: boolean; copy: Text }>;

export type Slot = 'weapon' | 'coat' | 'charm';
export const SLOT_NAMES = {
  weapon: ['武器', 'Weapon'],
  coat: ['防具', 'Armor'],
  charm: ['護符', 'Charm'],
} satisfies Record<Slot, Text>;
export const RARITIES = {
  common: ['並品', 'Common'],
  fine: ['良品', 'Fine'],
  rare: ['希少', 'Rare'],
  relic: ['伝承', 'Relic'],
} satisfies Record<string, Text>;
export type Rarity = keyof typeof RARITIES;
export const AFFIXES = {
  sturdy: { name: ['鉄樹', 'Ironwood'], hint: ['防御＋1', '+1 Armor'], stat: null },
  quick: { name: ['風切', 'Windcut'], hint: ['器用＋1', '+1 Finesse'], stat: 'finesse' },
  bright: { name: ['星灯', 'Starlit'], hint: ['知恵＋1', '+1 Insight'], stat: 'insight' },
  kindly: { name: ['友灯', 'Friendlight'], hint: ['魅力＋1', '+1 Presence'], stat: 'presence' },
  vigor: { name: ['生命樹', 'Lifewood'], hint: ['最大体力＋4', '+4 Max HP'], stat: null },
  focus: { name: ['深呼吸', 'Stillwater'], hint: ['最大集中＋2', '+2 Max Focus'], stat: null },
} satisfies Record<string, { name: Text; hint: Text; stat: Stat | null }>;
export type Affix = keyof typeof AFFIXES;

export const MASTERWORKS = {
  archiveWand: { name: ['書庫の星杖', 'Archive wand', 'しょこの ほしづえ'], hint: ['術属性ダメージ＋2', '+2 arcane damage', 'じゅつの ダメージ＋2'], slot: 'weapon', art: 'masterwork-archive-wand' },
  groveVest: { name: ['樹冠の外套', 'Canopy coat', 'じゅかんの がいとう'], hint: ['採集・釣り・食材探しの収量＋1', '+1 yield from gathering, fishing, or foraging', 'さいしゅうなどの しゅうりょう＋1'], slot: 'coat', art: 'masterwork-canopy-coat' },
  lowTideCharm: { name: ['干潮のお守り', 'Low-tide charm', 'かんちょうの おまもり'], hint: ['戦闘中の交渉判定＋2', '+2 to combat parley checks', 'せんとうちゅうの こうしょう＋2'], slot: 'charm', art: 'masterwork-low-tide-charm' },
  rimeCoat: { name: ['銀晶の鎧', 'Silverglass armor', 'ぎんしょうの よろい'], hint: ['大技で受けるダメージ−3', 'Take 3 less damage from heavy attacks', 'おおわざで うける ダメージ−3'], slot: 'coat', art: 'masterwork-silverglass-armor' },
  kilnHammer: { name: ['炉番の大鎚', 'Kiln hammer', 'ろばんの おおづち'], hint: ['大技のダメージ＋3', '+3 damage with heavy attacks', 'おおわざの ダメージ＋3'], slot: 'weapon', art: 'masterwork-kiln-hammer' },
  skyPike: { name: ['星渡りの槍', 'Starcross pike', 'ほしわたりの やり'], hint: ['防御の構えを取る敵にダメージ＋3', '+3 damage against bracing enemies', 'ぼうぎょする てきに ダメージ＋3'], slot: 'weapon', art: 'masterwork-starcross-pike' },
} satisfies Record<string, { name: Text; hint: Text; slot: Slot; art: string }>;
export type Masterwork = keyof typeof MASTERWORKS;

export type EnemyTemplate = {
  name: Text;
  theme: Biome;
  hp: number;
  attack: number;
  weak: DamageType;
  resist: DamageType;
  pattern: readonly Intent[];
  image: number;
  artKey?: string;
  harvest?: Good;
  warden?: boolean;
};
export type Intent = 'strike' | 'heavy' | 'brace' | 'hex' | 'drain' | 'mend';
export const INTENTS = {
  strike: ['素早い一撃', 'Quick strike'],
  heavy: ['大技の構え', 'Winding up'],
  brace: ['防御の構え', 'Bracing'],
  hex: ['集中を封じる術', 'Focus hex'],
  drain: ['灯りを奪う', 'Dousing your lamp'],
  mend: ['傷を癒やす', 'Mending'],
} satisfies Record<Intent, Text>;
function creature(
  artKey: string, name: Text, theme: Biome, hp: number, attack: number,
  weak: DamageType, resist: DamageType, pattern: Intent[], harvest: Good,
): EnemyTemplate {
  return { name, theme, hp, attack, weak, resist, pattern, image: 0, artKey, harvest };
}

function warden(artKey: string, name: Text, theme: Biome, hp: number, attack: number,
    weak: DamageType, resist: DamageType, pattern: Intent[]): EnemyTemplate {
  return { name, theme, hp, attack, weak, resist, pattern, image: 12, artKey, warden: true };
}

const REGIONAL_WARDENS = {
  academy: warden('warden-hourglass-prefect', ['砂時計の監督生', 'Hourglass prefect', 'すなどけいの かんとくせい'], 'academy', 27, 5,
    'arcane', 'steel', ['brace', 'heavy', 'hex', 'strike']),
  grove: warden('warden-rootcrown', ['根冠の森王', 'Rootcrown elder', 'ねかんむりの もりおう'], 'grove', 35, 6,
    'steel', 'arcane', ['mend', 'brace', 'strike', 'heavy']),
  coast: warden('warden-tideglass', ['潮硝子の海竜', 'Tideglass dragon', 'しおガラスの かいりゅう'], 'coast', 32, 7,
    'wind', 'steel', ['drain', 'hex', 'heavy', 'drain', 'strike']),
  alpine: warden('warden-frostmirror', ['霜鏡の石像', 'Frostmirror gargoyle', 'しもかがみの せきぞう'], 'alpine', 39, 7,
    'steel', 'wind', ['brace', 'strike', 'brace', 'heavy', 'mend']),
  ember: warden('warden-furnace', ['金床炉の竜', 'Anvil-furnace dragon', 'かなとこ ろの りゅう'], 'ember', 40, 8,
    'arcane', 'steel', ['heavy', 'strike', 'heavy', 'drain']),
  sky: warden('warden-astral-griffin', ['星翼のグリフォン', 'Astral griffin', 'ほしつばさの グリフォン'], 'sky', 37, 8,
    'wind', 'arcane', ['hex', 'mend', 'drain', 'heavy', 'strike']),
} satisfies Record<Biome, EnemyTemplate>;

export const FOES: EnemyTemplate[] = [
  {
    name: ['紙羽の小妖', 'Paperwing Sprite'],
    theme: 'academy',
    hp: 8,
    attack: 3,
    weak: 'wind',
    resist: 'arcane',
    pattern: ['strike', 'drain', 'strike'],
    image: 0,
  },
  {
    name: ['忘れ名の甲冑', 'Nameless Armor'],
    theme: 'academy',
    hp: 13,
    attack: 4,
    weak: 'arcane',
    resist: 'steel',
    pattern: ['brace', 'strike', 'heavy'],
    image: 1,
  },
  {
    name: ['棘森の番獣', 'Briar Watchbeast'],
    theme: 'grove',
    hp: 12,
    attack: 3,
    weak: 'steel',
    resist: 'wind',
    pattern: ['strike', 'heavy', 'mend'],
    image: 2,
  },
  {
    name: ['胞子の灯精', 'Sporelight Wisp'],
    theme: 'grove',
    hp: 10,
    attack: 3,
    weak: 'wind',
    resist: 'steel',
    pattern: ['hex', 'mend', 'strike'],
    image: 3,
  },
  {
    name: ['波紋ヤドカリ', 'Ripple Hermit'],
    theme: 'coast',
    hp: 14,
    attack: 4,
    weak: 'arcane',
    resist: 'steel',
    pattern: ['brace', 'heavy', 'strike'],
    image: 4,
  },
  {
    name: ['月潮の亡霊', 'Moontide Shade'],
    theme: 'coast',
    hp: 10,
    attack: 4,
    weak: 'wind',
    resist: 'arcane',
    pattern: ['drain', 'strike', 'hex'],
    image: 5,
  },
  {
    name: ['銀晶トカゲ', 'Silverglass Drake'],
    theme: 'alpine',
    hp: 14,
    attack: 4,
    weak: 'steel',
    resist: 'arcane',
    pattern: ['strike', 'brace', 'heavy'],
    image: 6,
  },
  {
    name: ['霜の巨像', 'Rime Colossus'],
    theme: 'alpine',
    hp: 18,
    attack: 5,
    weak: 'arcane',
    resist: 'steel',
    pattern: ['brace', 'heavy', 'strike'],
    image: 7,
  },
  {
    name: ['炉の牽引機', 'Furnace Hauler'],
    theme: 'ember',
    hp: 15,
    attack: 5,
    weak: 'arcane',
    resist: 'steel',
    pattern: ['strike', 'brace', 'heavy'],
    image: 8,
  },
  {
    name: ['銅煙の小鬼', 'Coppersmoke Imp'],
    theme: 'ember',
    hp: 11,
    attack: 4,
    weak: 'wind',
    resist: 'arcane',
    pattern: ['drain', 'hex', 'strike'],
    image: 9,
  },
  {
    name: ['風紋のワイバーン', 'Windmark Wyvern'],
    theme: 'sky',
    hp: 17,
    attack: 5,
    weak: 'steel',
    resist: 'wind',
    pattern: ['strike', 'heavy', 'mend'],
    image: 10,
  },
  {
    name: ['観測台の影', 'Observatory Shade'],
    theme: 'sky',
    hp: 13,
    attack: 4,
    weak: 'wind',
    resist: 'steel',
    pattern: ['hex', 'drain', 'strike'],
    image: 11,
  },
  {
    name: ['境界の守護者', 'Threshold Warden'],
    theme: 'academy',
    hp: 26,
    attack: 5,
    weak: 'arcane',
    resist: 'steel',
    pattern: ['brace', 'heavy', 'hex', 'strike'],
    image: 12,
    warden: true,
  },
  creature('vellum-wasp', ['羊皮紙バチ', 'Vellum wasp', 'ようひしバチ'], 'academy', 11, 4,
    'steel', 'wind', ['hex', 'strike', 'drain', 'strike'], 'thread'),
  creature('clock-sentinel', ['青鐘の番兵', 'Blue-clock sentinel', 'あおがねの ばんぺい'], 'academy', 24, 5,
    'arcane', 'steel', ['brace', 'brace', 'heavy', 'strike'], 'ore'),
  creature('bramble-hare', ['棘冠ウサギ', 'Bramble hare', 'とげかんむりウサギ'], 'grove', 13, 4,
    'wind', 'arcane', ['strike', 'mend', 'heavy', 'strike'], 'herb'),
  creature('moss-colossus', ['苔の巨守', 'Moss guardian', 'こけの きょしゅ'], 'grove', 25, 5,
    'steel', 'wind', ['mend', 'heavy', 'brace', 'strike'], 'timber'),
  creature('brine-eel', ['雷潮ウナギ', 'Brine eel', 'らいちょうウナギ'], 'coast', 15, 5,
    'wind', 'arcane', ['hex', 'drain', 'strike', 'hex'], 'fish'),
  creature('barnacle-knight', ['貝冠の騎士', 'Barnacle knight', 'かいかんむりの きし'], 'coast', 28, 6,
    'arcane', 'steel', ['brace', 'heavy', 'mend', 'strike'], 'ore'),
  creature('rime-lynx', ['霜尾ヤマネコ', 'Rime lynx', 'しもおヤマネコ'], 'alpine', 18, 6,
    'steel', 'wind', ['strike', 'heavy', 'drain', 'strike'], 'meat'),
  creature('shard-crawler', ['鉱晶ヤスデ', 'Shard crawler', 'こうしょうヤスデ'], 'alpine', 28, 5,
    'arcane', 'steel', ['brace', 'hex', 'mend', 'heavy'], 'ore'),
  creature('slag-salamander', ['熾火トカゲ', 'Slag salamander', 'おきびトカゲ'], 'ember', 20, 6,
    'wind', 'steel', ['drain', 'heavy', 'mend', 'strike'], 'meat'),
  creature('copper-mimic', ['銅釜の擬箱', 'Copper mimic', 'どうがまの ぎばこ'], 'ember', 26, 7,
    'arcane', 'wind', ['brace', 'drain', 'heavy', 'hex'], 'relic'),
  creature('cloud-ray', ['雲渡りエイ', 'Cloud ray', 'くもわたりエイ'], 'sky', 20, 6,
    'steel', 'arcane', ['mend', 'hex', 'strike', 'drain'], 'thread'),
  creature('star-kite', ['星衣の凧獣', 'Starlit kite', 'ほしごろもの たこじゅう'], 'sky', 25, 7,
    'wind', 'arcane', ['drain', 'hex', 'heavy', 'strike'], 'relic'),
  ...Object.values(REGIONAL_WARDENS),
];

export const regionalWardenIndex = (biome: Biome) => FOES.indexOf(REGIONAL_WARDENS[biome]);

export const creatureArt = (template: EnemyTemplate) =>
  template.artKey ? 'expedition/' + template.artKey : template.image === 12 ? 'foe-5' : 'bestiary-' + template.image;

export const DECLARATIONS = {
  might: {
    name: ['押し通す', 'Use force'],
    town: ['力仕事を引き受ける', 'Take on a demanding job'],
    dungeon: ['障害を力で突破する', 'Force your way through'],
  },
  finesse: {
    name: ['手先・隠密', 'Use finesse'],
    town: ['細工や運搬で工夫する', 'Improvise a repair or delivery'],
    dungeon: ['忍び足や道具で切り抜ける', 'Sneak past or use tools'],
  },
  insight: {
    name: ['観察・知識', 'Use insight'],
    town: ['調べものを引き受ける', 'Investigate a local lead'],
    dungeon: ['仕掛けや弱点を調べる', 'Read the mechanism or find a weakness'],
  },
  presence: {
    name: ['会話・交渉', 'Use presence'],
    town: ['町の人と交渉する', 'Negotiate with the locals'],
    dungeon: ['霊や守護者に働きかける', 'Reason with a spirit or guardian'],
  },
} satisfies Record<Stat, { name: Text; town: Text; dungeon: Text }>;
