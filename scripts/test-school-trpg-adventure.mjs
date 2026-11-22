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
  const [content, expeditions, journey, journeyContent, provisions, ruins] = await Promise.all(
    ['content', 'expeditions', 'journeyState', 'journeyContent', 'provisions', 'ruinConditions'].map((file) =>
      vite.ssrLoadModule(path + file + '.ts'),
    ),
  );
  const [systems, factions, fieldwork] = await Promise.all(
    ['ruinSystems', 'factions', 'fieldworkState'].map((file) => vite.ssrLoadModule(path + file + '.ts')),
  );
  const [field, frontier, fieldWorld, fieldActions, tactics] = await Promise.all(
    ['frontierContent', 'frontierState', 'frontierWorld', 'frontierActions', 'fieldTactics'].map((file) => vite.ssrLoadModule(path + file + '.ts')),
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
    for (const art of ['town-' + biome, 'town-' + biome + '-frontier']) {
      assert((await readFile('public/sprites/school-adventure/' + art + '.webp')).length > 10000);
    }
  }
  for (const surface of ['walls', 'floors', 'ceilings', 'residents']) {
    const image = await readFile('public/sprites/school-adventure/' + surface + '-atlas.png');
    assert(image.length > 10000);
    assert.equal(image.readUInt32BE(16), 768);
    assert.equal(image.readUInt32BE(20), 512);
  }
  const newArt = [
    ...journeyContent.ROUTES.map((route) => 'route-' + route.id),
    ...content.FOES.flatMap((foe) => (foe.artKey ? [foe.artKey] : [])),
    ...Object.values(journeyContent.RELICS).map((relic) => relic.art),
    ...Object.values(content.MASTERWORKS).map((item) => item.art),
    ...provisions.MEAL_IDS,
    ...content.BIOME_IDS.flatMap((id) => ['faction-', 'history-', 'mechanism-'].map((prefix) => prefix + id)),
  ];
  assert.equal(newArt.length, 84);
  const newArtHashes = await Promise.all(newArt.map(async (name) => {
    const image = await readFile('public/sprites/school-adventure/expedition/' + name + '.webp');
    assert.equal(image.subarray(8, 12).toString(), 'WEBP', name);
    assert(image.length > 2800, name);
    return createHash('sha256').update(image).digest('hex');
  }));
  assert.equal(new Set(newArtHashes).size, newArt.length);
  const fieldArt = [
    ...Object.values(field.DEVICES).map((device) => device.art),
    ...content.BIOME_IDS.map((biome) => 'site-' + biome),
  ];
  const fieldArtHashes = await Promise.all(fieldArt.map(async (name) => {
    const image = await readFile('public/sprites/school-adventure/frontier/' + name + '.webp');
    assert.equal(image.subarray(8, 12).toString(), 'WEBP', name);
    return createHash('sha256').update(image).digest('hex');
  }));
  assert.equal(new Set(fieldArtHashes).size, 14);
  assert.equal(new Set(journeyContent.ROUTES.map((route) => route.objective)).size, 7);
  for (const biome of content.BIOME_IDS) assert.equal(journeyContent.ROUTES.filter((route) => route.biome === biome).length, 4);
  const wardens = content.BIOME_IDS.map((biome) => content.FOES[content.regionalWardenIndex(biome)]);
  assert.equal(new Set(wardens.map((enemy) => enemy.pattern.join())).size, 6);
  assert.equal(startAdventure({ ...draft, stats: { ...draft.stats, might: 4 } }, 'invalid'), null);
  assert.equal(startAdventure({ ...draft, portrait: 'm999' }, 'invalid'), null);
  assert.deepEqual(newGame(), newGame(), 'A character and seed reproduce the same initial state');
  const openedJourneys = ['classic', 'daily', 'weekly'].map((runKind) => {
    const a = startAdventure({ ...draft, runKind }, 'a');
    const b = startAdventure({ ...draft, runKind }, 'b');
    assert.notEqual(a.id, b.id);
    if (runKind === 'classic') assert.notEqual(a.location.world, b.location.world);
    else {
      assert.deepEqual(a.location, b.location, runKind);
      assert.equal(a.rng, b.rng, runKind);
    }
    return a.location.world;
  });
  assert.equal(new Set(openedJourneys).size, 3);
  assert.equal(startAdventure({ ...draft, runKind: 'wander' }, 'wander').character.deathRule, 'return-town');
  assert.deepEqual(frontier.decodeFieldRules('BELL-111'), { weather: true, tactical: true, safeWalk: true });
  assert.equal(frontier.decodeFieldRules('bell-777'), null);
  const closedCorner = { open: new Set([0, world.SIDE + 1]), features: {} };
  assert(!fieldWorld.glancingSight(closedCorner, 0, world.SIDE + 1, 3));
  closedCorner.open.add(1);
  assert(fieldWorld.glancingSight(closedCorner, 0, world.SIDE + 1, 3));

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
      const layout = systems.ruinLayout(location, depth, floor);
      assert.notEqual(layout.device, layout.inscription);
      assert([layout.device, layout.inscription].every((cell) => floor.open.has(cell) && !floor.features[cell] && cell !== world.ENTRY_CELL));
      if (layout.shortcut >= 0) {
        assert(!floor.open.has(layout.shortcut));
        const open = systems.ruinFloor(location, depth, 'channel');
        assert.equal(open.open.size, floor.open.size + 1);
        assert(paths(open).has(layout.shortcut));
        assert.deepEqual(systems.ruinFloor(location, depth, 'isolate'), floor);
      }
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
  const { TALES } = await vite.ssrLoadModule(path + 'tales.ts');
  assert.equal(life.localBoon(lifeGame), TALES[world.townAt(lifeGame.location).biome].options[0].boon);
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
  lifeGame = play(lifeGame, { type: 'gate', world: bookmark.world });
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

  const { missedMeals, hungerPenalty, hoursUntilMeal, checkBonus, MAX_PARTY_SIZE } = state;
  let hungry = newGame();
  const initialHp = hungry.hp, initialFocus = hungry.focus, bonus = checkBonus(hungry, 'might');
  for (let i = 0; i < 3; i++) hungry = play(hungry, { type: 'rest', rest: 'bench', hours: 8 });
  assert.equal(missedMeals(hungry), 1);
  assert.equal(hungerPenalty(hungry), 3);
  assert(hungry.hp < initialHp && hungry.focus < initialFocus);
  assert(checkBonus(hungry, 'might') <= bonus - 3);
  hungry = play(hungry, { type: 'use', good: 'ration' });
  assert.equal(missedMeals(hungry), 0);
  hungry = play(hungry, { type: 'rest', rest: 'bench', hours: 8 });
  const beforeMeal = hungry.gold;
  hungry = play(hungry, { type: 'inn-meal' });
  assert.equal(hungry.gold, beforeMeal - life.INN_MEAL_PRICE);
  assert.equal(hoursUntilMeal(hungry), 23);

  let fallen = { ...newGame(), hp: 1, time: newGame().lastMealAt + 23 };
  fallen = play(fallen, { type: 'rest', rest: 'bench', hours: 2 });
  assert.equal(fallen.hp, 0);
  assert.equal(fallen.fallenAt, fallen.time);
  assert.equal(transition(fallen, { type: 'use', good: 'ration' }), fallen);
  let rescued = startAdventure({ ...draft, deathRule: 'return-town' }, 'rescue');
  rescued = play({ ...rescued, hp: 1, time: rescued.lastMealAt + 23 }, { type: 'rest', rest: 'inn' });
  assert.equal(rescued.defeats, 1);
  assert(rescued.hp > 0 && rescued.delve === null && rescued.fallenAt === null);
  assert.equal(missedMeals(rescued), 0);

  let builder = startAdventure(draft, 'builder');
  Object.assign(builder.goods, { meat: 12, grain: 8, timber: 35, ore: 30, herb: 15, thread: 10, relic: 3 });
  assert.equal(transition(builder, { type: 'fabricate', recipe: 'stew' }), builder);
  builder = play(builder, { type: 'build', mode: 'raise' });
  assert.equal(builder.goods.timber, 30);
  builder = play(builder, { type: 'build-improvement', improvement: 'kitchen' });
  builder = play(builder, { type: 'build-improvement', improvement: 'larder' });
  const rationStock = builder.goods.ration;
  builder = play(builder, { type: 'fabricate', recipe: 'stew' });
  assert.equal(builder.goods.ration, rationStock + 4);
  builder = play(builder, { type: 'fabricate', recipe: 'spear' });
  assert.equal(builder.gear[0].weapon, 'spear');
  builder = play(builder, { type: 'fabricate', recipe: 'ironCoat' });
  assert.equal(builder.gear[0].affix, 'sturdy');
  builder = play(builder, { type: 'use', good: 'ration' });
  builder = play(builder, { type: 'rest', rest: 'home' });
  const lineup = world.residentsAt(builder.location);
  assert(lineup.every((resident) => world.residentRoutine(resident, builder.time).present));
  assert(!world.residentRoutine(lineup[0], 2).present);
  assert.match(world.residentRoutine(lineup[0], 12).activity[1], /Eating/);
  for (const resident of lineup) {
    builder.friends[resident.id] = { resident, trust: 6, visitedDay: 0, offeredDay: 0 };
  }
  for (const resident of lineup.slice(0, MAX_PARTY_SIZE - 1)) {
    builder = play(builder, { type: 'social', id: resident.id, verb: 'recruit' });
  }
  assert.equal(builder.followers.length, MAX_PARTY_SIZE - 1);
  assert.equal(transition(builder, { type: 'social', id: lineup.at(-1).id, verb: 'recruit' }), builder);
  builder = play(builder, { type: 'enter' });
  builder.delve.cell = world.generateFloor(builder.location, 1).seal;
  builder = play(builder, { type: 'feature', verb: 'confront' });
  assert.equal(builder.delve.encounter.allies.length, 5);
  const materialCount = (game) => game.goods.timber + game.goods.ore + game.goods.thread;
  const foodCount = (game) => game.goods.fish + game.goods.meat;
  const materials = materialCount(builder), food = foodCount(builder);
  for (let i = 0; i < 25 && builder.delve?.encounter; i++) {
    builder = play(builder, { type: 'auto-combat', target: 0 });
  }
  assert.equal(builder.counters.combats, 1);
  assert(materialCount(builder) > materials && foodCount(builder) > food);

  function adjacentTravel(s, destination) {
    const direction = world.DIRECTIONS.findIndex((_, i) => world.sameAddress(world.atOffset(s.location, i), destination));
    assert(direction >= 0);
    return play(s, { type: 'travel', direction });
  }
  function expeditionGame(biome) {
    const s = startAdventure({ ...draft, deathRule: 'return-town' }, 'expeditions-' + biome);
    const location = Array.from({ length: 81 }, (_, i) => ({ world: s.location.world, x: i % 9 - 4, y: Math.floor(i / 9) - 4 }))
      .find((address) => world.townAt(address).biome === biome);
    assert(location, biome);
    s.location = location;
    s.knownTowns[world.addressKey(location)] = location;
    Object.assign(s.goods, { grain: 35, ration: 35, timber: 50, ore: 50, relic: 15, thread: 12, meat: 15, herb: 15, seed: 12, lantern: 12 });
    s.gold = 500;
    return s;
  }
  function research(s, id, rank = 1) {
    const route = journeyContent.ROUTE_BY_ID[id];
    const scout = { type: 'expedition-scout', approach: 'supply' };
    s = play(s, { type: 'expedition-start', id, rank });
    const e = s.journey.expedition;
    assert.equal(transition(s, scout), s, 'A clue can only be found at its marked destination');
    assert.equal(transition(s, { type: 'expedition-finish' }), s);
    s = adjacentTravel(s, e.station);
    const material = s.goods[route.material];
    s = play(s, scout);
    assert.equal(s.goods[route.material], material - expeditions.scoutCost(e));
    assert(s.journey.expedition.advantage);
    assert.equal(transition(s, { type: 'expedition-finish' }), s, 'Report back in the original town');
    return adjacentTravel(s, e.source);
  }
  let ranger = expeditionGame('grove');
  assert.equal(transition(ranger, { type: 'expedition-start', id: 'academy-cistern', rank: 1 }), ranger);
  for (let i = 0; i < 3; i++) {
    ranger = research(ranger, 'grove-ford');
    const cost = expeditions.objectiveCost(ranger.journey.expedition);
    const timber = ranger.goods.timber;
    ranger = play(ranger, { type: 'expedition-finish' });
    assert.equal(ranger.goods.timber, timber - cost);
  }
  assert.equal(journey.maxExpeditionRank(ranger), 2);
  assert.equal(journey.regionalMastery(ranger, 'grove'), 1, 'Repeating an expedition advances rank, not regional mastery');
  assert.equal(ranger.journey.relic, 'grove');
  ranger = research(ranger, 'grove-orchard', 2);
  const e = ranger.journey.expedition;
  let away = adjacentTravel(ranger, e.station);
  away = play(away, { type: 'life', activity: 'forage' });
  assert.equal(away.journey.expedition.progress, 0, 'Work in other towns does not count toward the expedition');
  ranger = play(ranger, { type: 'life', activity: 'gather' });
  assert(expeditions.canReportExpedition(ranger, ranger.journey.expedition));
  ranger = play(ranger, { type: 'expedition-finish' });
  assert.equal(journey.regionalMastery(ranger, 'grove'), 2);

  ranger = research(ranger, 'grove-amber');
  ranger = play(ranger, { type: 'formation', id: 'envoy' });
  ranger = play(ranger, { type: 'enter' });
  const pack = (s) => Number(Object.entries(world.generateFloor(s.location, s.delve.floor).features).find(([, type]) => type === 'pack')[0]);
  ranger.delve.cell = pack(ranger);
  ranger = play(ranger, { type: 'feature', verb: 'confront' });
  ranger = play(ranger, { type: 'auto-combat', target: 0 });
  assert(ranger.delve.encounter.enemies.every((enemy) => enemy.hp === enemy.max && enemy.known));
  ranger.rng = seedFor((face) => face === 20);
  ranger = play(ranger, { type: 'auto-combat', target: 0 });
  assert(ranger.journey.expedition.progress >= 1 && ranger.counters.combats === 0);
  assert(Object.values(ranger.journey.bestiary).some((record) => record.accords === 1));
  ranger = play(ranger, { type: 'leave-delve' });
  ranger = play(ranger, { type: 'expedition-finish' });
  assert.equal(journey.relicPower(ranger, 'grove'), 2);
  assert.equal(transition(ranger, { type: 'equip-relic', biome: 'academy' }), ranger);

  let scholar = research(expeditionGame('academy'), 'academy-clocktower');
  const recipe = provisions.mealRecipe('bell-bento');
  scholar = play(scholar, { type: 'cook-dish', id: 'bell-bento' });
  assert(expeditions.canReportExpedition(scholar, scholar.journey.expedition));
  scholar = play(scholar, { type: 'expedition-finish' });
  scholar.fatigue = 2;
  const armor = state.armor(scholar);
  scholar = play(scholar, { type: 'eat-dish', id: 'bell-bento' });
  assert.equal(scholar.journey.meals['bell-bento'], 0);
  assert.deepEqual(scholar.journey.tasted, ['bell-bento']);
  assert.equal(scholar.journey.meal.until - scholar.time, recipe.hours);
  assert.equal(state.armor(scholar), armor + 1);
  scholar = research(scholar, 'academy-cistern');
  scholar = play(scholar, { type: 'enter' });
  const alternativeResearch = structuredClone(scholar);
  alternativeResearch.delve.cell = systems.ruinLayout(scholar.location, 1).device;
  const inspectedDevice = play(alternativeResearch, { type: 'inspect-circuit' });
  assert.equal(inspectedDevice.journey.expedition.progress, 1, 'A new mechanism counts toward an investigation expedition');
  assert.equal(transition(inspectedDevice, { type: 'inspect-circuit' }), inspectedDevice);
  scholar.delve.cell = world.generateFloor(scholar.location, 1).seal;
  scholar = play(scholar, { type: 'feature', verb: 'inspect' });
  assert.equal(scholar.journey.expedition.progress, 1);
  assert.equal(transition(scholar, { type: 'feature', verb: 'inspect' }), scholar);
  scholar = play(scholar, { type: 'leave-delve' });
  scholar = play(scholar, { type: 'expedition-finish' });
  scholar = play(scholar, { type: 'build', mode: 'raise' });
  const homeKey = world.addressKey(scholar.location);
  assert.equal(transition(scholar, { type: 'build-improvement', improvement: 'masterForge' }), scholar);
  for (let lv = 1; lv < 5; lv++) {
    if (life.canEat(scholar)) scholar = play(scholar, { type: 'use', good: 'ration' });
    scholar = play(scholar, { type: 'build', mode: 'upgrade' });
  }
  assert.equal(scholar.workshop[homeKey].level, 5);
  assert.equal(transition(scholar, { type: 'build', mode: 'upgrade' }), scholar);
  scholar = play(scholar, { type: 'build-improvement', improvement: 'masterForge' });
  assert.equal(transition(scholar, { type: 'fabricate', recipe: 'skyPike' }), scholar);
  scholar = play(scholar, { type: 'fabricate', recipe: 'archiveWand' });
  assert.equal(scholar.gear[0].weapon, 'wand');
  assert.equal(scholar.gear[0].affix, 'bright');
  assert.equal(scholar.gear[0].masterwork, 'archiveWand');

  const hostMemory = world.residentsAt(scholar.location).find((resident) => resident.role === 'host');
  scholar.time = world.dayAt(scholar.time) * 24 + 9;
  scholar.lastMealAt = scholar.time;
  scholar.friends[hostMemory.id] = { resident: hostMemory, trust: 6, visitedDay: 0, offeredDay: 0 };
  const memoryAction = { type: 'bond', id: hostMemory.id, approach: 'give' };
  const firstMemory = life.residentStory(scholar, hostMemory);
  scholar.goods[firstMemory.item]++;
  scholar = play(scholar, memoryAction);
  assert.equal(scholar.friends[hostMemory.id].memories, 1);
  assert.equal(transition(scholar, memoryAction), scholar, 'Bond scenes take at least one day apart');
  scholar.time += 24;
  scholar.lastMealAt = scholar.time;
  scholar.goods[life.residentStory(scholar, hostMemory).item]++;
  scholar = play(scholar, memoryAction);
  assert.equal(scholar.friends[hostMemory.id].memories, 2);
  assert.equal(life.residentStory(scholar, hostMemory), undefined);

  scholar = research(scholar, 'academy-archive');
  const floorNumber = scholar.journey.expedition.floor;
  scholar = play(scholar, { type: 'enter', floor: floorNumber });
  scholar.delve.cell = world.generateFloor(scholar.location, floorNumber).seal;
  scholar = play(scholar, { type: 'feature', verb: 'confront' });
  assert.equal(scholar.delve.encounter.enemies[0].template, content.regionalWardenIndex('academy'));
  scholar.rng = seedFor((face) => face === 20);
  scholar = play(scholar, { type: 'combat', move: 'parley', target: 0 });
  assert.equal(scholar.deepest[homeKey], floorNumber);
  scholar = play(scholar, { type: 'leave-delve' });
  scholar = play(scholar, { type: 'expedition-finish' });
  const differentConditions = new Set(Array.from({ length: 160 }, (_, i) => ruins.ruinCondition(scholar.location, i + 2).name[1]));
  assert.equal(differentConditions.size, 8);
  let hunter = research(expeditionGame('academy'), 'academy-observatory');
  hunter.level = 20;
  hunter = play(hunter, { type: 'enter' });
  hunter.delve.cell = pack(hunter);
  hunter = play(hunter, { type: 'feature', verb: 'confront' });
  const forcedHit = { type: 'auto-combat', target: 0 };
  for (let i = 0; i < 6 && hunter.delve?.encounter; i++) {
    hunter.rng = seedFor((face) => face === 20);
    hunter = play(hunter, forcedHit);
  }
  assert.equal(hunter.journey.expedition.progress, 1, 'Defeating a pack advances a hunting contract');
  assert(Object.values(hunter.journey.bestiary).some((record) => record.victories === 1));
  hunter = play(hunter, { type: 'leave-delve' });
  hunter = play(hunter, { type: 'expedition-finish' });
  assert.equal(hunter.journey.expeditions['academy-observatory'].clears, 1);

  let surveyor = expeditionGame('coast');
  const guildkeeper = world.residentsAt(surveyor.location).find((resident) => resident.role === 'keeper');
  assert.equal(factions.residentFaction(surveyor.location, guildkeeper), 'coast');
  surveyor.time = 11;
  surveyor.goods.fish = 8;
  const offer = { type: 'faction-favor', resident: guildkeeper.id };
  const neutralPrice = life.marketPrice(surveyor, 'lantern', false);
  surveyor = play(surveyor, offer);
  assert.equal(surveyor.fieldwork.standing.coast, 2);
  assert.equal(surveyor.fieldwork.standing.sky, -1);
  assert.equal(surveyor.goods.fish, 7);
  assert.equal(transition(surveyor, offer), surveyor, 'A faction can only be helped once per day');
  const friendly = structuredClone(surveyor);
  friendly.fieldwork.standing.coast = 7;
  assert(life.marketPrice(friendly, 'lantern', false) < neutralPrice);
  assert(life.marketPrice(friendly, 'lantern', true) < life.marketPrice(friendly, 'lantern', false));

  const surveyKey = world.addressKey(surveyor.location);
  for (const depth of [1, 2, 3]) {
    surveyor.deepest[surveyKey] = depth - 1;
    surveyor = play(surveyor, { type: 'enter', floor: depth });
    const layout = systems.ruinLayout(surveyor.location, depth);
    assert.equal(transition(surveyor, { type: 'read-inscription' }), surveyor);
    surveyor.delve.cell = layout.inscription;
    surveyor = play(surveyor, { type: 'read-inscription' });
    assert.equal(surveyor.fieldwork.histories[surveyKey].chapters, (1 << depth) - 1);
    assert.equal(transition(surveyor, { type: 'read-inscription' }), surveyor, 'A repeated inscription grants nothing');
    surveyor.delve.cell = layout.device;
    surveyor = play(surveyor, { type: 'inspect-circuit' });
    assert.equal(transition(surveyor, { type: 'set-circuit', mode: 'channel', method: 'alliance' }), surveyor);
    const ore = surveyor.goods.ore;
    if (depth === 1) {
      const repaired = play(surveyor, { type: 'set-circuit', mode: 'channel', method: 'materials' });
      assert.equal(repaired.goods.ore, ore - 1);
      const withAllies = structuredClone(surveyor);
      withAllies.fieldwork.standing.coast = 7;
      assert.equal(play(withAllies, { type: 'set-circuit', mode: 'channel', method: 'alliance' }).goods.ore, ore);
      const failed = play({ ...surveyor, rng: seedFor(face => face === 1) }, { type: 'set-circuit', mode: 'channel', method: 'check' });
      assert.equal(systems.circuitAt(failed).mode, null);
      assert.equal(failed.delve.light, surveyor.delve.light - 2);
      const improvised = play({ ...failed, rng: seedFor(face => face === 20) }, { type: 'set-circuit', mode: 'channel', method: 'check' });
      assert.equal(systems.circuitAt(improvised).mode, 'channel');
    }
    surveyor = play(surveyor, { type: 'set-circuit', mode: 'channel', method: 'history' });
    assert.equal(surveyor.goods.ore, ore, 'Local records can replace a tool or material');
    assert.equal(systems.circuitEffects(surveyor).shards, 2);
    if (layout.shortcut >= 0) {
      const floor = systems.ruinFloor(surveyor.location, depth, 'channel');
      const direction = world.DIRECTIONS.findIndex((_, i) => floor.open.has(world.neighbor(layout.shortcut, (i + 2) % 4)));
      const route = structuredClone(surveyor);
      route.delve.cell = world.neighbor(layout.shortcut, (direction + 2) % 4);
      route.delve.direction = direction;
      route.floors[world.floorKey(route.location, depth)].cleared.push(route.delve.cell);
      const next = play(route, { type: 'move', direction: 'forward' });
      assert.equal(next.delve.cell, layout.shortcut, 'The powered passage is traversable in the gameplay engine');
    }
    surveyor = play(surveyor, { type: 'set-circuit', mode: 'isolate', method: 'check' });
    assert.equal(systems.circuitEffects(surveyor).light, -1);
    surveyor = play(surveyor, { type: 'leave-delve' });
  }
  const foundShards = surveyor.goods.relic;
  surveyor = play(surveyor, { type: 'file-history', key: surveyKey, choice: 'return' });
  assert.equal(surveyor.goods.relic, foundShards + 3);
  assert.equal(surveyor.fieldwork.standing.coast, 5);
  assert.equal(surveyor.fieldwork.standing.sky, -2);
  assert.equal(transition(surveyor, { type: 'file-history', key: surveyKey, choice: 'publish' }), surveyor);

  const layouts = new Set();
  const worlds = new Set();
  const { corridorPlanes } = await vite.ssrLoadModule(path + 'corridor.ts');
  for (let i = 0; i < 50; i++) {
    const run = startAdventure(draft, 'new-run-' + i);
    const floor = world.generateFloor(run.location, 1);
    worlds.add(run.location.world);
    assert.equal(paths(floor).size, floor.open.size);
    layouts.add([...floor.open].sort((a, b) => a - b).join(','));
    const planes = corridorPlanes(floor, world.ENTRY_CELL, i % 4);
    assert.deepEqual(new Set(planes.map((plane) => plane.surface)), new Set(['floor', 'ceiling', 'wall']));
  }
  assert.equal(worlds.size, 50);
  assert(layouts.size >= 44);

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
  const operate = (s, operation) => play(s, { type: 'field', operation });
  const reject = (s, operation) => assert.equal(transition(s, { type: 'field', operation }), s);
  let historian = newGame();
  const historianKey = world.addressKey(historian.location);
  const clue = fieldWorld.surveySite(historian.location);
  historian = operate(historian, { kind: 'survey' });
  reject(historian, { kind: 'survey' });
  reject(historian, { kind: 'site', method: 'lore' });
  historian = operate(historian, { kind: 'book', key: historianKey, verb: 'read' });
  assert.deepEqual(historian.frontier.rumors[world.addressKey(clue.sequel)], clue.sequel);
  historian = operate(historian, { kind: 'mark', place: clue.sequel, label: 'Follow the old waterway' });
  historian = operate(historian, { kind: 'site', method: 'lore' });
  assert(historian.frontier.chapters[clue.biome]);
  historian = operate(historian, { kind: 'book', key: historianKey, verb: 'donate' });
  reject(historian, { kind: 'book', key: historianKey, verb: 'donate' });
  const local = world.residentsAt(historian.location).find((resident) => world.residentPresent(resident, historian.time));
  const faction = factions.residentFaction(historian.location, local);
  const rival = factions.FACTIONS[faction].rival;
  const rivalBefore = factions.standing(historian, rival);
  historian = operate(historian, { kind: 'pact', id: local.id });
  assert.equal(historian.frontier.liquids.water, 3);
  assert.equal(factions.standing(historian, rival), rivalBefore - 1);
  reject(historian, { kind: 'pact', id: local.id });
  for (const biome of content.BIOME_IDS) {
    if (historian.frontier.chapters[biome]) continue;
    const place = Array.from({ length: 400 }, (_, index) => ({ world: historian.location.world, x: index % 20 - 10, y: Math.floor(index / 20) - 10 }))
      .find((where) => world.townAt(where).biome === biome);
    assert(place, biome);
    historian.location = place;
    historian.knownTowns[world.addressKey(place)] = place;
    historian.lastMealAt = historian.time;
    historian = operate(historian, { kind: 'survey' });
    historian = operate(historian, { kind: 'book', key: world.addressKey(place), verb: 'read' });
    historian = operate(historian, { kind: 'site', method: 'lore' });
  }
  assert.equal(fieldActions.fieldChapterCount(historian), 6);
  historian = operate(historian, { kind: 'construct' });
  historian = operate(historian, { kind: 'resolve', choice: 'signal' });
  assert.equal(historian.frontier.ending, 'signal');
  assert(historian.followers.includes(fieldActions.PAPER_SENTINEL));
  reject(historian, { kind: 'resolve', choice: 'shelter' });
  assert.equal(save.saveAdventure(historian, null), 'saved');
  assert.deepEqual(save.loadAdventures(), [historian]);
  assert(save.deleteAdventure(historian.id));

  let artificer = startAdventure({ ...draft, discipline: 'artificer', deathRule: 'return-town' }, 'workshop-test');
  artificer.frontier.parts = 20;
  artificer.goods.ore = 5;
  artificer.talent = 2;
  artificer.level = 4;
  artificer.character.stats.finesse = 3;
  artificer = operate(artificer, { kind: 'skill', id: 'salvage' });
  artificer = operate(artificer, { kind: 'checkpoint' });
  assert(fieldActions.addDevice(artificer, 'auger'));
  reject(artificer, { kind: 'device', serial: 2, verb: 'fit' });
  artificer = operate(artificer, { kind: 'device', serial: 2, verb: 'identify' });
  artificer = operate(artificer, { kind: 'device', serial: 2, verb: 'fit', socket: 'support' });
  artificer = operate(artificer, { kind: 'device', serial: 2, verb: 'recharge' });
  artificer = operate(artificer, { kind: 'modify', serial: 2, mod: 'reservoir' });
  assert.equal(frontier.deviceCapacity(artificer.frontier.devices[1]), 5);
  artificer = operate(artificer, { kind: 'design', id: 'auger' });
  reject(artificer, { kind: 'device', serial: 2, verb: 'dismantle' });
  artificer = operate(artificer, { kind: 'device', serial: 3, verb: 'dismantle' });
  assert.equal(artificer.frontier.sockets.support, 2);
  artificer.gear.push({ id: 'test-knife', slot: 'weapon', weapon: 'knife', rarity: 'common', power: 2, found: 1 });
  artificer = operate(artificer, { kind: 'offhand', id: 'test-knife' });
  assert.equal(transition(artificer, { type: 'sell-gear', id: 'test-knife' }), artificer);
  artificer = operate(artificer, { kind: 'offhand', id: null });
  const hostId = world.residentsAt(artificer.location).find(({ role }) => role === 'host').id;
  for (const verb of ['talk', 'gift', 'recruit']) artificer = play(artificer, { type: 'social', id: hostId, verb });
  artificer = operate(artificer, { kind: 'order', id: hostId, order: 'hold' });
  artificer = operate(artificer, { kind: 'order', id: hostId, order: null });
  artificer = operate(artificer, { kind: 'lend', id: hostId, gear: 'test-knife' });
  reject(artificer, { kind: 'offhand', id: 'test-knife' });
  artificer = operate(artificer, { kind: 'lend', id: hostId, gear: null });

  let wanderer = startAdventure({ ...draft, runKind: 'wander' }, 'recovery-test');
  const recoveryTown = { ...wanderer.location };
  wanderer = operate(wanderer, { kind: 'checkpoint' });
  wanderer = play(wanderer, { type: 'travel', direction: 0 });
  assert.notDeepEqual(wanderer.location, recoveryTown);
  wanderer.hp = 0;
  assert(state.finishDefeat(wanderer));
  assert.deepEqual(wanderer.location, recoveryTown);

  let liquidKit = operate(newGame(), { kind: 'import', code: 'bell-101' });
  state.advance(liquidKit, 24);
  assert.equal(frontier.thirst(liquidKit), 24);
  assert(frontier.fieldCheck(liquidKit, 'insight') < 0);
  liquidKit = operate(liquidKit, { kind: 'drink', id: 'water' });
  assert.equal(frontier.thirst(liquidKit), 0);
  liquidKit = operate(liquidKit, { kind: 'fill', id: 'oil' });
  liquidKit = operate(liquidKit, { kind: 'fill', id: 'chalk' });
  liquidKit = operate(liquidKit, { kind: 'fill', id: 'sap' });
  liquidKit = operate(liquidKit, { kind: 'mix', a: 'chalk', b: 'sap' });
  assert.equal(liquidKit.frontier.liquids.resin, 2);
  liquidKit.goods.fish = 1;
  liquidKit = operate(liquidKit, { kind: 'cook', id: 'broth' });
  liquidKit = play(liquidKit, { type: 'enter' });
  const liquidFloor = fieldWorld.fieldFloor(liquidKit);
  const waterKey = world.floorKey(liquidKit.location, 1);
  const currentCell = liquidKit.delve.cell;
  const neighboringCell = fieldWorld.neighbors(currentCell).find((cell) => liquidFloor.open.has(cell));
  liquidKit.frontier.alterations[waterKey] = { dug: [], patches: {
    [currentCell]: { terrain: 'heat', until: null }, [neighboringCell]: { terrain: 'oil', until: null },
  } };
  liquidKit = operate(liquidKit, { kind: 'pour', id: 'oil', cell: currentCell });
  assert.equal(fieldWorld.terrainAt(liquidKit, currentCell, 1), 'fire');
  assert.equal(fieldWorld.terrainAt(liquidKit, neighboringCell, 1), 'fire');
  assert(fieldWorld.fieldHazard(liquidKit, currentCell, 1)[1].includes('meal'));
  assert.equal(liquidKit.frontier.recipe, null);
  liquidKit = operate(liquidKit, { kind: 'pour', id: 'water', cell: currentCell });
  assert.equal(fieldWorld.terrainAt(liquidKit, currentCell, 1), 'steam');
  liquidKit.frontier.liquids.brine = 1;
  liquidKit.frontier.alterations[waterKey].patches[neighboringCell] = { terrain: 'wire', until: null };
  liquidKit = operate(liquidKit, { kind: 'pour', id: 'brine', cell: currentCell });
  assert.equal(fieldWorld.terrainAt(liquidKit, currentCell, 1), 'wire');

  let cook = newGame();
  cook.goods.grain = 1;
  cook.frontier.liquids.sap = 1;
  cook = operate(cook, { kind: 'blend', base: 'grain', spice: 'sap' });
  assert.equal(cook.goods.grain, 0);
  assert.equal(cook.frontier.liquids.sap, 0);
  cook.focus = 0;
  assert.equal(save.saveAdventure(cook, null), 'saved');
  cook = save.loadAdventures()[0];
  assert.equal(cook.frontier.recipe.spice, 'sap');
  cook = play(cook, { type: 'travel', direction: 0 });
  assert.equal(cook.frontier.recipe, null);
  assert.equal(cook.focus, 3);
  assert(save.deleteAdventure(cook.id));

  artificer = play(artificer, { type: 'enter' });
  const realFloor = fieldWorld.fieldFloor(artificer);
  const [start, direction, wall] = [...realFloor.open].flatMap((cell) => [0, 1, 2, 3].map((dir) => [cell, dir, world.neighbor(cell, dir)]))
    .find(([cell, dir, tile]) => {
      const beyond = world.neighbor(tile, dir);
      return tile >= 0 && !realFloor.open.has(tile) && realFloor.open.has(beyond) && !realFloor.features[beyond] && !realFloor.features[cell];
    });
  artificer.delve.cell = start;
  artificer.delve.direction = direction;
  const resonant = structuredClone(artificer);
  resonant.frontier.gifts.phase = 1;
  const crossed = operate(resonant, { kind: 'invoke', id: 'phase' });
  assert.equal(crossed.delve.cell, world.neighbor(wall, direction));
  assert(!fieldWorld.fieldFloor(crossed).open.has(wall), 'Phasing crosses a wall without destroying it');
  artificer = operate(artificer, { kind: 'device', serial: 2, verb: 'use' });
  assert(fieldWorld.fieldFloor(artificer).open.has(wall));
  assert.equal(artificer.frontier.devices[1].charge, 1);
  artificer = play(artificer, { type: 'move', direction: 'forward' });
  assert.equal(artificer.delve.cell, wall);
  assert.equal(save.saveAdventure(artificer, null), 'saved');
  assert.deepEqual(save.loadAdventures(), [artificer]);
  assert(save.deleteAdventure(artificer.id));

  let exploring = play(newGame(), { type: 'enter' });
  const planned = fieldWorld.plannedWalk(exploring);
  assert(planned.length > 0);
  exploring = play(exploring, { type: 'auto-walk' });
  assert.equal(exploring.delve.cell, planned.at(-1));
  exploring = play(exploring, { type: 'auto-walk', target: world.ENTRY_CELL });
  assert.equal(exploring.delve.cell, world.ENTRY_CELL);

  let manual = operate(newGame(), { kind: 'import', code: 'bell-011' });
  manual = play(manual, { type: 'enter' });
  const manualFloor = fieldWorld.fieldFloor(manual);
  const packCell = Number(Object.keys(manualFloor.features).find((cell) => manualFloor.features[cell] === 'pack'));
  manual.delve.cell = packCell;
  manual = play(manual, { type: 'feature', verb: 'confront' });
  assert.equal(transition(manual, { type: 'auto-combat', target: 0 }), manual);
  assert.equal(manual.delve.encounter.tactics.cells.length, manual.delve.encounter.enemies.length);
  const step = fieldWorld.neighbors(packCell).find((cell) => tactics.canTacticalStep(manual, cell));
  assert(Number.isInteger(step));
  manual = play(manual, { type: 'tactical-step', cell: step });
  assert.equal(manual.delve.cell, step);
  const withinSight = manual.delve.encounter.tactics.cells.findIndex((cell, index) => manual.delve.encounter.enemies[index].hp > 0 && fieldWorld.glancingSight(manualFloor, step, cell, 4));
  if (withinSight >= 0) {
    manual = play(manual, { type: 'tactical-aim', target: withinSight });
    assert.equal(manual.delve.encounter.tactics.aim, withinSight);
  }
  const guideTarget = manual.delve.encounter.tactics.cells.findIndex((cell, index) => manual.delve.encounter.enemies[index].hp > 0 && fieldWorld.glancingSight(manualFloor, step, cell, 4));
  assert(guideTarget >= 0, 'The deterministic test fight exposes a creature in sight');
  manual.frontier.gifts.guide = 1;
  manual = operate(manual, { kind: 'invoke', id: 'guide', target: guideTarget });
  assert.equal(tactics.borrowedCreature(manual.delve.encounter), guideTarget);
  const otherStep = fieldWorld.neighbors(tactics.actionPosition(manual)).find((cell) => tactics.canTacticalStep(manual, cell));
  assert(Number.isInteger(otherStep));
  manual = play(manual, { type: 'tactical-step', cell: otherStep });
  assert.equal(tactics.actionPosition(manual), otherStep);
  assert.equal(manual.delve.cell, step, 'Moving a linked creature leaves the hero in place');
  assert.equal(save.saveAdventure(manual, null), 'saved');
  assert.deepEqual(save.loadAdventures(), [manual]);
  assert(save.deleteAdventure(manual.id));

  const legacy = structuredClone(original);
  legacy.version = 1;
  delete legacy.journey;
  delete legacy.fieldwork;
  delete legacy.frontier;
  delete legacy.character.deathRule;
  delete legacy.lastMealAt;
  delete legacy.fallenAt;
  delete legacy.defeats;
  delete legacy.goods.meat;
  delete legacy.goods.strongTonic;
  delete legacy.goods.fieldKit;
  const legacySlots = [legacy];
  storage.set(originalStory.SCHOOL_ADVENTURE_SAVE_KEY,
    JSON.stringify({ schema: 'school-adventure', serial: 1, checksum: world.hash(JSON.stringify(legacySlots)), slots: legacySlots }));
  const migrated = save.loadAdventures()[0];
  assert.deepEqual(migrated.location, original.location);
  assert.equal(migrated.character.deathRule, 'return-town');
  assert.equal(migrated.lastMealAt, original.time);
  assert.equal(migrated.goods.meat, 0);
  assert(save.deleteAdventure(migrated.id));
  const previous = structuredClone(original);
  previous.version = 2;
  delete previous.journey;
  delete previous.fieldwork;
  delete previous.frontier;
  storage.set(originalStory.SCHOOL_ADVENTURE_SAVE_KEY,
    JSON.stringify({ schema: 'school-adventure', serial: 1, checksum: world.hash(JSON.stringify([previous])), slots: [previous] }));
  assert.deepEqual(save.loadAdventures(), [original], 'A v2 save retains all original state and receives a clean journey');
  assert(save.deleteAdventure(original.id));
  let savedBattle = play(newGame(), { type: 'enter' });
  savedBattle.delve.cell = world.generateFloor(savedBattle.location, 1).seal;
  savedBattle = play(savedBattle, { type: 'feature', verb: 'confront' });
  savedBattle.delve.encounter.enemies[0].template = 12;
  savedBattle.version = 2;
  delete savedBattle.journey;
  delete savedBattle.fieldwork;
  delete savedBattle.frontier;
  storage.set(originalStory.SCHOOL_ADVENTURE_SAVE_KEY,
    JSON.stringify({ schema: 'school-adventure', serial: 1, checksum: world.hash(JSON.stringify([savedBattle])), slots: [savedBattle] }));
  savedBattle = save.loadAdventures()[0];
  assert.equal(savedBattle.delve.encounter.enemies[0].template, 12);
  savedBattle.rng = seedFor((face) => face === 20);
  savedBattle = play(savedBattle, { type: 'combat', move: 'parley', target: 0 });
  assert.deepEqual(savedBattle.journey.bestiary[12], { encounters: 1, victories: 0, accords: 1 });
  assert(save.deleteAdventure(savedBattle.id));
  const previousJourney = structuredClone(scholar);
  previousJourney.version = 3;
  delete previousJourney.fieldwork;
  delete previousJourney.frontier;
  storage.set(originalStory.SCHOOL_ADVENTURE_SAVE_KEY,
    JSON.stringify({ schema: 'school-adventure', serial: 1, checksum: world.hash(JSON.stringify([previousJourney])), slots: [previousJourney] }));
  assert.deepEqual(save.loadAdventures(), [{ ...scholar, fieldwork: fieldwork.newFieldwork(), frontier: frontier.newFrontier(scholar.location, scholar.time) }]);
  assert(save.deleteAdventure(previousJourney.id));
  const previousFieldwork = { ...surveyor, version: 4 };
  delete previousFieldwork.frontier;
  storage.set(originalStory.SCHOOL_ADVENTURE_SAVE_KEY,
    JSON.stringify({ schema: 'school-adventure', serial: 1, checksum: world.hash(JSON.stringify([previousFieldwork])), slots: [previousFieldwork] }));
  assert.deepEqual(save.loadAdventures(), [{ ...surveyor, frontier: frontier.newFrontier(surveyor.location, surveyor.time) }]);
  assert(save.deleteAdventure(previousFieldwork.id));
  assert.equal(save.saveAdventure(surveyor, null), 'saved');
  assert.deepEqual(save.loadAdventures(), [surveyor], 'Reputation, circuit settings and archived fragments survive reload');
  assert(save.deleteAdventure(surveyor.id));
  assert.equal(save.saveAdventure(scholar, null), 'saved');
  assert.deepEqual(save.loadAdventures(), [scholar], 'Expedition records, meals, and NPC memories persist');
  assert(save.deleteAdventure(scholar.id));
  assert.equal(save.saveAdventure(fallen, null), 'saved');
  assert.equal(save.loadAdventures()[0].fallenAt, fallen.fallenAt);
  assert(save.deleteAdventure(fallen.id));

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
    `PASS 40 unique portraits, ${newArt.length + fieldArt.length} adventure assets, ${floors} seeded floors, expeditions, tactical movement, field devices and reactions, six historic records, and v1–v4 save migration.`,
  );
} finally {
  await vite.close();
}
