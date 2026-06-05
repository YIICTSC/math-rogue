export type OmegaSide = 'player' | 'enemy';
export type OmegaShape = 'triangle' | 'square' | 'rect' | 'circle' | 'hex' | 'relic' | 'item' | 'hero' | 'enemy';

export type OmegaCardEffect =
  | 'ENEMY_DOUBLE_TURN'
  | 'GRAVITY_UP'
  | 'ENEMY_NEXT_HEAVY'
  | 'PLAYER_NEXT_LIGHT'
  | 'RESET_TILT'
  | 'ENEMY_DROP_JITTER'
  | 'PLAYER_FINE_CONTROL'
  | 'FRICTION_UP'
  | 'FRICTION_DOWN'
  | 'IGNORE_FALL_ONCE';

export interface OmegaCollider {
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
}

export interface OmegaMaterialDefinition {
  id: string;
  name: string;
  shape: OmegaShape;
  mass: number;
  width: number;
  height: number;
  friction: number;
  restitution: number;
  color: string;
  label: string;
  description: string;
  rewardOnly?: boolean;
  colliders: OmegaCollider[];
}

export interface OmegaCardDefinition {
  id: string;
  name: string;
  description: string;
  effect: OmegaCardEffect;
  rarity: 'COMMON' | 'RARE' | 'HERO';
  color: string;
}

export interface OmegaHeroDefinition {
  id: string;
  characterId: string;
  name: string;
  title: string;
  intro: string;
  color: string;
  signatureCardId: string;
  starterMaterialIds: string[];
}

export interface OmegaEnemyDefinition {
  id: string;
  name: string;
  title: string;
  mapEffectName: string;
  mapEffectDescription: string;
  color: string;
  materialBias: number;
  dropSkill: number;
}

export const OMEGA_BASE_MATERIAL_IDS = ['tri-basic', 'box-basic', 'rect-basic'];

export const OMEGA_MATERIALS: OmegaMaterialDefinition[] = [
  {
    id: 'tri-basic',
    name: '三角形',
    shape: 'triangle',
    mass: 2.4,
    width: 52,
    height: 48,
    friction: 0.62,
    restitution: 0.14,
    color: '#facc15',
    label: '△',
    description: '軽く、重心が低い。最初の配置に向く。',
    colliders: [{ x: 0, y: 6, width: 42, height: 36 }],
  },
  {
    id: 'box-basic',
    name: '四角形',
    shape: 'square',
    mass: 3.2,
    width: 50,
    height: 50,
    friction: 0.74,
    restitution: 0.08,
    color: '#60a5fa',
    label: '□',
    description: '扱いやすい標準素材。衝突後も安定しやすい。',
    colliders: [{ x: 0, y: 0, width: 50, height: 50 }],
  },
  {
    id: 'rect-basic',
    name: '長方形',
    shape: 'rect',
    mass: 4.1,
    width: 72,
    height: 34,
    friction: 0.68,
    restitution: 0.1,
    color: '#34d399',
    label: '▭',
    description: '横幅があり、傾いた土台では滑りやすい。',
    colliders: [{ x: 0, y: 0, width: 72, height: 34 }],
  },
  {
    id: 'circle-chalk',
    name: 'チョーク円柱',
    shape: 'circle',
    mass: 1.8,
    width: 42,
    height: 42,
    friction: 0.36,
    restitution: 0.28,
    color: '#e5e7eb',
    label: '○',
    description: '軽いが転がりやすい。微調整用。',
    rewardOnly: true,
    colliders: [{ x: 0, y: 0, width: 42, height: 42, radius: 21 }],
  },
  {
    id: 'hex-medal',
    name: '努力メダル',
    shape: 'hex',
    mass: 5.2,
    width: 58,
    height: 58,
    friction: 0.7,
    restitution: 0.06,
    color: '#f97316',
    label: '⬡',
    description: '重く、面で止まりやすい報酬素材。',
    rewardOnly: true,
    colliders: [
      { x: 5, y: 5, width: 48, height: 48 },
      { x: 0, y: 16, width: 58, height: 26 },
    ],
  },
  {
    id: 'relic-orb',
    name: 'レリック: 天球儀',
    shape: 'relic',
    mass: 6.4,
    width: 62,
    height: 62,
    friction: 0.52,
    restitution: 0.18,
    color: '#a78bfa',
    label: 'R',
    description: '学習ローグのレリック型素材。高重量だが丸く滑る。',
    rewardOnly: true,
    colliders: [{ x: 3, y: 3, width: 56, height: 56, radius: 28 }],
  },
  {
    id: 'item-bag',
    name: 'アイテム: 体操袋',
    shape: 'item',
    mass: 3.7,
    width: 54,
    height: 64,
    friction: 0.82,
    restitution: 0.04,
    color: '#fb7185',
    label: 'I',
    description: 'アイテム型素材。柔らかく、摩擦が高い。',
    rewardOnly: true,
    colliders: [
      { x: 8, y: 2, width: 38, height: 20 },
      { x: 4, y: 20, width: 46, height: 42 },
    ],
  },
  {
    id: 'hero-standee',
    name: '主人公スタンド',
    shape: 'hero',
    mass: 4.8,
    width: 58,
    height: 76,
    friction: 0.64,
    restitution: 0.07,
    color: '#22d3ee',
    label: 'H',
    description: '小学編・高校編共通の主人公イラスト素材。複数コライダーで近似。',
    rewardOnly: true,
    colliders: [
      { x: 19, y: 2, width: 20, height: 20, radius: 10 },
      { x: 13, y: 20, width: 32, height: 34 },
      { x: 8, y: 54, width: 44, height: 20 },
    ],
  },
  {
    id: 'enemy-standee',
    name: '敵スタンド',
    shape: 'enemy',
    mass: 5.6,
    width: 66,
    height: 74,
    friction: 0.58,
    restitution: 0.1,
    color: '#f43f5e',
    label: 'E',
    description: '敵イラスト素材。見た目に近い複数コライダーで近似。',
    rewardOnly: true,
    colliders: [
      { x: 20, y: 0, width: 26, height: 24, radius: 13 },
      { x: 10, y: 22, width: 46, height: 34 },
      { x: 4, y: 56, width: 58, height: 18 },
    ],
  },
];

export const OMEGA_CARDS: OmegaCardDefinition[] = [
  { id: 'enemy-double-turn', name: '連続指名', effect: 'ENEMY_DOUBLE_TURN', description: '相手を2回連続ターンにする。', rarity: 'COMMON', color: 'from-rose-500 to-red-800' },
  { id: 'gravity-up', name: '重力チャイム', effect: 'GRAVITY_UP', description: '1ターンだけ重力を強くする。', rarity: 'COMMON', color: 'from-slate-500 to-zinc-900' },
  { id: 'enemy-next-heavy', name: '鉛の宿題', effect: 'ENEMY_NEXT_HEAVY', description: '相手の次の素材を重くする。', rarity: 'COMMON', color: 'from-stone-500 to-neutral-900' },
  { id: 'player-next-light', name: '軽量化ノート', effect: 'PLAYER_NEXT_LIGHT', description: '自分の次の素材を軽くする。', rarity: 'COMMON', color: 'from-sky-400 to-blue-800' },
  { id: 'reset-tilt', name: '水平定規', effect: 'RESET_TILT', description: 'シーソーの傾きを少し戻す。', rarity: 'RARE', color: 'from-emerald-400 to-teal-800' },
  { id: 'enemy-drop-jitter', name: '横風アナウンス', effect: 'ENEMY_DROP_JITTER', description: '相手の落下位置をランダムにずらす。', rarity: 'RARE', color: 'from-cyan-400 to-indigo-800' },
  { id: 'player-fine-control', name: '精密メモリ', effect: 'PLAYER_FINE_CONTROL', description: '自分の落下位置を微調整しやすくする。', rarity: 'COMMON', color: 'from-violet-400 to-fuchsia-800' },
  { id: 'friction-up', name: 'すべり止めワックス', effect: 'FRICTION_UP', description: '1ターンだけ素材の摩擦を上げる。', rarity: 'COMMON', color: 'from-lime-400 to-green-800' },
  { id: 'friction-down', name: 'ツルツル廊下', effect: 'FRICTION_DOWN', description: '1ターンだけ素材が滑りやすくなる。', rarity: 'RARE', color: 'from-blue-300 to-slate-800' },
  { id: 'ignore-fall-once', name: '奇跡の受け皿', effect: 'IGNORE_FALL_ONCE', description: '一度だけ落下判定を無効化する。', rarity: 'RARE', color: 'from-yellow-300 to-amber-800' },
];

export const OMEGA_HEROES: OmegaHeroDefinition[] = [
  {
    id: 'striker',
    characterId: 'WARRIOR',
    name: '鉛筆ストライカー',
    title: '攻めの配置',
    intro: '外側に落とせば勝機は近い。崩れる前に崩す！',
    color: 'from-yellow-400 to-orange-700',
    signatureCardId: 'enemy-drop-jitter',
    starterMaterialIds: OMEGA_BASE_MATERIAL_IDS,
  },
  {
    id: 'keeper',
    characterId: 'CARETAKER',
    name: '消しゴムキーパー',
    title: '摩擦の守り',
    intro: '足場を読むのも飼育委員の仕事だよ。',
    color: 'from-emerald-400 to-teal-800',
    signatureCardId: 'friction-up',
    starterMaterialIds: OMEGA_BASE_MATERIAL_IDS,
  },
  {
    id: 'scholar',
    characterId: 'LIBRARIAN',
    name: '参考書スカラー',
    title: '傾き制御',
    intro: '水平を保てば、勝負はページ通りに進む。',
    color: 'from-sky-400 to-indigo-800',
    signatureCardId: 'reset-tilt',
    starterMaterialIds: OMEGA_BASE_MATERIAL_IDS,
  },
  {
    id: 'trickster',
    characterId: 'BARD',
    name: '放送トリックスター',
    title: 'ターン操作',
    intro: '校内放送で、相手のリズムを崩してみせる。',
    color: 'from-fuchsia-400 to-pink-800',
    signatureCardId: 'enemy-double-turn',
    starterMaterialIds: OMEGA_BASE_MATERIAL_IDS,
  },
];

export const OMEGA_ENEMIES: OmegaEnemyDefinition[] = [
  {
    id: 'wax-master',
    name: '廊下のワックス魔',
    title: '滑走するライバル',
    mapEffectName: '床ツルツル',
    mapEffectDescription: '敵ターン開始時、摩擦が少し下がりやすい。',
    color: 'from-blue-500 to-slate-900',
    materialBias: 0.15,
    dropSkill: 0.62,
  },
  {
    id: 'clock-rival',
    name: '休み時間を奪う時計',
    title: '重力を刻むライバル',
    mapEffectName: '重力ベル',
    mapEffectDescription: '3ターン目以降、敵の素材が少し重くなる。',
    color: 'from-amber-500 to-red-900',
    materialBias: 0.28,
    dropSkill: 0.7,
  },
  {
    id: 'notebook-rival',
    name: 'ちぎれたノート',
    title: '風を読むライバル',
    mapEffectName: '紙吹雪',
    mapEffectDescription: '敵の落下位置が読みにくい。',
    color: 'from-violet-500 to-slate-900',
    materialBias: 0.08,
    dropSkill: 0.54,
  },
];

export const getOmegaMaterial = (id: string) => OMEGA_MATERIALS.find(material => material.id === id) || OMEGA_MATERIALS[0];
export const getOmegaCard = (id: string) => OMEGA_CARDS.find(card => card.id === id) || OMEGA_CARDS[0];
