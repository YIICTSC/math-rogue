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
  window.frontierBattleSounds = [];
  for (const name of ['playAttackEffectSound', 'playStatusEffectSound']) {
    const play = audioService[name].bind(audioService);
    audioService[name] = (sound, ...args) => {
      window.frontierBattleSounds.push(sound);
      return play(sound, ...args);
    };
  }
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
    const card = view
      .locator('.mini-game-select-card')
      .filter({ has: view.locator('[style*="badges/school-trpg.png"]') });
    await card.getByLabel('Learning Rogue Frontier', { exact: true }).waitFor();
    await card.click();
    await view.getByRole('heading', { name: 'Learning Rogue Frontier', exact: true }).waitFor();
    assert.equal(await view.locator('.illustrated-mini-entry').count(), 0, 'The game opens directly on the Frontier title');
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
  async function checkOnScreen(locator, label) {
    assert(await locator.count(), label + ' is rendered');
    const hidden = await locator.evaluateAll((elements) => elements
      .map((element) => ({ label: element.getAttribute('aria-label') || element.textContent.trim(), box: element.getBoundingClientRect() }))
      .filter(({ box }) => box.left < -1 || box.top < -1 || box.right > innerWidth + 1 || box.bottom > innerHeight + 1 || !box.width || !box.height)
      .map((element) => element.label));
    assert.deepEqual(hidden, [], label + ' must be on screen without scrolling');
  }
  const smallScreens = [{ width: 320, height: 568 }, { width: 568, height: 320 }];
  async function openExploreOptions() {
    if (!await view.getByRole('dialog').count()) await click('Explore options');
  }
  async function closePanel() {
    if (await view.getByRole('dialog').count()) await click('Close');
  }
  await view.addInitScript(() => {
    crypto.randomUUID = () => '8feb957a-c6f6-4b4b-87f2-1c47b85a7941';
  });
  await view.goto(url);
  await open();
  for (const viewport of smallScreens) {
    await view.setViewportSize(viewport);
    await view.waitForFunction(() => {
      const image = document.querySelector('.sa-frontier-art img');
      const expected = innerWidth > innerHeight ? 'wide' : 'portrait';
      return image?.naturalWidth > 0 && image.currentSrc.includes('frontier-title-' + expected);
    });
    await checkOnScreen(view.locator('.sa-frontier-title button'), 'Frontier title');
    await snap('frontier-title-' + viewport.width);
  }
  await view.setViewportSize({ width: 390, height: 844 });
  await snap('title-phone');
  await click('New character');
  const portraits = view.getByRole('group', { name: 'Character portraits' }).getByRole('button');
  await portraits.first().waitFor();
  assert.equal(await portraits.count(), 10);
  await click('Men');
  await view.getByRole('button', { name: 'Man portrait 1', exact: true }).waitFor();
  assert.equal(await portraits.count(), 10);
  await click('Next portraits');
  await click('Man portrait 20');
  for (const viewport of smallScreens) {
    await view.setViewportSize(viewport);
    await checkOnScreen(view.getByRole('button', { name: 'Begin the adventure' }), 'Create action');
    await checkOnScreen(portraits, 'Portrait choices');
  }
  await view.setViewportSize({ width: 390, height: 844 });
  await view.getByLabel('Name', { exact: true }).fill('Aoi of Bellwick');
  await click('Background');
  await click('Lantern Envoy');
  await click('Attributes');
  await click('Might −');
  await click('Presence ＋');
  await snap('creator-phone');
  await view.setViewportSize({ width: 1300, height: 850 });
  await view.locator('.sa-app').evaluate((element) => (element.scrollTop = 0));
  await snap('creator-desktop');
  await click('Journey rules');
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
          if (!record.inspected.includes(cell)) {
            if (!await inspect.isVisible()) await openExploreOptions();
            await inspect.click();
          }
          await openExploreOptions();
          await click(['Moon', 'Star', 'Flame'][floor.answer]);
          await closePanel();
        } else if (floor.features[cell] === 'trap') {
          await openExploreOptions();
          await click('Disarm mechanism');
          await closePanel();
        }
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
  for (const viewport of smallScreens) {
    await view.setViewportSize(viewport);
    await checkOnScreen(view.locator('.sa-town-hub-actions button'), 'Town activities');
    await checkOnScreen(view.locator('.sa-town-utility button'), 'Hydration and life guide');
    await checkViewport();
    await snap('frontier-town-' + viewport.width);
  }
  await view.setViewportSize({ width: 1300, height: 850 });
  await click('Commissions');
  await view.getByRole('dialog').waitFor();
  await closePanel();
  await click('How to live in the Frontier');
  const living = view.getByRole('dialog', { name: 'How to live in the Frontier' });
  await living.getByRole('heading', { name: 'Water and travel' }).waitFor();
  await living.getByRole('heading', { name: 'Meals and rest' }).waitFor();
  await living.getByText('After 24 hours', { exact: false }).waitFor();
  await closePanel();

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
  await click('Home');
  await view.getByRole('button', { name: /^Buy a house/ }).click();
  await click('Market');
  await view
    .getByRole('button', { name: /^Buy.* G$/ })
    .first()
    .waitFor();
  const seed = view.locator('.sa-market > div').filter({ hasText: 'Seeds' });
  await seed.getByRole('button', { name: /^Buy/ }).click();
  await click('Home');
  await view.getByRole('button', { name: /^Plant seeds/ }).click();
  for (let i = 0; i < 3; i++) await click('Wait eight hours');
  await click('Harvest');
  assert.equal((await slot()).counters.harvests, 1);
  assert((await slot()).time - (await slot()).lastMealAt >= 24, 'Waiting creates hunger');
  await click('Meals');
  await view.getByRole('button', { name: /^Get a hot meal/ }).click();
  const fed = await slot();
  assert(fed.time - fed.lastMealAt < 24);
  const innkeeper = model.residentsAt(fed.location).find((person) => person.role === 'host');
  await click('Home');
  for (let i = 0; i < 5 && !model.residentPresent(innkeeper, (await slot()).time); i++)
    await view.getByRole('button', { name: /^Rest on a bench/ }).click();
  await click('People');
  await view.locator('.sa-npc-head .sa-resident-portrait').waitFor();
  await click('Talk');
  await view.getByRole('button', { name: /^Give a gift/ }).click();
  await view.getByRole('button', { name: /^Invite to travel/ }).click();
  assert.equal((await slot()).followers.length, 1);
  await click('Map');
  for (const viewport of smallScreens) {
    await view.setViewportSize(viewport);
    await checkOnScreen(view.locator('.sa-map-tile'), 'Full world map');
    await checkOnScreen(view.locator('.sa-travel-actions button'), 'Map actions');
    await snap('frontier-map-' + viewport.width);
  }
  await view.setViewportSize({ width: 1300, height: 850 });
  await click('Roads and notes');
  await view.getByRole('button', { name: /^East · / }).click();
  await click('Cross into another realm');
  await view.getByLabel('World code', { exact: true }).fill('moon-tide');
  await click('Cross');
  assert.equal((await slot()).location.world, 'moon-tide');
  await view.getByRole('button', { name: /^Return to your home base/ }).click();
  assert.deepEqual((await slot()).location, startTown.location);
  await closePanel();
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
  for (const viewport of [...smallScreens, { width: 844, height: 390 }]) {
    await view.setViewportSize(viewport);
    const dpad = view.locator('.sa-delve-movement');
    const actions = view.locator('.sa-delve-actions');
    await checkOnScreen(dpad.locator('button'), 'Exploration D-pad');
    await checkOnScreen(actions.locator('button'), 'Exploration actions');
    const [left, right, feed] = await Promise.all([dpad.boundingBox(), actions.boundingBox(), view.locator('.sa-feed').boundingBox()]);
    assert(left.x + left.width <= right.x + 2, 'Movement is in the bottom-left and actions are in the bottom-right');
    assert(Math.abs(left.y + left.height - (right.y + right.height)) < 12);
    assert(left.y + left.height <= feed.y + 1 && right.y + right.height <= feed.y + 1);
    await snap('frontier-dungeon-' + viewport.width);
  }
  await view.setViewportSize({ width: 390, height: 844 });
  await click('Automap');
  await view.getByRole('dialog').getByRole('img', { name: /^Mapped tiles/ }).waitFor();
  const savedDir = (await slot()).delve.direction;
  await view.keyboard.press('ArrowRight');
  assert.equal((await slot()).delve.direction, savedDir, 'An open map blocks movement shortcuts');
  await closePanel();
  await view.getByRole('button', { name: 'Turn right', exact: true }).tap();
  assert.equal((await slot()).delve.direction, (savedDir + 1) % 4);
  await click('Supplies and powers');
  await view.getByRole('dialog').getByText('Flasks and liquids', { exact: false }).waitFor();
  await closePanel();
  await click('Adventure log');
  await view.getByRole('dialog').waitFor();
  await closePanel();
  await snap('dungeon-phone');
  const initial = await slot();
  const floor = model.generateFloor(initial.location, 1);
  const target = Object.entries(floor.features).find(([, feature]) => feature === 'pack');
  await walkInRuin(floor, Number(target[0]));
  await click('Confront');
  const tutorial = view.getByRole('dialog', { name: 'Your first Frontier battle' });
  await tutorial.waitFor();
  const firstTurn = (await slot()).delve.encounter.turn;
  await view.waitForTimeout(925);
  assert.equal((await slot()).delve.encounter.turn, firstTurn, 'The first battle waits for the tutorial');
  await tutorial.getByRole('button', { name: 'Continue to battle' }).tap();
  await view.getByRole('group', { name: 'Combat targets' }).waitFor();
  await click('Pause');
  const pausedTurn = (await slot()).delve.encounter.turn;
  await view.waitForTimeout(1000);
  assert.equal((await slot()).delve.encounter.turn, pausedTurn);
  await click('Battle options');
  assert.equal(await view.locator('.sa-combat-party article').count(), 2);
  await click('Combat tutorial');
  await tutorial.waitFor();
  await closePanel();
  await click('Combat techniques');
  const techniques = view.getByRole('dialog', { name: 'Combat techniques' });
  await techniques.getByRole('heading', { name: 'Star-ash pulse' }).waitFor();
  await techniques.getByRole('heading', { name: 'Disarming question' }).waitFor();
  await snap('battle-phone');
  await closePanel();
  for (const viewport of [
    { width: 844, height: 390 },
    { width: 568, height: 320 },
  ]) {
    await view.setViewportSize(viewport);
    await view.locator('.sa-main').evaluate((element) => {
      element.scrollTop = 0;
    });
    await checkViewport();
    await checkOnScreen(view.locator('.sa-delve-quick button'), 'Automatic battle actions');
    await click('Battle options');
    await checkOnScreen(view.getByRole('button', { name: 'Try to retreat', exact: true }), 'Retreat');
    await closePanel();
    await view.locator('.sa-scene-line').scrollIntoViewIfNeeded();
    const round = await view.locator('.sa-scene-line').boundingBox();
    const enemy = await view.locator('.sa-foe').first().boundingBox();
    await snap('battle-landscape-' + viewport.width);
    assert(round.y + round.height <= enemy.y, 'Turn and combo stay above the combat targets');
  }
  await click('Resume combat');
  await view.waitForFunction(() =>
    window.frontierBattleSounds.some((cue) => ['slash', 'flash', 'projectile', 'lightning', 'wind', 'impact'].includes(cue)),
  );
  await view.getByRole('group', { name: 'Combat targets' }).waitFor({ state: 'detached', timeout: 25000 });
  assert((await slot()).counters.combats >= 1);
  await click('Return to town');
  await click('Title');
  await view.reload();
  await open();
  for (const viewport of smallScreens) {
    await view.setViewportSize(viewport);
    await checkOnScreen(view.locator('.sa-frontier-title button'), 'Saved-game title actions');
  }
  await click(/^Adventure saves/);
  await view.getByRole('dialog').getByRole('button', { name: /^Aoi of Bellwick/ }).waitFor();
  await closePanel();
  await click(/^Continue/);
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
  await click('Market');
  if (!returning.goods.grain) {
    await view.locator('.sa-market > div').filter({ hasText: 'Grain' }).getByRole('button', { name: /^Buy/ }).click();
  }
  if (!returning.goods.meat) {
    await view.locator('.sa-market > div').filter({ hasText: 'Beast meat' }).getByRole('button', { name: /^Buy/ }).click();
  }
  await click('Meals');
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
  await click('Party and formation');
  await view.getByLabel('Combat formation').selectOption('envoy');
  assert.equal((await slot()).journey.formation, 'envoy');
  await click('Title');
  await view.reload();
  await open();
  await click(/^Continue/);
  assert.equal((await slot()).journey.expeditions['academy-clocktower'].clears, 1);
  assert.equal((await slot()).journey.relic, 'academy');
  assert.deepEqual((await slot()).journey.tasted, ['bell-bento']);

  await view.setViewportSize({ width: 390, height: 844 });
  await click('Town life');
  await click('Market');
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
  await click('Examine inscription');
  await click(/^Read inscription/);
  await closePanel();
  assert.equal((await slot()).fieldwork.histories[site].chapters, 1);
  await walkInRuin(native, fixture.device);
  await click('Examine mechanism');
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
  await closePanel();
  await click('Return to town');
  await click('Journal');
  await click('Survey');
  assert.equal(await view.locator('.sa-faction-card').count(), 6);
  await view.getByText('The first bell warned of floods long before it announced classes.', { exact: true }).first().waitFor();
  await checkViewport();
  await snap('survey-landscape');

  await view.setViewportSize({ width: 390, height: 844 });
  await click('Explore');
  await click(/^Explore historic sites/);
  await view.waitForFunction(() => {
    const image = document.querySelector('.sa-site-photo');
    return image?.complete && image.naturalWidth > 0;
  });
  await click(/^Visit historic site/);
  await click('Read travel book');
  assert.equal((await slot()).frontier.sites[site].read, true);
  await click('Use the book or local goodwill');
  assert.equal((await slot()).frontier.sites[site].resolved, true);
  await click('Donate to the archive');
  assert.equal((await slot()).frontier.sites[site].donated, true);
  await click('Map');
  await click('Roads and notes');
  assert(await view.getByLabel('Historic site leads').locator('option').count() >= 2);
  await closePanel();
  await checkViewport();
  await click('Town life');
  await click('Market');
  for (const [id, name] of [['grain', 'Grain'], ['herb', 'Herbs']]) {
    if (!(await slot()).goods[id]) await view.locator('.sa-market > div').filter({ hasText: name }).first().getByRole('button', { name: /^Buy/ }).click();
  }
  await click('Journal');
  await click('Field guide');
  await click('Camp and rules');
  await view.getByLabel('Manual tactical combat').check();
  assert.equal((await slot()).frontier.rules.tactical, true);
  await view.getByText('Cook a combination meal', { exact: true }).click();
  await view.getByLabel('Main ingredient').selectOption('grain');
  await view.getByLabel('Seasoning').selectOption('herb');
  await click('Cook your blend');
  assert.equal((await slot()).frontier.recipe.base, 'grain');
  await snap('field-guide-phone');
  await view.getByLabel('Thirst and terrain effects').check();
  await click('Town life');
  await click('Home');
  await click('Wait eight hours');
  await click('Wait eight hours');
  await click('Explore');
  await click('Hydration');
  const hydration = view.getByRole('dialog', { name: 'Hydration' });
  await hydration.getByText(/Dehydrated|Thirsty/).waitFor();
  const beforeWater = await slot();
  assert(await hydration.getByRole('button', { name: /^Drink from the well/ }).isEnabled());
  await click(/^Drink from the well/);
  assert.equal((await slot()).frontier.hydration, beforeWater.time);
  assert.equal((await slot()).gold, beforeWater.gold);
  await hydration.getByText('Hydrated', { exact: true }).waitFor();
  const refill = hydration.getByRole('button', { name: /^Refill flask with water/ });
  if (await refill.isEnabled()) {
    await refill.tap();
    assert.equal((await slot()).frontier.liquids.water, beforeWater.frontier.liquids.water + 1);
    assert.equal((await slot()).gold, beforeWater.gold - 2);
  }
  await snap('frontier-hydration');
  await closePanel();
  await click('Journal');
  await view.getByLabel('Thirst and terrain effects').uncheck();
  await click('Town life');
  await click('Market');
  if ((await slot()).goods.lantern < 2) await oil.getByRole('button', { name: /^Buy/ }).click();
  await click('Explore');
  await click(/^Enter the ruins/);
  const remaining = (await slot()).floors[levelKey].cleared;
  const nextPack = Object.keys(native.features).map(Number).find((cell) => native.features[cell] === 'pack' && !remaining.includes(cell));
  assert(Number.isInteger(nextPack), 'The playtest ruin offers an unbeaten pack');
  await walkInRuin(native, nextPack);
  await click('Confront');
  const board = view.getByRole('group', { name: 'Combat positions' });
  await board.waitFor();
  const turn = (await slot()).delve.encounter.turn;
  await view.waitForTimeout(1100);
  assert.equal((await slot()).delve.encounter.turn, turn, 'Manual battles wait for the player');
  const step = board.locator('button[data-step]').first();
  const tile = Number(await step.getAttribute('data-tile'));
  const soundsBeforeStep = await view.evaluate(() => window.frontierBattleSounds.length);
  await step.tap();
  assert.equal((await slot()).delve.cell, tile);
  assert.equal((await slot()).delve.encounter.turn, turn + 1);
  await view.waitForFunction((count) =>
    window.frontierBattleSounds.slice(count).includes('impact'), soundsBeforeStep);
  await checkViewport();
  const strike = await view.locator('.sa-tactical-moves button').first().boundingBox();
  const feed = await view.locator('.sa-feed').boundingBox();
  assert(strike.y + strike.height <= feed.y, 'Primary battle actions fit above the travel log on phones');
  await snap('tactics-phone');
  for (const viewport of smallScreens) {
    await view.setViewportSize(viewport);
    await checkViewport();
    await checkOnScreen(board, 'Tactical board');
    await checkOnScreen(view.locator('.sa-tactical-moves button'), 'Tactical moves');
    await checkOnScreen(view.locator('.sa-delve-tools button'), 'Tactical shortcuts');
    const header = await view.locator('.sa-delve-head').boundingBox();
    const controls = await view.locator('.sa-delve-actions').boundingBox();
    assert(header.y + header.height <= controls.y + 1, 'Tactical moves leave the dungeon header unobstructed');
    await snap('frontier-tactics-' + viewport.width);
  }
  await view.setViewportSize({ width: 844, height: 390 });
  await checkViewport();
  await snap('tactics-landscape');
  await click('Title');
  await view.reload();
  await open();
  await click(/^Continue/);
  await board.waitFor();
  assert.equal((await slot()).delve.cell, tile);
  assert.equal((await slot()).delve.encounter.turn, turn + 1);
  const picturedFoe = board.locator('button[data-foe] img').first();
  await picturedFoe.waitFor();
  await view.waitForFunction(() => {
    const sprite = document.querySelector('.sa-tactical-unit img');
    return sprite?.naturalWidth > 0;
  });
  assert(await picturedFoe.getAttribute('src'), 'A creature sprite occupies its tactical tile');
  assert.equal(await tutorial.count(), 0, 'The tutorial stays dismissed after a reload');
  const firstFoe = board.locator('button[data-foe]').first();
  await firstFoe.tap();
  const foeCell = await firstFoe.getAttribute('data-tile');
  await click('Combat techniques');
  const pulse = techniques.getByRole('button', { name: 'Use · Star-ash pulse', exact: true });
  assert(await pulse.isEnabled(), 'The selected tactical foe is within casting range');
  const priorSounds = await view.evaluate(() => window.frontierBattleSounds.length);
  await pulse.tap();
  const impact = view.locator(`.sa-tactical-grid [data-battle-art="arcane"][data-hit-cell="${foeCell}"]`).first();
  await impact.waitFor({ state: 'attached', timeout: 3000 });
  const aim = await impact.evaluate((event) => parseFloat(event.style.getPropertyValue('--to-x')));
  assert.equal(aim, ((Number(foeCell) % model.SIDE) + 0.5) * (100 / model.SIDE));
  await impact.locator('.sa-strike-landing > img').evaluate((image) => image.decode(), null, { timeout: 3000 });
  await view.waitForFunction((count) => window.frontierBattleSounds.slice(count).includes('flash'), priorSounds);
  await view.waitForTimeout(135);
  await snap('tactics-directed-impact');
  assert.deepEqual(errors, []);

  const jp = await browser.newPage({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
  await jp.goto(url + '?jp=1');
  await jp
    .locator('.mini-game-select-card')
    .filter({ has: jp.locator('[style*="badges/school-trpg.png"]') })
    .click();
  await jp.getByRole('heading', { name: '学習ローグフロンティア', exact: true }).waitFor();
  await jp.screenshot({ path: out + '/title-ja-small.png' });
  await jp.getByRole('button', { name: /^物語キャンペーン/ }).click();
  await jp.getByText('放課後スクールTRPG', { exact: true }).waitFor();
  await jp.getByRole('button', { name: '戻る', exact: true }).click();
  await jp.getByRole('heading', { name: '学習ローグフロンティア', exact: true }).waitFor();
  await jp.setViewportSize({ width: 568, height: 320 });
  await checkOnScreen(jp.locator('.sa-frontier-title button'), 'Japanese landscape title');
  await jp.getByRole('button', { name: '新しい主人公', exact: true }).tap();
  await jp.getByLabel('名前', { exact: true }).fill('灯里');
  await jp.getByRole('button', { name: 'この主人公で冒険を始める', exact: true }).tap();
  await jp.getByRole('button', { name: '水分補給', exact: true }).tap();
  await jp.getByRole('dialog', { name: '水分補給' }).getByText('井戸で水を飲む', { exact: true }).waitFor();
  await jp.getByRole('button', { name: 'フロンティアの世界での生き方', exact: true }).last().tap();
  await jp.getByRole('dialog', { name: 'フロンティアの世界での生き方' })
    .getByRole('heading', { name: '食事と休息', exact: true }).waitFor();
  await jp.getByRole('button', { name: '閉じる', exact: true }).tap();
  await jp.getByRole('button', { name: '遺跡へ入る', exact: true }).tap();
  await checkOnScreen(jp.locator('.sa-delve-movement button, .sa-delve-actions button'), 'Japanese exploration controls');
  await jp.getByRole('button', { name: '右を向く', exact: true }).tap();
  await jp.getByRole('button', { name: '探索メニュー', exact: true }).tap();
  await jp.getByRole('dialog').getByRole('button', { name: '自由宣言', exact: true }).waitFor();
  console.log(
    'PASS Frontier title, campaign routing, JP/EN phone layouts, hydration, guide, first battle, directional combat art and sound, exploration, and save reload',
    out,
  );
} finally {
  await browser?.close();
  await vite.close();
  await rm(fixture, { force: true });
}
