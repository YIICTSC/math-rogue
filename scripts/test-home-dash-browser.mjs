import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { createServer } from 'vite';
import { chromium } from 'playwright';
const output='tmp/home-dash-qa';await fs.mkdir(output,{recursive:true});
let server,browser;
try{
 server=await createServer({logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{
  name:'home-dash-qa',enforce:'pre',
  transform(code,id){if(!id.endsWith('/src/components/GoHomeDash.tsx'))return;return code.replace('    const getSubjectIcon =',`    Object.assign(window, {__dash: {
      get viewport(){return viewportRef.current;}, get slideImage(){return playerSlideRef.current?.src;}, get art(){return artImagesRef.current;}, get arcade(){return arcadeRef.current;}, pause:togglePause, slide:triggerSlide, init:initGame, setMode:selectRunMode, get paused(){return pausedRef.current;}, get routeArt(){return routeArtRef.current;}, get player(){return {...playerRef.current};}, get state(){return gameStateRef.current;}, get hero(){return heroRef.current;}, get seed(){return routeSeedRef.current;}, get distance(){return distanceRef.current;}, get hp(){return hpRef.current;}, get obstacles(){return obstaclesRef.current;}, get frame(){return frameCount.current;}, get enemyShots(){return enemyProjectilesRef.current;},
      step(n=1){flushSync(()=>{for(let i=0;i<n;i++)updateLogic();});const c=canvasRef.current?.getContext('2d');if(c)draw(c);},
      arrange(seed,distance,overrides={},obs=[]){flushSync(()=>{pausedRef.current=false;setPaused(false);arcadeRef.current=createArcade(seed,runModeRef.current,distance);arcadeRef.current.chunk=Infinity;routeSeedRef.current=seed;distanceRef.current=distance;expRef.current=0;obstaclesRef.current=obs;enemyProjectilesRef.current=[];projectilesRef.current=[];playerRef.current={...playerRef.current,x:120,y:floorAt(seed,distance+120),vy:0,isJumping:false,isFalling:false,jumpCount:0,flying:false,invulFrame:0,dashFrames:0,dashCooldown:0,...overrides};setTravelled(Math.floor(distance/10));setArcadeView({...arcadeRef.current});setRoute(routeAt(seed,distance+120).id);setFlight(false);setDashReady(true);gameStateRef.current='PLAYING';setGameState('PLAYING');});},
      sweep(n){const seen=new Set();let max=0;flushSync(()=>{for(let i=0;i<n;i++){updateLogic();for(const e of arcadeRef.current.entities)seen.add(e.kind);max=Math.max(max,arcadeRef.current.entities.length);}});return {seen:[...seen],max,state:gameStateRef.current};},
      fly(n){flushSync(()=>{for(let i=0;i<n;i++){
        const p=playerRef.current, gate=obstaclesRef.current.find(o=>o.type==='FLIGHT_GATE'&&o.x>p.x-60);
        const target=(gate?.y||175)+34;
        if(p.y>target&&p.vy>=0)triggerJump();
        updateLogic();
      }});const c=canvasRef.current?.getContext('2d');if(c)draw(c);},
      simulate(n){const seen=new Set();flushSync(()=>{for(let i=0;i<n;i++){updateLogic();for(const o of obstaclesRef.current)seen.add(o.type);}});return {seen:[...seen],state:gameStateRef.current,player:playerRef.current};},
      damage(fall=false){handlePlayerDamage(fall);}, setHero(id){setSelectedHero(id);}, returnToTitle,
      challenge(){flushSync(()=>{expRef.current=nextLevelExpRef.current;updateLogic();});},completeChallenge(){flushSync(()=>handleChallengeComplete(3));}
    }});
    const getSubjectIcon =`);},
  configureServer(s){s.middlewares.use('/dash-test',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml(req.url,'<html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root" style="height:100dvh"></div><script type="module" src="/scripts/fixtures/home-dash.tsx"></script>'));});}
 }]});await server.listen();
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1280,height:800},hasTouch:true});
 await context.addInitScript(()=>{const buttons=Array.from({length:17},()=>({pressed:false,touched:false,value:0}));Object.assign(window,{__pad:{id:'QA Controller',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons}});navigator.getGamepads=()=>[window.__pad];});
 if(process.env.DASH_GUIDE_CAPTURE)await context.addInitScript(()=>localStorage.setItem('home-dash-guide-v1','seen'));
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));
 const base=`http://127.0.0.1:${server.httpServer.address().port}/dash-test`;
 await page.goto(base);await page.locator('.dash-lobby').waitFor();
 await page.getByRole('button',{name:'主人公を選ぶ'}).click();assert.equal(await page.locator('.dash-hero:not(:disabled)').count(),2);
 await page.getByRole('tab',{name:'マジック編'}).click();assert.equal(await page.locator('.dash-hero:not(:disabled)').count(),4);
 await page.goto(base+'?unlocked');await page.locator('.dash-lobby').waitFor();
 await page.evaluate(async()=>{const {DASH_HERO_ART}=await import('/src/mini-games/go-home-dash/heroes.ts');await Promise.all(Object.keys(DASH_HERO_ART).map(async id=>{const image=new Image();image.src='/sprites/go-home-dash/heroes/'+id+'.webp';await image.decode();if(image.naturalWidth!==512||image.naturalHeight!==320)throw Error('Bad hero atlas '+id);}));});
 assert.equal(await page.locator('.dash-roster').count(),0);
 assert.ok(await page.locator('.dash-title-actions').evaluate(el=>el.getBoundingClientRect().right<innerWidth*.5));
 await page.screenshot({path:`${output}/title-desktop.png`});
 await page.getByRole('button',{name:'主人公を選ぶ'}).click();assert.equal(await page.locator('.dash-hero:not(:disabled)').count(),9);
 await page.getByRole('tab',{name:'マジック編'}).click();assert.equal(await page.locator('.dash-hero:not(:disabled)').count(),17);
 await page.locator('[data-hero="magic-akari"]').click();
 for(const size of [{width:1280,height:800},{width:390,height:844},{width:844,height:390}]){await page.setViewportSize(size);await page.screenshot({path:`${output}/runner-selection-${size.width}x${size.height}.png`});}
 await page.setViewportSize({width:1280,height:800});
 if(process.env.DASH_LOBBY_CAPTURE_ONLY){await browser.close();await server.close();process.exit(0);}
 await page.getByRole('button',{name:'START DASH'}).click();
 if(!process.env.DASH_GUIDE_CAPTURE){
  const dialog=page.getByRole('dialog');await dialog.waitFor();assert.equal(await page.evaluate(()=>__dash.state),'START');
  assert.equal(await page.evaluate(()=>localStorage.getItem('home-dash-guide-v1')),null);
  await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>__dash.state),'START');
  const topics=dialog.locator('nav button');assert.equal(await topics.count(),16);
  for(let i=0;i<16;i++){await topics.nth(i).click();await dialog.locator('article img').evaluate(async img=>{await img.decode();if(img.naturalWidth!==960)throw Error('Missing guide screenshot');});assert.equal(await topics.nth(i).getAttribute('aria-current'),'step');}
  await topics.first().click();
  for(const size of [{width:1280,height:800},{width:390,height:844},{width:844,height:390}]){
   await page.setViewportSize(size);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   const bounds=await dialog.locator('footer').boundingBox();assert.ok(bounds.y>=0&&bounds.y+bounds.height<=size.height,JSON.stringify(bounds));
   await page.screenshot({path:`${output}/guide-${size.width}x${size.height}.png`});
  }
  await dialog.locator('nav button').first().click();await dialog.locator('.dash-guide-shot').click();assert.equal(await dialog.locator('.dash-guide-shot').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await dialog.count(),1);assert.equal(await dialog.locator('.dash-guide-shot').getAttribute('aria-expanded'),'false');
  await dialog.locator('nav button').last().click();await page.setViewportSize({width:1280,height:800});

  await dialog.getByRole('button',{name:'走り出す'}).click();assert.equal(await page.evaluate(()=>localStorage.getItem('home-dash-guide-v1')),'seen');
 }
 await page.waitForFunction(()=>window.__dash?.hero==='magic-akari');
 await page.waitForFunction(()=>window.__dash?.routeArt.school?.naturalWidth===1280);
 await page.clock.install({time:new Date('2026-10-21T00:00:00Z')});await page.clock.pauseAt(new Date('2026-10-21T00:00:01Z'));
 if(process.env.DASH_GUIDE_CAPTURE){
  const guideDir='public/sprites/go-home-dash/guide';await fs.mkdir(guideDir,{recursive:true});
  await page.waitForFunction(()=>__dash.art.items?.complete&&__dash.art.hazards?.complete&&__dash.slideImage);
  await page.evaluate(()=>{window.__guideRandom=Math.random;});
  const captures=[];
  for(const id of ['jump','dash','slide','routes','flight','collect','powers','launch','gravity','wave','rocket','rail','hazards','boss','learning','modes'].filter(id=>!process.env.DASH_GUIDE_CAPTURE_PAGES||process.env.DASH_GUIDE_CAPTURE_PAGES.split(',').includes(id))){
   await page.evaluate(async id=>{
    const m=await import('/src/mini-games/go-home-dash/arcade.ts');const routes=await import('/src/mini-games/go-home-dash/routes.ts');
    const sky=Array.from({length:16},(_,i)=>30000*i+1800).find(d=>routes.routeAt(42,d+120).flight);
    const distance=id==='flight'?sky:id==='routes'?29700:0;
    __dash.arrange(42,distance,{invulFrame:0});Math.random=id==='learning'?window.__guideRandom:()=>.999;
    const s=__dash.arcade;
    const add=(kind,d,lift=34,w=32,h=32,air=false)=>m.addEntity(__dash.arcade,kind,distance+d,lift,w,h,air);
    if(id==='jump'){__dash.arrange(42,0,{y:220,vy:-3,isJumping:true});add('coin',220,120);add('coin',270,160);add('coin',320,170);add('spike',420,0,100,32);}
    if(id==='dash'){__dash.arrange(42,0,{dashFrames:300,dashCooldown:450,invulFrame:304});add('wall',410,86,65,86);add('charge',300);add('boost',520,0,90,10);}
    if(id==='slide'){s.slide=30;add('tunnel',370,90,220,54);for(let i=0;i<6;i++)add('coin',290+i*40,18);}
    if(id==='routes'){__dash.obstacles.push({id:'guide-stair',type:'HIGH_STEPS',x:430,y:300,width:190,height:85,vy:0,speedMult:1});}
    if(id==='flight'){__dash.obstacles.push({id:'guide-gate',type:'FLIGHT_GATE',x:400,y:175,width:72,height:340,vy:0,speedMult:1});}
    if(id==='collect'){s.combo=18;s.comboTime=180;s.fever=240;s.energy=100;for(let i=0;i<9;i++)add('coin',210+i*42,40+Math.sin(i/8*Math.PI)*90);add('star',610,110);}
    if(id==='powers'){for(const [i,kind] of ['magnet','shield','double','sneakers','board','lowGravity'].entries())add(kind,230+i*90,110,34,34);}
    if(id==='launch'){add('orb',280,130);add('pad',400,0,70,12);__dash.obstacles.push({id:'guide-spring',type:'SPRING',x:530,y:315,width:55,height:30,vy:0,speedMult:1},{id:'guide-lift',type:'ELEVATOR',x:680,y:235,width:130,height:18,vy:0,speedMult:1,phase:0});}
    if(['gravity','wave','rocket'].includes(id)){s.vehicle=id;s.vehicleTime=480;s.gravity=1;add(id,310,130);for(let i=0;i<4;i++)add('coin',390+i*60,140+i*12,18,18,true);add('airGate',700,170,65,140,true);}
    if(id==='rail'){add('rail',390,115,360,12);for(let i=0;i<7;i++)add('coin',250+i*45,150);}
    if(id==='hazards'){add('spike',260,0,75,32);add('saw',380,110,50,50);add('laser',520,130,150,14);add('missile',680,210,48,22,true);}
    if(id==='boss'){s.boss={hp:3,life:780,shot:90};add('charge',270);add('missile',470,150,48,22,true);}
    __dash.step(10);if(id==='learning')__dash.challenge();if(id==='modes')__dash.pause();
   },id);
   await page.clock.runFor(1);
   if(id==='learning'){await page.waitForFunction(()=>__dash.state==='CHALLENGE');await page.locator('[data-gamepad-question-screen]').waitFor();}
   const png=await page.screenshot();const file=`${guideDir}/${id}.webp`;await sharp(png).resize(960,600).webp({quality:86}).toFile(file);captures.push(file);
  }
  console.log(`Captured ${captures.length} actual gameplay screenshots for the first-run guide.`);
  await page.evaluate(()=>{__dash.init();__dash.arrange(42,0);});
  if(process.env.DASH_GUIDE_CAPTURE_ONLY){await browser.close();await server.close();process.exit(0);}
 }
 // The opening street must load and draw the same ImageGen plate as later routes.
 await page.evaluate(async()=>{const image=new Image();image.src='/sprites/go-home-dash/routes/school.webp';await image.decode();if(image.naturalWidth!==1280||image.naturalHeight!==640)throw Error('Bad opening background');});
 await page.evaluate(()=>{Math.random=()=>.999;__dash.arrange(42,0);__dash.step(1);});
 const openingDraws=await page.evaluate(()=>{
  const proto=CanvasRenderingContext2D.prototype, original=proto.drawImage, drawn=[];
  proto.drawImage=function(...args){if(args[0] instanceof HTMLImageElement&&args[0].src.includes('/routes/'))drawn.push(args[0].src);return original.apply(this,args);};
  try{for(let i=0;i<30;i++)__dash.step(1);}finally{proto.drawImage=original;}
  return drawn;
 });assert.ok(openingDraws.length>=30);assert.ok(openingDraws.every(src=>src.includes('/routes/school.webp')));
 await page.screenshot({path:`${output}/route-school.png`});
 await page.keyboard.down('Space');const start=await page.evaluate(()=>__dash.player);assert.equal(start.jumpCount,1);assert.equal(start.isPressing,true);
 await page.evaluate(()=>__dash.step(8));const high=await page.evaluate(()=>__dash.player);assert.ok(high.y<300);
 await page.keyboard.up('Space');assert.equal(await page.evaluate(()=>__dash.player.isPressing),false);
 await page.keyboard.press('Shift');assert.equal(await page.evaluate(()=>__dash.player.dashFrames),300);
 await page.evaluate(()=>__dash.step(299));assert.equal(await page.evaluate(()=>__dash.player.dashFrames),1);assert.ok(await page.evaluate(()=>__dash.player.invulFrame)>0);
 await page.evaluate(()=>__dash.step());assert.equal(await page.evaluate(()=>__dash.player.dashFrames),0);
 await page.evaluate(()=>__dash.step(150));assert.equal(await page.evaluate(()=>__dash.player.dashCooldown),0);
 // A-button hold and X dash use the real controller navigation hook.
 await page.evaluate(()=>{__dash.arrange(42,0);__pad.buttons[0]={pressed:true,touched:true,value:1};__pad.buttons[2]={pressed:true,touched:true,value:1};});
 await page.clock.runFor(40);assert.equal(await page.evaluate(()=>__dash.player.isPressing),true);assert.ok(await page.evaluate(()=>__dash.player.dashFrames)>0);
 await page.evaluate(()=>{__pad.buttons[0]={pressed:false,touched:false,value:0};__pad.buttons[2]={pressed:false,touched:false,value:0};});await page.clock.runFor(40);assert.equal(await page.evaluate(()=>__dash.player.isPressing),false);
 // New ranged enemies fire their own attacks through the shipped update loop.
 for(const type of ['FIRE_FLY','WIND_SPIRIT']){await page.evaluate(type=>{__dash.arrange(42,0,{invulFrame:100000},[{id:type,type,x:550,y:180,width:40,height:40,vy:0,speedMult:1,shootCooldown:1}]);__dash.step(2);},type);assert.equal(await page.evaluate(()=>__dash.enemyShots.length),1);}
 const rules=await page.evaluate(async()=>{
  const {routeAt,floorAt,OPENING_DISTANCE,ROUTE_LENGTH,DISTANCE_SCALE,routeTransition}=await import('/src/mini-games/go-home-dash/routes.ts');const signatures=new Set();let maxSlope=0;
  if(OPENING_DISTANCE/DISTANCE_SCALE!==3000||ROUTE_LENGTH/DISTANCE_SCALE!==3000)throw Error('Distance cadence');
  for(let i=0;i<7;i++){
   const boundary=OPENING_DISTANCE+i*ROUTE_LENGTH, a=routeTransition(42,boundary),b=routeTransition(42,boundary+300),c=routeTransition(42,boundary+600);
   if(a.mix!==0||b.mix!==.5||c.mix!==1||a.from===a.to)throw Error('Background transition');
  }
  for(let seed=0;seed<80;seed++){
    const ids=Array.from({length:12},(_,i)=>routeAt(seed,OPENING_DISTANCE+i*ROUTE_LENGTH+1200).id);
    if(new Set(ids.slice(0,6)).size!==6||ids.some((id,i)=>i&&id===ids[i-1]))throw Error('Route variety');signatures.add(ids.join(','));
    for(let x=0;x<OPENING_DISTANCE+6*ROUTE_LENGTH;x+=16){const y=floorAt(seed,x);if(y<220||y>340)throw Error('Ground out of bounds');maxSlope=Math.max(maxSlope,Math.abs(floorAt(seed,x+16)-y)/16);}
    for(let x=0;x<OPENING_DISTANCE;x+=91)if(floorAt(seed,x)!==340||routeAt(seed,x).flight)throw Error('Opening changed');
  }return {variations:signatures.size,maxSlope};
 });assert.ok(rules.variations>40);assert.ok(rules.maxSlope<.5);
 const routes=await page.evaluate(async()=>{const m=await import('/src/mini-games/go-home-dash/routes.ts');return Array.from({length:6},(_,i)=>({id:m.routeAt(42,m.OPENING_DISTANCE+i*m.ROUTE_LENGTH+1400).id,distance:m.OPENING_DISTANCE+i*m.ROUTE_LENGTH+1400-120}));});
 for(const r of routes){await page.evaluate(r=>{__dash.arrange(42,r.distance,{invulFrame:100001});__dash.step(20);
 const p=__dash.player;
 // Representative encounter with the actual new enemy/terrain renderer.
 __dash.obstacles.push({id:'preview',type:r.id==='canal'?'WATER_SLIME':r.id==='garden'?'SPRING':r.id==='clockwork'?'ELEVATOR':r.id==='storm'?'WIND_SPIRIT':'PAPER_WYVERN',x:480,y:r.id==='garden'?310:180,width:r.id==='clockwork'?170:50,height:30,vy:0,speedMult:1,phase:0,shootCooldown:90});__dash.step(1);},r);await page.screenshot({path:`${output}/route-${r.id}.png`});}
 const sky=routes.find(r=>r.id==='skyway');await page.evaluate(r=>{__dash.arrange(42,r.distance,{invulFrame:100001});__dash.step(1);},sky);
 assert.equal(await page.evaluate(()=>__dash.player.flying),true);const y0=await page.evaluate(()=>__dash.player.y);
 await page.keyboard.down('Space');await page.evaluate(()=>__dash.step(20));assert.ok(await page.evaluate(()=>__dash.player.y)<y0);const yHigh=await page.evaluate(()=>__dash.player.y);await page.keyboard.up('Space');await page.evaluate(()=>__dash.step(40));assert.ok(await page.evaluate(()=>__dash.player.y)>yHigh);
 await page.evaluate(async()=>{const {OPENING_DISTANCE,ROUTE_LENGTH}=await import('/src/mini-games/go-home-dash/routes.ts');__dash.arrange(42,OPENING_DISTANCE+ROUTE_LENGTH*6-700,{flying:true,y:120,invulFrame:100000});__dash.step(180);});
 assert.equal(await page.evaluate(()=>__dash.player.flying),false);assert.equal(await page.evaluate(()=>__dash.player.isFalling),false);
 await page.evaluate(()=>{__dash.arrange(42,0,{},[{id:'spring',type:'SPRING',x:120,y:333,width:70,height:15,vy:0,speedMult:1}]);__dash.step();});assert.ok(await page.evaluate(()=>__dash.player.vy)<-15);
 await page.evaluate(()=>{__dash.arrange(42,0,{y:255,vy:5,isJumping:true},[{id:'lift',type:'ELEVATOR',x:120,y:270,width:170,height:18,vy:0,speedMult:1,phase:0}]);__dash.step(3);});
 assert.ok(await page.evaluate(()=>Math.abs(__dash.player.y-(__dash.obstacles[0].y-9)))<5);
 // Tap flaps immediately; gate pairs collide outside the gap but permit its center.
 await page.evaluate(r=>{__dash.arrange(42,r.distance,{flying:true,y:220,vy:3,invulFrame:0});__dash.step(1);},sky);
 await page.keyboard.press('Space');assert.ok(await page.evaluate(()=>__dash.player.vy)<-4);
 const gateHP=await page.evaluate(()=>__dash.hp);
 await page.evaluate(()=>{__dash.obstacles.push({id:'gate-safe',type:'FLIGHT_GATE',x:125,y:175,width:72,height:340,vy:0,speedMult:1});__dash.step(1);});
 assert.equal(await page.evaluate(()=>__dash.hp),gateHP);
 await page.evaluate(()=>{__dash.obstacles.length=0;});
 await page.evaluate(r=>{__dash.arrange(42,r.distance,{flying:true,y:115,vy:0,invulFrame:0},[{id:'gate-hit',type:'FLIGHT_GATE',x:125,y:175,width:72,height:340,vy:0,speedMult:1}]);__dash.step(1);},sky);
 assert.equal(await page.evaluate(()=>__dash.hp),gateHP-1);
 await page.evaluate(r=>{__dash.arrange(42,r.distance,{flying:true,y:215,invulFrame:100000});__dash.step(1);},sky);
 assert.ok(await page.evaluate(()=>__dash.obstacles.some(o=>o.type==='FLIGHT_GATE')));
 const flightHP=await page.evaluate(()=>__dash.hp);
 await page.evaluate(r=>__dash.arrange(42,r.distance,{flying:true,y:215,vy:0,invulFrame:0,expMult:0}),sky);
 await page.evaluate(()=>__dash.fly(1300));assert.equal(await page.evaluate(()=>__dash.hp),flightHP);
 assert.equal(await page.evaluate(()=>__dash.state),'PLAYING');
 await page.screenshot({path:`${output}/flight-gates.png`});
 // A stair side is solid, pushes the runner back, and only damages on crushing.
 const stair={id:'stairs',type:'HIGH_STEPS',x:280,y:285,width:320,height:110,vy:0,speedMult:1};
 await page.evaluate(stair=>{__dash.arrange(42,0,{x:105,y:340,vy:0,invulFrame:0},[stair]);__dash.step(1);},stair);
 const stairHP=await page.evaluate(()=>__dash.hp);assert.ok(await page.evaluate(()=>__dash.player.x)<105);
 await page.evaluate(()=>__dash.step(18));assert.equal(await page.evaluate(()=>__dash.hp),stairHP-1);
 assert.equal(await page.evaluate(()=>__dash.state),'PLAYING');
 await page.screenshot({path:`${output}/solid-stairs.png`});
 // Landing from above remains safe on the visible stair tops.
 await page.evaluate(stair=>{__dash.arrange(42,0,{x:270,y:250,vy:5,isJumping:true,invulFrame:0},[stair]);__dash.step(3);},stair);
 assert.ok(await page.evaluate(()=>__dash.player.y)>260);assert.ok(await page.evaluate(()=>__dash.player.y)<270);assert.equal(await page.evaluate(()=>__dash.hp),stairHP-1);
 // Capture both background plates during an actual route transition.
 await page.evaluate(async()=>{const {OPENING_DISTANCE}=await import('/src/mini-games/go-home-dash/routes.ts');__dash.arrange(42,OPENING_DISTANCE+180,{invulFrame:100000});__dash.step(1);});
 await page.screenshot({path:`${output}/background-transition.png`});
 // Traverse every complete new route with actual random spawns. Invulnerability
 // isolates terrain/flight safety from the player's ability to dodge enemies.
 const traversed=await page.evaluate(async()=>{
  const {OPENING_DISTANCE,ROUTE_LENGTH}=await import('/src/mini-games/go-home-dash/routes.ts');let q=842;
  Math.random=()=>((q=(Math.imul(q,1664525)+1013904223)>>>0)/4294967296);
  const seen=new Set();for(let route=0;route<6;route++){
   __dash.arrange(42,OPENING_DISTANCE+route*ROUTE_LENGTH-120,{invulFrame:100000000,expMult:0});
   const result=__dash.simulate(Math.floor(ROUTE_LENGTH/4.5));for(const type of result.seen)seen.add(type);if(!Number.isFinite(result.player.y)||result.state!=='PLAYING')throw Error('Route traversal failure '+route);
  }return [...seen];
 });assert.ok(traversed.length>=5);
 // Jump shockwaves must preserve new terrain, including the pad we jump from.
 await page.evaluate(()=>__dash.arrange(42,0,{jumpBoom:true},[{id:'pad',type:'SPRING',x:160,y:333,width:70,height:15,vy:0,speedMult:1},{id:'lift',type:'ELEVATOR',x:200,y:280,width:170,height:18,vy:0,speedMult:1}]));await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>__dash.obstacles.length),2);
 // Real two-finger input: hold jump while pressing and releasing dash.
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{__dash.arrange(42,0);__dash.step();});
 const cdp=await context.newCDPSession(page);const center=async selector=>{const r=await page.locator(selector).boundingBox();return {x:r.x+r.width/2,y:r.y+r.height/2};};
 const j={...await center('.dash-jump'),id:1},d={...await center('.dash-boost'),id:2};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[j]});assert.equal(await page.evaluate(()=>__dash.player.isPressing),true);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[j,d]});assert.ok(await page.evaluate(()=>__dash.player.dashFrames)>0);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[d]});assert.equal(await page.evaluate(()=>__dash.player.isPressing),true);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await page.evaluate(()=>__dash.player.isPressing),false);
 assert.equal(await page.evaluate(()=>__dash.player.jumpCount),1);
 await page.screenshot({path:`${output}/touch-portrait.png`});
 // Focus loss, learning overlay and upgrades clear held inputs.
 await page.keyboard.down('Space');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await page.evaluate(()=>__dash.player.isPressing),false);await page.keyboard.up('Space');
 assert.equal(await page.evaluate(()=>__dash.paused),true);await page.evaluate(()=>__dash.pause());
 await page.evaluate(()=>__dash.challenge());assert.equal(await page.evaluate(()=>__dash.state),'CHALLENGE');assert.equal(await page.evaluate(()=>__dash.player.isPressing),false);
 await page.evaluate(()=>__dash.completeChallenge());await page.locator('[data-gamepad-zone="go-home-upgrades"]').first().click();assert.equal(await page.evaluate(()=>__dash.state),'PLAYING');
 // Score persists once; restart and hero selection remain available.
 const savedBefore=await page.evaluate(async()=> (await import('/src/services/storageService.ts')).storageService.getGoHomeScores().length);
 const previousSeed=await page.evaluate(()=>__dash.seed);
 await page.evaluate(()=>{__dash.damage();__dash.damage();__dash.damage();__dash.damage();__dash.damage();});assert.equal(await page.evaluate(()=>__dash.state),'GAME_OVER');await page.clock.runFor(1);
 assert.equal(await page.evaluate(async()=> (await import('/src/services/storageService.ts')).storageService.getGoHomeScores().length),savedBefore+1);
 await page.getByRole('button',{name:'TRY AGAIN'}).click();assert.notEqual(await page.evaluate(()=>__dash.seed),previousSeed);assert.equal(await page.evaluate(()=>__dash.hp),3);
 await page.evaluate(()=>__dash.returnToTitle());await page.getByRole('button',{name:'主人公を選ぶ'}).click();await page.getByRole('button',{name:'START DASH'}).click();await page.evaluate(()=>{__dash.damage();__dash.damage();__dash.damage();});

 await page.getByRole('button',{name:'主人公を選び直す'}).click();await page.locator('.dash-lobby').waitFor();
 await page.screenshot({path:`${output}/title-portrait.png`});

 // Arcade modules use real runtime state, input and collision paths.
 await page.setViewportSize({width:1280,height:800});
 await page.goto(base+'?unlocked');await page.locator('.dash-lobby').waitFor();
 await page.getByRole('button',{name:'主人公を選ぶ'}).click();await page.getByRole('button',{name:'START DASH'}).click();await page.waitForFunction(()=>__dash?.state==='PLAYING');
 const arcadeRules=await page.evaluate(async()=>{
  const m=await import('/src/mini-games/go-home-dash/arcade.ts');
  for(const pattern of m.PATTERNS){const s=m.createArcade(42);m.spawnPattern(s,pattern,700);if(!s.entities.length&&!s.boss)throw Error('Empty pattern '+pattern);}
  const a=m.createArcade(55),b=m.createArcade(55);
  for(let d=0;d<180000;d+=90){m.beginArcade(a,d,false);m.beginArcade(b,d,false);if(a.entities.length>100)throw Error('Unbounded entity count');}
  if(JSON.stringify(a.entities)!==JSON.stringify(b.entities))throw Error('Seeded pattern mismatch');
  const s=m.createArcade(1);for(let i=0;i<50;i++)m.reward(s,10,2);
  if(s.fever!==480||m.multiplier(s)<4)throw Error('Fever/multiplier failure');
  s.fever=0;s.comboTime=1;m.beginArcade(s,0,false);if(s.combo!==0)throw Error('Combo expiry');
  return {patterns:m.PATTERNS.length,boundedEntities:a.entities.length};
 });assert.equal(arcadeRules.patterns,16);
 const reset=async(overrides={})=>page.evaluate(o=>{__dash.arrange(42,0,{invulFrame:0,isPressing:false,expMult:0,...o});},overrides);
 const pickup=async(kind,lift=30,offset=0)=>page.evaluate(async({kind,lift,offset})=>{const m=await import('/src/mini-games/go-home-dash/arcade.ts');m.addEntity(__dash.arcade,kind,__dash.distance+120+offset,lift);__dash.step(1);},{kind,lift,offset});
 await reset();await pickup('coin');assert.equal(await page.evaluate(()=>__dash.arcade.stats.coins),1);
 await pickup('magnet');await pickup('coin',30,150);await page.evaluate(()=>__dash.step(15));assert.ok(await page.evaluate(()=>__dash.arcade.stats.coins)>=2);
 for(const kind of ['shield','board']){await reset();await pickup(kind);const hp=await page.evaluate(()=>__dash.hp);await page.evaluate(()=>__dash.damage());assert.equal(await page.evaluate(()=>__dash.hp),hp);assert.equal(await page.evaluate(kind=>__dash.arcade[kind],kind),0);}
 await reset();await pickup('double');assert.ok(await page.evaluate(async()=> (await import('/src/mini-games/go-home-dash/arcade.ts')).multiplier(__dash.arcade))>=2);
 await pickup('sneakers');await page.keyboard.down('Space');assert.ok(await page.evaluate(()=>__dash.player.vy)<-17);await page.keyboard.up('Space');
 await reset();await pickup('boost',0);assert.equal(await page.evaluate(()=>__dash.arcade.boost),300);const beforeBoost=await page.evaluate(()=>__dash.distance);await page.evaluate(()=>__dash.step(10));assert.ok(await page.evaluate(()=>__dash.distance)-beforeBoost>50);
 await reset();await page.keyboard.down('Space');await page.evaluate(()=>__dash.step(20));const normalHeight=await page.evaluate(()=>__dash.player.y);await page.keyboard.up('Space');
 await reset();await pickup('lowGravity');await page.keyboard.down('Space');await page.evaluate(()=>__dash.step(20));assert.ok(await page.evaluate(()=>__dash.player.y)<normalHeight-25);await page.keyboard.up('Space');
 await reset({y:245,isJumping:true,jumpCount:1,vy:2});await page.evaluate(async()=>{const m=await import('/src/mini-games/go-home-dash/arcade.ts');m.addEntity(__dash.arcade,'orb',120,125);});
 await page.keyboard.press('Space');assert.ok(await page.evaluate(()=>__dash.player.vy)<-16);assert.equal(await page.evaluate(()=>__dash.arcade.stats.perfects),1);
 await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>__dash.arcade.stats.perfects),1);
 await reset();await page.evaluate(async()=>{const m=await import('/src/mini-games/go-home-dash/arcade.ts');m.addEntity(__dash.arcade,'pad',120,0,64,12);__dash.step();});assert.ok(await page.evaluate(()=>__dash.player.vy)<-16);assert.equal(await page.evaluate(()=>__dash.arcade.stats.perfects),0);
 await reset();await page.evaluate(async()=>{const m=await import('/src/mini-games/go-home-dash/arcade.ts');m.addEntity(__dash.arcade,'pad',120,0,64,12);});await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>__dash.arcade.stats.perfects),1);
 // Standing hits the tunnel, sliding changes both pose and hurt box.
 await reset();const tunnelHP=await page.evaluate(()=>__dash.hp);
 await page.evaluate(async()=>{const m=await import('/src/mini-games/go-home-dash/arcade.ts');m.addEntity(__dash.arcade,'tunnel',120,90,180,54);__dash.step();});assert.equal(await page.evaluate(()=>__dash.hp),tunnelHP-1);
 await reset();await page.keyboard.press('s');assert.ok(await page.evaluate(()=>__dash.arcade.slide)>0);
 await page.evaluate(async()=>{const m=await import('/src/mini-games/go-home-dash/arcade.ts');m.addEntity(__dash.arcade,'tunnel',120,90,180,54);__dash.step();});assert.equal(await page.evaluate(()=>__dash.hp),tunnelHP-1);
 await page.screenshot({path:`${output}/arcade-slide.png`});
 // Controller B maps to slide without leaving the game.
 await reset();await page.evaluate(()=>__pad.buttons[1]={pressed:true,touched:true,value:1});await page.clock.runFor(40);assert.ok(await page.evaluate(()=>__dash.arcade.slide)>0);
 await page.evaluate(()=>__pad.buttons[1]={pressed:false,touched:false,value:0});await page.clock.runFor(40);assert.equal(await page.evaluate(()=>__dash.state),'PLAYING');
 await reset();await page.keyboard.press('Shift');await page.evaluate(async()=>{const m=await import('/src/mini-games/go-home-dash/arcade.ts');m.addEntity(__dash.arcade,'wall',120,100,72,100);__dash.step();});assert.equal(await page.evaluate(()=>__dash.arcade.stats.breaks),1);
 await reset({y:220,isJumping:true});await page.keyboard.press('s');assert.ok(await page.evaluate(()=>__dash.player.vy)>=12);
 for(const vehicle of ['gravity','wave','rocket']){
  await reset();await pickup(vehicle);await page.evaluate(()=>__dash.step(2));assert.equal(await page.evaluate(()=>__dash.arcade.vehicle),vehicle);assert.equal(await page.evaluate(()=>__dash.player.flying),true);
  if(vehicle==='gravity'){await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>__dash.arcade.gravity),-1);await page.evaluate(()=>__dash.step(35));assert.ok(await page.evaluate(()=>__dash.player.y)<180);}
  else {await page.keyboard.down('Space');await page.evaluate(()=>__dash.step(20));const high=await page.evaluate(()=>__dash.player.y);await page.keyboard.up('Space');await page.evaluate(()=>__dash.step(40));assert.ok(await page.evaluate(()=>__dash.player.y)>high);}
  await page.screenshot({path:`${output}/arcade-${vehicle}.png`});
  await page.evaluate(()=>{__dash.arcade.vehicleTime=1;__dash.step();});assert.equal(await page.evaluate(()=>__dash.arcade.vehicle),'normal');assert.ok(await page.evaluate(()=>__dash.player.invulFrame)>=45);
 }
 // A ground laser has a warning interval; slide clears its active beam.
 await reset();await page.evaluate(async()=>{const m=await import('/src/mini-games/go-home-dash/arcade.ts');const s=__dash.arcade;m.addEntity(s,'laser',120,55,180,14);__dash.step();});const laserHP=await page.evaluate(()=>__dash.hp);
 await page.evaluate(()=>{__dash.arcade.frame=100;__dash.step();});assert.equal(await page.evaluate(()=>__dash.hp),laserHP-1);
 await page.evaluate(()=>__dash.init());await reset();await page.keyboard.press('s');await page.evaluate(async()=>{const m=await import('/src/mini-games/go-home-dash/arcade.ts');const s=__dash.arcade;m.addEntity(s,'laser',120,55,180,14);s.frame=100;__dash.step();});assert.equal(await page.evaluate(()=>__dash.hp),3);
 // An upper one-way rail supports a safe landing and optional star route.
 await reset({y:230,vy:7,isJumping:true});await page.evaluate(async()=>{const m=await import('/src/mini-games/go-home-dash/arcade.ts');m.addEntity(__dash.arcade,'rail',220,105,460,12);__dash.step();});assert.equal(await page.evaluate(()=>__dash.player.y),235);
 // Boss attacks and three real dash presses defeat it; charge pickups reset cooldown.
 await reset();await page.evaluate(async()=>{const m=await import('/src/mini-games/go-home-dash/arcade.ts');m.spawnPattern(__dash.arcade,'bossRush',700);__dash.step(95);});assert.ok(await page.evaluate(()=>__dash.arcade.entities.some(e=>e.kind==='missile')));
 await page.screenshot({path:`${output}/arcade-boss.png`});
 for(let i=0;i<3;i++){await pickup('charge');await page.keyboard.press('Shift');}assert.equal(await page.evaluate(()=>__dash.arcade.boss),null);assert.equal(await page.evaluate(()=>__dash.arcade.stats.bosses),1);
 // Mission rewards fire once; Fever protects without dropping the combo.
 await reset();await page.evaluate(async()=>{const m=await import('/src/mini-games/go-home-dash/arcade.ts');const s=__dash.arcade;for(let i=0;i<25;i++)m.addEntity(s,'coin',120,30);__dash.step();});assert.equal(await page.evaluate(()=>__dash.arcade.stats.missions),1);
 await page.evaluate(()=>__dash.step(5));assert.equal(await page.evaluate(()=>__dash.arcade.stats.missions),1);
 await page.evaluate(()=>{__dash.arcade.fever=120;__dash.arcade.combo=35;__dash.damage();});assert.equal(await page.evaluate(()=>__dash.arcade.combo),35);
 await page.evaluate(()=>__dash.step(10));await page.screenshot({path:`${output}/arcade-fever.png`});
 // Pause freezes world travel and both power-up timers and controller holds.
 await page.keyboard.press('p');const pauseDistance=await page.evaluate(()=>__dash.distance),pauseFever=await page.evaluate(()=>__dash.arcade.fever);
 await page.evaluate(()=>__dash.step(60));assert.equal(await page.evaluate(()=>__dash.distance),pauseDistance);assert.equal(await page.evaluate(()=>__dash.arcade.fever),pauseFever);
 await page.getByRole('button',{name:'走り続ける'}).click();assert.equal(await page.evaluate(()=>__dash.paused),false);
 // All additional touch actions remain available on portrait screens.
 await page.setViewportSize({width:390,height:844});await reset();const slideButton=await center('.dash-slide');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...slideButton,id:3}]});assert.ok(await page.evaluate(()=>__dash.arcade.slide)>0);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.screenshot({path:`${output}/arcade-portrait.png`});
 // Exercise the real director across its full introduction without random legacy interference.
 await page.evaluate(()=>{__dash.init();__dash.arrange(42,0,{invulFrame:1000000,expMult:0});__dash.arcade.chunk=-1;Math.random=()=>.999;});
 const tour=await page.evaluate(()=>__dash.sweep(7600));assert.equal(tour.state,'PLAYING');assert.ok(tour.max<100);
 for(const kind of ['coin','star','orb','tunnel','wall','saw','lowGravity','gravity','wave','rocket','laser','missile','rail','pad','boost'])assert.ok(tour.seen.includes(kind),'Director missed '+kind);
 // Earned collection progress is banked once on a normal result.
 await page.evaluate(()=>__dash.init());await reset();await pickup('coin');await pickup('star');
 const careerBefore=await page.evaluate(()=>JSON.parse(localStorage.getItem('home-dash-arcade-v1')||'{"coins":0,"stars":0,"runs":0}'));
 await page.evaluate(()=>{for(let i=0;i<6;i++)__dash.damage();});await page.clock.runFor(1);
 const careerAfter=await page.evaluate(()=>JSON.parse(localStorage.getItem('home-dash-arcade-v1')));
 assert.equal(careerAfter.coins,careerBefore.coins+1);assert.equal(careerAfter.stars,careerBefore.stars+1);assert.equal(careerAfter.runs,careerBefore.runs+1);
 // Daily restarts keep the course seed; practice restarts at the last checkpoint.
 await page.evaluate(()=>{__dash.setMode('daily');__dash.init();});const daily=await page.evaluate(()=>__dash.seed);await page.evaluate(()=>__dash.init());assert.equal(await page.evaluate(()=>__dash.seed),daily);
 const profileBefore=await page.evaluate(()=>localStorage.getItem('home-dash-arcade-v1'));
 const rankingBeforePractice=await page.evaluate(async()=> (await import('/src/services/storageService.ts')).storageService.getGoHomeScores().length);
 await page.evaluate(()=>{__dash.setMode('practice');__dash.init();__dash.arrange(42,30005);__dash.step();__dash.damage();__dash.damage();__dash.damage();});await page.clock.runFor(1);
 assert.equal(await page.evaluate(()=>__dash.state),'GAME_OVER');assert.equal(await page.evaluate(()=>localStorage.getItem('home-dash-arcade-v1')),profileBefore);
 assert.equal(await page.evaluate(async()=> (await import('/src/services/storageService.ts')).storageService.getGoHomeScores().length),rankingBeforePractice);
 await page.getByRole('button',{name:'TRY AGAIN'}).click();assert.equal(await page.evaluate(()=>__dash.distance),30000);assert.equal(await page.evaluate(()=>__dash.seed),42);
 await page.setViewportSize({width:844,height:390});await page.screenshot({path:`${output}/arcade-landscape.png`});
 // Desktop flex sizing must fill the available stage without distorting the world.
 await page.evaluate(()=>{__dash.init();__dash.arrange(42,0);});
 for(const viewport of [{width:1280,height:720},{width:1920,height:1080},{width:1440,height:900},{width:2560,height:1080},{width:1024,height:460}]){
  await page.setViewportSize(viewport);await page.clock.runFor(80);
  const layout=await page.evaluate(()=>{const stage=document.querySelector('.dash-stage').getBoundingClientRect(),c=document.querySelector('.dash-overview'),r=c.getBoundingClientRect();return {stage:{width:stage.width,height:stage.height},canvas:{width:r.width,height:r.height},backing:{width:c.width,height:c.height},view:__dash.viewport,overflow:document.documentElement.scrollWidth>innerWidth};});
  assert.ok(Math.abs(layout.canvas.width-viewport.width)<2,JSON.stringify(layout));
  assert.ok(Math.abs(layout.canvas.height-layout.stage.height)<2,JSON.stringify(layout));
  assert.ok(layout.canvas.height>=viewport.height-182,JSON.stringify(layout));
  assert.ok(Math.abs(layout.backing.width/layout.view.width-layout.backing.height/layout.view.height)<.01);
  assert.equal(layout.overflow,false);await page.evaluate(()=>__dash.step());
  await page.screenshot({path:`${output}/flex-${viewport.width}x${viewport.height}.png`});
 }
 // Every protagonist must load and actually render their own two-frame slide.
 await page.setViewportSize({width:1280,height:720});await page.clock.runFor(80);
 const heroIds=await page.evaluate(async()=>Object.keys((await import('/src/mini-games/go-home-dash/heroes.ts')).DASH_HERO_ART));
 for(const id of heroIds){
  await page.evaluate(id=>__dash.setHero(id),id);await page.clock.runFor(1);
  await page.waitForFunction(id=>__dash.slideImage?.endsWith('/'+id+'.webp'),id);
  await page.evaluate(async id=>{const image=new Image();image.src='/sprites/go-home-dash/slides/'+id+'.webp';await image.decode();if(image.naturalWidth!==320||image.naturalHeight!==80)throw Error('Invalid slide '+id);},id);
  const drawn=await page.evaluate(()=>{__dash.arrange(42,0);__dash.arcade.slide=20;const original=CanvasRenderingContext2D.prototype.drawImage,seen=[];CanvasRenderingContext2D.prototype.drawImage=function(...args){if(args[0] instanceof HTMLImageElement&&args[0].src.includes('/slides/'))seen.push(args[0].src);return original.apply(this,args);};try{__dash.step();}finally{CanvasRenderingContext2D.prototype.drawImage=original;}return seen;});
  assert.ok(drawn.some(src=>src.endsWith('/'+id+'.webp')),'Missing slide drawing '+id);
 }
 await page.screenshot({path:`${output}/slide-generated.png`});
 await page.setViewportSize({width:390,height:844});await page.clock.runFor(80);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:`${output}/art-mobile.png`});
 console.log('Visual QA: 5 desktop sizes, mobile overflow, and all 26 protagonist slide render paths passed.');
 console.log('Arcade: collection, timers, combo/Fever, orbs, slide/dive, hazards, vehicles, rail, boss, missions, input, pause, daily seed and practice persistence passed.',arcadeRules);
 await page.goto(base+'?unlocked&lang=ENGLISH&compact');await page.locator('.dash-lobby').waitFor();
 assert.ok(!(await page.locator('.dash-lobby').innerText()).match(/[\u3040-\u30ff\u4e00-\u9fff]/));
 await page.getByRole('button',{name:'How to play · Action guide'}).click();
 assert.ok(!(await page.getByRole('dialog').innerText()).match(/[\u3040-\u30ff\u4e00-\u9fff]/));
 await page.keyboard.press('Tab');assert.ok(await page.getByRole('dialog').evaluate(el=>el.contains(document.activeElement)));
 await page.keyboard.press('Escape');await page.locator('.dash-title-screen').waitFor();assert.equal(await page.evaluate(()=>__dash.state),'START');
 console.log('Onboarding: first-play gate, 16 screenshots, responsive dialog, zoom, saved dismissal and English replay passed.');
 await page.setViewportSize({width:844,height:390});await page.screenshot({path:`${output}/title-landscape.png`});
 assert.deepEqual(errors,[]);console.log('Home Dash: story unlocks, route fairness/variety, jumping, dash, flight, spring/lift, two-finger touch, focus loss, learning/retry and responsive UI passed.',rules);
}finally{await browser?.close();await server?.close();}
