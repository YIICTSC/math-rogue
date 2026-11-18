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
import { useXboxControllerNavigation } from './src/hooks/useXboxControllerNavigation';
import './src/styles.css';
const Game = location.search.includes('series=2') ? Dungeons2 : Dungeons;
function Fixture(){useXboxControllerNavigation();return <Game languageMode="ENGLISH" onBack={()=>{}}/>;}
createRoot(document.getElementById('root')).render(<Fixture/>);`);
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
  await page.addInitScript(() => {
    const released = { pressed: false, value: 0, touched: false };
    window.testPadButtons = Array.from({ length: 16 }, () => released);
    const pad = { index: 0, id: 'Test pad', connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: window.testPadButtons };
    Object.defineProperty(navigator, 'getGamepads', { value: () => [pad] });
  });
  const pressPad = index => page.evaluate(async index => {
    const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    window.testPadButtons[index] = { pressed: true, value: 1, touched: true };
    await frames();
    window.testPadButtons[index] = { pressed: false, value: 0, touched: false };
    await frames();
  }, index);
  const focusedLabel = () => page.evaluate(() => document.activeElement.textContent.trim());
  const blur = () => page.evaluate(() => document.activeElement.blur());
  const errors = [];
  page.on('pageerror', e => { errors.push(e.message); console.error(e.stack); });
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
        { ...b.catalog.FOOD_ONIGIRI, id: 'qa-food', name: 'Apple ration', desc: 'Restore some hunger after a long climb. '.repeat(12) },
        { id: 'qa-weapon', type: 'QA_WEAPON', name: 'Zebra pencil', desc: 'A pencil.', category: 'WEAPON', power: 3 },
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
      await pouch.getByRole('button', { name: 'Retro' }).tap();
    }
    assert(await pouch.evaluate(el => Boolean(el.closest('.dungeon-game-panel'))), 'Retro menu is inside the playfield');
    const order = () => page.evaluate(() => window.__bridge.inventory.map(i => i.id));
    await pouch.getByRole('button', { name: 'Sort by name' }).tap();
    assert.equal((await order())[0], 'qa-food');
    await pouch.getByRole('button', { name: 'Sort by type' }).tap();
    assert.deepEqual(await order(), ['qa-weapon', 'qa-food', 'qa-bag']);
    await pouch.locator('[data-menu-item="1"]').tap();
    for (const [width, height] of [[320, 568], [667, 320], [390, 844]]) {
      await page.setViewportSize({ width, height });
      assert(await pouch.evaluate(menu => {
        const header = menu.querySelector('header').getBoundingClientRect();
        const rows = menu.querySelector('.dungeon-pouch-collection').getBoundingClientRect();
        const buttons = [...menu.querySelectorAll('header [data-menu-tool]')].map(el => el.getBoundingClientRect());
        return buttons.length === 3 && Math.abs(header.bottom - rows.top) <= 1 && buttons.every(
          box => Math.abs(box.top - buttons[0].top) <= 1 && box.right <= header.right,
        );
      }), `D${series} ${width}×${height} keeps the tools in the header and gives the space below to the list`);
      const hiddenActions = await pouch.locator('.item-menu-actions').evaluate(actions => {
        const detail = actions.closest('.dungeon-pouch-detail').getBoundingClientRect();
        return [...actions.querySelectorAll('button')].filter(button => button.getBoundingClientRect().bottom > detail.bottom)
          .map(button => button.textContent);
      });
      assert.deepEqual(hiddenActions, [], `D${series} ${width}×${height} keeps every action visible with a long description`);
    }
    await page.screenshot({ path: `${out}/d${series}-classic.png` });
    await page.setViewportSize({ width: 667, height: 320 });
    await pouch.getByRole('button', { name: 'Sort by type' }).tap();
    await page.setViewportSize({ width: 390, height: 844 });

    await pouch.locator('[data-menu-item="1"]').tap();
    const [use, throwLabel, drop] = await pouch.locator('.item-menu-actions button').allTextContents();
    assert.equal(use, 'Use');
    assert.equal(throwLabel, 'Throw');
    assert.match(drop, /^Place (on Ground|at Feet)$/);
    await page.keyboard.press('ArrowLeft');
    assert.equal(await focusedLabel(), drop);
    await pressPad(15);
    assert.equal(await focusedLabel(), use);
    const right = page.locator('.dungeon-portrait-dpad > div:has(.lucide-arrow-right)');
    await blur();
    await right.tap();
    assert.equal(await focusedLabel(), throwLabel);
    await blur();
    await right.tap();
    assert.equal(await focusedLabel(), drop);
    await blur();
    await page.locator('.dungeon-ab-buttons').getByRole('button', { name: 'A', exact: true }).tap();
    await page.waitForFunction(() => window.__bridge.floorItems.some(e => e.itemData?.id === 'qa-food')
      && !window.__bridge.inventory.some(i => i.id === 'qa-food'));

    // Use and close the same bag through both real menus without manually dismissing inventory.
    for (const layout of ['classic', 'standard']) {
      if (layout === 'standard') await pouch.getByRole('button', { name: 'Standard view' }).tap();
      const index = (await order()).indexOf('qa-bag');
      await pouch.locator(`[data-menu-item="${index}"]`).tap();
      await page.keyboard.press('ArrowRight');
      assert.equal(await focusedLabel(), 'Use');
      await page.keyboard.press('Enter');
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
    await pouch.getByRole('button', { name: 'Retro' }).tap();
    await pouch.getByRole('button', { name: 'Close', exact: true }).tap();
    await pouch.waitFor({ state: 'detached' });
    // Drive selection through an overflowing list and back into equipped gear.
    await page.evaluate(() => {
      const b = window.__bridge;
      b.setInventory(Array.from({ length: 15 }, (_, i) => ({
        ...b.catalog.FOOD_ONIGIRI, id: `long-${i}`, name: `Ration ${15 - i}`,
      })));
      b.setPlayer(p => ({ ...p, equipment: {
        weapon: { id: 'equipped', type: 'QA_WEAPON', name: 'Equipped pencil', desc: 'A pencil.', category: 'WEAPON', power: 5 },
      }, gold: 1000, dir: { x: 1, y: 0 } }));
    });
    await page.setViewportSize({ width: 667, height: 320 });
    await page.keyboard.press('x');
    await pouch.waitFor();
    const equipped = pouch.locator('.dungeon-equipped-grid button');
    const collection = pouch.locator('.dungeon-pouch-collection');
    const revealBackFromBottom = async () => {
      await pouch.locator('[data-menu-item]').last().tap();
      assert((await collection.evaluate(el => el.scrollTop)) > 20, 'Fixture scrolls past equipment');
      for (let i = 0; i < 15; i++) await page.keyboard.press('ArrowUp');
      assert.equal(await equipped.getAttribute('aria-pressed'), 'true');
      assert(await equipped.evaluate(button => {
        const row = button.getBoundingClientRect(), list = button.closest('.dungeon-pouch-collection').getBoundingClientRect();
        return row.top >= list.top - 1 && row.bottom <= list.bottom + 1;
      }), 'Selected equipped item is visible again');
    };
    await revealBackFromBottom();
    await pressPad(12);
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Standard view');
    await pressPad(15);
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Sort by type');
    await pressPad(15);
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Sort by name');
    await pressPad(0);
    assert.equal((await order())[0], 'long-14');
    await pressPad(14);
    await pressPad(14);
    await pressPad(0);
    assert.equal(await pouch.evaluate(el => el.classList.contains('dungeon-pouch-classic')), false);
    // The same scroll and selection also work in the standard overlay.
    await revealBackFromBottom();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    assert.equal(await pouch.evaluate(el => el.classList.contains('dungeon-pouch-classic')), true);
    await page.keyboard.press('Escape');

    // Open the real shop via the adjacent merchant and sort the buy stock and player's sell list.
    await page.evaluate(() => {
      const b = window.__bridge;
      b.setEnemies([{
        id: 999, type: 'ENEMY', enemyType: 'SHOPKEEPER', x: b.player.x + 1, y: b.player.y,
        name: 'Shop clerk', hp: 100, maxHp: 100, dir: { x: -1, y: 0 }, status: {},
        shopItems: Array.from({ length: 10 }, (_, i) => ({
          ...b.catalog.FOOD_ONIGIRI, id: `stock-${i}`, name: `Store ration ${10 - i}`, price: 3,
        })),
      }]);
    });
    await page.waitForFunction(() => window.__bridge.enemies.some(e => e.id === 999));
    await page.keyboard.press('z');
    const shop = page.locator('.dungeon-pouch').filter({ has: page.locator('.dungeon-pouch-shop-tabs') });
    await shop.waitFor();
    assert(await shop.evaluate(el => Boolean(el.closest('.dungeon-game-panel'))), 'Shop opens in retained Retro mode');
    await shop.locator('[data-menu-item]').first().tap();
    await page.keyboard.press('ArrowLeft');
    assert.equal(await focusedLabel(), 'Buy');
    await shop.locator('[data-menu-item]').last().tap();
    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowUp');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.menuShopMode), 'BUY');
    await pressPad(12);
    await pressPad(15);
    await pressPad(15);
    await pressPad(0);
    assert.equal(await page.evaluate(() => window.__bridge.enemies.find(e => e.id === 999).shopItems[0].id), 'stock-9');
    await shop.getByRole('button', { name: 'Standard view' }).tap();
    assert.equal(await shop.evaluate(el => el.classList.contains('dungeon-pouch-classic')), false);
    await shop.locator('[data-menu-shop-mode=SELL]').tap();
    await shop.getByRole('button', { name: 'Sort by type', exact: true }).tap();
    await shop.getByRole('button', { name: 'Sort by name', exact: true }).tap();
    assert.equal((await order())[0], 'long-14');
    await shop.getByRole('button', { name: 'Retro', exact: true }).tap();
    await shop.getByRole('button', { name: 'Close', exact: true }).tap();
    await shop.waitFor({ state: 'detached' });
    console.log(`PASS D${series}: compact inventory header, visible action buttons, keyboard/gamepad/touch action selection, sort orders, display preference, bag storage, equipped scroll recovery, and shop controls.`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  await server?.close();
  await fs.rm(entry, { force: true });
}
