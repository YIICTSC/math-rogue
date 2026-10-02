import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { createServer } from "vite";
import { chromium } from "playwright";

// Instrument the actual App only in this test server. No test endpoint is shipped.
const server = await createServer({
  cacheDir: "node_modules/.vite-rpg-main-test",
  optimizeDeps: { entries: ["index.html"] },
  define: { "import.meta.env.VITE_ENABLE_DEBUG_FEATURES": '"true"' },
  server: { host: "127.0.0.1", port: 5196, strictPort: true },
  plugins: [
    {
      name: "rpg-main-test",
      enforce: "pre",
      async load(id) {
        if (!id.replaceAll("\\", "/").endsWith("/src/App.tsx")) return;
        const code = await readFile(id, "utf8");
        const at = code.lastIndexOf("\n    return (");
        assert(at > 0);
        return (
          code.slice(0, at) +
          `
    window.__rpgTest = {
      state: gameState, room: rpgRoomRef.current, snapshot: rpgSnapshotRef.current,
      setState: setGameState, debug: () => setIsDebugMode(true), debugActive: () => isDebugModeActive,
      start: () => launchNewAdventure(visualTheme, true),
      dismiss: () => { setShowAssignmentLetter(false); setShowParryTutorial(false); },
      mode: () => handleModeSelect(GameMode.MULTIPLICATION), difficulty: () => handleDifficultySelect(1),
      character: () => handleCharacterSelect(themedCharacters[0]),
      relic: () => handleRelicSelect(starterRelics[0]),
      inviteSetup: applyRpgInviteSetup,
      play: handlePlayCard, win: resolveBattleVictory, lose: resolveBattleDefeat,
      defeatChallengeComplete: handleRpgDefeatChallengeComplete,
      quiz: handleMathChallengeComplete, rewards: finishRewardPhase, reward: handleRewardSelection,
      complete: handleNodeComplete, rest: handleRestAction, treasure: handleTreasureOpen,
      event: () => handleCoopEventOptionSelect(0), eventComplete: handleEventComplete,
      returnToTitle, theme: setVisualTheme,
      assignmentComplete: isCurrentAssignmentComplete,
      remoteDamage: async () => {
        const engine = await import('/src/rpg/engine.ts');
        const room = rpgRoomRef.current, w = room.world;
        const own = w.players[room.selfId], site = w.sites.find(s => s.id === own.nativeScene.siteId);
        engine.addPlayer(w, 'test-remote', 'Remote');
        const remote = w.players['test-remote']; remote.x = site.x; remote.y = site.y;
        engine.applyAction(w, remote.id, { type: 'native-enter', siteId: site.id });
        engine.applyAction(w, remote.id, { type: 'native-damage', token: remote.nativeScene.token, total: 20, sequence: 1 });
        room.send({ type: 'native-ready', token: own.nativeScene.token, maxHp: site.maxHp });
      },
      assignment: (assignment) => {
        storageService.saveCurrentAssignment(assignment); setCurrentAssignment(assignment);
        assignmentStartConfirmedIdRef.current = assignment.id; setAssignmentStartConfirmedId(assignment.id);
        setShowAssignmentLetter(false);
      },
    };
` +
          code.slice(at)
        );
      },
    },
  ],
});
await server.listen();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.addInitScript(() => {
  localStorage.setItem("pixel_spire_language_mode_v1", "JAPANESE");
  localStorage.setItem("pixel_spire_seen_battle_tutorial_v1", "true");
  localStorage.setItem("pixel_spire_seen_parry_tutorial_v1", "true");
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.setDefaultTimeout(20000);
const state = () => page.evaluate(() => window.__rpgTest?.state.screen);
const screen = (name) =>
  page.waitForFunction((name) => window.__rpgTest?.state.screen === name, name);
const call = (name) => page.evaluate((name) => window.__rpgTest[name](), name);
async function enter(kind, index = 0) {
  await screen("MAP");
  await page.waitForFunction(
    () =>
      !window.__rpgTest.room.world.players[window.__rpgTest.room.selfId]
        .nativeScene,
  );
  return page.evaluate(
    ({ kind, index }) => {
      const r = window.__rpgTest.room,
        s = r.world.sites.filter((s) => s.kind === kind)[index],
        p = r.world.players[r.selfId];
      p.x = s.x;
      p.y = s.y;
      r.send({ type: "native-enter", siteId: s.id });
      return s.id;
    },
    { kind, index },
  );
}
async function winBattle() {
  await screen("BATTLE");
  // Finish the real encounter quickly; native victory must still run the actual
  // post-battle question and reward handlers, not an RPG imitation.
  await page.evaluate(() =>
    window.__rpgTest.setState((s) => ({ ...s, enemies: [] })),
  );
  await page.waitForFunction(() =>
    ["MATH_CHALLENGE", "GENERAL_CHALLENGE", "ENGLISH_CHALLENGE"].includes(
      window.__rpgTest.state.screen,
    ),
  );
  await call("quiz");
}
try {
  await mkdir("tmp/rpg-qa", { recursive: true });
  await page.goto("http://127.0.0.1:5196/", {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await page.getByRole("button", { name: "小学5年生", exact: true }).click();
  await page
    .getByRole("button", { name: "あとで決める", exact: true })
    .last()
    .click();
  await page.waitForFunction(() => !!window.__rpgTest);
  const mainSave = await page.evaluate(() => {
    const saved = JSON.stringify({
      ...window.__rpgTest.state,
      screen: "MAP",
      map: [],
      rpgOnline: undefined,
    });
    localStorage.setItem("pixel_spire_save_state_v1", saved);
    return saved;
  });
  await call("debug");
  // A saved inheritance card must not open the normal game's "忘れ物"
  // startup event when the adventure is launched in RPG mode.
  await page.evaluate(() =>
    localStorage.setItem(
      "pixel_spire_legacy_card_v1",
      JSON.stringify({ id: "rpg-legacy-test", name: "RPG引き継ぎテストカード" }),
    ),
  );
  await page.evaluate(() =>
    history.replaceState({}, "", `${location.pathname}?rpgRoom=AB2CDE`),
  );
  await page
    .getByRole("button", { name: "RPGオンライン 開発中・デバッグ限定" })
    .click();
  await call("dismiss");
  await screen("MODE_SELECTION");
  await call("mode");
  await screen("DIFFICULTY_SELECTION");
  await call("difficulty");
  await screen("CHARACTER_SELECTION");
  await page.getByRole("button", { name: /敵キャラクターで冒険/ }).click();
  await page.locator(".rpg-hero-grid button").first().click();
  await page.screenshot({ path: "tmp/rpg-qa/enemy-hero-selection.png" });
  const selectedEnemyName = await page.locator(".rpg-hero-browser aside h2").innerText();
  assert(selectedEnemyName.length > 0, "enemy hero details are visible");
  await page.getByRole("button", { name: "このキャラクターで冒険する", exact: true }).click();
  if ((await state()) === "RELIC_SELECTION") await call("relic");
  await screen("MAP");
  await page.evaluate(() => localStorage.removeItem("pixel_spire_legacy_card_v1"));
  assert.equal(
    await page.getByLabel("招待コード（6文字）").inputValue(),
    "AB2CDE",
    "an invite URL pre-fills the room code",
  );
  await page.locator(".rpg-lobby-form input").first().fill("冒険者");
  await page.getByRole("button", { name: "まずはひとりで練習する" }).click();
  await page.waitForFunction(
    () => !!window.__rpgTest.room?.world?.players.local?.profile,
  );
  assert.match(
    await page.evaluate(() => window.__rpgTest.state.player.id),
    /^RPG_ENEMY:/,
    "the selected enemy hero becomes the RPG protagonist",
  );
  assert.equal(await page.evaluate(() => window.__rpgTest.state.player.deck.length),10);
  assert.equal(await page.evaluate(() => window.__rpgTest.state.player.relics.length),1);
  await page.screenshot({ path: "tmp/rpg-qa/native-map.png" });
  await enter("town");
  assert.equal(
    await page.evaluate(
      () => window.__rpgTest.room.world.players.local.nativeScene,
    ),
    undefined,
  );
  for (let i = 0; i < 3; i++) {
    await enter("enemy");
    await screen("BATTLE");
    await call("dismiss");
    if (i === 0) {
      await page.screenshot({ path: "tmp/rpg-qa/native-battle.png" });
      const result = await page.evaluate(() => {
        const t = window.__rpgTest,
          card = t.state.player.hand.find(
            (c) => c.damage > 0 && c.cost <= t.state.player.currentEnergy,
          );
        return card ? t.play(card) : false;
      });
      assert.equal(
        result,
        true,
        "the original card handler accepts a playable card",
      );
    }
    await page.evaluate(() =>
      window.__rpgTest.setState((s) => ({ ...s, enemies: [] })),
    );
    await screen("MATH_CHALLENGE");
    if (i === 0) await page.screenshot({ path: "tmp/rpg-qa/native-quiz.png" });
    await page.evaluate(() => window.__rpgTest.quiz(3));
    await screen("REWARD");
    if (i === 0)
      await page.screenshot({ path: "tmp/rpg-qa/native-rewards.png" });
    await call("rewards");
    await screen("MAP");
    await page.waitForFunction(
      (n) => window.__rpgTest.room.world.players.local.completedBattles === n,
      i + 1,
    );
  }
  await enter("town");
  await screen("REST");
  await page.screenshot({ path: "tmp/rpg-qa/native-rest.png" });
  await call("rest");
  await call("complete");
  await screen("MAP");
  await enter("town");
  assert.equal(await state(), "MAP");
  await enter("rest");
  await screen("REST");
  await call("complete");
  await page.evaluate(() =>
    window.__rpgTest.setState((s) => ({
      ...s,
      player: {
        ...s.player,
        relicCounters: { ...s.player.relicCounters, CRANE_GAME_LAST_ACT: 1 },
      },
    })),
  );
  await enter("event");
  await screen("EVENT");
  await page.screenshot({ path: "tmp/rpg-qa/native-event.png" });
  await call("complete");
  const treasureId = await enter("treasure");
  await screen("TREASURE");
  await call("treasure");
  await page.screenshot({ path: "tmp/rpg-qa/native-treasure.png" });
  await call("complete");
  await screen("MAP");
  await enter("treasure");
  assert.equal(await state(), "MAP");
  assert(
    await page.evaluate(
      (id) => window.__rpgTest.room.world.players.local.claimed.includes(id),
      treasureId,
    ),
  );
  await enter("boss");
  assert.equal(await state(), "MAP");
  for (let i = 0; i < 3; i++) {
    await enter("guardian", i);
    await screen("BATTLE");
    assert(
      await page.evaluate(() => window.__rpgTest.state.enemies[0].maxHp > 100),
    );
    if (i === 0) {
      const hp = await page.evaluate(
        () => window.__rpgTest.state.enemies[0].currentHp,
      );
      await call("remoteDamage");
      await page.waitForFunction(
        (hp) => window.__rpgTest.state.enemies[0].currentHp === hp - 20,
        hp,
      );
      assert.equal(
        await page.evaluate(
          () =>
            window.__rpgTest.room.world.sites.find((s) => s.kind === "guardian")
              .hp,
        ),
        hp - 20,
        "remote damage must not echo back as another local hit",
      );
    }
    await page.evaluate(() =>
      window.__rpgTest.setState((s) => ({ ...s, enemies: [] })),
    );
    await screen("MATH_CHALLENGE");
    await page.evaluate(() => window.__rpgTest.quiz(3));
    await screen("REWARD");
    await call("rewards");
    await screen("MAP");
  }
  await page.evaluate(async () => {
    const e = await import("/src/rpg/engine.ts");
    e.removePlayer(window.__rpgTest.room.world, "test-remote");
  });
  await enter("boss");
  await screen("BATTLE");
  assert.match(
    await page.evaluate(() => window.__rpgTest.state.enemies[0].name),
    /校長/,
  );
  const bossSiteId = await page.evaluate(() => {
    const room = window.__rpgTest.room;
    const own = room.world.players[room.selfId];
    const site = room.world.sites.find((s) => s.kind === "boss");
    room.send({
      type: "native-damage",
      token: own.nativeScene.token,
      total: site.maxHp,
      sequence: 1,
      phase: 1,
    });
    return site.id;
  });
  await page.waitForFunction(
    (id) =>
      window.__rpgTest.room.world.sites.find((s) => s.id === id).bossPhase === 2 &&
      window.__rpgTest.state.enemies[0]?.phase === 2,
    bossSiteId,
  );
  await page.evaluate((id) => {
    const room = window.__rpgTest.room;
    const own = room.world.players[room.selfId];
    const site = room.world.sites.find((s) => s.id === id);
    room.send({
      type: "native-damage",
      token: own.nativeScene.token,
      total: site.maxHp,
      sequence: 2,
      phase: 2,
    });
  }, bossSiteId);
  await page.waitForFunction(
    (id) => window.__rpgTest.room.world.sites.find((s) => s.id === id).cleared,
    bossSiteId,
  );
  await page.evaluate(() =>
    window.__rpgTest.setState((s) => ({ ...s, enemies: [] })),
  );
  await screen("MATH_CHALLENGE");
  await page.evaluate(() => window.__rpgTest.quiz(3));
  await screen("REWARD");
  await call("rewards");
  await screen("MAP");
  await page.getByRole("heading", { name: "校長を倒しました！" }).waitFor();
  assert.equal(
    await page.evaluate(() =>
      localStorage.getItem("pixel_spire_save_state_v1"),
    ),
    mainSave,
  );
  await call("returnToTitle");
  await screen("START_MENU");
  for (const theme of ["high-school", "magic"]) {
    await page.evaluate((theme) => window.__rpgTest.theme(theme), theme);
    await call("start");
    await call("dismiss");
    await screen("MODE_SELECTION");
    await call("mode");
    await screen("DIFFICULTY_SELECTION");
    await call("difficulty");
    await screen("CHARACTER_SELECTION");
    await call("character");
    await page.waitForFunction(
      () => window.__rpgTest.state.screen !== "CHARACTER_SELECTION",
    );
    if ((await state()) === "RELIC_SELECTION") await call("relic");
    await screen("MAP");
    await page.locator(".rpg-lobby-form input").first().fill("冒険者");
    await page.getByRole("button", { name: "まずはひとりで練習する" }).click();
    await page.waitForFunction(
      () => !!window.__rpgTest.room?.world?.players.local?.profile,
    );
    assert.equal(
      await page.evaluate(() => window.__rpgTest.state.visualTheme),
      theme,
    );
    await enter("enemy");
    await screen("BATTLE");
    await page.screenshot({ path: `tmp/rpg-qa/native-${theme}-battle.png` });
    await call("lose");
    await screen("RPG_DEFEAT_CHALLENGE");
    await call("defeatChallengeComplete");
    await screen("MAP");
    await page.waitForFunction(
      () => !window.__rpgTest.room.world.players.local.nativeScene,
    );
    assert.equal(
      await page.evaluate(
        () => window.__rpgTest.room.world.players.local.completedBattles,
      ),
      0,
    );
    assert.equal(
      await page.evaluate(() => window.__rpgTest.state.player.currentHp),
      await page.evaluate(() =>
        Math.ceil(window.__rpgTest.state.player.maxHp * 0.6),
      ),
    );
    assert.equal(
      await page.evaluate(() =>
        localStorage.getItem("pixel_spire_save_state_v1"),
      ),
      mainSave,
    );
    await call("returnToTitle");
    await screen("START_MENU");
  }
  await page.evaluate(() =>
    window.__rpgTest.assignment({
      id: "rpg-test-assignment",
      title: "RPG課題確認",
      units: [],
      customProblems: [
        {
          id: "rpg-q1",
          question: "RPG課題確認：2+3は？",
          answer: "5",
          options: ["5", "6", "7", "8"],
          timeLimitSeconds: null,
        },
      ],
      customTargetCorrect: 1,
      dueAt: "2099-01-01T00:00:00Z",
      createdAt: new Date().toISOString(),
      gameMode: "FREE",
      answerMode: "CHOICE",
      enforcementLevel: "optional",
    }),
  );
  await call("start");
  await call("dismiss");
  await screen("DIFFICULTY_SELECTION");
  await call("difficulty");
  await screen("CHARACTER_SELECTION");
  await call("character");
  await page.waitForFunction(
    () => window.__rpgTest.state.screen !== "CHARACTER_SELECTION",
  );
  if ((await state()) === "RELIC_SELECTION") await call("relic");
  await screen("MAP");
  await page.locator(".rpg-lobby-form input").first().fill("冒険者");
  await page.getByRole("button", { name: "まずはひとりで練習する" }).click();
  await page.waitForFunction(
    () => !!window.__rpgTest.room?.world?.players.local?.profile,
  );
  await enter("enemy");
  await screen("BATTLE");
  await page.evaluate(() =>
    window.__rpgTest.setState((s) => ({ ...s, enemies: [] })),
  );
  await screen("GENERAL_CHALLENGE");
  await page.getByText("RPG課題確認：2+3は？", { exact: true }).waitFor();
  await page.screenshot({ path: "tmp/rpg-qa/native-assignment.png" });
  await page.getByRole("button", { name: "5", exact: true }).click();
  await page.waitForFunction(() =>
    JSON.parse(
      localStorage.getItem("pixel_spire_assignment_answers_v1") || "[]",
    ).some((r) => r.assignmentId === "rpg-test-assignment" && r.correct),
  );
  await page
    .getByRole("heading", { name: "課題をクリアしました", exact: true })
    .waitFor();
  await page.screenshot({ path: "tmp/rpg-qa/native-assignment-complete.png" });

  // Opening an invite URL is a participant entry point even before the local
  // debug gesture. The host setup must put the participant on protagonist
  // selection and carry the problem settings into the normal scenes.
  const invitePage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const inviteErrors = [];
  invitePage.on("pageerror", (e) => inviteErrors.push(e.message));
  await invitePage.addInitScript(() => {
    localStorage.setItem("pixel_spire_language_mode_v1", "JAPANESE");
  localStorage.setItem("pixel_spire_seen_battle_tutorial_v1", "true");
    localStorage.setItem("pixel_spire_seen_parry_tutorial_v1", "true");
  });
  await invitePage.goto("http://127.0.0.1:5196/?rpgRoom=AB2CDE", {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await invitePage.waitForFunction(() => !!window.__rpgTest);
  await invitePage.waitForFunction(
    () => window.__rpgTest.state.screen === "MAP" && window.__rpgTest.state.rpgOnline,
  );
  assert.equal(
    await invitePage.evaluate(() => window.__rpgTest.debugActive?.() ?? false),
    false,
    "an invite participant does not need to activate debug mode",
  );
  await invitePage.evaluate(() =>
    window.__rpgTest.inviteSetup({
      visualTheme: "high-school",
      mode: "MIXED",
      modePool: ["MULTIPLICATION", "UPPER_TRIVIA"],
      answerMode: "INPUT",
      difficultyLevel: 3,
    }),
  );
  await invitePage.waitForFunction(
    () => window.__rpgTest.state.screen === "CHARACTER_SELECTION",
  );
  assert.deepEqual(
    await invitePage.evaluate(() => ({
      mode: window.__rpgTest.state.mode,
      modePool: window.__rpgTest.state.modePool,
      answerMode: window.__rpgTest.state.answerMode,
      difficultyLevel: window.__rpgTest.state.difficultyLevel,
    })),
    {
      mode: "MIXED",
      modePool: ["MULTIPLICATION", "UPPER_TRIVIA"],
      answerMode: "INPUT",
      difficultyLevel: 3,
    },
    "invite participants receive the host problem setup",
  );
  await invitePage.evaluate(() => window.__rpgTest.character());
  await invitePage.waitForFunction(
    () => window.__rpgTest.state.screen === "MAP",
  );
  assert.equal(
    await invitePage.evaluate(() => window.__rpgTest.state.player.id),
    "WARRIOR",
    "invite participants choose a protagonist before entering the world",
  );
  assert.deepEqual(inviteErrors, []);
  await invitePage.close();
  assert.deepEqual(errors, []);
  console.log(
    "Main-scene RPG: selection, invite auto-entry/setup sync, all 3 themes, original card battle, quiz/rewards, cooldowns, treasure, shared guardians/boss, defeat, main-save isolation, custom assignment answers and completion passed.",
  );
} catch (e) {
  console.error("SCREEN", await state(), "ERRORS", errors);
  await page.screenshot({ path: "tmp/rpg-qa/native-failure.png" });
  throw e;
} finally {
  await browser.close();
  await server.close();
}
