import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { createServer } from "vite";
import { chromium } from "playwright";

// Instrument the actual App only in this test server. No test endpoint is shipped.
const server = await createServer({
  cacheDir: "node_modules/.vite-rpg-activities-test",
  optimizeDeps: { noDiscovery:true, include:["react","react-dom/client","react/jsx-runtime","peerjs","lucide-react"] },
  define: { "import.meta.env.VITE_ENABLE_DEBUG_FEATURES": '"true"' },
  server: { host: "127.0.0.1", port: 5199, strictPort: true, hmr:false, watch:{ignored:["**/src/**"]} },
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
      dungeon: rpgDungeonRef.current, coop: coopSession, state: gameState, room: rpgRoomRef.current, snapshot: rpgSnapshotRef.current,
      setState: setGameState, debug: () => setIsDebugMode(true), debugActive: () => isDebugModeActive,
      start: () => launchNewAdventure(visualTheme, true),
      dismiss: () => { setShowAssignmentLetter(false); setShowParryTutorial(false); },
      mode: () => handleModeSelect(GameMode.MULTIPLICATION), difficulty: () => handleDifficultySelect(1),
      character: () => handleCharacterSelect(themedCharacters[0]),
      relic: () => handleRelicSelect(starterRelics[0]),
      inviteSetup: applyRpgInviteSetup,
      play: handlePlayCard, win: resolveBattleVictory, lose: resolveBattleDefeat,
      quiz: handleMathChallengeComplete, rewards: finishRewardPhase, reward: handleRewardSelection,
      restLeave:handleRestLeave, treasureLeave:handleTreasureLeave, complete: handleNodeComplete, rest: handleRestAction, treasure: handleTreasureOpen,
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
  await mkdir('tmp/rpg-qa', {recursive:true});
  await page.goto('http://127.0.0.1:5199/', {waitUntil:'domcontentloaded',timeout:240000});
  await page.getByRole('button',{name:'小学5年生',exact:true}).click();
  await page.getByRole('button',{name:'あとで決める',exact:true}).last().click();
  await page.waitForFunction(()=>!!window.__rpgTest);
  await call('debug'); await call('start'); await call('dismiss');
  await screen('MODE_SELECTION');await call('mode');await screen('DIFFICULTY_SELECTION');await call('difficulty');
  await screen('CHARACTER_SELECTION');await call('character');
  if(await state()==='RELIC_SELECTION')await call('relic');await screen('MAP');
  await page.getByRole('button',{name:'まずはひとりで練習する'}).click();
  await page.waitForFunction(()=>!!window.__rpgTest.room?.world.players.local?.profile?.deck);
  // Enter through the real town/rest card, not a direct map action.
  await page.evaluate(()=>{const t=window.__rpgTest;t.room.world.activities.nextEventAt=t.room.world.deadlineAt;const town=t.room.world.sites.find(s=>s.kind==='town');Object.assign(t.room.world.players.local,{x:town.x,y:town.y,completedBattles:3});t.room.send({type:'native-enter',siteId:town.id});});
  await screen('REST');
  await page.getByRole('button',{name:/ゲームセンター/}).click();
  await screen('MAP');
  await page.getByRole('dialog').waitFor();
  assert.equal(await page.locator('.rpg-activities').getByRole('button',{name:'スロットを回す'}).count(),0);
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('.rpg-arcade-games img')).every(i=>i.complete&&i.naturalWidth>0));
  await page.screenshot({path:'tmp/rpg-qa/town-arcade-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'tmp/rpg-qa/town-arcade-mobile.png'});
  assert(await page.locator('.rpg-arcade-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth));
  await page.setViewportSize({width:1440,height:1000});
  for(const [index,game] of ['FLIP','ROULETTE','SLOT'].entries()) {
    const before=await page.evaluate(()=>({gold:window.__rpgTest.state.player.gold,x:window.__rpgTest.room.world.players.local.x,y:window.__rpgTest.room.world.players.local.y}));
    await page.keyboard.press('ArrowRight');
    assert.deepEqual(await page.evaluate(()=>({x:window.__rpgTest.room.world.players.local.x,y:window.__rpgTest.room.world.players.local.y})),{x:before.x,y:before.y});
    await page.locator('.rpg-arcade-games button').nth(index).click();
    if(game==='FLIP')await page.locator('.rpg-arcade-cards button').nth(1).click();
    if(game==='ROULETTE')await page.locator('.rpg-arcade-colors button').nth(2).click();
    const play=page.getByRole('button',{name:'10コインで挑戦する',exact:true});
    await play.waitFor({state:'visible'});
    await page.waitForFunction(()=>!document.querySelector('.rpg-arcade-primary').disabled);
    // Two synchronous clicks still charge exactly once.
    await play.evaluate(b=>{b.click();b.click();});
    await screen('MATH_CHALLENGE');
    assert.equal(await page.evaluate(()=>window.__rpgTest.state.player.gold),before.gold-10);
    assert.equal(await page.evaluate(()=>window.__rpgTest.room.world.players.local.arcadeUses),index+1);
    await page.evaluate(()=>window.__rpgTest.quiz(3));await screen('MAP');
    await page.waitForFunction(n=>window.__rpgTest.state.player.rpgMutationRevision===n,(index+1)*2);
    if(game==='SLOT')for(let reel=0;reel<3;reel++)await page.getByRole('button',{name:'リールを止める',exact:true}).click();
    await page.getByRole('button',{name:'もう一度遊ぶ',exact:true}).waitFor();
    const result=await page.evaluate(()=>window.__rpgTest.room.world.players.local.arcadeOutcome);
    assert.equal(result.game,game);assert.equal(result.correctCount,3);
    assert.equal(await page.evaluate(()=>window.__rpgTest.state.player.gold),before.gold-10+result.gold);
    await page.screenshot({path:`tmp/rpg-qa/town-arcade-${game.toLowerCase()}-result.png`});
    await page.getByRole('button',{name:'もう一度遊ぶ',exact:true}).click();
  }
  await page.getByRole('dialog').getByRole('button',{name:'閉じる',exact:true}).click();
  await page.evaluate(()=>{const r=window.__rpgTest.room,s=r.world.sites.find(s=>s.kind==='dungeon');Object.assign(r.world.players.local,{x:s.x,y:s.y});r.send({type:'dungeon-join',siteId:s.id});});
  await page.getByRole('button',{name:'準備完了',exact:true}).click();
  await page.getByRole('button',{name:'ダンジョン開始',exact:true}).click();
  await screen('BATTLE');await call('dismiss');
  assert.equal(await page.evaluate(()=>window.__rpgTest.coop.battleMode),'REALTIME');
  assert.equal(await page.evaluate(()=>window.__rpgTest.state.challengeMode),'COOP');
  await page.screenshot({path:'tmp/rpg-qa/dungeon-battle.png'});
  for(let battle=0;battle<2;battle++) {
    await screen('BATTLE');await page.evaluate(()=>window.__rpgTest.setState(s=>({...s,enemies:[]})));
    await screen('MATH_CHALLENGE');await page.evaluate(()=>window.__rpgTest.quiz(3));await screen('REWARD');await call('rewards');
  }
  await screen('REST');await call('rest');await call('restLeave');
  await screen('BATTLE');await page.evaluate(()=>window.__rpgTest.setState(s=>({...s,enemies:[]})));
  await screen('MATH_CHALLENGE');await page.evaluate(()=>window.__rpgTest.quiz(3));await screen('REWARD');await call('rewards');
  await screen('TREASURE');await page.evaluate(()=>window.__rpgTest.treasure(0));await call('treasureLeave');
  await screen('MAP');await page.waitForFunction(()=>!window.__rpgTest.dungeon);
  assert.equal(await page.evaluate(()=>window.__rpgTest.room.world.activities.dungeons[0].status),'complete');
  assert.notEqual(await page.evaluate(()=>window.__rpgTest.state.challengeMode),'COOP');
  // Time limit must interrupt the original question scene and close the arcade.
  await enter('town');await screen('REST');
  await page.getByRole('button',{name:/ゲームセンター/}).click();await screen('MAP');
  await page.locator('.rpg-arcade-games button').nth(2).click();
  await page.waitForFunction(()=>!document.querySelector('.rpg-arcade-primary').disabled);
  await page.getByRole('button',{name:'10コインで挑戦する',exact:true}).click();
  await screen('MATH_CHALLENGE');
  await page.evaluate(()=>{window.__rpgTest.room.world.deadlineAt=Date.now()-1;});
  await page.getByRole('heading',{name:'時間切れ！',exact:true}).waitFor();
  assert.equal(await page.getByRole('dialog').count(),0);
  assert.equal(await page.evaluate(()=>window.__rpgTest.room.world.players.local.arcadePending),undefined);
  assert.deepEqual(errors,[]);
  console.log('Actual App: arcade question/prize, REALTIME dungeon battle/question/reward/rest/treasure and world return passed.');
} catch(e) {
 console.error('SCREEN',await state(),'ERRORS',errors);await page.screenshot({path:'tmp/rpg-qa/activities-failure.png'});throw e;
} finally {await browser.close();await server.close();}
