import assert from "node:assert/strict";
import { createServer } from "vite";
import { chromium } from "playwright";
// Run the local PeerServer described in docs/rpg-online-development.md first.
const server = await createServer({
  cacheDir: "node_modules/.vite-rpg-network",
  optimizeDeps: { entries: ["src/rpg/network.ts"] },
  define: {
    "import.meta.env.VITE_RPG_PEER_HOST": '"127.0.0.1"',
    "import.meta.env.VITE_RPG_PEER_PORT": '"9000"',
    "import.meta.env.VITE_RPG_PEER_PATH": '"/rpg"',
    "import.meta.env.VITE_RPG_PEER_SECURE": '"false"',
  },
  server: { host: "127.0.0.1", port: 5197, strictPort: true },
  plugins: [
    {
      name: "network-fixture",
      configureServer(s) {
        s.middlewares.use("/__network", (req, res) => {
          res.setHeader("Content-Type", "text/html");
          res.end(
            '<html><body><script type="module">import{RpgRoom}from"/src/rpg/network.ts";window.RpgRoom=RpgRoom;</script></body></html>',
          );
        });
      },
    },
  ],
});
await server.listen();
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5197/__network");
  await page.waitForFunction(() => !!window.RpgRoom);
  await page.evaluate(async () => {
    window.snapshots = {};
    window.rooms = [];
    window.errors = [];
    const host = new window.RpgRoom(
      (w) => (window.snapshots.host = w),
      (m) => window.errors.push(m),
    );
    window.rooms.push(host);
    window.host = host;
    await host.create("Host");
    for (let batch = 0; batch < 13; batch++)
      await Promise.all(
        Array.from({ length: 3 }, async (_, j) => {
          const i = batch * 3 + j;
          const r = new window.RpgRoom(
            (w) => (window.snapshots[i] = w),
            (m) => window.errors.push(m),
          );
          window.rooms.push(r);
          await r.join(host.code, `Player ${i + 1}`);
        }),
      );
  });
  await page.waitForFunction(
    () => Object.keys(window.snapshots[38]?.players || {}).length === 40,
  );
  const ids = await page.evaluate(() => {
    const host = window.host,
      client = window.rooms[1],
      site = host.world.sites.find((s) => s.kind === "guardian");
    const p = host.world.players[client.selfId];
    p.x = site.x;
    p.y = site.y;
    client.send({ type: "native-enter", siteId: site.id });
    return { player: client.selfId, site: site.id };
  });
  await page.waitForFunction(
    (id) => !!window.rooms[1].world.players[id].nativeScene,
    ids.player,
  );
  await page.evaluate(() => {
    const c = window.rooms[1],
      token = c.world.players[c.selfId].nativeScene.token;
    c.send({ type: "native-ready", token, maxHp: 400 });
  });
  await page.waitForFunction(
    (id) => window.snapshots[38].sites.find((s) => s.id === id).maxHp === 400,
    ids.site,
  );
  await page.evaluate(() => {
    const c = window.rooms[1],
      token = c.world.players[c.selfId].nativeScene.token;
    c.send({ type: "native-damage", token, total: 120, sequence: 1 });
    c.send({ type: "native-damage", token, total: 120, sequence: 1 });
  });
  await page.waitForFunction(
    (id) => window.snapshots[38].sites.find((s) => s.id === id).hp === 280,
    ids.site,
  );
  await page.evaluate(() => {
    const c = window.rooms[1],
      token = c.world.players[c.selfId].nativeScene.token;
    c.send({ type: "native-damage", token, total: 400, sequence: 2 });
    c.send({
      type: "native-finish",
      token,
      outcome: "victory",
      profile: {
        hp: 65,
        maxHp: 80,
        gold: 120,
        deckSize: 11,
        character: "WARRIOR",
        image: "",
      },
    });
  });
  await page.waitForFunction(
    (id) => window.snapshots[38].players[id].completedBattles === 1,
    ids.player,
  );
  assert.equal(
    await page.evaluate(
      (id) => window.snapshots[38].sites.find((s) => s.id === id).cleared,
      ids.site,
    ),
    true,
  );
  const rejected = await page.evaluate(async () => {
    const r = new window.RpgRoom(
      () => {},
      () => {},
    );
    try {
      await r.join(window.host.code, "Overflow");
      return false;
    } catch {
      return true;
    } finally {
      r.close();
    }
  });
  assert(rejected);
  await page.evaluate(() => window.rooms[1].close());
  await page.waitForFunction(
    () => Object.keys(window.host.world.players).length === 39,
  );
  assert.deepEqual(await page.evaluate(() => window.errors), []);
  await page.evaluate(() => window.rooms.forEach((r) => r.close()));
  assert.deepEqual(errors, []);
  console.log(
    "40 real WebRTC clients: native scene tokens, shared damage and replay protection, rewards/profile sync, capacity and disconnect passed.",
  );
} finally {
  await browser.close();
  await server.close();
}
