import assert from "node:assert/strict";
import { createServer } from "vite";
const server = await createServer({
  cacheDir: "node_modules/.vite-mini-practice",
  optimizeDeps: { noDiscovery: true, entries: [] },
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "error",
});
try {
  const H = await server.ssrLoadModule(
      "/src/mini-games/gakuro-craft/homeGames.ts",
    ),
    P = await server.ssrLoadModule(
      "/src/mini-games/gakuro-craft/partyGames.ts",
    ),
    B = await server.ssrLoadModule(
      "/src/mini-games/gakuro-craft/bowlingSwipe.ts",
    );
  function fixture(kind) {
    const home = { tile: 0, level: 3, furniture: [{ slot: 0, item: kind }] },
      w = {
        tiles: [{ homeOwner: "a" }],
        homeViews: { 0: home },
        players: {
          a: {
            id: "a",
            name: "A",
            indoors: true,
            homeTile: 0,
            progress: { home },
          },
        },
        games: {},
        time: 0,
        paused: false,
      };
    H.gameCommand(w, w.players.a, { type: "game_join", slot: 0 });
    const g = w.games["0:0"];
    return {
      w,
      g,
      send: (c) =>
        H.gameCommand(w, w.players.a, { key: g.key, round: g.round, ...c }),
    };
  }
  for (const kind of Object.keys(P.GAME_LABELS)) {
    const { w, g, send } = fixture(kind);
    if (kind === "rhythm") {
      assert.ok(g.rhythm);
      send({
        type: "game_rhythm_ready",
        song: g.rhythm.song,
        difficulty: g.rhythm.difficulty,
        length: g.rhythm.length,
        ready: true,
      });
      send({ type: "game_start" });
      assert.equal(
        g.phase,
        "playing",
        "rhythm solo starts once its song is ready",
      );
      continue;
    }
    send({ type: "game_start" });
    assert.equal(g.phase, "playing", kind + " supports one player");
    assert.equal(g.players.length, 1);
    assert.equal(g.names.length, 1);
  }
  for (const kind of ["reversi", "connectfour"]) {
    const { w, g, send } = fixture(kind);
    send({ type: "game_start" });
    assert.equal(g.party.solo, true);
    for (let i = 0; i < 100 && g.phase === "playing"; i++) {
      if (g.party.cpuTurn) {
        const original = JSON.stringify(g.party.board);
        send({ type: "game_board", cell: 0 });
        assert.equal(
          JSON.stringify(g.party.board),
          original,
          "human cannot play CPU turn",
        );
        w.time = g.party.cpuAt + 0.1;
        H.tickGames(w, 0);
      } else {
        const legal =
          kind === "reversi"
            ? P.legalReversi(g.party.board, 1)
            : [3, 2, 4, 1, 5, 0, 6].filter((c) => !g.party.board[c]);
        assert.ok(legal.length);
        send({ type: "game_board", cell: legal[0] });
      }
    }
    assert.equal(g.phase, "finished", kind + " solo reaches result");
    assert.ok(g.party.cpuScore >= 0);
  }
  const slow = B.bowlingSwipe(
      [
        { x: 0.5, y: 0.9 },
        { x: 0.5, y: 0.3 },
      ],
      1000,
    ),
    fast = B.bowlingSwipe(
      [
        { x: 0.5, y: 0.9 },
        { x: 0.5, y: 0.3 },
      ],
      100,
    );
  assert.ok(fast.power > slow.power);
  assert.equal(fast.spin, 0);
  assert.equal(
    B.bowlingSwipe(
      [
        { x: 0.5, y: 0.1 },
        { x: 0.5, y: 0.9 },
      ],
      100,
    ),
    undefined,
  );
  assert.equal(
    B.bowlingSwipe(
      [
        { x: 0.5, y: 0.9 },
        { x: 0.5, y: 0.3 },
      ],
      0,
    ),
    undefined,
  );
  assert.ok(
    B.bowlingSwipe(
      [
        { x: 0.5, y: 0.9 },
        { x: 0.7, y: 0.6 },
        { x: 0.5, y: 0.3 },
      ],
      500,
    ).spin > 0,
  );
  const shot = (sx, sy) => {
    const { w, g, send } = fixture("billiards");
    send({ type: "game_start" });
    send({ type: "game_shot", angle: 0, power: 0.8, spinX: sx, spinY: sy });
    for (let i = 0; i < 30; i++) {
      w.time += 0.025;
      H.tickGames(w, 0.025);
    }
    return g.pool.balls[0];
  };
  const straight = shot(0, 0),
    side = shot(0.8, 0),
    follow = shot(0, 0.8),
    draw = shot(0, -0.8);
  assert.ok(Math.abs(side.y - straight.y) > 0.001, "side spin curves path");
  assert.ok(
    follow.vx > draw.vx,
    "follow and draw alter cue velocity after contact",
  );
  const { g, send } = fixture("billiards");
  send({ type: "game_start" });
  send({ type: "game_shot", angle: 0, power: 0.8, spinX: NaN });
  assert.equal(g.pool.moving, false);
  send({ type: "game_shot", angle: 0, power: 0.8, spinX: 1, spinY: 1 });
  assert.equal(g.pool.moving, false);
  console.log(
    "Mini practice checks passed: all ten solo entries, CPU Reversi/Connect Four complete games, turn guard, bowling swipe speed/curve/cancel and billiards side/follow/draw spin.",
  );
} finally {
  await server.close();
}
