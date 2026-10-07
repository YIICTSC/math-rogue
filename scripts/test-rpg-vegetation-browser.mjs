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
  const fruit=await p.evaluate(async()=>{const V=await import('/src/rpg/voxel.ts'),L=await import('/src/rpg/life.ts'),w=window.room.world;let fruit;for(let z=5;z<100&&!fruit;z++)for(let x=5;x<180&&!fruit;x++)if(L.natureAt(w,z*192+x)?.sprite===17&&!V.protectedVoxel(w,x,z))fruit={x,z};if(!fruit)throw Error('No natural fruit tree');const flat=[];for(let z=fruit.z-4;z<=fruit.z+4;z++)for(let x=fruit.x-4;x<=fruit.x+4;x++){flat.push(`${x},${z}`);if(x!==fruit.x||z!==fruit.z)w.tiles[z*192+x]='grass';}w.voxels={terrainVersion:2,legacyFlat:flat,revision:1,edits:{}};const me=w.players.local;me.x=fruit.x;me.y=fruit.z+4;me.position3D={x:fruit.x+.5,z:fruit.z+4.5,y:0};me.life.energy=6;me.life.bag.fruit=0;w.revision++;window.room.emit();return fruit;});
  await p.getByRole('button',{name:'2D / 3D',exact:true}).click();
  await p.evaluate(c=>{const w=window.room.world,me=w.players.local;me.position3D={x:c.x+.5,z:c.z+4.5,y:0};w.revision++;window.room.emit();},fruit);
  for(let i=0;i<9;i++)await p.getByRole('button',{name:'視点スティック'}).press('ArrowUp');
  await p.waitForFunction(()=>document.querySelector('.rpg-voxel-target')?.textContent.includes('果実'));
  console.log('Natural fruit targeted from ground');
  await p.screenshot({path:'/workspace/scratch/lifestyle-screens/rpg-fruit-blocks.png'});
  await p.getByRole('button',{name:'⛏ 壊す'}).click();
  await p.waitForFunction(c=>window.room.world.voxels.edits[`${c.x},3,${c.z}`]===null,fruit);
  assert.equal(await p.evaluate(()=>window.room.world.players.local.life.bag.fruit),1);
  await p.getByRole('button',{name:'スロット設定'}).click();
  const select=p.getByLabel('選択スロットの素材');for(const block of ['leaves','frostleaves','fruit','bush','reed','herb','cactus'])assert(await select.locator(`option[value="${block}"]`).count());await select.selectOption('fruit');
  await p.getByRole('button',{name:'スロット設定'}).click();
  for(let i=0;i<3;i++)await p.getByRole('button',{name:'視点スティック'}).press('ArrowDown');
  await p.waitForFunction(()=>document.querySelector('.rpg-voxel-target')?.textContent.includes('木の葉'));
  await p.getByRole('button',{name:'＋ 置く'}).click();
  await p.waitForFunction(()=>Object.values(window.room.world.voxels.edits).includes('fruit'));
  assert.equal(await p.evaluate(()=>window.room.world.players.local.life.bag.fruit),0);
  assert.equal(await p.evaluate(()=>window.room.world.players.local.life.energy),5.8);
  assert.equal(await p.locator('.rpg-voxel-slots button').count(),4);assert.deepEqual(errors,[]);
  console.log('PASS: natural fruit/leaves rendering, real ray harvest/placement, inventory and energy, all vegetation slot choices.');
} finally {
  await browser?.close();
  await server?.close();
  await fs.rm(file, { force: true });
}
