import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { createServer } from "vite";
import { chromium } from "playwright";
const shots = "tmp/poker-club-qa";
await mkdir(shots, { recursive: true });
let server, browser;
try {
  server = await createServer({
    logLevel: "error",
    server: { host: "127.0.0.1", port: 0, hmr: false },
    plugins: [
      {
        name: "poker-club-qa",
        enforce: "pre",
        configureServer(s) {
          s.middlewares.use("/poker-test", async (req, res) => {
            res.setHeader("Content-Type", "text/html");
            res.end(
              await s.transformIndexHtml(
                req.url,
                '<html><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><body style="margin:0"><div id="root" style="height:100dvh"></div><script type="module" src="/scripts/fixtures/poker-club.tsx"></script></body></html>',
              ),
            );
          });
        },
        transform(source, id) {
          if (!id.endsWith("/PokerGameScreen.tsx")) return;
          return (
            "import { flushSync as pokerTestFlush } from \'react-dom\';\n" +
            source.replace(
              "  if (phase === 'MATH')",
              "  (window as any).__poker={runState,phase,lobby,expression,setRunState:(v:any)=>pokerTestFlush(()=>setRunState(v)),setPhase:(v:any)=>pokerTestFlush(()=>setPhase(v)),setSelectedCards:(v:any)=>pokerTestFlush(()=>setSelectedCards(v)),initRun:(v:any)=>pokerTestFlush(()=>initRun(v)),startBlind:()=>pokerTestFlush(startBlind),playHand,openPack,selectPackItem,useConsumable,PACK_LIBRARY,CONSUMABLES_LIBRARY,signatureSupporter,saveStateNow,canContinue,handleMathComplete,voices,hydrateState};\n  if (phase === 'MATH')",
            )
          );
        },
      },
    ],
  });
  await server.listen();
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const base = `http://127.0.0.1:${server.httpServer.address().port}/poker-test`,
    errors = [];
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    hasTouch: true,
  });
  page.setDefaultTimeout(90000);
  page.on("pageerror", (e) => { errors.push(e.message); console.error("Poker page error:",e.message); });
  await page.addInitScript(() =>
    localStorage.setItem("pixel_spire_seen_poker_tutorial_v1", "true"),
  );
  await page.clock.install();
  await page.goto(base);
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.locator(".poker-title-art").evaluate((img) => img.decode());
  await page.screenshot({ path: `${shots}/title-desktop.png` });
  await page.getByRole("button", { name: "♠ 新しい放課後" }).click();
  assert.equal(
    await page.locator("[data-hero-choice]:not(:disabled)").count(),
    2,
  );
  assert.equal(await page.locator("[data-hero-choice]:disabled").count(), 7);
  await page.getByRole("button", { name: "マジック編", exact: true }).click();
  assert.equal(
    await page.locator("[data-hero-choice]:not(:disabled)").count(),
    4,
  );
  assert.equal(
    await page.locator('[data-hero-choice="magic-sakuya"]').isDisabled(),
    true,
  );
  await page.getByRole("button", { name: "高校編", exact: true }).click();
  await page.getByRole("button", { name: "相棒と参戦 →" }).click();
  await page.waitForFunction(() => !window.__poker.lobby);
  assert.equal(
    await page.evaluate(() => __poker.runState.supporters[0].id),
    "SIGNATURE_high-school-warrior",
  );
  await page.evaluate(() => __poker.initRun("magic-sakuya"));
  assert.equal(
    await page.evaluate(() => __poker.runState.protagonistId),
    "high-school-warrior",
  );
  await page.evaluate(() => __poker.startBlind());
  await page.evaluate(() => {
    const p = __poker;
    p.setRunState((s) => ({
      ...s,
      currentBlind: { ...s.currentBlind, scoreGoal: 99999 },
      hand: [
        { id: "a1", rank: 14, suit: "HEART", bonusChips: 0, multMultiplier: 1 },
        { id: "a2", rank: 14, suit: "SPADE", bonusChips: 0, multMultiplier: 1 },
      ],
      handsRemaining: 4,
      currentScore: 0,
    }));
    p.setSelectedCards(["a1", "a2"]);
    localStorage.setItem("pixel_spire_seen_poker_tutorial_v1", "true");
  });
  // Tutorial is orthogonal to scoring; exercise the actual action controller.
  await page.evaluate(() => {
    void __poker.playHand();
    void __poker.playHand();
  });
  await page.clock.runFor(700);
  assert.equal(await page.locator(".poker-scoring-card").count(), 2);
  await page.screenshot({ path: `${shots}/scoring-desktop.png` });
  await page.clock.runFor(6500);
  assert.equal(await page.evaluate(() => __poker.runState.currentScore), 192);
  assert.equal(
    await page.evaluate(() => __poker.runState.handsRemaining),
    3,
    "one action despite duplicate calls",
  );
  assert(
    await page.evaluate(() =>
      __pokerAudio.some((v) => v[0] === "playHighSchoolVoiceFile"),
    ),
  );
  assert(
    await page.evaluate(() =>
      __pokerAudio.some(
        (v) => v[0] === "playPokerRivalVoice" && v[2] === "spawn",
      ),
    ),
  );
  await page.evaluate(() => {
    const p = __poker;
    p.setRunState((s) => ({ ...s, handsRemaining: 1 }));
  });
  await page.waitForFunction(() => __poker.expression === "worry");
  assert.equal(
    await page
      .locator(".poker-player-badge .poker-hero-portrait")
      .getAttribute("data-expression"),
    "worry",
  );
  await page.evaluate(() => __poker.saveStateNow());
  await page.reload();
  await page.getByRole("button", { name: "▶ 続きから" }).click();
  assert.equal(
    await page.evaluate(() => typeof __poker.runState.supporters[0].effect),
    "function",
    "signature survives JSON saves",
  );
  assert.equal(await page.evaluate(() => __poker.runState.handsRemaining), 1);
  await page.evaluate(() => {
    __poker.setPhase("SHOP");
    __poker.setRunState((s) => ({
      ...s,
      money: 99,
      shopInventory: [__poker.PACK_LIBRARY[0]],
    }));
  });
  await page.evaluate(() => __poker.openPack(__poker.PACK_LIBRARY[0], 0));
  await page.locator(".poker-sealed-pack").waitFor();
  assert.equal(await page.locator(".poker-pack-choice").count(), 0);
  await page.screenshot({ path: `${shots}/sealed-pack.png` });
  await page.evaluate(() => __poker.saveStateNow());
  const paid = await page.evaluate(() => __poker.runState.money);
  await page.reload();
  await page.getByRole("button", { name: "▶ 続きから" }).click();
  assert.equal(
    await page.evaluate(() => __poker.runState.money),
    paid,
    "resume purchased pack without charging twice",
  );
  await page.locator(".poker-sealed-pack").click();
  await page.clock.runFor(1000);
  assert((await page.locator(".poker-pack-choice").count()) > 0);
  await page.screenshot({ path: `${shots}/revealed-pack.png` });
  await page.locator(".poker-pack-choice").first().click();
  await page.waitForFunction(() => __poker.phase === "SHOP");
  await page.evaluate(() => {
    const c = __poker.CONSUMABLES_LIBRARY.find((c) => c.type === "PLANET");
    __poker.setRunState((s) => ({ ...s, consumables: [c] }));
  });
  await page.evaluate(() =>
    __poker.useConsumable(__poker.runState.consumables[0], 0),
  );
  assert(await page.locator(".poker-use-effect").isVisible());
  await page.clock.runFor(250);
  await page.screenshot({
    path: `${shots}/use-item.png`,
    animations: "disabled",
  });
  // An invalid repeated hand must stay at zero even with a chip supporter.
  await page.evaluate(() => {
    const p = __poker;
    p.initRun("high-school-caretaker");
  });
  await page.evaluate(() => {
    const p = __poker;
    p.setPhase("PLAY");
    p.setRunState((s) => ({
      ...s,
      currentBlind: {
        ...s.currentBlind,
        scoreGoal: 99999,
        bossAbility: "THE_EYE",
      },
      lastHandTypePlayed: "PAIR",
      handsRemaining: 2,
      hand: [
        { id: "b1", rank: 14, suit: "HEART", bonusChips: 0, multMultiplier: 1 },
        { id: "b2", rank: 14, suit: "HEART", bonusChips: 0, multMultiplier: 1 },
      ],
    }));
    p.setSelectedCards(["b1", "b2"]);
  });
  await page.evaluate(() => void __poker.playHand());
  await page.clock.runFor(2500);
  assert.equal(
    await page.evaluate(() => __poker.runState.currentScore),
    0,
    "boss restriction cannot gain signature chips",
  );
  await page.evaluate(() => {
    __poker.initRun("high-school-warrior");
  });
  await page.evaluate(() => {
    const p = __poker;
    p.setPhase("PLAY");
    p.setRunState((s) => ({
      ...s,
      currentBlind: { ...s.currentBlind, scoreGoal: 99999 },
      handsRemaining: 1,
      currentScore: 0,
      hand: [
        { id: "c1", rank: 14, suit: "HEART", bonusChips: 0, multMultiplier: 1 },
        { id: "c2", rank: 14, suit: "SPADE", bonusChips: 0, multMultiplier: 1 },
      ],
    }));
    p.setSelectedCards(["c1", "c2"]);
  });
  await page.evaluate(() => void __poker.playHand());
  await page.clock.runFor(12000);
  assert.equal(await page.evaluate(() => __poker.phase), "GAME_OVER");
  assert.equal(await page.evaluate(() => __poker.expression), "defeat");
  assert(
    await page.evaluate(() =>
      __pokerAudio.some(
        (v) => v[0] === "playPokerRivalVoice" && v[2] === "win",
      ),
    ),
  );
  const records = await page.evaluate(async () => {
    const { storageService } = await import("/src/services/storageService.ts");
    return storageService.getPokerScores();
  });
  assert.equal(
    records[0].bestHandScore,
    320,
    "last hand is included in recorded high score",
  );
  await page.evaluate(() => __poker.initRun("high-school-warrior"));
  await page.evaluate(() => {
    const p = __poker;
    p.setPhase("PLAY");
    p.setRunState((s) => ({
      ...s,
      currentBlind: { ...s.currentBlind, scoreGoal: 100 },
      money: 4,
      handsRemaining: 4,
      hand: [
        { id: "d1", rank: 14, suit: "HEART", bonusChips: 0, multMultiplier: 1 },
        { id: "d2", rank: 14, suit: "SPADE", bonusChips: 0, multMultiplier: 1 },
      ],
    }));
    p.setSelectedCards(["d1", "d2"]);
  });
  await page.evaluate(() => void __poker.playHand());
  await page.clock.runFor(12000);
  assert.equal(await page.evaluate(() => __poker.phase), "MATH");
  assert.equal(
    await page.evaluate(() => __poker.runState.money),
    11,
    "three remaining hands plus four reward points",
  );
  assert(
    await page.evaluate(() =>
      __pokerAudio.some(
        (v) => v[0] === "playPokerRivalVoice" && v[2] === "defeat",
      ),
    ),
  );
  await page.evaluate(() => __poker.handleMathComplete(3));
  await page.waitForFunction(() => __poker.phase === "SHOP");
  assert.equal(
    await page.evaluate(() => __poker.runState.money),
    14,
    "learning reward is retained",
  );
  const beforeVoices = await page.evaluate(
    () => __pokerAudio.filter((v) => v[0] === "playHighSchoolVoiceFile").length,
  );
  await page.evaluate(() => {
    __poker.voices.current.result("rival_lucky_nanami", true);
    __poker.voices.current.stop();
  });
  await page.clock.runFor(10000);
  assert.equal(
    await page.evaluate(
      () =>
        __pokerAudio.filter((v) => v[0] === "playHighSchoolVoiceFile").length,
    ),
    beforeVoices,
    "leaving cancels queued result voice",
  );
  await page.evaluate(() =>
    localStorage.setItem(
      "pixel_spire_theme_clear_counts_v1",
      JSON.stringify({ elementary: 100, "high-school": 100, magic: 100 }),
    ),
  );
  const heroIds = await page.evaluate(async () => {
    const { POKER_HEROES } = await import(
      "/src/mini-games/after-school-poker/heroes.ts"
    );
    return POKER_HEROES.map((h) => h.id);
  });
  assert.equal(heroIds.length, 26);
  for (const id of heroIds) {
    await page.evaluate((id) => __poker.initRun(id), id);
    await page.waitForFunction(
      (id) => __poker.runState.protagonistId === id,
      id,
    );
    assert.equal(
      await page.evaluate(
        () =>
          typeof __poker.hydrateState(
            JSON.parse(JSON.stringify(__poker.runState)),
          ).supporters[0].effect,
      ),
      "function",
    );
  }
  const allFaces = await page.evaluate(async (ids) => {
    const result = [];
    for (const id of ids) {
      const image = new Image();
      image.src = `/sprites/after-school-poker/portraits/${id}.webp`;
      await image.decode();
      result.push(image.width === 1536 && image.height === 205);
    }
    return result;
  }, heroIds);
  assert(allFaces.every(Boolean));
  await page.evaluate(() => {
    const state = {
      ...__poker.runState,
      money: 55,
      phase: "BLIND_SELECT",
      supporters: [],
    };
    delete state.protagonistId;
    __poker.setRunState(state);
    localStorage.setItem("pixel_spire_poker_state_v1", JSON.stringify(state));
  });
  await page.reload();
  await page.getByRole("button", { name: "▶ 続きから" }).click();
  assert.equal(await page.evaluate(() => __poker.runState.money), 55);
  assert.equal(
    await page.evaluate(() => __poker.runState.supporters.length),
    0,
    "legacy saves keep their original inventory",
  );
  // Resume the victory pause after points were applied but before the round
  // reward transition. No extra hand or duplicate payment is needed.
  const wonSnapshot = await page.evaluate(() => ({
    ...__poker.runState,
    phase: "PLAY",
    currentScore: 300,
    currentBlind: { ...__poker.runState.currentBlind, scoreGoal: 300 },
    handsRemaining: 2,
    money: 4,
  }));
  await page.addInitScript((snapshot) => {
    if (sessionStorage.getItem("poker-won-snapshot")) return;
    sessionStorage.setItem("poker-won-snapshot", "1");
    localStorage.setItem(
      "pixel_spire_poker_state_v1",
      JSON.stringify(snapshot),
    );
  }, wonSnapshot);
  await page.reload();
  await page.getByRole("button", { name: "▶ 続きから" }).click();
  await page.waitForFunction(() => __poker.phase === "MATH");
  const resumedMoney = await page.evaluate(() => __poker.runState.money);
  assert.equal(resumedMoney, 10, "saved win awards two remaining hands once");
  await page.clock.runFor(1000);
  assert.equal(await page.evaluate(() => __poker.runState.money), resumedMoney);
  for (const [width, height, lang] of [
    [390, 844, "ja"],
    [320, 640, "en"],
    [844, 390, "ja"],
  ]) {
    const p = await browser.newPage({
      viewport: { width, height },
      isMobile: true,
      hasTouch: true,
    });
    p.on("pageerror", (e) => errors.push(e.message));
    await p.addInitScript(() =>
      localStorage.setItem("pixel_spire_seen_poker_tutorial_v1", "true"),
    );
    await p.goto(`${base}?lang=${lang}`);
    await p.locator(".poker-title-copy").waitFor();
    await p.screenshot({
      animations: "disabled",
      path: `${shots}/title-${width}.png`,
    });
    await p.locator(".poker-title-buttons button").last().click();
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    for (const button of await p
      .locator("[data-hero-choice]:not(:disabled)")
      .all()) {
      assert((await button.boundingBox()).height >= 44);
    }
    await p.screenshot({
      animations: "disabled",
      path: `${shots}/selection-${width}.png`,
      fullPage: true,
    });
    await p.locator(".poker-duo-preview .poker-gold-button").click();
    await p.evaluate(() => __poker.startBlind());
    await p.screenshot({
      animations: "disabled",
      path: `${shots}/table-${width}.png`,
    });
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await p.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS poker: title, progression locks, personal supporter, exact scoring and duplicate latch, expressions, hero/rival calls, save hydration, purchased-pack reload, reveal, item use; desktop/320px/phone/landscape screenshots.",
  );
} finally {
  await browser?.close();
  await server?.close();
}
