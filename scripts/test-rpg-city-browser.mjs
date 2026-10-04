import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createServer } from "vite";
import { chromium } from "playwright";
const file = `.city-fixture-${process.pid}.tsx`;
let server, browser, page;
const errors = [];
try {
  await fs.writeFile(
    file,
    `import React from 'react';import {createRoot} from 'react-dom/client';import './src/styles.css';import RpgOnline from './src/rpg/RpgOnline';import RpgTitle from './src/rpg/RpgTitle';import MiniGameLab from './src/rpg/MiniGameLab';import {applyAction,advanceWorld} from './src/rpg/engine';import {newInterior} from './src/rpg/homeCatalog';import {FLOWERS} from './src/rpg/town/catalog';import {flowerAt} from './src/rpg/town/model';import {readWorldSave} from './src/rpg/worldSave';import {validCityTile} from './src/rpg/city/model';import {updateRpgPreferences} from './src/rpg/preferences';window.validCityTile=validCityTile;window.updatePrefs=updateRpgPreferences;window.readWorldSave=readWorldSave;window.flowerAt=flowerAt;window.applyAction=applyAction;window.advanceWorld=advanceWorld;window.newInterior=newInterior;window.FLOWERS=FLOWERS;const language=new URLSearchParams(location.search).get('lang')||'JAPANESE';const player={id:'WARRIOR',currentHp:72,maxHp:72,gold:100,deck:[],relics:[],potions:[],hand:[],drawPile:[],discardPile:[],powers:{},relicCounters:{},turnFlags:{},typesPlayedThisTurn:[],currentEnergy:3,maxEnergy:3,block:0,strength:0,echoes:0,nextTurnEnergy:0,nextTurnDraw:0,attacksPlayedThisTurn:0,cardsPlayedThisTurn:0,floatingText:null,imageData:''};const resume=new URLSearchParams(location.search).has('resume')?await readWorldSave():null;createRoot(document.getElementById('root')).render(new URLSearchParams(location.search).has('lab')?<MiniGameLab languageMode={language} onClose={()=>{}}/>:new URLSearchParams(location.search).has('title')?<RpgTitle languageMode={language} debugEnabled={new URLSearchParams(location.search).has('debug')} onNew={()=>{}} onContinue={()=>{}} onClose={()=>{}}/>:<RpgOnline resumeSave={resume} player={player} active languageMode={language} onRoom={r=>window.room=r} onSnapshot={s=>window.snapshot=s} adventureSetup={{visualTheme:'elementary',mode:'MULTIPLICATION',answerMode:'CHOICE',difficultyLevel:1}} onSetup={()=>{}} onClose={()=>{}}/>);`,
  );
  server = await createServer({
    cacheDir: "node_modules/.vite-city-browser",
    optimizeDeps: {
      noDiscovery: true,
      entries: [],
      include: ["react", "react-dom/client", "react/jsx-runtime", "peerjs"],
    },
    server: { host: "127.0.0.1", port: 4199, strictPort: true, hmr: false },
    plugins: [
      {
        name: "town-browser",
        configureServer(s) {
          s.middlewares.use("/__city", async (req, res) => {
            res.setHeader("Content-Type", "text/html");
            res.end(
              await s.transformIndexHtml(
                req.originalUrl || req.url,
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
  browser = await chromium.launch();
  const p = (page = await browser.newPage({
    locale: "ja-JP",
    viewport: { width: 390, height: 844 },
  }));
  p.setDefaultTimeout(60000);
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://127.0.0.1:4199/__city");
  await p.getByRole("button", { name: "冒険をはじめる", exact: true }).click();
  await p.waitForFunction(() => !!window.snapshot?.world.town?.people.local);
  console.log("settings and stick");
  await p.locator(".rpg-settings-map-button").click();
  await p.getByLabel(/^移動操作/).selectOption("stick");
  await p.getByLabel("機械音声を再生", { exact: true }).uncheck();
  await p.keyboard.press("Escape");
  await p.locator(".rpg-settings").waitFor({ state: "hidden" });
  await p.locator(".rpg-stick").waitFor();
  await p.evaluate(() => window.updatePrefs({ hand: "right" }));
  const start = await p.evaluate(() => ({
    ...window.room.world.players.local,
  }));
  const stick = await p.locator(".rpg-stick").boundingBox();
  assert.ok(stick.x > 150, "right-hand setting places the stick on the right");
  await p.mouse.move(stick.x + stick.width * 0.8, stick.y + stick.height / 2);
  await p.mouse.down();
  await p.waitForTimeout(400);
  await p.mouse.up();
  const moved = await p.evaluate(() => window.room.world.players.local.x);
  assert.ok(moved > start.x, "stick moves the hero");
  await p.waitForTimeout(400);
  assert.equal(
    await p.evaluate(() => window.room.world.players.local.x),
    moved,
    "release stops repeat",
  );
  assert.equal(
    await p.evaluate(
      () => JSON.parse(localStorage.getItem("rpg-preferences-v1")).speech,
    ),
    false,
  );
  console.log("create resident");
  await p.locator(".rpg-season-badge").click();
  await p
    .locator(".town-tabs")
    .getByRole("button", { name: "住人", exact: true })
    .click();
  await p.getByLabel("住民の名前", { exact: true }).fill("新住民");
  await p.getByRole("button", { name: "住民を迎える", exact: true }).click();
  await p.waitForFunction(
    () => window.room.world.town.customResidents?.length === 1,
  );
  assert.equal(
    await p.evaluate(() => window.room.world.town.customResidents[0].name),
    "新住民",
  );
  await p.locator(".rpg-detail-close").click();
  console.log("clear and city");
  await p.evaluate(() => {
    const w = window.room.world;
    w.ended = true;
    w.won = true;
    w.endReason = "clear";
    w.rewardAt = Date.now() - 1000;
    w.rankingAwards = { local: { rank: 1, score: 10, medals: 1 } };
    window.room.emit();
  });
  await p
    .getByRole("button", { name: "街づくりを始める", exact: true })
    .click();
  await p.waitForFunction(
    () => !!window.room.world.city && !window.room.world.ended,
  );
  await p.getByRole("button", { name: "採取", exact: true }).click();
  await p
    .locator(".rpg-life nav")
    .getByRole("button", { name: "クラフト", exact: true })
    .click();
  await p.getByRole("button", { name: "都市運営", exact: true }).click();
  await p.locator(".city-panel").waitFor();
  const land = await p.evaluate(() => {
    const w = window.room.world;
    return [...document.querySelectorAll(".city-map button")]
      .map((b) => {
        const [x, y] = b
          .getAttribute("aria-label")
          .split(",")
          .map((v) => parseInt(v));
        return { x, y };
      })
      .find(
        ({ x, y }) =>
          window.validCityTile(w, x, y) && w.tiles[y * 192 + x] === "grass",
      );
  });
  assert.ok(land);
  await p
    .locator(".city-map")
    .getByRole("button", {
      name: land.x + ", " + land.y + " 空き地",
      exact: true,
    })
    .click();
  await p.getByRole("button", { name: /ここに建設する/ }).click();
  assert.ok(
    await p.evaluate(
      ({ x, y }) => window.room.world.city.roads.includes(y * 192 + x),
      land,
    ),
  );
  const house = await p.evaluate(
    ({ x, y }) =>
      [
        { x: x + 1, y },
        { x: x - 1, y },
        { x, y: y + 1 },
        { x, y: y - 1 },
      ].find(
        (t) =>
          window.validCityTile(window.room.world, t.x, t.y) &&
          !window.room.world.city.roads.includes(t.y * 192 + t.x),
      ),
    land,
  );
  assert.ok(house);
  await p
    .locator(".city-catalog")
    .getByText("住宅", { exact: true })
    .locator("..")
    .click();
  await p
    .locator(".city-map")
    .getByRole("button", {
      name: house.x + ", " + house.y + " 空き地",
      exact: true,
    })
    .click();
  await p.getByRole("button", { name: /ここに建設する/ }).click();
  assert.equal(await p.evaluate(() => window.room.world.city.lots.length), 1);
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [568, 320],
    [844, 390],
    [1024, 768],
    [1440, 900],
  ]) {
    await p.setViewportSize({ width, height });
    for (const tab of [
      "建設",
      "街の状況",
      "財政・政策",
      "サービス",
      "街の目標",
    ]) {
      await p
        .locator(".city-panel nav")
        .getByRole("button", { name: tab, exact: true })
        .click();
      const fit = await p.locator(".city-panel").evaluate((el) => ({
        sw: el.scrollWidth,
        cw: el.clientWidth,
        top: el.getBoundingClientRect().top,
        bottom: el.getBoundingClientRect().bottom,
      }));
      assert.ok(
        fit.sw <= fit.cw + 2 && fit.top >= -1 && fit.bottom <= height + 1,
        `${width}x${height} ${tab} ${JSON.stringify(fit)}`,
      );
    }
  }
  await p.setViewportSize({ width: 390, height: 844 });
  await p
    .locator(".city-panel nav")
    .getByRole("button", { name: "建設", exact: true })
    .click();
  await p.screenshot({ path: "/tmp/rpg-city-mobile.png" });
  await p.locator(".city-panel header button").click();
  await p
    .getByRole("button", { name: "部屋と操作の詳細", exact: true })
    .click();
  await p
    .getByRole("button", { name: "ワールドを保存する", exact: true })
    .click();
  await p.getByText("ワールドを保存しました。", { exact: true }).waitFor();
  assert.ok((await p.evaluate(() => window.readWorldSave())).world.city);
  await p.goto("http://127.0.0.1:4199/__city?title=1");
  assert.equal(
    await p
      .getByRole("button", { name: "ゲーム家具の練習室", exact: true })
      .count(),
    0,
  );
  for(const [width,height]of [[320,568],[390,844],[568,320],[844,390],[1024,768],[1440,900]]){await p.setViewportSize({width,height});const boxes=await p.locator('.game-launch-menu>button').evaluateAll(elements=>elements.map(el=>({x:el.getBoundingClientRect().x,y:el.getBoundingClientRect().y,right:el.getBoundingClientRect().right,bottom:el.getBoundingClientRect().bottom})));assert.ok(boxes.every(r=>r.x>=0&&r.y>=0&&r.right<=width&&r.bottom<=height),`${width}x${height} normal title buttons fit ${JSON.stringify(boxes)}`);}await p.setViewportSize({width:390,height:844});
  await p.goto("http://127.0.0.1:4199/__city?title=1&debug=1");
  await p.getByRole("button", { name: "RPG設定", exact: true }).click();
  await p.locator(".rpg-settings").waitFor();
  assert.ok(
    await p.locator(".rpg-settings").evaluate((el) => {
      const r = el.getBoundingClientRect();
      return !!document
        .elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
        ?.closest(".rpg-settings");
    }),
  );
  await p.keyboard.press("Escape");
  await p.locator(".rpg-settings").waitFor({ state: "hidden" });
  await p.locator(".game-launch-title").waitFor();
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [568, 320],
    [844, 390],
    [1024, 768],
    [1440, 900],
  ]) {
    await p.setViewportSize({ width, height });
    const boxes = await p
      .locator(".game-launch-menu>button")
      .evaluateAll((elements) =>
        elements.map((el) => ({
          x: el.getBoundingClientRect().x,
          y: el.getBoundingClientRect().y,
          right: el.getBoundingClientRect().right,
          bottom: el.getBoundingClientRect().bottom,
        })),
      );
    assert.ok(
      boxes.every(
        (r) => r.x >= 0 && r.y >= 0 && r.right <= width && r.bottom <= height,
      ),
      `${width}x${height} title buttons fit ${JSON.stringify(boxes)}`,
    );
  }
  await p.setViewportSize({ width: 390, height: 844 });
  await p
    .getByRole("button", { name: "ゲーム家具の練習室", exact: true })
    .click();
  await p.locator(".rpg-mini-lab").waitFor();
  assert.equal(await p.locator(".gc-party-lobby>button").count(), 10);
  console.log("actual furniture gestures");
  await p.evaluate(() => window.updatePrefs({ twoD: true }));
  await p
    .locator(".gc-party-lobby")
    .getByRole("button", { name: /テンピンボウリング/ })
    .click();
  await p.getByRole("button", { name: "ゲーム開始", exact: true }).click();
  await p.locator(".gc-bowling-lane").scrollIntoViewIfNeeded();
  const lane = await p.locator(".gc-bowling-lane").boundingBox();
  await p.mouse.move(lane.x + lane.width * 0.5, lane.y + lane.height * 0.9);
  await p.mouse.down();
  await p.mouse.move(lane.x + lane.width * 0.6, lane.y + lane.height * 0.6, {
    steps: 6,
  });
  await p.waitForTimeout(120);
  await p.mouse.move(lane.x + lane.width * 0.5, lane.y + lane.height * 0.25, {
    steps: 6,
  });
  await p.mouse.up();
  await p.waitForTimeout(1900);
  assert.ok((await p.locator(".gc-bowling-frames").innerText()).includes("1"));
  await p.getByRole("button", { name: "対戦から退出", exact: true }).click();
  await p
    .locator(".gc-party-lobby")
    .getByRole("button", { name: /8ボール/ })
    .click();
  await p.getByRole("button", { name: "ゲーム開始", exact: true }).click();
  await p
    .getByRole("button", { name: "手玉の打点", exact: true })
    .click({ position: { x: 65, y: 25 } });
  const dot = await p.locator(".gc-cue-dot").getAttribute("style");
  assert.ok(!dot.includes("left: 50%"));
  await p
    .getByRole("button", { name: "ボタンでショット", exact: true })
    .click();
  await p.getByRole("button", { name: "対戦から退出", exact: true }).click();
  await p
    .locator(".gc-party-lobby")
    .getByRole("button", { name: /チームリバーシ/ })
    .click();
  await p.getByRole("button", { name: "ゲーム開始", exact: true }).click();
  await p.locator(".gc-party-board button:not(:disabled)").first().click();
  await p.getByText(/CPUが考えています/).waitFor();
  await p.waitForTimeout(850);
  await p.getByText(/あなたの手番/).waitFor();
  await p.getByRole("button", { name: "対戦から退出", exact: true }).click();
  await p
    .locator(".gc-party-lobby")
    .getByRole("button", { name: /ダーツ301/ })
    .click();
  await p.getByRole("button", { name: "ゲーム開始", exact: true }).click();
  await p.locator(".gc-darts-board").focus();
  await p.keyboard.press("ArrowRight");
  await p.keyboard.press("Enter");
  await p.getByText(/残り投数.*2/).waitFor();
  await p.getByRole("button", { name: "対戦から退出", exact: true }).click();
  for (const lang of ["ENGLISH", "HIRAGANA"]) {
    await p.goto("http://127.0.0.1:4199/__city?lang=" + lang);
    await p.locator(".rpg-join-button").click();
    await p.waitForFunction(() => !!window.snapshot?.world.town?.people.local);
    await p.locator(".rpg-season-badge").click();
    await p.locator(".town-tabs button").nth(4).click();
    const text = await p.locator(".town-panel").innerText();
    assert.ok(
      !(lang === "ENGLISH" ? /[ぁ-んァ-ヶ一-龠]/ : /[一-龠]/).test(text),
      lang + " missing copy: " + text,
    );
  }
  assert.deepEqual(errors, []);
  console.log(
    "City browser passed: resident creation, settings/voice/stick/release, cleared-map continuation and saving, five city tabs at six sizes, debug-gated title practice, ten furniture entries, EN/HI resident labels.",
  );
} catch (error) {
  console.error("Browser errors", errors);
  if (page) {
    console.error((await page.locator("body").innerText()).slice(0, 2500));
    await page.screenshot({ path: "/tmp/city-browser-failure.png" });
  }
  throw error;
} finally {
  await browser?.close();
  await server?.close();
  await fs.rm(file, { force: true });
}
