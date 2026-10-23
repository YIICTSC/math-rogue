import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright';

let server, browser;
try {
  server = await createServer({
    cacheDir: `node_modules/.vite-summer-ending-browser-${process.pid}`, logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, hmr: false },
    plugins: [{ name: 'summer-ending-qa', configureServer(s) {
      s.middlewares.use('/summer-ending-qa', async (req, res) => {
        res.setHeader('Content-Type', 'text/html');
        res.end(await s.transformIndexHtml(req.url, '<html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><div id="root" style="height:100dvh"></div><script type="module" src="/scripts/fixtures/summer-endings.tsx"></script></body></html>'));
      });
    } }],
  });
  await server.listen();
  browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const failures = [];
  page.on('response', response => {
    if (response.status() >= 400 && response.url().includes('summer-expansion')) failures.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/summer-ending-qa`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.locator('[data-qa-ready]').waitFor({ timeout: 120000 });
  const { ENDLESS_REVISION_COPY } = await server.ssrLoadModule('/src/data/endlessEndingCopyRevision.ts');
  const { MAGIC_FRIENDSHIP_ROUTES } = await server.ssrLoadModule('/src/data/magicFriendshipRoutes.ts');
  const out = path.resolve('build/summer-ending-qa/browser'); await fs.mkdir(out, { recursive: true });
  let screens = 0;
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1280, height: 720 }]) {
    await page.setViewportSize(viewport);
    for (const language of ['JAPANESE', 'HIRAGANA', 'ENGLISH']) {
      const jobs = [
        ...['high-school', 'magic'].flatMap(theme => Object.keys(ENDLESS_REVISION_COPY[theme]).map(id => ['true', id, theme])),
        ...(process.argv.includes('--true-only') ? [] : [
          ...(process.argv.includes('--no-epilogue') ? [] : Object.keys(ENDLESS_REVISION_COPY.magic).map(id => ['epilogue', id, 'magic'])),
          ...MAGIC_FRIENDSHIP_ROUTES.map(route => ['friendship', route.id, 'magic']),
        ]),
      ].filter(([, id]) => !process.argv.includes('--smoke') || ['WARRIOR', 'AKARI', 'SAKUYA', 'AKARI_SHIZUKU'].includes(id));
      for (const [kind, id, theme] of jobs) {
        const before = await page.evaluate(() => __summer.completions);
        await page.evaluate(([kind,id,theme,language]) => __summer.show(kind,id,theme,language), [kind,id,theme,language]);
        const button = page.locator('button[data-gamepad-initial-choice], .magic-romance-ending-button').first();
        await button.waitFor({ state: 'visible' });
        for (let index = 0; index < 3; index++) {
          await page.waitForFunction(() => Array.from(document.querySelectorAll('img')).every(img => img.complete && img.naturalWidth > 0));
          const text = await page.locator('#root').innerText();
          if (kind === 'epilogue') assert.equal(await page.locator('.themed-ending-sequence-foreground').evaluate(img => getComputedStyle(img).objectFit), 'contain', 'epilogue must not crop the protagonist');
          if (language === 'ENGLISH') assert.ok(!/[ぁ-んァ-ヶ一-龠]/.test(text), `Japanese leaked in ${kind}/${id}`);
          if (language === 'HIRAGANA') assert.ok(!/[一-龠]/.test(text), `kanji leaked in ${kind}/${id}`);
          assert.ok(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), `horizontal overflow ${kind}/${id}`);
          await button.scrollIntoViewIfNeeded();
          const box = await button.boundingBox();
          assert.ok(box && box.height >= 30 && box.y >= -1 && box.y + box.height <= viewport.height + 1, `inaccessible next button ${kind}/${id}`);
          if (index === 0 && ['WARRIOR','AKARI','SAKUYA','AKARI_SHIZUKU'].includes(id)) {
            await page.screenshot({ path: path.join(out, `${kind}-${id}-${language}-${viewport.width}.png`) });
          }
          await button.click(); screens++;
        }
        await page.locator('[data-qa-result="done"]').waitFor();
        assert.equal(await page.evaluate(() => __summer.completions), before + 1, 'exactly one completion');
      }
    }
  }
  assert.deepEqual(await page.evaluate(() => __summer.voices), [], 'no requests for deferred audio');
  if (!process.argv.includes('--true-only')) {
    const { trans } = await server.ssrLoadModule('/src/utils/textUtils.ts');
    const { getMagicSummerEpilogue } = await server.ssrLoadModule('/src/data/magicSummerEpilogues.ts');
    for (const language of ['JAPANESE', 'HIRAGANA', 'ENGLISH']) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(language => __summer.showGallery(language), language);
      await page.getByRole('button', { name: trans('エンディング', language), exact: true }).click();
      const firstPage = getMagicSummerEpilogue('AKARI')[0];
      const title = language === 'ENGLISH' ? firstPage.titleEnglish : language === 'HIRAGANA' ? firstPage.titleHiragana : firstPage.title;
      await page.getByRole('button').filter({ hasText: title }).click();
      const scope = page.locator('[data-gamepad-initial-scope^="magic-vacation-epilogue-"]');
      await scope.waitFor();
      // Exit mid-story and reopen: the three-page snapshot must replay from page one.
      await page.getByRole('button', { name: trans('閉じる', language), exact: true }).click();
      await scope.waitFor({ state: 'detached' });
      await page.getByRole('button').filter({ hasText: title }).click();
      await scope.waitFor();
      assert.ok((await scope.innerText()).includes(title));
      for (let i = 0; i < 3; i++) await scope.locator('button[data-gamepad-initial-choice]').click();
      await scope.waitFor({ state: 'detached' });
      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('pixel_spire_magic_ending_gallery_v1')));
      assert.equal(stored.length, 2, 'gallery replay must not duplicate or overwrite entries');
      assert.equal(stored.find(e => e.kind === 'epilogue').storyPages.length, 3);
    }
    assert.deepEqual(await page.evaluate(() => __summer.voices), [], 'gallery does not request deferred voices');
  }
  // Standard ending voices still play; leaving the viewer invokes cleanup.
  await page.evaluate(() => __summer.show('true', 'WARRIOR', 'high-school', 'JAPANESE', false));
  await page.waitForFunction(() => __summer.voices.length > 0);
  const stops = await page.evaluate(() => __summer.stopped);
  await page.evaluate(() => __summer.leave());
  await page.waitForFunction(n => __summer.stopped > n, stops);
  assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  console.log(`PASS: ${screens} rendered pages, 3 languages, portrait/landscape, every next/results button, image decode, no overflow, voice deferral and exit cleanup. Screenshots: ${out}`);
} finally {
  await browser?.close();
  server?.httpServer?.closeAllConnections();
  await server?.close();
}
