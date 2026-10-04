import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createServer } from "vite";
import { chromium } from "playwright";
const file = `.farm-fixture-${process.pid}.tsx`;
let server, browser, page;
const errors = [];
try {
  await fs.writeFile(
    file,
    `import React from 'react';import {createRoot} from 'react-dom/client';import './src/styles.css';import FarmPanel from './src/rpg/farm/Panel';import HomeCanvas from './src/rpg/HomeCanvas';import {createWorld,addPlayer,applyAction,advanceWorld,WIDTH} from './src/rpg/engine';import {advanceFarm} from './src/rpg/farm/model';import {newInterior} from './src/rpg/homeCatalog';import {makeWorldSave,restoreWorldSave} from './src/rpg/worldSave';import {personOf} from './src/rpg/town/model';const mode=new URLSearchParams(location.search).get('lang')||'JAPANESE';const w=createWorld(42,undefined,0,Date.now());addPlayer(w,'a','Farmer');const p=w.players.a;p.x=21;p.y=22;p.profile={hp:72,maxHp:72,gold:100,deck:[],deckSize:0,character:'WARRIOR',image:''};for(let y=18;y<50;y++)for(let x=18;x<60;x++)w.tiles[y*WIDTH+x]='grass';w.sites=w.sites.filter(s=>s.x<15||s.x>65||s.y<15||s.y>55);const root=createRoot(document.getElementById('root'));let clock=Date.now();const draw=()=>root.render(<FarmPanel world={{...w}} selfId="a" languageMode={mode} send={send} onClose={()=>window.closedPanel=true}/>);function send(a){applyAction(w,'a',a,clock=Math.max(Date.now(),clock+300));draw();}window.w=w;window.send=send;window.draw=draw;window.advanceDay=()=>{w.town.day++;w.town.elapsed=w.town.day*180;advanceFarm(w);draw();};window.enterHome=()=>{w.life.houses.push({id:'home-a',owner:'a',ownerName:'Farmer',x:40,y:40,biome:'meadow',home:{tile:40*WIDTH+40,level:1,furniture:[{slot:0,item:'workbench'}]},interior:newInterior(),invitedAt:0});p.life.indoors='home-a';p.life.roomPos={x:9,y:11};personOf(w,'a');draw();};window.saveTest=()=>{const save=makeWorldSave(w,'a',{id:'WARRIOR',currentHp:72,maxHp:72,gold:100,deck:[],relics:[],potions:[],rpgMutationRevision:0},clock);const restored=restoreWorldSave(save,clock+86400000);return JSON.stringify(restored.farm)===JSON.stringify(w.farm);};draw();`,
  );
  server = await createServer({
    cacheDir: "node_modules/.vite-farm-browser",
    optimizeDeps: {
      noDiscovery: true,
      entries: [],
      include: ["react", "react-dom/client", "react/jsx-runtime", "peerjs"],
    },
    server: { port: 4201, strictPort: true, host: "127.0.0.1", hmr: false },
    plugins: [
      {
        name: "farm-fixture",
        configureServer(s) {
          s.middlewares.use("/farm-fixture", async (req, res) => {
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
  });
  await server.listen();
  browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(60000);
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:4201/farm-fixture");
  await page
    .getByRole("button", { name: "ここに開く", exact: false })
    .first()
    .waitFor({ timeout: 90000 });
  await page
    .getByRole("button", { name: "ここに開く", exact: false })
    .first()
    .click();
  await page.getByRole("button", { name: "種を植える", exact: true }).click();
  await page.getByRole("button", { name: "💧 水やり", exact: true }).click();
  await page.getByRole("button", { name: "堆肥を使う", exact: true }).click();
  await page.evaluate(() => window.advanceDay());
  await page.getByRole("button", { name: "収穫する", exact: true }).click();
  assert.ok(
    await page.evaluate(() => window.w.farm.people.a.pantry.turnip.quality > 0),
  );
  await page.evaluate(() => {
    window.w.farm.people.a.coins = 5000;
    window.draw();
  });
  await page.getByRole("button", { name: "家畜", exact: true }).click();
  await page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", { name: "ニワトリ", exact: true }),
    })
    .getByRole("button", { name: "迎える", exact: false })
    .click();
  const hen = page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", { name: "ニワトリ", exact: true }),
    })
    .filter({ has: page.getByRole("button", { name: "ブラシ", exact: true }) });
  await hen.getByRole("button", { name: "えさ", exact: true }).click();
  await hen.getByRole("button", { name: "ブラシ", exact: true }).click();
  await hen.getByRole("button", { name: "掃除", exact: true }).click();
  await page.evaluate(() => window.advanceDay());
  await hen.getByRole("button", { name: "受け取る", exact: true }).click();
  await page.getByRole("button", { name: "ペット", exact: true }).click();
  await page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "柴犬", exact: true }) })
    .getByRole("button", { name: "迎える", exact: false })
    .click();
  const pet = page
    .getByRole("article")
    .filter({ has: page.getByRole("button", { name: "なでる", exact: true }) });
  await pet.getByRole("button", { name: "なでる", exact: true }).click();
  await pet.getByRole("button", { name: "遊ぶ", exact: true }).click();
  await pet.getByRole("button", { name: "しつけ", exact: true }).click();
  await pet.getByRole("button", { name: "えさ", exact: true }).click();
  assert.equal(
    await pet.getByRole("button", { name: "遊ぶ", exact: true }).isDisabled(),
    true,
  );
  const sizes = [
    [320, 568],
    [390, 844],
    [568, 320],
    [844, 390],
    [1024, 768],
    [1440, 900],
  ];
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    for (const tab of [
      "畑",
      "家畜",
      "ペット",
      "食材と料理",
      "種と設備",
      "図鑑と目標",
    ]) {
      await page.getByRole("button", { name: tab, exact: true }).click();
      const dimensions = await page.evaluate(() => {
        const el = document.querySelector(".farm-panel"),
          scroll = document.querySelector(".farm-scroll"),
          r = el.getBoundingClientRect();
        return {
          x: r.x,
          y: r.y,
          right: r.right,
          bottom: r.bottom,
          viewport: [innerWidth, innerHeight],
          overflow: scroll.scrollWidth - scroll.clientWidth,
          pageOverflow: document.documentElement.scrollWidth - innerWidth,
        };
      });
      assert.ok(
        dimensions.x >= 0 &&
          dimensions.y >= 0 &&
          dimensions.right <= width + 1 &&
          dimensions.bottom <= height + 1,
        JSON.stringify({ tab, width, height, dimensions }),
      );
      assert.ok(
        dimensions.overflow <= 1 && dimensions.pageOverflow <= 1,
        JSON.stringify({ tab, width, height, dimensions }),
      );
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "食材と料理", exact: true }).click();
  await page.evaluate(() => {
    window.enterHome();
    const f = window.w.farm.people.a;
    f.pantry.carrot = { normal: 2, quality: 0 };
    f.pantry.milk = { normal: 1, quality: 0 };
    window.draw();
  });
  const dish = page.getByRole("article").filter({
    has: page.getByRole("heading", { name: "ニンジンのスープ", exact: true }),
  });
  await dish.getByRole("button", { name: "料理する", exact: true }).click();
  await page.getByRole("dialog", { name: "調理のタイミング" }).waitFor();
  await page.getByRole("button", { name: "調理を中断", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("dialog", { name: "調理のタイミング" })
    .waitFor({ state: "hidden" });
  assert.equal(
    await page.evaluate(() => window.w.farm.people.a.pantry.carrot.normal),
    0,
    "cancelled cooking consumes its ingredients once",
  );
  await page.evaluate(() => {
    window.w.farm.people.a.pantry.carrot.normal = 2;
    window.w.farm.people.a.pantry.milk.normal = 1;
    window.draw();
  });
  await dish.getByRole("button", { name: "料理する", exact: true }).click();
  await page.getByRole("dialog", { name: "調理のタイミング" }).waitFor();

  await page.evaluate(() => {
    for (let i = 0; i < 3; i++) {
      const r = window.w.town.cooking.a;
      window.send({ type: "town-cook-tap" });
    }
  });
  await page
    .getByRole("dialog", { name: "調理のタイミング" })
    .waitFor({ state: "hidden" });
  assert.equal(
    await page.evaluate(() =>
      Object.values(window.w.town.people.a.foods).reduce(
        (n, x) => n + x.normal + x.perfect,
        0,
      ),
    ),
    1,
  );
  assert.ok(await page.evaluate(() => window.saveTest()));
  // Each sprite is its own isolated generated file; wait for actual image loads.
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".farm-sprite")].every(
      (i) => i.complete && i.naturalWidth > 0,
    ),
  );
  await page.screenshot({ path: "/workspace/scratch/rpg-farm-cooking.png" });
  for (const lang of ["ENGLISH", "HIRAGANA"]) {
    await page.goto("http://127.0.0.1:4201/farm-fixture?lang=" + lang);
    await page.locator(".farm-summary").waitFor({ timeout: 90000 });
    const text = await page.locator(".farm-content").innerText();
    if (lang === "ENGLISH")
      assert.equal(/[\u3040-\u30ff\u3400-\u9fff]/.test(text), false, text);
    else assert.equal(/[\u3400-\u9fff]/.test(text), false, text);
  }
  assert.deepEqual(errors, []);
  console.log(
    "Farm browser passed: real planting/watering/fertilizing/harvesting, livestock care/collection, pet adoption/care, six tabs across six screen sizes, recipe cooking, persistence, generated images and English/Hiragana UI.",
  );
} catch (e) {
  console.error("PAGE ERRORS", errors);
  if (page) {
    console.error((await page.locator("body").innerText()).slice(0, 1500));
    await page.screenshot({
      path: "/workspace/scratch/farm-browser-failure.png",
    });
  }
  throw e;
} finally {
  await page?.close();
  await browser?.close();
  await server?.close();
  await fs.rm(file, { force: true });
}
