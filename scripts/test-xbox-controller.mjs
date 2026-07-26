import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const PORT = 4175;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BUTTON = {
  A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7,
  BACK: 8, START: 9, LS: 10, RS: 11,
  UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15,
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
  throw new Error('Vite test server did not start within 30 seconds');
};

const installVirtualGamepad = async page => {
  await page.addInitScript(() => {
    if (!location.search.includes('gamepadFresh=1')) {
      localStorage.setItem('learning_rogue_child_safety_v1', JSON.stringify({
        version: 1,
        ageBand: '18_PLUS',
        ageSelectedAt: '2026-07-25T00:00:00.000Z',
      }));
      localStorage.setItem('pixel_spire_student_profile_v1', JSON.stringify({
        grade: '社会人',
        className: '',
        number: '',
        name: 'Controller Tester',
      }));
      localStorage.setItem('pixel_spire_seen_battle_tutorial_v1', 'true');
      localStorage.setItem('pixel_spire_seen_poker_tutorial_v1', 'true');
      localStorage.setItem('learning_rogue_online_ranking_profile_v1', JSON.stringify({
        id: 'controller-test',
        publicCode: 'PAD-TEST',
        displayName: 'Controller Tester',
        token: 'offline-controller-test-token',
        registeredAt: '2026-07-25T00:00:00.000Z',
      }));
    }
    const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
    const state = {
      connected: false,
      axes: [0, 0, 0, 0],
      buttons,
      timestamp: 0,
    };
    const gamepad = {
      id: 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)',
      index: 0,
      connected: true,
      mapping: 'standard',
      axes: state.axes,
      buttons: state.buttons,
      vibrationActuator: null,
      hapticActuators: [],
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
    window.__virtualXbox = {
      connect() {
        state.connected = true;
        state.timestamp += 1;
      },
      disconnect() {
        state.connected = false;
        state.timestamp += 1;
      },
      setButton(index, pressed) {
        state.buttons[index].pressed = pressed;
        state.buttons[index].touched = pressed;
        state.buttons[index].value = pressed ? 1 : 0;
        state.timestamp += 1;
      },
      setAxis(index, value) {
        state.axes[index] = value;
        state.timestamp += 1;
      },
    };
  });
};

const connect = async page => {
  await page.evaluate(() => window.__virtualXbox.connect());
  await page.waitForFunction(() => document.body.classList.contains('gamepad-connected'));
  await delay(120);
};

const disconnect = async page => {
  await page.evaluate(() => window.__virtualXbox.disconnect());
  await page.waitForFunction(() => !document.body.classList.contains('gamepad-connected'));
};

const press = async (page, name, holdMs = 180) => {
  const index = BUTTON[name];
  await page.evaluate(([buttonIndex]) => window.__virtualXbox.setButton(buttonIndex, true), [index]);
  await delay(holdMs);
  await page.evaluate(([buttonIndex]) => window.__virtualXbox.setButton(buttonIndex, false), [index]);
  await delay(140);
};

const pressTogether = async (page, names, holdMs = 180) => {
  const indices = names.map(name => BUTTON[name]);
  await page.evaluate(buttonIndices => {
    for (const buttonIndex of buttonIndices) window.__virtualXbox.setButton(buttonIndex, true);
  }, indices);
  await delay(holdMs);
  await page.evaluate(buttonIndices => {
    for (const buttonIndex of buttonIndices) window.__virtualXbox.setButton(buttonIndex, false);
  }, indices);
  await delay(140);
};

const moveStick = async (page, x, y, holdMs = 70) => {
  await page.evaluate(([nextX, nextY]) => {
    window.__virtualXbox.setAxis(0, nextX);
    window.__virtualXbox.setAxis(1, nextY);
  }, [x, y]);
  await delay(holdMs);
  await page.evaluate(() => {
    window.__virtualXbox.setAxis(0, 0);
    window.__virtualXbox.setAxis(1, 0);
  });
  await delay(140);
};

const scrollRightStick = async (page, y, holdMs = 220) => {
  await page.evaluate(nextY => window.__virtualXbox.setAxis(3, nextY), y);
  await delay(holdMs);
  await page.evaluate(() => window.__virtualXbox.setAxis(3, 0));
  await delay(140);
};

const activeElementSnapshot = page => page.evaluate(() => {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return null;
  return {
    tag: active.tagName,
    text: (active.textContent || active.getAttribute('aria-label') || '').trim().slice(0, 120),
    zone: active.dataset.gamepadZone || null,
    visible: active.getBoundingClientRect().width > 0 && active.getBoundingClientRect().height > 0,
  };
});

const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};

const run = async () => {
  const testFilter = process.env.GAMEPAD_TEST_FILTER
    ? new RegExp(process.env.GAMEPAD_TEST_FILTER)
    : null;
  const screenFilter = process.env.GAMEPAD_SCREEN_FILTER
    ? new RegExp(process.env.GAMEPAD_SCREEN_FILTER)
    : null;
  const vite = spawn(
    process.execPath,
    ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(PORT)],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        VITE_APP_PLATFORM: 'steam',
        VITE_PAID_EDITION: 'true',
        VITE_ENABLE_DEBUG_FEATURES: 'true',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  let viteOutput = '';
  vite.stdout.on('data', chunk => { viteOutput += chunk; });
  vite.stderr.on('data', chunk => { viteOutput += chunk; });

  try {
    await waitForServer();
    const browser = await chromium.launch({
      headless: true,
      executablePath: CHROME_PATH,
    });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await installVirtualGamepad(page);
    page.on('console', message => {
      if (message.type() === 'error') process.stderr.write(`[browser] ${message.text()}\n`);
    });

    const results = [];
    const test = async (name, callback) => {
      if (testFilter && !testFilter.test(name)) return;
      try {
        await callback();
        results.push({ name, ok: true });
        process.stdout.write(`✓ ${name}\n`);
      } catch (error) {
        results.push({ name, ok: false, error: error instanceof Error ? error.message : String(error) });
        process.stdout.write(`✗ ${name}: ${results.at(-1).error}\n`);
      }
    };

    await test('接続・切断・再接続を再読み込みなしで認識する', async () => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await connect(page);
      await disconnect(page);
      await connect(page);
      expect(await page.evaluate(() => document.body.classList.contains('gamepad-connected')), '再接続後の接続クラスがない');
    });

    await test('初回年齢設定をコントローラーだけで開始できる', async () => {
      await page.goto(`${BASE_URL}/?gamepadFresh=1`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => {
        localStorage.removeItem('learning_rogue_child_safety_v1');
        localStorage.removeItem('pixel_spire_student_profile_v1');
      });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await connect(page);
      await page.waitForSelector('#age-privacy-title');
      const active = await activeElementSnapshot(page);
      expect(active?.visible, '年齢選択に初期フォーカスがない');
      expect(/9|12|ages/i.test(active?.text || ''), `年齢選択の先頭候補ではない: ${active?.text || 'なし'}`);
      await press(page, 'A');
      expect(await page.locator('button:has-text("保存して続ける"):not(:disabled)').count() === 1, '年齢選択後に保存可能にならない');
    });

    await test('タイトルは接続時に主要ボタンへ初期フォーカスする', async () => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await connect(page);
      await page.waitForSelector('.start-menu-root');
      const active = await activeElementSnapshot(page);
      expect(active?.visible, 'タイトルの初期フォーカスが可視要素にない');
      expect(/冒険を始める|つづきから/.test(active?.text || ''), `想定外の初期位置: ${active?.text || 'なし'}`);
      const before = await activeElementSnapshot(page);
      await press(page, 'DOWN');
      const after = await activeElementSnapshot(page);
      expect(before?.text !== after?.text || before?.tag !== after?.tag, '方向パッドでフォーカスが移動しない');
    });

    await test('左スティックでもタイトルのフォーカスを移動できる', async () => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await connect(page);
      const beforeText = (await activeElementSnapshot(page))?.text;
      await moveStick(page, 0, 1);
      const afterText = (await activeElementSnapshot(page))?.text;
      expect(beforeText !== afterText, '左スティックでフォーカスが移動しない');
    });

    await test('Steam高校編の選択位置は色反転し、リリースノート10回押下でデバッグを開ける', async () => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => localStorage.removeItem('pixel_spire_debug_hp_one_v1'));
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('.start-menu-theme-switch button').filter({ hasText: '高校編' }).click();
      await connect(page);

      const focused = page.locator('.start-menu-high-school :focus');
      await focused.waitFor({ state: 'visible' });
      const focusColors = await focused.evaluate(element => {
        const style = getComputedStyle(element);
        return {
          background: style.backgroundColor,
          color: style.color,
          platformClass: document.documentElement.classList.contains('app-platform-steam'),
        };
      });
      expect(focusColors.platformClass, 'Steamプラットフォームクラスが付いていない');
      expect(focusColors.background === 'rgb(248, 250, 252)', `フォーカス背景が反転していない: ${focusColors.background}`);
      expect(focusColors.color === 'rgb(2, 6, 23)', `フォーカス文字色が反転していない: ${focusColors.color}`);

      await page.locator('.start-menu-version').click();
      const releaseNotesTitle = page.locator('.app-debug-modal button').filter({ hasText: 'System Release Notes' });
      for (let count = 0; count < 10; count += 1) await releaseNotesTitle.click();
      await page.locator('.app-debug-modal [data-gamepad-back]').click();
      const debugButton = page.locator('button').filter({ hasText: 'デバッグメニュー' });
      await debugButton.waitFor({ state: 'visible' });
      await debugButton.click();
      await page.getByText('DEBUG', { exact: true }).waitFor({ state: 'visible' });
    });

    await test('設定のrangeとselectをコントローラーで変更できる', async () => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await connect(page);
      await page.locator('button[title*="セッティング"]').first().click();
      await page.waitForSelector('.app-settings-modal-overlay');
      const range = page.locator('.app-settings-modal-overlay input[type="range"]').first();
      await range.evaluate(element => {
        element.value = '50';
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await delay(180);
      await range.focus();
      const rangeBefore = Number(await range.inputValue());
      await press(page, 'RIGHT');
      const rangeAfter = Number(await range.inputValue());
      expect(rangeAfter > rangeBefore, 'rangeが増加しない');
      await page.locator('.app-settings-modal-overlay button').filter({ hasText: '表示' }).click();
      await delay(180);
      const select = page.locator('.app-settings-modal-overlay select').first();
      await select.selectOption('normal');
      await select.focus();
      const selectBefore = await select.inputValue();
      await press(page, 'RIGHT');
      const selectAfter = await select.inputValue();
      expect(selectAfter !== selectBefore, 'selectが変更されない');
      await press(page, 'B');
      expect(await page.locator('.app-settings-modal-overlay').count() === 0, 'Bで設定が閉じない');
    });

    await test('テキスト入力でコントローラー用画面キーボードを開閉できる', async () => {
      await page.goto(`${BASE_URL}/?gamepadTestScreen=SUBMISSION`, { waitUntil: 'domcontentloaded' });
      await connect(page);
      const input = page.locator('input:not([type="checkbox"]):not([type="range"])').first();
      await input.waitFor({ state: 'visible' });
      await input.focus();
      await press(page, 'A');
      await page.waitForSelector('[aria-label="画面キーボード"]');
      await press(page, 'A');
      await press(page, 'Y');
      await press(page, 'X');
      await page.locator('[aria-label="画面キーボード"] button').filter({ hasText: '入力を決定' }).focus();
      await press(page, 'A');
      expect((await input.inputValue()).endsWith('A'), '画面キーボードの入力が元のinputへ反映されない');
      await input.focus();
      await press(page, 'A');
      await press(page, 'B');
      expect(await page.locator('[aria-label="画面キーボード"]').count() === 0, 'Bで画面キーボードが閉じない');
    });

    await test('右スティックで長いヘルプ画面をスクロールできる', async () => {
      await page.setViewportSize({ width: 1100, height: 520 });
      await page.goto(`${BASE_URL}/?gamepadTestScreen=HELP`, { waitUntil: 'domcontentloaded' });
      await connect(page);
      const scrollArea = page.locator('.main-help-screen .overflow-y-auto').first();
      const before = await scrollArea.evaluate(element => element.scrollTop);
      await scrollRightStick(page, 1);
      const after = await scrollArea.evaluate(element => element.scrollTop);
      expect(after > before, `右スティックでスクロールしない: ${before} -> ${after}`);
      await page.setViewportSize({ width: 1440, height: 900 });
    });

    await test('通常戦闘のXアイテム、B閉じる、Y、RB、RTを認識する', async () => {
      await page.goto(`${BASE_URL}/?gamepadTestScreen=BATTLE`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.battle-scene-root');
      await page.waitForSelector('[data-gamepad-controller-items]', { state: 'visible' });
      await connect(page);
      await press(page, 'X');
      await page.waitForSelector('[data-gamepad-initial-scope^="battle-controller-items"]');
      await press(page, 'B');
      expect(await page.locator('[data-gamepad-initial-scope^="battle-controller-items"]').count() === 0, 'Bで戦闘アイテム一覧が閉じない');
      await press(page, 'RT');
      const activeAfterRt = await activeElementSnapshot(page);
      expect(activeAfterRt?.zone === 'battle-enemies', `RT後のゾーンが敵ではない: ${activeAfterRt?.zone}`);
      await press(page, 'RB');
      await press(page, 'Y');
    });

    await test('風来の小学生2作品で8方向移動とRT投擲を認識する', async () => {
      for (const screen of ['MINI_GAME_DUNGEON', 'MINI_GAME_DUNGEON_2']) {
        await page.goto(`${BASE_URL}/?gamepadTestScreen=${screen}`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.mini-game-dungeon-screen');
        await page.evaluate(() => {
          window.__gamepadTestKeys = [];
          window.addEventListener('keydown', event => window.__gamepadTestKeys.push(event.key));
        });
        await connect(page);

        const directions = [
          [-1, -1, 'Home'],
          [0, -1, 'ArrowUp'],
          [1, -1, 'PageUp'],
          [-1, 0, 'ArrowLeft'],
          [1, 0, 'ArrowRight'],
          [-1, 1, 'End'],
          [0, 1, 'ArrowDown'],
          [1, 1, 'PageDown'],
        ];
        for (const [x, y] of directions) await moveStick(page, x, y);
        await pressTogether(page, ['RIGHT', 'DOWN']);

        const capturedKeys = await page.evaluate(() => window.__gamepadTestKeys);
        for (const expectedKey of directions.map(([, , key]) => key)) {
          expect(capturedKeys.includes(expectedKey), `${screen}で${expectedKey}が送出されない`);
        }
        expect(capturedKeys.filter(key => key === 'PageDown').length >= 2, `${screen}で方向パッドの右下同時入力が斜めにならない`);

        await press(page, 'RT');
        const logText = await page.locator('.dungeon-log-panel').innerText();
        expect(
          /飛び道具を装備していない|無くなった|はずした|ダメージ|たおした|壁に当たった/.test(logText),
          `${screen}でRT投擲の結果がログに出ない: ${logText}`,
        );
      }
    });

    await test('Viewボタンのゲームメニューから継続・タイトル復帰を選べる', async () => {
      await page.goto(`${BASE_URL}/?gamepadTestScreen=HELP`, { waitUntil: 'domcontentloaded' });
      await connect(page);
      await press(page, 'BACK');
      await page.waitForSelector('[aria-label="ゲームメニュー"]');
      const quitButton = page.locator('[aria-label="ゲームメニュー"] button').filter({ hasText: 'ゲームを閉じる' });
      expect(await quitButton.isDisabled(), 'ブラウザーでは終了ボタンが無効であるべき');
      await press(page, 'B');
      expect(await page.locator('[aria-label="ゲームメニュー"]').count() === 0, 'Bでゲームメニューが閉じない');

      await press(page, 'BACK');
      await page.locator('[aria-label="ゲームメニュー"] button').filter({ hasText: 'タイトル画面へ戻る' }).focus();
      await press(page, 'A');
      await page.waitForSelector('.start-menu-root');
    });

    const previewScreens = [
      'MODE_SELECTION', 'DIFFICULTY_SELECTION', 'CHARACTER_SELECTION', 'RELIC_SELECTION',
      'DECK_CONSTRUCTION', 'TYPING_MODE_SELECTION', 'MAP', 'REST', 'SHOP', 'GARDEN', 'PROBLEM_CHALLENGE',
      'MINI_GAME_SELECT', 'DODGEBALL_SHOOTING', 'BASKETBALL_LAYUP',
      'MINI_GAME_GO_HOME', 'MINI_GAME_GO_HOME:GAME_OVER',
      'MINI_GAME_SURVIVOR', 'MINI_GAME_SURVIVOR:GAME_OVER',
      'MINI_GAME_POKER', 'MINI_GAME_POKER:GAME_OVER', 'MINI_GAME_POKER:ENDING',
      'MINI_GAME_DUNGEON', 'MINI_GAME_DUNGEON:DUNGEON_SHOP',
      'MINI_GAME_DUNGEON:GAME_OVER', 'MINI_GAME_DUNGEON:ENDING',
      'MINI_GAME_DUNGEON_2', 'MINI_GAME_DUNGEON_2:DUNGEON_SHOP',
      'MINI_GAME_DUNGEON_2:GAME_OVER', 'MINI_GAME_DUNGEON_2:ENDING',
      'MINI_GAME_KOCHO', 'MINI_GAME_KOCHO:KOCHO_REWARD',
      'MINI_GAME_KOCHO:KOCHO_UPGRADE', 'MINI_GAME_KOCHO:KOCHO_SHOP',
      'MINI_GAME_KOCHO:GAME_OVER', 'MINI_GAME_KOCHO:ENDING',
      'MINI_GAME_PAPER_PLANE', 'MINI_GAME_PAPER_PLANE:PAPER_REWARD',
      'MINI_GAME_PAPER_PLANE:PAPER_EQUIP', 'MINI_GAME_PAPER_PLANE:PAPER_VACATION',
      'MINI_GAME_PAPER_PLANE:PAPER_HANGAR', 'MINI_GAME_PAPER_PLANE:GAME_OVER',
      'MINI_GAME_PAPER_PLANE:ENDING',
      'COMPENDIUM', 'RANKING', 'HELP', 'REWARD_CARD_ALBUM',
      'ASSIGNMENT_CREATE', 'SUBMISSION',
      'FLOOR_RESULT', 'ENDING', 'MAGIC_ROMANCE_ENDING', 'GAME_OVER',
    ];

    await test('全主要画面で接続後に可視フォーカスまたはゲーム操作面を取得する', async () => {
      const failures = [];
      for (const screen of previewScreens.filter(screen => !screenFilter || screenFilter.test(screen))) {
        await page.goto(`${BASE_URL}/?gamepadTestScreen=${encodeURIComponent(screen)}`, { waitUntil: 'domcontentloaded' });
        await connect(page);
        await press(page, 'DOWN');
        const active = await activeElementSnapshot(page);
        const gameplaySurface = await page.locator([
          '.mini-game-dungeon-screen',
          '.mini-game-survivor-screen',
          '.mini-game-go-home-screen',
          '.dodgeball-shooting-screen',
          '.mini-game-dodgeball-screen',
        ].join(',')).count();
        if ((!active?.visible || active.tag === 'BODY') && gameplaySurface === 0) {
          failures.push(screen);
        }
        await press(page, 'BACK');
        if (await page.locator('[aria-label="ゲームメニュー"]').count() !== 1) {
          await page.evaluate(() => window.dispatchEvent(new CustomEvent('learning-rogue:open-gamepad-system-menu')));
          await delay(120);
          const opensManually = await page.locator('[aria-label="ゲームメニュー"]').count() === 1;
          process.stdout.write(`  debug ${screen}: manualEvent=${opensManually}, body=${(await page.locator('body').innerText()).slice(0, 160).replaceAll('\n', ' / ')}\n`);
          failures.push(`${screen}(Viewメニュー)`);
          if (opensManually) await press(page, 'B');
        } else {
          await press(page, 'B');
        }
      }
      expect(failures.length === 0, `操作開始点がない画面: ${failures.join(', ')}`);
    });

    await browser.close();
    const failed = results.filter(result => !result.ok);
    process.stdout.write(`\n${results.length - failed.length}/${results.length} tests passed\n`);
    if (failed.length > 0) process.exitCode = 1;
  } finally {
    vite.kill('SIGTERM');
    await Promise.race([once(vite, 'exit'), delay(2_000)]);
    if (vite.exitCode === null) vite.kill('SIGKILL');
    if (process.exitCode) process.stderr.write(viteOutput);
  }
};

await run();
