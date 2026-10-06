import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { createServer } from "vite";
import { chromium } from "playwright";

// Instrument the actual App only in this test server. No test endpoint is shipped.
const server = await createServer({
  cacheDir: "node_modules/.vite-demon-main-test",
  optimizeDeps: { entries: ["index.html"] },
  define: { "import.meta.env.VITE_ENABLE_DEBUG_FEATURES": '"true"' },
  server: { host: "127.0.0.1", port: 4261, strictPort: true },
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
page.setDefaultTimeout(120000);
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
 await page.goto('http://127.0.0.1:4261/',{waitUntil:'domcontentloaded',timeout:180000});
 await page.getByRole('button',{name:'小学5年生',exact:true}).click();await page.getByRole('button',{name:'あとで決める',exact:true}).last().click();
 await page.waitForFunction(()=>!!window.__rpgTest);await call('debug');await call('start');await call('dismiss');await screen('MODE_SELECTION');await call('mode');await screen('DIFFICULTY_SELECTION');await call('difficulty');await screen('CHARACTER_SELECTION');await call('character');await page.waitForFunction(()=>window.__rpgTest.state.screen!=='CHARACTER_SELECTION');if(await state()==='RELIC_SELECTION')await call('relic');await screen('MAP');
 await page.getByRole('button',{name:'ひとりで遊ぶ',exact:true}).click();await page.getByRole('button',{name:'冒険をはじめる',exact:true}).click();await page.waitForFunction(()=>window.__rpgTest.room?.world.players.local?.profile);
 await page.evaluate(()=>{const t=window.__rpgTest;for(const s of t.room.world.sites.filter(s=>s.kind==='guardian'))s.cleared=true;t.room.emit();});await enter('boss');await screen('BATTLE');await call('dismiss');
 for(let phase=1;phase<=3;phase++){
  await page.waitForFunction(phase=>window.__rpgTest.state.enemies[0]?.phase===phase,phase);assert.equal(await page.evaluate(()=>window.__rpgTest.state.enemies[0].enemyType),'RPG_DEMON');
  await page.waitForFunction(phase=>[...document.querySelectorAll('.battle-humanoid-enemy-sprite img')].some(i=>i.src.includes(`/demon/${phase}-idle.webp`)&&i.naturalWidth>0),phase);
  await page.evaluate(()=>{const t=window.__rpgTest;t.setState(s=>({...s,player:{...s.player,currentEnergy:99,hand:[{...s.player.deck.find(c=>c.damage>0),id:'demon-test-strike-'+s.enemies[0].phase,type:'ATTACK',damage:100000,cost:0}]}}));});
  await page.waitForFunction(()=>window.__rpgTest.state.player.hand[0]?.damage===100000);assert(await page.evaluate(()=>window.__rpgTest.play(window.__rpgTest.state.player.hand[0])));
  if(phase<3)await page.waitForFunction(phase=>window.__rpgTest.room.world.sites.find(s=>s.kind==='boss').bossPhase===phase+1,phase);
 }
 await page.waitForFunction(()=>window.__rpgTest.room.world.won);assert.deepEqual(errors,[]);console.log('Actual App boss passed: three generated humanoid appearances, real attack-card transforms, authoritative phases and final victory.');
}finally{await browser.close();await server.close();}
