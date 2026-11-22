import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const out = await mkdtemp(tmpdir() + '/school-playtest-');
const fixture = `.school-qa-fixture-${process.pid}.tsx`;
await writeFile(
  fixture,
  `
  import React from 'react';
  import { createRoot } from 'react-dom/client';
  import MiniGameSelectScreen from './src/components/MiniGameSelectScreen';
  import MiniGameRouter from './src/components/MiniGameRouter';
  import { GameMode } from './src/types';
  import { audioService } from './src/services/audioService';
  import './src/styles.css';
  audioService.playBGM = async () => {};
  const languageMode = new URLSearchParams(location.search).get('jp') ? 'JAPANESE' : 'ENGLISH';
  function Menu() {
    const [screen, select] = React.useState(null);
    return screen ? <MiniGameRouter screen={screen} problemMode={GameMode.MIXED}
      onBack={() => select(null)} languageMode={languageMode} /> :
      <MiniGameSelectScreen onSelect={select} onBack={() => {}}
        totalMathCorrect={0} mainClearCount={6} isDebug={false} languageMode={languageMode} />;
  }
  createRoot(document.getElementById('root'), { onCaughtError: (error) => console.error('CAUGHT', error.stack) }).render(<Menu />);
`,
);
const vite = await createServer({
  cacheDir: out + '/vite',
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: { ignored: () => true } },
  logLevel: 'error',
  optimizeDeps: {
    noDiscovery: true,
    include: [
      'react',
      'react-dom/client',
      'react/jsx-runtime',
      'lucide-react',
      'katex',
      '@capacitor/core',
    ],
  },
  plugins: [
    {
      name: 'school-adventure-playtest',
      configureServer(server) {
        server.middlewares.use('/school-qa', async (req, res) => {
          res.setHeader('Content-Type', 'text/html');
          res.end(
            await server.transformIndexHtml(
              req.url,
              `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><link rel="icon" href="data:,"/></head><body style="margin:0"><div id="root" style="height:100dvh;position:relative;overflow:hidden"></div><script type="module" src="/${fixture}"></script></body></html>`,
            ),
          );
        });
      },
    },
  ],
});
let browser;
try {
  await vite.listen();
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const url = 'http://127.0.0.1:' + vite.httpServer.address().port + '/school-qa';
  const view = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  view.setDefaultTimeout(45000);
  const errors = [];
  view.on('console', (message) => {
    if (message.type() === 'error') console.error(message.text().slice(0, 1800));
  });
  view.on('pageerror', (error) => {
    errors.push(error.message);
    console.error('PAGE ERROR', error.message);
  });
  view.on('response', (response) => {
    if (response.status() >= 400) console.error('HTTP', response.status(), response.url());
    if (response.url().includes('/school-adventure/') && response.status() >= 400)
      errors.push(response.status() + ' ' + response.url());
  });
  const click = (name) => view.getByRole('button', { name, exact: true }).click();
  const snap = (name) => view.screenshot({ path: out + '/' + name + '.png' });
  const slot = () =>
    view.evaluate(
      () => JSON.parse(localStorage.getItem('learning_rogue_school_trpg_adventure_v1')).slots[0],
    );
  async function open() {
    await view
      .locator('.mini-game-select-card')
      .filter({ has: view.locator('[style*="badges/school-trpg.png"]') })
      .click();
    await click(/^(Start|はじめる)/);
  }
  async function checkViewport() {
    const overflows = await view.evaluate(() => {
      const root = document.querySelector('.sa-app'),
        main = root?.querySelector('.sa-main');
      return Boolean(
        !root ||
          root.scrollWidth > innerWidth + 1 ||
          (main && main.scrollWidth > main.clientWidth + 1),
      );
    });
    assert(!overflows, 'main play controls must not cause horizontal overflow');
  }
  await view.addInitScript(() => {
    crypto.randomUUID = () => '8feb957a-c6f6-4b4b-87f2-1c47b85a7941';
  });
  await view.goto(url);
  await open();
  await view.getByRole('heading', { name: 'Roads of Bellreach' }).waitFor();
  await snap('title-phone');
  await click('New character');
  const portraits = view.getByRole('group', { name: 'Character portraits' }).getByRole('button');
  await portraits.first().waitFor();
  assert.equal(await portraits.count(), 20);
  await click('Men');
  await view.getByRole('button', { name: 'Man portrait 1', exact: true }).waitFor();
  assert.equal(await portraits.count(), 20);
  await click('Man portrait 20');
  await view.getByLabel('Name', { exact: true }).fill('Aoi of Bellwick');
  await click('Lantern Envoy');
  await click('Might −');
  await click('Presence ＋');
  await snap('creator-phone');
  await view.setViewportSize({ width: 1300, height: 850 });
  await view.locator('.sa-app').evaluate((element) => (element.scrollTop = 0));
  await snap('creator-desktop');
  await view.getByRole('radio', { name: /^Return to town/ }).check();
  await click('Begin the adventure');
  const model = await vite.ssrLoadModule('/src/mini-games/school-trpg/adventure/world.ts');
  const startTown = await slot();
  await view.getByRole('heading', { name: model.townAt(startTown.location).name[1] }).waitFor();
  assert.match(startTown.location.world, /^road-/);
  assert.equal(startTown.character.deathRule, 'return-town');
  assert.equal((await slot()).character.portrait, 'm20');
  assert.equal((await slot()).character.stats.presence, 4);
  await snap('town-desktop');
  await checkViewport();

  await click(/^Declare an action/);
  await view.getByLabel('What will you try?').fill('Translate a message for the market');
  await view.getByRole('button', { name: /^Use presence/ }).click();
  await view.getByLabel('Spend Inspiration').check();
  await click('Roll the dice');
  const roll = (await slot()).journal[0].check;
  assert.equal(roll.faces.length, 2);
  assert.equal((await slot()).inspiration, 0);
  await click('Town life');
  await view.getByRole('button', { name: /^Work a shift/ }).click();
  await view.getByRole('button', { name: /^Work a shift/ }).click();
  await view.getByRole('button', { name: /^Buy a house/ }).click();
  await view
    .getByRole('button', { name: /^Buy.* G$/ })
    .first()
    .waitFor();
  const seed = view.locator('.sa-market > div').filter({ hasText: 'Seeds' });
  await seed.getByRole('button', { name: /^Buy/ }).click();
  await view.getByRole('button', { name: /^Plant seeds/ }).click();
  for (let i = 0; i < 3; i++) await click('Wait eight hours');
  await click('Harvest');
  assert.equal((await slot()).counters.harvests, 1);
  assert((await slot()).time - (await slot()).lastMealAt >= 24, 'Waiting creates hunger');
  await view.getByRole('button', { name: /^Get a hot meal/ }).click();
  const fed = await slot();
  assert(fed.time - fed.lastMealAt < 24);
  const innkeeper = model.residentsAt(fed.location).find((person) => person.role === 'host');
  for (let i = 0; i < 5 && !model.residentPresent(innkeeper, (await slot()).time); i++)
    await view.getByRole('button', { name: /^Rest on a bench/ }).click();
  await click('People');
  await view.locator('.sa-npc-head .sa-resident-portrait').waitFor();
  await click('Talk');
  await view.getByRole('button', { name: /^Give a gift/ }).click();
  await view.getByRole('button', { name: /^Invite to travel/ }).click();
  assert.equal((await slot()).followers.length, 1);
  await click('Map');
  await view.getByRole('button', { name: /^East · / }).click();
  await view.getByLabel('World code', { exact: true }).fill('moon-tide');
  await click('Cross');
  assert.equal((await slot()).location.world, 'moon-tide');
  await view.getByRole('button', { name: /^Return to your home base/ }).click();
  assert.deepEqual((await slot()).location, startTown.location);
  await click('Journal');
  await view.getByLabel('Personal goal').fill('Open a village kitchen');
  await click('Add goal');
  await click('Mark complete');
  assert.equal((await slot()).goals[0].complete, true);

  await click('Explore');
  await view.getByRole('button', { name: /^Enter the ruins/ }).click();
  await view.locator('.sa-delve-head h1').waitFor();
  await view.locator('.sa-corridor-plane[data-surface=wall]').first().waitFor();
  for (const kind of ['floor', 'wall', 'ceiling']) {
    const face = view.locator('.sa-corridor-plane[data-surface=' + kind + ']').first();
    assert(await face.evaluate((el) => getComputedStyle(el).backgroundImage.includes('-atlas.png')));
  }
  assert.equal(await view.locator('.sa-dungeon-art').count(), 0);
  await view.setViewportSize({ width: 390, height: 844 });
  await checkViewport();
  await snap('dungeon-phone');
  const initial = await slot();
  const floor = model.generateFloor(initial.location, 1);
  const target = Object.entries(floor.features).find(([, feature]) => feature === 'pack');
  const wanted = Number(target[0]);
  const start = initial.delve.cell,
    came = new Map([[start, null]]);
  const queue = [start];
  for (const from of queue)
    for (let direction = 0; direction < 4; direction++) {
      const to = model.neighbor(from, direction);
      if (floor.open.has(to) && !came.has(to)) {
        came.set(to, { from, direction });
        queue.push(to);
      }
    }
  const moves = [];
  for (let cell = wanted; cell !== start; ) {
    const next = came.get(cell);
    moves.unshift(next.direction);
    cell = next.from;
  }
  for (const direction of moves) {
    const state = await slot();
    const feature = floor.features[state.delve.cell];
    if (!state.delve.light && state.goods.lantern) await view.getByRole('button', { name: /^Lamp oil ×/ }).click();
    if (feature === 'runes') {
      await click('Inspect');
      await click(['Moon', 'Star', 'Flame'][floor.answer]);
    } else if (feature === 'trap') await click('Disarm mechanism');
    while ((await slot()).delve.direction !== direction) await click('Turn right');
    await click('Step forward');
  }
  await click('Confront');
  await view.getByRole('group', { name: 'Combat targets' }).waitFor();
  await click('Pause');
  const pausedTurn = (await slot()).delve.encounter.turn;
  await view.waitForTimeout(1000);
  assert.equal((await slot()).delve.encounter.turn, pausedTurn);
  assert.equal(await view.locator('.sa-combat-party article').count(), 2);
  await snap('battle-phone');
  for (const viewport of [
    { width: 844, height: 390 },
    { width: 568, height: 320 },
  ]) {
    await view.setViewportSize(viewport);
    await view.locator('.sa-main').evaluate((element) => {
      element.scrollTop = 0;
    });
    await checkViewport();
    const retreat = view.getByRole('button', { name: 'Try to retreat', exact: true });
    await retreat.scrollIntoViewIfNeeded();
    assert(await retreat.isVisible(), 'Retreat remains accessible at width ' + viewport.width);
    await view.locator('.sa-scene-line').scrollIntoViewIfNeeded();
    const round = await view.locator('.sa-scene-line').boundingBox();
    const enemy = await view.locator('.sa-foe').first().boundingBox();
    await snap('battle-landscape-' + viewport.width);
    assert(round.y + round.height <= enemy.y, 'Turn and combo stay above the combat targets');
  }
  await click('Resume combat');
  await view.getByRole('group', { name: 'Combat targets' }).waitFor({ state: 'detached', timeout: 25000 });
  assert((await slot()).counters.combats >= 1);
  await click('Return to town');
  await click('Title');
  await view.reload();
  await open();
  await click('Continue');
  assert.equal((await slot()).character.name, 'Aoi of Bellwick');
  assert.equal((await slot()).counters.harvests, 1);
  assert.deepEqual(errors, []);

  const jp = await browser.newPage({ viewport: { width: 320, height: 568 } });
  await jp.goto(url + '?jp=1');
  await jp
    .locator('.mini-game-select-card')
    .filter({ has: jp.locator('[style*="badges/school-trpg.png"]') })
    .click();
  await jp.getByRole('button', { name: /^はじめる/ }).click();
  await jp.getByRole('heading', { name: '鐘灯の自由冒険' }).waitFor();
  await jp.screenshot({ path: out + '/title-ja-small.png' });
  await jp.getByRole('button', { name: '物語を開く' }).click();
  await jp.locator('body').getByText('放課後スクールTRPG', { exact: false }).first().waitFor();
  console.log(
    'PASS router, creator, rolls, meals, gardening, scheduled residents, realms, goals, textured corridors, paused/automatic combat, reload and legacy entry',
    out,
  );
} finally {
  await browser?.close();
  await vite.close();
  await rm(fixture, { force: true });
}
