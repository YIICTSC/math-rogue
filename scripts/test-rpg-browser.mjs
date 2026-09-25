import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { createServer } from "vite";
import { chromium } from "playwright";

// Test fixture is injected by this server only; no debug endpoint ships with the game.
process.env.VITE_RPG_PEER_HOST = "127.0.0.1";
process.env.VITE_RPG_PEER_PORT = "9000";
process.env.VITE_RPG_PEER_PATH = "/rpg";
process.env.VITE_RPG_PEER_SECURE = "false";
const fixture = `import React from 'react';import{createRoot}from'react-dom/client';import RpgOnline from '/src/rpg/RpgOnline.tsx';import{RpgRoom}from'/src/rpg/network.ts';import*as engine from'/src/rpg/engine.ts';window.engine=engine;window.RpgRoom=RpgRoom;for(const key of ['practice','create','join']){const original=RpgRoom.prototype[key];RpgRoom.prototype[key]=function(...args){window.room=this;return original.apply(this,args)}}createRoot(document.getElementById('root')).render(<RpgOnline onClose={()=>{}}/>);`;
const server = await createServer({
  cacheDir: 'node_modules/.vite-rpg-test',
  server: { host: "127.0.0.1", port: 5192, strictPort: true },
  plugins: [
    {
      name: "rpg-test-fixture",
      resolveId(id) {
        if (id === "/__rpg_fixture.tsx") return id;
      },
      load(id) {
        if (id === "/__rpg_fixture.tsx") return fixture;
      },
      configureServer(s) {
        s.middlewares.use("/__rpg_test", async (req, res) => {
          res.setHeader("Content-Type", "text/html");
          res.end(
            await s.transformIndexHtml(
              "/__rpg_test",
              '<!doctype html><html lang="ja"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><div id="root"></div><script type="module" src="/__rpg_fixture.tsx"></script></body></html>',
            ),
          );
        });
      },
    },
  ],
});
await server.listen();
const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  await mkdir("tmp/rpg-qa", { recursive: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 960 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5192/__rpg_test");
  await page.getByRole("button", { name: "まずはひとりで練習する" }).click();
  await page.getByRole("heading", { name: "木漏れ日の町" }).waitFor();
  await page.screenshot({ path: "tmp/rpg-qa/exploration-desktop.png" });
  await page.getByRole("button", { name: "町 木漏れ日の町 E 調べる" }).click();
  await page.getByRole("button", { name: "休憩してHPを全回復 無料" }).click();
  await page.getByRole("button", { name: "強化", exact: true }).first().click();
  assert.equal(
    await page.evaluate(() => window.room.world.players.local.gold),
    0,
  );
  await page.getByRole("button", { name: "閉じる", exact: true }).click();
  const before = await page.evaluate(() => window.room.world.players.local.x);
  await page.keyboard.press("ArrowRight");
  assert.equal(
    await page.evaluate(() => window.room.world.players.local.x),
    before + 1,
  );
  await page.getByRole("button", { name: "デッキを見る" }).click();
  await page.getByRole("dialog", { name: "あなたのデッキ" }).waitFor();
  await page.getByRole("button", { name: "閉じる", exact: true }).click();
  // Place the player at a generated enemy through fixture-only test control.
  await page.evaluate(() => {
    const w = window.room.world,
      p = w.players.local,
      s = w.sites.find((s) => s.kind === "enemy");
    p.x = s.x;
    p.y = s.y;
    window.room.send({ type: "interact", siteId: s.id });
  });
  await page.getByRole("dialog", { name: "カード戦闘" }).waitFor();
  await page.screenshot({ path: "tmp/rpg-qa/learning-battle.png" });
  const answer = await page.evaluate(
    () => window.room.world.players.local.battle.quiz.answer,
  );
  await page.locator(".rpg-quiz button").nth(answer).click();
  await page.locator(".rpg-card").first().waitFor();
  await page.screenshot({ path: "tmp/rpg-qa/card-battle.png" });
  await page.getByRole("button", { name: "ターン終了" }).click();
  await page.getByRole("button", { name: "離脱（HP −5）" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "tmp/rpg-qa/exploration-mobile.png" });
  assert.equal(
    await page.evaluate(
      () => document.querySelector(".rpg-root").scrollWidth <= 390,
    ),
    true,
    "mobile has no horizontal overflow",
  );
  await page.getByRole("button", { name: "部屋を退出" }).click();
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.screenshot({ path: "tmp/rpg-qa/lobby.png" });
  // Real PeerJS/WebRTC connections: a host plus 39 clients. Signaling is local.
  await page.evaluate(async () => {
    window.testErrors = [];
    window.snapshots = {};
    window.rooms = [];
    const host = new window.RpgRoom(
      (w) => (window.snapshots.host = w),
      (m) => window.testErrors.push(m),
    );
    window.host = host;
    window.rooms.push(host);
    await host.create("ホスト", "math");
    for (let batch = 0; batch < 13; batch++)
      await Promise.all(
        Array.from({ length: 3 }, async (_, j) => {
          const i = batch * 3 + j;
          const room = new window.RpgRoom(
            (w) => (window.snapshots[i] = w),
            (m) => window.testErrors.push(m),
          );
          window.rooms.push(room);
          await room.join(host.code, `参加者${i + 1}`);
        }),
      );
  });
  await page.waitForFunction(
    () => Object.keys(window.snapshots[38]?.players || {}).length === 40,
    null,
    { timeout: 15000 },
  );
  const network = await page.evaluate(async () => {
    const host = window.host,
      client = window.rooms[1],
      id = client.selfId;
    client.send({ type: "team", target: id });
    client.send({ type: "move", dx: 1, dy: 0 });
    await new Promise((r) => setTimeout(r, 800));
    return {
      hostCount: Object.keys(host.world.players).length,
      clientCount: Object.keys(window.snapshots[38].players).length,
      team: host.world.players[id].team,
      id,
      errors: window.testErrors,
    };
  });
  assert.equal(network.hostCount, 40);
  assert.equal(network.clientCount, 40);
  assert.equal(network.team, network.id);
  assert.deepEqual(network.errors, []);
  const overflow = await page.evaluate(async () => {
    const r = new window.RpgRoom(
      () => {},
      () => {},
    );
    try {
      await r.join(window.host.code, "41人目");
      return false;
    } catch {
      return true;
    } finally {
      r.close();
    }
  });
  assert.equal(overflow, true, "41st real connection rejected");
  await page.evaluate(() => window.rooms[1].close());
  await page.waitForFunction(
    () => Object.keys(window.host.world.players).length === 39,
  );
  await page.evaluate(() => window.rooms.forEach((r) => r.close()));
  assert.deepEqual(errors, [], "no browser runtime errors");
  console.log(
    "RPG browser: desktop/mobile, town, movement, deck, quiz/cards, 40 real WebRTC clients, capacity and disconnect checks passed.",
  );
} finally {
  await browser.close();
  await server.close();
}
