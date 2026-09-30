import assert from "node:assert/strict";
import { createServer } from "vite";
const server = await createServer({
  optimizeDeps: { noDiscovery: true, entries: [] },
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});
try {
  const {
    createWorld,
    addPlayer,
    applyAction,
    siteUnavailable,
    WIDTH,
    HEIGHT,
  } = await server.ssrLoadModule("/src/rpg/engine.ts");
  const { getEncounterEnemyNamePool } = await server.ssrLoadModule(
    "/src/services/geminiService.ts",
  );
  const { getRpgSiteDisplayName } = await server.ssrLoadModule(
    "/src/rpg/enemyNames.ts",
  );
  const { RpgRoom } = await server.ssrLoadModule("/src/rpg/network.ts");
  const setup = {
    visualTheme: "high-school",
    mode: "MIXED",
    modePool: ["MULTIPLICATION", "UPPER_TRIVIA"],
    answerMode: "CHOICE",
    difficultyLevel: 2,
  };
  const setupWorld = createWorld(7, setup);
  assert.deepEqual(
    setupWorld.setup,
    setup,
    "world keeps the host adventure setup",
  );
  let practicedWorld;
  const practiceRoom = new RpgRoom((world) => { practicedWorld = world; }, () => {});
  practiceRoom.practice("練習", setup);
  assert(
    practicedWorld.sites
      .filter((site) => site.kind === "enemy")
      .every((site) => getEncounterEnemyNamePool("high-school").includes(site.name)),
    "solo practice creates map enemies for the selected chapter",
  );
  practiceRoom.close();
  const enemySites = setupWorld.sites.filter((site) => site.kind === "enemy");
  assert.equal(enemySites.length, 14, "map generates 14 ordinary encounters");
  assert(
    enemySites.every((site) =>
      getEncounterEnemyNamePool("high-school").includes(site.name),
    ),
    "ordinary enemy labels come from the selected theme's actual encounter names",
  );
  for (const theme of ["elementary", "high-school", "magic"]) {
    const names = getEncounterEnemyNamePool(theme);
    assert(
      enemySites.every((site) => names.includes(getRpgSiteDisplayName(site, theme))),
      `map enemies display names from the ${theme} chapter`,
    );
  }
  const assignment = {
    id: "rpg-assignment",
    title: "オンライン課題",
    units: [],
    customProblems: [
      { id: "custom-1", question: "1+1", answer: "2", options: ["1", "2"] },
    ],
    dueAt: "2099-01-01T00:00:00.000Z",
    gameMode: "FREE",
    answerMode: "CHOICE",
    createdAt: "2098-01-01T00:00:00.000Z",
  };
  const assignmentWorld = createWorld(8, { ...setup, assignment });
  assert.deepEqual(
    assignmentWorld.setup?.assignment,
    assignment,
    "world keeps the host custom assignment",
  );
  for (let seed = 0; seed < 80; seed++) {
    const generated = createWorld(seed),
      queue = [generated.sites[0].y * WIDTH + generated.sites[0].x],
      seen = new Set(queue);
    for (let i = 0; i < queue.length; i++)
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const x = (queue[i] % WIDTH) + dx,
          y = Math.floor(queue[i] / WIDTH) + dy,
          k = y * WIDTH + x;
        if (
          x < 1 ||
          y < 1 ||
          x >= WIDTH - 1 ||
          y >= HEIGHT - 1 ||
          seen.has(k) ||
          ["water", "forest"].includes(generated.tiles[k])
        )
          continue;
        seen.add(k);
        queue.push(k);
      }
    assert(
      generated.sites.every((s) => seen.has(s.y * WIDTH + s.x)),
      `all sites reachable, seed ${seed}`,
    );
  }
  const capacity = createWorld(1);
  for (let i = 0; i < 40; i++) assert(addPlayer(capacity, `p${i}`, `P${i}`));
  assert.equal(addPlayer(capacity, "overflow", "Overflow"), false);
  const w = createWorld(26);
  w.activities.nextEventAt = w.deadlineAt;
  addPlayer(w, "a", "A");
  addPlayer(w, "b", "B");
  const profile = {
    hp: 70,
    maxHp: 80,
    gold: 99,
    deckSize: 10,
    character: "WARRIOR",
    image: "",
  };
  const p = w.players.a;
  const site = (kind) => w.sites.find((s) => s.kind === kind);
  const enter = (s, id = "a") => {
    const p = w.players[id];
    p.x = s.x;
    p.y = s.y;
    return applyAction(w, id, { type: "native-enter", siteId: s.id });
  };
  const finish = (outcome = "complete", id = "a") =>
    applyAction(w, id, {
      type: "native-finish",
      token: w.players[id].nativeScene.token,
      outcome,
      profile,
    });
  assert.equal(WIDTH * HEIGHT, 64 * 44 * 6);
  assert.equal(w.tiles.length, WIDTH * HEIGHT);
  assert(w.sites.some(s=>s.x>64) && w.sites.some(s=>s.y>44));
  assert.equal(w.sites.length, 39);
  assert.match(siteUnavailable(w, p, site("town")), /3回/);
  enter(site("town"));
  assert.equal(p.nativeScene, undefined);
  const ordinaryEnemy = site("enemy");
  const elementaryEnemyNames = getEncounterEnemyNamePool("elementary");
  for (let i = 0; i < 3; i++) {
    const defeatedName = ordinaryEnemy.name;
    const defeatedThemeNames = { ...ordinaryEnemy.enemyNamesByTheme };
    enter(ordinaryEnemy);
    assert(p.nativeScene);
    finish("victory");
    assert.notEqual(
      ordinaryEnemy.name,
      defeatedName,
      "victory rotates a regular map enemy to a different name",
    );
    assert(
      elementaryEnemyNames.includes(ordinaryEnemy.name),
      "the next map enemy is selected from the actual battle name pool",
    );
    for (const theme of ["elementary", "high-school", "magic"]) {
      assert.notEqual(
        ordinaryEnemy.enemyNamesByTheme?.[theme],
        defeatedThemeNames[theme],
        `the ${theme} chapter enemy also rerolls after victory`,
      );
      assert(
        getEncounterEnemyNamePool(theme).includes(ordinaryEnemy.enemyNamesByTheme?.[theme]),
        `the rerolled name stays in the ${theme} chapter pool`,
      );
    }
  }
  assert.equal(p.completedBattles, 3);
  const unchallengedName = ordinaryEnemy.name;
  enter(ordinaryEnemy);
  finish("complete");
  assert.equal(
    ordinaryEnemy.name,
    unchallengedName,
    "a non-victory encounter does not rotate the enemy",
  );
  enter(site("town"));
  const token = p.nativeScene.token;
  assert.equal(applyAction(w, "a", { type: "move", dx: 1, dy: 0 }), false);
  assert.equal(
    applyAction(w, "a", {
      type: "native-finish",
      token: "wrong",
      outcome: "complete",
      profile,
    }),
    false,
  );
  finish();
  assert.equal(
    applyAction(w, "a", {
      type: "native-finish",
      token,
      outcome: "complete",
      profile,
    }),
    false,
  );
  assert.match(siteUnavailable(w, p, site("town")), /3回/);
  assert.equal(
    siteUnavailable(w, p, site("rest")),
    null,
    "cooldowns are per place",
  );
  assert.match(
    siteUnavailable(w, w.players.b, site("rest")),
    /3回/,
    "cooldowns are per player",
  );
  enter(site("rest"));
  finish();
  enter(site("event"));
  finish();
  enter(site("treasure"));
  finish();
  assert.match(siteUnavailable(w, p, site("treasure")), /開封済み/);
  enter(site("treasure"), "b");
  assert(w.players.b.nativeScene);
  finish("complete", "b");
  assert.match(siteUnavailable(w, p, site("boss")), /3体/);
  for (const guardian of w.sites.filter((s) => s.kind === "guardian")) {
    enter(guardian);
    enter(guardian, "b");
    const ta = p.nativeScene.token,
      tb = w.players.b.nativeScene.token;
    applyAction(w, "a", { type: "native-ready", token: ta, maxHp: 192 });
    applyAction(w, "b", { type: "native-ready", token: tb, maxHp: 999 });
    assert.equal(
      guardian.maxHp,
      192,
      "first native boss calculation is retained",
    );
    assert.equal(finish("victory"), false, "cannot finish a live shared boss");
    applyAction(w, "a", {
      type: "native-damage",
      token: ta,
      total: 50,
      sequence: 1,
    });
    applyAction(w, "a", {
      type: "native-damage",
      token: ta,
      total: 50,
      sequence: 1,
    });
    assert.equal(guardian.hp, 142, "duplicate damage is ignored");
    applyAction(w, "b", {
      type: "native-damage",
      token: tb,
      total: 50,
      sequence: 1,
    });
    assert.equal(guardian.hp, 92, "concurrent participants both contribute");
    applyAction(w, "a", {
      type: "native-damage",
      token: ta,
      total: 30,
      sequence: 2,
    });
    assert.equal(guardian.hp, 112, "native enemy healing is shared");
    applyAction(w, "a", {
      type: "native-damage",
      token: ta,
      total: 142,
      sequence: 3,
    });
    assert(guardian.cleared);
    finish("victory");
    finish("victory", "b");
  }
  const boss = site("boss");
  enter(boss);
  assert.equal(boss.raidSize, 2);
  addPlayer(w, "c", "C");
  applyAction(w, "a", {
    type: "native-ready",
    token: p.nativeScene.token,
    maxHp: 520,
  });
  assert.equal(
    boss.maxHp,
    1040,
    "native HP times participants at first encounter; late join does not rescale",
  );
  applyAction(w, "a", {
    type: "native-damage",
    token: p.nativeScene.token,
    total: 1040,
    sequence: 1,
    phase: 1,
  });
  assert.equal(boss.bossPhase,2);
  assert.equal(boss.hp,1040);
  assert.equal(w.won,false);
  applyAction(w,"a",{type:"native-damage",token:p.nativeScene.token,total:1040,sequence:2,phase:2});
  assert(w.won);
  assert(finish("victory"), "rewards can finish after world victory");
  assert.equal(p.completedBattles, 7);
  assert.equal(
    applyAction(w, "a", { type: "town", choice: "rest" }),
    false,
    "old RPG shortcuts cannot bypass main scenes",
  );
  console.log(
    "Native RPG rules passed: per-player/per-site cooldowns, treasure, replay protection, shared HP, healing, boss lock/scaling, reward completion.",
  );
} finally {
  await server.close();
}
