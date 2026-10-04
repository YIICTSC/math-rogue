import assert from "node:assert/strict";
import { createServer } from "vite";
import fs from "node:fs";
const server = await createServer({
  cacheDir: "node_modules/.vite-farm-test",
  optimizeDeps: { noDiscovery: true, entries: [] },
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "error",
});
try {
  const E = await server.ssrLoadModule("/src/rpg/engine.ts"),
    F = await server.ssrLoadModule("/src/rpg/farm/model.ts"),
    C = await server.ssrLoadModule("/src/rpg/farm/catalog.ts"),
    T = await server.ssrLoadModule("/src/rpg/town/model.ts"),
    N = await server.ssrLoadModule("/src/rpg/town/catalog.ts"),
    L = await server.ssrLoadModule("/src/rpg/life.ts"),
    H = await server.ssrLoadModule("/src/rpg/homeCatalog.ts"),
    S = await server.ssrLoadModule("/src/rpg/worldSave.ts"),
    Y = await server.ssrLoadModule("/src/rpg/city/model.ts");
  let now = 1791150000000;
  const w = E.createWorld(42, undefined, 0, now);
  E.addPlayer(w, "a", "Farmer");
  E.addPlayer(w, "b", "Friend");
  const p = w.players.a;
  p.profile = {
    hp: 72,
    maxHp: 72,
    gold: 100,
    deck: [],
    deckSize: 0,
    character: "WARRIOR",
    image: "",
  };
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
  const send = (a, id = "a") => E.applyAction(w, id, a, (now += 300));
  for (let y = 18; y < 50; y++)
    for (let x = 18; x < 60; x++) w.tiles[y * E.WIDTH + x] = "grass";
  w.sites = w.sites.filter((s) => s.x < 15 || s.x > 65 || s.y < 15 || s.y > 55);
  p.x = 21;
  p.y = 22;
  w.players.b.x = 25;
  w.players.b.y = 25;
  assert.equal(C.CROPS.length, 32);
  assert.equal(C.LIVESTOCK.length, 8);
  assert.equal(C.PET_SPECIES.length, 16);
  assert.equal(C.FARM_DISHES.length, 48);
  assert.equal(N.ALL_DISHES.length, 72);
  assert.ok(send({ type: "farm-start" }));
  assert.equal(send({ type: "farm-start" }), false);
  const f = F.ownFarm(w, "a");
  assert.equal(f.seeds.turnip, 3);
  assert.equal(send({ type: "farm-establish", x: 0, y: 0 }), false);
  assert.ok(send({ type: "farm-establish", x: 22, y: 23 }));
  assert.equal(p.life.bag.wood, 0);
  assert.ok(F.occupiedFarmTile(w, 24 * E.WIDTH + 24));
  assert.equal(Y.validCityTile(w, 24, 24), false);
  assert.equal(F.validFarmSpot(w, 23, 23), false);
  assert.equal(L.natureAt(w, 24 * E.WIDTH + 24), null);
  assert.ok(L.lifeWalkable(w, 24, 24));
  assert.ok(send({ type: "farm-plant", slot: 0, crop: "turnip" }));
  assert.equal(send({ type: "farm-plant", slot: 12, crop: "turnip" }), false);
  assert.equal(send({ type: "farm-plant", slot: 1, crop: "tomato" }), false);
  assert.equal(send({ type: "farm-harvest", slot: 0 }), false);
  assert.ok(send({ type: "farm-water", slot: 0 }));
  assert.equal(send({ type: "farm-water", slot: 0 }), false);
  assert.ok(send({ type: "farm-fertilize", slot: 0 }));
  assert.equal(send({ type: "farm-fertilize", slot: 0 }), false);
  const day = (n) => {
    w.town.day = n;
    w.town.elapsed = n * 180;
    F.advanceFarm(w);
  };
  day(1);
  assert.equal(f.plots[0].growth, 1);
  assert.ok(send({ type: "farm-harvest", slot: 0 }));
  assert.equal(f.pantry.turnip.quality, 4);
  assert.equal(f.book.turnip.best, 80);
  assert.equal(send({ type: "farm-harvest", slot: 0 }), false);
  assert.ok(send({ type: "farm-reward", id: "first" }));
  assert.equal(send({ type: "farm-reward", id: "first" }), false);
  let old = f.coins;
  assert.ok(
    send({ type: "farm-sell", ingredient: "turnip", amount: 1, quality: true }),
  );
  assert.equal(f.coins - old, 24);
  assert.equal(
    send({
      type: "farm-sell",
      ingredient: "turnip",
      amount: -1,
      quality: true,
    }),
    false,
  );
  assert.equal(
    send({ type: "farm-seed", crop: "__proto__", amount: 1 }),
    false,
  );
  // Another participant cannot harvest this farmer's plots; its commands address only its own farm.
  assert.equal(send({ type: "farm-harvest", slot: 0 }, "b"), true);
  assert.equal(f.pantry.turnip.quality, 3);
  f.coins = 5000;
  p.life.bag.wood = 100;
  p.life.bag.stone = 100;
  p.life.bag.ore = 100;
  p.life.bag.crystal = 100;
  assert.ok(send({ type: "farm-animal-buy", kind: "chicken", name: "コッコ" }));
  assert.ok(send({ type: "farm-animal-buy", kind: "cow", name: "ミルク" }));
  const hen = f.animals[0];
  assert.ok(send({ type: "farm-animal-care", id: hen.id, care: "feed" }));
  assert.equal(
    send({ type: "farm-animal-care", id: hen.id, care: "feed" }),
    false,
  );
  assert.ok(send({ type: "farm-animal-care", id: hen.id, care: "brush" }));
  assert.ok(send({ type: "farm-animal-care", id: hen.id, care: "clean" }));
  day(2);
  assert.equal(hen.ready, 1);
  assert.ok(send({ type: "farm-animal-care", id: hen.id, care: "collect" }));
  assert.ok(f.pantry.egg.normal > 0);
  assert.equal(
    send({ type: "farm-animal-care", id: hen.id, care: "collect" }),
    false,
  );
  day(3);
  assert.equal(hen.ready, 0, "unfed animals do not produce");
  assert.equal(
    send({ type: "farm-animal-care", id: hen.id, care: "hack" }),
    false,
  );
  f.xp = 700;
  assert.ok(send({ type: "farm-upgrade", upgrade: "barn" }));
  assert.equal(F.animalLimit(f), 12);
  assert.ok(send({ type: "farm-upgrade", upgrade: "greenhouse" }));
  assert.ok(send({ type: "farm-upgrade", upgrade: "irrigation" }));
  assert.equal(send({ type: "farm-upgrade", upgrade: "greenhouse" }), false);
  // All crops can complete in the greenhouse; irrigation supplies water, and harvest quality enters the collection.
  for (const crop of C.CROPS) {
    const slot = 1;
    assert.ok(send({ type: "farm-seed", crop: crop.id, amount: 1 }));
    assert.ok(send({ type: "farm-plant", slot, crop: crop.id }));
    for (let i = 0; i < crop.days; i++) day(w.town.day + 1);
    assert.equal(f.plots[slot].growth, crop.days);
    assert.ok(send({ type: "farm-harvest", slot }));
    assert.ok(f.book[crop.id]);
    delete f.plots[slot].crop;
  }
  assert.ok(send({ type: "farm-pet-adopt", kind: "shiba", name: "ポチ" }));
  const pet = f.pets[0];
  for (const care of ["feed", "pat", "play", "train"])
    assert.ok(send({ type: "farm-pet-care", id: pet.id, care }));
  assert.equal(
    send({ type: "farm-pet-care", id: pet.id, care: "play" }),
    false,
  );
  pet.hunger = 80;
  pet.bond = 50;
  p.moveCount += 20;
  F.advanceFarm(w);
  assert.equal(pet.bond, 54);
  F.advanceFarm(w);
  assert.equal(pet.bond, 54, "walk bond reward only once a day");
  assert.ok(send({ type: "farm-pet-care", id: pet.id, care: "trip" }));
  assert.equal(send({ type: "farm-pet-care", id: pet.id, care: "pat" }), false);
  w.life.time += 181;
  F.advanceFarm(w);
  assert.equal(pet.awayUntil, 0);
  assert.equal(pet.trips, 1);
  assert.ok(send({ type: "farm-name", id: pet.id, name: "コムギ" }));
  assert.equal(pet.name, "コムギ");
  // Cooking consumes actual crop and animal products once, then shares the existing authoritative timing action.
  const home = {
    id: "home-a",
    owner: "a",
    ownerName: "Farmer",
    x: 40,
    y: 40,
    biome: "meadow",
    home: {
      tile: 40 * E.WIDTH + 40,
      level: 1,
      furniture: [{ slot: 0, item: "workbench" }],
    },
    interior: H.newInterior(),
    invitedAt: 0,
  };
  w.life.houses.push(home);
  p.life.indoors = home.id;
  p.life.roomPos = { x: 9, y: 11 };
  T.personOf(w, "a");
  const recipe = C.FARM_DISHES[4];
  delete f.pantry.strawberry;
  assert.equal(send({ type: "town-cook-start", dish: recipe.id }), true);
  assert.equal(
    w.town.cooking.a,
    undefined,
    "missing ingredients must reject cooking",
  );
  for (const [id, n] of Object.entries(recipe.farmCost))
    f.pantry[id] = { normal: n, quality: 0 };
  assert.ok(send({ type: "town-cook-start", dish: recipe.id }));
  for (const [id] of Object.entries(recipe.farmCost))
    assert.equal(f.pantry[id].normal, 0);
  assert.equal(
    send({ type: "farm-feed-buy" }),
    false,
    "cooking owns player input",
  );
  for (let i = 0; i < 3; i++) {
    now = w.town.cooking.a.started + 800;
    assert.ok(E.applyAction(w, "a", { type: "town-cook-tap" }, now));
  }
  assert.equal(w.town.people.a.foods[recipe.id].perfect, 1);
  assert.ok(send({ type: "town-meal", dish: recipe.id, target: "a" }));
  assert.equal(w.town.people.a.foods[recipe.id].perfect, 0);
  // Every farm recipe uses its own crop/product combination and completes in the shared kitchen.
  for (const recipe of C.FARM_DISHES) {
    for (const [key, n] of Object.entries(recipe.farmCost))
      f.pantry[key] = { normal: n, quality: 1 };
    for (const [key, n] of Object.entries(recipe.cost)) p.life.bag[key] = n;
    assert.ok(send({ type: "town-cook-start", dish: recipe.id }), recipe.id);
    for (const [key] of Object.entries(recipe.farmCost)) {
      assert.equal(f.pantry[key].normal, 0);
      assert.equal(
        f.pantry[key].quality,
        1,
        "normal quality is used before premium",
      );
    }
    for (let i = 0; i < 3; i++) {
      now = w.town.cooking.a.started + 800;
      assert.ok(E.applyAction(w, "a", { type: "town-cook-tap" }, now));
    }
    assert.ok(w.town.people.a.cooked[recipe.id]);
  }
  const save = S.makeWorldSave(w, "a", player, now),
    resume = S.restoreWorldSave(save, now + 86400000);
  assert.deepEqual(
    resume.farm,
    w.farm,
    "closed-app crop, pet and animal clocks remain frozen",
  );
  assert.deepEqual(resume.life.time, w.life.time);
  const before = f.coins;
  p.nativeScene = { token: "busy" };
  assert.equal(send({ type: "farm-seed", crop: "carrot", amount: 1 }), false);
  delete p.nativeScene;
  assert.equal(f.coins, before);
  for (const c of C.CROPS)
    assert.ok(fs.existsSync(`public/sprites/rpg/farm/crops/${c.id}.webp`));
  for (const a of C.LIVESTOCK)
    assert.ok(fs.existsSync(`public/sprites/rpg/farm/animals/${a.id}.webp`));
  for (const p of C.PET_SPECIES)
    assert.ok(fs.existsSync(`public/sprites/rpg/farm/pets/${p.id}.webp`));
  for (const d of C.FARM_DISHES) {
    assert.ok(fs.existsSync(`public/sprites/rpg/farm/food/${d.index}.webp`));
    for (const id of Object.keys(d.farmCost)) assert.ok(C.ingredientById(id));
  }
  console.log(
    "Farm passed: 32 crops, 8 livestock, 16 pets, 48 recipes, seasons/growth/quality/rotation, no duplicate rewards/production, ownership, irrigation/greenhouse/barn, pet care/walk/errands, ingredient cooking, busy guards, frozen save/restore and 112 generated WebP assets.",
  );
} finally {
  await server.close();
}
