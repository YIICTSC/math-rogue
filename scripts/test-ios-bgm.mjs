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
    window.__iosBgmMediaSourceCount = 0;
    window.__iosOscillatorStartCount = 0;
    const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;
    if (OriginalAudioContext?.prototype?.createMediaElementSource) {
      const originalCreateMediaElementSource = OriginalAudioContext.prototype.createMediaElementSource;
      OriginalAudioContext.prototype.createMediaElementSource = function createMediaElementSource(element) {
        window.__iosBgmMediaSourceCount += 1;
        return originalCreateMediaElementSource.call(this, element);
      };
    }
    HTMLMediaElement.prototype.play = function play() {
      window.__iosBgmPlayAttempts.push(this.currentSrc || this.src);
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function pause() {};
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
  // Initial autoplay can use the direct HTML media path while iOS still has
  // Web Audio locked. The first interaction must unlock it and rebuild the BGM
  // through the gain node.
  await page.locator('.start-menu-root').dispatchEvent('pointerdown');
  await page.waitForFunction(() => window.__iosBgmMediaSourceCount >= 1);

  const initial = await page.evaluate(() => ({
    iosClass: document.documentElement.classList.contains('app-platform-ios'),
    attempts: [...window.__iosBgmPlayAttempts],
    mediaSourceCount: window.__iosBgmMediaSourceCount,
  }));
  if (!initial.iosClass) throw new Error('iOS platform class is missing');
  if (initial.mediaSourceCount < 1) throw new Error('iOS BGM is not routed through Web Audio gain');

  await page.locator('.start-menu-theme-switch button').filter({ hasText: '高校編' }).evaluate(element => element.click());
  await page.waitForFunction(() => window.__iosBgmPlayAttempts.some(path => path.includes('/bgm-new/high-school/menu.mp3')));
  const beforeResumeCount = await page.evaluate(() => window.__iosBgmPlayAttempts.length);
  const runtimeState = await page.evaluate(async () => {
    const { audioService } = await import('/src/services/audioService.ts');
    audioService.setBgmVolume(0.25);
    const context = audioService.ctx;
    const originalSuspend = context.suspend.bind(context);
    // Reproduce the WKWebView ordering that caused the regression: the native
    // background suspend completes after the first foreground event arrives.
    context.suspend = async () => {
      await new Promise(resolve => window.setTimeout(resolve, 80));
      return originalSuspend();
    };
    audioService.handleAppBackground();
    audioService.handleAppBackground();
    await audioService.handleAppForeground();
    const oscillatorCountBeforeSe = window.__iosOscillatorStartCount;
    audioService.playSound('select');
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
    audioService.playBattleSound('attack');
    audioService.playBattleSound('finisher_slash');
    audioService.playBattleSound('finisher_explosion');
    return {
      bgmVolume: audioService.getBgmVolume(),
      attempts: [...window.__iosBgmPlayAttempts],
      mediaSourceCount: window.__iosBgmMediaSourceCount,
      normalPackagedAttemptCount,
      contextState: context.state,
      oscillatorSeStarted: window.__iosOscillatorStartCount > oscillatorCountBeforeSe,
    };
  });
  await page.waitForFunction(
    count => window.__iosBgmPlayAttempts.length > count
      && window.__iosBgmPlayAttempts.some(path => path.includes('/sfx/high-school-voices/HS_MALE/attack-1'))
      && window.__iosBgmPlayAttempts.some(path => path.includes('/sfx/attack-effects/impact.mp3'))
      && window.__iosBgmPlayAttempts.some(path => path.includes('/sfx/finisher-slash.mp3'))
      && window.__iosBgmPlayAttempts.some(path => path.includes('/sfx/finisher-explosion.mp3')),
    beforeResumeCount,
  );
  if (runtimeState.bgmVolume !== 0.25) throw new Error('BGM volume setting was not retained');
  if (runtimeState.mediaSourceCount < 2) throw new Error('BGM was not rebuilt through the gain node after foreground restore');
  if (runtimeState.contextState !== 'running') throw new Error(`AudioContext remained ${runtimeState.contextState} after foreground restore`);
  if (!runtimeState.oscillatorSeStarted) throw new Error('Synthesized SE did not resume after foreground restore');
  if (runtimeState.normalPackagedAttemptCount !== 0) throw new Error('Non-battle sound unexpectedly started a packaged SE');
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
