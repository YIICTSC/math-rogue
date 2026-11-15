import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { createServer } from "vite";
import { chromium } from "playwright";
const shots = "tmp/poker-expansion-qa";
await mkdir(shots, { recursive: true });
let server, browser;
try {
  server = await createServer({
    configFile:false, cacheDir:"node_modules/.vite-poker-expansion",optimizeDeps:{noDiscovery:true,include:["react","react-dom","react-dom/client","react/jsx-runtime","react/jsx-dev-runtime","lucide-react"]},
    logLevel: "error",
    server: { host: "127.0.0.1", port: 0, hmr: false },
    plugins: [
      {
        name: "poker-club-qa",
        enforce: "pre",
        configureServer(s) {
          s.middlewares.use("/poker-test", async (req, res) => {
            res.setHeader("Content-Type", "text/html");
            res.end(
              await s.transformIndexHtml(
                req.url,
                '<html><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><body style="margin:0"><div id="root" style="height:100dvh"></div><script type="module" src="/scripts/fixtures/poker-club.tsx"></script></body></html>',
              ),
            );
          });
        },
        transform(source, id) {
          if (!id.endsWith("/PokerGameScreen.tsx")) return;
          return (
            "import { flushSync as pokerTestFlush } from \'react-dom\';\n" +
            source.replace(
              "  if (phase === 'MATH')",
              "  (window as any).__poker={runState,phase,lobby,expression,setRunState:(v:any)=>pokerTestFlush(()=>setRunState(v)),setPhase:(v:any)=>pokerTestFlush(()=>setPhase(v)),setSelectedCards:(v:any)=>pokerTestFlush(()=>setSelectedCards(v)),initRun:(v:any)=>pokerTestFlush(()=>initRun(v)),startBlind:()=>pokerTestFlush(startBlind),playHand,openPack,selectPackItem,useConsumable,PACK_LIBRARY,CONSUMABLES_LIBRARY,signatureSupporter,saveStateNow,canContinue,handleMathComplete,voices,hydrateState,getPokerRivalById,packContent,progress,availableSupporters,availableConsumables,availablePacks,createPackPreview,generateShop,discardHand,applyTarot,winBlind,setProgress:(v:any)=>pokerTestFlush(()=>{progressRef.current=v;setProgress(v);}),setSelectedConsumable:(v:any)=>pokerTestFlush(()=>setSelectedConsumable(v)),setRivalWarning:(v:any)=>pokerTestFlush(()=>setRivalWarning(v))};\n  if (phase === 'MATH')",
            )
          );
        },
      },
    ],
  });
  await server.listen();
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const base = `http://127.0.0.1:${server.httpServer.address().port}/poker-test`,
    errors = [];
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    hasTouch: true,
  });
  page.setDefaultTimeout(90000);
  page.on("pageerror", (e) => { errors.push(e.message); console.error("Poker page error:",e.message); });
  await page.addInitScript(() =>
    localStorage.setItem("pixel_spire_seen_poker_tutorial_v1", "true"),
  );
  await page.clock.install();
  await page.goto(base,{timeout:90000});
  await page.getByRole('button',{name:'♠ 新しい放課後'}).click();await page.getByRole('button',{name:'相棒と参戦 →'}).click();
  await page.locator('.poker-rival-warning').waitFor();assert.match(await page.locator('.poker-rival-warning').innerText(),/7は/);
  await page.locator('.poker-rival-warning button').click();assert.equal(await page.evaluate(()=>__poker.phase),'PLAY');
  assert.equal(await page.getByRole('button',{name:'プレイ',exact:true}).count(),1);assert.equal(await page.getByRole('button',{name:'すてる',exact:true}).count(),1);assert.equal(await page.getByRole('button',{name:'ランク',exact:true}).count(),1);assert.equal(await page.getByRole('button',{name:'スート',exact:true}).count(),1);
  const initial=await page.evaluate(()=>({s:__poker.availableSupporters.length,c:__poker.availableConsumables.length,p:__poker.availablePacks.length}));
  await page.evaluate(()=>__poker.setProgress({version:1,wins:24,clears:1,bestAnte:9,receipts:[]}));
  const unlocked=await page.evaluate(()=>({s:__poker.availableSupporters.length,c:__poker.availableConsumables.length,p:__poker.availablePacks.length}));assert(unlocked.s>initial.s&&unlocked.c>initial.c&&unlocked.p>initial.p,'Progress expands all three pools');
  await page.evaluate(()=>{__poker.generateShop();__poker.setPhase('SHOP');});assert.equal(await page.locator('.poker-shop-screen .poker-player-badge').count(),0);
  for(const [width,height]of [[390,844],[844,390],[320,568],[568,320]]){await page.setViewportSize({width,height});await page.screenshot({path:`${shots}/shop-${width}.png`});assert.equal(await page.locator('.poker-player-badge').count(),0);}
  await page.locator('.poker-unlocks-button').click();assert.equal(await page.locator('.poker-unlock-list article').count(),54);await page.screenshot({path:`${shots}/unlocks.png`});await page.locator('.poker-unlock-modal header button').click();
  // Every themed pack produces actual themed content; closing it removes the light layer.
  const packIds=await page.evaluate(()=>__poker.PACK_LIBRARY.filter(p=>p.id.startsWith('PACK_EXP_')).map(p=>p.id));
  for(const id of packIds){await page.evaluate(id=>{const pack=__poker.PACK_LIBRARY.find(p=>p.id===id);__poker.setRunState(s=>({...s,money:100,supporters:[],consumables:[],shopInventory:[pack]}));__poker.openPack(pack,0);},id);await page.locator('.poker-sealed-pack').click();await page.clock.runFor(1000);await page.setViewportSize({width:390,height:844});
   const result=await page.evaluate(()=>{const root=document.querySelector('.poker-pack-opening');return {overflow:root.scrollWidth>root.clientWidth+1,content:__poker.runState.openPack};});assert.equal(result.overflow,false,id+' must not create a wide scrolling ray layer');
   const cards=await page.evaluate(()=>__poker.packContent);assert(cards.length>0);const key=id.slice(9);if(key==='HEART')assert(cards.every(c=>c.suit==='HEART'));else if(key==='BLACK')assert(cards.every(c=>['SPADE','CLUB'].includes(c.suit)));else if(key==='ACE')assert(cards.every(c=>c.rank>=11));else if(key==='STUDY')assert(cards.every(c=>c.type==='PLANET'));else if(key==='CRAFT')assert(cards.every(c=>c.type==='TAROT'));else if(key==='CREW')assert(cards.every(c=>c.id.startsWith('EXP_')));else assert(cards.every(c=>c.enhancement===key),id+' has its promised enhancement');
   if(id==='PACK_EXP_ECHO'){await page.waitForTimeout(1000);assert((await page.locator('.poker-pack-rays').evaluate(n=>Number(getComputedStyle(n).opacity)))<.01,'Opening rays fade out completely');await page.screenshot({path:`${shots}/echo-pack.png`});}
   // Use the real candidate button; it must be selectable, persist the item and return to the shop.
   await page.locator('.poker-pack-choice button').first().click();assert.equal(await page.evaluate(()=>__poker.phase),'SHOP');assert.equal(await page.locator('.poker-pack-rays').count(),0);
  }
  // All seven cards are blocked, including their supporter bonuses.
  await page.evaluate(()=>{__poker.setPhase('PLAY');__poker.setRivalWarning(false);__poker.setRunState(s=>({...s,currentBlind:{...s.currentBlind,rivalId:'rival_lucky_nanami',scoreGoal:999999,bossAbility:undefined},supporters:[__poker.signatureSupporter('high-school-warrior')],currentScore:0,handsRemaining:4,hand:[{id:'seven1',rank:7,suit:'HEART',bonusChips:100,multMultiplier:3},{id:'seven2',rank:7,suit:'CLUB',bonusChips:100,multMultiplier:3}]}));__poker.setSelectedCards(['seven1','seven2']);});await page.evaluate(()=>void __poker.playHand());await page.clock.runFor(5000);assert.equal(await page.evaluate(()=>__poker.runState.currentScore),0,'Nanami receives no score from sevens');
  await page.evaluate(()=>{__poker.setRunState(s=>({...s,currentScore:0,supporters:[],handLevels:{HIGH_CARD:1},handsRemaining:4,hand:[{id:'nine',rank:9,suit:'HEART',bonusChips:0,multMultiplier:1},{id:'heldSeven',rank:7,suit:'CLUB',bonusChips:0,multMultiplier:1,enhancement:'STEEL'},{id:'heldInkSeven',rank:7,suit:'SPADE',bonusChips:0,multMultiplier:1,enhancement:'INK'}],deck:Array.from({length:12},(_,i)=>({id:'safe'+i,rank:2,suit:'SPADE',bonusChips:0,multMultiplier:1}))}));__poker.setSelectedCards(['nine']);});await page.evaluate(()=>void __poker.playHand());await page.clock.runFor(10000);assert.equal(await page.evaluate(()=>__poker.runState.currentScore),14,'Immune held sevens cannot add steel/ink score either');
  const ids=await page.evaluate(async()=>Object.keys((await import('/src/mini-games/after-school-poker/rivalTraits.ts')).RIVAL_TRAITS));
  for(const id of ids){await page.evaluate(id=>{__poker.setPhase('BLIND_SELECT');__poker.setRunState(s=>({...s,currentBlind:{...s.currentBlind,rivalId:id,rivalName:__poker.getPokerRivalById(id).name,name:__poker.getPokerRivalById(id).name}}));},id);await page.clock.runFor(20);assert.equal(await page.locator('.poker-trait-rule').count(),1,id+' has a warning');}
  await page.evaluate(()=>{__poker.setRunState(s=>({...s,currentBlind:{...s.currentBlind,bossAbility:'THE_NEEDLE',description:'手札を1回しか出せない'}}));__poker.setRivalWarning(true);});assert.equal(await page.locator('.poker-trait-boss').count(),1,'Existing boss condition stacks with the specialty');
  for(const [width,height]of [[320,568],[568,320],[390,844],[844,390]]){await page.setViewportSize({width,height});await page.screenshot({path:`${shots}/rival-warning-${width}.png`});const b=await page.locator('.poker-rival-warning button').boundingBox();assert(b&&b.y>=0&&b.y+b.height<=height+1,'Start button fits short screens');}
  await page.locator('.poker-rival-warning button').click();
  // The new one-card coating rejects multiple targets and consumes once on success.
  await page.evaluate(()=>{const c=__poker.CONSUMABLES_LIBRARY.find(c=>c.id==='STA_EXP_ECHO');__poker.setRunState(s=>({...s,hand:[{id:'e1',rank:9,suit:'HEART',bonusChips:0,multMultiplier:1},{id:'e2',rank:6,suit:'CLUB',bonusChips:0,multMultiplier:1}],consumables:[c]}));__poker.setSelectedConsumable(c);__poker.setSelectedCards(['e1','e2']);});await page.evaluate(()=>__poker.applyTarot());assert.equal(await page.evaluate(()=>__poker.runState.consumables.length),1);await page.evaluate(()=>__poker.setSelectedCards(['e1']));await page.evaluate(()=>__poker.applyTarot());assert.equal(await page.evaluate(()=>__poker.runState.hand[0].enhancement),'ECHO');assert.equal(await page.evaluate(()=>__poker.runState.consumables.length),0);
  // Score all six enhancements through the real animation/state-update pipeline.
  for(const [kind,expected]of Object.entries({ECHO:23,EMBER:62,PRISM:42,INK:59,LUCKY:14,ANCHOR:56})){
   await page.evaluate(kind=>{const held=['INK','ANCHOR'].includes(kind);__poker.setPhase('PLAY');__poker.setRivalWarning(false);__poker.setRunState(s=>({...s,currentBlind:{name:'Test',scoreGoal:999999,rewardMoney:4},supporters:[],currentScore:0,money:0,handsRemaining:4,handLevels:{HIGH_CARD:1},persistentCounters:{HANDS_PLAYED:3,HANDS_THIS_BLIND:0},hand:[{id:'score',rank:9,suit:'HEART',bonusChips:0,multMultiplier:1,enhancement:held?undefined:kind},{id:'held',rank:2,suit:'CLUB',bonusChips:0,multMultiplier:1,enhancement:held?kind:undefined}],deck:Array.from({length:12},(_,i)=>({id:'draw'+i,rank:2,suit:'SPADE',bonusChips:0,multMultiplier:1}))}));__poker.setSelectedCards(['score']);},kind);await page.evaluate(()=>void __poker.playHand());await page.clock.runFor(10000);assert.equal(await page.evaluate(()=>__poker.runState.currentScore),expected,kind+' scores its documented effect');assert.equal(await page.evaluate(()=>__poker.runState.money),kind==='LUCKY'?1:0);
  }
  for(const id of ['SPX_TRAINING','SPX_STEEL','SPX_DRAW','SPX_RESET','SPX_LUNCH','SPX_REVIEW']){await page.evaluate(id=>{const c=__poker.CONSUMABLES_LIBRARY.find(c=>c.id===id);__poker.setRunState(s=>({...s,consumables:[c]}));__poker.useConsumable(c,0);},id);assert.equal(await page.evaluate(()=>__poker.runState.consumables.length),0,id+' activates and consumes');}
  await page.evaluate(()=>{const c=__poker.CONSUMABLES_LIBRARY.find(c=>c.id==='TXT_EXP_PAIR');__poker.setRunState(s=>({...s,handLevels:{...s.handLevels,PAIR:1},consumables:[c]}));__poker.useConsumable(c,0);});assert.equal(await page.evaluate(()=>__poker.runState.handLevels.PAIR),4,'New textbook raises the named hand by three levels');
  // Progress is recorded before the question/shop phase, without waiting for a title-screen exit.
  const wins=await page.evaluate(()=>__poker.progress.wins);await page.evaluate(()=>__poker.winBlind());assert.equal(await page.evaluate(()=>__poker.progress.wins),wins+1);await page.evaluate(()=>__poker.saveStateNow());await page.reload();await page.waitForFunction(()=>Boolean(window.__poker));assert.equal(await page.evaluate(()=>__poker.progress.wins),wins+1);
  await page.evaluate(async()=>(await import('/src/services/storageService.ts')).storageService.clearPokerState());
  await page.goto(base+'?lang=en',{timeout:90000});await page.getByRole('button',{name:'♠ New run',exact:true}).click();await page.getByRole('button',{name:'Take your seat →'}).click();await page.locator('.poker-rival-warning button').click();assert.equal(await page.getByRole('button',{name:'PLAY HAND',exact:true}).count(),1);assert.equal(await page.getByRole('button',{name:'DISCARD',exact:true}).count(),1);assert(!/[ぁ-んァ-ヶ一-龠]/.test(await page.locator('.poker-live-trait').innerText()));
  await page.evaluate(()=>{__poker.initRun('high-school-warrior');});
  // The fixture starts in its title lobby; direct game-state checks above already cover localized Japanese controls.
  const migration=await browser.newPage();await migration.addInitScript(()=>{if(!sessionStorage.getItem('poker-migration-fixture')){localStorage.setItem('pixel_spire_poker_expanded_supporters_unlocked_v1','1');sessionStorage.setItem('poker-migration-fixture','true');}localStorage.setItem('pixel_spire_seen_poker_tutorial_v1','true');});await migration.goto(base,{timeout:90000});await migration.waitForFunction(()=>window.__poker?.progress.bestAnte>=8);await migration.evaluate(()=>{localStorage.removeItem('pixel_spire_poker_expanded_supporters_unlocked_v1');__poker.initRun('high-school-warrior');__poker.saveStateNow();});await migration.reload();await migration.waitForFunction(()=>window.__poker?.progress.bestAnte>=8);assert.equal(await migration.evaluate(()=>__poker.progress.clears),1,'Legacy clear progress survives a new run and reload');await migration.close();
  assert.deepEqual(errors,[]);console.log('PASS shop hero removal, Japanese controls, 54-item unlocks, 12 themed pack flows, bounded pack light, Nanami immunity, 60 warnings, four warning layouts, one-target coatings, all six actual enhancement scores, six spectral uses, advanced textbooks and saved/legacy progress.');
}finally{await browser?.close();await server?.close();}
