import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { createServer } from "vite";
import { chromium } from "playwright";
const shots = "tmp/schoolyard-survivor-ui";
await mkdir(shots, { recursive: true });
let server, browser;
const html =
  '<html><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><body style="margin:0"><div id="root" style="height:100dvh"></div><script type="module" src="/scripts/fixtures/schoolyard-survivor.tsx"></script></body></html>';
try {
  server = await createServer({
    configFile: false,
    cacheDir: "node_modules/.vite-survivor-qa",
    optimizeDeps: { noDiscovery: true, include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime", "lucide-react"] },
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
              `    (window as any).__survivor={gameState,player,enemies,projectiles,enemyBullets,gems,particles,magicFx,hazards,action,time,frameCount,xp,nextLevelXp,level,score,weaponsRef,passivesRef,selectedHero,selectedField,obstacles,keys,activeTimeouts,scheduleShot,update,draw,spawnEnemy,activateDash,activateBurst,applyDamage,fireWeapon,damagePlayer,handleMathComplete,selectUpgrade,clearInput,handleRestart,spriteCache,joystickRef,touchAnchor};\n    return (\n        <div data-gamepad-survivor-live=`,
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

  for (const [width,height] of [[1280,720],[390,844],[844,390],[320,568]]) {
    const p=await browser.newPage({viewport:{width,height},hasTouch:true});
    p.on('pageerror',e=>errors.push(e.message));
    await p.addInitScript(()=>localStorage.setItem('pixel_spire_theme_clear_counts_v1',JSON.stringify({elementary:100,'high-school':100,magic:100})));
    await p.clock.install();
    await p.goto(base,{waitUntil:'domcontentloaded',timeout:90000});
    await p.locator('.sy-title-copy h1').waitFor({timeout:90000});
    await p.locator('[data-title-art] img').evaluate(img=>img.decode());
    const shot=async(name,selectors)=>{await p.clock.runFor(400);for(const sel of selectors){const b=await p.locator(sel).first().boundingBox();assert(b&&b.x>=-1&&b.y>=-1&&b.x+b.width<=width+1&&b.y+b.height<=height+1,`${width} ${name} ${sel} ${JSON.stringify(b)}`);}await p.screenshot({path:`${shots}/${name}-${width}.png`});};
    await shot('title',['.sy-title-copy .sy-primary']);
    await p.locator('.sy-title-copy .sy-primary').click();
    await shot('selection',['.sy-roster','.sy-fields','.sy-selection-content footer .sy-primary']);
    await p.locator('.sy-selection-content footer .sy-primary').click();
    await shot('combat',['.sy-experience','.sy-vitals','.sy-clock','.sy-actions']);
    await p.evaluate(()=>{const g=window.__survivor;g.enemies.current=[];g.xp.current=9;g.nextLevelXp.current=10;g.gems.current=[{id:1,x:g.player.current.x,y:g.player.current.y,value:1,collected:false}];g.update();});
    await p.clock.runFor(30);await p.evaluate(()=>window.__survivor.handleMathComplete(3));
    await p.clock.runFor(30);await p.locator('.sy-upgrade-grid').waitFor();
    await shot('upgrade',['.sy-upgrade-heading','.sy-upgrade-grid','.sy-upgrade-card:last-child']);
    for(const card of await p.locator('.sy-upgrade-card').all()){const info=await card.evaluate(el=>({height:el.clientHeight,scroll:el.scrollHeight}));assert(info.scroll<=info.height+2,`clipped upgrade ${width} ${JSON.stringify(info)}`);}
    await p.locator('.sy-upgrade-card').first().click();
    await p.evaluate(()=>{const g=window.__survivor;g.player.current.flashTime=0;g.damagePlayer(99999,0,0,0);});
    await p.clock.runFor(60);await p.locator('.sy-results').waitFor();
    await shot('result',['.sy-result-stats','.sy-results .sy-primary','.sy-results .sy-secondary']);
    await p.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS survivor title artwork, selection/start, combat HUD, three upgrade cards and results at desktop/portrait/landscape/small phone');
} finally {await browser?.close();await server?.close();}
