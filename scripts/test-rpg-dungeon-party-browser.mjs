import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { createServer } from "vite";
import { chromium } from "playwright";

// Instrument the actual App only in this test server. No test endpoint is shipped.
const server = await createServer({
  cacheDir: "node_modules/.vite-rpg-activities-test",
  optimizeDeps: { noDiscovery:true, include:["react","react-dom/client","react/jsx-runtime","peerjs","lucide-react"] },
  define: { "import.meta.env.VITE_RPG_PEER_HOST":'"127.0.0.1"',"import.meta.env.VITE_RPG_PEER_PORT":'"9000"',"import.meta.env.VITE_RPG_PEER_PATH":'"/rpg"',"import.meta.env.VITE_RPG_PEER_SECURE":'"false"', "import.meta.env.VITE_ENABLE_DEBUG_FEATURES": '"true"' },
  server: { host: "127.0.0.1", port: 5201, strictPort: true, hmr:false, watch:{ignored:["**/src/**"]} },
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
  await page.goto('http://127.0.0.1:5201/', {waitUntil:'domcontentloaded',timeout:240000});
  await page.getByRole('button',{name:'小学5年生',exact:true}).click();
  await page.getByRole('button',{name:'あとで決める',exact:true}).last().click();
  await page.waitForFunction(()=>!!window.__rpgTest);
  await call('debug'); await call('start'); await call('dismiss');
  await screen('MODE_SELECTION');await call('mode');await screen('DIFFICULTY_SELECTION');await call('difficulty');
  await screen('CHARACTER_SELECTION');await call('character');
  if(await state()==='RELIC_SELECTION')await call('relic');await screen('MAP');

 await page.getByLabel('冒険者の名前').fill('Host');await page.getByRole('button',{name:'部屋を作る',exact:true}).click();
 await page.waitForFunction(()=>!!window.__rpgTest.room?.world?.players[window.__rpgTest.room.selfId]?.profile?.deck);
 const code=await page.evaluate(()=>window.__rpgTest.room.code);
 const guest=await browser.newPage({viewport:{width:1440,height:1000}});guest.on('pageerror',e=>errors.push(e.message));guest.setDefaultTimeout(30000);
 await guest.addInitScript(()=>{localStorage.setItem('pixel_spire_seen_battle_tutorial_v1','true');localStorage.setItem('pixel_spire_seen_parry_tutorial_v1','true');});
 const profile=await page.evaluate(()=>localStorage.getItem('pixel_spire_student_profile_v1'));await guest.addInitScript(profile=>{if(profile)localStorage.setItem('pixel_spire_student_profile_v1',profile);},profile);
 await guest.goto(`http://127.0.0.1:5201/?rpgRoom=${code}`,{waitUntil:'domcontentloaded',timeout:240000});
 await guest.getByRole('button',{name:'あとで決める',exact:true}).last().click();
 await guest.getByLabel('参加名',{exact:true}).fill('Guest');await guest.getByRole('button',{name:'名前を決めて主人公選択へ'}).click();
 await guest.waitForFunction(()=>window.__rpgTest?.state.screen==='CHARACTER_SELECTION');await guest.evaluate(()=>window.__rpgTest.character());
 await guest.waitForFunction(()=>window.__rpgTest?.state.screen==='MAP'&&!!window.__rpgTest.room?.selfId);
 const gid=await guest.evaluate(()=>window.__rpgTest.room.selfId);
 await page.waitForFunction(gid=>!!window.__rpgTest.room.world.players[gid]?.profile?.deck,gid);
 await page.evaluate(gid=>{const r=window.__rpgTest.room,w=r.world;w.activities.nextEventAt=w.deadlineAt;const s=w.sites.find(s=>s.kind==='dungeon');for(const id of [r.selfId,gid])Object.assign(w.players[id],{x:s.x,y:s.y});r.send({type:'dungeon-join',siteId:s.id});},gid);
 await guest.waitForFunction(()=>window.__rpgTest.snapshot.world.players[window.__rpgTest.room.selfId].x===18);
 await guest.evaluate(()=>{const r=window.__rpgTest.room;r.send({type:'dungeon-join',siteId:window.__rpgTest.snapshot.world.sites.find(s=>s.kind==='dungeon').id});});
 await page.waitForFunction(()=>window.__rpgTest.room.world.activities.dungeons[0].members.length===2);
 await page.getByRole('button',{name:'準備完了',exact:true}).click();await guest.getByRole('button',{name:'準備完了',exact:true}).click();
 await page.getByRole('button',{name:'ダンジョン開始',exact:true}).click();await screen('BATTLE');
 await guest.waitForFunction(()=>window.__rpgTest.state.screen==='BATTLE');await call('dismiss');await guest.evaluate(()=>window.__rpgTest.dismiss());
 const enemyIds=await page.evaluate(()=>window.__rpgTest.state.enemies.map(e=>e.id));assert.deepEqual(await guest.evaluate(()=>window.__rpgTest.state.enemies.map(e=>e.id)),enemyIds);
 await guest.waitForFunction(()=>window.__rpgTest.state.player.hand.some(c=>c.damage>0));
 const before=await page.evaluate(()=>window.__rpgTest.state.enemies.reduce((s,e)=>s+e.currentHp,0));
 assert(await guest.evaluate(()=>{const t=window.__rpgTest;return t.play(t.state.player.hand.find(c=>c.damage>0&&c.cost<=t.state.player.currentEnergy));}));
 await page.waitForFunction(before=>window.__rpgTest.state.enemies.reduce((s,e)=>s+e.currentHp,0)<before,before);
 await guest.waitForFunction(before=>window.__rpgTest.state.enemies.reduce((s,e)=>s+e.currentHp,0)<before,before);
 const hp=await page.evaluate(()=>window.__rpgTest.state.enemies.map(e=>e.currentHp));await guest.waitForFunction(hp=>JSON.stringify(window.__rpgTest.state.enemies.map(e=>e.currentHp))===JSON.stringify(hp),hp);
 await page.waitForFunction(gid=>window.__rpgTest.room.world.players[gid].totalDamage>0,gid);
 await page.evaluate(()=>{const r=window.__rpgTest.room;r.world.deadlineAt=Date.now()-1;r.send({type:'native-learning',correctAnswers:0});});
 await screen('MAP');await guest.waitForFunction(()=>window.__rpgTest.state.screen==='MAP'&&!window.__rpgTest.dungeon);
 await page.getByRole('heading',{name:'時間切れ！',exact:true}).waitFor();await guest.getByRole('heading',{name:'時間切れ！',exact:true}).waitFor();
 assert.deepEqual(errors,[]);console.log('Two actual Apps: invitation, same realtime enemies, guest card attack/shared HP/damage ranking, timeout return and rankings passed.');
} catch(e){console.error('SCREEN',await state(),'ERRORS',errors);await page.screenshot({path:'tmp/rpg-qa/party-failure.png'});throw e;}finally{await browser.close();await server.close();}
