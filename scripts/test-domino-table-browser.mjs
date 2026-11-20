import { createServer } from 'vite';
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import os from 'node:os';
import assert from 'node:assert/strict';
const file = '.domino-table-fixture.tsx';
const scratch = await fs.mkdtemp(os.tmpdir() + '/domino-table-');
const vite = await createServer({
  cacheDir: scratch + '/vite',
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 0, hmr: false },
  optimizeDeps: {
    noDiscovery: true,
    include: ['react', 'react-dom/client', 'react/jsx-runtime', 'lucide-react'],
  },
  plugins: [
    {
      name: 'domino-fixture',
      configureServer(s) {
        s.middlewares.use('/domino-qa', async (_req, res) => {
          res.setHeader('Content-Type', 'text/html');
          res.end(
            await s.transformIndexHtml(
              '/domino-qa',
              `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="margin:0"><div id="root"></div><script type="module" src="/${file}"></script></body></html>`,
            ),
          );
        });
      },
    },
  ],
});
let browser;
try {
  const base = '/src/mini-games/traditional-games/';
  const engine = await vite.ssrLoadModule(base + 'engine.ts');
  const model = await vite.ssrLoadModule(base + 'model.ts');
  const { layoutDomino, dominoCorners, dominoOverlap } = await vite.ssrLoadModule(
    base + 'dominoLayout.ts',
  );
  const voices = await vite.ssrLoadModule('/src/data/cardClubVoices.ts');
  const edgeDistance = (p, a, b) => {
    const dx = b.x - a.x,
      dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
  };
  const gap = (a, b) =>
    Math.min(
      ...a.flatMap((p) => b.map((q, i) => edgeDistance(p, q, b[(i + 1) % 4]))),
      ...b.flatMap((p) => a.map((q, i) => edgeDistance(p, q, a[(i + 1) % 4]))),
    );
  const fixtures = [];
  let checked = 0;
  for (const game of model.DOMINO_GAMES.filter((g) => g !== 'forty-two')) {
    let best,
      bestCount = -1;
    for (let seed = 1; seed <= Number(process.env.DOMINO_LAYOUT_SEEDS || 8); seed++) {
      const n = model.seatsFor(game).at(-1);
      const state = engine.createTable(
        game,
        Array.from({ length: n }, (_, i) => ({
          id: 'p' + i,
          name: 'Player ' + (i + 1),
          hero: voices.CARD_CLUB_VOICE_HEROES[i],
          cpu: true,
        })),
        seed,
      );
      while (state.phase === 'play') {
        let layout;
        try {
          layout = layoutDomino(state.hub, state.lines);
        } catch (e) {
          console.error(game, seed, state.hub, JSON.stringify(state.lines));
          throw e;
        }
        const count =
          state.lines.reduce((n, line) => n + line.tiles.length, 0) + Number(state.hub !== null);
        assert.equal(layout.nodes.length, count);
        assert.equal(layout.ends.length, state.hub === null ? 0 : state.lines.length);
        assert.equal(new Set(layout.nodes.map((node) => node.key)).size, count);
        for (const node of [...layout.nodes.flatMap(dominoCorners), ...layout.ends]) {
          assert(node.x >= layout.bounds.x && node.x <= layout.bounds.x + layout.bounds.width);
          assert(node.y >= layout.bounds.y && node.y <= layout.bounds.y + layout.bounds.height);
        }
        for (let i = 0; i < layout.nodes.length; i++) {
          for (let j = 0; j < i; j++)
            assert(!dominoOverlap(layout.nodes[i], layout.nodes[j]), game + ': overlapping tiles');
        }
        for (const node of layout.nodes.filter((n) => n.key !== 'hub')) {
          const [li, j] = node.key.split(':').map(Number),
            line = state.lines[li];
          const parentKey = j
            ? li + ':' + (j - 1)
            : line.parent < 0
              ? 'hub'
              : line.parent + ':' + line.anchor;
          const parent = layout.nodes.find((n) => n.key === parentKey);
          assert(parent, 'missing connection');
          const pip = parentKey === 'hub' && li === 0 ? parent.tile >> 4 : parent.tile & 15;
          assert.equal(node.tile >> 4, pip, 'touching halves must match');
          if (!(parentKey === 'hub' && layout.engine))
            assert(gap(dominoCorners(node), dominoCorners(parent)) < 1.2, 'disconnected domino');
        }
        if (
          count > bestCount &&
          engine.legalMoves(state, state.turn).some((a) => a.type === 'place')
        ) {
          bestCount = count;
          best = engine.tableViewFor(state, state.turn);
        }
        checked++;
        assert(engine.playTableCpu(state));
      }
    }
    console.log('Checked', game, checked);
    if (['competitive', 'chicken', 'mexican'].includes(game)) fixtures.push(best);
  }
  assert.equal(fixtures.length, 3);
  await fs.writeFile(
    file,
    `
import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {DominoBoard} from './src/mini-games/traditional-games/Boards';
import './src/mini-games/traditional-games/traditionalGames.css';
const fixtures = ${JSON.stringify(fixtures)};
function App(){const [index,setIndex]=useState(0), [sent,setSent]=useState(null);
return <main className="traditional-tables" style={{'--tt-domino-art':'url(/sprites/traditional-games/domino.webp)'}}>
<nav>{fixtures.map((v,i)=><button key={i} onClick={()=>{setIndex(i);setSent(null)}}>{v.game}</button>)}</nav>
<DominoBoard key={index} view={fixtures[index]} language="ENGLISH" send={setSent}/>
<output>{sent ? JSON.stringify(sent) : ''}</output></main>}
createRoot(document.getElementById('root')!).render(<App/>);
`,
  );
  await vite.listen();
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:' + vite.httpServer.address().port + '/domino-qa');
  const map = page.locator('.tt-domino-map');
  await map.waitFor();
  for (const game of ['competitive', 'chicken', 'mexican']) {
    await page.getByRole('button', { name: game, exact: true }).click();
    const hand = page.locator('.tt-hand');
    const playable = hand.locator('[data-playable="true"]');
    assert((await playable.count()) > 0);
    assert.equal(await hand.locator('button:enabled').count(), await playable.count());
    await playable.first().click();
    if (await page.locator('.tt-domino-ends button:enabled').count()) {
      assert((await page.locator('.tt-domino-map-end[data-target="true"]').count()) > 0);
      if (game === 'chicken')
        await page.locator('.tt-domino-map-end[data-target="true"]').first().press('Enter');
      else await page.locator('.tt-domino-ends button:enabled').first().click();
    }
    assert.match(await page.locator('output').textContent(), /"type":"place"/);
    assert(
      await map.locator('.tt-domino-map-tile').evaluateAll((tiles) =>
        tiles.every((el) => {
          const tile = Number(el.getAttribute('data-tile'));
          return el.querySelectorAll('.tt-dot').length === (tile >> 4) + (tile & 15);
        }),
      ),
      'each face must show the actual pips, including double twelve',
    );
    await map.scrollIntoViewIfNeeded();
    await page.screenshot({ path: scratch + '/' + game + '-portrait.png', fullPage: true });
  }
  const fitted = await map.getAttribute('viewBox');
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  assert.notEqual(await map.getAttribute('viewBox'), fitted);
  const rect = await map.boundingBox();
  await page.mouse.move(rect.x + rect.width * 0.5, rect.y + rect.height * 0.5);
  const zoomed = await map.getAttribute('viewBox');
  await page.mouse.down();
  await page.mouse.move(rect.x + rect.width * 0.7, rect.y + rect.height * 0.6, { steps: 5 });
  await page.mouse.up();
  assert.notEqual(await map.getAttribute('viewBox'), zoomed);
  await page.getByRole('button', { name: 'Fit table', exact: true }).click();
  assert.equal(await map.getAttribute('viewBox'), fitted);
  await map.scrollIntoViewIfNeeded();
  const box = await map.boundingBox(),
    x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { x: x - 30, y, id: 1 },
      { x: x + 30, y, id: 2 },
    ],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [
      { x: x - 75, y, id: 1 },
      { x: x + 75, y, id: 2 },
    ],
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.notEqual(await map.getAttribute('viewBox'), fitted);
  await page.getByRole('button', { name: 'Fit table', exact: true }).click();
  assert.equal(await map.getAttribute('viewBox'), fitted);
  for (const viewport of [
    { width: 844, height: 390 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.getByRole('button', { name: 'Fit table', exact: true }).click();
    await map.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const svg = document.querySelector('.tt-domino-map').getBoundingClientRect();
      return [...document.querySelectorAll('.tt-domino-map-tile, .tt-domino-map-end')].every(
        (el) => {
          const rect = el.getBoundingClientRect();
          return (
            rect.left >= svg.left - 1 &&
            rect.top >= svg.top - 1 &&
            rect.right <= svg.right + 1 &&
            rect.bottom <= svg.bottom + 1
          );
        },
      );
    });
    await page.screenshot({ path: scratch + '/table-' + viewport.width + '.png', fullPage: true });
    assert.equal(await page.locator('body').evaluate((el) => el.scrollWidth <= innerWidth), true);
  }
  assert.deepEqual(errors, []);
  console.log(
    'PASS ' +
      checked +
      ' domino layouts, highlighted legal tiles, placement, drag, pinch, fit and three screen sizes. Screenshots: ' +
      scratch,
  );
} finally {
  await browser?.close();
  await vite.close();
  await fs.rm(file, { force: true });
}
