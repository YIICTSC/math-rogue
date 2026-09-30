import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { chromium } from 'playwright';
import sharp from 'sharp';

// Reproduce a Web player who still has pre-fix, opaque enemy images saved by
// the service worker. Exercise the actual battle illustration component.
const fixture = path.resolve('tmp/vacation-enemy-cache-qa');
await fs.mkdir(fixture, { recursive: true });
await fs.writeFile(path.join(fixture, 'index.html'), '<div id="root"></div><script type="module" src="./fixture.tsx"></script>');
await fs.writeFile(path.join(fixture, 'fixture.tsx'), `
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import EnemyIllustration from '/src/components/EnemyIllustration.tsx';
import { HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS, MAGIC_HUMANOID_ENEMY_VARIANTS, getThemedHumanoidEnemySpritePath } from '/src/data/visualThemes.ts';
const themes = [['high-school', HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS], ['magic', MAGIC_HUMANOID_ENEMY_VARIANTS]];
window.targets = themes.flatMap(([theme, enemies]) => enemies.map(enemy => ({ ...enemy, theme })));
window.expectedPath = (enemy, action) => getThemedHumanoidEnemySpritePath({ name: enemy.name, enemyType: 'TEACHER' }, enemy.theme, action, 'VACATION');
function Fixture() {
  const [action, setAction] = useState('idle');
  window.setEnemyAction = setAction;
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 140px)', background: '#101827' }}>
    {window.targets.map(enemy => <EnemyIllustration key={enemy.theme + enemy.imageIndex} name={enemy.name} seed={enemy.name} enemyType="TEACHER" visualTheme={enemy.theme} appearanceMode="VACATION" action={action} className="fixture-enemy" />)}
  </div>;
}
createRoot(document.getElementById('root')).render(<Fixture />);
`);
const server = await createServer({
  configFile: false,
  plugins: [react()],
  cacheDir: 'node_modules/.vite-vacation-enemy-cache-qa',
  optimizeDeps: { entries: ['tmp/vacation-enemy-cache-qa/index.html'] },
  define: { __APP_ASSET_VERSION__: JSON.stringify('vacation-cache-regression') },
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 5199, strictPort: true, hmr: false },
});
let browser;
try {
  await server.listen();
  const origin = server.resolvedUrls.local[0];
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const url = new URL('/tmp/vacation-enemy-cache-qa/index.html', origin).href;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.targets?.length === 75);
  // The opaque sentinel represents an old background leaking through. Save
  // it under all unversioned paths before giving control to the real worker.
  await page.evaluate(async () => {
    const cache = await caches.open('learning-rogue-runtime-v5');
    for (const enemy of window.targets) {
      for (const action of ['idle', 'attack', 'skill']) {
        const url = new URL(window.expectedPath(enemy, action), location.origin);
        url.search = '';
        await cache.put(url.href, new Response('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="white"/></svg>', { headers: { 'Content-Type': 'image/svg+xml' } }));
      }
    }
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  });
  const staleWidth = await page.evaluate(async () => {
    const url = new URL(window.expectedPath(window.targets[0], 'attack'), location.origin);
    url.search = '';
    const image = new Image();
    image.src = url.href;
    await image.decode();
    return image.naturalWidth;
  });
  assert.equal(staleWidth, 1, 'The worker must actually serve the stale unversioned image to reproduce the bug');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.setEnemyAction);
  for (const action of ['idle', 'attack', 'idle', 'skill', 'idle']) {
    await page.evaluate(action => window.setEnemyAction(action), action);
    await page.waitForFunction(action => {
      const images = [...document.querySelectorAll('#root img')];
      return images.length === 75 && images.every((img, index) => img.getAttribute('src') === window.expectedPath(window.targets[index], action) && img.complete);
    }, action);
    const images = await page.locator('#root img').evaluateAll(images => images.map(img => ({ src: img.getAttribute('src'), width: img.naturalWidth })));
    for (const img of images) {
      assert.match(img.src, /\?v=vacation-cache-regression$/, `Unversioned ${action} image`);
      assert.ok(img.width > 1, `Stale opaque ${action} image: ${img.src}`);
    }
  }
  // Inspect the source alpha separately so a missing/opaque local file cannot
  // pass just because it loaded successfully in the browser.
  let checked = 0;
  for (const [theme, count] of [['high-school', 53], ['magic', 22]]) {
    for (let index = 0; index < count; index++) {
      for (const suffix of ['', '-attack', '-skill']) {
        const file = `public/sprites/${theme}/vacation-humanoid-enemies${suffix}/${index}.webp`;
        const metadata = await sharp(file).metadata();
        assert.ok(metadata.hasAlpha, `Missing alpha: ${file}`);
        const stats = await sharp(file).stats();
        assert.equal(stats.channels[3].min, 0, `No transparent pixels: ${file}`);
        checked++;
      }
    }
  }
  assert.deepEqual(errors, []);
  console.log(`Passed: ${checked} alpha assets; 75 enemies × idle → attack → idle → skill → idle, with stale cached images.`);
} finally {
  await browser?.close();
  await server.close();
}
