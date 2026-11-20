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
import TraditionalGames from './src/mini-games/traditional-games/TraditionalGames';
import './src/styles.css';
import {audioService} from './src/services/audioService';
audioService.playBGM=async()=>{};
createRoot(document.getElementById('root')!).render(<TraditionalGames onBack={()=>{}} languageMode="ENGLISH"/>);
`,
);
const vite = await createServer({
  cacheDir: scratch + '/vite',
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 0, hmr: false },
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
    ? await webkit.launch({ executablePath: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE })
    : await chromium.launch({
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium',
        args: ['--no-sandbox'],
      });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
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
  let checked = 0;
  for (const game of games) {
    await page.goto('http://127.0.0.1:' + vite.httpServer.address().port + '/viewport-qa');
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
    if (family === 'Dominoes')
      await page
        .locator('.tt-variants')
        .getByRole('button', { name: catalog.TABLE_GAMES[game].title[1], exact: true })
        .click();
    const seats = page.locator('.tt-detail select');
    await seats.selectOption(
      (await seats.locator('option').last().getAttribute('value')) ??
        (await seats.locator('option').last().textContent()),
    );
    await page.getByRole('button', { name: 'Play against CPU', exact: true }).click();
    await page.locator('.tt-playing .tt-table-area').waitFor();
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
      if (metrics.hand) assert(metrics.hand.height >= 35, game + ': hand clipped');
      for (const r of metrics.rows)
        assert(
          r.y >= metrics.field.y - 1 && r.bottom <= metrics.field.bottom + 1,
          'goita row clipped ' + JSON.stringify(metrics),
        );
      if (['competitive', 'mexican', 'peeper', 'goita', 'crokinole', 'forty-two'].includes(game))
        await page.screenshot({ path: screenshots + '/' + game + '-' + viewport.width + '.png' });
      checked++;
    }
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
