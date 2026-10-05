import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createServer } from "vite";
import { chromium } from "playwright";
const file = `.lifestyle-fixture-${process.pid}.tsx`;
let server, browser;
const errors = [];
try {
  await fs.writeFile(
    file,
    `import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import './src/styles.css';import WorldView from './src/rpg/WorldView';import CommunityPanel from './src/rpg/lifestyle/CommunityPanel';import FarmPanel from './src/rpg/farm/Panel';import CityPanel from './src/rpg/city/Panel';import {createWorld,addPlayer,applyAction,WIDTH} from './src/rpg/engine';import {personOf} from './src/rpg/town/model';import {farmOf} from './src/rpg/farm/model';import {ALL_DISHES} from './src/rpg/town/catalog';import {updateRpgPreferences,useRpgPreferences} from './src/rpg/preferences';const w=createWorld(42,undefined,0,Date.now());addPlayer(w,'a','A');addPlayer(w,'b','B');for(const p of Object.values(w.players)){p.x=30;p.y=67;p.profile={hp:72,maxHp:72,gold:100,deck:[],deckSize:0,character:'WARRIOR',image:''};}personOf(w,'a').foods[ALL_DISHES[24].id]={normal:5,perfect:1};personOf(w,'b');const f=farmOf(w,w.players.a);f.x=30;f.y=69;f.coins=1000;f.feed=50;f.pets=[{id:'p',kind:'retriever',name:'Sunny',bond:100,hunger:100,trained:100,cares:{},walkBase:0,walkDay:-1,awayUntil:0,trips:0}];f.activePet='p';for(let y=62;y<76;y++)for(let x=27;x<36;x++)w.tiles[y*WIDTH+x]='grass';window.w=w;window.prefs=updateRpgPreferences;const root=createRoot(document.getElementById('root'));let now=Date.now();function App(){const [revision,setRevision]=useState(0),[tab,setTab]=useState('map'),[self,setSelf]=useState('a'),[facing,setFacing]=useState(0),prefs=useRpgPreferences();window.draw=()=>setRevision(n=>n+1);window.tab=setTab;window.switchSelf=setSelf;window.turn=setFacing;window.send=(a,id=self)=>{const result=applyAction(w,id,a,now+=300);window.draw();return result;};return <div><nav>{['map','gifts','farm','city'].map(t=><button onClick={()=>setTab(t)} key={t}>{t}</button>)}<button onClick={()=>updateRpgPreferences({mapView:prefs.mapView==='3D'?'2D':'3D'})}>2D / 3D</button><button onClick={()=>setFacing(n=>(n+1)%4)}>turn</button></nav>{tab==='map'?<div style={{position:'relative',height:'calc(100dvh - 55px)',width:'100%'}}><WorldView world={{...w}} selfId={self} facing={facing} onFacing={setFacing} onTile={(x,y)=>{window.clicked={x,y};}}/></div>:tab==='gifts'?<CommunityPanel world={{...w}} selfId={self} send={window.send} languageMode='ENGLISH'/>:tab==='farm'?<FarmPanel world={{...w}} selfId={self} send={window.send} languageMode='ENGLISH' onClose={()=>setTab('map')}/>:<CityPanel world={{...w}} selfId={self} send={window.send} languageMode='ENGLISH' onClose={()=>setTab('map')}/>}</div>};root.render(<App/>);`,
  );
  server = await createServer({
    cacheDir: "node_modules/.vite-lifestyle-browser",
    optimizeDeps: {
      noDiscovery: true,
      entries: [],
      include: ["react", "react-dom/client", "react/jsx-runtime", "three"],
    },
    server: { port: 4221, strictPort: true, host: "127.0.0.1", hmr: false },
    plugins: [
      {
        name: "lifestyle-fixture",
        configureServer(s) {
          s.middlewares.use("/lifestyle-fixture", async (req, res) => {
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
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  page.setDefaultTimeout(60000);
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:4221/lifestyle-fixture");
  await page.getByRole("button", { name: "2D / 3D", exact: true }).click();
  await page.locator('[data-testid="rpg-world-3d"]').waitFor();
  await page.waitForTimeout(1000);
  console.log("3D initialized");
  const gl = await page
    .locator('[data-testid="rpg-world-3d"]')
    .evaluate((canvas) => {
      const gl = canvas.getContext("webgl2");
      return !!gl && !gl.isContextLost();
    });
  assert.equal(gl, true);
  await fs.mkdir("/workspace/scratch/lifestyle-screens", { recursive: true });
  await page.screenshot({
    path: "/workspace/scratch/lifestyle-screens/3d-desktop.png",
  });
  for (const [width, height] of [
    [390, 844],
    [844, 390],
    [768, 1024],
    [1024, 768],
    [1440, 900],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(200);
    const rect = await page
      .locator('[data-testid="rpg-world-3d"]')
      .boundingBox();
    assert.ok(rect.width >= width - 2);
    assert.ok(rect.height >= height - 60);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
  }
  console.log("Viewports passed");
  await page.getByRole("button", { name: "turn", exact: true }).click();
  await page.evaluate(() => {
    w.players.a.x++;
    draw();
  });
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "2D / 3D", exact: true }).click();
  await page.locator(".rpg-canvas").waitFor();
  assert.equal(await page.evaluate(() => w.players.a.x), 31);
  await page.getByRole("button", { name: "2D / 3D", exact: true }).click();
  await page.locator('[data-testid="rpg-world-3d"]').waitFor();
  await page
    .locator('[data-testid="rpg-world-3d"]')
    .evaluate((canvas) =>
      canvas
        .getContext("webgl2")
        .getExtension("WEBGL_lose_context")
        .loseContext(),
    );
  await page.locator(".rpg-canvas").waitFor();
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("rpg-preferences-v1")).mapView,
    ),
    "2D",
  );
  console.log("Switch/fallback passed");
  await page.getByRole("button", { name: "gifts", exact: true }).click();
  await page.getByLabel("Recipient", { exact: true }).selectOption("b");
  await page
    .getByRole("button", { name: "Send food gift", exact: true })
    .click();
  assert.equal(
    await page.evaluate(() => w.town.community.gifts.at(-1).status),
    "pending",
  );
  await page.evaluate(() => switchSelf("b"));
  await page.getByRole("button", { name: "Receive", exact: true }).click();
  assert.equal(
    await page.evaluate(() => w.town.community.gifts.at(-1).status),
    "accepted",
  );
  await page.evaluate(() => switchSelf("a"));
  await page.getByRole("button", { name: "farm", exact: true }).click();
  await page.getByRole("button", { name: /Pets/ }).first().click();
  await page.locator('[data-testid="pet-tricks"] summary').click();
  assert.equal(
    await page.locator('[data-testid="pet-tricks"] button').count(),
    16,
  );
  await page.getByRole("button", { name: "Sit", exact: true }).click();
  assert.equal(
    await page.evaluate(() => w.farm.people.a.pets[0].moment.pose),
    "greet",
  );
  await page.evaluate(() => {
    w.ended = true;
    w.won = true;
    w.endReason = "clear";
    w.rewardAt = 0;
    send({ type: "city-continue" });
    w.city.treasury = 10000;
    draw();
  });
  await page
    .getByRole("button", { name: "Close", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "city", exact: true }).click();
  await page
    .getByRole("button", { name: "People and districts", exact: true })
    .click();
  await page.locator("[data-testid=city-living]").waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Start project", exact: true })
      .count(),
    6,
  );
  await page
    .getByRole("button", { name: "Start project", exact: true })
    .first()
    .click();
  assert.equal(await page.evaluate(() => w.city.living.projects.length), 1);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  assert.deepEqual(errors, []);
  console.log(
    "Lifestyle browser passed: real WebGL in six sizes, switches retain position, context-loss fallback and persisted preferences, farm recipe gift consent, 16 pet tricks.",
  );
} finally {
  await browser?.close();
  await server?.close();
  await fs.rm(file, { force: true });
}
