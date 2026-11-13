import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';

const output=process.env.ACADEMY_QA_OUTPUT||'tmp/academy-sports-qa';
const only=process.argv.find(v=>v.startsWith('--sport='))?.slice(8),recoveryOnly=process.argv.includes('--recovery-only'),hubOnly=process.argv.includes('--hub-only'),scenesOnly=process.argv.includes('--scenes-only');
await fs.mkdir(output,{recursive:true});
let server,browser;
const reports=[];
try {
 server=await createServer({
  configFile:false,cacheDir:'node_modules/.vite-academy-'+(hubOnly?'hub':scenesOnly?'scenes':recoveryOnly?'recovery':'sports'),
  optimizeDeps:{noDiscovery:true,include:['react','react-dom','react-dom/client','react/jsx-runtime','react/jsx-dev-runtime','lucide-react','three','peerjs']},
  logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false,watch:null},
  plugins:[{name:'academy-qa',enforce:'pre',transform(code,id){
   // Test-only access to real simulation and real input. No production debug globals.
   if(id.endsWith('/academy-sports/Scene.tsx'))return code.replace('const tick=(at:number)=>{if(dead)return;const v=', 'let renderedAt=0;const tick=(at:number)=>{if(dead)return;if(at-renderedAt<80){frame=requestAnimationFrame(tick);return;}renderedAt=at;const v=');
   if(!id.endsWith('/academy-sports/AcademySports.tsx'))return;
   const anchor=' const selected=match.players';assert(code.includes(anchor));
   return code.replace('if(active()&&!state.current.tactics&&!state.current.online){accumulator','if(active()&&!state.current.tactics&&!state.current.online&&!(window as any).__academyFreeze){accumulator')
    .replace(anchor,` Object.assign(window,{__academy:{chooseLesson:s=>{setSelection(s);setPicker(false);void start(s);},get match(){return state.current.match;},get input(){return input.current;},get quiz(){return state.current.quiz;},step(n=1){for(let i=0;i<n;i++){const k=keys.current;input.current.x=stick.current.x||Number(k.has('arrowright')||k.has('d'))-Number(k.has('arrowleft')||k.has('a'));input.current.z=stick.current.z||Number(k.has('arrowdown')||k.has('s'))-Number(k.has('arrowup')||k.has('w'));input.current.aimX=input.current.x;input.current.aimZ=input.current.z;input.current.dash=k.has(' ')||input.current.dash;input.current=screenToWorld(state.current.match,input.current,window.innerWidth>=window.innerHeight);stepMatch(state.current.match,input.current,1/60);}refresh(v=>v+1);},act:(a)=>action.current(a),sound:(kind)=>audioService.playAcademySportsSound(state.current.match.sport,kind),get status(){return state.current.status;}}});\n${anchor}`);
  },configureServer(s){s.middlewares.use('/academy-test',async(_req,res)=>{
   res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml('/academy-test','<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><div id="root"></div><script type="module" src="/scripts/fixtures/academy-sports.tsx"></script>'));
  });}}]
 });
 await server.listen();
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader-webgl']});
 const page=await browser.newPage({viewport:{width:1024,height:640},hasTouch:true}),errors=[],missing=[],audio=[];
 await page.addInitScript(()=>{
  window.__academyFreeze=true;
  window.__testPad={connected:false,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0,touched:false})),id:'Academy QA standard controller',index:0,timestamp:0};
  Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>window.__testPad.connected?[window.__testPad]:[]});
 });
 page.setDefaultTimeout(120000);
 page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
 page.on('response',r=>{
  if(r.status()>=400&&r.url().includes('/academy-sports/'))missing.push(r.url());
  if(r.status()>=200&&r.status()<300&&/\/(?:web-audio\/)?sfx\/academy-sports\//.test(r.url()))audio.push(r.url());
 });
 const base='http://127.0.0.1:'+server.httpServer.address().port+'/academy-test';
 const ready=()=>page.waitForFunction(()=>window.__academy?.status.ready||window.__academy?.status.failed);
 const snap=name=>page.screenshot({path:output+'/'+name+'.png'});


 const recovery=async()=>{
   const id=await page.evaluate(()=>__academy.match.id);
   await page.locator('.ac-canvas').evaluate(canvas=>{window.__contextRestored=false;canvas.addEventListener('webglcontextrestored',()=>window.__contextRestored=true,{once:true});const ext=canvas.getContext('webgl2').getExtension('WEBGL_lose_context');ext.loseContext();window.setTimeout(()=>ext.restoreContext(),200);});
   await page.waitForFunction(()=>window.__contextRestored&&__academy.status.ready&&!__academy.status.failed&&!document.querySelector('.ac-canvas').getContext('webgl2').isContextLost());
   assert.equal(await page.evaluate(()=>__academy.match.id),id,'Context recovery preserves match');await snap('soccer-recovered');
   console.log('PASS real WebGL context loss/recovery preserves match');
 };
 for(const sport of (hubOnly?[]:scenesOnly?['festival']:recoveryOnly?['soccer']:['baseball','soccer','volleyball','festival']).filter(s=>!only||s===only)){
  await page.setViewportSize({width:1024,height:640});await page.goto(base+'?debug=1&sport='+sport,{waitUntil:'domcontentloaded',timeout:120000});
  await page.locator('.ac-launch-choices [data-intent=match]').click();await ready();assert.equal(await page.evaluate(()=>__academy.status.failed),false,sport+' assets');
  const metrics=await page.evaluate(()=>__academy.status);console.log(sport,'ready',metrics);await snap(sport+'-setup');
  if(recoveryOnly){await recovery();reports.push({sport,metrics,passed:['WebGL context recovery']});continue;}
  if(scenesOnly){
   await page.getByRole('tab',{name:'観戦',exact:true}).click();await page.locator('.ac-setup-panel>nav>button').nth(3).click();await page.getByRole('button',{name:'観戦を始める',exact:true}).click();
   for(let contest=0;contest<=4;contest++){
    await page.evaluate(async index=>{const{startContest,groundHeight}=await import('/src/mini-games/academy-sports/festival.ts'),s=__academy.match;
     if(index===4){s.score=[220,180,160,120];(await import('/src/mini-games/academy-sports/core.ts')).finish(s);}
     else{startContest(s,index);s.phase='play';if(index<2)for(const p of s.players){p.p.z=index===0?-115:-35;p.p.y=groundHeight(s,p.p.x,p.p.z);}}
     __academy.step(0);
    },contest);
    const venue=['festival-campus','festival-rooms','festival-target','festival-roof','festival-awards'][contest];
    await page.waitForFunction(venue=>document.querySelector('.ac-canvas').dataset.venue===venue&&__academy.status.ready,venue);await page.waitForTimeout(1000);await snap(venue+'-review');
   }
   await page.evaluate(()=>__academy.sound('cheer'));reports.push({sport,metrics,passed:['all five festival venues, bridge/steps and four event surfaces']});console.log('PASS all five festival venues and surface review');continue;
  }

  await page.getByRole('tab',{name:'観戦',exact:true}).click();
  await page.locator('.ac-setup-panel>nav>button').nth(3).click();
  await page.getByRole('button',{name:'観戦を始める',exact:true}).click();await page.waitForFunction(()=>__academy.match.config.mode==='watch');
  await page.evaluate(()=>__academy.step(240));await snap(sport+'-play');
  for(const [width,height] of [[390,844],[844,390],[320,568]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(180);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,sport+' overflow');await snap(sport+'-'+width);
  }
  await page.setViewportSize({width:1024,height:640});
  for(let i=0;i<100&&!(await page.evaluate(()=>__academy.match.phase==='finished'));i++)await page.evaluate(()=>__academy.step(2400));
  assert.equal(await page.evaluate(()=>__academy.match.phase),'finished',sport+' completes CPU match');await page.locator('.ac-results').waitFor();await snap(sport+'-result');
  await page.waitForFunction(async()=>{const{readRecords}=await import('/src/mini-games/academy-sports/records.ts');return readRecords().some(r=>r.id===__academy.match.id);});
  console.log(sport,'CPU result and persisted record passed');
  await page.getByRole('button',{name:'設定へ',exact:true}).click();await page.locator('.ac-setup-panel').waitFor();
  await page.getByRole('tab',{name:'対戦',exact:true}).click();
  await page.locator('.ac-setup-panel>nav>button').nth(3).click();
  const earned=await page.evaluate(async()=>(await import('/src/point-exchange/store.ts')).readPoints().earned);
  await page.getByRole('button',{name:'学習して試合へ',exact:true}).click();await page.locator('[data-online-lesson]').waitFor();await page.evaluate(()=>__academy.chooseLesson({mode:'ADDITION'}));
  for(let q=0;q<3;q++){
   await page.waitForFunction(q=>__academy.quiz?.index===q&&__academy.quiz.selected===null,q);
   const correct=await page.evaluate(()=>__academy.quiz.lesson.questions[__academy.quiz.index].correct);await page.locator('.gg-options button').nth(correct).click();
  }
  await page.waitForFunction(()=>__academy.quiz===null);
  await page.waitForFunction(async n=>(await import('/src/point-exchange/store.ts')).readPoints().earned===n,earned+3);
  await page.evaluate(()=>__academy.step(100));if(sport==='soccer')await page.keyboard.press('z');if(sport==='baseball')await page.evaluate(()=>__academy.step(90));
  console.log(sport,'learning receipt and points passed');
  const position=()=>page.evaluate(()=>{const s=__academy.match;return s.sport==='baseball'?s.aim.x:s.sport==='soccer'&&innerWidth>=innerHeight?-s.players.find(p=>p.id===s.selected).p.z:s.players.find(p=>p.id===s.selected).p.x;});
  const before=await position();await page.keyboard.down('ArrowRight');await page.evaluate(()=>__academy.step(10));await page.keyboard.up('ArrowRight');assert((await position())>before,sport+' keyboard moves the athlete/aim');
  await page.evaluate(()=>{__testPad.connected=true;__testPad.axes[0]=.95;__testPad.buttons[7].pressed=true;});
  await page.waitForFunction(()=>__academy.input.dash);const padBefore=await position();await page.evaluate(()=>__academy.step(5));assert((await position())>padBefore,sport+' gamepad axis moves athlete/aim');
  await page.evaluate(()=>{__testPad.axes[0]=0;__testPad.buttons[7].pressed=false;__testPad.buttons[0].pressed=true;});
  await page.waitForFunction(()=>__academy.input.primary);await page.evaluate(()=>{__testPad.buttons[0].pressed=false;});await page.waitForFunction(()=>!__academy.input.primary);
  await page.evaluate(()=>{__testPad.buttons[9].pressed=true;});await page.getByRole('button',{name:'再開',exact:true}).waitFor();
  const clock=await page.evaluate(()=>__academy.match.clock);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>__academy.match.clock),clock,'Gamepad menu pauses clock');
  await page.evaluate(()=>{__testPad.connected=false;__testPad.buttons.forEach(b=>b.pressed=false);});
  await page.getByRole('button',{name:'再開',exact:true}).click();assert.equal(await page.evaluate(()=>__academy.input.dash),false,'Disconnected pad does not leave dash held');
  for(const [width,height] of [[320,568],[844,390],[390,844]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(150);
   for(const b of await page.locator('.ac-actions button,.ac-stick').all()){
    const r=await b.boundingBox();assert(r&&r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1,sport+' touch control fits');
   }
   const a=await page.locator('.ac-stick').boundingBox(),b=await page.locator('.ac-actions').boundingBox();assert(a.x+a.width<=b.x,'Left stick stays clear of actions');
   if(sport==='baseball')await page.waitForFunction(()=>{const c=document.querySelector('.ac-canvas');return Math.abs(Number(c.dataset.aimX))<.96&&Math.abs(Number(c.dataset.aimY))<.96;});
   await snap(sport+'-human-'+width);
  }
  const r=await page.locator('.ac-stick').boundingBox(),cdp=await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:r.x+r.width*.8,y:r.y+r.height/2}]});
  await page.evaluate(()=>__academy.step(6));assert((await page.evaluate(()=>__academy.input.x))>.5,'Actual touch stick input reaches simulation');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
  await page.evaluate(()=>__academy.sound('hit'));await page.waitForFunction(()=>document.querySelector('.ac-canvas').dataset.renderer==='three');
  if(sport==='soccer')await recovery();
  await page.getByRole('button',{name:'一時停止',exact:true}).click();await page.getByRole('button',{name:'スポーツへ戻る',exact:true}).click();assert.equal(await page.locator('body').getAttribute('data-closed'),'yes');
  reports.push({sport,metrics,passed:['CPU result','persisted record','quiz points','keyboard','standard gamepad','touch stick','pause/resume','320/390/844 layouts','exit']});
  console.log('PASS',sport,'CPU match, records, learning points, keyboard/gamepad/touch, mobile layouts and exit');
 }
 if(!only&&!recoveryOnly&&!scenesOnly){
  await page.goto(base+'?debug=1',{waitUntil:'domcontentloaded'});await page.locator('.sports-choices').waitFor();assert.equal(await page.locator('.sports-choices>button').count(),8);
  for(const [width,height] of [[320,568],[844,390],[1280,800]]){
   await page.setViewportSize({width,height});
   for(const b of await page.locator('.sports-choices>button,.sports-invite-cta button').all()){const r=await b.boundingBox();assert(r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1,'Eight sports hub fits '+width);}
   await snap('hub-'+width);
  }
  for(const sport of ['tennis','golf','dodgeball','basketball','baseball','soccer','volleyball','festival']){
   await page.locator('.sports-'+sport).click();
   if(['baseball','soccer','volleyball','festival'].includes(sport)){await page.locator('[data-game-title='+sport+']').waitFor();}
   else await page.locator('[data-game-title='+sport+']').waitFor();
   await page.getByRole('button',{name:'スポーツへ戻る',exact:true}).click();await page.locator('.sports-choices').waitFor();
  }
  await page.getByRole('button',{name:'招待に参加する',exact:true}).click();assert.equal(await page.getByRole('radio').count(),4,'Existing online invitations remain four supported sports');
  console.log('PASS 8 real hub routes, 3 hub sizes, existing four title routes and invitation compatibility');
 }
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 // Audio playback and decoding use audio-qa.mjs with real pointer unlock;
 // this suite freezes simulation and records network activity without timing assertions.
 await fs.writeFile(output+'/report.json',JSON.stringify({reports,pageErrors:errors,missingAssets:missing,audioRequests:audio.length,audioValidation:'test:academy-sports:audio',physicalDevicesTested:false},null,2)+'\n');
} finally {await browser?.close();await server?.close();}
