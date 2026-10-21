import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createServer } from "vite";
import { chromium } from "playwright";
let server, browser;
try {
  const html =
    '<html><meta name="viewport" content="width=device-width,initial-scale=1"><body><div id="root"></div><script type="module" src="/scripts/fixtures/loading-policy.tsx"></script></body></html>';
  server = await createServer({
    logLevel: "error",
    server: { host: "127.0.0.1", port: 0, hmr: false },
    plugins: [
      {
        name: "loading-policy-test",
        configureServer(s) {
          s.middlewares.use("/loading-policy", async (req, res) => {
            res.setHeader("Content-Type", "text/html");
            res.end(await s.transformIndexHtml(req.url, html));
          });
        },
      },
    ],
  });
  await server.listen();
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    channel:
      process.env.PLAYWRIGHT_CHANNEL ||
      (process.platform === "darwin" ? "chrome" : undefined),
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.clock.install();
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/loading-policy`,
  );
  await page.getByRole("heading", { name: "Home" }).waitFor();
  await page.getByRole("button", { name: "a", exact: true }).click();
  await page.clock.runFor(10000);
  assert(await page.getByText("Game shell", { exact: true }).isVisible());
  assert.equal(await page.getByRole("status").count(), 0);
  assert.equal(await page.getByRole("alert").count(), 0);
  await page.evaluate(() => window.__loadingPolicy.release());
  await page.getByRole("heading", { name: "Screen A" }).waitFor();
  await page.getByRole("button", { name: "Count 0" }).click();
  await page.getByRole("button", { name: "home", exact: true }).click();
  await page.getByRole("button", { name: "a", exact: true }).click();
  await page.getByRole("heading", { name: "Screen A" }).waitFor();
  assert.equal(
    await page.evaluate(() => window.__loadingPolicy.calls.a),
    1,
    "revisiting a resolved screen must not recreate a lazy import",
  );
  assert(
    await page.getByRole("button", { name: "Count 0" }).isVisible(),
    "a new visit gets fresh component state",
  );
  await page.getByRole("button", { name: "b", exact: true }).click();
  for (let i = 0; i < 6; i++) await page.clock.runFor(4000);
  await page.getByRole("alert").waitFor();
  assert.equal(await page.getByRole("status").count(), 0);
  await page.evaluate(() => (window.__loadingPolicy.failB = false));
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page.getByRole("heading", { name: "Screen B" }).waitFor();
  await page.getByRole("button", { name: "startup", exact: true }).click();
  await page.waitForFunction(() => window.__loadingPolicy.waiting > 0);
  assert.equal(await page.getByRole("alert").count(), 0);
  assert.equal(
    await page.getByRole("button", { name: "Reload", exact: true }).count(),
    0,
  );
  await page.evaluate(() => (window.__loadingPolicy.failStartup = false));
  await page.clock.runFor(6500);
  await page.getByRole("heading", { name: "Startup ready" }).waitFor();
  const app = await fs.readFile("src/App.tsx", "utf8"),
    router = await fs.readFile("src/components/MiniGameRouter.tsx", "utf8");
  assert(!app.includes('fallback={<div className="fixed inset-0 z-50'));
  assert(!router.includes("LOADING…"));
  console.log(
    "PASS: slow navigation keeps the parent shell without loading screens; cached visits do not re-import; fresh component state, lazy-load retry and silent startup recovery remain functional.",
  );
} finally {
  await browser?.close();
  await server?.close();
}
