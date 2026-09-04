export type ShogiStandardKind = 'K' | 'R' | 'B' | 'G' | 'S' | 'N' | 'L' | 'P';
export type ShogiAdvancedKind =
  | 'ADV_DOUBLE_PAWN' | 'ADV_SIDE_PAWN' | 'ADV_RETURN_PAWN' | 'ADV_DIAGONAL_PAWN' | 'ADV_RABBIT'
  | 'ADV_MOON_RABBIT' | 'ADV_PINWHEEL' | 'ADV_STAR_BISHOP' | 'ADV_CROSS' | 'ADV_HOURGLASS'
  | 'ADV_HOOK_SPEAR' | 'ADV_TWIN_SPEAR' | 'ADV_LIGHTNING' | 'ADV_RAINBOW' | 'ADV_COMET'
  | 'ADV_SWALLOW' | 'ADV_CAT' | 'ADV_DOG' | 'ADV_CRANE' | 'ADV_TURTLE'
  | 'ADV_FROG' | 'ADV_SPIDER' | 'ADV_BUTTERFLY' | 'ADV_BEE' | 'ADV_WOLF'
  | 'ADV_LION' | 'ADV_MIRROR' | 'ADV_CHAMELEON' | 'ADV_SWITCH' | 'ADV_GATE'
  | 'ADV_SHIELD' | 'ADV_LANTERN' | 'ADV_BELL' | 'ADV_MAGNET' | 'ADV_SPRING'
  | 'ADV_ANCHOR' | 'ADV_CLOCK' | 'ADV_KEY' | 'ADV_BRIDGE' | 'ADV_WALL'
  | 'ADV_PORTAL' | 'ADV_SHADOW' | 'ADV_NINJA' | 'ADV_DRILL' | 'ADV_CANNON'
  | 'ADV_PHOENIX' | 'ADV_DRAGON' | 'ADV_UNICORN' | 'ADV_GRIFFIN' | 'ADV_CHRONOS';
export type ShogiPieceKind = ShogiStandardKind | ShogiAdvancedKind;
export type ShogiSide = 'P' | 'C';

export type ShogiPattern =
  | 'KING' | 'ROOK' | 'BISHOP' | 'GOLD' | 'SILVER' | 'KNIGHT' | 'LANCE' | 'PAWN'
  | 'ROOK_DRAGON' | 'BISHOP_HORSE'
  | 'DOUBLE_PAWN' | 'SIDE_PAWN' | 'RETURN_PAWN' | 'DIAGONAL_PAWN' | 'RABBIT'
  | 'MOON_RABBIT' | 'PINWHEEL' | 'STAR_BISHOP' | 'CROSS' | 'HOURGLASS'
  | 'HOOK_SPEAR' | 'TWIN_SPEAR' | 'LIGHTNING' | 'RAINBOW' | 'COMET'
  | 'SWALLOW' | 'CAT' | 'DOG' | 'CRANE' | 'TURTLE'
  | 'FROG' | 'SPIDER' | 'BUTTERFLY' | 'BEE' | 'WOLF'
  | 'LION' | 'MIRROR' | 'CHAMELEON' | 'SWITCH' | 'GATE'
  | 'SHIELD' | 'LANTERN' | 'BELL' | 'MAGNET' | 'SPRING'
  | 'ANCHOR' | 'CLOCK' | 'KEY' | 'BRIDGE' | 'WALL'
  | 'PORTAL' | 'SHADOW' | 'NINJA' | 'DRILL' | 'CANNON'
  | 'PHOENIX' | 'DRAGON' | 'UNICORN' | 'GRIFFIN' | 'CHRONOS';

export interface ShogiPieceDefinition {
  kind: ShogiPieceKind;
  name: string;
  glyph: string;
  pattern: ShogiPattern;
  stage: number;
  advanced: boolean;
  description: string;
  promotion: string;
  restriction: string;
  special?: string;
  immuneJumpCapture?: boolean;
  extraMoveAfterCapture?: boolean;
}

export interface ShogiPiece {
  kind: ShogiPieceKind;
  side: ShogiSide;
  promoted: boolean;
  hasMoved: boolean;
  /** One-time abilities are stored on the piece so they survive movement. */
  extraMoveUsed?: boolean;
}

export const STANDARD_PIECES: ShogiPieceDefinition[] = [
  { kind: 'K', name: '王将／玉将', glyph: '王', pattern: 'KING', stage: 0, advanced: false, description: '縦・横・斜めに1マス。', promotion: '成らない。', restriction: '王は持ち駒にならない。' },
  { kind: 'R', name: '飛車', glyph: '飛', pattern: 'ROOK', stage: 0, advanced: false, description: '縦・横へ何マスでも進む。', promotion: '敵陣で龍になる。', restriction: '味方駒を飛び越せない。' },
  { kind: 'B', name: '角行', glyph: '角', pattern: 'BISHOP', stage: 0, advanced: false, description: '斜めへ何マスでも進む。', promotion: '敵陣で馬になる。', restriction: '味方駒を飛び越せない。' },
  { kind: 'G', name: '金将', glyph: '金', pattern: 'GOLD', stage: 0, advanced: false, description: '前・前斜め・左右・後ろへ1マス。', promotion: '成らない。', restriction: 'なし。' },
  { kind: 'S', name: '銀将', glyph: '銀', pattern: 'SILVER', stage: 0, advanced: false, description: '前3方向と後ろ斜め2方向へ1マス。', promotion: '敵陣で成銀（金の動き）になる。', restriction: '最終段などでは強制成り。' },
  { kind: 'N', name: '桂馬', glyph: '桂', pattern: 'KNIGHT', stage: 0, advanced: false, description: '前方2マス＋左右1マスへ跳ぶ。', promotion: '敵陣で成桂（金の動き）になる。', restriction: '最終2段では強制成り。' },
  { kind: 'L', name: '香車', glyph: '香', pattern: 'LANCE', stage: 0, advanced: false, description: '前方へ何マスでも進む。', promotion: '敵陣で成香（金の動き）になる。', restriction: '最終段では強制成り。' },
  { kind: 'P', name: '歩兵', glyph: '歩', pattern: 'PAWN', stage: 0, advanced: false, description: '前へ1マス。', promotion: '敵陣でと金（金の動き）になる。', restriction: '二歩、最終段への不成は禁止。' },
];

const ADVANCED_ROWS: Array<[ShogiAdvancedKind, string, string, ShogiPattern, string, string, string]> = [
  ['ADV_DOUBLE_PAWN', '早', '前へ1マス。初回だけ前へ2マスも可。', 'DOUBLE_PAWN', '成らない。', '初回の2マス移動は空中を含む。', ''],
  ['ADV_SIDE_PAWN', '游', '前・左右へ1マス。', 'SIDE_PAWN', '成らない。', 'なし。', ''],
  ['ADV_RETURN_PAWN', '返', '前または後ろへ1マス。', 'RETURN_PAWN', '成らない。', 'なし。', ''],
  ['ADV_DIAGONAL_PAWN', '斜', '前方斜めへ1マス。', 'DIAGONAL_PAWN', '成らない。', 'なし。', ''],
  ['ADV_RABBIT', '兎', '桂馬＋後ろへ1マス。', 'RABBIT', '成らない。', '跳越移動。', ''],
  ['ADV_MOON_RABBIT', '月', 'ナイトと同じ8方向へ跳ぶ。', 'MOON_RABBIT', '成らない。', '跳越移動。', ''],
  ['ADV_PINWHEEL', '風', '縦横へ最大2マス。', 'PINWHEEL', '成らない。', 'スライド。', ''],
  ['ADV_STAR_BISHOP', '星', '斜めへ最大2マス＋縦横1マス。', 'STAR_BISHOP', '成らない。', '斜めはスライド。', ''],
  ['ADV_CROSS', '十', '縦横1マス、または2マス先へ跳ぶ。', 'CROSS', '成らない。', '2マス移動は跳越。', ''],
  ['ADV_HOURGLASS', '砂', '前方斜め・後ろ・後方斜めへ1マス。', 'HOURGLASS', '成らない。', 'なし。', ''],
  ['ADV_HOOK_SPEAR', '鉤', '前方へスライド＋左右1マス。', 'HOOK_SPEAR', '成らない。', '前方のみスライド。', ''],
  ['ADV_TWIN_SPEAR', '槍', '前後へ何マスでも進む。', 'TWIN_SPEAR', '成らない。', '味方駒を飛び越せない。', ''],
  ['ADV_LIGHTNING', '雷', '縦横2マス先へ跳ぶ＋斜め1マス。', 'LIGHTNING', '成らない。', '2マス移動は跳越。', ''],
  ['ADV_RAINBOW', '虹', '斜めへ最大2マス＋前1マス。', 'RAINBOW', '成らない。', '斜めはスライド。', ''],
  ['ADV_COMET', '彗', '8方向のちょうど2マス先へ跳ぶ。', 'COMET', '成らない。', '跳越移動。', ''],
  ['ADV_SWALLOW', '燕', '前へ最大2マス＋後方斜め1マス。', 'SWALLOW', '成らない。', '前方はスライド。', ''],
  ['ADV_CAT', '猫', '斜め1マス＋縦横2マス先へ跳ぶ。', 'CAT', '成らない。', '2マス移動は跳越。', ''],
  ['ADV_DOG', '犬', '縦横1マス＋前方斜め1マス。', 'DOG', '成らない。', 'なし。', ''],
  ['ADV_CRANE', '鶴', '前へスライド＋後方斜め1マス。', 'CRANE', '成らない。', '前方のみスライド。', ''],
  ['ADV_TURTLE', '亀', '縦横へ1マス。', 'TURTLE', '成らない。', '跳越駒から取られない。', ''],
  ['ADV_FROG', '蛙', '前後左右の2マス先へ跳ぶ。', 'FROG', '成らない。', '跳越移動。', ''],
  ['ADV_SPIDER', '蜘', '斜め1マス＋左右へ最大2マス。', 'SPIDER', '成らない。', '左右はスライド。', ''],
  ['ADV_BUTTERFLY', '蝶', '斜めへ最大2マス。', 'BUTTERFLY', '成らない。', '非捕獲時は中間を跳越可。', ''],
  ['ADV_BEE', '蜂', '前方斜めへ最大2マス＋後ろ1マス。', 'BEE', '成らない。', '前方斜めはスライド。', ''],
  ['ADV_WOLF', '狼', '王と同じ。捕獲後に追加1マス移動可。', 'WOLF', '成らない。', '捕獲後の追加移動は任意。', ''],
  ['ADV_LION', '獅', '王と同じ。1手で2回まで移動。', 'LION', '成らない。', '捕獲は合計1枚まで。', ''],
  ['ADV_MIRROR', '鏡', '直前の相手着手の移動形を1手だけ得る。', 'MIRROR', '成らない。', '履歴がなければ王。', ''],
  ['ADV_CHAMELEON', '変', '隣接する味方の標準駒の形を選べる。', 'CHAMELEON', '成らない。', '対象がなければ歩。', ''],
  ['ADV_SWITCH', '換', '王と同じ。捕獲の代わりに味方と入替可能。', 'SWITCH', '成らない。', '入替先は隣接味方。', ''],
  ['ADV_GATE', '門', '縦横へ1マス。', 'GATE', '成らない。', '味方の跳越駒を支援する。', ''],
  ['ADV_SHIELD', '盾', '金と同じ。後ろの味方を一時保護。', 'SHIELD', '成らない。', '次の相手手番のみ保護。', ''],
  ['ADV_LANTERN', '灯', '斜めへ1マス。隣接駒の王手マスを表示。', 'LANTERN', '成らない。', '案内能力。', ''],
  ['ADV_BELL', '鐘', '縦横へ1マス。隣接ユニーク駒を一時無効化。', 'BELL', '成らない。', '効果は次の手番終了まで。', ''],
  ['ADV_MAGNET', '磁', '縦横へ1マス。敵駒を1マス引き寄せる。', 'MAGNET', '成らない。', '王は対象外。', ''],
  ['ADV_SPRING', 'バネ', '斜めへ1マス。味方駒を押し出せる。', 'SPRING', '成らない。', '押出先が空いている時だけ。', ''],
  ['ADV_ANCHOR', '錨', '縦横へ1マス。隣接敵のスライドを止める。', 'ANCHOR', '成らない。', '能力は常時。', ''],
  ['ADV_CLOCK', '時', '王と同じ。1回だけ直前位置へ戻る。', 'CLOCK', '成らない。', '対局中1回。', ''],
  ['ADV_KEY', '鍵', '金と同じ。門・盾・錨を無視。', 'KEY', '成らない。', '相手能力を無視。', ''],
  ['ADV_BRIDGE', '橋', '左右へ任意距離。駒1枚を跳び越せる。', 'BRIDGE', '成らない。', '左右スライド。', ''],
  ['ADV_WALL', '壁', '前後へ1マス。取られても取った駒を戻す。', 'WALL', '成らない。', '王の捕獲は除く。', ''],
  ['ADV_PORTAL', '穴', '縦横へ1マス。もう1枚の穴の隣へ移動可。', 'PORTAL', '成らない。', '出口が空いている時だけ。', ''],
  ['ADV_SHADOW', '影', '左右・後方の空き隣接マスへ移動。', 'SHADOW', '成らない。', '正面から取られない。', ''],
  ['ADV_NINJA', '忍', '斜めへ最大2マス。1枚だけ跳越可。', 'NINJA', '成らない。', '斜めスライド。', ''],
  ['ADV_DRILL', '錐', '前へ任意距離。敵1枚だけ飛び越せる。', 'DRILL', '成らない。', '飛越後の空きマスへ。', ''],
  ['ADV_CANNON', '砲', '縦横へ任意距離。捕獲時は1枚を跳越す。', 'CANNON', '成らない。', '砲の捕獲条件。', ''],
  ['ADV_PHOENIX', '鳳', '斜め1マス＋前へ最大2マス。', 'PHOENIX', '成らない。', '初回被捕獲時に復帰。', ''],
  ['ADV_DRAGON', '竜', '縦横へ最大2マス＋斜め1マス。', 'DRAGON', '成らない。', '飛越不可。', ''],
  ['ADV_UNICORN', '麒麟', '斜めへ最大2マス＋縦横1マス。', 'UNICORN', '成らない。', '次の相手手番のみ跳越耐性。', ''],
  ['ADV_GRIFFIN', '鷲', '縦横1マス＋斜めの2マス先へ跳ぶ。', 'GRIFFIN', '成らない。', '捕獲後は次の1手だけ斜めスライド。', ''],
  ['ADV_CHRONOS', '宿', '王と同じ＋縦横の2マス先へ跳ぶ。', 'CHRONOS', '成らない。', '対局中1回だけ追加手。', ''],
];

export const ADVANCED_PIECES: ShogiPieceDefinition[] = ADVANCED_ROWS.map(
  ([kind, glyph, description, pattern, promotion, restriction, special], index) => ({
    kind,
    name: ADVANCED_ROWS[index][1],
    glyph,
    pattern,
    stage: index + 1,
    advanced: true,
    description,
    promotion,
    restriction,
    special,
    immuneJumpCapture: kind === 'ADV_TURTLE' || kind === 'ADV_UNICORN',
    extraMoveAfterCapture: kind === 'ADV_WOLF' || kind === 'ADV_LION' || kind === 'ADV_CHRONOS',
  }),
);

export const SHOGI_PIECES = [...STANDARD_PIECES, ...ADVANCED_PIECES];
export const SHOGI_PIECE_MAP = new Map<ShogiPieceKind, ShogiPieceDefinition>(
  SHOGI_PIECES.map(piece => [piece.kind, piece]),
);

export const makeShogiPiece = (kind: ShogiPieceKind, side: ShogiSide): ShogiPiece => ({
  kind,
  side,
  promoted: false,
  hasMoved: false,
});
