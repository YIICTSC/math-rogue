export type SpriteAuditAssetKind = 'sprite' | 'sheet' | 'ui';

export interface SpriteAuditAssetDefinition {
  path: string;
  label: string;
  kind: SpriteAuditAssetKind;
  note?: string;
}

export interface MiniGameSpriteAuditDefinition {
  note: string;
  assets: SpriteAuditAssetDefinition[];
}

const asset = (
  path: string,
  label: string,
  kind: SpriteAuditAssetKind = 'sheet',
  note?: string,
): SpriteAuditAssetDefinition => ({ path, label, kind, note });

const numbered = (
  prefix: string,
  count: number,
  label: string,
  extension = 'webp',
  start = 1,
): SpriteAuditAssetDefinition[] => Array.from({ length: count }, (_, index) => {
  const number = String(index + start).padStart(2, '0');
  return asset(`${prefix}-${number}.${extension}`, `${label} ${number}`);
});

const furaiSheets = (): SpriteAuditAssetDefinition[] => [
  asset('sprites/furai-sfc-v2-hero-base-5x5.webp', '主人公 5×5'),
  ...['1', '2', '3', '4'].map(number => asset(`sprites/furai-sfc-v2-enemy-5x5-${number}.webp`, `敵シート ${number}`)),
  asset('sprites/furai-sfc-v2-weapons-5x5-1.webp', '武器シート 01'),
  asset('sprites/furai-sfc-v2-weapons-5x5-2.webp', '武器シート 02'),
  asset('sprites/furai-sfc-v2-armor-5x5-1.webp', '防具シート 01'),
  asset('sprites/furai-sfc-v2-armor-5x5-2.webp', '防具シート 02'),
  asset('sprites/furai-sfc-v2-items-5x5-1.webp', 'アイテムシート 01'),
  asset('sprites/furai-sfc-v2-items-5x5-2.webp', 'アイテムシート 02'),
  asset('sprites/furai-sfc-v2-effects-5x5.webp', 'ダンジョン演出'),
];

const pokerSheets = (): SpriteAuditAssetDefinition[] => [
  asset('sprites/after-school-poker-items.webp', '基本アイテム'),
  asset('sprites/after-school-poker-card-ornaments.webp', 'カード装飾'),
  ...numbered('sprites/after-school-poker-item-sheet', 7, 'アイテムシート'),
  asset('sprites/after-school-poker-overrides.webp', 'アイテム差し替え'),
  asset('sprites/after-school-poker-consumable-overrides.webp', '消耗品差し替え'),
  asset('sprites/after-school-poker-stationery-overrides.webp', '文具差し替え'),
  asset('sprites/after-school-poker-supporter-fixes.webp', 'サポーター補正'),
  ...numbered('sprites/after-school-poker-rivals', 8, '通常ライバル'),
  ...numbered('sprites/after-school-poker-endless-rivals', 12, 'エンドレスライバル'),
  asset('sprites/after-school-poker-table.webp', 'ポーカーテーブル', 'ui'),
  asset('sprites/after-school-card-challenge-table.webp', 'カードチャレンジ背景', 'ui'),
];

const kochoSheets = (): SpriteAuditAssetDefinition[] => [
  ...numbered('sprites/kocho-hero-actions', 4, '校長対決 主人公'),
  asset('sprites/kocho-enemies-01.webp', '校長対決 敵'),
  asset('sprites/high-school/sheets/enemy-supplement-1.webp', '高校敵補足 01'),
  asset('sprites/high-school/sheets/enemy-supplement-2.webp', '高校敵補足 02'),
  asset('sprites/high-school/sheets/enemy-supplement-3.webp', '高校敵補足 03'),
  asset('sprites/high-school/sheets/enemy-supplement-4.webp', '高校敵補足 04'),
  asset('sprites/high-school/sheets/humanoid-enemy-supplement-1.webp', '人型敵補足 01'),
  asset('sprites/high-school/sheets/humanoid-enemy-supplement-2.webp', '人型敵補足 02'),
  asset('sprites/high-school/sheets/humanoid-enemy-supplement-3.webp', '人型敵補足 03'),
  asset('sprites/high-school/sheets/female-humanoid-enemy-supplement-a-idle.webp', '女性人型敵 A'),
  asset('sprites/high-school/sheets/female-humanoid-enemy-supplement-b-idle.webp', '女性人型敵 B'),
  asset('sprites/high-school/sheets/principal-final-boss-3x2-chromakey.webp', '最終校長'),
  ...numbered('sprites/kocho-effects', 3, '校長対決演出'),
  asset('sprites/kocho-backgrounds-5x5.webp', '校長対決背景', 'ui'),
  asset('sprites/kocho-item-barrier.webp', 'アイテム バリア', 'sprite'),
  asset('sprites/kocho-item-battery.webp', 'アイテム 電池', 'sprite'),
  asset('sprites/kocho-item-curry.webp', 'アイテム カレー', 'sprite'),
  asset('sprites/kocho-item-drink.webp', 'アイテム 飲み物', 'sprite'),
  asset('sprites/kocho-item-generic.webp', 'アイテム 汎用', 'sprite'),
  asset('sprites/kocho-item-milk.webp', 'アイテム 牛乳', 'sprite'),
  asset('sprites/kocho-relic-boots.webp', 'レリック ブーツ', 'sprite'),
  asset('sprites/kocho-relic-discount.webp', 'レリック 割引券', 'sprite'),
  asset('sprites/kocho-relic-fang.webp', 'レリック 牙', 'sprite'),
  asset('sprites/kocho-relic-gloves.webp', 'レリック 手袋', 'sprite'),
  asset('sprites/kocho-relic-potion.webp', 'レリック ポーション', 'sprite'),
  asset('sprites/kocho-relic-recycle.webp', 'レリック リサイクル', 'sprite'),
  asset('sprites/kocho-relic-seal.webp', 'レリック 封印', 'sprite'),
  asset('sprites/kocho-relic-shield.webp', 'レリック 盾', 'sprite'),
  asset('sprites/kocho-relic-thorn.webp', 'レリック いばら', 'sprite'),
];

const paperPlaneSheets = (): SpriteAuditAssetDefinition[] => [
  ...numbered('sprites/paper-plane/parts', 9, '機体パーツ'),
  asset('sprites/paper-plane/pilots-02.webp', '紙飛行機本体'),
  ...[
    'PL_ART', 'PL_BOXER', 'PL_BROADCAST', 'PL_CAFE', 'PL_CHEM', 'PL_CRAFT',
    'PL_DISCIPLINE', 'PL_FESTIVAL', 'PL_GARDEN', 'PL_GIRL', 'PL_HEALTH', 'PL_HERO',
    'PL_LIBRARY', 'PL_MAP', 'PL_MUSIC', 'PL_NERD', 'PL_OLD_PRO', 'PL_SCIENCE',
    'PL_SENIOR', 'PL_SOCCER', 'PL_SPORT', 'PL_STUDENT_PRES', 'PL_SWEETS', 'PL_TRACK',
    'PL_TRANSFER2', 'PL_TREASURER',
  ].map(id => asset(`sprites/paper-plane/pilots/${id}.webp`, `パイロット ${id}`, 'sprite')),
  asset('sprites/paper-plane/scene-backgrounds-5x5.webp', '紙飛行機 シーン背景', 'ui'),
  asset('sprites/paper-plane/stage-backgrounds-5x5.webp', '紙飛行機 ステージ背景', 'ui'),
];

const schoolyardSheets = (): SpriteAuditAssetDefinition[] => [
  asset('sprites/schoolyard-survivor-enemies.webp', '校庭サバイバー 敵'),
  asset('sprites/schoolyard-survivor-weapons.webp', '校庭サバイバー 武器'),
  asset('sprites/schoolyard-survivor-effects.webp', '校庭サバイバー演出'),
];

const triviaUiAssets = (id: string): SpriteAuditAssetDefinition[] => [
  asset(`sprites/backgrounds/mini-games/badges/${id}.png`, 'ゲームバッジ', 'ui'),
  asset(`sprites/backgrounds/mini-games/${id}.png`, 'ゲーム背景', 'ui'),
  asset(`sprites/backgrounds/mini-games/foreground/${id}.png`, 'ゲーム前景', 'ui'),
];

/**
 * ミニゲーム本体が実際に参照する素材を、デバッグ用にカテゴリ別で確認するための一覧。
 * 背景・UIしか持たないゲームも、専用スプライトなしと判定できるよう掲載する。
 */
export const MINI_GAME_SPRITE_AUDIT_MANIFEST: Record<string, MiniGameSpriteAuditDefinition> = {
  GO_HOME: {
    note: '走行・ジャンプ・障害物・飛翔物のシート。ゲーム内と同じ1フレーム表示でコマの写り込みを確認します。',
    assets: [
      asset('sprites/go-home-dash-8-loop-grid.webp', 'プレイヤー走行 8コマ'),
      asset('sprites/go-home-dash-jump-3.webp', 'プレイヤージャンプ 3コマ'),
      asset('sprites/go-home-dash-enemies.webp', '障害物・敵'),
      asset('sprites/go-home-dash-projectiles.webp', '飛翔物'),
    ],
  },
  SURVIVOR: {
    note: '敵・武器・演出はシート素材。プレイヤー本体はゲーム内のPixelSprite生成です。',
    assets: schoolyardSheets(),
  },
  POKER: {
    note: 'アイテム、ライバル、装飾、差し替え素材を全件確認できます。',
    assets: pokerSheets(),
  },
  DUNGEON: {
    note: '風来の小学生で使う主人公・敵・装備・アイテム・演出のシートです。',
    assets: furaiSheets(),
  },
  KOCHO: {
    note: '主人公・敵・演出・消耗品・レリックをまとめて確認できます。',
    assets: kochoSheets(),
  },
  PAPER_PLANE: {
    note: '機体パーツ、機体、パイロットのほか背景シートも掲載します。',
    assets: paperPlaneSheets(),
  },
  DUNGEON_2: {
    note: '風来の小学生2は共通の戦闘シートに加え、カードとカード演出を使います。',
    assets: [
      ...furaiSheets(),
      asset('sprites/furai-shogakusei2-card-sheet.webp', 'カードシート'),
      asset('sprites/furai-shogakusei2-card-effects.webp', 'カード演出'),
    ],
  },
  SHOGI: {
    note: '専用スプライトは将棋駒のシートです。背景・バッジはUI素材として併記します。',
    assets: [
      asset('sprites/shogi/shogi-piece-realistic.png', '将棋駒シート'),
      ...triviaUiAssets('shogi'),
    ],
  },
  GO: {
    note: '専用キャラクタースプライトはありません。ゲームで使う背景・前景・バッジを確認します。',
    assets: triviaUiAssets('go'),
  },
  CHESS: {
    note: '専用キャラクタースプライトはありません。ゲームで使う背景・前景・バッジを確認します。',
    assets: triviaUiAssets('chess'),
  },
  MAHJONG: {
    note: '専用キャラクタースプライトはありません。ゲームで使う背景・前景・バッジを確認します。',
    assets: triviaUiAssets('mahjong'),
  },
  STONE_GLOW: {
    note: '専用キャラクタースプライトはありません。ゲームで使う背景・前景・バッジを確認します。',
    assets: triviaUiAssets('stone-glow'),
  },
  SCHOOL_TRPG: {
    note: '専用スプライトシートはありません。シーン背景・前景・バッジを確認します。',
    assets: triviaUiAssets('school-trpg'),
  },
  LEARNING_TCG: {
    note: 'カード絵は通常のカード／イラスト管理で描画されます。ここではゲーム背景・前景・バッジを確認します。',
    assets: triviaUiAssets('learning-tcg'),
  },
};
