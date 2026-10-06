import assert from "node:assert/strict";
import { createServer } from "vite";
const server = await createServer({
  cacheDir: "node_modules/.vite-city-core",
  optimizeDeps: { noDiscovery: true, entries: [] },
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "error",
});
try {
  const E = await server.ssrLoadModule("/src/rpg/engine.ts"),
    C = await server.ssrLoadModule("/src/rpg/city/model.ts"),
    T = await server.ssrLoadModule("/src/rpg/town/model.ts"),
    N = await server.ssrLoadModule("/src/rpg/town/catalog.ts"),
    V = await server.ssrLoadModule("/src/rpg/conversationVoice.ts"),
    S = await server.ssrLoadModule("/src/rpg/worldSave.ts"),
    R = await server.ssrLoadModule("/src/rpg/town/residentTransport.ts");
  let now = 1791111111111;
  const w = E.createWorld(42, undefined, 30, now);
  E.addPlayer(w, "a", "Builder");
  const p = w.players.a;
  p.profile = {
    hp: 72,
    maxHp: 75,
    gold: 100,
    deck: [],
    deckSize: 0,
    character: "WARRIOR",
    image: "",
  };
  const player = {
    id: "WARRIOR",
    currentHp: 72,
    maxHp: 75,
    gold: 100,
    deck: [],
    relics: [],
    potions: [],
    rpgMutationRevision: 0,
  };
  const send = (a) => E.applyAction(w, "a", a, (now += 300));
  assert.equal(send({ type: "city-continue" }), false);
  w.ended = true;
  w.endReason = "timeout";
  assert.equal(send({ type: "city-continue" }), false);
  w.endReason = "clear";
  w.won = true;
  w.rewardAt = now + 1000;
  w.rankingAwards = { a: {} };
  assert.equal(send({ type: "city-continue" }), false);
  now += 2000;
  assert.equal(send({type:"city-continue"}),false);
  for(let step=1;step<=6;step++)assert(send({type:"ending-progress",step}));
  assert.ok(send({ type: "city-continue" }));
  assert.equal(w.ended, false);
  assert.equal(w.deadlineAt, 0);
  assert.equal(w.timeLimitMinutes, 0);
  assert.equal(send({ type: "city-continue" }), false);
  // A deterministic land patch beside an original road: roads must form a connected graph.
  for (let y = 18; y < 38; y++)
    for (let x = 18; x < 42; x++) w.tiles[y * E.WIDTH + x] = "grass";
  w.sites = w.sites.filter((s) => s.x < 18 || s.x > 42 || s.y < 18 || s.y > 38);
  w.tiles[20 * E.WIDTH + 19] = "road";
  p.x = 20;
  p.y = 20;
  assert.ok(
    send({
      type: "city-road",
      tiles: [
        20 * E.WIDTH + 20,
        20 * E.WIDTH + 21,
        20 * E.WIDTH + 22,
        20 * E.WIDTH + 23,
        20 * E.WIDTH + 24,
        20 * E.WIDTH + 25,
      ],
    }),
  );
  assert.ok(C.roadConnections(w).has(20 * E.WIDTH + 25));
  assert.ok(send({ type: "city-road", tiles: [30 * E.WIDTH + 30] }));
  assert.equal(C.roadConnections(w).has(30 * E.WIDTH + 30), false);
  for (const [kind, x, y] of [
    ["cottage", 20, 21],
    ["cottage", 21, 21],
    ["wind", 22, 21],
    ["water", 23, 21],
    ["park", 24, 21],
    ["market", 25, 21],
  ])
    assert.ok(send({ type: "city-build", kind, x, y }), kind);
  assert.ok(w.city.lots[0].happiness >= 45);
  const before = w.city.treasury;
  assert.equal(
    send({ type: "city-build", kind: "solar", x: 26, y: 21 }),
    false,
  );
  assert.equal(
    send({ type: "city-build", kind: "cottage", x: 20, y: 21 }),
    false,
  );
  assert.equal(send({ type: "city-road", tiles: [-1] }), false);
  assert.equal(
    send({ type: "city-budget", service: "__proto__", amount: 100 }),
    false,
  );
  assert.equal(w.city.treasury, before);
  assert.ok(C.occupiedCityTile(w, 21 * E.WIDTH + 20));
  assert.equal(T.flowerAt(w, 21 * E.WIDTH + 20), undefined);
  for (let i = 0; i < 180; i++) {
    w.life.time += 1;
    C.advanceCity(w);
  }
  assert.equal(w.city.month, 6);
  assert.equal(w.city.population, 12);
  assert.ok(w.city.history.length === 6);
  const happy = w.city.happiness;
  assert.ok(send({ type: "city-tax", tax: 20 }));
  assert.ok(w.city.happiness < happy);
  assert.equal(send({ type: "city-tax", tax: NaN }), false);
  send({ type: "city-tax", tax: 9 });
  assert.ok(send({ type: "city-loan", amount: 1000 }));
  assert.equal(w.city.debt, 1000);
  assert.equal(send({ type: "city-loan", amount: 1000000 }), false);
  assert.ok(send({ type: "city-repay" }));
  assert.equal(w.city.debt, 0);
  w.city.treasury = 0;
  assert.ok(send({ type: "city-aid" }));
  w.city.treasury = 0;
  assert.equal(send({ type: "city-aid" }), false);
  w.city.treasury = 3000;
  E.addPlayer(w, "b", "Visitor");
  assert.equal(
    E.applyAction(
      w,
      "b",
      { type: "city-demolish", id: w.city.lots[0].id },
      now,
    ),
    false,
  );
  w.city.level = 1;
  assert.ok(send({ type: "city-upgrade", id: w.city.lots[0].id }));
  assert.equal(w.city.lots[0].level, 2);
  assert.equal(send({ type: "city-upgrade", id: w.city.lots[0].id }), false);
  assert.ok(send({ type: "city-road-remove", tiles: [20 * E.WIDTH + 20] }));
  assert.equal(C.occupiedCityTile(w, 20 * E.WIDTH + 20), false);
  assert.equal(w.city.lots[0].connected, false);
  assert.ok(send({ type: "city-road", tiles: [20 * E.WIDTH + 20] }));
  assert.ok(send({ type: "city-build", kind: "hall", x: 26, y: 21 }));
  assert.equal(send({ type: "city-build", kind: "hall", x: 27, y: 21 }), false);
  T.advanceTown(w, now);
  const resident = {
    type: "town-resident-create",
    name: "Nova",
    portrait: N.RESIDENTS[0].portrait,
    personality: 2,
    birthday: 4,
    voice: V.DEFAULT_CONVERSATION_VOICE,
  };
  assert.ok(send(resident));
  const npc = w.town.customResidents[0];
  assert.equal(T.personOf(w, npc.id).name, "Nova");
  assert.equal(
    send({ ...resident, portrait: "https://invalid.test/picture" }),
    false,
  );
  assert.equal(send({ ...resident, personality: 99 }), false);
  assert.equal(
    E.applyAction(
      w,
      "b",
      {
        type: "town-resident-edit",
        id: npc.id,
        name: "Bad",
        personality: 1,
        birthday: 2,
        voice: npc.voice,
      },
      now,
    ),
    false,
  );
  assert.ok(
    send({
      type: "town-word-teach",
      target: npc.id,
      word: { text: "Tea", reading: "てぃー", genre: "food" },
    }),
  );
  assert.equal(T.personOf(w, npc.id).words[0].genre, "food");
  assert.ok(send({ type: "town-talk", target: npc.id }));
  assert.ok(w.town.bonds.some((b) => b.people.includes(npc.id)));
  const cache = new Map();
  assert.equal(R.changedResidentAssets(w, cache).length, 1);
  assert.equal(R.changedResidentAssets(w, cache).length, 0);
  assert.ok(
    send({
      type: "town-resident-edit",
      id: npc.id,
      name: "New Nova",
      personality: 3,
      birthday: 5,
      voice: npc.voice,
    }),
  );
  assert.equal(R.changedResidentAssets(w, cache).length, 1);
  assert.equal(T.personOf(w, npc.id).name, "New Nova");
  assert.equal(
    "portrait" in R.stripResidentAssets(w).town.customResidents[0],
    false,
  );
  for (let i = 1; i < 16; i++) assert.ok(send({ ...resident, name: "N" + i }));
  assert.equal(send(resident), false);
  assert.equal(w.town.customResidents.length, 16);
  const save = S.makeWorldSave(w, "a", player, now),
    restored = S.restoreWorldSave(save, now + 86400000);
  assert.deepEqual(restored.city, w.city);
  assert.deepEqual(restored.town.customResidents, w.town.customResidents);
  assert.equal(S.canSaveWorld(restored, "a", player), true);
  w.town.cooking.a = { started: now };
  assert.equal(send({ type: "city-tax", tax: 15 }), false);
  console.log(
    "City/resident checks passed: clear-only unlock, endless return, road graph, building gates/ownership/upgrades, population and happiness, taxes/loans/aid, world persistence, 16 residents, validation, voice/word/conversation and bandwidth-safe asset transport.",
  );
} finally {
  await server.close();
}
