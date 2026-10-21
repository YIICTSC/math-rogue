import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { createServer } from "vite";
import { chromium } from "playwright";
let server, browser;
try {
  await mkdir("tmp/online-touch-qa", { recursive: true });
  server = await createServer({
    logLevel: "error",
    server: { host: "127.0.0.1", port: 0, hmr: false },
    plugins: [
      {
        name: "online-touch-screen-qa",
        enforce: "pre",
        configureServer(s) {
          s.middlewares.use("/online-touch", async (req, res) => {
            res.setHeader("Content-Type", "text/html");
            res.end(
              await s.transformIndexHtml(
                req.url,
                '<html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><div id="root" style="height:100dvh"></div><script type="module" src="/scripts/fixtures/online-touch-screens.tsx"></script></body></html>',
              ),
            );
          });
        },
        transform(source, id) {
          if (id.endsWith("/rpg/RpgOnline.tsx"))
            return source.replace(
              "  const homeRoom=",
              "  (window as any).__rpgTouch={start,room,world,setWorld};\n  const homeRoom=",
            );
          if (id.endsWith("/gakuro-kart/GakuroKart.tsx"))
            return source.replace(
              "  if(!world&&entry==='title')",
              "  (window as any).__kartTouch={setWorld,room,input,stickInput,createRace,addRacer};\n  if(!world&&entry==='title')",
            );
        },
      },
    ],
  });
  await server.listen();
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  const page = await browser.newPage({
      viewport: { width: 844, height: 390 },
      isMobile: true,
      hasTouch: true,
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.setDefaultTimeout(90000);
  const base = `http://127.0.0.1:${server.httpServer.address().port}/online-touch`,
    cdp = await page.context().newCDPSession(page);
  const touch = (type, touchPoints) =>
      cdp.send("Input.dispatchTouchEvent", { type, touchPoints }),
    point = async (locator, id, dx = 0) => {
      const r = await locator.boundingBox();
      return { x: r.x + r.width / 2 + dx, y: r.y + r.height / 2, id };
    };
  await page.goto(base + "?kind=kart");
  await page.waitForFunction(() => window.__kartTouch);
  await page.evaluate(() => {
    const a = __kartTouch,
      w = a.createRace();
    a.addRacer(w, "p0", "Touch player");
    w.phase = "race";
    w.players.p0.item = "nitro";
    a.room.current = {
      selfId: "p0",
      world: w,
      send(command) {
        __onlineSends.push({ ...command });
        if (command.type === "item") {
          w.players.p0.item = null;
          a.setWorld({ ...w });
        }
      },
      close() {},
    };
    a.setWorld(w);
  });
  await page.locator(".gk-controls .gk-item").waitFor();
  let first = await point(page.locator(".gk-stick"), 1, 20),
    second = await point(page.locator(".gk-item"), 2);
  await touch("touchStart", [first]);
  await page.waitForFunction(() =>
    __onlineSends.some((m) => m.type === "input" && m.steer !== 0),
  );
  await touch("touchStart", [first, second]);
  await page.waitForFunction(() =>
    __onlineSends.some((m) => m.type === "item"),
  );
  await touch("touchEnd", [second]);
  assert((await page.evaluate(() => __kartTouch.stickInput.current)) > 0.1);
  assert.equal(
    await page.evaluate(
      () => __onlineSends.filter((m) => m.type === "item").length,
    ),
    1,
  );
  await page.screenshot({ path: "tmp/online-touch-qa/gp.png" });
  await touch("touchEnd", []);
  await page.goto(base + "?kind=vr");
  await page.locator(".gear-battle-actions button").first().waitFor();
  first = await point(page.locator(".gear-bomb-stick"), 1, 20);
  second = await point(page.locator(".gear-battle-actions button").first(), 2);
  await touch("touchStart", [first]);
  await page.waitForFunction(() =>
    __onlineSends.some((m) => Math.abs(m.x) > 0.1),
  );
  await touch("touchStart", [first, second]);
  await page.waitForFunction(() =>
    __onlineSends.some((m) => Math.abs(m.x) > 0.1 && m.shoot),
  );
  await touch("touchEnd", [second]);
  await page.evaluate(() => (__onlineSends.length = 0));
  await page.waitForFunction(() =>
    __onlineSends.some((m) => Math.abs(m.x) > 0.1),
  );
  await page.screenshot({ path: "tmp/online-touch-qa/vr.png" });
  await touch("touchEnd", []);
  await page.goto(base + "?kind=rpg");
  await page.waitForFunction(() => window.__rpgTouch);
  await page.evaluate(async () => {
    await __rpgTouch.start("practice");
    const r = __rpgTouch.room.current;
    const send = r.send.bind(r);
    r.send = (a) => {
      __onlineSends.push({ ...a });
      send(a);
    };
    r.world.started = true;
    r.world.revision++;
    __rpgTouch.setWorld({ ...r.world });
  });
  await page.locator(".rpg-voxel-actions").waitFor();
  await page.locator(".rpg-stick").waitFor();
  first = await point(page.locator(".rpg-stick"), 1, 25);
  second = await point(
    page.getByRole("button", { name: "Jump / Swim up", exact: true }),
    2,
  );
  await page.evaluate(() => (__onlineSends.length = 0));
  await touch("touchStart", [first]);
  await page.waitForFunction(() =>
    __onlineSends.some(
      (a) =>
        (a.type === "move" || a.type === "voxel-move") &&
        Math.abs(a.dx) + Math.abs(a.dy) > 0.01,
    ),
  );
  await touch("touchStart", [first, second]);
  await page.waitForFunction(() =>
    __onlineSends.some((a) => a.type === "voxel-jump"),
  );
  await touch("touchEnd", [second]);
  await page.evaluate(() => (__onlineSends.length = 0));
  await page.waitForFunction(() =>
    __onlineSends.some(
      (a) =>
        (a.type === "move" || a.type === "voxel-move") &&
        Math.abs(a.dx) + Math.abs(a.dy) > 0.01,
    ),
  );
  await page.screenshot({ path: "tmp/online-touch-qa/rpg-jump.png" });
  await touch("touchEnd", []);
  await page.evaluate(() => __rpgTouch.room.current.close());
  assert.deepEqual(errors, []);
  console.log(
    "PASS production screens: GP steering + item with one send; VR movement + attack; RPG movement + jump; releasing the action finger retains movement.",
  );
} finally {
  await browser?.close();
  await server?.close();
}
