import assert from "node:assert/strict";
import { createServer } from "vite";
import { chromium } from "playwright";
let server, browser;
try {
  server = await createServer({
    logLevel: "error",
    server: { host: "127.0.0.1", port: 0, hmr: false },
    plugins: [
      {
        name: "multi-touch-qa",
        configureServer(s) {
          s.middlewares.use("/touch-test", async (req, res) => {
            res.setHeader("Content-Type", "text/html");
            res.end(
              await s.transformIndexHtml(
                req.url,
                '<html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}button{touch-action:none;min-width:64px;min-height:64px}.gk-stick,.gear-bomb-stick,.rpg-stick,.rpg-camera-stick{width:100px;height:100px;position:relative;touch-action:none}.rpg-stick-knob,.rpg-camera-stick i{display:block;position:absolute;inset:30px;pointer-events:none}main{flex-wrap:wrap}</style><div id="root"></div><script type="module" src="/scripts/fixtures/multi-touch-actions.tsx"></script>',
              ),
            );
          });
        },
      },
    ],
  });
  await server.listen();
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
      viewport: { width: 800, height: 600 },
      isMobile: true,
      hasTouch: true,
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const cdp = await page.context().newCDPSession(page),
    base = `http://127.0.0.1:${server.httpServer.address().port}/touch-test`;
  const touch = (type, touchPoints) =>
    cdp.send("Input.dispatchTouchEvent", { type, touchPoints });
  const point = async (locator, id, dx = 0) => {
    const b = await locator.boundingBox();
    return { x: b.x + b.width / 2 + dx, y: b.y + b.height / 2, id };
  };
  await page.goto(base + "?kind=kart");
  await page.locator(".gk-stick").waitFor();
  let first = await point(page.locator(".gk-stick"), 1, 25),
    second = await point(
      page.getByRole("button", { name: "ITEM", exact: true }),
      2,
    ),
    third = await point(
      page.getByRole("button", { name: "DRIFT", exact: true }),
      3,
    );
  await touch("touchStart", [first]);
  await page.waitForFunction(() => __touch.x > 0.2);
  await touch("touchStart", [first, second]);
  await page.waitForFunction(() => __touch.item === 1);
  assert((await page.evaluate(() => __touch.x)) > 0.2);
  await page.waitForTimeout(950);
  await touch("touchEnd", [second]);
  await page.getByRole("button",{name:"ITEM",exact:true}).dispatchEvent("click",{detail:1});
  await page.waitForTimeout(50);
  assert.equal(
    await page.evaluate(() => __touch.item),
    1,
    "no synthetic duplicate",
  );
  await touch("touchStart", [first, third]);
  await page.waitForFunction(() => __touch.drift && __touch.x > 0.2);
  await touch("touchEnd", [third]);
  await page.waitForFunction(() => !__touch.drift && __touch.x > 0.2);
  await touch("touchEnd", []);
  await page.waitForFunction(() => __touch.x === 0);
  await page.getByRole("button", { name: "ITEM", exact: true }).focus();
  await page.keyboard.press("Enter");
  assert.equal(
    await page.evaluate(() => __touch.item),
    2,
    "keyboard remains usable after touch",
  );
  await page.getByRole("button", { name: "ITEM", exact: true }).click();
  assert.equal(
    await page.evaluate(() => __touch.item),
    3,
    "a real mouse click is not a compatibility touch click",
  );
  await touch("touchStart", [first, third]);
  await page.waitForFunction(() => __touch.drift);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.waitForFunction(() => !__touch.drift);
  await touch("touchEnd", []);
  await touch("touchStart", [first, third]);
  await page.waitForFunction(() => __touch.drift);
  await touch("touchEnd", [third]);
  await page.waitForFunction(() => !__touch.drift);
  await touch("touchEnd", []);
  await page.goto(base + "?kind=vr");
  await page.locator(".gear-bomb-stick").waitFor();
  first = await point(page.locator(".gear-bomb-stick"), 1, 25);
  second = await point(page.getByRole("button", { name: /Attack/ }), 2);
  await touch("touchStart", [first]);
  await page.waitForFunction(() => __touch.x > 0.1);
  await touch("touchStart", [first, second]);
  await page.waitForFunction(() => __touch.shoot && __touch.x > 0.1);
  await touch("touchEnd", [second]);
  assert((await page.evaluate(() => __touch.x)) > 0.1);
  await touch("touchEnd", []);
  await page.waitForFunction(() => __touch.x === 0);
  await page.goto(base + "?kind=rpg");
  await page.locator(".rpg-stick").waitFor();
  first = await point(page.locator(".rpg-stick"), 1, 25);
  second = await point(page.locator(".rpg-camera-stick"), 2, 25);
  await touch("touchStart", [first]);
  await page.waitForFunction(() => __touch.moves > 1);
  await touch("touchStart", [first, second]);
  await page.waitForFunction(() => __touch.look > 2);
  const before = await page.evaluate(() => __touch.moves);
  await touch("touchEnd", [second]);
  await page.waitForTimeout(250);
  assert(
    (await page.evaluate(() => __touch.moves)) > before,
    "movement continues after camera finger release",
  );
  await touch("touchEnd", []);
  await page.goto(base + "?kind=golf");
  await page.locator(".gg-meter-actions button").waitFor();
  first = await point(page.locator("#aim"), 1);
  second = await point(page.locator(".gg-meter-actions button"), 2);
  await touch("touchStart", [first]);
  await touch("touchStart", [first, second]);
  await page.waitForFunction(() => __touch.active);
  await touch("touchEnd", [second]);
  await page.waitForTimeout(500);
  await touch("touchStart", [first, second]);
  await page.waitForFunction(() => __touch.power > 0);
  await touch("touchEnd", []);
  assert.equal(await page.evaluate(() => __touch.result), 0);
  assert.deepEqual(errors, []);
  console.log(
    "PASS real CDP multi-touch: GP steer+item/drift; VR move+attack; RPG movement+camera with independent releases; Golf aim-held second-finger start/lock.",
  );
} finally {
  await browser?.close();
  await server?.close();
}
