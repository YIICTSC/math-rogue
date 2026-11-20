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
  const { layoutDomino } = await vite.ssrLoadModule(base + 'dominoLayout.ts');
  const voices = await vite.ssrLoadModule('/src/data/cardClubVoices.ts');
  const fixtures = [];
  let checked = 0;
  for (const game of model.DOMINO_GAMES.filter((g) => g !== 'forty-two')) {
    let best,
      bestCount = -1;
    for (let seed = 1; seed <= 8; seed++) {
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
        const layout = layoutDomino(state.hub, state.lines);
        const count =
          state.lines.reduce((n, line) => n + line.tiles.length, 0) + Number(state.hub !== null);
        assert.equal(layout.nodes.length, count);
        assert.equal(layout.ends.length, state.hub === null ? 0 : state.lines.length);
        assert.equal(new Set(layout.nodes.map((node) => node.key)).size, count);
        for (const node of [...layout.nodes, ...layout.ends]) {
          assert(
            node.x - 38 >= layout.bounds.x && node.x + 38 <= layout.bounds.x + layout.bounds.width,
          );
          assert(
            node.y - 19 >= layout.bounds.y && node.y + 19 <= layout.bounds.y + layout.bounds.height,
          );
        }
        for (let i = 0; i < layout.nodes.length; i++) {
          for (let j = 0; j < i; j++) {
            assert(
              Math.abs(layout.nodes[i].x - layout.nodes[j].x) >= 76 ||
                Math.abs(layout.nodes[i].y - layout.nodes[j].y) >= 38,
              game + ': overlapping tiles',
            );
          }
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
