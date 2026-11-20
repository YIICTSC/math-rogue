import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});
try {
  const base = '/src/mini-games/traditional-games/';
  const [engine, model, domino, peeper, crokinole, session, voices] = await Promise.all(
    ['engine', 'model', 'domino', 'peeper', 'crokinole', 'session']
      .map((name) => vite.ssrLoadModule(base + name + '.ts'))
      .concat(vite.ssrLoadModule('/src/data/cardClubVoices.ts')),
  );
  const { createTable, legalMoves, tableViewFor, applyTableAction, playTableCpu, nextTableRound } =
    engine;
  const profiles = (n, cpu = false) =>
    Array.from({ length: n }, (_, i) => ({
      id: 'p' + i,
      name: 'Player ' + i,
      hero: voices.CARD_CLUB_VOICE_HEROES[i],
      cpu,
    }));
  const modes = [...model.DOMINO_GAMES, 'peeper', 'goita', 'crokinole'];
  let finished = 0;
  for (const game of modes) {
    for (const n of model.seatsFor(game)) {
      const s = createTable(game, profiles(n, true), 1987 + n);
      for (let i = 0; i < 10000 && s.phase !== 'result'; i++) {
        for (const [index, hand] of s.hands.entries()) {
          const v = tableViewFor(s, index);
          assert.deepEqual(
            v.hand,
            [...hand].sort((a, b) => a - b),
          );
          assert.equal(v.counts.length, n);
          for (const key of ['rng', 'hands', 'opening'])
            assert(!Object.hasOwn(v, key), `${game}: ${key}`);
          if (s.kind === 'domino') assert.equal(v.stock, s.stock.length);
        }
        const revision = s.revision;
        const ok = s.phase === 'round' ? nextTableRound(s) : playTableCpu(s);
        assert(ok, `${game}/${n}/${s.round} stuck at seat ${s.turn}`);
        assert.equal(s.revision, revision + 1);
      }
      assert.equal(s.phase, 'result', `${game}/${n} should finish`);
      assert(s.winners.length);
      finished++;
    }
  }

  const p = createTable('peeper', profiles(4), 1);
  p.turn = 0;
  p.hands = [
    [24, 2],
    [25, 26, 3],
    [27, 4],
    [28, 5],
  ];
  assert(applyTableAction(p, 0, { type: 'tiles', tiles: [24] }));
  assert(!applyTableAction(p, 3, { type: 'mine' }));
  assert(applyTableAction(p, 1, { type: 'mine' }));
  assert(!applyTableAction(p, 2, { type: 'tiles', tiles: [27] }));
  assert(applyTableAction(p, 2, { type: 'return' }));
  assert.equal(p.pile.kind, 'return');
  assert.equal(peeper.peeperSelection([0, 4, 60], null).kind, 'run');
  assert.equal(peeper.peeperSelection([0, 1, 2, 3], null).kind, 'bomb-two');
  assert.equal(peeper.peeperSelection([0, 1, 60], null), null);
  assert.equal(peeper.peeperSelection([11, 11], null), null);

  const g = createTable('goita', profiles(4), 1);
  Object.assign(g, { turn: 0, phase: 'play', five: [], votes: [], attack: null });
  g.hands[0] = [22, 23];
  assert(applyTableAction(g, 0, { type: 'goita', cover: 22, attack: 23 }));
  assert.deepEqual(g.scores, [60, 0, 60, 0]);
  assert.equal(tableViewFor(g, 1).rows[0].at(-1).cover, null, 'Hidden cover stays private');
  const c = createTable('crokinole', profiles(2), 9);
  c.turn = 0;
  const shot = { type: 'shot', angle: 0, aim: 0, power: 0.56 };
  assert(!applyTableAction(c, 1, shot));
  assert(!applyTableAction(c, 0, { ...shot, power: NaN }));
  const opening = crokinole.resolveShot([], 0, 2, shot, 1);
  assert.deepEqual(opening.sunk, [0], 'The tutorial shot can sink the center');
  const foul = crokinole.resolveShot([{ id: 0, seat: 1, x: 0.62, y: 0 }], 0, 2, shot, 1);
  assert.equal(foul.valid, false, 'Missing the opposing disc invalidates the shot');
  assert.deepEqual(foul.sunk, []);
  assert(applyTableAction(c, 0, shot));

  const x = createTable('chicken', profiles(2), 1);
  x.turn = 0;
  x.hands[0] = [domino.dominoTile(1, 4)];
  const outer = { tiles: [], pip: 1, public: true, anchor: -1, parent: -1 };
  x.hub = domino.dominoTile(2, 2);
  x.lines = [outer, { ...outer, pip: 4 }];
  x.forced = [1];
  assert.deepEqual(legalMoves(x, 0), [{ type: 'place', tile: domino.dominoTile(1, 4), end: 1 }]);

  const packets = new Map();
  const host = new session.TraditionalSession('p0', '827451', (id, packet) => {
    packets.set(id, JSON.parse(JSON.stringify(packet)));
  });
  profiles(2).forEach((p) => assert(host.join(p)));
  assert(host.configure('peeper', 2));
  assert(host.start(32));
  const { turn, revision } = host.state;
  const other = 1 - turn;
  const action = legalMoves(host.state, turn).find((a) => a.type === 'tiles');
  assert(action);
  assert(!host.command('p' + other, action, revision), 'Peer identity determines the seat');
  assert(!host.command('p' + turn, action, revision - 1), 'Stale revisions are ignored');
  assert(host.command('p' + turn, action, revision));
  for (const packet of packets.values()) {
    assert.equal(packet.view.revision, revision + 1);
    assert(!Object.hasOwn(packet.view, 'hands'));
    assert(!Object.hasOwn(packet.view, 'stockOrder'));
  }
  host.leave('p1');
  assert(host.state.players[1].cpu);
  host.rematch();
  assert.equal(packets.get('p0').members.length, 1);

  const voiceBuild = JSON.parse(await readFile('assets/traditional-games/voice-build.json', 'utf8'));
  assert.equal(voiceBuild.model_device, 'cpu');
  assert.equal(voiceBuild.codec_device, 'cpu');
  assert.equal(Object.keys(voiceBuild.clips).length, 156);
  const voiceHashes = new Set();
  for (const hero of voices.CARD_CLUB_VOICE_HEROES) {
    for (const cue of ['turn', 'table-start', 'domino', 'bomb', 'five-shi', 'twenty']) {
      const clip = voices.cardClubVoice(hero, cue);
      const audio = await readFile('public/' + clip.path);
      const meta = voiceBuild.clips[hero + '/' + cue];
      const hash = createHash('sha256').update(audio).digest('hex');
      assert.equal(hash, meta.sha256);
      assert(voiceBuild.models[meta.model]);
      assert(meta.recognized_text.length > 0);
      assert(clip.maxDurationMs > meta.duration_seconds * 1000);
      assert(!voiceHashes.has(hash), 'Each hero has a separate recording');
      voiceHashes.add(hash);
    }
  }
  console.log(
    `PASS ${finished} full matches, ${modes.length} rulesets, public snapshots, rule exceptions and 156 voice assets.`,
  );
} finally {
  await vite.close();
}
