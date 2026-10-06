import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createServer } from "vite";
import { chromium } from "playwright";
const file = `.world3d-fixture-${process.pid}.tsx`;
let server, browser;
const errors = [];
try {
  const source = await fs.readFile(
    "scripts/test-rpg-mobile-browser.mjs",
    "utf8",
  );
  const fixture = source.match(/const fixture=`([\s\S]*?)`;\nlet server/)[1];
  await fs.writeFile(file, fixture);
  server = await createServer({
    cacheDir: "node_modules/.vite-world3d-test",
    optimizeDeps: {
      noDiscovery: true,
      entries: [],
      include: [
        "react",
        "react-dom/client",
        "react/jsx-runtime",
        "peerjs",
        "three",
      ],
    },
    server: { port: 4230, strictPort: true, host: "127.0.0.1", hmr: false },
    plugins: [
      {
        name: "world3d",
        configureServer(s) {
          s.middlewares.use("/world3d", async (req, res) => {
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
    logLevel: "error",
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
  const p = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  p.setDefaultTimeout(90000);
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console",m=>{if(m.type()==="error"||m.text().includes("Storybook"))console.log(m.type(),m.text());});
  await p.addInitScript(()=>localStorage.setItem("rpg-preferences-v1",JSON.stringify({mapQuality:"low"})));
  await p.goto("http://127.0.0.1:4230/world3d");
  await p.getByRole("button", { name: "冒険をはじめる" }).click();
  await p.waitForFunction(() => window.room?.world);
  await p.evaluate(() => window.prepare());
  await p.evaluate(() => {
    const w = window.room.world;
    const npc = w.sites.find((s) => s.kind === "npc");
    const chest = w.sites.find((s) => s.kind === "treasure");
    npc.x = 20;
    npc.y = 17;
    chest.x = 19;
    chest.y = 17;
    window.room.emit();
  });
  console.log("RPG fixture ready");
  await p.getByRole("button", { name: "2D / 3D", exact: true }).click();
  await p.locator("[data-testid=rpg-world-3d]").waitFor();
  await p.waitForFunction(()=>Number(document.querySelector("[data-testid=rpg-world-3d]")?.dataset.blenderModels)>0);
  assert(Number(await p.locator("[data-testid=rpg-world-3d]").getAttribute("data-blender-animations"))>0);
  console.log("RPG 3D rendered with Blender models and animation");
  await p.evaluate(()=>{const w=window.room.world;const flat=[];for(let z=15;z<30;z++)for(let x=15;x<30;x++)flat.push(`${x},${z}`);w.voxels={terrainVersion:2,legacyFlat:flat,revision:1,edits:{'20,0,19':'wood','20,1,19':'wood'}};w.revision++;window.room.emit();});
  await p.waitForTimeout(800);
  await p.waitForFunction(()=>Number(document.querySelector('[data-testid=rpg-world-3d]').dataset.voxelBlocks)>=2);
  assert.equal(await p.locator('.rpg-voxel-slots button').count(),4);
  await p.getByRole('button',{name:'スロット設定'}).click();
  await p.getByRole('button',{name:'⛏ 壊す'}).waitFor();
  await p.getByLabel('選択スロットの素材').selectOption('stone');
  await p.getByRole('button',{name:'スロット設定'}).click();
  await p.getByRole('button',{name:'⛏ 壊す'}).click();
  await p.waitForFunction(()=>window.room.world.voxels.edits['20,1,19']===null);
  assert.equal(await p.evaluate(()=>window.room.world.players.local.life.energy),5.9);
  // A slight downward look targets the remaining block's top face.
  await p.locator('[data-testid=rpg-world-3d]').dispatchEvent('pointerdown',{clientX:220,clientY:400});
  await p.locator('[data-testid=rpg-world-3d]').dispatchEvent('pointerup',{clientX:220,clientY:453});
  await p.waitForTimeout(250);
  await p.getByRole('button',{name:'＋ 置く'}).click();
  await p.waitForFunction(()=>window.room.world.voxels.edits['20,1,19']==='stone');
  console.log('Actual 3D ray mining and supported placement passed');


  await p.evaluate(()=>{const me=window.room.world.players.local;me.y=22;delete me.position3D;window.room.world.revision++;window.room.emit();});
  await p.getByRole('button',{name:'視点スティック'}).press('ArrowUp');
  await p.getByRole('button',{name:'視点スティック'}).press('ArrowUp');
  await p.getByRole('button',{name:'視点スティック'}).press('ArrowUp');
  await p.getByRole('button',{name:'視点スティック'}).press('ArrowUp');
  await p.waitForTimeout(1500);
  await p.screenshot({
    path: "/workspace/scratch/lifestyle-screens/3d-billboards.png",
  });
  await p.keyboard.press("r");
  await p.waitForFunction(
    () =>
      document.querySelector("[data-testid=rpg-world-3d]")?.dataset.facing ===
      "1",
  );
  await p.keyboard.press("w");
  await p.waitForFunction(() =>
    window.sent.some((a) => a.type === "voxel-move" && a.dx > 0 && a.dy === 0),
  );
  await p.keyboard.press("q");
  await p.waitForFunction(
    () =>
      document.querySelector("[data-testid=rpg-world-3d]")?.dataset.facing ===
      "0",
  );
  await p.locator(".rpg-dpad button").first().dispatchEvent("pointerdown", {
    pointerId: 1,
    pointerType: "touch",
    isPrimary: true,
    button: 0,
  });
  await p.locator(".rpg-dpad button").first().dispatchEvent("pointerup", {
    pointerId: 1,
    pointerType: "touch",
    isPrimary: true,
    button: 0,
  });
  await p.waitForFunction(() =>
    window.sent.some((a) => a.type === "voxel-move" && a.dx === 0 && a.dy < 0),
  );
  const look=await p.getByRole('button',{name:'視点スティック'}).boundingBox(),up=await p.locator('.rpg-dpad button').first().boundingBox();
  const cdp=await p.context().newCDPSession(p),before=Number(await p.locator('[data-testid=rpg-world-3d]').getAttribute('data-facing'));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:0,x:up.x+up.width/2,y:up.y+up.height/2},{id:1,x:look.x+look.width*.85,y:look.y+look.height*.35}]});
  await p.waitForTimeout(350);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await p.waitForFunction(n=>Number(document.querySelector('[data-testid=rpg-world-3d]').dataset.facing)!==n,before,{timeout:5000});
  console.log('Two-finger left movement / right look passed');
  for (const [width, height] of [
    [390, 844],
    [320, 568],
    [844, 390],
    [568, 320],
    [1440, 900],
  ]) {
    await p.setViewportSize({ width, height });
    await p.waitForTimeout(250);
    const view = await p.locator("[data-testid=rpg-world-3d]").boundingBox(),
      switcher = await p.locator(".rpg-view-switch").boundingBox();
    const tools=await p.locator('.rpg-voxel-dock').boundingBox();assert(tools.x>=0&&tools.x+tools.width<=width+1);assert(tools.y>=0&&tools.y+tools.height<=height);
    const stick=await p.getByRole('button',{name:'視点スティック'}).boundingBox();console.log('3D controls layout',{width,height,view,tools,stick});await p.screenshot({path:`/workspace/scratch/lifestyle-screens/voxel-controls-${width}.png`});assert(stick.x>=width/2&&stick.y>=view.y-1&&stick.y+stick.height<=view.y+view.height+1&&stick.x+stick.width<=width+1);
    assert.ok(view.width >= width - 2);
    assert.ok(
      switcher.width >= 44 &&
        switcher.height >= 44 &&
        switcher.x + switcher.width <= width + 1,
    );
    assert.ok(
      await p
        .locator(".rpg-root")
        .evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
    );
    await p.screenshot({
      path: `/workspace/scratch/lifestyle-screens/rpg-3d-${width}.png`,
    });
  }
  await p.evaluate(async()=>{const V=await import('/src/rpg/voxel.ts');const w=window.room.world,c=V.oasisCenters(w).find(c=>!V.protectedVoxel(w,c.x,c.z));const me=w.players.local;window.surface={x:me.x,y:me.y};me.x=c.x;me.y=c.z;me.position3D={x:c.x+.5,z:c.z+.5,y:c.depth-1};w.revision++;window.room.emit();});
  await p.waitForFunction(()=>Number(document.querySelector('[data-testid=rpg-world-3d]').dataset.cameraY)<-3);
  await p.waitForTimeout(600);
  await p.screenshot({path:'/workspace/scratch/lifestyle-screens/rpg-underground-oasis.png'});
  await p.evaluate(()=>{const w=window.room.world,me=w.players.local;me.x=window.surface.x;me.y=window.surface.y;delete me.position3D;w.revision++;window.room.emit();});
  await p.getByRole("button", { name: "2D / 3D", exact: true }).click();
  await p.locator("[data-testid=rpg-world-3d]").waitFor({ state: "detached" });
  await p.keyboard.press("ArrowRight");
  await p.evaluate(async () => {
    const { farmOf } = await import("/src/rpg/farm/model.ts");
    const w = window.room.world,
      me = w.players.local;
    me.x = 20;
    me.y = 20;
    const f = farmOf(w, me);
    f.x = 20;
    f.y = 20;
    f.feed = 30;
    f.animals = [
      {
        id: "cow-q",
        kind: "cow",
        name: "Daisy",
        born: 0,
        feed: -1,
        brush: -1,
        clean: -1,
        bond: 70,
        health: 100,
        progress: 0,
        ready: 1,
      },
    ];
    f.pets = [
      {
        id: "pet-q",
        kind: "retriever",
        name: "Sunny",
        bond: 50,
        hunger: 70,
        trained: 20,
        cares: {},
        walkBase: 0,
        walkDay: -1,
        awayUntil: 0,
        trips: 0,
      },
    ];
    f.activePet = "pet-q";
    w.farm.revision = 1;
    window.room.emit();
  });
  await p.locator("[data-testid=farm-quick]").waitFor();
  await p
    .locator(".rpg-farm-targets")
    .getByRole("button", { name: "畑 1", exact: true })
    .click();
  await p.getByRole("button", { name: "🌱 植える", exact: true }).click();
  await p.getByRole("button", { name: "💧 水やり", exact: true }).click();
  assert.ok(
    await p.evaluate(() => window.room.world.farm.people.local.plots[0].crop),
  );
  await p
    .locator(".rpg-farm-targets")
    .getByRole("button", { name: "Daisy", exact: true })
    .click();
  await p
    .locator(".rpg-farm-buttons")
    .getByRole("button", { name: "♡ なでる", exact: true })
    .click();
  assert.ok(
    await p.evaluate(
      () => window.room.world.farm.people.local.animals[0].moment,
    ),
  );
  await p
    .locator(".rpg-farm-targets")
    .getByRole("button", { name: "Sunny", exact: true })
    .click();
  await p
    .locator(".rpg-farm-buttons")
    .getByRole("button", { name: "遊ぶ", exact: true })
    .click();
  assert.ok(
    await p.evaluate(() => window.room.world.farm.people.local.pets[0].moment),
  );
  for (const [width, height] of [
    [844, 390],
    [568, 320],
  ]) {
    await p.setViewportSize({ width, height });
    await p.waitForTimeout(150);
    await p.locator(".rpg-compact-dock button").first().click();
    await p
      .locator(".rpg-life>nav")
      .getByRole("button", { name: "クラフト", exact: true })
      .click();
    const body = await p.locator(".rpg-life-content").boundingBox();
    assert.ok(
      body.height >= 90 && body.y + body.height <= height + 1,
      JSON.stringify(body),
    );
    const last = p.locator(".rpg-life-content button").last();
    await last.scrollIntoViewIfNeeded();
    const bounds = await last.boundingBox();
    assert.ok(
      bounds.y >= body.y - 1 &&
        bounds.y + bounds.height <= body.y + body.height + 1,
    );
    await p.locator(".rpg-life>header button").click();
    await p.locator(".rpg-compact-dock button").last().click();
    await p
      .locator(".rpg-detail-tabs")
      .getByRole("button", { name: "暮らし", exact: true })
      .click();
    await p
      .locator(".town-tabs")
      .getByRole("button", { name: "暮らしの状態", exact: true })
      .click();
    await p.locator(".town-today-guide summary").click();
    assert.ok(
      await p
        .locator(".town-today-guide")
        .innerText()
        .then((t) => t.includes("1日は活動時間で3分")),
    );
    await p
      .locator(".town-tabs")
      .getByRole("button", { name: "家族", exact: true })
      .click();
    assert.equal(
      await p
        .locator(".town-tabs")
        .evaluate((el) => getComputedStyle(el).flexWrap),
      "nowrap",
    );
    await p.locator(".rpg-detail-close").click();
  }
  await p.setViewportSize({ width: 844, height: 390 });
  await p.screenshot({
    path: "/workspace/scratch/lifestyle-screens/farm-quick-landscape.png",
  });
  assert.deepEqual(errors, []);
  console.log(
    "RPG 3D integration passed: real mining/building and underground oasis, two-finger continuous look/movement, four customizable slots, five layouts, toggle, adjacent farm/animal/pet actions and scrollable landscape menus.",
  );
} finally {
  await browser?.close();
  await server?.close();
  await fs.rm(file, { force: true });
}
