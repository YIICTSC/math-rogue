import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const output='tmp/home-dash-upgrades/qa';await fs.mkdir(output,{recursive:true});let server,browser;
try{
 server=await createServer({configFile:false,cacheDir:'node_modules/.vite-home-upgrades',optimizeDeps:{noDiscovery:true,include:['react','react-dom','react-dom/client','react/jsx-runtime','react/jsx-dev-runtime','lucide-react']},logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false,watch:null},plugins:[{name:'upgrade-qa',enforce:'pre',transform(code,id){
 if(!id.endsWith('/src/components/GoHomeDash.tsx'))return;
 return ("import {spawnAirBoss} from '../mini-games/go-home-dash/airCombat';\n"+code).replace("if (gameStateRef.current === 'PLAYING') {","if (gameStateRef.current === 'PLAYING' && !(window as any).__freezeDash) {").replace('    const getSubjectIcon =',`    Object.assign(window,{__grade:{
 get state(){return gameStateRef.current;},get levels(){return upgradeLevelsRef.current;},get arcade(){return arcadeRef.current;},get player(){return playerRef.current;},get options(){return upgradeOptions;},get hp(){return hpRef.current;},get obstacles(){return obstaclesRef.current;},get projectiles(){return projectilesRef.current;},get viewport(){return viewportRef.current;},
 restart(){flushSync(initGame);},
 arrange(){flushSync(()=>{arcadeRef.current=createArcade(42);arcadeRef.current.chunk=Infinity;routeSeedRef.current=42;distanceRef.current=0;frameCount.current=0;obstaclesRef.current=[];projectilesRef.current=[];enemyProjectilesRef.current=[];expRef.current=0;nextLevelExpRef.current=99999;hpRef.current=3;setHp(3);pausedRef.current=false;setPaused(false);Object.assign(playerRef.current,{x:120,y:340,vy:0,isJumping:false,isFalling:false,flying:false,invulFrame:99999,dashFrames:0,jumpCount:0,expMult:0,shootingRate:0});gameStateRef.current='PLAYING';setGameState('PLAYING');});},
 grant(id){flushSync(()=>applyGrade(DASH_UPGRADES.find(u=>u.id===id)!));},
 offer(ids=['AIR_1','MOVE_2','DEF_11']){flushSync(()=>{setUpgradeOptions(ids.map(id=>DASH_UPGRADES.find(u=>u.id===id)!));gameStateRef.current='LEVEL_UP';setGameState('LEVEL_UP');});},
 choose(id){flushSync(()=>selectUpgrade(upgradeOptions.find(u=>u.id===id)!));},
 boss(variant=0){spawnAirBoss(arcadeRef.current,variant);},
 pickup(){addEntity(arcadeRef.current,'antiAir',distanceRef.current+playerRef.current.x,32,38,38);},
 challenge(){nextLevelExpRef.current=.01;expRef.current=1;this.step();},
 step(n=1){flushSync(()=>{for(let i=0;i<n;i++)updateLogic();});const ctx=canvasRef.current?.getContext('2d');if(ctx)draw(ctx);},
 pause:togglePause,
 }});\n    const getSubjectIcon =`);
 },configureServer(s){s.middlewares.use('/dash-upgrades-test',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml('/dash-upgrades-test','<html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root" style="height:100dvh"></div><script type="module" src="/scripts/fixtures/home-dash.tsx"></script>'));});}}]});
 await server.listen();browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader-webgl']});
 const page=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true}),errors=[],missing=[];page.setDefaultTimeout(30000);
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().includes('/sprites/go-home-dash/upgrades/'))missing.push(r.url());});
 await page.addInitScript(()=>{localStorage.setItem('home-dash-guide-v1','seen');window.__freezeDash=true;window.__pad={axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0})),id:'Dash QA',mapping:'standard',index:0,connected:true,timestamp:0};navigator.getGamepads=()=>[window.__pad];});
 await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/dash-upgrades-test?unlocked',{waitUntil:'domcontentloaded',timeout:90000});
 await page.locator('.dash-lobby').waitFor();await page.evaluate(()=>__grade.arrange());
 await page.evaluate(async()=>{for(const name of ['upgrades-a','upgrades-b','air-enemies','explosion']){const i=new Image();i.src='/sprites/go-home-dash/upgrades/'+name+'.webp';await i.decode();}});
 for(const [w,h]of [[320,568],[390,844],[568,320],[844,390],[1280,720]]){
  await page.setViewportSize({width:w,height:h});await page.evaluate(()=>__grade.offer());await page.locator('.dash-upgrade-card').first().waitFor();
  const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,cards:[...document.querySelectorAll('.dash-upgrade-card')].map(n=>{const b=n.getBoundingClientRect();const pick=n.querySelector('.dash-upgrade-pick').getBoundingClientRect();return{x:b.x,y:b.y,right:b.right,bottom:b.bottom,pickBottom:pick.bottom};})}));
  assert.equal(layout.overflow,false);for(const c of layout.cards){assert(c.x>=0&&c.y>=0&&c.right<=w+1&&c.bottom<=h+1,`${w}x${h}: card visible ${JSON.stringify(c)}`);assert(c.pickBottom<=h+1);}
  await page.screenshot({path:`${output}/cards-${w}.png`});
  const frame=await page.evaluate(()=>__grade.arcade.frame);await page.evaluate(()=>__grade.step(60));assert.equal(await page.evaluate(()=>__grade.arcade.frame),frame,'Upgrade freezes combat');
  await page.locator('[data-upgrade-id="AIR_1"]').tap();assert.equal(await page.evaluate(()=>__grade.state),'PLAYING');
 }
 assert.equal(await page.evaluate(()=>__grade.levels.AIR_1),5);await page.evaluate(()=>__grade.restart());assert.deepEqual(await page.evaluate(()=>__grade.levels),{},'A new run resets levels');
 await page.evaluate(()=>{__grade.arrange();__grade.offer();});await page.locator('[data-upgrade-id="AIR_1"]').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>__grade.levels.AIR_1),1,'Keyboard selects a card');
 await page.evaluate(()=>{__grade.offer();__grade.choose('AIR_1');__grade.choose('AIR_1');});assert.equal(await page.evaluate(()=>__grade.levels.AIR_1),2,'Double input grants only once');
 await page.evaluate(()=>__grade.offer(['AIR_2','AIR_3','AIR_4']));await page.locator('[data-upgrade-id="AIR_2"]').focus();await page.evaluate(()=>{__pad.buttons[0]={pressed:true,touched:true,value:1};});await page.waitForFunction(()=>__grade.state==='PLAYING');await page.evaluate(()=>{__pad.buttons[0]={pressed:false,touched:false,value:0};});assert.equal(await page.evaluate(()=>__grade.levels.AIR_2),1,'Controller A selects a card');
 await page.evaluate(()=>__grade.restart());await page.evaluate(()=>{__grade.arrange();__grade.pickup();__grade.step();});assert.equal(await page.evaluate(()=>__grade.levels.AIR_1),1,'A collected boss-area capsule grants AA equipment');
 await page.setViewportSize({width:844,height:390});await page.evaluate(()=>__grade.boss(3));
 let killed=false;for(let i=0;i<90;i++){await page.evaluate(()=>__grade.step(8));if(await page.evaluate(()=>!__grade.arcade.boss)){killed=true;break;}}
 assert(killed,'Real update loop shoots down the fortress');assert.equal(await page.evaluate(()=>__grade.arcade.stats.bosses),1);
 assert(await page.evaluate(()=>__grade.arcade.combatFx.some(f=>f.boss)));await page.evaluate(()=>{__grade.player.invulFrame=0;__grade.step();});await page.screenshot({path:`${output}/fortress-explosion.png`});
 const y=await page.evaluate(()=>__grade.arcade.combatFx.find(f=>f.boss).y);await page.evaluate(()=>__grade.step(24));assert((await page.evaluate(()=>__grade.arcade.combatFx.find(f=>f.boss).y))>y+20);await page.screenshot({path:`${output}/fortress-falling.png`});
 await page.evaluate(()=>__grade.pause());const age=await page.evaluate(()=>__grade.arcade.combatFx.find(f=>f.boss).age);await page.evaluate(()=>__grade.step(30));assert.equal(await page.evaluate(()=>__grade.arcade.combatFx.find(f=>f.boss).age),age,'Pause freezes the falling corpse');await page.evaluate(()=>__grade.pause());
 await page.evaluate(()=>{__grade.arrange();__grade.challenge();});assert.equal(await page.evaluate(()=>__grade.state),'CHALLENGE','Actual XP threshold still opens a learning problem');
 const board=page.locator('[data-gamepad-initial-scope^="unit-board-"]');await page.locator('[data-gamepad-zone="challenge-options"]').first().waitFor();await page.waitForTimeout(100);if(await board.count())await board.locator('[data-gamepad-zone="unit-board-close"]').click();
 console.log('PASS card layouts, inputs, upgrade levels, pickup and boss crash. Completing learning flow.');
 for(let i=0;i<3;i++){const choice=page.locator('[data-gamepad-zone="challenge-options"]:not([disabled])').first();await choice.waitFor();await choice.click();if(i<2)await page.waitForFunction(()=>!!document.querySelector('[data-gamepad-zone="challenge-options"]:not([disabled])'));}await page.locator('.dash-upgrade-card').first().waitFor();await page.locator('.dash-upgrade-card').first().click();assert.equal(await page.evaluate(()=>__grade.state),'PLAYING','Answering all three questions resumes through the new grade screen');
 await page.evaluate(async()=>{const {DASH_UPGRADES}=await import('/src/mini-games/go-home-dash/upgrades.ts');for(const u of DASH_UPGRADES)__grade.grant(u.id);});
 for(const [w,h]of [[320,568],[568,320]]){await page.setViewportSize({width:w,height:h});await page.evaluate(()=>__grade.offer(['STRIKE_14','UTIL_10','MOVE_10']));const l=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,bottom:Math.max(...[...document.querySelectorAll('.dash-upgrade-pick')].map(n=>n.getBoundingClientRect().bottom)),icons:[...document.querySelectorAll('.dash-upgrade-build>div>span')].filter(n=>getComputedStyle(n).display!=='none').length}));assert.equal(l.overflow,false);assert(l.bottom<=h+1,'Crowded build keeps selection visible');assert.equal(l.icons,10,'Owned icons remain visible in the build strip');await page.screenshot({path:`${output}/full-build-${w}.png`});}
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 console.log('PASS five responsive card layouts, touch/keyboard/controller selection, level cap, restart, double-input guard, capsule pickup, actual automatic boss kill and exploding fall, pause and complete three-question learning flow. Screenshots: '+output);
}finally{await browser?.close();await server?.close();}
