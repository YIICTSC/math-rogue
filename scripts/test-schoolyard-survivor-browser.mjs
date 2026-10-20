import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { createServer } from "vite";
import { chromium } from "playwright";
const shots = "tmp/schoolyard-survivor";
await mkdir(shots, { recursive: true });
let server, browser;
const html =
  '<html><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><body style="margin:0"><div id="root" style="height:100dvh"></div><script type="module" src="/scripts/fixtures/schoolyard-survivor.tsx"></script></body></html>';
try {
  server = await createServer({
    logLevel: "error",
    server: { host: "127.0.0.1", port: 0, hmr: false },
    plugins: [
      {
        name: "survivor-playtest",
        enforce: "pre",
        configureServer(s) {
          s.middlewares.use("/survivor-test", async (req, res) => {
            res.setHeader("Content-Type", "text/html");
            res.end(await s.transformIndexHtml(req.url, html));
          });
        },
        transform(source, id) {
          if (!id.endsWith("/SchoolyardSurvivorScreen.tsx")) return;
          return source
            .replace(/\r\n/g, "\n")
            .replace(
              "    return (\n        <div data-gamepad-survivor-live=",
              `    (window as any).__survivor={gameState,player,enemies,projectiles,enemyBullets,gems,particles,magicFx,hazards,action,time,frameCount,xp,nextLevelXp,level,score,weaponsRef,passivesRef,selectedHero,selectedField,obstacles,keys,activeTimeouts,scheduleShot,update,draw,spawnEnemy,activateDash,activateBurst,applyDamage,fireWeapon,damagePlayer,handleMathComplete,selectUpgrade,clearInput,handleRestart,spriteCache};\n    return (\n        <div data-gamepad-survivor-live=`,
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
  const base = `http://127.0.0.1:${server.httpServer.address().port}/survivor-test`;
  const errors = [];
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && /loop error/.test(m.text()))
      errors.push(m.text());
  });
  await page.clock.install();
  await page.goto(base);
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.waitForFunction(
    () =>
      window.__survivor &&
      Object.keys(window.__survivor.spriteCache.current).length > 100,
  );
  assert.equal(
    await page.evaluate(() => window.__survivor.frameCount.current),
    0,
    "the title must not start a hidden run",
  );
  await page.screenshot({ path: `${shots}/title-desktop.png` });
  await page.getByRole("button", { name: "出撃準備", exact: true }).click();
  for (const [chapter, count] of [
    ["小学生編", 9],
    ["高校生編", 9],
    ["魔法学園編", 17],
  ]) {
    await page.getByRole("tab", { name: chapter }).click();
    assert.equal(await page.locator(".sy-hero-card").count(), count);
  }
  const sprites = await page.evaluate(async () => {
    const { HEROES } = await import(
      "/src/mini-games/schoolyard-survivor/world.ts"
    );
    const out = [];
    for (const h of HEROES) {
      const im = new Image();
      im.src = `/sprites/wandering-student/${h.id}.webp`;
      await im.decode();
      out.push(im.width === 512 && im.height === 256);
    }
    return out;
  });
  assert.equal(sprites.length, 35);
  assert(sprites.every(Boolean));
  await page.getByRole("button", { name: "九条 朔夜", exact: true }).click();
  await page.getByRole("button", { name: /04.*星渡りの庭/ }).click();
  await page.screenshot({ path: `${shots}/selection-desktop.png` });
  await page.getByRole("button", { name: "出撃する", exact: true }).click();
  await page.clock.runFor(50);
  assert.equal(
    await page.evaluate(() => window.__survivor.selectedHero.current.id),
    "magic-sakuya",
  );
  assert.equal(
    await page.evaluate(() => window.__survivor.selectedField.current.id),
    "astral",
  );
  assert(
    await page.evaluate(
      () =>
        window.__survivor.weaponsRef.current[
          window.__survivor.selectedHero.current.starter
        ]?.level === 2,
    ),
  );
  const y = await page.evaluate(() => window.__survivor.player.current.y);
  await page.keyboard.down("w");
  await page.clock.runFor(500);
  await page.keyboard.up("w");
  assert(
    (await page.evaluate(() => window.__survivor.player.current.y)) < y - 50,
  );
  await page.keyboard.press("Shift");
  await page.clock.runFor(100);
  assert(
    (await page.evaluate(() => window.__survivor.action.current.dash)) > 0,
  );
  await page.keyboard.press("Escape");
  const before = await page.evaluate(
    () => window.__survivor.frameCount.current,
  );
  await page.clock.runFor(2000);
  assert.equal(
    await page.evaluate(() => window.__survivor.frameCount.current),
    before,
  );
  await page.getByRole("button", { name: "続ける", exact: true }).click();
  await page.evaluate(() => {
    const g = window.__survivor;
    g.player.current.hp = g.player.current.maxHp = 5000;
    g.nextLevelXp.current = 100000;
    for (let i = 0; i < 40; i++) {
      g.spawnEnemy("ENEMY_17");
      const e = g.enemies.current.at(-1);
      g.applyDamage(e, {
        damage: 9999,
        knockback: 0,
        scale: 1,
        type: "PENCIL",
        hitIds: [],
        x: e.x,
        y: e.y,
      });
    }
  });
  await page.clock.runFor(200);
  assert.equal(
    await page.evaluate(() => window.__survivor.action.current.burst),
    100,
  );
  await page.getByRole("button", { name: "バースト", exact: true }).click();
  assert(
    (await page.evaluate(() => window.__survivor.action.current.burstTime)) >=
      145,
  );
  assert.equal(
    await page.evaluate(() => window.__survivor.enemyBullets.current.length),
    0,
  );
  const cutinHeroes = await page.evaluate(async () => {
    const { HEROES } = await import(
      "/src/mini-games/schoolyard-survivor/world.ts"
    );
    return HEROES;
  });
  for (const hero of cutinHeroes) {
    await page.evaluate((hero) => {
      const g = window.__survivor;
      g.selectedHero.current = hero;
      g.enemies.current = [];
      g.gems.current = [];
      g.action.current.burst = 100;
      g.activateBurst();
    }, hero);
    const portrait = page.locator(
      `.sy-burst-cutin [data-cutin-hero="${hero.id}"] img`,
    );
    await portrait.waitFor();
    await portrait.evaluate((img) => img.decode());
    assert(
      (await portrait.getAttribute("src")).includes(`${hero.id}-skill-1.webp`),
    );
    if (
      ["elementary-warrior", "high-school-warrior", "magic-akari"].includes(
        hero.id,
      )
    ) {
      await page.clock.runFor(300);
      await page.screenshot({ path: `${shots}/burst-cutin-${hero.id}.png` });
    }
  }
  await page.keyboard.press("Escape");
  await page.clock.runFor(2000);
  assert.equal(
    await page.locator(".sy-burst-cutin").getAttribute("data-paused"),
    "true",
  );
  await page.getByRole("button", { name: "続ける", exact: true }).click();
  await page.clock.runFor(1400);
  assert.equal(
    await page.locator(".sy-burst-cutin").count(),
    0,
    "the cut-in ends after its simulation duration and freezes during pause",
  );
  await page.evaluate(async () => {
    const { HEROES } = await import(
      "/src/mini-games/schoolyard-survivor/world.ts"
    );
    window.__survivor.selectedHero.current = HEROES.find(
      (h) => h.id === "magic-sakuya",
    );
  });
  await page.evaluate(() => {
    const g = window.__survivor;
    g.time.current = 70;
    g.frameCount.current = 4200;
    g.action.current.wave = 3;
    g.action.current.banner = 0;
    g.player.current.x = g.player.current.y = 1000;
    g.action.current.burst = 100;
    g.action.current.burstTime = 0;
    for (const key of [
      "PENCIL",
      "RULER",
      "FLASK",
      "ERASER",
      "PRISM",
      "RECORDER",
      "HIGHLIGHTER",
      "BASKETBALL",
    ])
      g.weaponsRef.current[key] = { level: 6, cooldownTimer: 0 };
    g.passivesRef.current.ABACUS = 2;
    for (let i = 0; i < 100; i++) {
      g.spawnEnemy(
        ["ENEMY_17", "ENEMY_18", "ENEMY_19", "ENEMY_20", "ENEMY_21"][i % 5],
      );
      const e = g.enemies.current.at(-1),
        a = i * 2.399;
      e.x = 1000 + Math.cos(a) * (160 + i * 2);
      e.y = 1000 + Math.sin(a) * (160 + i * 2);
    }
    for (let i = 0; i < 80; i++) g.update();
    g.draw();
  });
  await page.clock.runFor(30);
  await page.screenshot({ path: `${shots}/combat-desktop.png` });
  assert(
    await page.evaluate(
      () =>
        window.__survivor.particles.current.length <= 400 &&
        window.__survivor.projectiles.current.length <= 450 &&
        window.__survivor.enemies.current.length <= 180,
    ),
  );
  await page.evaluate(() => {
    const g = window.__survivor;
    g.time.current = 89;
    g.frameCount.current = 5399;
    g.update();
    for (let i = 0; i < 10; i++) g.update();
    g.draw();
  });
  await page.clock.runFor(30);
  assert(
    await page.evaluate(() =>
      window.__survivor.enemies.current.some((e) => e.boss),
    ),
  );
  await page.screenshot({ path: `${shots}/boss-desktop.png` });
  // Learning still interrupts combat, then offers the real upgrade cards.
  await page.evaluate(() => {
    const g = window.__survivor;
    g.enemies.current = [];
    g.enemyBullets.current = [];
    g.xp.current = 9;
    g.nextLevelXp.current = 10;
    g.gems.current = [
      {
        id: 1,
        x: g.player.current.x,
        y: g.player.current.y,
        value: 1,
        collected: false,
      },
    ];
    g.update();
  });
  await page.clock.runFor(30);
  assert.equal(
    await page.evaluate(() => window.__survivor.gameState.current),
    "MATH_CHALLENGE",
  );
  const mathFrame = await page.evaluate(
    () => window.__survivor.frameCount.current,
  );
  await page.clock.runFor(500);
  assert.equal(
    await page.evaluate(() => window.__survivor.frameCount.current),
    mathFrame,
  );
  await page.evaluate(() => window.__survivor.handleMathComplete(3));
  await page.clock.runFor(30);
  await page.getByRole("heading", { name: "LEVEL UP!" }).waitFor();
  await page.screenshot({ path: `${shots}/level-up.png` });
  await page
    .locator('[data-gamepad-initial-scope^="survivor-level-up"] button')
    .first()
    .click();
  await page.evaluate(() => {
    const g = window.__survivor;
    g.time.current = 299;
    g.frameCount.current = 17999;
    g.update();
    const boss = g.enemies.current.find((e) => e.finalBoss);
    if (!boss) throw Error("Final boss not spawned");
    g.applyDamage(boss, {
      damage: 99999,
      scale: 1,
      type: "PENCIL",
      knockback: 0,
      hitIds: [],
      x: boss.x,
      y: boss.y,
    });
  });
  await page.clock.runFor(30);
  await page.getByRole("heading", { name: "STAGE CLEAR!" }).waitFor();
  await page.screenshot({ path: `${shots}/victory.png` });
  await page.getByRole("button", { name: "もう一度選ぶ", exact: true }).click();
  await page.getByRole("button", { name: "出撃準備", exact: true }).click();
  await page.getByRole("button", { name: "出撃する", exact: true }).click();
  assert.equal(await page.evaluate(() => window.__survivor.time.current), 0);
  assert.equal(
    await page.evaluate(() => window.__survivor.action.current.kills),
    0,
  );
  await page.evaluate(() => {
    const g = window.__survivor;
    g.player.current.flashTime = 0;
    g.damagePlayer(9999, 0, 0, 0);
  });
  await page.clock.runFor(30);
  await page.getByRole("heading", { name: "GAME OVER" }).waitFor();
  // Survivor routes combat voices through the selected Dungeons hero and shared audio settings.
  await page.getByRole("button", { name: "もう一度選ぶ", exact: true }).click();
  await page.getByRole("button", { name: "出撃準備", exact: true }).click();
  await page.getByRole("button", { name: "出撃する", exact: true }).click();
  await page.evaluate(async () => {
    const { audioService: a } = await import("/src/services/audioService.ts");
    window.__voiceCalls = [];
    a.canPlayConversationVoice = () => true;
    for (const method of ["playHighSchoolVoiceFile", "playMagicVoiceFile"])
      a[method] = (...args) => {
        window.__voiceCalls.push([method, ...args]);
        return Promise.resolve(true);
      };
  });
  const voiceHeroes = cutinHeroes.filter((h) => h.chapter > 0);
  for (const hero of voiceHeroes) {
    await page.evaluate((hero) => {
      const g = window.__survivor;
      g.selectedHero.current = hero;
      g.handleRestart();
      g.action.current.burst = 100;
      g.activateBurst();
    }, hero);
    const call = await page.evaluate(() => window.__voiceCalls.at(-1));
    assert.equal(
      call[0],
      hero.chapter === 1 ? "playHighSchoolVoiceFile" : "playMagicVoiceFile",
    );
    assert.equal(
      call[1],
      hero.id.replace(/^(high-school|magic)-/, "").toUpperCase(),
    );
    assert.match(
      call[2],
      hero.chapter === 1 ? /^power-[1-5]$/ : /^spell-[1-3]$/,
    );
  }
  const decoded = await page.evaluate(async () => {
    const ctx = new AudioContext();
    try {
      return await Promise.all(
        [
          "high-school-voices/WARRIOR/attack-1.ogg",
          "high-school-voices/WARRIOR/power-1.ogg",
          "magic-voices/AKARI/attack-1.ogg",
          "magic-voices/AKARI/spell-1.ogg",
        ].map(async (path) => {
          const r = await fetch("/sfx/" + path);
          if (!r.ok) throw Error(path);
          return (await ctx.decodeAudioData(await r.arrayBuffer())).duration;
        }),
      );
    } finally {
      await ctx.close();
    }
  });
  assert(decoded.every((n) => n > 0));
  const realVoices = await page.evaluate(async () => {
    const { audioService: a } = await import("/src/services/audioService.ts"),
      p = Object.getPrototypeOf(a);
    const high = await p.playHighSchoolVoiceFile.call(a, "WARRIOR", "power-1");
    p.stopSchoolHeroVoices.call(a);
    const magic = await p.playMagicVoiceFile.call(a, "AKARI", "spell-1");
    p.stopSchoolHeroVoices.call(a);
    return [high, magic];
  });
  assert.deepEqual(realVoices, [true, true]);
  await page.evaluate(() => {
    const g = window.__survivor;
    g.action.current.dashTime = 0;
    g.action.current.burstTime = 0;
    g.player.current.flashTime = 0;
    g.damagePlayer(99999, 0, 0, 0);
  });
  await page.clock.runFor(30);
  // Actual controller hook: A and X must never click the focused pause/menu control during battle.
  await page.getByRole("button", { name: "もう一度選ぶ", exact: true }).click();
  await page.getByRole("button", { name: "出撃準備", exact: true }).click();
  await page.getByRole("button", { name: "出撃する", exact: true }).click();
  await page.evaluate(() => {
    const buttons = Array.from({ length: 17 }, () => ({
      pressed: false,
      touched: false,
      value: 0,
    }));
    window.__pad = {
      id: "Xbox test pad",
      index: 0,
      connected: true,
      mapping: "standard",
      axes: [0.72, 0, 0, 0],
      buttons,
      timestamp: 0,
    };
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [window.__pad],
    });
  });
  await page.clock.runFor(150);
  const padX = await page.evaluate(() => window.__survivor.player.current.x);
  await page.clock.runFor(150);
  assert(
    (await page.evaluate(() => window.__survivor.player.current.x)) > padX,
  );
  await page.locator(".sy-pause").focus();
  await page.evaluate(() => {
    window.__pad.axes = [0, 0, 0, 0];
    window.__pad.buttons[0].pressed = true;
  });
  await page.clock.runFor(50);
  assert.equal(
    await page.evaluate(() => window.__survivor.gameState.current),
    "PLAYING",
  );
  assert(
    (await page.evaluate(() => window.__survivor.action.current.dash)) > 0,
  );
  await page.evaluate(() => {
    window.__pad.buttons[0].pressed = false;
    window.__pad.buttons[2].pressed = true;
    window.__survivor.action.current.burst = 100;
  });
  await page.clock.runFor(50);
  assert(
    (await page.evaluate(() => window.__survivor.action.current.burstTime)) > 0,
  );
  assert.equal(
    await page.evaluate(() => window.__survivor.gameState.current),
    "PLAYING",
  );
  await page.evaluate(() => {
    window.__pad.buttons[2].pressed = false;
    window.__pad.buttons[9].pressed = true;
  });
  await page.clock.runFor(50);
  assert.equal(
    await page.evaluate(() => window.__survivor.gameState.current),
    "PAUSED",
  );
  await page.evaluate(() => {
    window.__pad.buttons[9].pressed = false;
    window.__pad.connected = false;
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [],
    });
  });
  await page.getByRole("button", { name: "続ける", exact: true }).click();
  await page.evaluate(() => {
    window.__survivor.player.current.flashTime = 0;
    window.__survivor.action.current.burstTime = 0;
    window.__survivor.action.current.dashTime = 0;
    window.__survivor.damagePlayer(99999, 0, 0, 0);
  });
  await page.clock.runFor(30);
  // Pause freezes scheduled volleys as well as movement.
  await page.getByRole("button", { name: "もう一度選ぶ", exact: true }).click();
  await page.getByRole("button", { name: "出撃準備", exact: true }).click();
  await page.getByRole("button", { name: "出撃する", exact: true }).click();
  await page.evaluate(() => {
    window.__shots = 0;
    window.__survivor.scheduleShot(() => window.__shots++, 500);
  });
  await page.keyboard.press("Escape");
  await page.clock.runFor(1000);
  assert.equal(await page.evaluate(() => window.__shots), 0);
  await page.getByRole("button", { name: "続ける", exact: true }).click();
  await page.clock.runFor(600);
  assert.equal(await page.evaluate(() => window.__shots), 1);
  await page.close();
  // Every field boots with its actual collision geometry, monsters and baked floor.
  for (const [n, id] of [
    "schoolyard",
    "rooftop",
    "laboratory",
    "astral",
  ].entries()) {
    const p = await browser.newPage({ viewport: { width: 1000, height: 700 } });
    p.on("pageerror", (e) => errors.push(e.message));
    await p.clock.install();
    await p.goto(base);
    await p.locator(".sy-title-copy .sy-primary").click();
    await p.locator(".sy-fields button").nth(n).click();
    await p.locator(".sy-selection-content footer .sy-primary").click();
    await p.waitForFunction(
      () => window.__survivor.spriteCache.current.ENEMY_22,
    );
    assert.equal(
      await p.evaluate(() => window.__survivor.selectedField.current.id),
      id,
    );
    await p.evaluate(() => {
      const g = window.__survivor;
      for (let i = 0; i < 12; i++)
        g.spawnEnemy(g.selectedField.current.enemies[i % 3]);
      for (let i = 0; i < 160; i++) g.update();
      g.draw();
    });
    await p.clock.runFor(40);
    await p.screenshot({ path: `${shots}/field-${id}.png` });
    if (n === 0) {
      const result = await p.evaluate(async () => {
        const { audioService } = await import("/src/services/audioService.ts");
        audioService.playSound = () => {};
        const g = window.__survivor;
        g.player.current.hp = g.player.current.maxHp = 100000;
        g.nextLevelXp.current = 100000;
        g.gameState.current = "PLAYING";
        g.clearInput();
        g.enemies.current = [];
        g.gems.current = [];
        const start = performance.now();
        for (let i = 0; i < 18200; i++) {
          g.keys.current = {
            [["KeyD", "KeyS", "KeyA", "KeyW"][Math.floor(i / 120) % 4]]: true,
          };
          if (g.action.current.burst >= 100) g.activateBurst();
          g.update();
          if (g.gameState.current === "GAME_OVER") break;
        }
        return {
          time: g.time.current,
          frames: g.frameCount.current,
          enemies: g.enemies.current.length,
          projectiles: g.projectiles.current.length,
          particles: g.particles.current.length,
          ms: performance.now() - start,
          boss: g.enemies.current.some((e) => e.finalBoss),
          victory: g.action.current.victory,
        };
      });
      console.log("Five-minute simulation soak:", result);
      assert(result.time >= 300);
      assert(result.boss || result.victory);
      assert(
        result.enemies <= 180 &&
          result.projectiles <= 450 &&
          result.particles <= 400,
      );
    }
    await p.close();
  }
  for (const [width, height, lang] of [
    [390, 844, "ja"],
    [844, 390, "en"],
  ]) {
    const p = await browser.newPage({
      viewport: { width, height },
      isMobile: true,
      hasTouch: true,
    });
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(`${base}?lang=${lang}`);
    await p.getByRole("heading", { level: 1 }).waitFor();
    await p.screenshot({ path: `${shots}/title-${width}.png` });
    await p.locator(".sy-title-copy .sy-primary").click();
    await p.screenshot({ path: `${shots}/selection-${width}.png` });
    if (width === 390) {
      await p.getByRole("tab", { name: "魔法学園編" }).click();
      const box = await p.locator(".sy-hero-grid").boundingBox();
      const cdp = await p.context().newCDPSession(p),
        x = box.x + box.width / 2,
        y = box.y + box.height - 30;
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y, id: 11 }],
      });
      for (let i = 1; i <= 8; i++) {
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x, y: y - i * 22, id: 11 }],
        });
        await p.waitForTimeout(20);
      }
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await p.waitForTimeout(250);
      assert(
        (await p.locator(".sy-hero-grid").evaluate((el) => el.scrollTop)) > 10,
        "the hero roster must scroll with a real finger gesture",
      );
      await p.getByRole("tab", { name: "小学生編" }).click();
    }
    const start = p.locator(".sy-selection-content footer .sy-primary");
    await start.scrollIntoViewIfNeeded();
    await start.click();
    await p.waitForTimeout(250);
    assert(await p.locator(".sy-actions button").first().isVisible());
    const overflow = await p.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    assert.equal(overflow, false);
    await p.screenshot({ path: `${shots}/combat-${width}.png` });
    await p.evaluate(() => {
      window.__survivor.action.current.burst = 100;
      window.__survivor.activateBurst();
    });
    await p.locator(".sy-burst-cutin img").evaluate((img) => img.decode());
    await p.waitForTimeout(250);
    await p.screenshot({ path: `${shots}/burst-cutin-${width}.png` });
    assert(await p.locator(".sy-actions button").first().isVisible());
    const before = await p.evaluate(() => window.__survivor.player.current.x);
    await p.dispatchEvent("canvas", "touchstart", {
      touches: [{ identifier: 1, clientX: 100, clientY: height - 100 }],
    });
    await p.dispatchEvent("canvas", "touchmove", {
      touches: [{ identifier: 1, clientX: 160, clientY: height - 100 }],
    });
    await p.waitForTimeout(250);
    const moving = await p.evaluate(() => window.__survivor.player.current.x);
    await p.dispatchEvent(".sy-actions button:first-child", "touchend", {
      touches: [{ identifier: 1, clientX: 160, clientY: height - 100 }],
      changedTouches: [
        { identifier: 2, clientX: width - 100, clientY: height - 50 },
      ],
    });
    await p.waitForTimeout(200);
    assert(
      (await p.evaluate(() => window.__survivor.player.current.x)) > moving,
      "releasing a second finger must preserve movement",
    );
    await p.dispatchEvent("canvas", "touchend", {
      touches: [],
      changedTouches: [{ identifier: 1, clientX: 160, clientY: height - 100 }],
    });
    assert(
      (await p.evaluate(() => window.__survivor.player.current.x)) > before,
    );
    await p.locator(".sy-pause").click();
    await p.locator(".sy-pause-overlay").waitFor();
    await p.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: title, all 35 heroes, four-field selection, real input, dash, pause, charged burst, dense combat, boss waves, learning/upgrades, victory, restart, defeat, mobile touch and English landscape. Screenshots: " +
      shots,
  );
} finally {
  await browser?.close();
  await server?.close();
}
