import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';

const PORT = 4176;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const synthesizedMiniGames = [
  'src/components/PaperPlaneBattle.tsx',
  'src/components/SchoolDungeonRPG.tsx',
  'src/components/SchoolDungeonRPG2.tsx',
  'src/components/SchoolyardSurvivorScreen.tsx',
];

for (const sourcePath of synthesizedMiniGames) {
  const source = readFileSync(sourcePath, 'utf8');
  if (source.includes('playBattleSound(') || source.includes('playAttackEffectSound(')) {
    throw new Error(`${sourcePath} must keep the original synthesized mini-game sounds`);
  }
}

const kochoSource = readFileSync('src/components/KochoShowdown.tsx', 'utf8');
if (!kochoSource.includes('playAttackEffectSound(') || !kochoSource.includes('getKochoAttackSound')) {
  throw new Error('Kocho Showdown attack effects are not routed to packaged combat sounds');
}

const waitForServer = async () => {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(BASE_URL);
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }
    await delay(200);
  }
  throw new Error('iOS BGM test server did not start within 30 seconds');
};

const vite = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(PORT)],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      VITE_APP_PLATFORM: 'ios',
      VITE_PAID_EDITION: 'true',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);

let viteOutput = '';
vite.stdout.on('data', chunk => { viteOutput += chunk; });
vite.stderr.on('data', chunk => { viteOutput += chunk; });
let browser;

try {
  await waitForServer();
  browser = await chromium.launch({ headless: true, executablePath: CHROME_PATH });
  const context = await browser.newContext({ viewport: { width: 430, height: 932 }, hasTouch: true, isMobile: true });
  await context.addInitScript(() => {
    localStorage.setItem('learning_rogue_child_safety_v1', JSON.stringify({
      version: 1,
      ageBand: '18_PLUS',
      ageSelectedAt: '2026-07-26T00:00:00.000Z',
    }));
    localStorage.setItem('pixel_spire_student_profile_v1', JSON.stringify({
      grade: '社会人',
      className: '',
      number: '',
      name: 'iOS Audio Tester',
    }));
    window.__iosBgmPlayAttempts = [];
    window.__iosBgmPauseCount = 0;
    window.__iosBgmMediaSourceCount = 0;
    window.__iosOscillatorStartCount = 0;
    const playingMedia = new WeakSet();
    const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;
    if (OriginalAudioContext?.prototype?.createMediaElementSource) {
      const originalCreateMediaElementSource = OriginalAudioContext.prototype.createMediaElementSource;
      OriginalAudioContext.prototype.createMediaElementSource = function createMediaElementSource(element) {
        window.__iosBgmMediaSourceCount += 1;
        return originalCreateMediaElementSource.call(this, element);
      };
    }
    HTMLMediaElement.prototype.play = function play() {
      playingMedia.add(this);
      window.__iosBgmPlayAttempts.push(this.currentSrc || this.src);
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function pause() {
      playingMedia.delete(this);
      window.__iosBgmPauseCount += 1;
    };
    Object.defineProperty(HTMLMediaElement.prototype, 'paused', {
      configurable: true,
      get() {
        return !playingMedia.has(this);
      },
    });
    const originalOscillatorStart = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function start(...args) {
      window.__iosOscillatorStartCount += 1;
      return originalOscillatorStart.apply(this, args);
    };
  });

  const page = await context.newPage();
  // App.tsx is intentionally large and a cold Vite transform can take longer
  // than Playwright's 30-second navigation default on the release Mac.
  page.setDefaultTimeout(120_000);
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForSelector('.start-menu-root');
  await page.waitForFunction(() => window.__iosBgmPlayAttempts.some(path => path.includes('/bgm-new/menu.mp3')));
  // iOS BGM must remain on the native media element path even after Web Audio
  // unlocks. This prevents CarPlay/Bluetooth route changes from repeatedly
  // detaching and rebuffering the BGM stream.
  const attemptsBeforeTitleTouch = await page.evaluate(() => window.__iosBgmPlayAttempts.length);
  await page.locator('.start-menu-root').dispatchEvent('pointerdown');
  await delay(100);
  const attemptsAfterTitleTouch = await page.evaluate(() => window.__iosBgmPlayAttempts.length);
  if (attemptsAfterTitleTouch !== attemptsBeforeTitleTouch) {
    throw new Error('A title-screen touch restarted an already healthy iOS BGM stream');
  }

  const initial = await page.evaluate(() => ({
    iosClass: document.documentElement.classList.contains('app-platform-ios'),
    attempts: [...window.__iosBgmPlayAttempts],
    mediaSourceCount: window.__iosBgmMediaSourceCount,
  }));
  if (!initial.iosClass) throw new Error('iOS platform class is missing');
  if (initial.mediaSourceCount !== 0) throw new Error('iOS BGM was unexpectedly routed through Web Audio');

  await page.locator('.start-menu-theme-switch button').filter({ hasText: '高校編' }).evaluate(element => element.click());
  await page.waitForFunction(() => window.__iosBgmPlayAttempts.some(path => path.includes('/bgm-new/high-school/menu.mp3')));
  const beforeResumeCount = await page.evaluate(() => window.__iosBgmPlayAttempts.length);
  const runtimeState = await page.evaluate(async () => {
    const { audioService } = await import('/src/services/audioService.ts');
    audioService.setBgmVolume(0.25);
    const context = audioService.ctx;
    const originalSuspend = context.suspend.bind(context);
    const originalResume = context.resume.bind(context);
    // CarPlay can keep Web Audio suspended while direct HTML BGM remains
    // healthy. A screen touch must not restart that music stream.
    await originalSuspend();
    context.resume = async () => undefined;
    const attemptsBeforeCarPlayTouch = window.__iosBgmPlayAttempts.length;
    await audioService.unlockAudio();
    const attemptsAfterCarPlayTouch = window.__iosBgmPlayAttempts.length;
    context.resume = originalResume;
    await originalResume();

    // A touch-triggered unlock can still be in flight when the app backgrounds.
    // The stale recovery must not win after the background pause.
    await originalSuspend();
    context.resume = async () => {
      await new Promise(resolve => window.setTimeout(resolve, 80));
      return originalResume();
    };
    const attemptsBeforeBackgroundRace = window.__iosBgmPlayAttempts.length;
    const unlockPromise = audioService.unlockAudio();
    await new Promise(resolve => window.setTimeout(resolve, 10));
    audioService.handleAppBackground();
    await unlockPromise;
    const attemptsAfterBackgroundRace = window.__iosBgmPlayAttempts.length;
    context.resume = originalResume;
    // Reproduce the WKWebView ordering that caused the regression: the native
    // background suspend completes after the first foreground event arrives.
    context.suspend = async () => {
      await new Promise(resolve => window.setTimeout(resolve, 80));
      return originalSuspend();
    };
    audioService.handleAppBackground();
    audioService.handleAppBackground();
    const pauseCountAfterBackground = window.__iosBgmPauseCount;
    // Reproduce the iOS race where a correct-answer/UI tone is requested in
    // the same run loop as foreground recovery. The sound must wait for the
    // recovery promise even if AudioContext briefly reports itself as running.
    const foregroundRecovery = audioService.handleAppForeground();
    const oscillatorCountBeforeSe = window.__iosOscillatorStartCount;
    audioService.playSound('select');
    await foregroundRecovery;
    await new Promise(resolve => window.setTimeout(resolve, 30));
    void audioService.playHighSchoolVoiceFile('HS_MALE', 'attack-1', 500);
    await new Promise(resolve => window.setTimeout(resolve, 50));
    // Normal UI and mini-game sounds must remain synthesized. Only the battle
    // API is allowed to start packaged combat SE on its first play.
    audioService.sfxBuffers = {};
    const beforeNormalSoundCount = window.__iosBgmPlayAttempts.length;
    audioService.playSound('attack');
    audioService.playSound('jump');
    await new Promise(resolve => window.setTimeout(resolve, 50));
    const normalPackagedAttemptCount = window.__iosBgmPlayAttempts.length - beforeNormalSoundCount;
    const beforeAnswerSoundCount = window.__iosBgmPlayAttempts.length;
    audioService.playSound('correct');
    audioService.playSound('wrong');
    await new Promise(resolve => window.setTimeout(resolve, 50));
    const answerSoundAttempts = window.__iosBgmPlayAttempts.slice(beforeAnswerSoundCount);
    audioService.playBattleSound('attack');
    audioService.playBattleSound('finisher_slash');
    audioService.playBattleSound('finisher_explosion');
    return {
      bgmVolume: audioService.getBgmVolume(),
      attempts: [...window.__iosBgmPlayAttempts],
      mediaSourceCount: window.__iosBgmMediaSourceCount,
      pauseCountAfterBackground,
      normalPackagedAttemptCount,
      answerSoundAttempts,
      attemptsBeforeCarPlayTouch,
      attemptsAfterCarPlayTouch,
      attemptsBeforeBackgroundRace,
      attemptsAfterBackgroundRace,
      contextState: context.state,
      oscillatorSeStarted: window.__iosOscillatorStartCount > oscillatorCountBeforeSe,
    };
  });
  await page.waitForFunction(
    count => window.__iosBgmPlayAttempts.length > count
      && window.__iosBgmPlayAttempts.some(path => path.includes('/sfx/high-school-voices/HS_MALE/attack-1'))
      && window.__iosBgmPlayAttempts.some(path => path.includes('/sfx/attack-effects/impact.mp3'))
      && window.__iosBgmPlayAttempts.some(path => path.includes('/sfx/finisher-slash.mp3'))
      && window.__iosBgmPlayAttempts.some(path => path.includes('/sfx/finisher-explosion.mp3'))
      && window.__iosBgmPlayAttempts.some(path => path.includes('/sfx/correct.mp3'))
      && window.__iosBgmPlayAttempts.some(path => path.includes('/sfx/wrong.mp3')),
    beforeResumeCount,
  );
  if (runtimeState.bgmVolume !== 0.25) throw new Error('BGM volume setting was not retained');
  if (runtimeState.mediaSourceCount !== 0) throw new Error('Foreground restore moved iOS BGM into Web Audio');
  if (runtimeState.pauseCountAfterBackground < 1) throw new Error('iOS BGM did not pause when the app entered background');
  if (runtimeState.contextState !== 'running') throw new Error(`AudioContext remained ${runtimeState.contextState} after foreground restore`);
  if (!runtimeState.oscillatorSeStarted) throw new Error('Synthesized SE did not resume after foreground restore');
  if (runtimeState.normalPackagedAttemptCount !== 0) throw new Error('Non-battle sound unexpectedly started a packaged SE');
  if (!runtimeState.answerSoundAttempts.some(path => path.includes('/sfx/correct.mp3'))) {
    throw new Error('iOS correct-answer sound did not use the native packaged audio path');
  }
  if (!runtimeState.answerSoundAttempts.some(path => path.includes('/sfx/wrong.mp3'))) {
    throw new Error('iOS wrong-answer sound did not use the native packaged audio path');
  }
  if (runtimeState.attemptsAfterCarPlayTouch !== runtimeState.attemptsBeforeCarPlayTouch) {
    throw new Error('Suspended CarPlay Web Audio caused the active HTML BGM to restart');
  }
  if (runtimeState.attemptsAfterBackgroundRace !== runtimeState.attemptsBeforeBackgroundRace) {
    throw new Error('A stale title gesture restarted BGM after the app entered background');
  }
  const attempts = await page.evaluate(() => [...window.__iosBgmPlayAttempts]);
  process.stdout.write(`✓ iOS BGM and battle-only packaged SE routing verified (${attempts.at(-1)})\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n${viteOutput}`);
  process.exitCode = 1;
} finally {
  if (browser) {
    await Promise.race([
      browser.close().catch(() => undefined),
      delay(2_000),
    ]);
  }
  vite.kill('SIGTERM');
  await Promise.race([once(vite, 'exit'), delay(2_000)]);
  if (vite.exitCode === null) vite.kill('SIGKILL');
}

process.exit(process.exitCode || 0);
