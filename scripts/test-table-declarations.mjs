import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';

const vite = await createServer({
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
});
const load = (path) => vite.ssrLoadModule('/src/' + path);
try {
  const { createClubGame, applyAction, legalActions, viewFor } =
    await load('mini-games/card-club/engine.ts');
  const { createTable, applyTableAction, legalMoves, tableViewFor } =
    await load('mini-games/traditional-games/engine.ts');
  const { declarationsSince, spokenNumber, spokenRank } =
    await load('mini-games/shared/tableDeclarations.ts');
  const { CARD_CLUB_VOICE_HEROES, cardClubVoice } = await load('data/cardClubVoices.ts');
  const { CARD_CLUB_HEROES } = await load('mini-games/card-club/session.ts');

  const players = CARD_CLUB_HEROES.slice(0, 4).map((hero, i) => ({
    id: String(i), name: 'Seat ' + i, hero: hero.id, cpu: i === 1,
  }));
  const check = (state, prior, expected) => {
    assert.deepEqual(
      declarationsSince(state, prior).map(({ seat, lines }) => [seat, ...lines]),
      expected,
      state.game,
    );
  };

  const yaniv = createClubGame('yaniv', players.slice(0, 3), 123);
  yaniv.turn = 0;
  yaniv.players.forEach((player, i) => { player.hand = [[0], [13], [10]][i]; });
  assert(!applyAction(yaniv, 2, { type: 'knock' }));
  check(yaniv, -1, []);
  assert(applyAction(yaniv, 0, { type: 'knock' }));
  check(viewFor(yaniv, 2), 0, [[0, 'yaniv'], [1, 'assaf']]);
  check(viewFor(yaniv, 2), 1, []);
  assert.equal(yaniv.phase, 'round');

  const peeper = createTable('peeper', players, 725);
  peeper.turn = 0;
  peeper.hands = [[0, 34], [1, 2, 35], [3, 36], [60]];
  assert(applyTableAction(peeper, 0, { type: 'tiles', tiles: [0] }));
  assert(!applyTableAction(peeper, 3, { type: 'mine' }));
  assert(applyTableAction(peeper, 1, { type: 'mine' }));
  assert(applyTableAction(peeper, 2, { type: 'return' }));
  check(tableViewFor(peeper, 3), 0, [[1, 'mine'], [2, 'return']]);
  assert.equal(peeper.pile.kind, 'return');

  const doubt = createClubGame('doubt', players.slice(0, 3), 218);
  const claimant = doubt.turn;
  const fake = doubt.players[claimant].hand.find((card) => card % 13 !== 0);
  assert(applyAction(doubt, claimant, { type: 'play', cards: [fake] }));
  const challenger = doubt.turn;
  const publicDoubt = viewFor(doubt, challenger);
  assert(publicDoubt.table.every((card) => card === -1));
  check(publicDoubt, 0, [[claimant, 'ace', 'n1', 'cards']]);
  assert(applyAction(doubt, challenger, { type: 'challenge' }));
  check(viewFor(doubt, claimant), 1, [[challenger, 'doubt']]);

  const bull = createClubGame('pokerbull', players, 7890);
  const bullBidder = bull.turn;
  assert(applyAction(bull, bullBidder, { type: 'bid', value: 0 }));
  check(viewFor(bull, bull.turn), 0, [[bullBidder, 'single', 'n2']]);
  const bullChallenger = bull.turn;
  assert(applyAction(bull, bullChallenger, { type: 'challenge' }));
  check(viewFor(bull, bullBidder), 1, [[bullChallenger, 'bull']]);

  const spades = createClubGame('spades', players, 265);
  const bidder = spades.turn;
  assert(applyAction(spades, bidder, { type: 'bid', value: 0 }));
  check(viewFor(spades, spades.turn), 0, [[bidder, 'nil']]);

  const whist = createClubGame('minnesotawhist', players, 83);
  for (let i = 0; i < 4; i++) {
    const seat = whist.turn;
    assert(applyAction(whist, seat, legalActions(whist, seat)[0]));
    if (i < 3) check(viewFor(whist, whist.turn), -1, []);
  }
  assert.equal(declarationsSince(viewFor(whist, 3), 0).length, 1);

  const fortyTwo = createTable('forty-two', players, 42);
  const bidder42 = fortyTwo.turn;
  assert(applyTableAction(fortyTwo, bidder42, { type: 'bid', value: 36 }));
  check(tableViewFor(fortyTwo, fortyTwo.turn), 0, [[bidder42, 'n30', 'n6']]);
  for (let i = 0; i < 3; i++) assert(applyTableAction(fortyTwo, fortyTwo.turn, { type: 'pass' }));
  assert(applyTableAction(fortyTwo, fortyTwo.turn, { type: 'trump', value: 6 }));
  check(tableViewFor(fortyTwo, 0), 4, [[bidder42, 'n6']]);

  const bingo = createTable('bingo', players.slice(0, 2), 29);
  const claim = legalMoves(bingo, bingo.turn).find(({ type, value }) => type === 'option' && value === 2);
  assert(claim);
  const singer = bingo.turn;
  assert(applyTableAction(bingo, singer, claim));
  check(tableViewFor(bingo, 1 - singer), 0, [[singer, 'bingo']]);

  const goita = Array.from({ length: 190 }, (_, seed) => createTable('goita', players, seed + 1000))
    .find(({ event }) => event?.key === 'five-shi');
  assert(goita);
  assert.equal(declarationsSince(tableViewFor(goita, 0), -1)[0].lines[0], 'five-shi');

  assert.deepEqual(spokenNumber(99), ['n90', 'n9']);
  assert.deepEqual(spokenNumber(11), ['n10', 'n1']);
  assert.deepEqual(spokenNumber(294), ['n2', 'n100', 'n90', 'n4']);
  assert.deepEqual(spokenRank(11), ['jack']);
  assert.deepEqual(spokenNumber(-1), []);
  assert.deepEqual([...CARD_CLUB_VOICE_HEROES].sort(), CARD_CLUB_HEROES.map(({ id }) => id).sort());
  assert.equal(cardClubVoice('../unsafe', 'yaniv'), null);
  console.log('PASS authoritative announcements, correct speakers, private votes, public claims and revisions');

  if (!process.argv.includes('--rules-only')) {
    const lines = JSON.parse(await readFile('src/data/tableDeclarationLines.json', 'utf8'));
    const build = JSON.parse(await readFile('assets/traditional-games/declaration-voice-build.json', 'utf8'));
    assert.equal(build.runtime.model_device, 'cpu');
    assert.equal(build.runtime.codec_device, 'cpu');
    assert.equal(Object.keys(build.clips).length, CARD_CLUB_VOICE_HEROES.length * Object.keys(lines).length);
    const hashes = new Set();
    for (const hero of CARD_CLUB_VOICE_HEROES) {
      for (const line of Object.keys(lines)) {
        const clip = cardClubVoice(hero, line);
        assert(clip, hero + '/' + line);
        const file = await readFile('public/' + clip.path);
        assert(file.length > 1500 && file.subarray(0, 3).toString() === 'ID3', clip.path);
        const hash = createHash('sha256').update(file).digest('hex');
        assert(!hashes.has(hash), clip.path + ' repeats another recording');
        assert.equal(build.clips[hero + '/' + line].sha256, hash, clip.path);
        hashes.add(hash);
      }
    }
    console.log('PASS declaration recordings', hashes.size, 'across', CARD_CLUB_VOICE_HEROES.length, 'heroes');
  }
} finally {
  await vite.close();
}
