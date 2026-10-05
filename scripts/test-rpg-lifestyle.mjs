import assert from "node:assert/strict";
import fs from "node:fs";
import { createServer } from "vite";
const server = await createServer({
  cacheDir: "node_modules/.vite-lifestyle-core",
  optimizeDeps: { noDiscovery: true, entries: [] },
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "error",
});
try {
  const E = await server.ssrLoadModule("/src/rpg/engine.ts"),
    T = await server.ssrLoadModule("/src/rpg/town/model.ts"),
    N = await server.ssrLoadModule("/src/rpg/town/catalog.ts"),
    G = await server.ssrLoadModule("/src/rpg/lifestyle/community.ts"),
    F = await server.ssrLoadModule("/src/rpg/farm/model.ts"),
    C = await server.ssrLoadModule("/src/rpg/lifestyle/catalog.ts"),
    Y = await server.ssrLoadModule("/src/rpg/lifestyle/cityLiving.ts"),
    S = await server.ssrLoadModule("/src/rpg/worldSave.ts"),
    M = await server.ssrLoadModule("/src/rpg/worldViewMath.ts");
  let now = 1791150000000;
  const w = E.createWorld(42, undefined, 0, now);
  E.addPlayer(w, "a", "A");
  E.addPlayer(w, "b", "B");
  for (const p of Object.values(w.players)) {
    p.x = 21;
    p.y = 22;
    p.profile = {
      hp: 72,
      maxHp: 72,
      gold: 100,
      deck: [],
      deckSize: 0,
      character: "WARRIOR",
      image: "",
    };
  }
  for (let y = 18; y < 50; y++)
    for (let x = 18; x < 60; x++) w.tiles[y * E.WIDTH + x] = "grass";
  w.sites = w.sites.filter((s) => s.x < 15 || s.x > 65 || s.y < 15 || s.y > 55);
  const send = (a, id = "a") => E.applyAction(w, id, a, (now += 300)),
    a = T.personOf(w, "a"),
    b = T.personOf(w, "b"),
    dish = N.DISHES[0].id;
  T.personOf(w, "resident-mina");
  a.foods[dish] = { normal: 20, perfect: 2 };
  const gift = {
    type: "town-food-gift",
    target: "b",
    dish,
    message: "ありがとう",
    wrap: 2,
  };
  assert.ok(send(gift));
  let g = w.town.community.gifts.at(-1);
  assert.equal(g.status, "pending");
  assert.equal(a.foods[dish].perfect, 1);
  assert.equal(b.foods[dish], undefined);
  assert.equal(
    send({ type: "town-food-answer", id: g.id, accept: true }),
    false,
  );
  assert.ok(send({ type: "town-food-answer", id: g.id, accept: true }, "b"));
  assert.equal(b.foods[dish].perfect, 1);
  assert.equal(
    send({ type: "town-food-answer", id: g.id, accept: true }, "b"),
    false,
  );
  const friendship = T.visibleFriendship(w, "a", "b");
  assert.ok(send(gift));
  g = w.town.community.gifts.at(-1);
  assert.ok(send({ type: "town-food-answer", id: g.id, accept: true }, "b"));
  assert.equal(T.visibleFriendship(w, "a", "b"), friendship);
  assert.ok(send(gift));
  g = w.town.community.gifts.at(-1);
  const before = a.foods[dish].normal;
  assert.ok(send({ type: "town-food-answer", id: g.id, accept: false }, "b"));
  assert.equal(a.foods[dish].normal, before + 1);
  assert.equal(
    send({ type: "town-food-answer", id: g.id, accept: false }, "b"),
    false,
  );
  assert.ok(send(gift));
  g = w.town.community.gifts.at(-1);
  const n = a.foods[dish].normal;
  w.life.time = g.expires;
  G.advanceCommunity(w);
  assert.equal(a.foods[dish].normal, n + 1);
  G.advanceCommunity(w);
  assert.equal(a.foods[dish].normal, n + 1);
  assert.equal(
    send({ type: "town-food-answer", id: g.id, accept: true }, "b"),
    false,
  );
  assert.equal(send({ ...gift, message: "x".repeat(81) }), false);
  assert.equal(send({ ...gift, target: "__proto__" }), false);
  assert.equal(send({ ...gift, target: "a" }), false);
  assert.equal(send({ ...gift, wrap: NaN }), false);
  w.players.b.x = 50;
  assert.equal(send(gift), false);
  w.players.b.x = 21;
  assert.ok(send({ ...gift, target: "resident-mina" }));
  assert.equal(w.town.community.gifts.at(-1).status, "accepted");
  assert.ok(w.town.news.some((n) => n.kind === "foodgift"));
  while (w.town.community.daily.a.count < 8)
    assert.ok(send({ ...gift, target: "resident-mina" }));
  const foodBefore = a.foods[dish].normal;
  w.town.community.gifts = [];
  assert.equal(send({ ...gift, target: "resident-mina" }), false);
  assert.equal(a.foods[dish].normal, foodBefore);
  assert.ok(send({ type: "farm-start" }));
  const f = F.ownFarm(w, "a");
  f.coins = 10000;
  f.feed = 100;
  f.x = 21;
  f.y = 22;
  f.upgrades = ["barn"];
  const quick = {
    type: "farm-quick",
    kind: "plot",
    id: "0",
    operation: "plant",
    crop: Object.keys(f.seeds)[0],
  };
  assert.ok(send(quick));
  assert.ok(f.plots[0].crop);
  assert.ok(
    send({ type: "farm-quick", kind: "plot", id: "0", operation: "water" }),
  );
  const planted = JSON.stringify(f.plots[0]);
  w.players.a.x = 45;
  assert.equal(
    send({ type: "farm-quick", kind: "plot", id: "0", operation: "harvest" }),
    false,
  );
  assert.equal(JSON.stringify(f.plots[0]), planted);
  w.players.a.x = 21;
  assert.equal(send({ ...quick, id: "__proto__" }), false);
  assert.equal(send({ ...quick, operation: "farm-quick" }), false);
  assert.equal(send(quick, "b"), false);
  assert.ok(send({ type: "farm-pet-adopt", kind: "retriever", name: "Sunny" }));
  const pet = f.pets[0];
  assert.ok(send({ type: "farm-pet-trick", id: pet.id, trick: "sit" }));
  const xp = f.xp;
  assert.equal(
    send({ type: "farm-pet-trick", id: pet.id, trick: "sit" }),
    false,
  );
  assert.equal(
    send({ type: "farm-pet-trick", id: pet.id, trick: "star" }),
    false,
  );
  w.life.time += 8;
  assert.ok(send({ type: "farm-pet-trick", id: pet.id, trick: "sit" }));
  assert.equal(f.xp, xp);
  pet.trained = 100;
  pet.bond = 100;
  pet.hunger = 100;
  for (const trick of C.PET_TRICKS) {
    w.life.time += 8;
    assert.ok(send({ type: "farm-pet-trick", id: pet.id, trick: trick[0] }));
  }
  assert.equal(Object.keys(pet.tricks).length, 16);
  assert.ok(send({ type: "farm-animal-buy", kind: "cow", name: "Daisy" }));
  const cow = f.animals[0];
  cow.bond = 80;
  cow.health = 100;
  w.town.day = cow.born + 2;
  w.town.elapsed = w.town.day * 180;
  f.lastDay = w.town.day;
  assert.ok(send({ type: "farm-animal-breed", id: cow.id, name: "Baby" }));
  assert.equal(f.animals.length, 2);
  assert.equal(
    send({ type: "farm-animal-breed", id: cow.id, name: "Baby" }),
    false,
  );
  assert.ok(send({ type: "farm-animal-care", id: cow.id, care: "pat" }));
  const snapshot = JSON.stringify(cow);
  assert.equal(
    send({ type: "farm-animal-care", id: cow.id, care: "pat" }),
    false,
  );
  assert.equal(JSON.stringify(cow), snapshot);
  w.ended = true;
  w.won = true;
  w.endReason = "clear";
  w.rewardAt = now - 1;
  assert.ok(send({ type: "city-continue" }));
  w.city.treasury = 10000;
  const lot = {
    id: "test",
    owner: "a",
    kind: "cottage",
    x: 22,
    y: 24,
    level: 1,
    people: 20,
    happiness: 60,
    connected: true,
    damage: 0,
  };
  w.city.lots.push(lot);
  assert.equal(
    send({ type: "city-district", id: lot.id, plan: "garden" }, "b"),
    false,
  );
  assert.ok(send({ type: "city-district", id: lot.id, plan: "garden" }));
  assert.equal(
    send({ type: "city-district", id: lot.id, plan: "garden" }),
    false,
  );
  assert.equal(Y.districtPlan(lot).green, 9);
  for (const project of C.CITY_PROJECTS) {
    assert.ok(send({ type: "city-project", project: project.id }));
    assert.equal(send({ type: "city-project", project: project.id }), false);
  }
  w.city.month += 5;
  Y.advanceCityLiving(w.city);
  assert.equal(w.city.living.projects.filter((p) => p.complete).length, 6);
  assert.ok(Y.projectBenefits(w.city).happiness >= 30);
  w.city.month = 0;
  w.city.population = 20;
  w.city.pollution = 0;
  const q = Y.cityRequests(w)[0];
  assert.ok(send({ type: "city-request", id: q.id }));
  assert.equal(send({ type: "city-request", id: q.id }), false);
  const player = {
    id: "WARRIOR",
    currentHp: 72,
    maxHp: 72,
    gold: 100,
    deck: [],
    relics: [],
    potions: [],
    rpgMutationRevision: 0,
  };
  const save = S.makeWorldSave(w, "a", player, now),
    restored = S.restoreWorldSave(
      JSON.parse(JSON.stringify(save)),
      now + 86400000,
    );
  assert.deepEqual(restored.town.community, w.town.community);
  assert.deepEqual(restored.farm, w.farm);
  assert.deepEqual(restored.city.living, w.city.living);
  assert.deepEqual(M.relativeMove(0, -1, 1), { dx: 1, dy: 0 });
  assert.deepEqual(M.relativeMove(-1, 0, 3), { dx: 0, dy: 1 });
  assert.ok(
    Math.abs(M.shortestTurn((3 * Math.PI) / 2, 0) - Math.PI / 2) < 0.001,
  );
  for (const file of [
    "sprites/rpg/lifestyle/icons.webp",
    "sprites/rpg/lifestyle/animal-poses.webp",
    "sprites/rpg/farm/pets/retriever.webp",
    "sprites/rpg/farm/pets/graytabby.webp",
  ])
    assert.ok(fs.statSync(`public/${file}`).size > 1000);
  console.log(
    "Lifestyle passed: gift escrow/consent/expiry/replay/bonds, NPC memories, 16 pet tricks, breeding/care guards, 6 projects/district ownership/request replay, save roundtrip, camera-relative controls and assets.",
  );
} finally {
  await server.close();
}
