import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';

const vite = await createServer({
  server: { middlewareMode: true, hmr: false, watch: { ignored: () => true } },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: 'custom',
  logLevel: 'error',
});
try {
  const path = '/src/mini-games/school-trpg/adventure/';
  const [engine, state, world, save, life, delve] = await Promise.all(
    ['engine', 'state', 'world', 'save', 'life', 'delve'].map((file) =>
      vite.ssrLoadModule(path + file + '.ts'),
    ),
  );
  const { adventureTransition: transition } = engine;
  const { defaultCharacter, startAdventure, PORTRAIT_IDS, nextRandom } = state;
  const draft = { ...defaultCharacter(), name: 'Aoi', calling: 'envoy' };
  const newGame = () => startAdventure(draft, 'test-adventure');
  const play = (current, action) => {
    const next = transition(current, action);
    assert.notEqual(next, current, 'Expected a legal action: ' + JSON.stringify(action));
    assert.equal(next.revision, current.revision + 1);
    return next;
  };
  assert.equal(PORTRAIT_IDS.filter((id) => id.startsWith('f')).length, 20);
  assert.equal(PORTRAIT_IDS.filter((id) => id.startsWith('m')).length, 20);
  const portraits = await Promise.all(
    PORTRAIT_IDS.map(async (id) => {
      const file = await readFile('public/sprites/school-adventure/' + id + '.webp');
      assert(file.length > 6000);
      return createHash('sha256').update(file).digest('hex');
    }),
  );
  assert.equal(new Set(portraits).size, 40);
  for (const biome of ['academy', 'grove', 'coast', 'alpine', 'ember', 'sky']) {
    for (const art of ['town-' + biome, 'town-' + biome + '-frontier', 'dungeon-' + biome]) {
      assert((await readFile('public/sprites/school-adventure/' + art + '.webp')).length > 10000);
    }
  }
  assert.equal(startAdventure({ ...draft, stats: { ...draft.stats, might: 4 } }, 'invalid'), null);
  assert.equal(startAdventure({ ...draft, portrait: 'm999' }, 'invalid'), null);
  assert.deepEqual(newGame(), newGame(), 'A character and seed reproduce the same initial state');

  function paths(floor, start = world.ENTRY_CELL) {
    const seen = new Map([[start, null]]);
    const queue = [start];
    for (const cell of queue)
      for (let dir = 0; dir < 4; dir++) {
        const next = world.neighbor(cell, dir);
        if (floor.open.has(next) && !seen.has(next)) {
          seen.set(next, { cell, dir });
          queue.push(next);
        }
      }
    return seen;
  }
  let floors = 0;
  const biomes = new Set();
  for (let seed = 0; seed < 24; seed++) {
    const location = { world: 'realm-' + seed, x: (seed % 5) - 3, y: Math.floor(seed / 5) - 2 };
    biomes.add(world.townAt(location).biome);
    for (const depth of [1, 2, 3, 6, 31, 305]) {
      const floor = world.generateFloor(location, depth);
      assert.deepEqual(floor, world.generateFloor(location, depth));
      const reached = paths(floor);
      assert.equal(reached.size, floor.open.size, 'Every room must be accessible');
      assert(reached.has(floor.stairs) && reached.has(floor.seal));
      assert.equal(floor.features[floor.stairs], 'stairs');
      assert.equal(floor.features[floor.seal], 'guardian');
      assert.equal(Object.keys(floor.features).length, 13);
      floors++;
    }
  }
  assert(biomes.size >= 5, 'Seeded frontiers expose diverse biomes');

  let lifeGame = newGame();
  const original = structuredClone(lifeGame);
  lifeGame = play(lifeGame, { type: 'life', activity: 'work' });
  assert.deepEqual(original, newGame());
  lifeGame = play(lifeGame, { type: 'life', activity: 'work' });
  lifeGame = play(lifeGame, { type: 'build', mode: 'buy' });
  lifeGame = play(lifeGame, { type: 'trade', good: 'seed', sell: false });
  lifeGame = play(lifeGame, { type: 'build', mode: 'plant' });
  assert.equal(transition(lifeGame, { type: 'build', mode: 'harvest' }), lifeGame);
  for (let i = 0; i < 3; i++) lifeGame = play(lifeGame, { type: 'rest', rest: 'bench', hours: 8 });
  lifeGame = play(lifeGame, { type: 'build', mode: 'harvest' });
  assert.equal(lifeGame.counters.harvests, 1);
  const host = world.residentsAt(lifeGame.location).find((resident) => resident.role === 'host');
  for (const verb of ['talk', 'gift', 'recruit'])
    lifeGame = play(lifeGame, { type: 'social', id: host.id, verb });
  assert.equal(lifeGame.followers[0], host.id);
  assert(lifeGame.friends[host.id].trust >= 4);
  lifeGame = play(lifeGame, {
    type: 'declare',
    stat: 'presence',
    statement: 'Trade ideas at the fair',
    inspiration: true,
  });
  assert.equal(lifeGame.journal[0].check.faces.length, 2);
  assert.equal(lifeGame.inspiration, 0);
  assert(lifeGame.journal[0].text[1].includes('Trade ideas at the fair'));

  const seedFor = (predicate) => {
    for (let rng = 0; rng < 10000; rng++) if (predicate(1 + nextRandom({ rng }, 20))) return rng;
    throw new Error('No test die value');
  };
  const beforeTale = { ...lifeGame, rng: seedFor((face) => face === 20) };
  lifeGame = play(beforeTale, { type: 'tale', option: 0 });
  assert.equal(life.localBoon(lifeGame), 'roads');
  assert.equal(
    transition(lifeGame, { type: 'tale', option: 1 }),
    lifeGame,
    'Resolved towns keep their choices',
  );

  let delivery = world
    .missionsAt(lifeGame.location, lifeGame.time)
    .find((mission) => mission.kind === 'delivery');
  if (!delivery) {
    for (let i = 0; i < 3; i++)
      lifeGame = play(lifeGame, { type: 'rest', rest: 'bench', hours: 8 });
    delivery = world
      .missionsAt(lifeGame.location, lifeGame.time)
      .find((mission) => mission.kind === 'delivery');
  }
  assert(delivery);
  lifeGame = play(lifeGame, { type: 'mission', id: delivery.id });
  assert.equal(transition(lifeGame, { type: 'claim-mission' }), lifeGame);
  const to = world.DIRECTIONS.findIndex((_, i) =>
    world.sameAddress(world.atOffset(lifeGame.location, i), delivery.target),
  );
  lifeGame = play(lifeGame, { type: 'travel', direction: to });
  lifeGame = play(lifeGame, { type: 'claim-mission' });
  assert.equal(lifeGame.counters.contracts, 1);
  const bookmark = lifeGame.location;
  lifeGame = play(lifeGame, { type: 'gate', world: 'moon-tide' });
  lifeGame = play(lifeGame, { type: 'gate', world: 'bellreach' });
  assert.deepEqual(lifeGame.location, bookmark, 'Realm gates remember the previous departure town');
  lifeGame = play(lifeGame, { type: 'return-home' });
  assert.deepEqual(
    lifeGame.location,
    original.location,
    'The home base remains independent of realm gateways',
  );
  lifeGame = play(lifeGame, { type: 'goal', text: 'Live as a gardener' });
  lifeGame = play(lifeGame, { type: 'complete-goal', id: lifeGame.goals[0].id });
  assert(lifeGame.goals[0].complete);
  const beforeBadge = lifeGame.gold;
  lifeGame = play(lifeGame, { type: 'badge', id: 'towns' });
  assert.equal(lifeGame.badges.towns, 1);
  assert(lifeGame.gold > beforeBadge);
  assert.equal(transition(lifeGame, { type: 'badge', id: 'towns' }), lifeGame);

  let explorer = play(newGame(), { type: 'enter' });
  const floor = world.generateFloor(explorer.location, 1);
  function walkTo(current, target) {
    const reached = paths(floor, current.delve.cell);
    const route = [];
    for (let cell = target; cell !== current.delve.cell; ) {
      const step = reached.get(cell);
      route.unshift(step.dir);
      cell = step.cell;
    }
    for (const direction of route) {
      const here = current.delve.cell;
      if (!delve.recordFor(current, 1).cleared.includes(here)) {
        if (floor.features[here] === 'runes') {
          current = play(current, { type: 'feature', verb: 'inspect' });
          current = play(current, { type: 'feature', verb: 'open', symbol: floor.answer });
        } else if (floor.features[here] === 'trap')
          current = play(current, { type: 'feature', verb: 'pick' });
      }
      while (current.delve.direction !== direction)
        current = play(current, { type: 'move', direction: 'right' });
      if (!current.delve.light && current.goods.lantern)
        current = play(current, { type: 'use', good: 'lantern' });
      current = play(current, { type: 'move', direction: 'forward' });
      assert(!current.delve.encounter, 'Route keeps the lamp lit and avoids optional fights');
    }
    return current;
  }
  explorer = walkTo(explorer, floor.stairs);
  assert.equal(transition(explorer, { type: 'feature', verb: 'descend' }), explorer);
  explorer = walkTo(explorer, floor.seal);
  explorer = play(explorer, { type: 'feature', verb: 'confront' });
  assert(explorer.delve.encounter.guardian);
  assert.equal(transition(explorer, { type: 'leave-delve' }), explorer);
  explorer = play(explorer, { type: 'combat', move: 'study', target: 0 });
  assert(explorer.delve.encounter.enemies[0].known);
  explorer = { ...explorer, rng: seedFor((face) => face === 20) };
  explorer = play(explorer, { type: 'combat', move: 'parley', target: 0 });
  assert.equal(explorer.counters.pacified, 1);
  assert.equal(explorer.counters.combats, 0);
  assert(explorer.gear.length > 1);
  explorer = walkTo(explorer, floor.stairs);
  explorer = play(explorer, { type: 'feature', verb: 'descend' });
  assert.equal(explorer.delve.floor, 2);
  explorer = play(explorer, { type: 'feature', verb: 'ascend' });
  assert(
    delve.recordFor(explorer, 1).cleared.includes(floor.seal),
    'Retreating retains map and encounters',
  );
  explorer = play(explorer, { type: 'leave-delve' });
  explorer = play(explorer, { type: 'enter', floor: 2 });
  assert.equal(explorer.delve.floor, 2);

  const storage = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
  };
  const originalStory = await vite.ssrLoadModule('/src/mini-games/school-trpg/schoolTrpgSave.ts');
  storage.set(originalStory.SCHOOL_TRPG_SAVE_KEY, 'existing-story');
  assert.equal(save.saveAdventure(explorer, null), 'saved');
  assert.deepEqual(save.loadAdventures(), [explorer]);
  const newer = play(explorer, { type: 'goal', text: 'Return to floor three' });
  assert.equal(save.saveAdventure(newer, explorer.revision), 'saved');
  assert.equal(
    save.saveAdventure(explorer, explorer.revision),
    'changed',
    'An old tab cannot overwrite a newer save',
  );
  assert.deepEqual(save.loadAdventures(), [newer]);
  assert(save.deleteAdventure(newer.id));
  assert.deepEqual(save.loadAdventures(), []);
  assert.equal(storage.get(originalStory.SCHOOL_TRPG_SAVE_KEY), 'existing-story');
  console.log(
    `PASS 40 unique portraits, ${floors} seeded floors, work, homes, companions, commissions, changing worlds, nonviolent dungeon passage and save isolation.`,
  );
} finally {
  await vite.close();
}
