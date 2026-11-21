import { createServer } from 'vite';
import { chromium, webkit } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const file = '.viewport-browser-fixture.tsx';
const scratch = await fs.mkdtemp((await import('node:os')).tmpdir() + '/traditional-viewport-');
const screenshots = process.env.TRADITIONAL_SCREENSHOT_DIR || scratch;
await fs.mkdir(screenshots, { recursive: true });
await fs.writeFile(
  file,
  `
import React from 'react';
import {createRoot} from 'react-dom/client';
import MiniGameSelectScreen from './src/components/MiniGameSelectScreen';
import MiniGameRouter from './src/components/MiniGameRouter';
import {GameMode} from './src/types';
import {TraditionalSession} from './src/mini-games/traditional-games/session';
const startTable = TraditionalSession.prototype.start;
TraditionalSession.prototype.start = function(seed) {
  return startTable.call(this, document.querySelector('.tt-theme-domino') ? 1995 : seed);
};
import './src/styles.css';
import {audioService} from './src/services/audioService';
audioService.playBGM=async()=>{};
function Menu(){const [screen,select]=React.useState(null);return screen?<MiniGameRouter screen={screen} onBack={()=>select(null)} problemMode={GameMode.MIXED} languageMode="ENGLISH"/>:<MiniGameSelectScreen onSelect={select} onBack={()=>{}} totalMathCorrect={99999} mainClearCount={99} isDebug={false} languageMode="ENGLISH"/>}
createRoot(document.getElementById('root')!).render(<Menu/>);
`,
);
const vite = await createServer({
  cacheDir: scratch + '/vite',
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: { ignored: () => true } },
  optimizeDeps: {
    noDiscovery: true,
    include: [
      'react',
      'react-dom/client',
      'react/jsx-runtime',
      'peerjs',
      'three',
      'lucide-react',
      '@capacitor/core',
    ],
  },
  plugins: [
    {
      name: 'pull-fixture',
      configureServer(s) {
        s.middlewares.use('/viewport-qa', async (req, res) => {
          res.setHeader('Content-Type', 'text/html');
          res.end(
            await s.transformIndexHtml(
              '/viewport-qa',
              `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="margin:0"><div id="root" style="height:100dvh;position:relative"></div><script type="module" src="/${file}"></script></body></html>`,
            ),
          );
        });
      },
    },
  ],
});
let browser;
try {
  await vite.listen();
  browser = process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE
    ? await webkit.launch({
        executablePath: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE,
      })
    : await chromium.launch({
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium',
        args: ['--no-sandbox'],
      });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const catalog = await vite.ssrLoadModule('/src/mini-games/traditional-games/catalog.ts');
  const games = Object.keys(catalog.TABLE_GAMES).filter(
    (game) =>
      !process.env.TABLE_VIEWPORT_GAMES ||
      process.env.TABLE_VIEWPORT_GAMES.split(',').includes(game),
  );
  const sizes = [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 320, height: 568 },
    { width: 568, height: 320 },
    { width: 1440, height: 900 },
  ];
  const model = await vite.ssrLoadModule('/src/mini-games/traditional-games/model.ts');
  let checked = 0;
  await page.goto('http://127.0.0.1:' + vite.httpServer.address().port + '/viewport-qa');
  await page.locator('.mini-game-select-card')
    .filter({ has: page.locator('[style*="sprites/traditional-games"]') })
    .click();
  for (const game of games) {
    await page.setViewportSize(sizes[0]);
    await page.getByRole('button', { name: 'Play solo', exact: true }).click();
    const family =
      game === 'crokinole'
        ? 'Crokinole'
        : game === 'goita'
          ? 'Goita'
          : game === 'peeper'
            ? 'Peeper'
            : 'Dominoes';
    await page.locator('.tt-families').getByRole('button', { name: family, exact: true }).click();
    if (game === 'competitive') {
      const list = page.getByRole('group', { name: 'Domino rulesets' });
      assert.equal(await list.getByRole('button').count(), model.DOMINO_GAMES.length);
      await page.getByRole('combobox', { name: 'Type', exact: true }).selectOption('tricks');
      assert.equal(await list.getByRole('button').count(), 4);
      await page.getByRole('checkbox', { name: 'Beginner', exact: true }).check();
      await list.getByRole('status').waitFor();
      await page.getByRole('combobox', { name: 'Type', exact: true }).selectOption('all');
      assert((await list.getByRole('button').count()) < model.DOMINO_GAMES.length);
      await page.getByRole('checkbox', { name: 'Beginner', exact: true }).uncheck();
      await page.getByRole('combobox', { name: 'Sort', exact: true }).selectOption('name');
      const titles = await list
        .getByRole('button')
        .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')));
      assert.deepEqual(
        titles,
        [...titles].sort((a, b) => a.localeCompare(b, 'en')),
      );
      await page.getByRole('combobox', { name: 'Sort', exact: true }).selectOption('level');
    }
    if (family === 'Dominoes')
      await page
        .locator('.tt-variants')
        .getByRole('button', {
          name: catalog.TABLE_GAMES[game].title[1],
          exact: true,
        })
        .click();
    const seats = page.locator('.tt-detail select');
    await seats.selectOption(
      (await seats.locator('option').last().getAttribute('value')) ??
        (await seats.locator('option').last().textContent()),
    );
    await page.getByRole('button', { name: 'Play against CPU', exact: true }).click();
    await page.locator('.tt-playing .tt-table-area').waitFor();
    if (model.CLASSIC_DOMINO_GAMES.includes(game) && game !== 'forty-two') {
      for (let n = 0; n < 150 && (await page.locator('.tt-domino-map-tile').count()) < 3; n++) {
        const move = page.locator('.tt-hand [data-playable="true"]:enabled').first();
        if (await move.count()) await move.click();
        const end = page.locator('.tt-domino-ends button:enabled').first();
        if (await end.count()) await end.click();
        const draw = page.locator('.tt-play-actions button:enabled').first();
        if (await draw.count()) await draw.click();
        await page.waitForTimeout(160);
      }
      assert(
        (await page.locator('svg.tt-domino-map g.tt-domino-map-tile').count()) >= 3,
        game + ' should paint the played chain',
      );
    }
    for (const viewport of sizes) {
      if (
        !['competitive', 'mexican', 'peeper', 'goita', 'crokinole', 'forty-two'].includes(game) &&
        viewport.width !== 390 &&
        viewport.width !== 844
      )
        continue;
      await page.setViewportSize(viewport);
      await page.waitForFunction(() => {
        const main = document.querySelector('.tt-playing');
        return main && main.scrollHeight <= main.clientHeight + 1;
      });
      const seatCounts = await page.locator('.tt-seat').evaluateAll((seats) =>
        seats.map((seat) => {
          const badge = seat.querySelector('.table-hand-count');
          if (!badge || !/^\d+/.test(badge.textContent)) return false;
          const bounds = seat.getBoundingClientRect();
          const count = badge.getBoundingClientRect();
          return (
            count.width > 0 &&
            count.left >= bounds.left &&
            count.right <= bounds.right &&
            count.right <= innerWidth &&
            count.top >= bounds.top &&
            count.bottom <= bounds.bottom
          );
        }),
      );
      assert(seatCounts.length > 1 && seatCounts.every(Boolean), game + ': hand count clipped');
      const metrics = await page.evaluate(() => {
        const rect = (el) => {
          const r = el.getBoundingClientRect();
          return {
            x: r.x,
            y: r.y,
            right: r.right,
            bottom: r.bottom,
            width: r.width,
            height: r.height,
          };
        };
        const main = document.querySelector('.tt-playing');
        return {
          main: rect(main),
          area: rect(main.querySelector('.tt-table-area')),
          field: rect(main.querySelector('.tt-playfield, .tt-croki-board')),
          hand: main.querySelector('.tt-hand') ? rect(main.querySelector('.tt-hand')) : null,
          rows: [...main.querySelectorAll('.tt-goita-row')].map(rect),
        };
      });
      for (const [key, r] of Object.entries(metrics).filter(([k, v]) => k !== 'rows' && v)) {
        assert(
          r.x >= -1 &&
            r.y >= -1 &&
            r.right <= viewport.width + 1 &&
            r.bottom <= viewport.height + 1,
          game + ' ' + JSON.stringify(viewport) + ' ' + key + ': ' + JSON.stringify(r),
        );
      }
      assert(
        metrics.field.height >= 110,
        game + ' ' + JSON.stringify(viewport) + ': table too small ' + JSON.stringify(metrics),
      );
      if (metrics.hand && (await page.locator('.tt-hand > *').count()))
        assert(metrics.hand.height >= 35, game + ': hand clipped');
      for (const r of metrics.rows)
        assert(
          r.y >= metrics.field.y - 1 && r.bottom <= metrics.field.bottom + 1,
          'goita row clipped ' + JSON.stringify(metrics),
        );
      if (['competitive', 'mexican', 'peeper', 'goita', 'crokinole', 'forty-two'].includes(game))
        await page.screenshot({
          path: screenshots + '/' + game + '-' + viewport.width + '.png',
        });
      checked++;
    }
    await page.locator('.tt-playing .tt-nav').getByRole('button', { name: 'Back', exact: true }).click();
  }
  assert.deepEqual(errors, []);
  console.log(
    'PASS ' +
      checked +
      ' real match viewports across ' +
      games.length +
      ' rulesets; table, hands and controls stay on screen. Screenshots: ' +
      screenshots,
  );
} finally {
  await browser?.close();
  await vite.close();
  await fs.unlink(file).catch(() => {});
}
