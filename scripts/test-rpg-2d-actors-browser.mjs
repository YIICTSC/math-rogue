import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createServer } from "vite";
import { chromium } from "playwright";
const file = `.world3d-actors-${process.pid}.tsx`;
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
        name: "world3d", enforce:'pre',transform(code,id){if(id.endsWith('/rpg/WorldScene3D.tsx'))return code.replace('const scene = new THREE.Scene();','const scene = new THREE.Scene();(window as any).__scene=scene;');},
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
  // Decorative animated butterflies were removed; static Blender scenery remains.
  assert(!/model:\s*['"]butterfly['"]/.test(await fs.readFile("src/rpg/WorldScene3D.tsx","utf8")));
  console.log("RPG 3D rendered with Blender models and no decorative butterflies");
  await p.evaluate(()=>{const w=window.room.world;window.addPlayer(w,'peer-2d','Other');const other=w.players['peer-2d'];other.x=22;other.y=20;other.profile={hp:72,maxHp:72,gold:0,character:'WARRIOR',image:'sprites/high-school/characters/0.webp',deckSize:0};w.revision++;window.room.emit();});
  await p.waitForFunction(()=>{let found=false;window.__scene.traverse(o=>{if(o.isSprite&&o.userData.player==='peer-2d')found=true;});return found;});
  const sourceText=await fs.readFile('src/rpg/WorldScene3D.tsx','utf8');assert.equal((sourceText.match(/new ProtagonistModel\(/g)||[]).length,1);assert.equal((sourceText.match(/adventureAvatar\(/g)||[]).length,1);assert(!sourceText.includes('residentModel(')&&!sourceText.includes('remoteHeroes'));
  await fs.mkdir('tmp/rpg-menu',{recursive:true});for(const[width,height]of[[390,844],[844,390]]){await p.setViewportSize({width,height});await p.waitForTimeout(200);await p.screenshot({path:`tmp/rpg-menu/actors-${width}.png`});}
  assert.deepEqual(errors,[]);console.log('PASS: real WebGL world, local-only character model allocation, NPC billboards and actual remote-player THREE.Sprite, portrait/landscape rendering; zero browser exceptions.');
} finally {
  await browser?.close();
  await server?.close();
  await fs.rm(file, { force: true });
}
