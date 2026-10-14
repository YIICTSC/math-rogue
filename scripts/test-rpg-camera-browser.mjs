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
  const fixture = source.match(/const fixture=`([\s\S]*?)`;\r?\nlet server/)[1];
  await fs.writeFile(file, fixture);
  server = await createServer({
    cacheDir: "tmp/vite-camera-test",
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
    server: { port: 4234, strictPort: true, host: "127.0.0.1", hmr: false },
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
  await p.goto("http://127.0.0.1:4234/world3d");
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
  // Decorative animated butterflies were removed; static Blender scenery remains.
  assert(!/model:\s*['"]butterfly['"]/.test(await fs.readFile("src/rpg/WorldScene3D.tsx","utf8")));
  console.log("RPG 3D rendered with Blender models and no decorative butterflies");

  await p.evaluate(async()=>{window.setCamera=(await import('/src/rpg/preferences.ts')).updateRpgPreferences;window.setCamera({lookControl:'both',lookInvertX:false,lookInvertY:false,lookSensitivity:1});});
  const canvas=p.locator('[data-testid=rpg-world-3d]'),element=await canvas.elementHandle();await p.getByRole('button',{name:'視点スティック',exact:true}).waitFor();
  const box=await canvas.boundingBox(),x=box.x+box.width*.4,y=box.y+box.height*.35,before=await canvas.getAttribute('data-pitch');
  await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+30,y+20,{steps:4});await p.mouse.up();await p.waitForTimeout(100);assert(Number(await canvas.getAttribute('data-pitch'))<Number(before));
  await p.getByRole('button',{name:'視点を水平に戻す',exact:true}).click();await p.waitForFunction(()=>Number(document.querySelector('[data-testid=rpg-world-3d]').dataset.pitch)===0);
  await p.evaluate(()=>window.setCamera({lookInvertY:true,lookControl:'both'}));await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+30,y+20,{steps:4});await p.mouse.up();await p.waitForTimeout(100);assert(Number(await canvas.getAttribute('data-pitch'))>0);
  await p.evaluate(()=>window.setCamera({lookControl:'stick',lookInvertY:false}));const locked=Number(await canvas.getAttribute('data-pitch'));await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+30,y+20,{steps:4});await p.mouse.up();await p.waitForTimeout(100);assert.equal(Number(await canvas.getAttribute('data-pitch')),locked);
  const stick=p.getByRole('button',{name:'視点スティック',exact:true}),r=await stick.boundingBox(),cdp=await p.context().newCDPSession(p),touch={id:2,x:r.x+r.width/2,y:r.y+r.height/2+30};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch]});await p.waitForTimeout(250);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});const changed=Number(await canvas.getAttribute('data-pitch'));assert(changed<locked);await p.waitForTimeout(120);assert.equal(Number(await canvas.getAttribute('data-pitch')),changed,'Released stick stops camera');assert(await element.evaluate(e=>e.isConnected),'Settings do not recreate WebGL renderer');
  const movement=p.getByRole('button',{name:'上へ移動',exact:true}),m=await movement.boundingBox(),walk={id:1,x:m.x+m.width/2,y:m.y+m.height/2},look={id:2,x:r.x+r.width/2+25,y:r.y+r.height/2};const sent=()=>p.evaluate(()=>window.sent.filter(a=>a.type==='move'||a.type==='voxel-move').length);const facingBefore=Number(await canvas.getAttribute('data-facing')),moves=await sent();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[walk]});await p.waitForTimeout(120);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[walk,look]});await p.waitForTimeout(200);const both=await sent();assert(both>moves,'Movement continues while second finger looks');const rightTurn=(Number(await canvas.getAttribute('data-facing'))-facingBefore+4)%4;assert(rightTurn>0&&rightTurn<1,'Pushing camera stick right turns right');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[walk]});await p.waitForTimeout(180);assert(await sent()>both,'Releasing look finger does not release movement');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await p.screenshot({path:'tmp/rpg-camera-stick-world.png'});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);console.log('PASS: actual 3D drag, reversed pitch, stick-only disables drag, touch stick and release, level reset, live preferences without renderer recreation.');
}finally{await browser?.close();await server?.close();await fs.rm(file,{force:true});}
