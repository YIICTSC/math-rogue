import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const out = process.env.RPG_MACHINERY_QA || 'tmp/rpg-machinery-qa';
const file = `.rpg-machinery-fixture-${process.pid}.tsx`;
let server, browser, page;
const errors = [];
try {
  await fs.mkdir(out, { recursive: true });
  const fixture = `
    import React from 'react';
    import {createRoot} from 'react-dom/client';
    import './src/styles.css';
    import RpgOnline from './src/rpg/RpgOnline';
    import {WIDTH} from './src/rpg/engine';
    import {farmOf} from './src/rpg/farm/model';
    import {recordMachineEdit} from './src/rpg/machinery';
    import {readWorldSave} from './src/rpg/worldSave';
    const player={id:'WARRIOR',currentHp:72,maxHp:72,gold:100,deck:[],relics:[],imageData:''};
    localStorage.setItem('rpg-preferences-v1',JSON.stringify({mapView:'2D',mapQuality:'low'}));
    window.readSandboxSave=readWorldSave;
    function setup(r) {
      window.room=r;
      window.seedSandbox=()=>{
      const w=r.world,p=w.players.local;
      w.sites=w.sites.filter(s=>Math.abs(s.x-20)+Math.abs(s.y-20)>12);
      w.voxels={edits:{},revision:1,terrainVersion:2,legacyFlat:[],placedBy:{},rotations:{}};
      for(let z=12;z<27;z++)for(let x=12;x<29;x++){
        w.tiles[z*WIDTH+x]='grass';w.voxels.legacyFlat.push(x+','+z);
        w.voxels.edits[x+',0,'+z]=null;w.voxels.edits[x+',1,'+z]=null;
      }
      p.x=20;p.y=20;p.position3D={x:20.5,y:0,z:20.5};
      p.life.energy=6;p.life.bag.crystal_lever=3;p.life.bag.wood=1;
      for(const [x,z,block]of [[21,19,'crystal_wire'],[22,19,'crystal_lamp']]){
        const key=x+',0,'+z;w.voxels.edits[key]=block;w.voxels.placedBy[key]=p.id;
        recordMachineEdit(w,x,0,z,null,block);
      }
      const f=farmOf(w,p);f.x=14;f.y=15;
      f.animals=['cow','sheep','goat','pig','duck','chicken'].map((kind,i)=>({id:'qa-animal-'+i,kind,name:kind,born:0,feed:90,brush:90,clean:90,bond:60,health:100,progress:0,ready:0}));
        w.revision++;r.emit();
      };
    }
    const resume=await readWorldSave();
    createRoot(document.getElementById('root')).render(
      <RpgOnline initialIntent="solo" resumeSave={resume} player={player} active languageMode="JAPANESE" onRoom={setup}
        onSnapshot={s=>window.snapshot=s} onSetup={()=>{}} onClose={()=>{}}/>
    );
  `;
  await fs.writeFile(file, fixture);
  server = await createServer({
    cacheDir: 'node_modules/.vite-rpg-machinery-test',
    optimizeDeps: { noDiscovery: true, entries: [], include: ['react','react-dom','react-dom/client','react/jsx-runtime','peerjs','three'] },
    server: { host: '127.0.0.1', port: 0, hmr: false }, logLevel: 'error',
    plugins: [{ name: 'rpg-machinery-test', configureServer(s) {
      s.middlewares.use('/__machinery', async (req, res) => {
        res.setHeader('Content-Type', 'text/html');
        res.end(await s.transformIndexHtml(req.originalUrl || req.url,
          `<html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><div id="root"></div><script type="module" src="/${file}"></script></body></html>`));
      });
    } }],
  });
  await server.listen();
  const relativeMouse=process.env.RPG_QA_RELATIVE_MOUSE;
  browser = await chromium.launch({
    headless: !relativeMouse, executablePath: process.env.RPG_QA_BROWSER,
    args: ['--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader'],
  });
  page = await browser.newPage({ viewport: { width: 1024, height: 640 } });
  page.setDefaultTimeout(60000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type()==='error' && !/Failed to load resource/.test(message.text())) console.error(message.text().slice(0,1500));
  });
  page.on('response', response => {
    if (response.status() >= 500) console.error(response.status(), new URL(response.url()).pathname);
  });
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__machinery`, { waitUntil:'domcontentloaded', timeout:90000 });
  await page.waitForFunction(() => window.room?.world?.players.local);
  await page.evaluate(() => window.seedSandbox());
  console.log('Solo world started.');
  const canvas = page.locator('.rpg-canvas');
  await page.getByRole('button', { name: '高さ断面' }).click();
  await canvas.focus();
  await canvas.press('ArrowUp');
  await page.getByRole('button', { name: '建築工房', exact: true }).click();
  const lever = page.locator('[data-material="crystal_lever"]');
  await lever.getByRole('button', { name: 'レバー', exact: true }).click();
  await page.locator('.rpg-selection-detail').getByRole('button', { name: '登録' }).click();
  await page.getByRole('button', { name: '置く' }).click();
  await page.waitForFunction(() => window.snapshot.world.voxels.edits['20,0,19']==='crystal_lever');
  await page.getByRole('button', { name: '調べる', exact: true }).click();
  await page.getByRole('button', { name: '起動', exact: true }).click();
  await page.waitForFunction(() => window.snapshot.world.voxels.machinery.devices['22,0,19'].signal===15);
  console.log('Placed and powered the circuit in 2D.');
  await page.getByLabel('表示レイヤー').selectOption('circuit');
  await page.screenshot({ path: `${out}/circuit-layer-desktop.png` });
  await page.getByRole('button',{name:'建築工房',exact:true}).click();
  await page.getByRole('button',{name:'技術研究',exact:true}).click();
  await page.getByRole('spinbutton',{name:'Z',exact:true}).fill('19');
  await page.getByRole('button',{name:'動作を記録する',exact:true}).click();
  await page.getByRole('button',{name:'達成済み',exact:true}).waitFor();
  await page.getByRole('button',{name:/閉じる/}).click();
  await page.getByRole('button',{name:'建築工房',exact:true}).click();
  await page.getByRole('button',{name:'設計図',exact:true}).click();
  await page.getByText('設計図の読み込みと書き出し',{exact:true}).click();
  await page.getByLabel('設計図データ').fill(JSON.stringify({
    version:1,name:'試験の板',cells:[{x:0,y:0,z:0,block:'wood',rotation:0}],
  }));
  await page.getByRole('button',{name:'読み込み',exact:true}).click();
  await page.getByRole('group',{name:'建築する位置'}).getByRole('spinbutton',{name:'X',exact:true}).fill('22');
  await page.getByRole('button',{name:'ワールドで仮表示'}).click();
  await page.locator('.rpg-blueprint-tools').getByRole('button',{name:'まとめて建築'}).click();
  await page.waitForFunction(()=>window.snapshot.world.voxels.edits['22,0,20']==='wood');
  await page.getByRole('button',{name:'仮表示を閉じる'}).click();
  await page.getByRole('button',{name:'建築工房',exact:true}).click();
  await page.getByRole('button',{name:'設計図',exact:true}).click();
  await page.waitForFunction(()=>Date.now()-window.snapshot.world.players.local.life.workshopAt>=500);
  await page.getByRole('button',{name:'直前の建築を取り消す'}).click();
  await page.waitForFunction(()=>!window.snapshot.world.voxels.edits['22,0,20']);
  await page.getByRole('button',{name:/閉じる/}).click();
  const before = await page.evaluate(() => window.snapshot.world.players.local.position3D.y);
  await page.getByRole('button', { name: '高さを下げる' }).click();
  assert.equal(await canvas.getAttribute('data-machine-layer'), '-1');
  assert.equal(await page.evaluate(() => window.snapshot.world.players.local.position3D.y), before);
  await page.getByRole('button', { name: '高さを上げる' }).click();
  await page.getByRole('button', { name: '2D / 3D' }).click();
  const scene = page.getByTestId('rpg-world-3d');
  await scene.waitFor();
  await page.waitForFunction(() => Number(document.querySelector('[data-testid=rpg-world-3d]')?.dataset.creatureModels)>=6);
  console.log('Loaded six 3D creatures.');
  await page.screenshot({ path: `${out}/rpg-animals-3d.png`,timeout:45000 });
  await page.getByRole('button', { name: 'マウス視点', exact: true }).click();
  await page.waitForFunction(() => document.pointerLockElement?.getAttribute('data-testid')==='rpg-world-3d');
  const facingBefore = Number(await scene.getAttribute('data-facing'));
  await page.evaluate(()=>document.addEventListener('mousemove',e=>{
    if(document.pointerLockElement && e.isTrusted && e.movementX) window.nativeRelativeMotion=true;
  }));
  if (relativeMouse) {
    execFileSync(relativeMouse,['121','-52']);
    await page.waitForFunction(() => window.nativeRelativeMotion===true);
  } else {
    // CDP absolute mouse moves report zero relative motion under lock in headless Chromium.
    await page.evaluate(()=>document.dispatchEvent(new MouseEvent('mousemove',{movementX:121,movementY:-52})));
  }
  await page.waitForFunction(before => Math.abs(Number(document.querySelector('[data-testid=rpg-world-3d]').dataset.facing)-before)>.05,facingBefore);
  await page.screenshot({ path: `${out}/mouse-look-3d.png`,timeout:45000 });
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.pointerLockElement);
  assert.equal(await page.evaluate(() => window.snapshot.world.voxels.machinery.devices['22,0,19'].signal),15);
  await page.getByRole('button',{name:'カメラ切替',exact:true}).click();
  await page.getByRole('button',{name:'マウス視点',exact:true}).click();
  await page.waitForFunction(()=>document.pointerLockElement?.dataset.testid==='rpg-world-3d');
  await page.evaluate(()=>{
    const canvas=document.pointerLockElement;
    const facing=Number(canvas.dataset.facing),pitch=Number(canvas.dataset.pitch),eye=Number(canvas.dataset.eyeHeight);
    const yawDelta=((6-facing)%4)-2,pitchGoal=Math.atan2(.32-eye,1);
    document.dispatchEvent(new MouseEvent('mousemove',{movementX:-yawDelta/.004,movementY:-(pitchGoal-pitch)/.006}));
  });
  await page.waitForFunction(()=>document.querySelector('.rpg-voxel-target')?.textContent?.includes('レバー'));
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.pointerLockElement);
  await page.locator('.rpg-voxel-dock').getByRole('button',{name:/調べる/}).click();
  await page.locator('.rpg-3d-device-panel').getByRole('button',{name:'切る',exact:true}).click();
  await page.waitForFunction(()=>window.snapshot.world.voxels.machinery.devices['22,0,19'].signal===0);
  await page.locator('.rpg-3d-device-panel').getByRole('button',{name:'閉じる',exact:true}).click();
  const dragStart=Number(await scene.getAttribute('data-facing'));
  const area=await scene.boundingBox();
  await page.mouse.move(area.x+area.width*.43,area.y+area.height*.39);
  await page.mouse.down();
  await page.mouse.move(area.x+area.width*.52,area.y+area.height*.43,{steps:6});
  await page.mouse.up();
  await page.waitForFunction(start=>Math.abs(Number(document.querySelector('[data-testid=rpg-world-3d]').dataset.facing)-start)>.04,dragStart);
  await page.getByRole('button',{name:'2D / 3D'}).click();
  await canvas.waitFor();
  assert.equal(await page.evaluate(() => window.snapshot.world.players.local.position3D.y), before);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button',{name:'高さ断面'}).click();
  const layer=await page.locator('.rpg-layer-dock').boundingBox();
  const settings=await page.locator('.rpg-settings-map-button').boundingBox();
  assert(layer.y>=settings.y+settings.height,'Layers must not overlap the existing mobile HUD.');
  await page.screenshot({ path: `${out}/circuit-layer-mobile.png` });
  await page.getByRole('button',{name:'手帳',exact:true}).click();
  await page.locator('.rpg-creature-journal summary').click();
  await page.getByLabel('成長段階',{exact:true}).selectOption('young');
  await page.getByRole('button',{name:'珍しい毛色',exact:true}).click();
  const juvenile=page.locator('.rpg-creature-display img');
  await juvenile.evaluate(image=>image.decode());
  assert.match(await juvenile.getAttribute('src'),/cow-young-rare\.webp$/);
  await page.screenshot({ path: `${out}/creature-growth-mobile.png` });
  await page.getByLabel('生き物',{exact:true}).selectOption('frog');
  await page.getByRole('button',{name:'3Dで見る',exact:true}).click();
  const rotate=page.getByRole('slider',{name:'回転',exact:true});
  await rotate.waitFor();
  await rotate.press('ArrowRight');
  await page.screenshot({ path: `${out}/creature-journal-mobile.png` });
  await page.locator('.rpg-detail-backdrop').click({position:{x:4,y:4}});
  await page.getByRole('button',{name:'部屋と操作の詳細',exact:true}).click();
  await page.getByRole('button',{name:'ワールドを保存する',exact:true}).click();
  await page.getByText('ワールドを保存しました。',{exact:true}).waitFor();
  const saved=await page.evaluate(()=>window.readSandboxSave());
  assert.equal(saved.world.voxels.machinery.devices['22,0,19'].signal,0);
  assert(saved.world.players.local.life.research.includes('lever-lamp'));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.snapshot?.world?.voxels?.edits['20,0,19']==='crystal_lever');
  assert.equal(await page.evaluate(()=>window.snapshot.world.voxels.machinery.devices['22,0,19'].signal),0);
  assert.deepEqual(errors,[]);
  console.log('PASS RPG UI, blueprint place/undo, circuit across modes, mouse lock and drag, juvenile model journal and IndexedDB restore.');
} catch (error) {
  console.error('Browser errors:', errors, (await page?.locator('body').innerText({timeout:3000}).catch(() => ''))?.slice(0,1600));
  console.error(await page?.evaluate(() => {
    const w = window.snapshot?.world;
    return w && { player: w.players.local?.position3D, edits: Object.entries(w.voxels?.edits || {}).filter(([,block])=>block), started: w.started };
  }));
  await page?.screenshot({path:`${out}/failure.png`,timeout:5000}).catch(() => {});
  throw error;
} finally {
  await browser?.close();
  await server?.close();
  await fs.rm(file,{force:true});
}
