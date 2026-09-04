import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({
  configFile: './vite.config.ts',
  server: { middlewareMode: true },
  appType: 'custom',
});

try {
  const engine = await server.ssrLoadModule('/src/mini-games/shogi/shogiEngine.ts');
  const pieces = await server.ssrLoadModule('/src/mini-games/shogi/shogiPieces.ts');
  const { ADVANCED_PIECES, makeShogiPiece } = pieces;
  const { createShogiGame, createShogiPosition, getShogiMovementTargets } = engine;

  assert.equal(ADVANCED_PIECES.length, 50, 'Advance must expose all 50 unique pieces');

  const emptyBoard = () => Array.from({ length: 5 }, () => Array(5).fill(null));
  const boardWith = (kind, row = 2, col = 2, extra = []) => {
    const board = emptyBoard();
    board[row][col] = makeShogiPiece(kind, 'P');
    for (const [extraKind, extraRow, extraCol, side = 'C'] of extra) board[extraRow][extraCol] = makeShogiPiece(extraKind, side);
    return board;
  };
  const targets = (kind, board, history = []) => getShogiMovementTargets(board, { P: {}, C: {} }, { row: 2, col: 2 }, 'P', history);
  const has = (list, row, col, status) => list.some(target => target.row === row && target.col === col && (!status || target.status === status));

  const hook = targets('ADV_HOOK_SPEAR', boardWith('ADV_HOOK_SPEAR'));
  assert(has(hook, 2, 1) && has(hook, 2, 3) && has(hook, 0, 2), 'Hook spear should slide forward and move sideways');
  assert(!has(hook, 1, 1) && !has(hook, 1, 3), 'Hook spear must not move to forward diagonals');

  const key = targets('ADV_KEY', boardWith('ADV_KEY'));
  assert(has(key, 1, 2) && has(key, 1, 1) && has(key, 1, 3) && has(key, 2, 1) && has(key, 2, 3), 'Key must use front, front-diagonal and sideways movement');
  assert(!has(key, 3, 2), 'Key must not move backward');

  const lion = targets('ADV_LION', boardWith('ADV_LION'));
  assert.equal(lion.length, 24, 'Lion should reach every square within two king steps from the centre');
  assert(lion.find(target => target.row === 0 && target.col === 0)?.path?.length === 2, 'Lion two-step destinations need a two-square path');
  const lionTwoCaptures = targets('ADV_LION', boardWith('ADV_LION', 2, 2, [['P', 1, 2, 'C'], ['P', 0, 2, 'C'], ['P', 1, 1, 'P'], ['P', 1, 3, 'P']]));
  assert(!has(lionTwoCaptures, 0, 2), 'Lion must not capture two pieces in one turn');

  const wolf = targets('ADV_WOLF', boardWith('ADV_WOLF', 2, 2, [['P', 1, 2, 'C']]));
  assert(wolf.find(target => target.row === 0 && target.col === 2)?.path?.length === 2, 'Wolf may move once more after a capture');

  const chronos = targets('ADV_CHRONOS', boardWith('ADV_CHRONOS'));
  assert(chronos.some(target => target.status === 'SPECIAL' && target.path?.length === 2), 'Chronos should expose its one-time extra move');

  const localPosition = createShogiPosition('ADVANCE', 100, 20260904, 'LOCAL', 3);
  assert.equal(localPosition.uniqueKinds.length, 3, 'Local Advance should include three unlocked unique pieces when only three are unlocked');
  assert(localPosition.uniqueKinds.every(kind => ADVANCED_PIECES.slice(0, 3).some(piece => piece.kind === kind)), 'Local Advance must draw only from unlocked pieces');
  for (const side of ['P', 'C']) {
    const pieces = localPosition.board.flat().filter(piece => piece?.side === side);
    assert.equal(pieces.filter(piece => piece && !piece.kind.startsWith('ADV_') && piece.kind !== 'K').length, 5, 'Local Advance keeps five standard piece slots');
    assert.equal(pieces.filter(piece => piece?.kind.startsWith('ADV_')).length, 3, 'Local Advance adds the selected unique pieces');
  }
  const localGame = createShogiGame('ADVANCE', 100, 20260904, 'LOCAL', 3);
  assert.deepEqual(localGame.activeAdvancedKinds, localPosition.uniqueKinds, 'Game state should expose the actually selected local unique pieces');

  const butterfly = targets('ADV_BUTTERFLY', boardWith('ADV_BUTTERFLY', 2, 2, [['P', 1, 1, 'P']]));
  assert(has(butterfly, 0, 0, 'SPECIAL'), 'Butterfly may jump the middle piece when not capturing');

  const bridge = targets('ADV_BRIDGE', boardWith('ADV_BRIDGE', 2, 2, [['P', 2, 3, 'P']]));
  assert(has(bridge, 2, 4, 'SPECIAL'), 'Bridge may jump one piece horizontally');

  const ninja = targets('ADV_NINJA', boardWith('ADV_NINJA', 2, 2, [['P', 1, 1, 'P']]));
  assert(has(ninja, 0, 0, 'SPECIAL'), 'Ninja may jump one middle piece diagonally');

  const drill = targets('ADV_DRILL', boardWith('ADV_DRILL', 2, 2, [['P', 1, 2, 'C']]));
  assert(has(drill, 0, 2, 'SPECIAL'), 'Drill jumps one enemy to the empty square behind it');

  const cannon = targets('ADV_CANNON', boardWith('ADV_CANNON', 2, 2, [['P', 1, 2, 'P'], ['P', 0, 2, 'C']]));
  assert(has(cannon, 0, 2, 'CAPTURE'), 'Cannon captures only after jumping one piece');
  const cannonWithoutScreen = targets('ADV_CANNON', boardWith('ADV_CANNON', 2, 2, [['P', 0, 2, 'C']]));
  assert(!has(cannonWithoutScreen, 0, 2, 'CAPTURE'), 'Cannon may not capture without a screen piece');

  const shadow = targets('ADV_SHADOW', boardWith('ADV_SHADOW', 2, 2, [['P', 3, 2, 'C']]));
  assert(!has(shadow, 3, 2), 'Shadow only moves to empty sideways/backward squares');

  const wall = targets('ADV_WALL', boardWith('ADV_WALL', 2, 2, [['P', 1, 2, 'C']]));
  assert(!has(wall, 1, 2), 'Wall cannot capture');

  const switcher = targets('ADV_SWITCH', boardWith('ADV_SWITCH', 2, 2, [['P', 1, 2, 'P']]));
  assert(has(switcher, 1, 2, 'SPECIAL'), 'Switch may exchange places with an adjacent friendly piece');

  const portal = targets('ADV_PORTAL', boardWith('ADV_PORTAL', 2, 2, [['ADV_PORTAL', 0, 0, 'P']]));
  assert(has(portal, 0, 1, 'SPECIAL'), 'Portal may move beside the other friendly portal');

  const mirror = targets('ADV_MIRROR', boardWith('ADV_MIRROR'), [{ from: [4, 0], to: [2, 0], side: 'C', kind: 'P', capture: null }]);
  assert(has(mirror, 0, 2, 'SPECIAL'), 'Mirror copies the previous opponent move shape');

  const chameleon = targets('ADV_CHAMELEON', boardWith('ADV_CHAMELEON', 2, 2, [['R', 2, 1, 'P']]));
  assert(has(chameleon, 2, 4) && has(chameleon, 0, 2), 'Chameleon uses the adjacent friendly standard piece shape');

  const phoenix = targets('ADV_PHOENIX', boardWith('ADV_PHOENIX'));
  assert(has(phoenix, 1, 2) && has(phoenix, 0, 2) && has(phoenix, 1, 1) && has(phoenix, 1, 3), 'Phoenix uses forward slide and forward diagonals');
  assert(!has(phoenix, 3, 1) && !has(phoenix, 3, 3), 'Phoenix must not move to backward diagonals');

  console.log('Shogi movement audit passed.');
} finally {
  await server.close();
}
