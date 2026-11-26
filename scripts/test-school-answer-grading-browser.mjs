import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, webkit } from 'playwright';
import { createServer } from 'vite';

const fixtureCache = await mkdtemp(join(tmpdir(), 'school-answer-browser-'));
const gameBgmVolume = .37;
const gameVoiceVolume = .63;

async function pronunciationContext(browser, base, { platform, nativeFailure, locked = false, lateVoices = false, nativeWarmingUp = false } = {}) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: 'block' });
  page.setDefaultTimeout(15000);
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());
  await page.addInitScript(({ platform, nativeFailure, locked, lateVoices, nativeWarmingUp }) => {
    const requests = [];
    const voice = { lang: 'en-US', localService: true };
    let voices = lateVoices ? [] : [voice, { lang: 'ja-JP', localService: true }];
    let utterance, resolveNative, languageChecks = 0;
    const engine = new EventTarget();
    const log = (route, { text, lang, rate, volume }) => requests.push({
      route, text, lang, rate, volume, bgm: window.questionAudioService.bgmGain.gain.value,
    });
    Object.assign(engine, {
      getVoices: () => voices,
      resume() {},
      speak(next) {
        utterance = next;
        log('web', next);
        if (!lateVoices || next.voice) next.onstart?.();
      },
      cancel() { if (utterance) requests.push({ route: 'web-stop' }); utterance = undefined; },
    });
    class TestUtterance {
      constructor(text) { this.text = text; }
    }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: TestUtterance });
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: engine });
    if (locked) Object.defineProperty(navigator, 'userActivation', { configurable: true, value: { hasBeenActive: false } });
    if (platform) {
      window.CapacitorCustomPlatform = { name: platform };
      window.Capacitor = {
        PluginHeaders: [{ name: 'TextToSpeech', methods: ['isLanguageSupported', 'speak', 'stop'].map(name => ({ name, rtype: 'promise' })) }],
        async nativePromise(plugin, method, options) {
          if (plugin !== 'TextToSpeech') throw new Error(plugin);
          if (method === 'isLanguageSupported') return { supported: ++languageChecks > Number(nativeWarmingUp) };
          if (method === 'speak') {
            log(platform, options);
            if (nativeFailure) throw new Error('No device voice installed');
            return new Promise(resolve => { resolveNative = resolve; });
          }
          requests.push({ route: 'native-stop' });
          resolveNative?.();
        },
      };
    }
    window.speechProbe = {
      requests,
      end: () => { utterance?.onend?.(); utterance = undefined; resolveNative?.(); },
      voicesReady: () => { voices = [voice]; engine.dispatchEvent(new Event('voiceschanged')); },
    };
  }, { platform, nativeFailure, locked, lateVoices, nativeWarmingUp });
  return {
    page,
    async open(params = {}) {
      await page.goto(`${base}/school-answer-test?${new URLSearchParams({ screen: 'pronunciation', audio: '1', mode: 'ENGLISH_G8_U02', ...params })}`, { waitUntil: 'domcontentloaded' });
    },
  };
}

async function checkPronunciation(browser, base, errors) {
  const listen = page => page.getByRole('button', { name: 'おとを きく', exact: true });
  const getBgm = page => page.evaluate(() => ({
    effective: window.questionAudioService.bgmGain.gain.value,
    setting: window.questionAudioService.getBgmVolume(),
  }));
  const waitForBgm = page => page.waitForFunction(volume => Math.abs(window.questionAudioService.bgmGain.gain.value - volume) < .01, gameBgmVolume);
  const checkPrompt = async (page, route, language, requestCount = 1) => {
    await page.waitForFunction(count => window.speechProbe?.requests.filter(request => request.text).length >= count, requestCount);
    const { requests, prompt } = await page.evaluate(() => ({ requests: window.speechProbe.requests.filter(request => request.text), prompt: window.pronunciationProblem?.audioPrompt }));
    assert.equal(requests.length, requestCount);
    assert.deepEqual(requests.at(-1), { route, text: prompt.text, lang: language, volume: gameVoiceVolume, rate: .85, bgm: 0 });
  };

  for (const scenario of [
    { name: 'web with autoplay blocked', options: { locked: true }, route: 'web', mode: 'ENGLISH_G8_U02', lang: 'en-US' },
    { name: 'web with late voices', options: { lateVoices: true }, route: 'web', mode: 'ENGLISH_G8_U02', lang: 'en-US' },
    { name: 'iOS bridge', options: { platform: 'ios' }, route: 'ios', mode: 'KOKUGO_G3_U01', lang: 'ja-JP' },
    { name: 'Android bridge', options: { platform: 'android' }, route: 'android', mode: 'ENGLISH_G8_U02', lang: 'en-US' },
    { name: 'Android speech engine warming up', options: { platform: 'android', nativeWarmingUp: true }, route: 'android', mode: 'ENGLISH_G8_U02', lang: 'en-US' },
    { name: 'native engine error with browser fallback', options: { platform: 'android', nativeFailure: true }, route: 'web', mode: 'KOKUGO_G3_U01', lang: 'ja-JP' },
  ]) {
    const { page, open } = await pronunciationContext(browser, base, scenario.options);
    page.on('pageerror', error => errors.push(error.message));
    try {
      await open({ mode: scenario.mode });
      await listen(page).waitFor();
      assert.deepEqual(await getBgm(page), { effective: 0, setting: gameBgmVolume });
      if (scenario.options.locked) {
        await page.getByText('「きく」をおして おとを ならそう。', { exact: true }).waitFor();
        assert.deepEqual(await page.evaluate(() => window.speechProbe.requests), []);
        await listen(page).tap();
      }
      if (scenario.options.lateVoices) {
        await checkPrompt(page, 'web', scenario.lang);
        await page.evaluate(() => window.speechProbe.voicesReady());
      }
      await checkPrompt(page, scenario.route, scenario.lang, scenario.options.lateVoices || scenario.options.nativeFailure ? 2 : 1);
      await page.evaluate(() => window.speechProbe.end());
      assert.deepEqual(await getBgm(page), { effective: 0, setting: gameBgmVolume });
      const answer = await page.evaluate(() => window.pronunciationProblem.options[0]);
      await page.locator('[data-gamepad-zone="challenge-options"]').filter({ has: page.getByText(answer, { exact: true }) }).tap();
      await page.getByText('3 + 2 = ?', { exact: true }).waitFor();
      await waitForBgm(page);
      console.log('PASS pronunciation', scenario.name, scenario.lang);
    } catch (error) {
      throw new Error(scenario.name + (errors.length ? '\n' + errors.join('\n') : ''), { cause: error });
    } finally { await page.close(); }
  }

  const { page, open } = await pronunciationContext(browser, base, { platform: 'ios' });
  page.on('pageerror', error => errors.push(error.message));
  try {
    await open({ kind: 'speaking' });
    await page.getByRole('button', { name: '過去進行形を はなす' }).waitFor();
    assert.deepEqual(await getBgm(page), { effective: 0, setting: gameBgmVolume });
    assert.deepEqual(await page.evaluate(() => window.speechProbe.requests), []);
    await page.evaluate(() => window.closeQuestion());
    await waitForBgm(page);
    console.log('PASS speaking-only question mutes BGM through unmount');

    await open();
    await checkPrompt(page, 'ios', 'en-US');
    await page.evaluate(() => window.questionAudioService.setVoiceVolume(0));
    await page.waitForFunction(() => window.speechProbe.requests.some(request => request.route === 'native-stop'));
    await listen(page).tap();
    await page.getByText('ミュートと ボイスのおんりょうを たしかめてね。', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.speechProbe.requests.filter(request => request.text).length), 1);
    console.log('PASS native speech stops when voice volume is muted');
  } finally { await page.close(); }
}

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
  browser = process.env.SCHOOL_TEST_BROWSER === 'webkit'
    ? await webkit.launch()
    : await chromium.launch({ executablePath, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
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
    { screen: 'math', mode: 'ADDITION', question: '0 + 1 = ?', input: true, entered: '15', expected: '1' },
    { screen: 'math', mode: 'ADDITION', question: '0 + 1 = ?', input: true, entered: '１', expected: '1', correct: true },
    { screen: 'math', mode: 'ADDITION', question: '5 + 7 = ?', input: true, entered: '1 2', expected: '12' },
    { screen: 'kanji', mode: 'KANJI_1', question: '花', input: true, entered: 'はなび', expected: 'はな' },
    { screen: 'kanji', mode: 'KANJI_1', question: '花', input: true, entered: 'はな', expected: 'はな', correct: true, compose: true },
    { screen: 'english', mode: 'ENGLISH_J1', question: 'I do not like soccer.', input: true, entered: 'わたしは サッカーが すきです。', expected: 'わたしは サッカーが すきではありません。' },
    { screen: 'english', mode: 'ENGLISH_J1', question: 'I do not like soccer.', input: true, entered: 'わたしはサッカーがすきではありません', expected: 'わたしは サッカーが すきではありません。', correct: true },
  ];

  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  for (const scenario of cases) {
    const { screen, mode, question, input, choiceRequired, entered, expected, compose, correct = false } = scenario;
    const params = new URLSearchParams({ mode, question, input: input ? '1' : '0' });
    if (screen) {
      params.set('screen', screen);
      params.set('reviewAnswer', expected);
      if (screen === 'review') params.append('option', entered);
    }
    await page.goto(`${base}/school-answer-test?${params}`, { waitUntil: 'domcontentloaded' });
    const field = page.getByPlaceholder(screen === 'kanji' ? '読み方を入力' : '答えを入力');
    if (input && !choiceRequired) {
      await field.waitFor();
      if (compose) await field.dispatchEvent('compositionstart');
      await field.fill(entered);
      if (compose || !correct) {
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        assert(await field.isEnabled(), `${screen || mode}: unconfirmed input must remain editable`);
        assert.equal(await page.evaluate(() => window.schoolAnswerOutcome.result), null);
      }
      if (compose) await field.dispatchEvent('compositionend');
      if (!correct) await page.getByRole('button', { name: '決定', exact: true }).click();
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
    assert.equal(outcome.submissions, 1, question);
    console.log('PASS', mode, question, entered, correct ? 'correct' : 'incorrect');
  }
  await page.close();
  await checkPronunciation(browser, base, errors);
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixtureCache, { recursive: true, force: true });
}
