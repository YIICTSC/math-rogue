import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';

const PORT = 4181;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ARTIFACT_DIR = '.codex-artifacts';
const BUTTON = { A: 0, B: 1, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

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
  throw new Error('Vite assignment-reward preview did not start within 30 seconds');
};

const installPreviewState = async page => {
  await page.addInitScript(() => {
    localStorage.setItem('learning_rogue_child_safety_v1', JSON.stringify({
      version: 1,
      ageBand: '18_PLUS',
      ageSelectedAt: '2026-07-31T00:00:00.000Z',
    }));
    localStorage.setItem('pixel_spire_student_profile_v1', JSON.stringify({
      grade: '社会人',
      className: '',
      number: '',
      name: 'Layout Tester',
    }));

    const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
    const state = { connected: false, axes: [0, 0, 0, 0], buttons, timestamp: 0 };
    const gamepad = {
      id: 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)',
      index: 0,
      connected: true,
      mapping: 'standard',
      axes: state.axes,
      buttons: state.buttons,
      timestamp: 0,
    };
    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true,
      value: () => {
        gamepad.connected = state.connected;
        gamepad.timestamp = state.timestamp;
        return state.connected ? [gamepad, null, null, null] : [null, null, null, null];
      },
    });
    window.__assignmentRewardGamepad = {
      connect() {
        state.connected = true;
        state.timestamp += 1;
      },
      setButton(index, pressed) {
        state.buttons[index].pressed = pressed;
        state.buttons[index].touched = pressed;
        state.buttons[index].value = pressed ? 1 : 0;
        state.timestamp += 1;
      },
    };
  });
};

const press = async (page, name, holdMs = 180) => {
  const index = BUTTON[name];
  await page.evaluate(buttonIndex => window.__assignmentRewardGamepad.setButton(buttonIndex, true), index);
  await delay(holdMs);
  await page.evaluate(buttonIndex => window.__assignmentRewardGamepad.setButton(buttonIndex, false), index);
  await delay(160);
};

const readFocusedText = page => page.evaluate(() => document.activeElement?.textContent?.trim() || '');

const server = spawn('pnpm', ['exec', 'vite', '--host', '127.0.0.1', '--port', String(PORT)], {
  env: {
    ...process.env,
    VITE_ENABLE_DEBUG_FEATURES: 'true',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true, executablePath: CHROME_PATH });
  const context = await browser.newContext({ viewport: { width: 844, height: 390 } });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(90_000);
  await installPreviewState(page);
  await page.goto(`${BASE_URL}/?assignmentRewardPreview=1`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.locator('.assignment-progress-panel-with-card').waitFor({ state: 'visible' });

  const geometry = await page.evaluate(() => {
    const rectOf = selector => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
    };
    const buttons = Array.from(document.querySelectorAll('.assignment-progress-actions button')).map(button => {
      const rect = button.getBoundingClientRect();
      return {
        text: button.textContent?.trim() || '',
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
      };
    });
    const panel = document.querySelector('.assignment-progress-panel-with-card');
    return {
      viewport: { width: innerWidth, height: innerHeight },
      panel: rectOf('.assignment-progress-panel-with-card'),
      reward: rectOf('.assignment-progress-reward'),
      actions: rectOf('.assignment-progress-actions'),
      buttons,
      panelDisplay: panel ? getComputedStyle(panel).display : '',
      panelOverflow: panel ? getComputedStyle(panel).overflow : '',
      documentOverflow: {
        x: document.documentElement.scrollWidth - innerWidth,
        y: document.documentElement.scrollHeight - innerHeight,
      },
    };
  });

  assert(geometry.panelDisplay === 'grid', `landscape panel is not a grid: ${geometry.panelDisplay}`);
  assert(geometry.panel && geometry.reward && geometry.actions, 'landscape modal geometry is incomplete');
  assert(geometry.reward.right < geometry.actions.left, 'reward card is not in the left column');
  assert(geometry.buttons.length === 3, `expected 3 actions, found ${geometry.buttons.length}`);
  for (const button of geometry.buttons) {
    assert(button.left >= 0 && button.right <= geometry.viewport.width, `${button.text} is clipped horizontally`);
    assert(button.top >= 0 && button.bottom <= geometry.viewport.height, `${button.text} is clipped vertically`);
  }
  assert(geometry.panel.top >= 0 && geometry.panel.bottom <= geometry.viewport.height, 'modal panel exceeds landscape viewport');
  assert(geometry.documentOverflow.x <= 0, `document overflows horizontally by ${geometry.documentOverflow.x}px`);
  assert(geometry.documentOverflow.y <= 0, `document overflows vertically by ${geometry.documentOverflow.y}px`);

  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  await page.screenshot({ path: `${ARTIFACT_DIR}/assignment-reward-landscape-844x390.png` });

  await page.evaluate(() => window.__assignmentRewardGamepad.connect());
  await page.waitForFunction(() => document.body.classList.contains('gamepad-connected'));
  await page.waitForFunction(() => document.activeElement?.textContent?.trim() === 'PDF');
  assert(await readFocusedText(page) === 'PDF', 'controller did not focus the first action');
  await press(page, 'DOWN');
  assert((await readFocusedText(page)).includes('続ける'), 'controller could not move down to Continue');
  await press(page, 'DOWN');
  assert((await readFocusedText(page)).includes('タイトル画面へ'), 'controller could not move down to Title');
  await press(page, 'UP');
  assert((await readFocusedText(page)).includes('続ける'), 'controller could not move back up');
  await press(page, 'A');
  await page.locator('.assignment-progress-panel-with-card').waitFor({ state: 'detached' });

  const portraitContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const portraitPage = await portraitContext.newPage();
  portraitPage.setDefaultNavigationTimeout(90_000);
  await installPreviewState(portraitPage);
  await portraitPage.goto(`${BASE_URL}/?assignmentRewardPreview=1`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await portraitPage.locator('.assignment-progress-panel-with-card').waitFor({ state: 'visible' });
  const portraitState = await portraitPage.evaluate(() => {
    const panel = document.querySelector('.assignment-progress-panel-with-card');
    if (!panel) return null;
    const rect = panel.getBoundingClientRect();
    return {
      display: getComputedStyle(panel).display,
      overflowY: getComputedStyle(panel).overflowY,
      top: rect.top,
      bottom: rect.bottom,
      viewportHeight: innerHeight,
    };
  });
  assert(portraitState, 'portrait modal did not render');
  assert(portraitState.top >= 0 && portraitState.bottom <= portraitState.viewportHeight, 'portrait panel exceeds viewport');
  assert(portraitState.overflowY === 'auto', `portrait modal is not scrollable: ${portraitState.overflowY}`);
  await portraitPage.screenshot({ path: `${ARTIFACT_DIR}/assignment-reward-portrait-390x844.png` });

  console.log('Assignment reward runtime layout passed at 844x390 and 390x844.');
  console.log('Xbox controller focus passed: PDF -> Continue -> Title -> Continue -> A close.');
  console.log(JSON.stringify(geometry));
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
  await Promise.race([once(server, 'exit'), delay(2_000)]);
}
