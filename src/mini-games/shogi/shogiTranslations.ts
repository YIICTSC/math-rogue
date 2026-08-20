import type { ShogiPieceKind } from './shogiPieces';

export interface ShogiPieceEnglishCopy {
  description: string;
  promotion: string;
  restriction: string;
  special?: string;
}

/**
 * 駒名・ glyph は日本語の固有表記として維持し、説明だけをこの辞書で翻訳する。
 * `trans()` の汎用フォールバック（Choose Option）を将棋のルール文に使わないための専用辞書。
 */
export const SHOGI_PIECE_ENGLISH: Record<ShogiPieceKind, ShogiPieceEnglishCopy> = {
  K: {
    description: 'Move one square in any direction.',
    promotion: 'Does not promote.',
    restriction: 'The king is not a held piece; capture it to win.',
  },
  R: {
    description: 'Move any number of squares orthogonally.',
    promotion: 'Promotes to 龍 in the enemy camp.',
    restriction: 'Cannot jump over friendly pieces.',
  },
  B: {
    description: 'Move any number of squares diagonally.',
    promotion: 'Promotes to 馬 in the enemy camp.',
    restriction: 'Cannot jump over friendly pieces.',
  },
  G: {
    description: 'Move one square forward, forward-diagonal, sideways, or backward.',
    promotion: 'Does not promote.',
    restriction: 'None.',
  },
  S: {
    description: 'Move one square in the three forward directions or the two backward diagonals.',
    promotion: 'Promotes to 全 in the enemy camp.',
    restriction: 'The final ranks may require promotion in this mini-game.',
  },
  N: {
    description: 'Jump to the square two steps forward and one step sideways.',
    promotion: 'Promotes to 圭 in the enemy camp.',
    restriction: 'Promotion is forced on the final two ranks.',
  },
  L: {
    description: 'Slide any number of squares forward.',
    promotion: 'Promotes to 杏 in the enemy camp.',
    restriction: 'Promotion is forced on the final rank.',
  },
  P: {
    description: 'Move one square forward.',
    promotion: 'Promotes to と in the enemy camp.',
    restriction: 'Two unpromoted pawns cannot share a file; an unpromoted pawn cannot stop on the final rank.',
  },
  ADV_DOUBLE_PAWN: {
    description: 'Move one square forward. On its first move, it may also jump two squares forward.',
    promotion: 'Does not promote.',
    restriction: 'The first two-square move may jump over an occupied square.',
  },
  ADV_SIDE_PAWN: { description: 'Move one square forward or sideways.', promotion: 'Does not promote.', restriction: 'None.' },
  ADV_RETURN_PAWN: { description: 'Move one square forward or backward.', promotion: 'Does not promote.', restriction: 'None.' },
  ADV_DIAGONAL_PAWN: { description: 'Move one square diagonally forward.', promotion: 'Does not promote.', restriction: 'None.' },
  ADV_RABBIT: { description: 'Jump two squares forward and one sideways, or move one square backward.', promotion: 'Does not promote.', restriction: 'Jumping move.' },
  ADV_MOON_RABBIT: { description: 'Jump like a knight in all eight directions.', promotion: 'Does not promote.', restriction: 'Jumping move.' },
  ADV_PINWHEEL: { description: 'Move up to two squares orthogonally.', promotion: 'Does not promote.', restriction: 'Sliding move.' },
  ADV_STAR_BISHOP: { description: 'Move up to two squares diagonally or one square orthogonally.', promotion: 'Does not promote.', restriction: 'Diagonal movement slides.' },
  ADV_CROSS: { description: 'Move one square orthogonally or jump two squares orthogonally.', promotion: 'Does not promote.', restriction: 'The two-square move jumps over pieces.' },
  ADV_HOURGLASS: { description: 'Move one square to a forward diagonal, backward, or backward diagonal.', promotion: 'Does not promote.', restriction: 'None.' },
  ADV_HOOK_SPEAR: { description: 'Slide forward any distance or move one square sideways.', promotion: 'Does not promote.', restriction: 'Only the forward direction slides.' },
  ADV_TWIN_SPEAR: { description: 'Slide any distance forward or backward.', promotion: 'Does not promote.', restriction: 'Friendly pieces block the slide.' },
  ADV_LIGHTNING: { description: 'Jump two squares orthogonally or move one square diagonally.', promotion: 'Does not promote.', restriction: 'The two-square move jumps over pieces.' },
  ADV_RAINBOW: { description: 'Move up to two squares diagonally or one square forward.', promotion: 'Does not promote.', restriction: 'Diagonal movement slides.' },
  ADV_COMET: { description: 'Jump exactly two squares in any direction.', promotion: 'Does not promote.', restriction: 'Jumping move.' },
  ADV_SWALLOW: { description: 'Slide up to two squares forward or move one square to a backward diagonal.', promotion: 'Does not promote.', restriction: 'The forward direction slides.' },
  ADV_CAT: { description: 'Move one square diagonally or jump two squares orthogonally.', promotion: 'Does not promote.', restriction: 'The two-square move jumps over pieces.' },
  ADV_DOG: { description: 'Move one square orthogonally or one square to a forward diagonal.', promotion: 'Does not promote.', restriction: 'None.' },
  ADV_CRANE: { description: 'Slide forward any distance or move one square to a backward diagonal.', promotion: 'Does not promote.', restriction: 'Only the forward direction slides.' },
  ADV_TURTLE: { description: 'Move one square orthogonally.', promotion: 'Does not promote.', restriction: 'Cannot be captured by a jumping piece.' },
  ADV_FROG: { description: 'Jump two squares forward, backward, left, or right.', promotion: 'Does not promote.', restriction: 'Jumping move.' },
  ADV_SPIDER: { description: 'Move one square diagonally or slide up to two squares sideways.', promotion: 'Does not promote.', restriction: 'The sideways direction slides.' },
  ADV_BUTTERFLY: { description: 'Move one or two squares diagonally; a two-square move may jump over the middle square.', promotion: 'Does not promote.', restriction: 'The middle square may be jumped when not capturing.' },
  ADV_BEE: { description: 'Slide up to two squares to a forward diagonal or move one square backward.', promotion: 'Does not promote.', restriction: 'The forward diagonals slide.' },
  ADV_WOLF: { description: 'Move one square in any direction.', promotion: 'Does not promote.', restriction: 'None.', special: 'After capturing, you may move one additional square.' },
  ADV_LION: { description: 'Move one square in any direction.', promotion: 'Does not promote.', restriction: 'None.', special: 'May move twice in one turn; captures at most one piece.' },
  ADV_MIRROR: { description: 'Move one square in any direction.', promotion: 'Does not promote.', restriction: 'None.', special: 'Copies the previous opponent move shape for one move; if none, moves like a king.' },
  ADV_CHAMELEON: { description: 'Choose the movement pattern of an adjacent friendly standard piece.', promotion: 'Does not promote.', restriction: 'Moves like a pawn when no adjacent standard piece exists.' },
  ADV_SWITCH: { description: 'Move one square in any direction.', promotion: 'Does not promote.', restriction: 'None.', special: 'May swap with an adjacent friendly piece instead of capturing.' },
  ADV_GATE: { description: 'Move one square orthogonally.', promotion: 'Does not promote.', restriction: 'None.', special: 'Supports friendly jumping pieces.' },
  ADV_SHIELD: { description: 'Move like a gold general.', promotion: 'Does not promote.', restriction: 'None.', special: 'Temporarily protects a friendly piece behind it.' },
  ADV_LANTERN: { description: 'Move one square diagonally.', promotion: 'Does not promote.', restriction: 'None.', special: 'Reveals checking squares of adjacent pieces.' },
  ADV_BELL: { description: 'Move one square orthogonally.', promotion: 'Does not promote.', restriction: 'None.', special: 'Temporarily disables adjacent unique pieces.' },
  ADV_MAGNET: { description: 'Move one square orthogonally.', promotion: 'Does not promote.', restriction: 'None.', special: 'Pulls an enemy piece one square closer; kings are immune.' },
  ADV_SPRING: { description: 'Move one square diagonally.', promotion: 'Does not promote.', restriction: 'None.', special: 'Can push a friendly piece when the destination is empty.' },
  ADV_ANCHOR: { description: 'Move one square orthogonally.', promotion: 'Does not promote.', restriction: 'None.', special: 'Stops adjacent enemy sliding pieces.' },
  ADV_CLOCK: { description: 'Move one square in any direction.', promotion: 'Does not promote.', restriction: 'None.', special: 'May return to its previous square once per game.' },
  ADV_KEY: { description: 'Move like a gold general.', promotion: 'Does not promote.', restriction: 'None.', special: 'Ignores Gate, Shield, and Anchor abilities.' },
  ADV_BRIDGE: { description: 'Slide any distance left or right.', promotion: 'Does not promote.', restriction: 'None.', special: 'May jump over one piece.' },
  ADV_WALL: { description: 'Move one square forward or backward.', promotion: 'Does not promote.', restriction: 'None.', special: 'When captured, it returns the captured piece to its captor.' },
  ADV_PORTAL: { description: 'Move one square orthogonally.', promotion: 'Does not promote.', restriction: 'None.', special: 'May move beside the other Portal when its exit is empty.' },
  ADV_SHADOW: { description: 'Move to an empty adjacent square sideways or backward.', promotion: 'Does not promote.', restriction: 'None.', special: 'Cannot be captured from the front.' },
  ADV_NINJA: { description: 'Move up to two squares diagonally.', promotion: 'Does not promote.', restriction: 'None.', special: 'May jump over one piece.' },
  ADV_DRILL: { description: 'Slide any distance forward.', promotion: 'Does not promote.', restriction: 'None.', special: 'May jump over one enemy piece to an empty square.' },
  ADV_CANNON: { description: 'Slide any distance orthogonally.', promotion: 'Does not promote.', restriction: 'None.', special: 'When capturing, may jump over one piece.' },
  ADV_PHOENIX: { description: 'Slide up to two squares forward or move one square diagonally.', promotion: 'Does not promote.', restriction: 'None.', special: 'Returns after its first capture.' },
  ADV_DRAGON: { description: 'Move up to two squares orthogonally or one square diagonally.', promotion: 'Does not promote.', restriction: 'None.', special: 'Cannot jump over pieces.' },
  ADV_UNICORN: { description: 'Move up to two squares diagonally or one square orthogonally.', promotion: 'Does not promote.', restriction: 'None.', special: 'Resists jumping captures for the opponent’s next turn.' },
  ADV_GRIFFIN: { description: 'Move one square orthogonally or jump two squares diagonally.', promotion: 'Does not promote.', restriction: 'None.', special: 'After capturing, it may slide diagonally for one move.' },
  ADV_CHRONOS: { description: 'Move one square in any direction or jump two squares orthogonally.', promotion: 'Does not promote.', restriction: 'None.', special: 'May take one extra move once per game.' },
};

export const getShogiPieceEnglish = (
  kind: ShogiPieceKind,
  field: keyof ShogiPieceEnglishCopy,
  fallback: string,
) => SHOGI_PIECE_ENGLISH[kind]?.[field] || fallback;
