import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const fixtureCache = await mkdtemp(join(tmpdir(), 'school-answer-browser-'));
let server, browser;
try {
  server = await createServer({
    configFile: false,
    logLevel: 'error',
    cacheDir: fixtureCache,
    optimizeDeps: { entries: ['scripts/fixtures/school-answer-grading.tsx'] },
    server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
    plugins: [{
      name: 'school-answer-grading-fixture',
      configureServer(vite) {
        vite.middlewares.use('/school-answer-test', async (_request, response) => {
          response.setHeader('Content-Type', 'text/html');
          response.end(await vite.transformIndexHtml('/school-answer-test',
            '<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module" src="/scripts/fixtures/school-answer-grading.tsx"></script>'));
        });
      },
    }],
  });
  await server.listen();
  const executablePath = process.env.CHROMIUM_PATH ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: 'block' });
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());

  const cases = [
    { mode: 'MATH_G7_U01', question: '気温が0度より5度低いことを数で表すと？', entered: '5', expected: '-5' },
    { mode: 'MATH_G7_U01', question: '-7と-3を比べて大きい数は？', entered: '-7', expected: '-3' },
    { mode: 'MATH_G7_2', question: '次のうち、比例 y ＝ 2x のグラフが通る点は？', input: true, choiceRequired: true, entered: '(2, 1)', expected: '(1, 2)' },
    { screen: 'review', mode: 'MATH_G7_2', question: '次のうち、比例 y ＝ 2x のグラフが通る点は？', input: true, choiceRequired: true, entered: '(2, 1)', expected: '(1, 2)' },
    { mode: 'MATH_G7_U01', question: '+3.5の反対の数は？', entered: '-35', expected: '-3.5' },
    { mode: 'MATH_G7_U01', question: '+3.5の反対の数は？', input: true, entered: '－３．５０', expected: '-3.5', correct: true },
    { mode: 'MATH_G8_1', question: 'y ＝ 2x ＋ 4 のグラフと y軸との交点の座標は？', input: true, entered: '（４、０）', expected: '(0, 4)' },
    { mode: 'MATH_G7_U01', question: '-10より大きく-6より小さい整数を小さい順に、コンマで区切って答えると？', input: true, entered: '-7,-8,-9', expected: '-9,-8,-7' },
    { screen: 'math', mode: 'ADDITION', question: '0 + 1 = ?', input: true, prefix: '1', entered: '15', expected: '1' },
    { screen: 'math', mode: 'ADDITION', question: '5 + 7 = ?', input: true, entered: '1 2', expected: '12' },
    { screen: 'kanji', mode: 'KANJI_1', question: '花', input: true, prefix: 'はな', entered: 'はなび', expected: 'はな' },
    { screen: 'english', mode: 'ENGLISH_J1', question: 'I do not like soccer.', input: true, entered: 'わたしは サッカーが すきです。', expected: 'わたしは サッカーが すきではありません。' },
  ];

  for (const scenario of cases) {
    const { screen, mode, question, input, choiceRequired, prefix, entered, expected, correct = false } = scenario;
    const params = new URLSearchParams({ mode, question, input: input ? '1' : '0' });
    if (screen) {
      params.set('screen', screen);
      params.set('reviewAnswer', expected);
      if (screen === 'review') params.append('option', entered);
    }
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/school-answer-test?${params}`, { waitUntil: 'domcontentloaded' });
    const field = page.getByPlaceholder(screen === 'kanji' ? '読み方を入力' : '答えを入力');
    if (input && !choiceRequired) {
      await field.waitFor();
      if (prefix) {
        await field.fill(prefix);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        assert(await field.isEnabled(), `${screen}: a matching prefix must remain editable`);
        assert.equal(await page.evaluate(() => window.schoolAnswerOutcome.result), null);
      }
      await field.fill(entered);
      await page.getByRole('button', { name: '決定', exact: true }).click();
    } else {
      const options = page.locator('[data-gamepad-zone="challenge-options"]');
      const selected = options.filter({ has: page.getByText(entered, { exact: true }) });
      await selected.waitFor();
      assert.equal(await field.count(), 0);
      assert.equal(await options.count(), 4);
      await selected.click();
      assert.equal(await options.and(page.locator('.bg-green-600')).count(), 1, 'Only the answer key is highlighted');
    }
    await page.waitForFunction(() => window.schoolAnswerOutcome.correctCount !== null);
    const outcome = await page.evaluate(() => window.schoolAnswerOutcome);
    assert.equal(outcome.result.correct, correct, question + ' → ' + entered);
    assert.equal(outcome.result.correctAnswer, expected, question);
    assert.equal(outcome.correctCount, Number(correct), question);
    console.log('PASS', mode, question, entered, correct ? 'correct' : 'incorrect');
  }
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixtureCache, { recursive: true, force: true });
}
