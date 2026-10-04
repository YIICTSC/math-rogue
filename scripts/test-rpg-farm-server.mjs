import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { WebSocket } from "ws";
import { createServer } from "vite";
const vite = await createServer({
  cacheDir: "node_modules/.vite-farm-server",
  optimizeDeps: { noDiscovery: true, entries: [] },
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "error",
});
const proc = spawn(process.execPath, ["server/dist/index.mjs"], {
    env: { ...process.env, PORT: "10121" },
    stdio: ["ignore", "pipe", "pipe"],
  }),
  clients = [];
let logs = "";
proc.stderr.on("data", (b) => (logs += b));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let ready = false;
  for (let i = 0; i < 150; i++) {
    try {
      if ((await fetch("http://127.0.0.1:10121/health")).ok) {
        ready = true;
        break;
      }
    } catch {}
    await sleep(100);
  }
  assert.ok(ready, logs);
  const F = await vite.ssrLoadModule("/src/rpg/farm/model.ts");
  const connect = async (packet) => {
    const ws = new WebSocket("ws://127.0.0.1:10121/online"),
      messages = [];
    clients.push(ws);
    ws.on("message", (raw) => messages.push(JSON.parse(raw.toString())));
    await new Promise((res, rej) => {
      ws.once("open", res);
      ws.once("error", rej);
    });
    ws.send(JSON.stringify({ type: "connect", protocol: 1, ...packet }));
    for (let i = 0; i < 100 && !messages.some((p) => p.type === "init"); i++)
      await sleep(20);
    assert.ok(messages.some((p) => p.type === "init"));
    return {
      ws,
      messages,
      id: messages.find((p) => p.type === "connected").id,
      code: messages.find((p) => p.type === "connected").code,
      initial: messages.find((p) => p.type === "init").world,
    };
  };
  const a = await connect({
      create: true,
      name: "Farmer",
      timeLimitMinutes: 0,
      setup: {
        visualTheme: "high-school",
        mode: "MULTIPLICATION",
        answerMode: "CHOICE",
        difficultyLevel: 1,
      },
    }),
    b = await connect({ code: a.code, name: "Friend" });
  const command = async (client, action) => {
    client.ws.send(JSON.stringify({ type: "action", action }));
    await sleep(180);
  };
  const state = () => b.messages.filter((m) => m.type === "state").at(-1).state;
  await command(a, { type: "rpg-start" });
  await command(a, { type: "farm-start" });
  await command(b, { type: "farm-start" });
  assert.equal(state().farm.people[a.id].coins, 100);
  assert.equal(state().farm.people[b.id].coins, 100);
  assert.equal(state().farm.people[a.id].plots.length, 24);
  const whole = {
      ...state(),
      tiles:
        typeof a.initial.tiles === "string"
          ? a.initial.tiles.split(",")
          : a.initial.tiles,
    },
    p = whole.players[a.id],
    spots = F.farmSpots(whole, p);
  assert.ok(spots.length, "initial town has a nearby farming location");
  await command(a, { type: "farm-establish", ...spots[0] });
  assert.equal(state().farm.people[a.id].x, spots[0].x);
  const W = await vite.ssrLoadModule("/src/rpg/walking.ts");
  const current = { ...state(), tiles: whole.tiles };
  const path = W.findWalkingRoute(
    current,
    current.players[a.id].x,
    current.players[a.id].y,
    spots[0].x + 3,
    spots[0].y + 3,
  );
  for (const step of path) {
    const p = state().players[a.id];
    if (F.nearFarm(p, state().farm.people[a.id])) break;
    await command(a, { type: "move", dx: step.x - p.x, dy: step.y - p.y });
  }
  assert.ok(
    F.nearFarm(state().players[a.id], state().farm.people[a.id]),
    "walk to the newly built farm before tending it",
  );
  const seed = Object.keys(state().farm.people[a.id].seeds)[0];
  await command(a, { type: "farm-plant", slot: 0, crop: seed });
  await command(a, { type: "farm-water", slot: 0 });
  assert.equal(state().farm.people[a.id].plots[0].crop, seed);
  assert.equal(state().farm.people[a.id].plots[0].water, state().town.day);
  await command(a, {
    type: "farm-animal-buy",
    kind: "chicken",
    name: "コッコ",
  });
  const animal = state().farm.people[a.id].animals[0];
  assert.ok(animal);
  await command(a, { type: "farm-animal-care", id: animal.id, care: "feed" });
  assert.equal(state().farm.people[a.id].animals[0].feed, state().town.day);
  await command(a, { type: "farm-pet-adopt", kind: "shiba", name: "ポチ" });
  const pet = state().farm.people[a.id].pets[0];
  assert.ok(pet);
  await command(a, { type: "farm-pet-care", id: pet.id, care: "pat" });
  assert.equal(state().farm.people[a.id].pets[0].bond, 13);
  const before = structuredClone(state().farm.people[a.id]);
  await command(b, {
    type: "farm-animal-care",
    id: animal.id,
    care: "collect",
  });
  await command(b, {
    type: "farm-sell",
    ingredient: "turnip",
    amount: 999999,
    quality: true,
  });
  assert.deepEqual(
    state().farm.people[a.id],
    before,
    "guest cannot consume or sell host resources",
  );
  const late = await connect({ code: a.code, name: "Late" }),
    f = late.initial.farm.people[a.id];
  assert.equal(f.plots[0].crop, seed);
  assert.equal(f.animals[0].name, "コッコ");
  assert.equal(f.pets[0].name, "ポチ");
  assert.equal(f.pets[0].bond, 13);
  assert.equal(f.activePet, pet.id);
  console.log(
    "Farm server passed: authoritative farm/plot/watering, livestock care, pet care, participant synchronization, ownership guards and complete late-join initialization.",
  );
} finally {
  for (const ws of clients) ws.close();
  proc.kill("SIGTERM");
  await new Promise((r) => proc.once("exit", r));
  await vite.close();
}
