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
  const systems = await vite.ssrLoadModule('/src/mini-games/school-trpg/adventure/ruinSystems.ts');
  async function walkInRuin(floor, destination) {
    const { delve: current } = await slot();
    const came = new Map([[current.cell, null]]);
    const queue = [current.cell];
    for (const cell of queue) {
      for (let direction = 0; direction < 4; direction++) {
        const next = model.neighbor(cell, direction);
        if (!floor.open.has(next) || came.has(next)) continue;
        came.set(next, { cell, direction });
        queue.push(next);
      }
    }
    assert(came.has(destination), 'Destination exists in the native ruin layout');
    const directions = [];
    for (let cell = destination; cell !== current.cell;) {
      const path = came.get(cell);
      directions.unshift(path.direction);
      cell = path.cell;
    }
    for (const direction of directions) {
      const state = await slot();
      const { cell, light, floor: depth } = state.delve;
      const record = state.floors[model.floorKey(state.location, depth)];
      if (light < 5 && state.goods.lantern) await view.getByRole('button', { name: /^Lamp oil ×/ }).click();
      if (!record.cleared.includes(cell)) {
        if (floor.features[cell] === 'runes') {
          const inspect = view.getByRole('button', { name: 'Inspect', exact: true });
          if (!record.inspected.includes(cell)) await inspect.click();
          await click(['Moon', 'Star', 'Flame'][floor.answer]);
        } else if (floor.features[cell] === 'trap') await click('Disarm mechanism');
      }
      while ((await slot()).delve.direction !== direction) await click('Turn right');
      await click('Step forward');
    }
    assert.equal((await slot()).delve.cell, destination);
  }
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
  await walkInRuin(floor, Number(target[0]));
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

  await view.setViewportSize({ width: 390, height: 844 });
  await view.locator('.sa-town-expedition').click();
  const cards = view.getByRole('group', { name: 'Local expeditions' }).getByRole('button');
  assert.equal(await cards.count(), 4);
  await view.waitForFunction(() => [...document.querySelectorAll('.sa-expedition-card img')].every((image) => image.complete && image.naturalWidth > 0));
  await checkViewport();
  await snap('expeditions-phone');
  await view.setViewportSize({ width: 844, height: 390 });
  await checkViewport();
  await snap('expeditions-landscape');
  await click(/^The silent graduation bell/);
  await click('Accept expedition');
  await click('Find it on the map');
  await view.getByRole('button', { name: /^Travel here/ }).click();
  const roadClue = (await slot()).journey.expedition;
  assert.deepEqual((await slot()).location, roadClue.station);
  await click('Journal');
  await click(/^Investigate the clue/);
  await click('Find it on the map');
  await view.getByRole('button', { name: /^Travel here/ }).click();
  const returning = await slot();
  assert.deepEqual(returning.location, roadClue.source);
  await click('Town life');
  if (!returning.goods.grain) {
    await view.locator('.sa-market > div').filter({ hasText: 'Grain' }).getByRole('button', { name: /^Buy/ }).click();
  }
  if (!returning.goods.meat) {
    await view.locator('.sa-market > div').filter({ hasText: 'Beast meat' }).getByRole('button', { name: /^Buy/ }).click();
  }
  await view.locator('.sa-kitchen summary').click();
  const dish = view.locator('.sa-dish').filter({ hasText: 'Bellkeeper’s bento' });
  await dish.getByRole('button', { name: /^Cook/ }).click();
  await dish.getByRole('button', { name: 'Eat', exact: true }).click();
  assert.equal((await slot()).journey.meal.id, 'bell-bento');
  await click('Journal');
  await click('Report expedition');
  await click('Collections');
  const relic = view.locator('.sa-collection-card').filter({ hasText: 'Vellum medallion' });
  await relic.getByRole('button', { name: 'Unequip', exact: true }).click();
  assert.equal((await slot()).journey.relic, null);
  await relic.getByRole('button', { name: 'Equip', exact: true }).click();
  assert.equal((await slot()).journey.relic, 'academy');
  await view.setViewportSize({ width: 320, height: 568 });
  await checkViewport();
  await snap('collection-small');
  await click('People');
  await view.getByLabel('Combat formation').selectOption('envoy');
  assert.equal((await slot()).journey.formation, 'envoy');
  await click('Title');
  await view.reload();
  await open();
  await click('Continue');
  assert.equal((await slot()).journey.expeditions['academy-clocktower'].clears, 1);
  assert.equal((await slot()).journey.relic, 'academy');
  assert.deepEqual((await slot()).journey.tasted, ['bell-bento']);

  await view.setViewportSize({ width: 390, height: 844 });
  await click('Town life');
  const oil = view.locator('.sa-market > div').filter({ hasText: 'Lamp oil' });
  if ((await slot()).goods.lantern < 2) await oil.getByRole('button', { name: /^Buy/ }).click();
  await click('Explore');
  await click(/^Enter the ruins/);
  const survey = await slot();
  const site = model.addressKey(survey.location);
  const levelKey = model.floorKey(survey.location, 1);
  const native = model.generateFloor(survey.location, 1);
  const fixture = systems.ruinLayout(survey.location, 1);
  await walkInRuin(native, fixture.inscription);
  await click(/^Read inscription/);
  assert.equal((await slot()).fieldwork.histories[site].chapters, 1);
  await walkInRuin(native, fixture.device);
  await click('Inspect connections');
  await click('Use local history');
  assert.equal((await slot()).fieldwork.circuits[levelKey].mode, 'channel');
  assert.equal(await view.locator('.sa-maze [data-fixture="shortcut"]').count(), Number(fixture.shortcut >= 0));
  await checkViewport();
  await snap('mechanism-phone');
  await view.setViewportSize({ width: 844, height: 390 });
  await checkViewport();
  await click('Silence the bells');
  await click(/^Change setting/);
  assert.equal((await slot()).fieldwork.circuits[levelKey].mode, 'isolate');
  assert.equal(await view.locator('.sa-maze [data-fixture="shortcut"]').count(), 0);
  await click('Return to town');
  await click('Journal');
  await click('Survey');
  assert.equal(await view.locator('.sa-faction-card').count(), 6);
  await view.getByText('The first bell warned of floods long before it announced classes.', { exact: true }).first().waitFor();
  await checkViewport();
  await snap('survey-landscape');
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
    'PASS router, mobile portrait and landscape, expeditions, cooking, formations, automatic combat, ruin mechanisms and survey, save reload and legacy entry',
    out,
  );
} finally {
  await browser?.close();
  await vite.close();
  await rm(fixture, { force: true });
}
