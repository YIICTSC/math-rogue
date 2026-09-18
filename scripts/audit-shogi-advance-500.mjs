import { createServer } from 'vite';

const strict = process.argv.includes('--strict');
const failures = [];
const EXPECTED_ADVANCE_COUNT = 500;
const EXPECTED_CATALOG_COUNT = 450;
const AUDIT_STAGES = [1, 50, 51, 100, 250, 251, 400, 451, 500];
const AUDIT_SEEDS = [1, 50051, 20260918];

const server = await createServer({
  configFile: './vite.config.ts',
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
});

const emptyBoard = () => Array.from({ length: 5 }, () => Array(5).fill(null));
const emptyHands = () => ({ P: {}, C: {} });

try {
  const piecesModule = await server.ssrLoadModule('/src/mini-games/shogi/shogiPieces.ts');
  const catalogModule = await server.ssrLoadModule('/src/mini-games/shogi/shogiAdvanceCatalog.ts');
  const runtimeModule = await server.ssrLoadModule('/src/mini-games/shogi/shogiAdvanceRuntime.ts');
  const engineModule = await server.ssrLoadModule('/src/mini-games/shogi/shogiEngine.ts');

  const { ADVANCED_PIECES, makeShogiPiece } = piecesModule;
  const { SHOGI_ADVANCE_CATALOG } = catalogModule;
  const { deriveShogiGimmickProfile } = runtimeModule;
  const { createShogiGame, getShogiMovementTargets } = engineModule;

  if (ADVANCED_PIECES.length !== EXPECTED_ADVANCE_COUNT) {
    failures.push(`Advance piece count: expected ${EXPECTED_ADVANCE_COUNT}, got ${ADVANCED_PIECES.length}`);
  }

  const stageOwners = new Map();
  for (const piece of ADVANCED_PIECES) {
    if (stageOwners.has(piece.stage)) {
      failures.push(`duplicate Advance stage ${piece.stage}: ${stageOwners.get(piece.stage)} / ${piece.kind}`);
    } else {
      stageOwners.set(piece.stage, piece.kind);
    }
  }
  const missingStages = Array.from({ length: EXPECTED_ADVANCE_COUNT }, (_, index) => index + 1)
    .filter(stage => !stageOwners.has(stage));
  if (missingStages.length) failures.push(`missing Advance stage(s): ${missingStages.join(', ')}`);
  const outOfRangeStages = [...stageOwners.keys()].filter(stage => stage < 1 || stage > EXPECTED_ADVANCE_COUNT);
  if (outOfRangeStages.length) failures.push(`out-of-range Advance stage(s): ${outOfRangeStages.join(', ')}`);

  const advanceIds = ADVANCED_PIECES.map(piece => piece.kind);
  if (new Set(advanceIds).size !== advanceIds.length) {
    const seen = new Set();
    const duplicates = new Set();
    for (const id of advanceIds) {
      if (seen.has(id)) duplicates.add(id);
      seen.add(id);
    }
    failures.push(`duplicate Advance ID(s): ${[...duplicates].join(', ')}`);
  }

  if (SHOGI_ADVANCE_CATALOG.length !== EXPECTED_CATALOG_COUNT) {
    failures.push(`Advance catalog count: expected ${EXPECTED_CATALOG_COUNT}, got ${SHOGI_ADVANCE_CATALOG.length}`);
  }
  const catalogNos = SHOGI_ADVANCE_CATALOG.map(entry => entry.no);
  const expectedCatalogNos = Array.from({ length: EXPECTED_CATALOG_COUNT }, (_, index) => index + 51);
  const catalogNoSet = new Set(catalogNos);
  const missingCatalogNos = expectedCatalogNos.filter(no => !catalogNoSet.has(no));
  const unexpectedCatalogNos = catalogNos.filter(no => no < 51 || no > 500);
  if (missingCatalogNos.length) failures.push(`catalog missing No: ${missingCatalogNos.join(', ')}`);
  if (unexpectedCatalogNos.length) failures.push(`catalog has out-of-range No: ${unexpectedCatalogNos.join(', ')}`);
  if (catalogNoSet.size !== catalogNos.length) failures.push('catalog contains duplicate No values');

  const catalogIds = SHOGI_ADVANCE_CATALOG.map(entry => entry.kind);
  if (new Set(catalogIds).size !== catalogIds.length) failures.push('catalog contains duplicate IDs');

  const noneOnly = [];
  for (const entry of SHOGI_ADVANCE_CATALOG) {
    if (entry.no < 251 || entry.no > 500) continue;
    try {
      const profile = deriveShogiGimmickProfile(
        entry.no,
        entry.family,
        entry.description,
        entry.restriction,
      );
      if (profile.families.length === 1 && profile.families[0] === 'NONE') noneOnly.push(entry.no);
    } catch (error) {
      failures.push(`No.${entry.no} gimmick profile threw: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (noneOnly.length) failures.push(`No.251-500 with gimmick family NONE only: ${noneOnly.join(', ')}`);

  let movementChecks = 0;
  const movementExceptions = [];
  for (const piece of ADVANCED_PIECES) {
    for (const [label, row, col] of [['center', 2, 2], ['edge', 4, 0]]) {
      try {
        const board = emptyBoard();
        board[row][col] = makeShogiPiece(piece.kind, 'P');
        const targets = getShogiMovementTargets(board, emptyHands(), { row, col }, 'P', [], []);
        if (!Array.isArray(targets)) {
          movementExceptions.push(`${piece.kind} ${label}: result is not an array`);
        }
        movementChecks += 1;
      } catch (error) {
        movementExceptions.push(`${piece.kind} ${label}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  if (movementExceptions.length) {
    failures.push(`movement calculation failures (${movementExceptions.length}/${EXPECTED_ADVANCE_COUNT * 2}): ${movementExceptions.join(' | ')}`);
  }

  let gameChecks = 0;
  for (const stage of AUDIT_STAGES) {
    const featured = ADVANCED_PIECES.find(piece => piece.stage === stage);
    if (!featured) {
      failures.push(`Stage ${stage}: featured Advance piece is missing`);
      continue;
    }
    for (const seed of AUDIT_SEEDS) {
      try {
        const game = createShogiGame('ADVANCE', stage, seed, 'CPU', stage);
        gameChecks += 1;
        if (!game.activeAdvancedKinds.includes(featured.kind)) {
          failures.push(`Stage ${stage} seed ${seed}: activeAdvancedKinds missing featured piece ${featured.kind}`);
        }
        if (stage === 500) {
          if (game.activeAdvancedKinds.length !== 8) {
            failures.push(`Stage 500 seed ${seed}: expected 8 active Advance kinds, got ${game.activeAdvancedKinds.length}`);
          }
          if (new Set(game.activeAdvancedKinds).size !== 8) {
            failures.push(`Stage 500 seed ${seed}: active Advance kinds are not 8 unique entries`);
          }
        }
      } catch (error) {
        failures.push(`Stage ${stage} seed ${seed} generation threw: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  if (failures.length) {
    console.error(failures.map(failure => `- ${failure}`).join('\n'));
    console.error(`Shogi Advance 500 audit failed: ${failures.length} issue(s).`);
    if (strict) process.exitCode = 1;
    else console.error('Re-run with --strict to make audit failures exit with code 1.');
  } else {
    console.log(
      `Shogi Advance 500 audit passed: ${ADVANCED_PIECES.length} pieces, `
      + `${SHOGI_ADVANCE_CATALOG.length} catalog entries, `
      + `${movementChecks} movement checks, ${gameChecks} stage/seed generations.`,
    );
  }
} catch (error) {
  console.error(`Shogi Advance 500 audit crashed: ${error instanceof Error ? error.stack || error.message : String(error)}`);
  if (strict) process.exitCode = 1;
  else console.error('Re-run with --strict to make audit failures exit with code 1.');
} finally {
  await server.close();
}
