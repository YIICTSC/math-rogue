import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createServer } from "vite";
import { chromium } from "playwright";
const file = `.world3d-fixture-${process.pid}.tsx`;
let server, browser, page;
const errors = [];
try {
  const source = await fs.readFile(
    "scripts/test-rpg-mobile-browser.mjs",
    "utf8",
  );
  const fixture = source.match(/const fixture=`([\s\S]*?)`;\r?\nlet server/)[1];
  await fs.writeFile(file, fixture);
  server = await createServer({
    cacheDir: "node_modules/.vite-building-test",
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
    server: { port: 4231, strictPort: true, host: "127.0.0.1", hmr: false },
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
  page=p;p.setDefaultTimeout(90000);
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console",m=>{if(m.type()==="error"||m.text().includes("Storybook"))console.log(m.type(),m.text());});
  await p.addInitScript(()=>localStorage.setItem("rpg-preferences-v1",JSON.stringify({mapQuality:"low"})));
  await p.goto("http://127.0.0.1:4231/world3d");
  await p.getByRole("button", { name: "冒険をはじめる" }).click();
  await p.waitForFunction(() => window.room?.world);
  await p.evaluate(() => window.prepare());
  await p.evaluate(()=>{const w=window.room.world,me=w.players.local;w.sites=[];w.voxels={terrainVersion:2,legacyFlat:[],revision:1,edits:{}};for(let z=18;z<40;z++)for(let x=18;x<40;x++){w.tiles[z*192+x]='grass';w.voxels.legacyFlat.push(`${x},${z}`);}me.x=22;me.y=19;me.life.bag={plank:30,ore:30,wood:30};me.life.hoe=true;me.life.energy=6;for(let z=20;z<=25;z++)for(let x=20;x<=25;x++){w.voxels.edits[`${x},2,${z}`]='plank';if(x===20||x===25||z===20||z===25){w.voxels.edits[`${x},0,${z}`]='stone';w.voxels.edits[`${x},1,${z}`]='stone';}}w.voxels.edits['22,0,20']='door';delete w.voxels.edits['22,1,20'];w.revision++;window.room.emit();});
  console.log('Fixture ready');await p.getByRole('button',{name:/部屋を登録/}).click();
  await p.getByRole('button',{name:'自宅として登録',exact:true}).click();
  await p.waitForFunction(()=>window.room.world.voxelRooms?.length===1);console.log('Registered');
  await p.evaluate(()=>{const w=window.room.world,me=w.players.local;me.x=22;me.y=22;w.revision++;window.room.emit();});
  await p.getByRole('button',{name:'共用施設にする',exact:true}).click();
  await p.waitForFunction(()=>window.room.world.voxelRooms[0].shared);
  console.log('Shared');await p.getByRole('button',{name:'家具を作る',exact:true}).click();
  await p.getByRole('button',{name:/前に置く/}).click();
  await p.waitForFunction(()=>window.room.world.voxelRooms[0].furniture.length===1);console.log('Furnished');
  await p.evaluate(()=>{const w=window.room.world,me=w.players.local;me.x=30;me.y=30;w.revision++;window.room.emit();});await p.locator('.rpg-till-quick').click();await p.waitForFunction(()=>window.room.world.farm.people.local.plots.some(v=>v.x===30&&v.y===29));await p.evaluate(()=>{const w=window.room.world,me=w.players.local;me.x=22;me.y=22;w.revision++;window.room.emit();});
  await p.getByRole('button',{name:'2D / 3D',exact:true}).click();
  await p.locator('.rpg-world-3d canvas').waitFor();
  for(const [width,height] of [[390,844],[844,390],[1280,720]]){await p.setViewportSize({width,height});await p.waitForTimeout(200);const box=await p.locator('.rpg-voxel-room-panel').boundingBox();assert(box.x>=0&&box.x+box.width<=width+1,JSON.stringify({width,height,box}));}
  await p.setViewportSize({width:390,height:844});
  await p.evaluate(()=>{window.room.world.players.local.life.energy=0;window.room.world.revision++;window.room.emit();});
  await p.getByRole('button',{name:'⛏ 壊す'}).click();
  await p.locator('.main-challenge-screen').waitFor();
  const question=await p.locator('.basic-challenge-question h3').innerText(),nums=question.match(/(\d+)\s*[×x*]\s*(\d+)/);assert(nums,question);const answer=Number(nums[1])*Number(nums[2]);for(const button of await p.locator('.basic-challenge-options button').all())if(Number(await button.innerText())===answer){await button.click();break;}
  await p.waitForFunction(()=>window.room.world.players.local.life.energy===2);
  for(let i=0;i<2;i++){await p.waitForTimeout(1200);const q=await p.locator('.basic-challenge-question h3').innerText(),ns=q.match(/(\d+)\s*[×x*]\s*(\d+)/),n=Number(ns[1])*Number(ns[2]);for(const b of await p.locator('.basic-challenge-options button').all())if(Number(await b.innerText())===n){await b.click();break;}}await p.locator('.main-challenge-screen').waitFor({state:'detached'});await p.evaluate(()=>{const w=window.room.world;w.players.local.life.energy=0;w.revision++;window.room.emit();});await p.getByRole('button',{name:'＋ 置く'}).click();await p.locator('.main-challenge-screen').waitFor();
  assert.deepEqual(errors,[]);
  console.log('PASS: room registration/shared mode/furniture placement, responsive room UI and 3D exhausted action opens real recovery question and restores energy, exhausted placement opens learning, crafted-hoe shortcut tills one cell ahead.');
} catch(e){if(page){console.log(await page.evaluate(()=>({text:document.body.innerText,player:window.room?.world.players.local,plots:window.room?.world.farm?.people.local?.plots,sent:window.sent?.slice(-5)})));await page.screenshot({path:'tmp/voxel-building-error.png'});}throw e;} finally {await browser?.close();await server?.close();await fs.rm(file,{force:true});}
