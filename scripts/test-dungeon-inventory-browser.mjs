import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const entry = `.dungeon-inventory-${process.pid}.tsx`;
let server, browser;
try {
  await fs.writeFile(entry, `import React from 'react';
import { createRoot } from 'react-dom/client';
import Dungeons from './src/components/SchoolDungeonRPG';
import Dungeons2 from './src/components/SchoolDungeonRPG2';
import './src/styles.css';
const Game = location.search.includes('series=2') ? Dungeons2 : Dungeons;
createRoot(document.getElementById('root')).render(<Game languageMode="ENGLISH" onBack={()=>{}}/>);`);
  server = await createServer({
    cacheDir: 'node_modules/.vite-dungeon-inventory',
    optimizeDeps: { noDiscovery: true, include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'three'] },
    server: { host: '127.0.0.1', port: 0, hmr: false }, logLevel: 'error',
    plugins: [{
      name: 'dungeon-inventory-fixture',
      enforce: 'pre',
      transform(code, id) {
        if (id.endsWith('/school-dungeon/useSchoolAdventure.ts')) {
          return code.replace(' return {known:', ' const api={known:').replace('\n };\n}\nexport type',
            '\n };\n(window as any).__adventure=api;(window as any).__bridge=b.current;return api;\n}\nexport type');
        }
      },
      configureServer(s) {
        s.middlewares.use('/__inventory', async (req, res) => {
          res.setHeader('Content-Type', 'text/html');
          res.end(await s.transformIndexHtml(req.url, `<meta name="viewport" content="width=device-width,initial-scale=1">
            <body style="margin:0"><div id="root" style="height:100dvh;width:100vw"></div>
            <script type="module" src="/${entry}"></script>`));
        });
      },
    }],
  });
  await server.listen();
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', e => { errors.push(e.message); console.error(e.message); });
  page.setDefaultTimeout(60000);
  const out = 'tmp/dungeon-inventory-qa';
  await fs.mkdir(out, { recursive: true });
  const home = `http://127.0.0.1:${server.httpServer.address().port}/__inventory`;

  for (const series of [1, 2]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${home}?series=${series}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'New game', exact: true }).click();
    await page.getByRole('button', { name: 'Begin this journey', exact: true }).click();
    await page.locator('.d2-pixel-town').waitFor();
    await page.evaluate(() => window.__adventure.departRoute('STORY'));
    await page.waitForFunction(() => window.__adventure.state.place === 'DUNGEON');
    await page.evaluate(async () => {
      const { ADVENTURE_ITEMS } = await import('/src/components/school-dungeon/adventure.ts');
      const a = window.__adventure, b = window.__bridge;
      a.setPanel(null);
      Object.assign(a.state, { place: 'DUNGEON', floor: 2, town: false, scene: undefined, events: {}, terrain: {},
        pendingStory: undefined, storySeen: [1], chronicle: { version: 1, mode: 'STORY', heroId: a.hero.id, seen: [0, 1, 2], choices: {} } });
      b.setPlayer(p => ({ ...p, x: 6, y: 7, hp: 100, maxHp: 100, status: {}, dir: { x: 1, y: 0 }, equipment: {} }));
      b.setMap(b.map.map(row => row.map(() => 'FLOOR')));
      b.setEnemies([]); b.setFloorItems([]); b.setTraps([]);
      b.setInventory([
        { ...ADVENTURE_ITEMS.BAG_SAVE, id: 'qa-bag', contents: [] },
        { ...b.catalog.FOOD_ONIGIRI, id: 'qa-food', name: 'Apple ration' },
        { id: 'qa-weapon', type: 'QA_WEAPON', name: 'Zebra pencil', category: 'WEAPON', power: 3 },
      ]);
    });
    await page.waitForFunction(() => window.__bridge.inventory.some(i => i.id === 'qa-bag') && !window.__adventure.blocksInput());

    for (const [width, height, orientation] of [[390, 844, 'portrait'], [320, 568, 'portrait'], [844, 390, 'landscape'], [667, 320, 'landscape']]) {
      await page.setViewportSize({ width, height });
      const pad = page.locator(`.dungeon-${orientation}-dpad`).filter({ visible: true });
      const facing = pad.getByRole('button', { name: 'Face only', exact: true });
      const box = await pad.boundingBox(), face = await facing.boundingBox();
      assert(box && face && face.y - box.y - box.height >= 18, `D${series} ${width}×${height} has a separate touch gap`);
      assert(face.y >= 0 && face.y + face.height <= height, 'Facing button stays onscreen');
      assert(await facing.evaluate(button => {
        const r = button.getBoundingClientRect();
        return button.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
      }), 'Facing button is not obscured');
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.keyboard.press('x');
    const pouch = page.getByRole('dialog', { name: 'Inventory' });
    await pouch.waitFor();
    if (series === 2) {
      assert.equal(await pouch.evaluate(el => el.classList.contains('dungeon-pouch-classic')), true, 'Preference carries across the series');
    } else {
      await pouch.getByRole('button', { name: 'Game Boy style' }).tap();
    }
    assert(await pouch.evaluate(el => Boolean(el.closest('.dungeon-game-panel'))), 'Game Boy menu is inside the playfield');
    const order = () => page.evaluate(() => window.__bridge.inventory.map(i => i.id));
    await pouch.getByRole('button', { name: 'Sort by name' }).tap();
    assert.equal((await order())[0], 'qa-food');
    await pouch.getByRole('button', { name: 'Sort by type' }).tap();
    assert.deepEqual(await order(), ['qa-weapon', 'qa-food', 'qa-bag']);
    await page.screenshot({ path: `${out}/d${series}-classic.png` });
    await page.setViewportSize({ width: 667, height: 320 });
    await pouch.getByRole('button', { name: 'Sort by type' }).tap();
    await page.setViewportSize({ width: 390, height: 844 });

    // Use and close the same bag through both real menus without manually dismissing inventory.
    for (const layout of ['classic', 'standard']) {
      if (layout === 'standard') await pouch.getByRole('button', { name: 'Standard view' }).tap();
      const index = (await order()).indexOf('qa-bag');
      await pouch.locator(`[data-menu-item="${index}"]`).tap();
      await pouch.locator('.dungeon-pouch-detail .item-menu-actions button').first().tap();
      const bag = page.locator('.school-adventure-panel').filter({ has: page.getByRole('button', { name: 'Break and empty' }) });
      await bag.waitFor();
      assert.equal(await pouch.count(), 0, 'Bag opens directly and replaces the pouch');
      const stored = bag.getByRole('button', { name: 'Store a supply' });
      await stored.tap();
      await page.waitForFunction(() => window.__bridge.inventory.find(i => i.id === 'qa-bag').contents.length === 1);
      const item = await page.evaluate(() => window.__bridge.inventory.find(i => i.id === 'qa-bag').contents[0].id);
      await bag.locator('.supply-collection .item-menu-slot').last().tap();
      await bag.getByRole('button', { name: 'Take out', exact: true }).tap();
      await page.waitForFunction(id => window.__bridge.inventory.some(i => i.id === id), item);
      await bag.getByRole('button', { name: 'Resume', exact: true }).tap();
      await bag.waitFor({ state: 'detached' });
      await page.keyboard.press('x');
      await pouch.waitFor();
    }
    await pouch.getByRole('button', { name: 'Game Boy style' }).tap();
    await pouch.getByRole('button', { name: 'Close', exact: true }).tap();
    await pouch.waitFor({ state: 'detached' });
    console.log(`PASS D${series}: portrait and landscape touch gap, both sort orders, saved display mode, immediate container open/store/take out.`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  await server?.close();
  await fs.rm(entry, { force: true });
}
