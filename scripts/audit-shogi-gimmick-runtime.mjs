import { createServer } from 'vite';

const strict = process.argv.includes('--strict');
const failures = [];
const REQUIRED_FAMILIES = [
  'EXPLOSION',
  'WARP',
  'LASER',
  'CLONE',
  'TIME',
  'GRAVITY',
  'PULL',
  'PUSH',
  'REFLECT',
  'TERRAIN',
  'CHAIN',
  'REVIVE',
  'FORECAST',
  'SWAP',
  'SILENCE',
  'PHASE',
  'ROTATE',
  'BLACK_HOLE',
  'TELEPORT',
  'FREEZE',
  'BARRIER',
  'TRANSFORM',
];

const server = await createServer({
  configFile: './vite.config.ts',
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
});

const emptyBoard = () => Array.from({ length: 5 }, () => Array(5).fill(null));
const inBounds = value => Number.isInteger(value) && value >= 0 && value < 5;
const countKings = (board, side) => board.flat().filter(piece => piece?.kind === 'K' && piece.side === side).length;

try {
  const piecesModule = await server.ssrLoadModule('/src/mini-games/shogi/shogiPieces.ts');
  const runtimeModule = await server.ssrLoadModule('/src/mini-games/shogi/shogiAdvanceRuntime.ts');
  const engineModule = await server.ssrLoadModule('/src/mini-games/shogi/shogiEngine.ts');

  const { ADVANCED_PIECES, makeShogiPiece } = piecesModule;
  const { deriveShogiGimmickProfile } = runtimeModule;
  const { createShogiGame, getShogiMovementTargets, playShogiMove } = engineModule;

  const auditedPieces = ADVANCED_PIECES
    .filter(piece => piece.stage >= 251 && piece.stage <= 500)
    .sort((left, right) => left.stage - right.stage);

  if (auditedPieces.length !== 250) {
    failures.push(`expected 250 Advance pieces for No.251-500, got ${auditedPieces.length}`);
  }

  const executionCoverage = new Map(REQUIRED_FAMILIES.map(family => [family, []]));
  const movementExceptions = [];
  const playExceptions = [];
  const noLegalMove = [];
  let executedMoves = 0;
  let emittedEvents = 0;

  for (const definition of auditedPieces) {
    const profile = deriveShogiGimmickProfile(
      definition.catalogNo || definition.stage,
      definition.family || definition.special || '',
      definition.description,
      definition.restriction,
    );

    // Start from a real game-state shape, then replace only the position with
    // a deterministic 5x5 runtime fixture.  It contains both kings, friendly
    // and enemy pieces, an enemy Advance piece for SILENCE, a held piece for
    // REVIVE, and enough empty squares for warp/clone/terrain effects.
    const state = createShogiGame('ADVANCE', definition.stage, 900000 + definition.stage, 'LOCAL', 500);
    const board = emptyBoard();
    board[2][2] = makeShogiPiece(definition.kind, 'P');
    board[4][4] = makeShogiPiece('K', 'P');
    board[0][4] = makeShogiPiece('K', 'C');
    board[3][1] = makeShogiPiece('G', 'P');
    board[1][1] = makeShogiPiece('P', 'C');
    board[1][2] = makeShogiPiece('ADV_DOUBLE_PAWN', 'C');
    board[2][3] = makeShogiPiece('P', 'C');
    board[3][3] = makeShogiPiece('ADV_SIDE_PAWN', 'C');

    const representativeState = {
      ...state,
      playMode: 'LOCAL',
      side: 'P',
      result: null,
      board,
      hands: { P: { P: 1 }, C: {} },
      selected: { row: 2, col: 2 },
      legalTargets: [],
      history: [],
      lastMove: null,
      terrain: [],
      gimmickEvent: null,
    };

    let targets;
    try {
      targets = getShogiMovementTargets(
        representativeState.board,
        representativeState.hands,
        representativeState.selected,
        'P',
        [],
        [],
      );
    } catch (error) {
      movementExceptions.push(
        `No.${definition.stage} ${definition.kind}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }

    const usableTargets = targets.filter(target => !(target.row === 0 && target.col === 4));
    const target = usableTargets.find(item => item.status === 'SPECIAL')
      || usableTargets.find(item => item.status === 'CAPTURE')
      || usableTargets.find(item => item.status === 'MOVE')
      || usableTargets[0];

    if (!target) {
      noLegalMove.push(`No.${definition.stage} ${definition.kind}`);
      continue;
    }

    for (const family of profile.families) {
      if (executionCoverage.has(family)) executionCoverage.get(family).push(definition.stage);
    }

    try {
      const result = playShogiMove(representativeState, [target.row, target.col]);
      executedMoves += 1;

      const playerKings = countKings(result.board, 'P');
      const cpuKings = countKings(result.board, 'C');
      if (playerKings !== 1 || cpuKings !== 1) {
        failures.push(
          `No.${definition.stage} ${definition.kind}: king count changed after runtime move (P=${playerKings}, C=${cpuKings})`,
        );
      }

      if (result.gimmickEvent) {
        emittedEvents += 1;
        const event = result.gimmickEvent;
        if (!profile.families.includes(event.family) || event.family === 'NONE') {
          failures.push(
            `No.${definition.stage} ${definition.kind}: event family ${event.family} not in profile [${profile.families.join(', ')}]`,
          );
        }
        if (event.tier !== profile.tier) {
          failures.push(
            `No.${definition.stage} ${definition.kind}: event tier ${event.tier} != profile tier ${profile.tier}`,
          );
        }
        if (!inBounds(event.row) || !inBounds(event.col)) {
          failures.push(
            `No.${definition.stage} ${definition.kind}: event coordinate out of bounds (${event.row}, ${event.col})`,
          );
        }
        if (!Number.isInteger(event.nonce) || event.nonce < 1) {
          failures.push(`No.${definition.stage} ${definition.kind}: invalid event nonce ${event.nonce}`);
        }
        if (typeof event.label !== 'string' || !event.label.trim()) {
          failures.push(`No.${definition.stage} ${definition.kind}: gimmick event has empty label`);
        }
      }
    } catch (error) {
      playExceptions.push(
        `No.${definition.stage} ${definition.kind}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (movementExceptions.length) {
    failures.push(`movement calculation exceptions (${movementExceptions.length}): ${movementExceptions.join(' | ')}`);
  }
  if (playExceptions.length) {
    failures.push(`playShogiMove exceptions (${playExceptions.length}): ${playExceptions.join(' | ')}`);
  }

  for (const family of REQUIRED_FAMILIES) {
    const coveredNos = executionCoverage.get(family);
    if (!coveredNos?.length) {
      failures.push(`gimmick family ${family} has no No.251-500 piece that reached playShogiMove`);
    }
  }

  if (failures.length) {
    console.error(failures.map(failure => `- ${failure}`).join('\n'));
    console.error(
      `Shogi gimmick runtime audit failed: ${failures.length} issue(s); `
      + `${executedMoves}/${auditedPieces.length} pieces executed, ${emittedEvents} gimmick event(s), `
      + `${noLegalMove.length} fixture no-move piece(s).`,
    );
    if (noLegalMove.length) console.error(`Fixture pieces without a usable move: ${noLegalMove.join(', ')}`);
    if (strict) process.exitCode = 1;
    else console.error('Re-run with --strict to make audit failures exit with code 1.');
  } else {
    console.log(
      `Shogi gimmick runtime audit passed: ${executedMoves}/${auditedPieces.length} pieces executed, `
      + `${emittedEvents} gimmick event(s), all ${REQUIRED_FAMILIES.length} gimmick families covered.`,
    );
    if (noLegalMove.length) {
      console.log(`Fixture pieces without a usable move (allowed by audit): ${noLegalMove.join(', ')}`);
    }
  }
} catch (error) {
  console.error(
    `Shogi gimmick runtime audit crashed: ${error instanceof Error ? error.stack || error.message : String(error)}`,
  );
  if (strict) process.exitCode = 1;
  else console.error('Re-run with --strict to make audit failures exit with code 1.');
} finally {
  await server.close();
}
