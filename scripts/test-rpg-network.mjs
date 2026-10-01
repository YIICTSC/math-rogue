import assert from "node:assert/strict";
import { createServer } from "vite";
import { chromium } from "playwright";
// Run the local PeerServer described in docs/rpg-online-development.md first.
const server = await createServer({
  cacheDir: "node_modules/.vite-rpg-network",
  optimizeDeps: { entries: ["src/rpg/network.ts"] },
  define: {
    "import.meta.env.VITE_ONLINE_SERVER_URL": '""',
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
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("requestfailed", (request) =>
    errors.push(`${request.url()}: ${request.failure()?.errorText}`),
  );
  await page.goto("http://127.0.0.1:5197/__network", { waitUntil: "commit" });
  await page.waitForFunction(
    () => !!window.RpgRoom,
    null,
    { timeout: 120_000, polling: 250 },
  ).catch((error) => {
    throw new Error(`${error.message}\n${errors.join("\n")}`);
  });
  await page.evaluate(async () => {
    window.snapshots = {};
    window.rooms = [];
    window.errors = [];
    const setup = {
      visualTheme: "elementary",
      mode: "MULTIPLICATION",
      modePool: ["MULTIPLICATION"],
      answerMode: "CHOICE",
      difficultyLevel: 2,
      assignment: {
        id: "network-assignment",
        title: "ネットワーク課題",
        units: [],
        customProblems: [
          { id: "custom-1", question: "1+1", answer: "2", options: ["1", "2"] },
        ],
        dueAt: "2099-01-01T00:00:00.000Z",
        gameMode: "FREE",
        answerMode: "CHOICE",
        createdAt: "2098-01-01T00:00:00.000Z",
      },
    };
    const host = new window.RpgRoom(
      (w) => (window.snapshots.host = w),
      (m) => window.errors.push(m),
    );
    window.rooms.push(host);
    window.host = host;
    await host.create("Host", setup);
    const inviteHost = new window.RpgRoom(() => {}, (m) => window.errors.push(m));
    const inviteGuest = new window.RpgRoom(() => {}, (m) => window.errors.push(m));
    window.inviteHost = inviteHost;
    window.inviteGuest = inviteGuest;
    await inviteHost.create("Invite Host", {
      ...setup,
      visualTheme: "ELEMENTARY",
      modePool: ["MULTIPLICATION", null, 2],
      answerMode: "choice",
      difficultyLevel: "2",
    });
    await inviteGuest.prepareInviteJoin(inviteHost.code, "Invite Guest", (s) => {
      window.inviteReceivedSetup = { ...s, visualTheme: "magic" };
    });
    window.inviteWasUnregistered = !inviteHost.world.players[inviteGuest.selfId];
    inviteGuest.enterWorld({
      hp: 80,
      maxHp: 80,
      gold: 100,
      deckSize: 10,
      character: "WARRIOR",
      image: "",
    });
    await new Promise((resolve, reject) => {
      const started = Date.now();
      const timer = window.setInterval(() => {
        if (
          window.inviteHost.world.players[inviteGuest.selfId]?.profile?.character ===
          "WARRIOR"
        ) {
          window.clearInterval(timer);
          resolve();
        } else if (Date.now() - started > 5000) {
          window.clearInterval(timer);
          reject(new Error("invitee was not admitted after entering the world"));
        }
      }, 25);
    });
    window.inviteJoinedPlayer = inviteHost.world.players[inviteGuest.selfId];
    inviteGuest.close();
    inviteHost.close();
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
  await page.evaluate(() => {
    const guest = window.rooms[1];
    guest.send({ type: "move", dx: 1, dy: 0 });
    guest.send({ type: "rpg-start" });
  });
  await page.waitForTimeout(350);
  assert.equal(await page.evaluate(() => window.host.world.started), false, "guests cannot move or start while players are gathering");
  await page.evaluate(() => window.host.send({ type: "rpg-start" }));
  await page.waitForFunction(() => window.host.world.started && window.rooms[1].world.started);
  assert.deepEqual(await page.evaluate(() => window.inviteReceivedSetup), {
    visualTheme: "magic",
    mode: "MULTIPLICATION",
    modePool: ["MULTIPLICATION"],
    answerMode: "CHOICE",
    difficultyLevel: 2,
    assignment: {
      id: "network-assignment",
      title: "ネットワーク課題",
      units: [],
      customProblems: [
        { id: "custom-1", question: "1+1", answer: "2", options: ["1", "2"] },
      ],
      dueAt: "2099-01-01T00:00:00.000Z",
      gameMode: "FREE",
      answerMode: "CHOICE",
      createdAt: "2098-01-01T00:00:00.000Z",
    },
  });
  assert.equal(
    await page.evaluate(() => window.inviteWasUnregistered),
    true,
    "an invitee is not registered before choosing a protagonist",
  );
  assert.deepEqual(
    await page.evaluate(() => ({
      name: window.inviteJoinedPlayer.name,
      character: window.inviteJoinedPlayer.profile.character,
    })),
    { name: "Invite Guest", character: "WARRIOR" },
    "the invitee name and selected protagonist are admitted together",
  );
  assert.deepEqual(
    await page.evaluate(() => window.snapshots[38].setup),
    {
      visualTheme: "elementary",
      mode: "MULTIPLICATION",
      modePool: ["MULTIPLICATION"],
      answerMode: "CHOICE",
      difficultyLevel: 2,
      assignment: {
        id: "network-assignment",
        title: "ネットワーク課題",
        units: [],
        customProblems: [
          { id: "custom-1", question: "1+1", answer: "2", options: ["1", "2"] },
        ],
        dueAt: "2099-01-01T00:00:00.000Z",
        gameMode: "FREE",
        answerMode: "CHOICE",
        createdAt: "2098-01-01T00:00:00.000Z",
      },
    },
    "host adventure setup is included in the participant world",
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
    "Invite setup normalization and delayed admission passed; 40 real WebRTC clients: native scene tokens, shared damage and replay protection, rewards/profile sync, capacity and disconnect passed.",
  );
} finally {
  await browser.close();
  await server.close();
}
