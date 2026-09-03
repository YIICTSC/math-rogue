import {
  ADVANCED_PIECES,
  SHOGI_PIECE_MAP,
  makeShogiPiece,
  type ShogiPiece,
  type ShogiPieceDefinition,
  type ShogiPieceKind,
  type ShogiSide,
} from './shogiPieces';

export type ShogiMode = 'STANDARD' | 'ADVANCE';
export type ShogiPlayMode = 'CPU' | 'LOCAL';
export type ShogiBoard = Array<Array<ShogiPiece | null>>;
export type ShogiHands = Record<ShogiSide, Partial<Record<ShogiPieceKind, number>>>;
export type ShogiTargetStatus = 'MOVE' | 'CAPTURE' | 'DROP' | 'SPECIAL';
export interface ShogiTarget {
  row: number;
  col: number;
  status: ShogiTargetStatus;
  note?: string;
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
}
export interface ShogiGameState {
  mode: ShogiMode;
  playMode: ShogiPlayMode;
  stage: number;
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
}

interface Vector {
  dr: number;
  dc: number;
  max?: number;
  slide?: boolean;
  jump?: boolean;
  special?: boolean;
}

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
  switch (definitionOf(piece.kind).pattern) {
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

const candidateMoves = (
  board: ShogiBoard,
  row: number,
  col: number,
  pieceOverride?: ShogiPiece,
  vectorOverride?: Vector[],
  mirrorJump = false,
  lastMove?: ShogiMove,
): ShogiTarget[] => {
  const piece = pieceOverride || board[row]?.[col];
  if (!piece) return [];
  const custom = !vectorOverride && definitionOf(piece.kind).advanced
    ? customAdvancedTargets(board, row, col, piece, lastMove)
    : undefined;
  if (custom) return uniqueTargets(custom);
  const vectors = vectorOverride || (definitionOf(piece.kind).advanced ? advancedVectors(piece) : standardVectors(piece));
  const result: ShogiTarget[] = [];
  vectors.forEach(vector => {
    const max = vector.slide ? (vector.max || SIZE) : 1;
    for (let step = 1; step <= max; step += 1) {
      const targetRow = row + vector.dr * step;
      const targetCol = col + vector.dc * step;
      if (!inside(targetRow, targetCol)) break;
      const target = board[targetRow][targetCol];
      const jumping = Boolean(vector.jump || mirrorJump);
      if (!canLandOn(piece, target, jumping)) break;
      if (!jumping && step > 1 && board[row + vector.dr * (step - 1)][col + vector.dc * (step - 1)]) break;
      result.push({
        row: targetRow,
        col: targetCol,
        status: target ? 'CAPTURE' : vector.special || mirrorJump ? 'SPECIAL' : 'MOVE',
        note: vector.special || mirrorJump ? '特殊移動' : undefined,
      });
      if (target || jumping || !vector.slide) break;
    }
  });
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
  return candidateMoves(board, selection.row, selection.col, undefined, undefined, false, lastOpponentMove);
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
): ShogiTarget[] => {
  return getShogiMovementTargets(board, hands, selection, side, history);
};

const applyMove = (
  board: ShogiBoard,
  hands: ShogiHands,
  move: ShogiMove,
): { board: ShogiBoard; hands: ShogiHands; captured: ShogiPiece | null; capturedKing: boolean } => {
  const nextBoard = cloneBoard(board);
  const nextHands = cloneHands(hands);
  let captured: ShogiPiece | null = null;
  let capturedKing = false;
  if (move.from) {
    let moving = nextBoard[move.from[0]][move.from[1]];
    if (!moving) return { board: nextBoard, hands: nextHands, captured: null, capturedKing: false };
    const path = move.path?.length ? move.path : [move.to];
    let current = move.from;
    path.forEach(([targetRow, targetCol], index) => {
      const landed = nextBoard[targetRow][targetCol];
      if (landed) {
        captured = landed;
        if (landed.kind === 'K') capturedKing = true;
        if (landed.kind !== 'K') {
          nextHands[move.side][landed.kind] = (nextHands[move.side][landed.kind] || 0) + 1;
        }
      }
      nextBoard[current[0]][current[1]] = null;
      nextBoard[targetRow][targetCol] = index === path.length - 1 ? promotedOnArrival(moving!, targetRow) : moving;
      current = [targetRow, targetCol];
    });
  } else {
    nextBoard[move.to[0]][move.to[1]] = makeShogiPiece(move.kind, move.side);
    nextHands[move.side][move.kind] = Math.max(0, (nextHands[move.side][move.kind] || 0) - 1);
  }
  if (!move.from && captured && captured.kind !== 'K') {
    nextHands[move.side][captured.kind] = (nextHands[move.side][captured.kind] || 0) + 1;
  }
  return { board: nextBoard, hands: nextHands, captured, capturedKing };
};

const allMovesForSide = (board: ShogiBoard, hands: ShogiHands, side: ShogiSide, history: ShogiMove[] = []): ShogiMove[] => {
  const moves: ShogiMove[] = [];
  for (let row = 0; row < SIZE; row += 1) for (let col = 0; col < SIZE; col += 1) {
    const piece = board[row][col];
    if (!piece || piece.side !== side) continue;
    getShogiMovementTargets(board, hands, { row, col }, side, history).forEach(target => moves.push({
      from: [row, col],
      to: [target.row, target.col],
      kind: piece.kind,
      side,
      capture: board[target.row][target.col]?.kind || null,
      special: target.status === 'SPECIAL',
      path: target.path,
    }));
  }
  Object.keys(hands[side]).forEach(kindValue => {
    const kind = kindValue as ShogiPieceKind;
    getShogiMovementTargets(board, hands, { hand: kind }, side, history).forEach(target => moves.push({
      from: null,
      to: [target.row, target.col],
      kind,
      side,
      capture: null,
    }));
  });
  return moves;
};

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
  stage <= 50 ? 1 : stage <= 60 ? 2 : stage <= 70 ? 3 : stage <= 80 ? 4 : stage <= 90 ? 5 : stage <= 99 ? 6 : 8;

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
): { board: ShogiBoard; hands: ShogiHands; uniqueKinds: ShogiPieceKind[] } => {
  const board = emptyBoard();
  const hands = emptyHands();
  const uniqueKinds: ShogiPieceKind[] = [];
  const baseKinds: ShogiPieceKind[] = ['R', 'B', 'G', 'S', 'N', 'L', 'P'];
  if (mode === 'ADVANCE') {
    if (stage <= 50) uniqueKinds.push(ADVANCED_PIECES[stage - 1].kind);
    const unlocked = ADVANCED_PIECES.slice(0, Math.max(1, Math.min(50, stage)));
    while (uniqueKinds.length < stageUniqueCount(stage)) {
      const pick = unlocked[Math.floor(random() * unlocked.length)].kind;
      if (!uniqueKinds.includes(pick)) uniqueKinds.push(pick);
    }
  }
  const standardPieceSlots = mode === 'ADVANCE' ? Math.max(1, 9 - uniqueKinds.length) : 5;
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
): { board: ShogiBoard; hands: ShogiHands; uniqueKinds: ShogiPieceKind[] } => {
  // A fully random placement could put a rook/lance/bishop in line with a
  // king before the first turn. That made otherwise movable pieces appear to
  // have no destinations because every move left the king in check.
  let position = buildShogiPosition(mode, stage, seededRandom(seed));
  for (let attempt = 1; attempt < 64 && !isSafeInitialPosition(position.board); attempt += 1) {
    position = buildShogiPosition(mode, stage, seededRandom(seed + attempt * 7919));
  }
  return position;
};

export const createShogiGame = (mode: ShogiMode, stage = 1, seed = Date.now(), playMode: ShogiPlayMode = 'CPU'): ShogiGameState => {
  const position = createShogiPosition(mode, stage, seed);
  return {
    mode,
    playMode,
    stage,
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
  };
};

const chooseCpuMove = (state: ShogiGameState): ShogiMove | null => {
  const moves = allMovesForSide(state.board, state.hands, 'C', state.history);
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
  const nextTargets = getShogiMovementTargets(state.board, state.hands, selection, state.side, state.history);
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
  const currentTargets = getShogiMovementTargets(state.board, state.hands, state.selected, movingSide, state.history);
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
  };
  const applied = applyMove(state.board, state.hands, move);
  const interim: ShogiGameState = { ...state, board: applied.board, hands: applied.hands, selected: null, legalTargets: [], lastMove: move, history: [...state.history, move], turn: state.turn + 1, signature: boardSignature(applied.board) };
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
    const nextMoves = allMovesForSide(interim.board, interim.hands, nextSide, interim.history);
    if (!nextMoves.length) return { ...interim, side: nextSide, result: 'DRAW', message: '動かせる駒がありません。引き分けです。' };
    return {
      ...interim,
      side: nextSide,
      message: nextSide === 'P' ? '先手の手番です。' : '後手の手番です。端末を相手へ渡してください。',
    };
  }
  const cpuMoves = allMovesForSide(interim.board, interim.hands, 'C', interim.history);
  if (cpuMoves.length === 0) return { ...interim, result: 'DRAW', message: 'CPUに動かせる駒がありません。引き分けです。' };
  const cpuMove = chooseCpuMove(interim);
  if (!cpuMove) return { ...interim, result: 'DRAW', message: 'CPUに動かせる駒がありません。引き分けです。' };
  const cpuApplied = applyMove(interim.board, interim.hands, cpuMove);
  const afterCpu: ShogiGameState = {
    ...interim,
    board: cpuApplied.board,
    hands: cpuApplied.hands,
    side: 'P',
    lastMove: cpuMove,
    history: [...interim.history, cpuMove],
    message: 'CPUが指しました。あなたの手番です。',
    signature: boardSignature(cpuApplied.board),
  };
  if (cpuApplied.capturedKing) {
    return {
      ...afterCpu,
      result: 'LOSE',
      message: '王を取られました。敗北。',
    };
  }
  const playerMoves = allMovesForSide(afterCpu.board, afterCpu.hands, 'P', afterCpu.history);
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
