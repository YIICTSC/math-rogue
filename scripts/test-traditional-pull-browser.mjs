import { createServer } from 'vite';
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const file = '.pull-browser-fixture.tsx';
const scratch = await fs.mkdtemp((await import('node:os')).tmpdir() + '/traditional-pull-');
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
        s.middlewares.use('/pull-qa', async (req, res) => {
          res.setHeader('Content-Type', 'text/html');
          res.end(
            await s.transformIndexHtml(
              '/pull-qa',
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
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    hasTouch: true,
  });
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:' + vite.httpServer.address().port + '/pull-qa');
  await page.getByRole('button',{name:'Play solo',exact:true}).click();
  await page
    .locator('.tt-families')
    .getByRole('button', { name: 'Crokinole', exact: true })
    .click();
  await page.getByRole('button', { name: 'Tutorial', exact: true }).click();
  const board = await page.locator('.tt-croki-board').boundingBox();
  let disc = await page.locator('.tt-preview-disc').boundingBox();
  const x = disc.x + disc.width / 2,
    y = disc.y + disc.height / 2;
  // A canceled pull must leave the ready disc available.
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + board.width * 0.08, { steps: 6 });
  await page.locator('.tt-croki-board').dispatchEvent('pointercancel', { pointerId: 1 });
  await page.mouse.up();
  assert(await page.locator('.tt-preview-disc').count());
  disc = await page.locator('.tt-preview-disc').boundingBox();
  await page.mouse.move(disc.x + disc.width / 2, disc.y + disc.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    disc.x + disc.width / 2,
    disc.y + disc.height / 2 + board.width * 0.42 * 0.308,
    { steps: 10 },
  );
  await page.screenshot({ path: screenshots + '/pull-ready.png' });
  await page.mouse.up();
  await page.waitForFunction(() =>
    document.querySelector('.tt-croki-board .tt-disc:not(.tt-preview-disc)'),
  );
  const start = await page.locator('.tt-croki-board .tt-disc').first().getAttribute('style');
  await page.waitForTimeout(100);
  const after = await page
    .locator('.tt-croki-board .tt-disc')
    .first()
    .getAttribute('style')
    .catch(() => null);
  assert.notEqual(start, after, 'Gameplay movement remains visible with reduced motion enabled');
  await page.getByText('Well played!', { exact: false }).waitFor();
  await page.screenshot({ path: screenshots + '/pull-result.png' });
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  for (const family of ['Dominoes', 'Peeper', 'Goita']) {
    await page.locator('.tt-families').getByRole('button', { name: family, exact: true }).click();
    await page.getByRole('button', { name: 'Tutorial', exact: true }).click();
    const piece = page.locator('.tt-hand .tt-piece').first();
    assert(
      ['rgb(17, 21, 26)', 'rgb(162, 11, 25)'].includes(
        await piece.evaluate((e) => getComputedStyle(e).color),
      ),
    );
    assert.equal(await piece.evaluate((e) => getComputedStyle(e.parentElement).opacity), '1');
    if (family === 'Goita') {
      const area = page.locator('.tt-goita-table');
      const rects = await Promise.all(
        [0, 1, 2, 3].map((seat) =>
          area.locator('.tt-goita-row[data-seat="' + seat + '"]').boundingBox(),
        ),
      );
      assert(rects[0].y > rects[2].y, 'Self sits opposite the partner');
      assert(rects[1].x > rects[3].x, 'Opposing pair sits across the sides');
      assert(Math.abs(rects[0].x - rects[2].x) < 2);
      assert.equal(await area.locator('.tt-goita-row[data-team="ally"]').count(), 2);
      assert.equal(await area.locator('.tt-goita-row[data-team="opponent"]').count(), 2);
      await page.locator('.tt-goita-field').screenshot({ path: screenshots + '/goita-pairs.png' });
    }
    if (family === 'Dominoes') await page.screenshot({ path: screenshots + '/hand-contrast.png' });
    await page.getByRole('button', { name: 'Back', exact: true }).click();
  }
  assert.deepEqual(errors, []);
  console.log(
    'PASS pull-back/release center shot, canceled pull, visible disc motion under reduced-motion preference, mobile layout',
  );
} finally {
  await browser?.close();
  await vite.close();
  await fs.unlink(file).catch(() => {});
  await fs.rm(scratch, { recursive: true, force: true });
}
