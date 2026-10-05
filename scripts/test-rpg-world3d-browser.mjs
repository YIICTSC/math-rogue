import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createServer } from "vite";
import { chromium } from "playwright";
const file = `.world3d-fixture-${process.pid}.tsx`;
let server, browser;
const errors = [];
try {
  const source = await fs.readFile(
    "scripts/test-rpg-mobile-browser.mjs",
    "utf8",
  );
  const fixture = source.match(/const fixture=`([\s\S]*?)`;\nlet server/)[1];
  await fs.writeFile(file, fixture);
  server = await createServer({
    cacheDir: "node_modules/.vite-world3d-test",
    optimizeDeps: {
      noDiscovery: true,
      entries: [],
      include: [
        "react",
        "react-dom/client",
        "react/jsx-runtime",
        "peerjs",
        "three",
      ],
    },
    server: { port: 4230, strictPort: true, host: "127.0.0.1", hmr: false },
    plugins: [
      {
        name: "world3d",
        configureServer(s) {
          s.middlewares.use("/world3d", async (req, res) => {
            res.setHeader("Content-Type", "text/html");
            res.end(
              await s.transformIndexHtml(
                req.url,
                `<html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><div id="root"></div><script type="module" src="/${file}"></script></body></html>`,
              ),
            );
          });
        },
      },
    ],
    logLevel: "error",
  });
  await server.listen();
  browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--use-gl=angle",
      "--use-angle=swiftshader-webgl",
      "--enable-unsafe-swiftshader",
    ],
  });
  const p = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  p.setDefaultTimeout(90000);
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://127.0.0.1:4230/world3d");
  await p.getByRole("button", { name: "冒険をはじめる" }).click();
  await p.waitForFunction(() => window.room?.world);
  await p.evaluate(() => window.prepare());
  await p.evaluate(() => {
    const w = window.room.world;
    const npc = w.sites.find((s) => s.kind === "npc");
    const chest = w.sites.find((s) => s.kind === "treasure");
    npc.x = 20;
    npc.y = 17;
    chest.x = 19;
    chest.y = 17;
    window.room.emit();
  });
  console.log("RPG fixture ready");
  await p.getByRole("button", { name: "2D / 3D", exact: true }).click();
  await p.locator("[data-testid=rpg-world-3d]").waitFor();
  console.log("RPG 3D rendered");
  await p.waitForTimeout(1500);
  await p.screenshot({
    path: "/workspace/scratch/lifestyle-screens/3d-billboards.png",
  });
  await p.locator(".rpg-turn-controls button").last().click();
  await p.waitForFunction(
    () =>
      document.querySelector("[data-testid=rpg-world-3d]")?.dataset.facing ===
      "1",
  );
  await p.keyboard.press("w");
  await p.waitForFunction(() =>
    window.sent.some((a) => a.type === "move" && a.dx === 1 && a.dy === 0),
  );
  await p.keyboard.press("q");
  await p.waitForFunction(
    () =>
      document.querySelector("[data-testid=rpg-world-3d]")?.dataset.facing ===
      "0",
  );
  await p.locator(".rpg-dpad button").first().dispatchEvent("pointerdown", {
    pointerId: 1,
    pointerType: "touch",
    isPrimary: true,
    button: 0,
  });
  await p.locator(".rpg-dpad button").first().dispatchEvent("pointerup", {
    pointerId: 1,
    pointerType: "touch",
    isPrimary: true,
    button: 0,
  });
  await p.waitForFunction(() =>
    window.sent.some((a) => a.type === "move" && a.dx === 0 && a.dy === -1),
  );
  for (const [width, height] of [
    [390, 844],
    [844, 390],
    [1440, 900],
  ]) {
    await p.setViewportSize({ width, height });
    await p.waitForTimeout(250);
    const view = await p.locator("[data-testid=rpg-world-3d]").boundingBox(),
      switcher = await p.locator(".rpg-view-switch").boundingBox();
    assert.ok(view.width >= width - 2);
    assert.ok(
      switcher.width >= 44 &&
        switcher.height >= 44 &&
        switcher.x + switcher.width <= width + 1,
    );
    assert.ok(
      await p
        .locator(".rpg-root")
        .evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
    );
    await p.screenshot({
      path: `/workspace/scratch/lifestyle-screens/rpg-3d-${width}.png`,
    });
  }
  await p.getByRole("button", { name: "2D / 3D", exact: true }).click();
  await p.locator("[data-testid=rpg-world-3d]").waitFor({ state: "detached" });
  await p.keyboard.press("ArrowRight");
  await p.evaluate(async () => {
    const { farmOf } = await import("/src/rpg/farm/model.ts");
    const w = window.room.world,
      me = w.players.local;
    me.x = 20;
    me.y = 20;
    const f = farmOf(w, me);
    f.x = 20;
    f.y = 20;
    f.feed = 30;
    f.animals = [
      {
        id: "cow-q",
        kind: "cow",
        name: "Daisy",
        born: 0,
        feed: -1,
        brush: -1,
        clean: -1,
        bond: 70,
        health: 100,
        progress: 0,
        ready: 1,
      },
    ];
    f.pets = [
      {
        id: "pet-q",
        kind: "retriever",
        name: "Sunny",
        bond: 50,
        hunger: 70,
        trained: 20,
        cares: {},
        walkBase: 0,
        walkDay: -1,
        awayUntil: 0,
        trips: 0,
      },
    ];
    f.activePet = "pet-q";
    w.farm.revision = 1;
    window.room.emit();
  });
  await p.locator("[data-testid=farm-quick]").waitFor();
  await p
    .locator(".rpg-farm-targets")
    .getByRole("button", { name: "畑 1", exact: true })
    .click();
  await p.getByRole("button", { name: "🌱 植える", exact: true }).click();
  await p.getByRole("button", { name: "💧 水やり", exact: true }).click();
  assert.ok(
    await p.evaluate(() => window.room.world.farm.people.local.plots[0].crop),
  );
  await p
    .locator(".rpg-farm-targets")
    .getByRole("button", { name: "Daisy", exact: true })
    .click();
  await p
    .locator(".rpg-farm-buttons")
    .getByRole("button", { name: "♡ なでる", exact: true })
    .click();
  assert.ok(
    await p.evaluate(
      () => window.room.world.farm.people.local.animals[0].moment,
    ),
  );
  await p
    .locator(".rpg-farm-targets")
    .getByRole("button", { name: "Sunny", exact: true })
    .click();
  await p
    .locator(".rpg-farm-buttons")
    .getByRole("button", { name: "遊ぶ", exact: true })
    .click();
  assert.ok(
    await p.evaluate(() => window.room.world.farm.people.local.pets[0].moment),
  );
  for (const [width, height] of [
    [844, 390],
    [568, 320],
  ]) {
    await p.setViewportSize({ width, height });
    await p.waitForTimeout(150);
    await p.locator(".rpg-compact-dock button").first().click();
    await p
      .locator(".rpg-life>nav")
      .getByRole("button", { name: "クラフト", exact: true })
      .click();
    const body = await p.locator(".rpg-life-content").boundingBox();
    assert.ok(
      body.height >= 90 && body.y + body.height <= height + 1,
      JSON.stringify(body),
    );
    const last = p.locator(".rpg-life-content button").last();
    await last.scrollIntoViewIfNeeded();
    const bounds = await last.boundingBox();
    assert.ok(
      bounds.y >= body.y - 1 &&
        bounds.y + bounds.height <= body.y + body.height + 1,
    );
    await p.locator(".rpg-life>header button").click();
    await p.locator(".rpg-compact-dock button").last().click();
    await p
      .locator(".rpg-detail-tabs")
      .getByRole("button", { name: "暮らし", exact: true })
      .click();
    await p
      .locator(".town-tabs")
      .getByRole("button", { name: "暮らしの状態", exact: true })
      .click();
    await p.locator(".town-today-guide summary").click();
    assert.ok(
      await p
        .locator(".town-today-guide")
        .innerText()
        .then((t) => t.includes("1日は活動時間で3分")),
    );
    await p
      .locator(".town-tabs")
      .getByRole("button", { name: "家族", exact: true })
      .click();
    assert.equal(
      await p
        .locator(".town-tabs")
        .evaluate((el) => getComputedStyle(el).flexWrap),
      "nowrap",
    );
    await p.locator(".rpg-detail-close").click();
  }
  await p.setViewportSize({ width: 844, height: 390 });
  await p.screenshot({
    path: "/workspace/scratch/lifestyle-screens/farm-quick-landscape.png",
  });
  assert.deepEqual(errors, []);
  console.log(
    "RPG 3D integration passed: real exploration, mobile turn buttons, relative keyboard and dpad, three layouts, toggle, adjacent farm/animal/pet actions and scrollable landscape menus.",
  );
} finally {
  await browser?.close();
  await server?.close();
  await fs.rm(file, { force: true });
}
