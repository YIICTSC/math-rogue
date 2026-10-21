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
        name: "hero-unlocks-qa",
        configureServer(s) {
          s.middlewares.use("/unlock-test", async (req, res) => {
            res.setHeader("Content-Type", "text/html");
            res.end(
              await s.transformIndexHtml(
                req.url,
                '<html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root" style="height:100dvh"></div><script type="module" src="/scripts/fixtures/protagonist-unlocks.tsx"></script>',
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
  const page = await browser.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const base = `http://127.0.0.1:${server.httpServer.address().port}/unlock-test`;
  await page.goto(base);
  await page.locator(".student-picker").waitFor();
  for (const [chapter, count] of [
    ["小学生編", 2],
    ["高校生編", 2],
    ["魔法学園編", 4],
  ]) {
    await page.getByRole("button", { name: chapter, exact: true }).click();
    assert.equal(
      await page.locator(".student-hero-grid button:not(:disabled)").count(),
      count,
    );
  }
  await page.evaluate(() => __unlock.adventure.setHero("magic-sakuya"));
  assert.equal(
    await page.evaluate(() => __unlock.adventure.selectedHero.id),
    "elementary-warrior",
  );
  // Compare the shared policy to the actual main-game roster, rather than
  // re-stating the helper's tables in the test (magic female order differs).
  const mismatches = await page.evaluate(async () => {
    const { CHARACTERS } = await import("/src/constants.ts");
    const { getThemedCharacters } = await import("/src/data/visualThemes.ts");
    const { MAGIC_MALE_PROTAGONISTS } = await import(
      "/src/data/magicHeroes.ts"
    );
    const { rpgProtagonist, PROTAGONISTS } = await import(
      "/src/three/protagonistCatalog.ts"
    );
    const { isProtagonistUnlocked } = await import(
      "/src/utils/protagonistUnlocks.ts"
    );
    const failures = [];
    for (let clears = 0; clears <= 9; clears++) {
      localStorage.setItem(
        "pixel_spire_theme_clear_counts_v1",
        JSON.stringify({
          elementary: clears,
          "high-school": clears,
          magic: clears,
        }),
      );
      const expected = new Set();
      for (const theme of ["elementary", "high-school", "magic"])
        getThemedCharacters(CHARACTERS, theme)
          .slice(0, clears + 2)
          .forEach((c) =>
            expected.add(
              rpgProtagonist({
                character: c.id,
                visualTheme: theme,
                magicProtagonistId: c.magicProtagonistId,
              }),
            ),
          );
      MAGIC_MALE_PROTAGONISTS.slice(0, clears + 2).forEach((h) =>
        expected.add("magic-" + h.assetId),
      );
      for (const hero of PROTAGONISTS)
        if (isProtagonistUnlocked(hero.id) !== expected.has(hero.id))
          failures.push({ clears, hero: hero.id });
    }
    localStorage.removeItem("pixel_spire_theme_clear_counts_v1");
    return failures;
  });
  assert.deepEqual(mismatches, []);
  await page.evaluate(() => {
    const b = __unlock.newBase();
    b.selectedHero = "magic-sakuya";
    localStorage.setItem("learning-rogue:school-base:1", JSON.stringify(b));
  });
  await page.reload();
  await page.waitForFunction(
    () => __unlock.adventure.selectedHero.id === "elementary-warrior",
  );
  await page.goto(base + "?kind=survivor");
  await page.locator(".sy-title-copy .sy-primary").click();
  for (const [chapter, count] of [
    ["小学生編", 2],
    ["高校生編", 2],
    ["魔法学園編", 4],
  ]) {
    await page.getByRole("tab", { name: chapter }).click();
    assert.equal(
      await page.locator(".sy-hero-card:not(:disabled)").count(),
      count,
    );
  }
  await page.evaluate(() =>
    localStorage.setItem(
      "pixel_spire_theme_clear_counts_v1",
      JSON.stringify({ elementary: 3, "high-school": 3, magic: 3 }),
    ),
  );
  await page.reload();
  await page.locator(".sy-title-copy .sy-primary").click();
  await page.getByRole("tab", { name: "魔法学園編" }).click();
  assert.equal(await page.locator(".sy-hero-card:not(:disabled)").count(), 10);
  assert.deepEqual(errors, []);
  console.log(
    "PASS unlocks: all 35 heroes match the main game across 0–9 clears and both magic genders; Dungeons/Survivor locks, stale selected hero sanitization, progression refresh.",
  );
} finally {
  await browser?.close();
  await server?.close();
}
