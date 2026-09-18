import {
  ADVANCED_PIECES,
  SHOGI_PIECE_MAP,
  makeShogiPiece,
  type ShogiPiece,
  type ShogiPieceDefinition,
  type ShogiPieceKind,
  type ShogiSide,
} from './shogiPieces';
import {
  deriveShogiGimmickProfile,
  getCatalogMovementVectors,
  isOncePerBattleCatalogEffect,
  type ShogiRuntimeVector,
} from './shogiAdvanceRuntime';

export type ShogiMode = 'STANDARD' | 'ADVANCE';
export type ShogiPlayMode = 'CPU' | 'LOCAL';
export type ShogiBoard = Array<Array<ShogiPiece | null>>;
export type ShogiHands = Record<ShogiSide, Partial<Record<ShogiPieceKind, number>>>;
export type ShogiTargetStatus = 'MOVE' | 'CAPTURE' | 'DROP' | 'SPECIAL';
export type ShogiSpecialAction = 'MOVE' | 'WARP' | 'RANGED_CAPTURE' | 'SWAP' | 'ACTIVATE';
export interface ShogiTarget {
  row: number;
  col: number;
  status: ShogiTargetStatus;
  note?: string;
  action?: ShogiSpecialAction;
  /** Intermediate squares used by a two-step unique-piece move. */
  path?: Array<[number, number]>;
}
export interface ShogiMove {
  from: [number, number] | null;
  to: [number, number];
  kind: ShogiPieceKind;
  side: ShogiSide;
  capture: ShogiPieceKind | null;
  special?: boolean;
  path?: Array<[number, number]>;
  action?: ShogiSpecialAction;
}
export type ShogiTerrainType = 'CRATER' | 'BARRIER' | 'TRAP' | 'PORTAL' | 'LASER_FLOOR' | 'GRAVITY_FIELD';
export interface ShogiTerrain {
  id: string;
  row: number;
  col: number;
  type: ShogiTerrainType;
  side: ShogiSide;
  turnsLeft: number;
  group?: string;
}
export interface ShogiGimmickEvent {
  nonce: number;
  family: string;
  tier: number;
  row: number;
  col: number;
  label: string;
}
export interface ShogiGameState {
  mode: ShogiMode;
  playMode: ShogiPlayMode;
  stage: number;
  /** The advanced pieces actually included in this board. */
  activeAdvancedKinds: ShogiPieceKind[];
  /** Number of advanced pieces unlocked on this device when the board was created. */
  unlockedAdvancedCount: number;
  seed: number;
  board: ShogiBoard;
  hands: ShogiHands;
  side: ShogiSide;
  turn: number;
  result: 'WIN' | 'LOSE' | 'DRAW' | null;
  selected: { row: number; col: number } | { hand: ShogiPieceKind } | null;
  legalTargets: ShogiTarget[];
  message: string;
  history: ShogiMove[];
  lastMove: ShogiMove | null;
  signature: string;
  terrain: ShogiTerrain[];
  gimmickEvent: ShogiGimmickEvent | null;
}

type Vector = ShogiRuntimeVector;

const SIZE = 5;
const inside = (row: number, col: number) => row >= 0 && row < SIZE && col >= 0 && col < SIZE;
const forwardFor = (side: ShogiSide) => side === 'P' ? -1 : 1;
const cloneBoard = (board: ShogiBoard): ShogiBoard => board.map(row => row.map(piece => piece ? { ...piece } : null));
const cloneHands = (hands: ShogiHands): ShogiHands => ({ P: { ...hands.P }, C: { ...hands.C } });
const emptyBoard = (): ShogiBoard => Array.from({ length: SIZE }, () => Array<ShogiPiece | null>(SIZE).fill(null));
const emptyHands = (): ShogiHands => ({ P: {}, C: {} });
const definitionOf = (kind: ShogiPieceKind): ShogiPieceDefinition =>
  SHOGI_PIECE_MAP.get(kind) || SHOGI_PIECE_MAP.get('P')!;
const isEnemy = (piece: ShogiPiece | null, side: ShogiSide) => Boolean(piece && piece.side !== side);
const isFriendly = (piece: ShogiPiece | null, side: ShogiSide) => Boolean(piece && piece.side === side);

const goldVectors = (side: ShogiSide): Vector[] => {
  const forward = forwardFor(side);
  return [
    { dr: forward, dc: -1 }, { dr: forward, dc: 0 }, { dr: forward, dc: 1 },
    { dr: 0, dc: -1 }, { dr: 0, dc: 1 }, { dr: -forward, dc: 0 },
  ];
};
const kingVectors = (): Vector[] => [
  { dr: -1, dc: -1 }, { dr: -1, dc: 0 }, { dr: -1, dc: 1 },
  { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
  { dr: 1, dc: -1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 },
];
const diagonal = (max = SIZE): Vector[] => [
  { dr: -1, dc: -1, max, slide: true }, { dr: -1, dc: 1, max, slide: true },
  { dr: 1, dc: -1, max, slide: true }, { dr: 1, dc: 1, max, slide: true },
];
const orthogonal = (max = SIZE): Vector[] => [
  { dr: -1, dc: 0, max, slide: true }, { dr: 1, dc: 0, max, slide: true },
  { dr: 0, dc: -1, max, slide: true }, { dr: 0, dc: 1, max, slide: true },
];

const standardVectors = (piece: ShogiPiece): Vector[] => {
  const side = piece.side;
  const forward = forwardFor(side);
  const pattern = piece.promoted
    ? piece.kind === 'R' ? 'ROOK_DRAGON'
      : piece.kind === 'B' ? 'BISHOP_HORSE'
        : piece.kind === 'K' || piece.kind === 'G' ? piece.kind
          : 'GOLD'
    : definitionOf(piece.kind).pattern;
  switch (pattern) {
    case 'KING': return kingVectors();
    case 'ROOK': return orthogonal();
    case 'BISHOP': return diagonal();
    case 'ROOK_DRAGON': return [...orthogonal(), ...diagonal(1)];
    case 'BISHOP_HORSE': return [...diagonal(), ...orthogonal(1)];
    case 'GOLD': return goldVectors(side);
    case 'SILVER': return [
      { dr: forward, dc: -1 }, { dr: forward, dc: 0 }, { dr: forward, dc: 1 },
      { dr: -forward, dc: -1 }, { dr: -forward, dc: 1 },
    ];
    case 'KNIGHT': return [{ dr: forward * 2, dc: -1, jump: true }, { dr: forward * 2, dc: 1, jump: true }];
    case 'LANCE': return [{ dr: forward, dc: 0, max: SIZE, slide: true }];
    default: return [{ dr: forward, dc: 0 }];
  }
};

const advancedVectors = (piece: ShogiPiece): Vector[] => {
  const f = forwardFor(piece.side);
  const one = (dr: number, dc: number, extra?: Partial<Vector>): Vector => ({ dr, dc, ...extra });
  const side = [
    one(f, -1), one(f, 0), one(f, 1), one(0, -1), one(0, 1), one(-f, -1), one(-f, 0), one(-f, 1),
  ];
  const definition = definitionOf(piece.kind);
  switch (definition.pattern) {
    case 'CATALOG': return getCatalogMovementVectors(definition.catalogNo || definition.stage, definition.description, piece.side);
    case 'DOUBLE_PAWN': return piece.hasMoved
      ? [one(f, 0)]
      : [one(f, 0), one(f * 2, 0, { jump: true, special: true })];
    case 'SIDE_PAWN': return [one(f, 0), one(0, -1), one(0, 1)];
    case 'RETURN_PAWN': return [one(f, 0), one(-f, 0)];
    case 'DIAGONAL_PAWN': return [one(f, -1), one(f, 1)];
    case 'RABBIT': return [one(f * 2, -1, { jump: true }), one(f * 2, 1, { jump: true }), one(-f, 0)];
    case 'MOON_RABBIT': return [
      one(-2, -1, { jump: true }), one(-2, 1, { jump: true }), one(-1, -2, { jump: true }), one(-1, 2, { jump: true }),
      one(1, -2, { jump: true }), one(1, 2, { jump: true }), one(2, -1, { jump: true }), one(2, 1, { jump: true }),
    ];
    case 'PINWHEEL': return orthogonal(2);
    case 'STAR_BISHOP': return [...diagonal(2), one(-1, 0), one(1, 0), one(0, -1), one(0, 1)];
    case 'CROSS': return [
      ...orthogonal(1),
      one(-2, 0, { jump: true, special: true }), one(2, 0, { jump: true, special: true }),
      one(0, -2, { jump: true, special: true }), one(0, 2, { jump: true, special: true }),
    ];
    case 'HOURGLASS': return [one(f, -1), one(f, 1), one(-f, -1), one(-f, 0), one(-f, 1)];
    case 'HOOK_SPEAR': return [one(0, -1), one(0, 1), one(f, 0, { max: SIZE, slide: true })];
    case 'TWIN_SPEAR': return [{ dr: f, dc: 0, max: SIZE, slide: true }, { dr: -f, dc: 0, max: SIZE, slide: true }];
    case 'LIGHTNING': return [
      one(-2, 0, { jump: true, special: true }), one(2, 0, { jump: true, special: true }),
      one(0, -2, { jump: true, special: true }), one(0, 2, { jump: true, special: true }),
      one(-1, -1), one(-1, 1), one(1, -1), one(1, 1),
    ];
    case 'RAINBOW': return [...diagonal(2), one(f, 0)];
    case 'COMET': return [...kingVectors().map(vector => ({ ...vector, dr: vector.dr * 2, dc: vector.dc * 2, jump: true }))];
    case 'SWALLOW': return [one(f, 0, { max: 2, slide: true }), one(-f, -1), one(-f, 1)];
    case 'CAT': return [
      ...diagonal(1),
      one(-2, 0, { jump: true, special: true }), one(2, 0, { jump: true, special: true }),
      one(0, -2, { jump: true, special: true }), one(0, 2, { jump: true, special: true }),
    ];
    case 'DOG': return [one(-1, 0), one(1, 0), one(0, -1), one(0, 1), one(f, -1), one(f, 1)];
    case 'CRANE': return [one(f, 0, { max: SIZE, slide: true }), one(-f, -1), one(-f, 1)];
    case 'TURTLE': return [one(-1, 0), one(1, 0), one(0, -1), one(0, 1)];
    case 'FROG': return [one(-2, 0, { jump: true }), one(2, 0, { jump: true }), one(0, -2, { jump: true }), one(0, 2, { jump: true })];
    case 'SPIDER': return [...diagonal(1), { dr: 0, dc: -1, max: 2, slide: true }, { dr: 0, dc: 1, max: 2, slide: true }];
    case 'BUTTERFLY': return [
      ...diagonal(1),
      one(-2, -2, { jump: true, special: true }), one(-2, 2, { jump: true, special: true }),
      one(2, -2, { jump: true, special: true }), one(2, 2, { jump: true, special: true }),
    ];
    case 'BEE': return [{ dr: f, dc: -1, max: 2, slide: true }, { dr: f, dc: 1, max: 2, slide: true }, one(-f, 0)];
    case 'WOLF': return kingVectors();
    case 'LION': return kingVectors();
    case 'MIRROR': return kingVectors();
    case 'CHAMELEON': return goldVectors(piece.side);
    case 'SWITCH': return kingVectors();
    case 'GATE': return [one(-1, 0), one(1, 0), one(0, -1), one(0, 1)];
    case 'SHIELD': return goldVectors(piece.side);
    case 'LANTERN': return diagonal(1);
    case 'BELL': return [one(-1, 0), one(1, 0), one(0, -1), one(0, 1)];
    case 'MAGNET': return [one(-1, 0), one(1, 0), one(0, -1), one(0, 1)];
    case 'SPRING': return diagonal(1);
    case 'ANCHOR': return [one(-1, 0), one(1, 0), one(0, -1), one(0, 1)];
    case 'CLOCK': return kingVectors();
    case 'KEY': return [one(f, -1), one(f, 0), one(f, 1), one(0, -1), one(0, 1)];
    case 'BRIDGE': return [{ dr: 0, dc: -1, max: SIZE, slide: true, special: true }, { dr: 0, dc: 1, max: SIZE, slide: true, special: true }];
    case 'WALL': return [one(f, 0), one(-f, 0)];
    case 'PORTAL': return [one(-1, 0), one(1, 0), one(0, -1), one(0, 1)];
    case 'SHADOW': return [one(-f, -1), one(-f, 0), one(-f, 1), one(0, -1), one(0, 1)];
    case 'NINJA': return diagonal(2).map(vector => ({ ...vector, special: true }));
    case 'DRILL': return [{ dr: f, dc: 0, max: SIZE, slide: true, special: true }];
    case 'CANNON': return orthogonal().map(vector => ({ ...vector, special: true }));
    case 'PHOENIX': return [one(f, 0, { max: 2, slide: true }), one(f, -1), one(f, 1)];
    case 'DRAGON': return [...orthogonal(2), ...diagonal(1)];
    case 'UNICORN': return [...diagonal(2), ...orthogonal(1)];
    case 'GRIFFIN': return [
      ...orthogonal(1),
      one(-2, -2, { jump: true, special: true }), one(-2, 2, { jump: true, special: true }),
      one(2, -2, { jump: true, special: true }), one(2, 2, { jump: true, special: true }),
    ];
    case 'CHRONOS': return [
      ...kingVectors(),
      one(-2, 0, { jump: true, special: true }), one(2, 0, { jump: true, special: true }),
      one(0, -2, { jump: true, special: true }), one(0, 2, { jump: true, special: true }),
    ];
    default: return side;
  }
};

const isStandardKind = (kind: ShogiPieceKind): boolean =>
  ['K', 'R', 'B', 'G', 'S', 'N', 'L', 'P'].includes(kind);

const gimmickProfileOf = (kind: ShogiPieceKind) => {
  const definition = definitionOf(kind);
  return deriveShogiGimmickProfile(
    definition.catalogNo || definition.stage,
    definition.family || '',
    definition.description,
    definition.restriction,
  );
};

const isCatalogPiece = (kind: ShogiPieceKind) => definitionOf(kind).pattern === 'CATALOG';

const terrainBlocksSquare = (terrain: ShogiTerrain[], row: number, col: number, side: ShogiSide): boolean =>
  terrain.some(item => item.row === row && item.col === col && (
    item.type === 'CRATER' || (item.type === 'BARRIER' && item.side !== side)
  ));

const canLandOn = (piece: ShogiPiece, target: ShogiPiece | null, jumping = false, allowFriendly = false): boolean => {
  if (target?.side === piece.side && !allowFriendly) return false;
  if (!target || target.side === piece.side) return true;
  if (piece.kind === 'ADV_WALL') return false;
  if (jumping && definitionOf(target.kind).immuneJumpCapture) return false;
  return true;
};

const uniqueTargets = (targets: ShogiTarget[]): ShogiTarget[] =>
  Array.from(new Map(targets.map(target => [target.row + ':' + target.col, target])).values());

const slidingTargets = (
  board: ShogiBoard,
  row: number,
  col: number,
  piece: ShogiPiece,
  directions: Vector[],
): ShogiTarget[] => {
  const result: ShogiTarget[] = [];
  directions.forEach(vector => {
    const max = vector.max || SIZE;
    let occupiedBeforeTarget = 0;
    for (let step = 1; step <= max; step += 1) {
      const targetRow = row + vector.dr * step;
      const targetCol = col + vector.dc * step;
      if (!inside(targetRow, targetCol)) break;
      const target = board[targetRow][targetCol];
      if (target) {
        occupiedBeforeTarget += 1;
        if (occupiedBeforeTarget > 1 || !canLandOn(piece, target)) break;
        result.push({ row: targetRow, col: targetCol, status: 'CAPTURE' });
        break;
      }
      result.push({ row: targetRow, col: targetCol, status: 'MOVE' });
    }
  });
  return result;
};

const lionTargets = (board: ShogiBoard, row: number, col: number, piece: ShogiPiece): ShogiTarget[] => {
  type SearchState = { row: number; col: number; depth: number; captures: number; path: Array<[number, number]> };
  const queue: SearchState[] = [{ row, col, depth: 0, captures: 0, path: [] }];
  const result: ShogiTarget[] = [];
  while (queue.length) {
    const current = queue.shift()!;
    if (current.depth >= 2) continue;
    for (const vector of kingVectors()) {
      const targetRow = current.row + vector.dr;
      const targetCol = current.col + vector.dc;
      if (!inside(targetRow, targetCol)) continue;
      const target = board[targetRow][targetCol];
      if (target?.side === piece.side) continue;
      const captures = current.captures + (target ? 1 : 0);
      if (captures > 1 || (target && definitionOf(target.kind).immuneJumpCapture && current.depth > 0)) continue;
      const path = [...current.path, [targetRow, targetCol] as [number, number]];
      result.push({
        row: targetRow,
        col: targetCol,
        status: target ? 'CAPTURE' : current.depth === 0 ? 'MOVE' : 'SPECIAL',
        note: current.depth === 0 ? undefined : '獅子の二段移動',
        path: current.depth === 0 ? undefined : path,
      });
      if (!target || captures < 1) queue.push({ row: targetRow, col: targetCol, depth: current.depth + 1, captures, path });
    }
  }
  return uniqueTargets(result);
};

const wolfTargets = (board: ShogiBoard, row: number, col: number, piece: ShogiPiece): ShogiTarget[] => {
  const result = candidateMoves(board, row, col, piece, kingVectors());
  for (const firstVector of kingVectors()) {
    const firstRow = row + firstVector.dr;
    const firstCol = col + firstVector.dc;
    const first = board[firstRow]?.[firstCol];
    if (!inside(firstRow, firstCol) || !first || first.side === piece.side || !canLandOn(piece, first)) continue;
    // The first step must capture. The optional second step is deliberately
    // empty-only, so a Wolf can never capture twice in one turn.
    for (const secondVector of kingVectors()) {
      const secondRow = firstRow + secondVector.dr;
      const secondCol = firstCol + secondVector.dc;
      if (!inside(secondRow, secondCol) || board[secondRow][secondCol]) continue;
      result.push({
        row: secondRow,
        col: secondCol,
        status: 'SPECIAL',
        note: '捕獲後の追加移動',
        path: [[firstRow, firstCol], [secondRow, secondCol]],
      });
    }
  }
  return uniqueTargets(result);
};

const chronosTargets = (board: ShogiBoard, row: number, col: number, piece: ShogiPiece): ShogiTarget[] => {
  const result = candidateMoves(board, row, col, piece, advancedVectors(piece));
  if (piece.extraMoveUsed) return uniqueTargets(result);

  // Chronos can spend its one extra action by chaining two king steps. The
  // final destination is selected in one tap, just like the Lion's two-step
  // move, while applyMove still resolves each intermediate square in order.
  for (const firstVector of kingVectors()) {
    const firstRow = row + firstVector.dr;
    const firstCol = col + firstVector.dc;
    if (!inside(firstRow, firstCol) || !canLandOn(piece, board[firstRow][firstCol])) continue;
    if (board[firstRow][firstCol]?.kind === 'K') continue;
    for (const secondVector of kingVectors()) {
      const secondRow = firstRow + secondVector.dr;
      const secondCol = firstCol + secondVector.dc;
      if (!inside(secondRow, secondCol) || !canLandOn(piece, board[secondRow][secondCol])) continue;
      result.push({
        row: secondRow,
        col: secondCol,
        status: 'SPECIAL',
        note: '宿の追加手',
        path: [[firstRow, firstCol], [secondRow, secondCol]],
      });
    }
  }
  return uniqueTargets(result);
};

const customAdvancedTargets = (
  board: ShogiBoard,
  row: number,
  col: number,
  piece: ShogiPiece,
  lastMove?: ShogiMove,
): ShogiTarget[] | undefined => {
  const pattern = definitionOf(piece.kind).pattern;
  const f = forwardFor(piece.side);
  const one = (dr: number, dc: number): Vector => ({ dr, dc });

  if (pattern === 'LION') return lionTargets(board, row, col, piece);
  if (pattern === 'WOLF') return wolfTargets(board, row, col, piece);
  if (pattern === 'CHRONOS') return chronosTargets(board, row, col, piece);

  if (pattern === 'MIRROR') {
    if (!lastMove?.from) return undefined;
    const dr = lastMove.to[0] - lastMove.from[0];
    const dc = lastMove.to[1] - lastMove.from[1];
    if (!dr && !dc) return undefined;
    const targetRow = row + dr;
    const targetCol = col + dc;
    if (!inside(targetRow, targetCol) || !canLandOn(piece, board[targetRow][targetCol], true)) return [];
    return [{ row: targetRow, col: targetCol, status: board[targetRow][targetCol] ? 'CAPTURE' : 'SPECIAL', note: '直前の相手着手を反映' }];
  }

  if (pattern === 'CHAMELEON') {
    const vectors: Vector[] = [];
    for (let neighborRow = row - 1; neighborRow <= row + 1; neighborRow += 1) {
      for (let neighborCol = col - 1; neighborCol <= col + 1; neighborCol += 1) {
        const neighbor = board[neighborRow]?.[neighborCol];
        if (!neighbor || neighbor.side !== piece.side || !isStandardKind(neighbor.kind)) continue;
        vectors.push(...standardVectors(neighbor));
      }
    }
    return candidateMoves(board, row, col, piece, vectors.length ? vectors : [one(f, 0)]);
  }

  if (pattern === 'BUTTERFLY') {
    const result: ShogiTarget[] = [];
    for (const vector of diagonal(2)) {
      const first = board[row + vector.dr]?.[col + vector.dc];
      if (inside(row + vector.dr, col + vector.dc) && canLandOn(piece, first)) {
        result.push({ row: row + vector.dr, col: col + vector.dc, status: first ? 'CAPTURE' : 'MOVE' });
      }
      const targetRow = row + vector.dr * 2;
      const targetCol = col + vector.dc * 2;
      if (!inside(targetRow, targetCol)) continue;
      const target = board[targetRow][targetCol];
      // A two-square capture is a normal slide and therefore needs an empty
      // middle square.  Only a non-capturing move may jump the middle piece.
      if (target ? !first && canLandOn(piece, target) : canLandOn(piece, target, true)) {
        result.push({ row: targetRow, col: targetCol, status: target ? 'CAPTURE' : 'SPECIAL', note: target ? undefined : '中間の駒を跳越' });
      }
    }
    return result;
  }

  if (pattern === 'SWITCH') {
    const result = candidateMoves(board, row, col, piece, kingVectors());
    for (const vector of kingVectors()) {
      const targetRow = row + vector.dr;
      const targetCol = col + vector.dc;
      const target = board[targetRow]?.[targetCol];
      if (inside(targetRow, targetCol) && target?.side === piece.side) {
        result.push({ row: targetRow, col: targetCol, status: 'SPECIAL', note: '味方駒と入替' });
      }
    }
    return result;
  }

  if (pattern === 'PORTAL') {
    const result = candidateMoves(board, row, col, piece, advancedVectors(piece));
    for (let portalRow = 0; portalRow < SIZE; portalRow += 1) {
      for (let portalCol = 0; portalCol < SIZE; portalCol += 1) {
        const portal = board[portalRow][portalCol];
        if (!portal || portal.kind !== 'ADV_PORTAL' || portal.side !== piece.side || (portalRow === row && portalCol === col)) continue;
        for (const vector of kingVectors()) {
          const targetRow = portalRow + vector.dr;
          const targetCol = portalCol + vector.dc;
          if (inside(targetRow, targetCol) && !board[targetRow][targetCol]) {
            result.push({ row: targetRow, col: targetCol, status: 'SPECIAL', note: 'もう一つの穴の隣へ移動' });
          }
        }
      }
    }
    return result;
  }

  if (pattern === 'SHADOW') {
    return candidateMoves(board, row, col, piece, advancedVectors(piece)).filter(target => !board[target.row][target.col]);
  }

  if (pattern === 'BRIDGE') {
    return slidingTargets(board, row, col, piece, [
      { dr: 0, dc: -1, max: SIZE, slide: true },
      { dr: 0, dc: 1, max: SIZE, slide: true },
    ]).concat(([-1, 1] as const).flatMap(dc => {
      const result: ShogiTarget[] = [];
      let seen = 0;
      for (let step = 1; step <= SIZE; step += 1) {
        const targetRow = row;
        const targetCol = col + dc * step;
        if (!inside(targetRow, targetCol)) break;
        const target = board[targetRow][targetCol];
        if (target) {
          seen += 1;
          if (seen > 1) break;
          // The jumped piece is not captured; the destination may still be
          // an enemy piece, just like an ordinary bridge crossing.
          continue;
        }
        if (seen === 1) result.push({ row: targetRow, col: targetCol, status: 'SPECIAL', note: '1枚を跳越' });
      }
      return result;
    }));
  }

  if (pattern === 'NINJA') {
    const result: ShogiTarget[] = [];
    for (const vector of diagonal(2)) {
      const first = board[row + vector.dr]?.[col + vector.dc];
      const firstRow = row + vector.dr;
      const firstCol = col + vector.dc;
      if (inside(firstRow, firstCol) && canLandOn(piece, first)) result.push({ row: firstRow, col: firstCol, status: first ? 'CAPTURE' : 'MOVE' });
      const targetRow = row + vector.dr * 2;
      const targetCol = col + vector.dc * 2;
      if (!inside(targetRow, targetCol) || !canLandOn(piece, board[targetRow][targetCol], Boolean(first))) continue;
      result.push({ row: targetRow, col: targetCol, status: board[targetRow][targetCol] ? 'CAPTURE' : first ? 'SPECIAL' : 'MOVE', note: first ? '中間の1枚を跳越' : undefined });
    }
    return result;
  }

  if (pattern === 'DRILL') {
    const result = slidingTargets(board, row, col, piece, [{ dr: f, dc: 0, max: SIZE, slide: true }]);
    for (let step = 1; step < SIZE; step += 1) {
      const obstacleRow = row + f * step;
      const landingRow = row + f * (step + 1);
      if (!inside(obstacleRow, col) || !inside(landingRow, col)) break;
      const obstacle = board[obstacleRow][col];
      if (!obstacle) continue;
      if (obstacle.side === piece.side || board[landingRow][col]) break;
      result.push({ row: landingRow, col, status: 'SPECIAL', note: '敵駒を1枚跳越' });
      break;
    }
    return result;
  }

  if (pattern === 'CANNON') {
    const result: ShogiTarget[] = [];
    // Empty destinations are ordinary rook-like slides. A capture is only
    // legal after exactly one intervening piece has been jumped.
    for (const vector of orthogonal()) {
      for (let step = 1; step <= SIZE; step += 1) {
        const targetRow = row + vector.dr * step;
        const targetCol = col + vector.dc * step;
        if (!inside(targetRow, targetCol)) break;
        const target = board[targetRow][targetCol];
        if (target) break;
        result.push({ row: targetRow, col: targetCol, status: 'MOVE' });
      }
    }
    for (const vector of orthogonal()) {
      let seen = 0;
      for (let step = 1; step <= SIZE; step += 1) {
        const targetRow = row + vector.dr * step;
        const targetCol = col + vector.dc * step;
        if (!inside(targetRow, targetCol)) break;
        const target = board[targetRow][targetCol];
        if (!target) continue;
        if (seen === 0) {
          seen = 1;
          continue;
        }
        if (canLandOn(piece, target, true)) result.push({ row: targetRow, col: targetCol, status: 'CAPTURE', note: '1枚を跳越して捕獲' });
        break;
      }
    }
    return result;
  }

  return undefined;
};

const firstEnemyOnRay = (
  board: ShogiBoard,
  row: number,
  col: number,
  side: ShogiSide,
  dr: number,
  dc: number,
): [number, number] | null => {
  for (let step = 1; step < SIZE; step += 1) {
    const targetRow = row + dr * step;
    const targetCol = col + dc * step;
    if (!inside(targetRow, targetCol)) break;
    const target = board[targetRow][targetCol];
    if (!target) continue;
    if (target.side !== side && target.kind !== 'K') return [targetRow, targetCol];
    break;
  }
  return null;
};

const catalogSpecialTargets = (
  board: ShogiBoard,
  terrain: ShogiTerrain[],
  row: number,
  col: number,
  piece: ShogiPiece,
): ShogiTarget[] => {
  if (!isCatalogPiece(piece.kind) || piece.silencedTurns) return [];
  const definition = definitionOf(piece.kind);
  const profile = gimmickProfileOf(piece.kind);
  if (isOncePerBattleCatalogEffect(definition.restriction, definition.description) && piece.gimmickUsed) return [];
  const result: ShogiTarget[] = [];
  const text = `${definition.description} ${definition.restriction}`;

  if (profile.families.some(family => family === 'WARP' || family === 'TELEPORT' || family === 'PHASE')) {
    const addWarp = (targetRow: number, targetCol: number) => {
      if (!inside(targetRow, targetCol) || board[targetRow][targetCol] || terrainBlocksSquare(terrain, targetRow, targetCol, piece.side)) return;
      if (targetRow === row && targetCol === col) return;
      result.push({ row: targetRow, col: targetCol, status: 'SPECIAL', action: 'WARP', note: '空間移動' });
    };
    if (/盤端|端升|端の/.test(text)) {
      for (let index = 0; index < SIZE; index += 1) {
        addWarp(0, index); addWarp(SIZE - 1, index); addWarp(index, 0); addWarp(index, SIZE - 1);
      }
    } else if (/四隅|対角の隅/.test(text)) {
      addWarp(0, 0); addWarp(0, SIZE - 1); addWarp(SIZE - 1, 0); addWarp(SIZE - 1, SIZE - 1);
    } else if (/同じ行|同じ段|同じ列|同じ筋/.test(text)) {
      for (let index = 0; index < SIZE; index += 1) { addWarp(row, index); addWarp(index, col); }
    } else if (/任意|どこでも|全空き/.test(text) || profile.tier >= 4) {
      for (let targetRow = 0; targetRow < SIZE; targetRow += 1) for (let targetCol = 0; targetCol < SIZE; targetCol += 1) addWarp(targetRow, targetCol);
    } else {
      for (const vector of kingVectors()) addWarp(row + vector.dr * 2, col + vector.dc * 2);
    }
  }

  if (profile.families.includes('LASER')) {
    const rayDirections = /斜め|月光|角/.test(text) && !/縦横|同じ列|同じ段|前方同列/.test(text)
      ? diagonal(1)
      : /縦横|同じ列|同じ段|直線|前方|上下左右/.test(text)
        ? orthogonal(1)
        : [...orthogonal(1), ...diagonal(1)];
    rayDirections.forEach(vector => {
      const enemy = firstEnemyOnRay(board, row, col, piece.side, vector.dr, vector.dc);
      if (!enemy) return;
      result.push({ row: enemy[0], col: enemy[1], status: 'SPECIAL', action: 'RANGED_CAPTURE', note: '遠隔射撃' });
    });
  }

  if (profile.families.includes('SWAP')) {
    const radius = profile.tier >= 3 || /任意|盤上/.test(text) ? SIZE : /距離2|2以内/.test(text) ? 2 : 1;
    const allowEnemySwap = /敵|敵味方|相手|循環交換|捕獲済み/.test(text);
    for (let targetRow = 0; targetRow < SIZE; targetRow += 1) for (let targetCol = 0; targetCol < SIZE; targetCol += 1) {
      const target = board[targetRow][targetCol];
      if (!target || target.kind === 'K') continue;
      if (target.side !== piece.side && !allowEnemySwap) continue;
      if (Math.max(Math.abs(targetRow - row), Math.abs(targetCol - col)) > radius) continue;
      result.push({ row: targetRow, col: targetCol, status: 'SPECIAL', action: 'SWAP', note: '味方と位置交換' });
    }
  }

  if (profile.tier > 0 && /移動せず|手番を使って|1局1回、(?:盤上|空き|中央|敵|自軍|相手|指定)/.test(text)) {
    result.push({ row, col, status: 'SPECIAL', action: 'ACTIVATE', note: '固有能力を発動' });
  }

  return uniqueTargets(result);
};

const candidateMoves = (
  board: ShogiBoard,
  row: number,
  col: number,
  pieceOverride?: ShogiPiece,
  vectorOverride?: Vector[],
  mirrorJump = false,
  lastMove?: ShogiMove,
  terrain: ShogiTerrain[] = [],
): ShogiTarget[] => {
  const piece = pieceOverride || board[row]?.[col];
  if (!piece || piece.frozenTurns) return [];
  const custom = !vectorOverride && definitionOf(piece.kind).advanced
    ? customAdvancedTargets(board, row, col, piece, lastMove)
    : undefined;
  if (custom) return uniqueTargets(custom);
  const baseVectors = vectorOverride || (definitionOf(piece.kind).advanced ? advancedVectors(piece) : standardVectors(piece));
  const vectors = piece.reverseMovementTurns
    ? baseVectors.map(vector => ({ ...vector, dr: -vector.dr, dc: -vector.dc }))
    : baseVectors;
  const result: ShogiTarget[] = [];
  vectors.forEach(vector => {
    const max = vector.slide ? (vector.max || SIZE) : 1;
    for (let step = 1; step <= max; step += 1) {
      const targetRow = row + vector.dr * step;
      const targetCol = col + vector.dc * step;
      if (!inside(targetRow, targetCol)) break;
      if (terrainBlocksSquare(terrain, targetRow, targetCol, piece.side)) break;
      const target = board[targetRow][targetCol];
      const jumping = Boolean(vector.jump || mirrorJump);
      if (!canLandOn(piece, target, jumping)) break;
      if (target && piece.captureLockedTurns) {
        if (!jumping && vector.slide) break;
        continue;
      }
      if (!jumping && step > 1 && board[row + vector.dr * (step - 1)][col + vector.dc * (step - 1)]) break;
      if (target && vector.moveOnly) {
        if (!jumping && vector.slide) break;
        continue;
      }
      if (!target && vector.captureOnly) {
        if (!jumping && vector.slide) continue;
        continue;
      }
      result.push({
        row: targetRow,
        col: targetCol,
        status: target ? 'CAPTURE' : vector.special || mirrorJump ? 'SPECIAL' : 'MOVE',
        note: vector.special || mirrorJump ? '特殊移動' : undefined,
      });
      if (target || jumping || !vector.slide) break;
    }
  });
  if (!vectorOverride && isCatalogPiece(piece.kind)) result.push(...catalogSpecialTargets(board, terrain, row, col, piece));
  return uniqueTargets(result);
};

const locateKing = (board: ShogiBoard, side: ShogiSide): [number, number] | null => {
  for (let row = 0; row < SIZE; row += 1) for (let col = 0; col < SIZE; col += 1) {
    if (board[row][col]?.kind === 'K' && board[row][col]?.side === side) return [row, col];
  }
  return null;
};

const isAttacked = (board: ShogiBoard, row: number, col: number, bySide: ShogiSide): boolean => {
  for (let sourceRow = 0; sourceRow < SIZE; sourceRow += 1) for (let sourceCol = 0; sourceCol < SIZE; sourceCol += 1) {
    const piece = board[sourceRow][sourceCol];
    if (piece?.side !== bySide) continue;
    if (candidateMoves(board, sourceRow, sourceCol).some(target => target.row === row && target.col === col)) return true;
  }
  return false;
};

const moveLeavesKingSafe = (
  board: ShogiBoard,
  side: ShogiSide,
  from: [number, number],
  to: [number, number],
): boolean => {
  const next = cloneBoard(board);
  const piece = next[from[0]][from[1]];
  if (!piece) return false;
  next[to[0]][to[1]] = promotedOnArrival(piece, to[0]);
  next[from[0]][from[1]] = null;
  const king = locateKing(next, side);
  return Boolean(king && !isAttacked(next, king[0], king[1], side === 'P' ? 'C' : 'P'));
};

const isPromotionZone = (side: ShogiSide, row: number) => side === 'P' ? row <= 1 : row >= 3;
const forcedPromotion = (piece: ShogiPiece, toRow: number) =>
  !piece.promoted && ((piece.kind === 'P' || piece.kind === 'L') && isPromotionZone(piece.side, toRow) ||
    piece.kind === 'N' && (piece.side === 'P' ? toRow <= 1 : toRow >= 3));
const promotedOnArrival = (piece: ShogiPiece, toRow: number): ShogiPiece => ({
  ...piece,
  // Advance pieces explicitly never promote.  The previous generic rule
  // promoted every non-king/non-gold kind, which made unique pieces violate
  // their own inspector text as soon as they entered the promotion zone.
  promoted: piece.promoted || (!definitionOf(piece.kind).advanced && piece.kind !== 'K' && piece.kind !== 'G' && isPromotionZone(piece.side, toRow)),
  hasMoved: true,
});

const dropAllowed = (board: ShogiBoard, hands: ShogiHands, side: ShogiSide, kind: ShogiPieceKind, row: number, col: number): boolean => {
  if (!inside(row, col) || board[row][col] || !hands[side][kind]) return false;
  if (kind === 'P' && (side === 'P' ? row === 0 : row === 4)) return false;
  if (kind === 'L' && (side === 'P' ? row === 0 : row === 4)) return false;
  if (kind === 'N' && (side === 'P' ? row <= 1 : row >= 3)) return false;
  if (kind === 'P' && board.some(line => line[col]?.side === side && line[col]?.kind === 'P' && !line[col]?.promoted)) return false;
  return true;
};

const pieceValue = (kind: ShogiPieceKind): number => {
  if (kind === 'K') return 100;
  if (kind === 'R' || kind === 'ADV_CANNON' || kind === 'ADV_DRAGON') return 9;
  if (kind === 'B' || kind === 'ADV_STAR_BISHOP' || kind === 'ADV_PHOENIX') return 8;
  if (kind === 'G' || kind === 'S') return 5;
  if (kind === 'N' || kind === 'L') return 4;
  return definitionOf(kind).advanced ? 4 + Math.min(3, definitionOf(kind).stage / 15) : 1;
};

const boardSignature = (board: ShogiBoard): string =>
  board.map(row => row.map(piece => piece ? piece.side + ':' + piece.kind + (piece.promoted ? '+' : '') : '..').join('|')).join('/');

export const getShogiMovementTargets = (
  board: ShogiBoard,
  hands: ShogiHands,
  selection: { row: number; col: number } | { hand: ShogiPieceKind } | null,
  side: ShogiSide,
  history: ShogiMove[] = [],
  terrain: ShogiTerrain[] = [],
): ShogiTarget[] => {
  if (!selection) return [];
  if ('hand' in selection) {
    const targets: ShogiTarget[] = [];
    for (let row = 0; row < SIZE; row += 1) for (let col = 0; col < SIZE; col += 1) {
      if (dropAllowed(board, hands, side, selection.hand, row, col)) targets.push({ row, col, status: 'DROP' });
    }
    return targets;
  }
  const piece = board[selection.row]?.[selection.col];
  if (!piece || piece.side !== side) return [];
  const lastOpponentMove = [...history].reverse().find(move => move.side !== side);
  return candidateMoves(board, selection.row, selection.col, undefined, undefined, false, lastOpponentMove, terrain);
};

/** The learning duel deliberately uses piece-movement rules rather than
 * king-safe legality. A careless move stays on the board so the CPU can
 * capture the king and teach the consequence through an actual defeat. */
export const getShogiTargets = (
  board: ShogiBoard,
  hands: ShogiHands,
  selection: { row: number; col: number } | { hand: ShogiPieceKind } | null,
  side: ShogiSide,
  history: ShogiMove[] = [],
  terrain: ShogiTerrain[] = [],
): ShogiTarget[] => {
  return getShogiMovementTargets(board, hands, selection, side, history, terrain);
};

const applyMove = (
  board: ShogiBoard,
  hands: ShogiHands,
  move: ShogiMove,
): { board: ShogiBoard; hands: ShogiHands; captured: ShogiPiece | null; capturedKing: boolean; movedTo: [number, number] | null } => {
  const nextBoard = cloneBoard(board);
  const nextHands = cloneHands(hands);
  let captured: ShogiPiece | null = null;
  let capturedKing = false;
  if (move.from) {
    let moving = nextBoard[move.from[0]][move.from[1]];
    if (!moving) return { board: nextBoard, hands: nextHands, captured: null, capturedKing: false, movedTo: null };

    if (move.action === 'ACTIVATE') {
      return { board: nextBoard, hands: nextHands, captured: null, capturedKing: false, movedTo: move.from };
    }

    if (move.action === 'RANGED_CAPTURE') {
      const landed = nextBoard[move.to[0]][move.to[1]];
      if (landed && landed.side !== move.side && landed.kind !== 'K') {
        if (landed.reflectCharges && landed.reflectCharges > 0) {
          landed.reflectCharges -= 1;
          if (moving.kind !== 'K') {
            nextBoard[move.from[0]][move.from[1]] = null;
            addCapturedPieceToHand(nextHands, landed.side, moving, true);
          }
        } else {
          captured = landed;
          nextBoard[move.to[0]][move.to[1]] = null;
          if (!landed.ephemeral) nextHands[move.side][landed.kind] = (nextHands[move.side][landed.kind] || 0) + 1;
          applyCapturedPieceTrigger(landed, moving, true);
          const landedDefinition = definitionOf(landed.kind);
          if (
            moving.kind !== 'K'
            && gimmickProfileOf(landed.kind).families.includes('REFLECT')
            && /発生源の敵も同時に捕獲/.test(`${landedDefinition.description} ${landedDefinition.restriction}`)
          ) {
            nextBoard[move.from[0]][move.from[1]] = null;
            addCapturedPieceToHand(nextHands, landed.side, moving, true);
          }
        }
      }
      return { board: nextBoard, hands: nextHands, captured, capturedKing: false, movedTo: move.from };
    }

    if (move.action === 'SWAP') {
      const other = nextBoard[move.to[0]][move.to[1]];
      if (!other || other.kind === 'K') return { board: nextBoard, hands: nextHands, captured: null, capturedKing: false, movedTo: move.from };
      nextBoard[move.from[0]][move.from[1]] = { ...other, hasMoved: true };
      nextBoard[move.to[0]][move.to[1]] = { ...moving, hasMoved: true };
      return { board: nextBoard, hands: nextHands, captured: null, capturedKing: false, movedTo: move.to };
    }

    const path = move.path?.length ? move.path : [move.to];
    let current = move.from;
    path.forEach(([targetRow, targetCol], index) => {
      const landed = nextBoard[targetRow][targetCol];
      if (landed) {
        captured = landed;
        if (landed.kind === 'K') capturedKing = true;
        if (landed.kind !== 'K') {
          applyCapturedPieceTrigger(landed, moving!, false);
          const reviveProfile = gimmickProfileOf(landed.kind);
          const canRevive = isCatalogPiece(landed.kind)
            && reviveProfile.families.includes('REVIVE')
            && !landed.gimmickUsed;
          if (canRevive) {
            const homeRow = landed.side === 'P' ? SIZE - 1 : 0;
            const fallbackRow = landed.side === 'P' ? SIZE - 2 : 1;
            const reviveCell = [homeRow, fallbackRow].flatMap(candidateRow =>
              Array.from({ length: SIZE }, (_, candidateCol) => [candidateRow, candidateCol] as [number, number]),
            ).find(([candidateRow, candidateCol]) => !nextBoard[candidateRow][candidateCol]);
            if (reviveCell) {
              nextBoard[reviveCell[0]][reviveCell[1]] = { ...landed, promoted: false, gimmickUsed: true, hasMoved: true };
            } else if (!landed.ephemeral) {
              nextHands[move.side][landed.kind] = (nextHands[move.side][landed.kind] || 0) + 1;
            }
          } else if (!landed.ephemeral) {
            nextHands[move.side][landed.kind] = (nextHands[move.side][landed.kind] || 0) + 1;
          }
        }
      }
      nextBoard[current[0]][current[1]] = null;
      const arrived = promotedOnArrival(moving!, targetRow);
      nextBoard[targetRow][targetCol] = index === path.length - 1
        ? move.kind === 'ADV_CHRONOS' && path.length > 1
          ? { ...arrived, extraMoveUsed: true }
          : arrived
        : moving;
      current = [targetRow, targetCol];
    });
  } else {
    nextBoard[move.to[0]][move.to[1]] = makeShogiPiece(move.kind, move.side);
    nextHands[move.side][move.kind] = Math.max(0, (nextHands[move.side][move.kind] || 0) - 1);
  }
  if (!move.from && captured && captured.kind !== 'K') {
    nextHands[move.side][captured.kind] = (nextHands[move.side][captured.kind] || 0) + 1;
  }
  return { board: nextBoard, hands: nextHands, captured, capturedKing, movedTo: move.to };
};

const addCapturedPieceToHand = (hands: ShogiHands, side: ShogiSide, piece: ShogiPiece, allow = true) => {
  if (!allow || piece.kind === 'K' || piece.ephemeral) return;
  hands[side][piece.kind] = (hands[side][piece.kind] || 0) + 1;
};

const removeAutomaticTarget = (
  board: ShogiBoard,
  hands: ShogiHands,
  side: ShogiSide,
  row: number,
  col: number,
  addToHand: boolean,
): boolean => {
  const target = board[row]?.[col];
  if (!target || target.side === side || target.kind === 'K') return false;
  if (target.reflectCharges && target.reflectCharges > 0) {
    target.reflectCharges -= 1;
    return false;
  }
  board[row][col] = null;
  addCapturedPieceToHand(hands, side, target, addToHand);
  return true;
};

const moveOneSquareToward = (
  board: ShogiBoard,
  fromRow: number,
  fromCol: number,
  targetRow: number,
  targetCol: number,
): boolean => {
  const piece = board[fromRow]?.[fromCol];
  if (!piece || piece.kind === 'K') return false;
  const dr = Math.sign(targetRow - fromRow);
  const dc = Math.sign(targetCol - fromCol);
  const nextRow = fromRow + dr;
  const nextCol = fromCol + dc;
  if (!inside(nextRow, nextCol) || board[nextRow][nextCol]) return false;
  board[nextRow][nextCol] = piece;
  board[fromRow][fromCol] = null;
  return true;
};

const moveOneSquareAway = (
  board: ShogiBoard,
  fromRow: number,
  fromCol: number,
  centerRow: number,
  centerCol: number,
): boolean => {
  const piece = board[fromRow]?.[fromCol];
  if (!piece || piece.kind === 'K') return false;
  let dr = Math.sign(fromRow - centerRow);
  let dc = Math.sign(fromCol - centerCol);
  if (!dr && !dc) return false;
  const nextRow = fromRow + dr;
  const nextCol = fromCol + dc;
  if (!inside(nextRow, nextCol) || board[nextRow][nextCol]) return false;
  board[nextRow][nextCol] = piece;
  board[fromRow][fromCol] = null;
  return true;
};

const tickStatusesForSide = (board: ShogiBoard, side: ShogiSide): ShogiBoard => {
  const next = cloneBoard(board);
  for (let row = 0; row < SIZE; row += 1) for (let col = 0; col < SIZE; col += 1) {
    const piece = next[row][col];
    if (!piece || piece.side !== side) continue;
    if (piece.frozenTurns) piece.frozenTurns = Math.max(0, piece.frozenTurns - 1);
    if (piece.silencedTurns) piece.silencedTurns = Math.max(0, piece.silencedTurns - 1);
    if (piece.captureLockedTurns) piece.captureLockedTurns = Math.max(0, piece.captureLockedTurns - 1);
    if (piece.reverseMovementTurns) piece.reverseMovementTurns = Math.max(0, piece.reverseMovementTurns - 1);
    if (piece.ephemeralTurns) {
      piece.ephemeralTurns -= 1;
      if (piece.ephemeralTurns <= 0) next[row][col] = null;
    }
    if (piece.transformTurns) {
      piece.transformTurns -= 1;
      if (piece.transformTurns <= 0 && piece.originalKind) {
        piece.kind = piece.originalKind;
        piece.originalKind = undefined;
        piece.transformTurns = undefined;
      }
    }
  }
  return next;
};

const tickTerrain = (terrain: ShogiTerrain[]): ShogiTerrain[] =>
  terrain.map(item => ({ ...item, turnsLeft: item.turnsLeft - 1 })).filter(item => item.turnsLeft > 0);

const applyTerrainPulse = (board: ShogiBoard, terrain: ShogiTerrain[]): ShogiBoard => {
  const next = cloneBoard(board);
  terrain.filter(item => item.type === 'GRAVITY_FIELD').forEach(field => {
    const candidates: Array<{ row: number; col: number; distance: number }> = [];
    for (let row = 0; row < SIZE; row += 1) for (let col = 0; col < SIZE; col += 1) {
      const piece = next[row][col];
      if (!piece || piece.kind === 'K') continue;
      const distance = Math.max(Math.abs(row - field.row), Math.abs(col - field.col));
      if (distance > 0 && distance <= 2) candidates.push({ row, col, distance });
    }
    candidates.sort((left, right) => left.distance - right.distance);
    // Move the closest pieces first so the field feels like a real pull rather
    // than a visual-only tile. Kings are deliberately immune.
    candidates.slice(0, 3).forEach(candidate => {
      moveOneSquareToward(next, candidate.row, candidate.col, field.row, field.col);
    });
  });
  return next;
};

const terrainTypeForText = (text: string): ShogiTerrainType => {
  if (/穴|クレーター|隕/.test(text)) return 'CRATER';
  if (/ポータル|門|裂け目/.test(text)) return 'PORTAL';
  if (/レーザー|光床|光線/.test(text)) return 'LASER_FLOOR';
  if (/重力|事象|引力/.test(text)) return 'GRAVITY_FIELD';
  if (/罠|地雷|爆弾/.test(text)) return 'TRAP';
  return 'BARRIER';
};

const applyCapturedPieceTrigger = (
  captured: ShogiPiece,
  capturer: ShogiPiece,
  captureWasRemote: boolean,
) => {
  if (capturer.kind === 'K') return;
  const definition = definitionOf(captured.kind);
  const text = `${definition.description} ${definition.restriction}`;
  if (!/捕獲された時|取られた時|取られると|捕獲されると|捕獲された場合|この駒を捕獲した/.test(text)) return;
  const profile = gimmickProfileOf(captured.kind);
  // These statuses are applied to the piece that just moved. The engine ticks
  // the moving side once at end-of-turn, so use two counts to preserve one
  // full future owning-side turn after that immediate tick.
  if (profile.families.includes('FREEZE')) capturer.frozenTurns = Math.max(capturer.frozenTurns || 0, 2);
  if (profile.families.includes('SILENCE') || /捕獲を伴う移動ができない/.test(text)) {
    capturer.captureLockedTurns = Math.max(capturer.captureLockedTurns || 0, 2);
  }
  if (profile.families.includes('REFLECT') && /移動方向を反転/.test(text)) {
    capturer.reverseMovementTurns = Math.max(capturer.reverseMovementTurns || 0, 2);
  }
  if (captureWasRemote && profile.families.includes('REFLECT') && /発生源の敵も同時に捕獲/.test(text)) {
    capturer.captureLockedTurns = Math.max(capturer.captureLockedTurns || 0, 2);
  }
};

const applyTerrainEntry = (
  board: ShogiBoard,
  hands: ShogiHands,
  terrain: ShogiTerrain[],
  move: ShogiMove,
  movedTo: [number, number] | null,
): { board: ShogiBoard; hands: ShogiHands } => {
  if (!movedTo || move.action === 'RANGED_CAPTURE') return { board, hands };
  const nextBoard = cloneBoard(board);
  const nextHands = cloneHands(hands);
  const entered = terrain.filter(item => item.row === movedTo[0] && item.col === movedTo[1] && item.side !== move.side);
  const moving = nextBoard[movedTo[0]]?.[movedTo[1]];
  if (!moving) return { board: nextBoard, hands: nextHands };
  const harmful = entered.find(item => item.type === 'TRAP' || item.type === 'LASER_FLOOR');
  if (harmful && moving.kind !== 'K') {
    nextBoard[movedTo[0]][movedTo[1]] = null;
    addCapturedPieceToHand(nextHands, harmful.side, moving, true);
    return { board: nextBoard, hands: nextHands };
  }
  const portal = entered.find(item => item.type === 'PORTAL' && item.group);
  if (portal && moving.kind !== 'K') {
    const exit = terrain.find(item => item.type === 'PORTAL' && item.group === portal.group && item.id !== portal.id && !nextBoard[item.row][item.col]);
    if (exit) {
      nextBoard[exit.row][exit.col] = moving;
      nextBoard[movedTo[0]][movedTo[1]] = null;
    }
  }
  return { board: nextBoard, hands: nextHands };
};

const applyCatalogGimmicks = (
  board: ShogiBoard,
  hands: ShogiHands,
  terrain: ShogiTerrain[],
  move: ShogiMove,
  captured: ShogiPiece | null,
  movedTo: [number, number] | null,
  eventNonce: number,
): { board: ShogiBoard; hands: ShogiHands; terrain: ShogiTerrain[]; event: ShogiGimmickEvent | null } => {
  if (!move.from || !movedTo || !isCatalogPiece(move.kind)) return { board, hands, terrain, event: null };
  const definition = definitionOf(move.kind);
  const profile = gimmickProfileOf(move.kind);
  if (profile.families.length === 1 && profile.families[0] === 'NONE') return { board, hands, terrain, event: null };
  const text = `${definition.description} ${definition.restriction}`;
  const nextBoard = cloneBoard(board);
  const nextHands = cloneHands(hands);
  let nextTerrain = terrain.map(item => ({ ...item }));
  const moving = nextBoard[movedTo[0]]?.[movedTo[1]] || nextBoard[move.from[0]]?.[move.from[1]];
  if (!moving || moving.silencedTurns) return { board: nextBoard, hands: nextHands, terrain: nextTerrain, event: null };
  const once = isOncePerBattleCatalogEffect(definition.restriction, definition.description);
  if (once && moving.gimmickUsed) return { board: nextBoard, hands: nextHands, terrain: nextTerrain, event: null };
  const captureRequired = /捕獲時|捕獲すると|捕獲した時|敵を捕獲した|取った時/.test(text);
  const activeTrigger = !captureRequired || Boolean(captured) || move.action === 'RANGED_CAPTURE';
  if (!activeTrigger && !profile.families.some(family => ['REFLECT', 'BARRIER', 'FORECAST', 'GRAVITY'].includes(family))) {
    return { board: nextBoard, hands: nextHands, terrain: nextTerrain, event: null };
  }
  const addRemovedToHand = !/除去|除外|消滅|持ち駒になら/.test(text);
  const tier = profile.tier;
  let triggered = move.action === 'WARP' || move.action === 'RANGED_CAPTURE' || move.action === 'SWAP' || move.action === 'ACTIVATE';

  if (profile.families.includes('EXPLOSION') && activeTrigger) {
    const radius = tier >= 4 ? 2 : 1;
    let removed = 0;
    const limit = tier >= 3 ? Number.POSITIVE_INFINITY : 1 + tier;
    explosionLoop:
    for (let targetRow = 0; targetRow < SIZE; targetRow += 1) for (let targetCol = 0; targetCol < SIZE; targetCol += 1) {
      const distance = Math.max(Math.abs(targetRow - movedTo[0]), Math.abs(targetCol - movedTo[1]));
      if (!distance || distance > radius) continue;
      if (removeAutomaticTarget(nextBoard, nextHands, move.side, targetRow, targetCol, addRemovedToHand)) {
        removed += 1;
        if (removed >= limit) break explosionLoop;
      }
    }
    triggered ||= removed > 0;
  }

  if (profile.families.includes('CHAIN') && activeTrigger && captured) {
    let frontier: Array<[number, number]> = [movedTo];
    let removed = 0;
    const limit = Math.min(5, 1 + tier);
    while (frontier.length && removed < limit) {
      const [centerRow, centerCol] = frontier.shift()!;
      let found: [number, number] | null = null;
      for (const vector of kingVectors()) {
        const targetRow = centerRow + vector.dr;
        const targetCol = centerCol + vector.dc;
        const target = nextBoard[targetRow]?.[targetCol];
        if (target && target.side !== move.side && target.kind !== 'K') { found = [targetRow, targetCol]; break; }
      }
      if (found && removeAutomaticTarget(nextBoard, nextHands, move.side, found[0], found[1], addRemovedToHand)) {
        removed += 1;
        frontier.push(found);
      }
    }
    triggered ||= removed > 0;
  }

  if (profile.families.some(family => family === 'PULL' || family === 'GRAVITY' || family === 'BLACK_HOLE')) {
    const candidates: Array<{ row: number; col: number; distance: number }> = [];
    for (let targetRow = 0; targetRow < SIZE; targetRow += 1) for (let targetCol = 0; targetCol < SIZE; targetCol += 1) {
      const target = nextBoard[targetRow][targetCol];
      if (!target || target.side === move.side || target.kind === 'K') continue;
      candidates.push({ row: targetRow, col: targetCol, distance: Math.max(Math.abs(targetRow - movedTo[0]), Math.abs(targetCol - movedTo[1])) });
    }
    candidates.sort((left, right) => left.distance - right.distance);
    const limit = profile.families.includes('BLACK_HOLE') ? Math.min(8, 2 + tier) : tier >= 3 ? 2 : 1;
    let moved = 0;
    for (const candidate of candidates) {
      if (moveOneSquareToward(nextBoard, candidate.row, candidate.col, movedTo[0], movedTo[1])) moved += 1;
      if (moved >= limit) break;
    }
    triggered ||= moved > 0;
  }

  if (profile.families.includes('PUSH')) {
    let pushed = 0;
    for (const vector of kingVectors()) {
      const targetRow = movedTo[0] + vector.dr;
      const targetCol = movedTo[1] + vector.dc;
      if (nextBoard[targetRow]?.[targetCol]?.side === move.side) continue;
      if (moveOneSquareAway(nextBoard, targetRow, targetCol, movedTo[0], movedTo[1])) pushed += 1;
    }
    triggered ||= pushed > 0;
  }

  if (profile.families.some(family => family === 'TIME' || family === 'FREEZE')) {
    if (tier >= 4 && move.action === 'ACTIVATE' && move.side === 'P') {
      let frozen = 0;
      for (let targetRow = 0; targetRow < SIZE; targetRow += 1) for (let targetCol = 0; targetCol < SIZE; targetCol += 1) {
        const target = nextBoard[targetRow][targetCol];
        if (!target || target.side === move.side || target.kind === 'K') continue;
        target.frozenTurns = Math.max(target.frozenTurns || 0, 1);
        frozen += 1;
      }
      triggered ||= frozen > 0;
    } else {
    const limit = tier >= 4 ? 2 : 1;
    let frozen = 0;
    for (const vector of kingVectors()) {
      const target = nextBoard[movedTo[0] + vector.dr]?.[movedTo[1] + vector.dc];
      if (!target || target.side === move.side || target.kind === 'K') continue;
      target.frozenTurns = Math.max(target.frozenTurns || 0, tier >= 3 ? 2 : 1);
      frozen += 1;
      if (frozen >= limit) break;
    }
    triggered ||= frozen > 0;
    }
  }

  if (profile.families.includes('SILENCE')) {
    let silenced = 0;
    for (const vector of kingVectors()) {
      const target = nextBoard[movedTo[0] + vector.dr]?.[movedTo[1] + vector.dc];
      if (!target || target.side === move.side || target.kind === 'K' || !definitionOf(target.kind).advanced) continue;
      target.silencedTurns = Math.max(target.silencedTurns || 0, 1 + (tier >= 4 ? 1 : 0));
      silenced += 1;
      if (silenced >= 1 + Math.floor(tier / 2)) break;
    }
    triggered ||= silenced > 0;
  }

  if (profile.families.some(family => family === 'REFLECT' || family === 'BARRIER')) {
    moving.reflectCharges = Math.max(moving.reflectCharges || 0, 1 + (tier >= 4 ? 1 : 0));
    triggered = true;
  }

  if (profile.families.includes('CLONE')) {
    const emptyCandidates: Array<[number, number]> = [];
    if (!nextBoard[move.from[0]][move.from[1]]) emptyCandidates.push(move.from);
    for (const vector of kingVectors()) {
      const targetRow = movedTo[0] + vector.dr;
      const targetCol = movedTo[1] + vector.dc;
      if (inside(targetRow, targetCol) && !nextBoard[targetRow][targetCol]) emptyCandidates.push([targetRow, targetCol]);
    }
    const count = Math.min(emptyCandidates.length, tier >= 4 ? 4 : tier >= 3 ? 2 : 1);
    for (let index = 0; index < count; index += 1) {
      const [cloneRow, cloneCol] = emptyCandidates[index];
      nextBoard[cloneRow][cloneCol] = { ...moving, ephemeral: true, ephemeralTurns: 2, gimmickUsed: true };
    }
    triggered ||= count > 0;
  }

  const explicitlyCreatesBarrierTerrain = profile.families.includes('BARRIER')
    && /障壁|バリア|結界|光壁|防護膜|力場|壁を|壁へ|壁・/.test(text)
    && /生成|設置|置|張る|変える|地形/.test(text);
  if (profile.families.includes('TERRAIN') || explicitlyCreatesBarrierTerrain) {
    const type = terrainTypeForText(text);
    const candidates: Array<[number, number]> = [];
    if (!nextBoard[move.from[0]][move.from[1]]) candidates.push(move.from);
    for (const vector of kingVectors()) {
      const targetRow = movedTo[0] + vector.dr;
      const targetCol = movedTo[1] + vector.dc;
      if (inside(targetRow, targetCol) && !nextBoard[targetRow][targetCol]) candidates.push([targetRow, targetCol]);
    }
    const terrainCount = Math.min(candidates.length, tier >= 4 ? 3 : 1);
    const group = `g-${eventNonce}-${move.kind}`;
    for (let index = 0; index < terrainCount; index += 1) {
      const [terrainRow, terrainCol] = candidates[index];
      // Terrain is ticked after every half-turn, including the turn where it is
      // created.  Four plies guarantees that a newly-created one-turn portal or
      // hazard is still present for the creator's next turn; higher-tier terrain
      // lasts proportionally longer.
      const turnsLeft = tier >= 4 ? 8 : tier >= 3 ? 6 : 4;
      nextTerrain.push({ id: `${group}-${index}`, row: terrainRow, col: terrainCol, type, side: move.side, turnsLeft, group: type === 'PORTAL' ? group : undefined });
    }
    triggered ||= terrainCount > 0;
  }

  if (profile.families.includes('ROTATE') && tier >= 2) {
    const ring = kingVectors().map(vector => [movedTo[0] + vector.dr, movedTo[1] + vector.dc] as [number, number]).filter(([targetRow, targetCol]) => inside(targetRow, targetCol));
    const movable = ring.filter(([targetRow, targetCol]) => nextBoard[targetRow][targetCol] && nextBoard[targetRow][targetCol]!.kind !== 'K');
    if (movable.length >= 2) {
      const snapshots = movable.map(([targetRow, targetCol]) => nextBoard[targetRow][targetCol]);
      movable.forEach(([targetRow, targetCol], index) => { nextBoard[targetRow][targetCol] = snapshots[(index + snapshots.length - 1) % snapshots.length]; });
      triggered = true;
    }
  }

  if (profile.families.includes('PHASE')) {
    moving.reflectCharges = Math.max(moving.reflectCharges || 0, 1);
    triggered = true;
  }

  if (profile.families.includes('REVIVE') && activeTrigger) {
    const heldKind = Object.entries(nextHands[move.side]).find(([kind, count]) => kind !== 'K' && Number(count) > 0)?.[0] as ShogiPieceKind | undefined;
    if (heldKind) {
      const homeRows = move.side === 'P' ? [SIZE - 1, SIZE - 2] : [0, 1];
      const reviveCell = homeRows.flatMap(targetRow => Array.from({ length: SIZE }, (_, targetCol) => [targetRow, targetCol] as [number, number]))
        .find(([targetRow, targetCol]) => !nextBoard[targetRow][targetCol] && !terrainBlocksSquare(nextTerrain, targetRow, targetCol, move.side));
      if (reviveCell) {
        nextHands[move.side][heldKind] = Math.max(0, (nextHands[move.side][heldKind] || 0) - 1);
        nextBoard[reviveCell[0]][reviveCell[1]] = { ...makeShogiPiece(heldKind, move.side), frozenTurns: 1 };
        triggered = true;
      }
    }
  }

  if (profile.families.includes('FORECAST')) {
    const enemies: Array<ShogiPiece> = [];
    for (let targetRow = 0; targetRow < SIZE; targetRow += 1) for (let targetCol = 0; targetCol < SIZE; targetCol += 1) {
      const target = nextBoard[targetRow][targetCol];
      if (target && target.side !== move.side && target.kind !== 'K') enemies.push(target);
    }
    const forecastTarget = enemies[0];
    if (forecastTarget) {
      forecastTarget.silencedTurns = Math.max(forecastTarget.silencedTurns || 0, 1);
      if (tier >= 4) forecastTarget.frozenTurns = Math.max(forecastTarget.frozenTurns || 0, 1);
    }
    // Forecast is primarily information, so it still fires when there is no
    // eligible target to suppress.
    triggered = true;
  }

  if (profile.families.includes('TRANSFORM')) {
    let copied: ShogiPiece | null = null;
    for (const vector of kingVectors()) {
      const target = nextBoard[movedTo[0] + vector.dr]?.[movedTo[1] + vector.dc];
      if (target && target.side === move.side && target.kind !== 'K' && target.kind !== moving.kind) {
        copied = target;
        break;
      }
    }
    if (copied) {
      moving.originalKind = moving.originalKind || moving.kind;
      moving.kind = copied.kind;
      moving.transformTurns = 2;
      triggered = true;
    }
  }

  if (once && triggered) moving.gimmickUsed = true;
  const eventFamily = profile.families.find(family => family !== 'NONE') || 'NONE';
  return {
    board: nextBoard,
    hands: nextHands,
    terrain: nextTerrain,
    event: triggered ? {
      nonce: eventNonce,
      family: eventFamily,
      tier,
      row: movedTo[0],
      col: movedTo[1],
      label: definition.name,
    } : null,
  };
};

const allMovesForSide = (board: ShogiBoard, hands: ShogiHands, side: ShogiSide, history: ShogiMove[] = [], terrain: ShogiTerrain[] = []): ShogiMove[] => {
  const moves: ShogiMove[] = [];
  for (let row = 0; row < SIZE; row += 1) for (let col = 0; col < SIZE; col += 1) {
    const piece = board[row][col];
    if (!piece || piece.side !== side) continue;
    getShogiMovementTargets(board, hands, { row, col }, side, history, terrain).forEach(target => moves.push({
      from: [row, col],
      to: [target.row, target.col],
      kind: piece.kind,
      side,
      capture: board[target.row][target.col]?.kind || null,
      special: target.status === 'SPECIAL',
      path: target.path,
      action: target.action,
    }));
  }
  Object.keys(hands[side]).forEach(kindValue => {
    const kind = kindValue as ShogiPieceKind;
    getShogiMovementTargets(board, hands, { hand: kind }, side, history, terrain).forEach(target => moves.push({
      from: null,
      to: [target.row, target.col],
      kind,
      side,
      capture: null,
      action: target.action,
    }));
  });
  return moves;
};

const sideHasFrozenPiece = (board: ShogiBoard, side: ShogiSide): boolean =>
  board.some(row => row.some(piece => Boolean(piece && piece.side === side && piece.frozenTurns && piece.frozenTurns > 0)));

const seededRandom = (initial: number) => {
  let state = initial >>> 0;
  return () => {
    state = Math.imul(state ^ (state >>> 15), state | 1);
    state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
};
const shuffled = <T,>(values: T[], random: () => number): T[] => {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
};

const stageUniqueCount = (stage: number) =>
  stage <= 100 ? 1
    : stage <= 200 ? 2
      : stage <= 300 ? 3
        : stage <= 400 ? 4
          : stage <= 450 ? 5
            : stage < ADVANCED_PIECES.length ? 6
              : 8;

const isSafeInitialPosition = (board: ShogiBoard) => {
  const playerKing = locateKing(board, 'P');
  const cpuKing = locateKing(board, 'C');
  if (!playerKing || !cpuKing) return false;
  return !isAttacked(board, playerKing[0], playerKing[1], 'C')
    && !isAttacked(board, cpuKing[0], cpuKing[1], 'P');
};

const buildShogiPosition = (
  mode: ShogiMode,
  stage: number,
  random: () => number,
  playMode: ShogiPlayMode,
  advancedUnlockCount = stage,
): { board: ShogiBoard; hands: ShogiHands; uniqueKinds: ShogiPieceKind[] } => {
  const board = emptyBoard();
  const hands = emptyHands();
  const uniqueKinds: ShogiPieceKind[] = [];
  const baseKinds: ShogiPieceKind[] = ['R', 'B', 'G', 'S', 'N', 'L', 'P'];
  if (mode === 'ADVANCE') {
    const unlockedCount = Math.max(1, Math.min(ADVANCED_PIECES.length, Math.floor(advancedUnlockCount)));
    const unlocked = ADVANCED_PIECES.slice(0, unlockedCount);
    const uniqueCount = playMode === 'LOCAL'
      ? Math.min(4, unlocked.length)
      : Math.min(stageUniqueCount(stage), unlocked.length);
    if (playMode !== 'LOCAL' && stage <= ADVANCED_PIECES.length) uniqueKinds.push(ADVANCED_PIECES[stage - 1].kind);
    while (uniqueKinds.length < uniqueCount) {
      const pick = unlocked[Math.floor(random() * unlocked.length)].kind;
      if (!uniqueKinds.includes(pick)) uniqueKinds.push(pick);
    }
  }
  // Face-to-face Advance is a free duel: keep the same five standard-piece
  // slots as STANDARD and add up to four unlocked unique pieces alongside
  // them. CPU stages retain their teaching-oriented stage composition.
  const standardPieceSlots = mode === 'ADVANCE' && playMode !== 'LOCAL'
    ? Math.max(1, 9 - uniqueKinds.length)
    : 5;
  const playerKinds = shuffled(baseKinds, random).slice(0, standardPieceSlots);
  const cpuKinds = shuffled(baseKinds, random).slice(0, standardPieceSlots);
  const playerPieces = [makeShogiPiece('K', 'P'), ...playerKinds.map(kind => makeShogiPiece(kind, 'P'))];
  const cpuPieces = [makeShogiPiece('K', 'C'), ...cpuKinds.map(kind => makeShogiPiece(kind, 'C'))];
  if (mode === 'ADVANCE') {
    uniqueKinds.forEach(kind => {
      // Advance is a symmetric duel: both sides receive the same randomly
      // selected special-piece set, so setup luck never decides the match.
      playerPieces.push(makeShogiPiece(kind, 'P'));
      cpuPieces.push(makeShogiPiece(kind, 'C'));
    });
  }
  const playerCells = shuffled([[3, 0], [3, 1], [3, 2], [3, 3], [3, 4], [4, 0], [4, 1], [4, 2], [4, 3], [4, 4]] as Array<[number, number]>, random);
  const cpuCells = shuffled([[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 0], [1, 1], [1, 2], [1, 3], [1, 4]] as Array<[number, number]>, random);
  playerPieces.slice(0, playerCells.length).forEach((piece, index) => { board[playerCells[index][0]][playerCells[index][1]] = piece; });
  cpuPieces.slice(0, cpuCells.length).forEach((piece, index) => { board[cpuCells[index][0]][cpuCells[index][1]] = piece; });
  return { board, hands, uniqueKinds };
};

export const createShogiPosition = (
  mode: ShogiMode,
  stage: number,
  seed: number,
  playMode: ShogiPlayMode = 'CPU',
  advancedUnlockCount = mode === 'ADVANCE' ? stage : 0,
): { board: ShogiBoard; hands: ShogiHands; uniqueKinds: ShogiPieceKind[]; unlockedAdvancedCount: number } => {
  // A fully random placement could put a rook/lance/bishop in line with a
  // king before the first turn. That made otherwise movable pieces appear to
  // have no destinations because every move left the king in check.
  let position = buildShogiPosition(mode, stage, seededRandom(seed), playMode, advancedUnlockCount);
  for (let attempt = 1; attempt < 64 && !isSafeInitialPosition(position.board); attempt += 1) {
    position = buildShogiPosition(mode, stage, seededRandom(seed + attempt * 7919), playMode, advancedUnlockCount);
  }
  return {
    ...position,
    unlockedAdvancedCount: mode === 'ADVANCE'
      ? Math.max(1, Math.min(ADVANCED_PIECES.length, Math.floor(advancedUnlockCount)))
      : 0,
  };
};

export const createShogiGame = (
  mode: ShogiMode,
  stage = 1,
  seed = Date.now(),
  playMode: ShogiPlayMode = 'CPU',
  advancedUnlockCount = mode === 'ADVANCE' ? stage : 0,
): ShogiGameState => {
  const position = createShogiPosition(mode, stage, seed, playMode, advancedUnlockCount);
  return {
    mode,
    playMode,
    stage,
    activeAdvancedKinds: position.uniqueKinds,
    unlockedAdvancedCount: position.unlockedAdvancedCount,
    seed,
    board: position.board,
    hands: position.hands,
    side: 'P',
    turn: 1,
    result: null,
    selected: null,
    legalTargets: [],
    message: playMode === 'LOCAL'
      ? (mode === 'ADVANCE' ? '対面アドバンス局。先手が駒を選んでください。' : '対面局。先手が駒を選んでください。')
      : mode === 'ADVANCE' ? 'ステージ' + stage + '：駒を選んで移動範囲を確認。' : '新しい盤面を生成しました。駒を選んで移動範囲を確認。',
    history: [],
    lastMove: null,
    signature: boardSignature(position.board),
    terrain: [],
    gimmickEvent: null,
  };
};

const chooseCpuMove = (state: ShogiGameState): ShogiMove | null => {
  const moves = allMovesForSide(state.board, state.hands, 'C', state.history, state.terrain);
  if (!moves.length) return null;
  return [...moves].sort((left, right) => {
    const rightScore = (right.capture ? pieceValue(right.capture) : 0) * 100 + (right.special ? 4 : 0);
    const leftScore = (left.capture ? pieceValue(left.capture) : 0) * 100 + (left.special ? 4 : 0);
    return rightScore - leftScore;
  })[0];
};

export const selectShogiPiece = (
  state: ShogiGameState,
  selection: { row: number; col: number } | { hand: ShogiPieceKind },
): ShogiGameState => {
  const nextTargets = getShogiMovementTargets(state.board, state.hands, selection, state.side, state.history, state.terrain);
  return {
    ...state,
    selected: selection,
    legalTargets: nextTargets,
    message: nextTargets.length ? '駒本来の移動先を表示しています。王が危険になる手も指せます。失敗から守り方を学びましょう。' : 'この駒は駒の動きとして移動先がありません。',
  };
};

export const playShogiMove = (state: ShogiGameState, target: [number, number]): ShogiGameState => {
  if (state.result || !state.selected) return state;
  // The board and hands are the source of truth. Recalculate targets here so
  // a target from a previous render/game can never affect the current move.
  const movingSide = state.side;
  const currentTargets = getShogiMovementTargets(state.board, state.hands, state.selected, movingSide, state.history, state.terrain);
  const allowed = currentTargets.find(item => item.row === target[0] && item.col === target[1]);
  if (!allowed) return { ...state, message: 'そのマスには移動できません。表示された候補を選んでください。' };
  const selection = state.selected;
  const piece = 'hand' in selection ? null : state.board[selection.row][selection.col];
  const move: ShogiMove = {
    from: 'hand' in selection ? null : [selection.row, selection.col],
    to: target,
    kind: 'hand' in selection ? selection.hand : piece!.kind,
    side: movingSide,
    capture: state.board[target[0]][target[1]]?.kind || null,
    special: allowed.status === 'SPECIAL',
    path: allowed.path,
    action: allowed.action,
  };
  const applied = applyMove(state.board, state.hands, move);
  const terrainApplied = applyTerrainEntry(applied.board, applied.hands, state.terrain, move, applied.movedTo);
  const playerGimmick = applyCatalogGimmicks(
    terrainApplied.board,
    terrainApplied.hands,
    state.terrain,
    move,
    applied.captured,
    applied.movedTo,
    state.history.length + 1,
  );
  const playerBoard = tickStatusesForSide(applyTerrainPulse(playerGimmick.board, playerGimmick.terrain), movingSide);
  const playerTerrain = tickTerrain(playerGimmick.terrain);
  const interim: ShogiGameState = {
    ...state,
    board: playerBoard,
    hands: playerGimmick.hands,
    terrain: playerTerrain,
    gimmickEvent: playerGimmick.event,
    selected: null,
    legalTargets: [],
    lastMove: move,
    history: [...state.history, move],
    turn: state.turn + 1,
    signature: boardSignature(playerBoard),
  };
  if (applied.capturedKing) {
    return {
      ...interim,
      result: movingSide === 'P' ? 'WIN' : 'LOSE',
      message: state.playMode === 'LOCAL'
        ? (movingSide === 'P' ? '先手が王を取りました。先手の勝利！' : '後手が王を取りました。後手の勝利！')
        : '相手の王を取りました。勝利！',
    };
  }
  if (state.playMode === 'LOCAL') {
    const nextSide: ShogiSide = movingSide === 'P' ? 'C' : 'P';
    const nextMoves = allMovesForSide(interim.board, interim.hands, nextSide, interim.history, interim.terrain);
    if (!nextMoves.length && sideHasFrozenPiece(interim.board, nextSide)) {
      const recoveredBoard = tickStatusesForSide(interim.board, nextSide);
      return {
        ...interim,
        board: recoveredBoard,
        terrain: tickTerrain(interim.terrain),
        side: movingSide,
        signature: boardSignature(recoveredBoard),
        message: '時間停止で相手の手番をスキップしました。もう一度指せます。',
      };
    }
    if (!nextMoves.length) return { ...interim, side: nextSide, result: 'DRAW', message: '動かせる駒がありません。引き分けです。' };
    return {
      ...interim,
      side: nextSide,
      message: nextSide === 'P' ? '先手の手番です。' : '後手の手番です。端末を相手へ渡してください。',
    };
  }
  const cpuMoves = allMovesForSide(interim.board, interim.hands, 'C', interim.history, interim.terrain);
  if (cpuMoves.length === 0 && sideHasFrozenPiece(interim.board, 'C')) {
    const recoveredBoard = tickStatusesForSide(interim.board, 'C');
    return {
      ...interim,
      board: recoveredBoard,
      terrain: tickTerrain(interim.terrain),
      side: 'P',
      signature: boardSignature(recoveredBoard),
      message: '時間停止！ CPUの手番をスキップしました。あなたの手番です。',
    };
  }
  if (cpuMoves.length === 0) return { ...interim, result: 'DRAW', message: 'CPUに動かせる駒がありません。引き分けです。' };
  const cpuMove = chooseCpuMove(interim);
  if (!cpuMove) return { ...interim, result: 'DRAW', message: 'CPUに動かせる駒がありません。引き分けです。' };
  const cpuApplied = applyMove(interim.board, interim.hands, cpuMove);
  const cpuTerrainApplied = applyTerrainEntry(cpuApplied.board, cpuApplied.hands, interim.terrain, cpuMove, cpuApplied.movedTo);
  const cpuGimmick = applyCatalogGimmicks(
    cpuTerrainApplied.board,
    cpuTerrainApplied.hands,
    interim.terrain,
    cpuMove,
    cpuApplied.captured,
    cpuApplied.movedTo,
    interim.history.length + 1,
  );
  const cpuBoard = tickStatusesForSide(applyTerrainPulse(cpuGimmick.board, cpuGimmick.terrain), 'C');
  const cpuTerrain = tickTerrain(cpuGimmick.terrain);
  const afterCpu: ShogiGameState = {
    ...interim,
    board: cpuBoard,
    hands: cpuGimmick.hands,
    terrain: cpuTerrain,
    side: 'P',
    lastMove: cpuMove,
    history: [...interim.history, cpuMove],
    message: 'CPUが指しました。あなたの手番です。',
    signature: boardSignature(cpuBoard),
    gimmickEvent: cpuGimmick.event || playerGimmick.event,
  };
  if (cpuApplied.capturedKing) {
    return {
      ...afterCpu,
      result: 'LOSE',
      message: '王を取られました。敗北。',
    };
  }
  const playerMoves = allMovesForSide(afterCpu.board, afterCpu.hands, 'P', afterCpu.history, afterCpu.terrain);
  if (playerMoves.length === 0 && sideHasFrozenPiece(afterCpu.board, 'P')) {
    const recoveredBoard = tickStatusesForSide(afterCpu.board, 'P');
    return {
      ...afterCpu,
      board: recoveredBoard,
      signature: boardSignature(recoveredBoard),
      message: '時間停止の効果が切れました。あなたの手番です。',
    };
  }
  if (playerMoves.length === 0) return { ...afterCpu, result: 'DRAW', message: '動かせる駒がありません。引き分けです。' };
  return afterCpu;
};

export const getPieceDefinition = (kind: ShogiPieceKind) => definitionOf(kind);
export const getPieceValue = pieceValue;
export const getShogiBoardSignature = boardSignature;
export const getAdvancedStageUniqueCount = stageUniqueCount;
export const isShogiInCheck = (board: ShogiBoard, side: ShogiSide) => {
  const king = locateKing(board, side);
  return Boolean(king && isAttacked(board, king[0], king[1], side === 'P' ? 'C' : 'P'));
};
