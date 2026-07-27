import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const PORT = 4176;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

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
    HTMLMediaElement.prototype.play = function play() {
      window.__iosBgmPlayAttempts.push(this.currentSrc || this.src);
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function pause() {};
  });

  const page = await context.newPage();
  // App.tsx is intentionally large and a cold Vite transform can take longer
  // than Playwright's 30-second navigation default on the release Mac.
  page.setDefaultTimeout(120_000);
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForSelector('.start-menu-root');
  await page.waitForFunction(() => window.__iosBgmPlayAttempts.some(path => path.includes('/bgm-new/menu.mp3')));

  const initial = await page.evaluate(() => ({
    iosClass: document.documentElement.classList.contains('app-platform-ios'),
    attempts: [...window.__iosBgmPlayAttempts],
  }));
  if (!initial.iosClass) throw new Error('iOS platform class is missing');

  await page.locator('.start-menu-theme-switch button').filter({ hasText: '高校編' }).evaluate(element => element.click());
  await page.waitForFunction(() => window.__iosBgmPlayAttempts.some(path => path.includes('/bgm-new/high-school/menu.mp3')));
  const attempts = await page.evaluate(() => [...window.__iosBgmPlayAttempts]);
  process.stdout.write(`✓ iOS HTML Audio BGM path selected (${attempts.at(-1)})\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n${viteOutput}`);
  process.exitCode = 1;
} finally {
  await browser?.close().catch(() => undefined);
  vite.kill('SIGTERM');
  await Promise.race([once(vite, 'exit'), delay(2_000)]);
  if (vite.exitCode === null) vite.kill('SIGKILL');
}
