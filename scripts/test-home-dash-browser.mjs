import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createServer } from 'vite';
import { chromium } from 'playwright';
const output='tmp/home-dash-qa';await fs.mkdir(output,{recursive:true});
let server,browser;
try{
 server=await createServer({logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{
  name:'home-dash-qa',enforce:'pre',
  transform(code,id){if(!id.endsWith('/src/components/GoHomeDash.tsx'))return;return code.replace('    const getSubjectIcon =',`    Object.assign(window, {__dash: {
      get routeArt(){return routeArtRef.current;}, get player(){return {...playerRef.current};}, get state(){return gameStateRef.current;}, get hero(){return heroRef.current;}, get seed(){return routeSeedRef.current;}, get distance(){return distanceRef.current;}, get hp(){return hpRef.current;}, get obstacles(){return obstaclesRef.current;}, get frame(){return frameCount.current;}, get enemyShots(){return enemyProjectilesRef.current;},
      step(n=1){flushSync(()=>{for(let i=0;i<n;i++)updateLogic();});const c=canvasRef.current?.getContext('2d');if(c)draw(c);},
      arrange(seed,distance,overrides={},obs=[]){flushSync(()=>{routeSeedRef.current=seed;distanceRef.current=distance;expRef.current=0;obstaclesRef.current=obs;enemyProjectilesRef.current=[];projectilesRef.current=[];playerRef.current={...playerRef.current,x:120,y:floorAt(seed,distance+120),vy:0,isJumping:false,isFalling:false,jumpCount:0,flying:false,invulFrame:0,dashFrames:0,dashCooldown:0,...overrides};setRoute(routeAt(seed,distance+120).id);setFlight(false);setDashReady(true);gameStateRef.current='PLAYING';setGameState('PLAYING');});},
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
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));
 const base=`http://127.0.0.1:${server.httpServer.address().port}/dash-test`;
 await page.goto(base);await page.locator('.dash-lobby').waitFor();
 await page.getByRole('button',{name:'主人公を選ぶ'}).click();assert.equal(await page.locator('.dash-hero:not(:disabled)').count(),2);
 await page.getByRole('tab',{name:'マジック編'}).click();assert.equal(await page.locator('.dash-hero:not(:disabled)').count(),4);
 await page.goto(base+'?unlocked');await page.locator('.dash-lobby').waitFor();
 await page.evaluate(async()=>{const {DASH_HERO_ART}=await import('/src/mini-games/go-home-dash/heroes.ts');await Promise.all(Object.keys(DASH_HERO_ART).map(async id=>{const image=new Image();image.src='/sprites/go-home-dash/heroes/'+id+'.webp';await image.decode();if(image.naturalWidth!==512||image.naturalHeight!==320)throw Error('Bad hero atlas '+id);}));});
 await page.screenshot({path:`${output}/title-desktop.png`});
 await page.getByRole('button',{name:'主人公を選ぶ'}).click();assert.equal(await page.locator('.dash-hero:not(:disabled)').count(),9);
 await page.getByRole('tab',{name:'マジック編'}).click();assert.equal(await page.locator('.dash-hero:not(:disabled)').count(),17);
 await page.locator('[data-hero="magic-akari"]').click();await page.getByRole('button',{name:'START DASH'}).click();
 await page.waitForFunction(()=>window.__dash?.hero==='magic-akari');
 await page.waitForFunction(()=>window.__dash?.routeArt.school?.naturalWidth===1280);
 await page.clock.install({time:new Date('2026-10-21T00:00:00Z')});await page.clock.pauseAt(new Date('2026-10-21T00:00:01Z'));
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
 await page.keyboard.press('Shift');assert.ok(await page.evaluate(()=>__dash.player.dashFrames>=89));
 await page.evaluate(()=>__dash.step(60));assert.ok(await page.evaluate(()=>__dash.player.dashFrames>0));assert.ok(await page.evaluate(()=>__dash.player.invulFrame>0));
 await page.evaluate(()=>__dash.step(250));assert.equal(await page.evaluate(()=>__dash.player.dashCooldown),0);
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
 await page.evaluate(()=>__dash.challenge());assert.equal(await page.evaluate(()=>__dash.state),'CHALLENGE');assert.equal(await page.evaluate(()=>__dash.player.isPressing),false);
 await page.evaluate(()=>__dash.completeChallenge());await page.locator('[data-gamepad-zone="go-home-upgrades"]').first().click();assert.equal(await page.evaluate(()=>__dash.state),'PLAYING');
 // Score persists once; restart and hero selection remain available.
 const savedBefore=await page.evaluate(async()=> (await import('/src/services/storageService.ts')).storageService.getGoHomeScores().length);
 const previousSeed=await page.evaluate(()=>__dash.seed);
 await page.evaluate(()=>{__dash.damage();__dash.damage();__dash.damage();__dash.damage();__dash.damage();});assert.equal(await page.evaluate(()=>__dash.state),'GAME_OVER');await page.clock.runFor(1);
 assert.equal(await page.evaluate(async()=> (await import('/src/services/storageService.ts')).storageService.getGoHomeScores().length),savedBefore+1);
 await page.getByRole('button',{name:'TRY AGAIN'}).click();assert.notEqual(await page.evaluate(()=>__dash.seed),previousSeed);assert.equal(await page.evaluate(()=>__dash.hp),3);
 await page.evaluate(()=>__dash.returnToTitle());await page.getByRole('button',{name:'START DASH'}).click();await page.evaluate(()=>{__dash.damage();__dash.damage();__dash.damage();});

 await page.getByRole('button',{name:'主人公を選び直す'}).click();await page.locator('.dash-lobby').waitFor();
 await page.screenshot({path:`${output}/title-portrait.png`});
 await page.goto(base+'?unlocked&lang=ENGLISH&compact');await page.locator('.dash-lobby').waitFor();
 assert.ok(!(await page.locator('.dash-lobby').innerText()).match(/[\u3040-\u30ff\u4e00-\u9fff]/));
 await page.setViewportSize({width:844,height:390});await page.screenshot({path:`${output}/title-landscape.png`});
 assert.deepEqual(errors,[]);console.log('Home Dash: story unlocks, route fairness/variety, jumping, dash, flight, spring/lift, two-finger touch, focus loss, learning/retry and responsive UI passed.',rules);
}finally{await browser?.close();await server?.close();}
