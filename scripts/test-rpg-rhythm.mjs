import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";
const vite = await createServer({
  cacheDir: "node_modules/.vite-rhythm-unit",
  optimizeDeps: { noDiscovery: true, entries: [] },
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});
try {
  const { RHYTHM_SONGS } = await vite.ssrLoadModule(
    "/src/rpg/rhythm/catalog.generated.ts",
  );
  const { rhythmChart, chartUnits, rhythmGrade, rhythmRank } =
    await vite.ssrLoadModule("/src/rpg/rhythm/chart.ts");
  const { gameCommand, tickGames } = await vite.ssrLoadModule(
    "/src/mini-games/gakuro-craft/homeGames.ts",
  );
  async function files(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return (
      await Promise.all(
        entries.map((e) =>
          e.isDirectory()
            ? files(path.join(dir, e.name))
            : e.name.endsWith(".mp3")
              ? [path.join(dir, e.name).replace(/^public\//, "")]
              : [],
        ),
      )
    ).flat();
  }
  const all = [
    ...(await files("public/bgm")),
    ...(await files("public/bgm-new")),
  ];
  assert.equal(RHYTHM_SONGS.length, 143);
  assert.deepEqual(RHYTHM_SONGS.map((s) => s.path).sort(), all.sort());
  assert.equal(new Set(RHYTHM_SONGS.map((s) => s.id)).size, 143);
  let chartCount = 0;
  for (const song of RHYTHM_SONGS)
    for (const difficulty of ["easy", "normal", "expert"])
      for (const length of ["full", "short"]) {
        const notes = rhythmChart(song, difficulty, length),
          end =
            length === "short" ? Math.min(90, song.duration) : song.duration,
          occupied = [0, 0, 0, 0];
        assert.ok(notes.length > 0, song.id + " has no notes");
        assert.equal(
          JSON.stringify(notes),
          JSON.stringify(rhythmChart(song, difficulty, length)),
          "Charts must be deterministic",
        );
        for (const n of notes) {
          assert.ok(n.lane >= 0 && n.lane < 4 && n.time >= 0.5 && n.time < end);
          assert.ok(
            n.time > occupied[n.lane] + 0.139,
            "Same-lane tap/hold overlap",
          );
          if (n.end !== undefined) assert.ok(n.end > n.time && n.end < end);
          occupied[n.lane] = n.end ?? n.time;
        }
        chartCount++;
      }
  assert.equal(rhythmGrade(0.045), 1);
  assert.equal(rhythmGrade(-0.095), 2);
  assert.equal(rhythmGrade(0.17), 3);
  assert.equal(rhythmGrade(0.171), 4);
  assert.equal(rhythmRank(1000000), "SSS");
  const home = { tile: 9, level: 1, furniture: [{ slot: 2, item: "rhythm" }] },
    w = {
      tiles: [],
      homeViews: { 9: home },
      players: {},
      games: {},
      time: 10,
      paused: false,
    };
  w.tiles[9] = { homeOwner: "p0" };
  for (let i = 0; i < 4; i++) {
    const id = "p" + i;
    w.players[id] = {
      id,
      name: id,
      indoors: true,
      homeTile: 9,
      progress: { home },
    };
    gameCommand(w, w.players[id], { type: "game_join", slot: 2 });
  }
  const g = w.games["9:2"],
    command = (seat, data) =>
      gameCommand(w, w.players["p" + seat], { key: g.key, ...data });
  command(0, { type: "game_start" });
  assert.equal(g.phase, "lobby", "No start before everyone is ready");
  const song = RHYTHM_SONGS.find(
    (s) => s.path === "bgm-new/magic-female/reward.mp3",
  );
  command(1, {
    type: "game_rhythm_select",
    song: song.id,
    difficulty: "expert",
    length: "full",
  });
  assert.notEqual(g.rhythm.song, song.id, "Only the leader chooses");
  command(0, {
    type: "game_rhythm_select",
    song: song.id,
    difficulty: "expert",
    length: "full",
  });
  command(0, {
    type: "game_rhythm_ready",
    song: "invalid",
    difficulty: "expert",
    length: "full",
    ready: true,
  });
  assert.equal(g.rhythm.ready[0], false, "Stale song readiness is rejected");
  for (let i = 0; i < 4; i++)
    command(i, {
      type: "game_rhythm_ready",
      song: song.id,
      difficulty: "expert",
      length: "full",
      ready: true,
    });
  command(0, { type: "game_start" });
  assert.equal(g.phase, "playing");
  assert.equal(g.rhythm.start, 14);
  assert.equal(g.rhythm.run, 1);
  const notes = rhythmChart(song, "expert", "full"),
    first = notes[0];
  w.time = g.rhythm.start + first.time;
  const hit = {
    type: "game_rhythm_hit",
    note: 0,
    edge: "down",
    at: first.time,
    run: g.rhythm.run,
  };
  command(0, hit);
  assert.equal(g.rhythm.results[0].perfect, 1);
  const score = g.scores[0];
  command(0, hit);
  assert.equal(g.scores[0], score, "Duplicate hits cannot score twice");
  command(1, { ...hit, run: 0 });
  assert.equal(g.scores[1], 0, "Previous-run inputs are rejected");
  command(1, { ...hit, at: 99 });
  assert.equal(g.scores[1], 0, "Future timestamp rejected");
  command(1, { ...hit, note: -1 });
  assert.equal(g.scores[1], 0);
  command(1, { type: "game_rhythm_pause", paused: true });
  assert.equal(g.rhythm.pausedAt, undefined, "Only leader pauses");
  command(0, { type: "game_rhythm_pause", paused: true });
  const start = g.rhythm.start;
  w.time += 20;
  tickGames(w, 0);
  assert.equal(
    g.rhythm.results[1].miss,
    0,
    "Paused game does not expire notes",
  );
  command(0, { type: "game_rhythm_pause", paused: false });
  assert.equal(g.rhythm.start, start + 20);
  const events = notes
    .flatMap((n, i) => [
      { time: n.time, note: i, edge: "down" },
      ...(n.end !== undefined ? [{ time: n.end, note: i, edge: "up" }] : []),
    ])
    .sort((a, b) => a.time - b.time || a.note - b.note);
  for (const e of events) {
    w.time = g.rhythm.start + e.time;
    command(0, {
      type: "game_rhythm_hit",
      ...e,
      at: e.time,
      run: g.rhythm.run,
    });
    tickGames(w, 0);
  }
  w.time = g.deadline + 0.01;
  tickGames(w, 0);
  assert.equal(g.phase, "finished");
  assert.equal(g.scores[0], 1000000);
  assert.equal(g.rhythm.results[0].maxCombo, chartUnits(notes));
  assert.equal(g.rhythm.results[0].miss, 0);
  assert.deepEqual(g.winner, [0]);
  assert.equal(g.scores[1], 0);
  assert.equal(g.rhythm.results[1].miss, chartUnits(notes));
  const holdSong=RHYTHM_SONGS.find(s=>rhythmChart(s,'expert','short').some(n=>n.end!==undefined));
  command(0,{type:'game_rhythm_select',song:holdSong.id,difficulty:'expert',length:'short'});
  for(let i=0;i<4;i++)command(i,{type:'game_rhythm_ready',song:holdSong.id,difficulty:'expert',length:'short',ready:true});
  command(0, { type: "game_start" });
  assert.equal(g.rhythm.run, 2);
  assert.equal(g.rhythm.results[0].raw, 0);
  assert.equal(g.rhythm.results[0].combo, 0);
  const holdNotes=rhythmChart(holdSong,"expert","short");
  const holdIndex = holdNotes.findIndex((n) => n.end !== undefined);
  assert.ok(holdIndex >= 0);
  const hold = holdNotes[holdIndex];
  w.time = g.rhythm.start + hold.time;
  command(0, {
    type: "game_rhythm_hit",
    note: holdIndex,
    edge: "down",
    at: hold.time,
    run: 2,
  });
  w.time += 0.05;
  command(0, {
    type: "game_rhythm_hit",
    note: holdIndex,
    edge: "up",
    at: hold.time + 0.05,
    run: 2,
  });
  assert.equal(
    g.rhythm.results[0].tails[holdIndex],
    4,
    "Early release misses the hold tail",
  );
  command(3, { type: "game_leave" });
  assert.equal(g.phase, "playing", "Remaining players keep playing");
  assert.equal(g.players.length, 3);
  assert.equal(g.rhythm.results.length, 3);
  command(0, { type: "game_leave" });
  assert.equal(g.phase, "playing");
  assert.equal(g.players[0], "p1");
  g.phase = 'finished'; g.scores = [5000, 9000]; g.winner = [1]; command(1, {type:'game_leave'}); assert.deepEqual(g.winner, [0], 'Winner seats remain valid after departure');
  const { createWorld, addPlayer, applyAction } =
    await vite.ssrLoadModule("/src/rpg/engine.ts");
  const rpg = createWorld(7, undefined, 30, Date.now());
  addPlayer(rpg, "owner", "Owner");
  const owner = rpg.players.owner;
  rpg.started = true;
  rpg.deadlineAt = Date.now() + 1800000;
  owner.x = 20;
  owner.y = 20;
  rpg.tiles[20 * 192 + 20] = "grass";
  owner.life.bag = { housekit: 1, plank: 20, ore: 20, crystal: 20 };
  let now = Date.now();
  assert.ok(applyAction(rpg, "owner", { type: "life-build" }, now));
  const house = rpg.life.houses[0];
  assert.ok(house);
  assert.ok(
    applyAction(
      rpg,
      "owner",
      { type: "life-furniture-craft", item: "rhythm" },
      (now += 100),
    ),
  );
  assert.equal(owner.life.bag.plank, 15);
  assert.equal(owner.life.bag.ore, 17);
  assert.equal(owner.life.bag.crystal, 16);
  assert.ok(
    applyAction(
      rpg,
      "owner",
      { type: "life-place", item: "rhythm", x: 7, y: 5, rotation: 0 },
      (now += 100),
    ),
  );
  const cabinet = house.interior.placed.find((f) => f.item === "rhythm");
  assert.ok(cabinet);
  owner.life.roomPos = { x: 7, y: 4 };
  assert.ok(
    applyAction(
      rpg,
      "owner",
      { type: "life-game", command: { type: "game_join", slot: cabinet.slot } },
      (now += 100),
    ),
  );
  const rg = Object.values(rpg.life.games)[0];
  assert.equal(rg.kind, "rhythm");
  assert.ok(
    applyAction(
      rpg,
      "owner",
      {
        type: "life-game",
        command: {
          type: "game_rhythm_select",
          key: rg.key,
          song: song.id,
          difficulty: "easy",
          length: "short",
        },
      },
      (now += 100),
    ),
  );
  assert.equal(rg.rhythm.song, song.id);
  assert.ok(
    applyAction(
      rpg,
      "owner",
      {
        type: "life-game",
        command: {
          type: "game_rhythm_ready",
          key: rg.key,
          song: song.id,
          difficulty: "easy",
          length: "short",
          ready: true,
        },
      },
      (now += 100),
    ),
  );
  assert.ok(
    applyAction(
      rpg,
      "owner",
      { type: "life-game", command: { type: "game_start", key: rg.key } },
      (now += 100),
    ),
  );
  assert.equal(rg.phase, "playing");
  assert.ok(
    applyAction(
      rpg,
      "owner",
      { type: "life-pack", id: cabinet.id },
      (now += 100),
    ),
  );
  assert.ok(
    house.interior.placed.includes(cabinet),
    "Playing cabinet cannot be packed",
  );
  assert.equal(
    JSON.parse(JSON.stringify(rpg.life.games))[rg.key].rhythm.ready[0],
    true,
    "State survives network serialization",
  );
  console.log(
    `Rhythm passed: all 143 music assets, ${chartCount} deterministic charts, safe tap/hold geometry, judgement windows, 4-player readiness, leader selection/pause, timestamp/replay protection, full-song perfect scoring, misses, hold release, rematches and continuing after departure.`,
  );
} finally {
  await vite.close();
}
