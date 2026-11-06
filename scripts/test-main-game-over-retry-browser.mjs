import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const server = await createServer({
  cacheDir: 'node_modules/.vite-main-game-over-retry-test',
  optimizeDeps: {
    noDiscovery: true,
    include: ['react', 'react-dom/client', 'react/jsx-runtime', 'peerjs', 'lucide-react'],
  },
  define: { 'import.meta.env.VITE_ENABLE_DEBUG_FEATURES': '"true"' },
  server: { host: '127.0.0.1', port: 0, hmr: false },
  plugins: [{
    name: 'main-game-over-retry-test',
    enforce: 'pre',
    async load(id) {
      if (!id.replaceAll('\\', '/').endsWith('/src/App.tsx')) return;
      const source = await readFile(id, 'utf8');
      const returnAt = source.lastIndexOf('\n    return (');
      assert.ok(returnAt > 0, 'App render return point exists');
      const testApi = `
    Object.assign(window, { __mainGameOverRetryTest: {
      seed() {
        const player = { ...gameState.player, deck: gameState.player.deck.length ? gameState.player.deck : createDeck() };
        const overState = { ...gameState, screen: GameScreen.GAME_OVER, challengeMode: undefined, difficultyLevel: 1, player };
        storageService.saveGame({ ...overState, screen: GameScreen.MAP });
        setHasSave(true);
        setGameState(overState);
      },
      state() { return { screen: gameState.screen, hasSave, confirmVisible: showStartOverConfirm, legacyCard: storageService.getLegacyCard(), savedScreen: storageService.loadGame()?.screen ?? null }; },
    }});
`;
      return source.slice(0, returnAt) + testApi + source.slice(returnAt);
    },
  }],
  logLevel: 'error',
});

let browser;
let page;
const errors = [];
try {
  await server.listen();
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || (process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : '/usr/bin/chromium'),
    args: ['--no-sandbox'],
  });
  page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(60000);
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('pixel_spire_language_mode_v1', 'JAPANESE');
    localStorage.setItem('pixel_spire_seen_battle_tutorial_v1', 'true');
    localStorage.setItem('pixel_spire_seen_parry_tutorial_v1', 'true');
    localStorage.setItem('unit-board-seen:MULTIPLICATION', '1');
  });
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/`, {
    waitUntil: 'domcontentloaded',
    timeout: 240000,
  });
  await page.getByRole('button', { name: '小学5年生', exact: true }).click();
  await page.getByRole('button', { name: 'あとで決める', exact: true }).last().click();
  await page.waitForFunction(() => !!window.__mainGameOverRetryTest);
  await page.evaluate(() => window.__mainGameOverRetryTest.seed());
  await page.locator('.game-over-screen').waitFor();
  await page.locator('.game-over-legacy-list > div').first().click();
  assert(await page.evaluate(() => Boolean(window.__mainGameOverRetryTest.state().legacyCard)), 'selected legacy card is saved');

  await page.getByRole('button', { name: '再挑戦', exact: true }).click();
  await page.waitForFunction(() => window.__mainGameOverRetryTest.state().screen !== 'GAME_OVER');
  await page.waitForFunction(() => {
    const savedScreen = window.__mainGameOverRetryTest.state().savedScreen;
    return savedScreen !== null && savedScreen !== 'MAP';
  });
  const state = await page.evaluate(() => window.__mainGameOverRetryTest.state());
  assert.equal(state.confirmVisible, false, 'retry must not open the saved-game overwrite modal');
  assert.equal(state.hasSave, false, 'the defeated run is cleared before retry');
  assert(state.legacyCard, 'the selected inheritance card remains saved for the new run');
  assert.notEqual(state.savedScreen, 'GAME_OVER', 'the defeat save is replaced by the fresh retry state');
  assert.deepEqual(errors, []);
  console.log('PASS main game-over retry: selected legacy card is retained, old save is cleared, and no continue-data modal appears.');
} catch (error) {
  if (page) {
    await page.screenshot({ path: 'tmp/main-game-over-retry-failure.png' });
    console.error('Page errors:', errors);
    console.error((await page.locator('body').innerText()).slice(0, 1200));
  }
  throw error;
} finally {
  await browser?.close();
  await server.close();
}
