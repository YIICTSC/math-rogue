import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { createServer } from "vite";
import { chromium } from "playwright";

// Instrument the actual App only in this test server. No test endpoint is shipped.
const server = await createServer({
  cacheDir: "node_modules/.vite-rpg-activities-test",
  optimizeDeps: { noDiscovery:true, include:["react","react-dom/client","react/jsx-runtime","peerjs","lucide-react"] },
  define: { "import.meta.env.VITE_RPG_PEER_HOST":'"127.0.0.1"',"import.meta.env.VITE_RPG_PEER_PORT":'"9000"',"import.meta.env.VITE_RPG_PEER_PATH":'"/rpg"',"import.meta.env.VITE_RPG_PEER_SECURE":'"false"', "import.meta.env.VITE_ENABLE_DEBUG_FEATURES": '"true"' },
  server: { host: "127.0.0.1", port: 5202, strictPort: true, hmr:false, watch:{ignored:["**/src/**"]} },
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
      duel: rpgDuelRef.current, endTurn: handleEndTurnClick, defeatQuiz: handleRpgDefeatChallengeComplete, dungeon: rpgDungeonRef.current, coop: coopSession, state: gameState, room: rpgRoomRef.current, snapshot: rpgSnapshotRef.current,
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
let guest;
page.on("pageerror", (e) => errors.push(e.stack || e.message));
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
  await page.goto('http://127.0.0.1:5202/', {waitUntil:'domcontentloaded',timeout:240000});
  await page.getByRole('button',{name:'小学5年生',exact:true}).click();
  await page.getByRole('button',{name:'あとで決める',exact:true}).last().click();
  await page.waitForFunction(()=>!!window.__rpgTest);
  await call('debug'); await call('start'); await call('dismiss');
  await screen('MODE_SELECTION');await call('mode');await screen('DIFFICULTY_SELECTION');await call('difficulty');
  await screen('CHARACTER_SELECTION');await call('character');
  if(await state()==='RELIC_SELECTION')await call('relic');await screen('MAP');

 await page.getByLabel('ゲームモード').selectOption('BATTLE_ROYALE');await page.getByLabel('冒険者の名前').fill('Host');await page.getByRole('button',{name:'部屋を作る',exact:true}).click();
 await page.waitForFunction(()=>!!window.__rpgTest.room?.world?.players[window.__rpgTest.room.selfId]?.profile?.deck);
 const code=await page.evaluate(()=>window.__rpgTest.room.code);
 guest=await browser.newPage({viewport:{width:1440,height:1000}});guest.on('pageerror',e=>errors.push(e.stack || e.message));guest.setDefaultTimeout(30000);
 await guest.addInitScript(()=>{localStorage.setItem('pixel_spire_seen_battle_tutorial_v1','true');localStorage.setItem('pixel_spire_seen_parry_tutorial_v1','true');});
 const profile=await page.evaluate(()=>localStorage.getItem('pixel_spire_student_profile_v1'));await guest.addInitScript(profile=>{if(profile)localStorage.setItem('pixel_spire_student_profile_v1',profile);},profile);
 await guest.goto(`http://127.0.0.1:5202/?rpgRoom=${code}`,{waitUntil:'domcontentloaded',timeout:240000});
 await guest.getByRole('button',{name:'あとで決める',exact:true}).last().click();
 await guest.getByLabel('参加名',{exact:true}).fill('Guest');await guest.getByRole('button',{name:'名前を決めて主人公選択へ'}).click();
 await guest.waitForFunction(()=>window.__rpgTest?.state.screen==='CHARACTER_SELECTION');await guest.evaluate(()=>window.__rpgTest.character());
 await guest.waitForFunction(()=>window.__rpgTest?.state.screen==='MAP'&&!!window.__rpgTest.room?.selfId);
 const gid=await guest.evaluate(()=>window.__rpgTest.room.selfId);
 await page.waitForFunction(gid=>!!window.__rpgTest.room.world.players[gid]?.profile?.deck,gid);

 await page.evaluate(gid=>{const r=window.__rpgTest.room,w=r.world;w.activities.nextEventAt=w.deadlineAt;const p=w.players[r.selfId];Object.assign(w.players[gid],{x:p.x,y:p.y});r.send({type:'native-learning',correctAnswers:0});},gid);
 await page.getByRole('button',{name:'バトル',exact:true}).click();
 await guest.getByRole('button',{name:'対戦を受ける',exact:true}).click();
 await screen('BATTLE');await guest.waitForFunction(()=>window.__rpgTest.state.screen==='BATTLE');
 await page.waitForFunction(()=>{const t=window.__rpgTest,d=t.room.world.duels[0];return d.status==='active'&&d.started.includes('1');});
 const firstId=await page.evaluate(()=>window.__rpgTest.room.world.duels[0].first);
 const hostId=await page.evaluate(()=>window.__rpgTest.room.selfId);
 const first=firstId===hostId?page:guest,second=first===page?guest:page;
 await first.waitForFunction(()=>window.__rpgTest.duel?.pending===null);
 assert.equal(await first.evaluate(()=>{const t=window.__rpgTest;return t.play(t.state.player.hand.find(c=>c.type==='ATTACK'));}),false);
 assert.equal(await second.evaluate(()=>{const t=window.__rpgTest;return t.play(t.state.player.hand.find(c=>c.type==='SKILL'));}),false);
 await first.evaluate(()=>window.__rpgTest.endTurn());
 await second.waitForFunction(()=>{const t=window.__rpgTest,d=t.snapshot.world.duels[0];return d.turn===2&&d.started.includes('2')&&t.duel?.pending===null;});
 const before=await first.evaluate(()=>window.__rpgTest.state.player.currentHp);
 assert(await second.evaluate(()=>{const t=window.__rpgTest;return t.play(t.state.player.hand.find(c=>c.type==='ATTACK'&&c.cost<=t.state.player.currentEnergy));}));
 await first.waitForFunction(before=>window.__rpgTest.state.player.currentHp<before,before);
 await second.waitForFunction(()=>window.__rpgTest.duel?.pending===null);
 const hp=await first.evaluate(()=>window.__rpgTest.state.player.currentHp);assert.equal(await second.evaluate(()=>window.__rpgTest.state.enemies[0].currentHp),hp);
 // Authoritative finishing blow still passes through the actual App's result handlers.
 await second.evaluate(()=>{const t=window.__rpgTest,r=t.room,d=t.snapshot.world.duels[0],other=d.members.find(id=>id!==r.selfId);r.send({type:'duel-state',duelId:d.id,revision:d.revision,kind:'effect',player:t.state.player,opponent:{...t.state.enemies[0],currentHp:0}});});
 await second.waitForFunction(()=>['MATH_CHALLENGE','GENERAL_CHALLENGE','ENGLISH_CHALLENGE'].includes(window.__rpgTest.state.screen));
 await first.waitForFunction(()=>window.__rpgTest.state.screen==='RPG_DEFEAT_CHALLENGE');
 assert.equal(await page.evaluate(firstId=>window.__rpgTest.room.world.players[firstId===window.__rpgTest.room.selfId?Object.keys(window.__rpgTest.room.world.players).find(id=>id!==firstId):window.__rpgTest.room.selfId].rivalKills,firstId),1);
 const oldGold=await first.evaluate(()=>window.__rpgTest.state.player.gold);
 await first.evaluate(()=>window.__rpgTest.defeatQuiz());
 await first.waitForFunction(()=>window.__rpgTest.state.screen==='MAP'&&!window.__rpgTest.duel);
 const recovery=await first.evaluate(()=>({hp:window.__rpgTest.state.player.currentHp,max:window.__rpgTest.state.player.maxHp,gold:window.__rpgTest.state.player.gold}));assert.equal(recovery.hp,Math.ceil(recovery.max*.6));assert.equal(recovery.gold,Math.floor(oldGold/2));
 await second.evaluate(()=>window.__rpgTest.quiz());
 await second.waitForFunction(()=>window.__rpgTest.state.screen==='REWARD');await second.evaluate(()=>window.__rpgTest.rewards());
 await second.waitForFunction(()=>window.__rpgTest.state.screen==='MAP'&&!window.__rpgTest.duel);
 await page.getByRole('button',{name:'バトル',exact:true}).click();await guest.getByRole('button',{name:'対戦を受ける',exact:true}).click();await screen('BATTLE');await guest.waitForFunction(()=>window.__rpgTest.state.screen==='BATTLE');
 await page.evaluate(()=>{const r=window.__rpgTest.room;r.world.deadlineAt=Date.now()-1;r.send({type:'native-learning',correctAnswers:0});});
 await screen('MAP');await guest.waitForFunction(()=>window.__rpgTest.state.screen==='MAP'&&!window.__rpgTest.duel);await page.getByRole('heading',{name:'時間切れ！',exact:true}).waitFor();await guest.getByRole('heading',{name:'時間切れ！',exact:true}).waitFor();
 await page.getByRole('heading',{name:'倒した数ランキング',exact:true}).waitFor();await guest.getByRole('heading',{name:'倒した数ランキング',exact:true}).waitFor();
 assert.deepEqual(errors,[]);console.log('Two actual Apps: battle royale invitation, first-turn attack ban, turn exchange, synchronized rival damage, victory quiz/reward, defeat recovery, timeout rankings passed.');
} catch(e){console.error('SCREEN',await state(),'ERRORS',errors);if(guest)console.error('GUEST',await guest.evaluate(()=>({state:window.__rpgTest?.state.screen,players:Object.keys(window.__rpgTest?.room?.world?.players||{}),profile:window.__rpgTest?.state.player.deck.map(c=>({id:c.id,cost:c.cost})),connections:[...window.__rpgTest.room.connections.values()].map(c=>({open:c.open,serialization:c.serialization}))})));console.error(await page.evaluate(()=>({state:window.__rpgTest.state.screen,duel:window.__rpgTest.duel,world:window.__rpgTest.room.world.duels})));await page.screenshot({path:'tmp/rpg-qa/duel-failure.png'});throw e;}finally{await browser.close();await server.close();}
