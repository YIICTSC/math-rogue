import assert from 'node:assert/strict';
import { mkdtemp, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const output=process.env.PIXEL_RPG_QA_DIR||await mkdtemp(join(tmpdir(),'pixel-rpg-browser-'));
await mkdir(output,{recursive:true});
const server=await createServer({
  cacheDir:join(output,'vite'), logLevel:'error',
  define:{'import.meta.env.VITE_ENABLE_DEBUG_FEATURES':'"true"','import.meta.env.VITE_ONLINE_SERVER_URL':'""','import.meta.env.VITE_WEB_PRELOAD_ENABLED':'"false"','import.meta.env.VITE_WEB_PERFORMANCE_MODE':'"true"'},
  optimizeDeps:{entries:['index.html']},
  server:{port:0,host:'127.0.0.1',hmr:false,watch:null},
});
let browser;
try {
  await server.listen();
  const base='http://127.0.0.1:'+server.httpServer.address().port;
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const context=await browser.newContext({viewport:{width:1280,height:768},hasTouch:true});
  const page=await context.newPage();
  page.setDefaultTimeout(30000);
  const errors=[];
  const musicRequests=new Set(), battleArt=new Set();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',r=>{
    const audioPath=new URL(r.url()).pathname.replace(/^\/(?:web-audio\/)?/,'').replace(/\.ogg$/,'.mp3');
    if(r.ok()&&/^bgm(?:-new)?\//.test(audioPath))musicRequests.add(audioPath);
    if(r.ok()&&r.url().includes('/sprites/pixel-rpg/battle-'))battleArt.add(r.url().split('/').at(-1));
  });
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'getGamepads',{value:()=>window.__pixelTestPad?[window.__pixelTestPad]:[]});
  });
  const button=(names)=>page.getByRole('button',{name:names,exact:true}).filter({visible:true});
  const dialog=()=>page.locator('.pr-window:visible');
  const field=()=>page.locator('.pr-field');
  const layout=async(selector)=>{
    const r=await page.locator(selector).first().boundingBox(),v=page.viewportSize();
    assert(r&&r.x>=-1&&r.y>=-1&&r.x+r.width<=v.width+1&&r.y+r.height<=v.height+1,`${selector} out of bounds: ${JSON.stringify(r)} in ${JSON.stringify(v)}`);
  };
  const shot=(name)=>page.screenshot({path:join(output,name+'.png')});
  async function boot(screen='MINI_GAME_SELECT'){
    await page.goto(base+'/?adminDebug=1&gamepadTestScreen='+screen,{waitUntil:'domcontentloaded'});
    await page.bringToFront();
    const age=page.getByRole('button',{name:/^(Grade 6|小学6年生|しょうがく6ねんせい)$/}).first();
    await Promise.race([
      page.locator('.pixel-rpg:visible,.mini-game-select-panel:visible').waitFor({timeout:75000}),
      age.waitFor({timeout:75000}).then(()=>age.click()),
    ]);
    const prompt=page.locator('[data-gamepad-initial-scope=online-profile-register]:visible');
    if(await prompt.count())await prompt.locator('button').last().click();
  }
  async function finishDialog(){
    for(let i=0;i<12&&await page.locator('.pr-story:visible').count();i++){
      await page.locator('.pr-window .pr-sticky button:visible').click();
    }
    await page.locator('.pr-story:visible').waitFor({state:'hidden'});
  }
  async function battleReady(tutorial=false){
    await page.locator('.pr-combat').waitFor();
    await page.locator('.pr-encounter-intro').waitFor({state:'hidden'});
    if(tutorial)await page.locator('.pr-story:visible').waitFor();
    await finishDialog();
  }
  const combatInputReady=()=>page.locator('.pr-battle-deck:not([inert]),.pr-outcome').first().waitFor();
  const coords=async()=>field().evaluate(n=>({x:Number(n.dataset.prX),y:Number(n.dataset.prY),map:n.dataset.prMap}));
  async function key(key,count=1){for(let n=0;n<count;n++)await page.keyboard.press(key,{delay:8});}
  await boot();
  await page.locator('.mini-game-select-card').filter({hasText:/知識の旅人|Knowledge Travelers/}).click();
  const modeSelect=page.locator('.main-mode-selection-screen');
  const defer=page.locator('.assignment-letter-actions').getByRole('button',{name:/あとで|Later/i});
  await modeSelect.or(defer).first().waitFor();
  if(await defer.isVisible())await defer.click();
  await modeSelect.waitFor();
  const normalProblems=modeSelect.getByRole('button',{name:/^(通常問題へ|Normal Problems)$/});
  if(await normalProblems.isVisible())await normalProblems.click();
  const addition=modeSelect.getByRole('button',{name:/2.Digit Addition|[２2]ケタ.*たし/i}).first();
  if(!await addition.isVisible())await modeSelect.locator('.mode-category-button').filter({hasText:/^(Arithmetic|計算|けいさん)$/i}).first().click();
  await addition.click();
  if(await modeSelect.isVisible())await modeSelect.getByRole('button',{name:/この条件で開始|このじょうけんで|Start with/i}).click();
  await page.locator('.pr-title h1').waitFor({timeout:75000});
  assert.equal(await page.locator('.pr-title nav button').count(),3);
  await shot('01-title-desktop');
  await page.setViewportSize({width:390,height:844});await layout('.pr-title nav');await shot('02-title-phone');
  await button(/^(新しく冒険する|New adventure)$/).click();
  await button(/^(マジック編|Magic Academy)$/).click();
  await button(/^(星宮あかり|Akari Hoshimiya)$/).click();
  assert.match(await page.locator('.pr-hero-feature h3').innerText(),/星宮あかり|Akari Hoshimiya/);
  assert.equal(await page.locator('.pr-hero-grid button').count(),17);
  await button(/^(異郷の旅人|Other worlds)$/).click();
  assert.equal(await page.locator('.pr-hero-grid button').count(),18);
  assert.equal(await page.locator('.pr-hero-grid .pr-hero-guest-sprite').count(),9);
  assert(await page.locator('.pr-hero-grid .pr-hero-guest-sprite').evaluateAll(async nodes=>{
    await Promise.all(nodes.map(async node=>{
      const image=new Image();image.src=getComputedStyle(node).backgroundImage.slice(5,-2);await image.decode();
      if(image.naturalWidth!==320)throw Error('Missing guest atlas');
    }));
    return true;
  }));
  await shot('03-extra-travelers');
  await button(/^(この旅人で進む|Continue with this traveler)$/).click();
  await page.locator('.pr-save-list article').first().getByRole('button').click();
  await finishDialog();
  assert.deepEqual(await coords(),{x:17,y:21,map:'r0-s0-f0'});
  await layout('.pr-virtual-pad');await layout('.pr-action-main');await shot('04-first-village');
  await key('ArrowUp',3);
  assert.deepEqual(await coords(),{x:17,y:18,map:'r0-s0-f0'});
  await button(/^(A 調べる|A Interact)$/).click();
  await finishDialog();
  assert.equal(await page.locator('.pr-field-party button').count(),3,'Two original adventurers join at the village');
  await key('x');
  await button(/^(ジョブ|Jobs)$/).click();
  const guardian=page.locator('.pr-list button').filter({hasText:/守護騎士|Guardian/}).first();
  const oldSprite=await page.locator('.pr-person img').getAttribute('src');
  await guardian.click();
  assert.notEqual(await page.locator('.pr-person img').getAttribute('src'),oldSprite,'The clothing illustration changes after a job switch');
  await button(/^(設定|Settings)$/).click();
  await page.locator('.pr-settings select').nth(0).selectOption('symbol');
  await page.locator('.pr-settings select').nth(2).selectOption('normal');
  await button(/^(記録|Save)$/).click();
  await page.locator('.pr-window .pr-primary').click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('learning-rogue:pixel-rpg:v1:1:manual')));
  assert.equal(saved.state.party.length,3);
  assert.equal(saved.state.heroes['magic-akari'].job,'guardian');
  await dialog().locator('button[data-pr-close]').click();
  const x=(await coords()).x;
  const dpad=page.locator('.pr-dir-right');
  await dpad.tap();
  assert.equal((await coords()).x,x+1,'Touch pad moves exactly once per tap');
  const pad=await page.locator('.pr-virtual-pad').boundingBox(), stickStart=await coords();
  const padX=pad.x+pad.width/2, padY=pad.y+pad.height/2;
  await page.mouse.move(padX,padY);await page.mouse.down();
  assert.deepEqual(await coords(),stickStart,'The center of the virtual pad has a dead zone');
  await page.mouse.move(padX,padY+pad.height*.42);await page.mouse.up();
  assert.equal((await coords()).y,stickStart.y+1,'Dragging the virtual pad steers the party');
  await page.evaluate(()=>window.__pixelTestPad={mapping:'standard',connected:true,axes:[-1,0,0,0],buttons:Array.from({length:17},()=>({pressed:false}))});
  await page.waitForFunction(x=>Number(document.querySelector('.pr-field')?.dataset.prX)<x+1,x);
  await page.evaluate(()=>window.__pixelTestPad=null);
  const position=await coords();
  await key('ArrowLeft',position.x-17);await key('ArrowRight',17-position.x);
  await key('ArrowDown',23-position.y);
  await key('z');
  await page.waitForFunction(()=>document.querySelector('.pr-field')?.dataset.prMap==='world');
  await key('ArrowRight',4);await key('ArrowDown',3);
  await key('z');
  await page.waitForFunction(()=>document.querySelector('.pr-field')?.dataset.prMap==='r0-s1-f0');
  // Follow the visible trail to the meadow companion in the northern clearing.
  await key('ArrowUp',9);
  await key('z');
  await finishDialog();
  assert.equal(await page.locator('.pr-field-party button').count(),4);
  for(const [width,height] of [[844,390],[820,1180],[1280,768],[390,844]]){
    await page.setViewportSize({width,height});await layout('.pr-field');await layout('.pr-virtual-pad');await layout('.pr-action-main');await shot(`05-party-${width}`);
  }
  // Derive a legal movement path from the current scene, and issue it using real key events.
  const moves=await page.evaluate(async(coords)=>{
    const w=await import('/src/mini-games/pixel-rpg/world.ts');
    const s=JSON.parse(localStorage.getItem('learning-rogue:pixel-rpg:v1:1:auto')).state, a=w.area(coords.map);
    const target=a.points.find(e=>e.kind==='enemy');
    const queue=[{p:coords,path:[]}],seen=new Set([`${coords.x},${coords.y}`]);
    const labels={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'};
    while(queue.length){
      const {p,path}=queue.shift();
      if(w.same(p,target))return path;
      for(const [d,delta] of Object.entries(w.OFFSETS)){
        const next=w.add(p,delta),key=`${next.x},${next.y}`;
        if(!seen.has(key)&&w.canTravel(w.tileAt(a,next),s.vehicle,false)){seen.add(key);queue.push({p:next,path:[...path,labels[d]]});}
      }
    }
    throw new Error('Enemy unreachable');
  },await coords());
  for(const direction of moves)await key(direction);
  const encounterIntro=page.locator('.pr-encounter-intro');
  await encounterIntro.waitFor();
  const initial=await page.evaluate(()=>{
    const enemy=document.querySelector('.pr-unit-enemy[aria-pressed="true"]>small').textContent;
    const hand=document.querySelector('.pr-hand-card').getBoundingClientRect();
    return {enemy,x:hand.x+10,y:hand.y+10,locked:document.querySelector('.pr-battle-deck').inert};
  });
  assert(initial.locked);
  await page.touchscreen.tap(initial.x,initial.y);
  await key('1');
  await battleReady(true);
  assert.equal(await page.locator('.pr-unit-enemy[aria-pressed="true"]>small').textContent(),initial.enemy);
  assert.match(await page.locator('.pr-energy').innerText(),/2 EN/);
  const actionSources=await page.evaluate(async state=>{
    const {battleFrame}=await import('/src/mini-games/pixel-rpg/art.ts');
    const {createBattle}=await import('/src/mini-games/pixel-rpg/battle.ts');
    const {preloadBattleActionArt}=await import('/src/mini-games/pixel-rpg/battleActionArt.ts');
    const battle=createBattle(state,{region:0,variant:0});
    const actor='magic-akari',enemy=battle.enemies[0].id;
    const atlas=preloadBattleActionArt(actor);
    await atlas.decode();
    const canvas=document.createElement('canvas');canvas.width=600;canvas.height=250;
    const cx=canvas.getContext('2d'),draw=cx.drawImage.bind(cx);
    let rect;
    cx.drawImage=(source,...args)=>{
      if(source===atlas&&args.length===8)rect=args.slice(0,4);
      draw(source,...args);
    };
    return [
      {art:'blade',from:actor,to:enemy},
      {art:'gesture',from:actor,to:actor},
      {art:'hit',from:enemy,to:actor,value:4},
    ].map(pulse=>{
      rect=undefined;
      battleFrame(cx,battle,canvas.width,canvas.height,200,{at:0,duration:340,actors:[],pulses:[{id:1,element:'steel',...pulse}]});
      return rect;
    });
  },saved.state);
  assert(actionSources.every(rect=>rect?.[2]===64&&rect[3]===64),'Each battle action draws a decoded generated sprite');
  assert.equal(new Set(actionSources.map(rect=>rect.join(','))).size,3,'Attack, skill and damage use different crops in Akari’s Guardian outfit');
  await layout('.pr-arena');await layout('.pr-endturn');
  await shot('06-battle-phone');
  await button(/^(連携|Link)$/).click();
  const linkDialog=page.getByRole('dialog',{name:/連携技|Link techniques/});
  await linkDialog.getByRole('button',{name:/ほかの編成|Techniques for other parties/}).click();
  assert(await linkDialog.evaluate(window=>{
    const hand=document.querySelector('.pr-hand-card'), deck=document.querySelector('.pr-battle-deck');
    const a=hand.getBoundingClientRect(),b=window.getBoundingClientRect();
    const x=(Math.max(a.left,b.left)+Math.min(a.right,b.right))/2;
    const y=(Math.max(a.top,b.top)+Math.min(a.bottom,b.bottom))/2;
    return deck.inert&&y>=a.top&&y<=a.bottom&&y>=b.top&&y<=b.bottom&&window.contains(document.elementFromPoint(x,y));
  }), 'The Link dialog covers the hand and blocks interaction');
  await shot('06-link-phone');
  await key('Escape');
  await linkDialog.waitFor({state:'hidden'});
  assert.equal(await page.locator('.pr-unit-enemy[aria-pressed="true"] .pr-enemy-cursor').count(),1);
  await page.waitForFunction(()=>[...document.querySelectorAll('.pr-hand-card img')].some(image=>image.complete&&image.naturalWidth>0));
  await page.setViewportSize({width:844,height:390});await layout('.pr-arena');await layout('.pr-endturn');await shot('07-battle-landscape');
  await button(/^(ひらめき|Study)$/).click();
  const challenge=page.locator('[data-adventure-problem] .main-challenge-screen');
  await challenge.waitFor({timeout:45000});
  const board=challenge.locator('[data-gamepad-initial-scope^="unit-board-"]');
  if(await board.isVisible())await board.locator('button[data-gamepad-back]').first().click();
  assert.equal(await challenge.getByRole('button',{name:/聞く|Listen/}).count(),0);
  const question=await challenge.getByRole('heading',{level:3,name:/\+.*=\s*\?/}).innerText();
  assert(question.length>1);
  await shot('08-question-landscape');
  // Simple default addition uses numeric operands and a known expected answer.
  const matches=question.match(/(-?\d+)\s*[＋+]\s*(-?\d+)/u);
  assert(matches,question);
  const readProgress=()=>page.evaluate(async()=>{
    const {storageService}=await import('/src/services/storageService.ts');
    return storageService.getModeCorrectCounts().ADDITION??0;
  });
  const beforeQuiz=await readProgress();
  const answer=String(Number(matches[1])+Number(matches[2]));
  await challenge.locator('.basic-challenge-options').getByRole('button',{name:answer,exact:true}).click();
  await challenge.waitFor({state:'hidden'});
  await combatInputReady();
  assert.match(await page.locator('.pr-energy').innerText(),/3 EN/);
  assert.equal(await readProgress(),beforeQuiz+1,'One correct shared question records one unit answer');
  const attack=page.locator('.pr-hand-card[aria-disabled="false"]').filter({hasText:/威力|Power/}).first();
  const aimedVitals=await page.locator('.pr-unit-enemy[aria-pressed="true"]>small').textContent();
  await attack.click();
  await combatInputReady();
  const afterHit=await page.locator('.pr-unit-enemy[aria-pressed="true"]>small').allTextContents();
  assert(!afterHit.length||afterHit[0]!==aimedVitals,'A single card tap attacks the cursor target');
  assert.equal(await page.locator('.pr-target-bar').count(),0);
  for(let round=0;round<14&&!await page.locator('.pr-outcome').count();round++){
    const combatants=page.locator('.pr-unit-ally:enabled');
    for(let a=0;a<await combatants.count()&&!await page.locator('.pr-outcome').count();a++){
      await combatants.nth(a).click();
      for(let n=0;n<4&&!await page.locator('.pr-outcome').count();n++){
        const hand=page.locator('.pr-hand-card[aria-disabled="false"]').filter({hasText:/威力|Power/});
        if(!await hand.count())break;
        await hand.first().click();
        await combatInputReady();
      }
    }
    if(!await page.locator('.pr-outcome').count()){
      await page.locator('.pr-endturn').click();await combatInputReady();
    }
  }
  await page.locator('.pr-outcome').waitFor();
  assert.match(await page.locator('.pr-outcome strong').innerText(),/勝利|Victory/);
  assert.equal(await page.locator('.pr-reward-heroes li').count(),4);
  assert((await page.locator('.pr-reward-heroes li').allTextContents()).every(line=>line.includes('EXP +18')));
  const bankedLink=Number((await page.locator('.pr-link').innerText()).match(/LINK (\d+)\//)[1]);
  assert(bankedLink>0);
  await shot('09-victory-landscape');
  await page.touchscreen.tap(30,350);
  await field().waitFor();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('learning-rogue:pixel-rpg:v1:1:auto')).state.link),bankedLink);
  const afterWin=await coords();
  await boot('MINI_GAME_PIXEL_RPG');
  await page.locator('.pr-title h1').waitFor();
  const prompt=page.locator('[data-gamepad-initial-scope=online-profile-register]:visible');
  if(await prompt.count())await prompt.locator('button').last().click();
  await button(/^(旅を続ける|Continue)$/).click();
  await page.locator('.pr-save-list article').first().getByRole('button',{name:/自動記録|Autosave/}).click();
  assert.deepEqual(await coords(),afterWin);
  assert.equal(await page.locator('.pr-field-party button').count(),4);
  await shot('10-resume');
  assert(await page.evaluate(async()=>{
    const {HERO_LIST}=await import('/src/mini-games/pixel-rpg/catalog.ts');
    const {illustration}=await import('/src/mini-games/pixel-rpg/art.ts');
    return HERO_LIST.every(h=>illustration(h.id,h.job)!==illustration(h.id,h.job,'guard')
      &&illustration(h.id,h.job,'cast')!==illustration(h.id,h.job,'fallen'));
  }), 'All playable characters render distinct action poses');
  async function approachAndUse(kind,label,slot=1){
    const plan=await page.evaluate(async ({position,kind,label,slot})=>{
      const w=await import('/src/mini-games/pixel-rpg/world.ts');
      const game=await import('/src/mini-games/pixel-rpg/adventure.ts');
      const state=JSON.parse(localStorage.getItem(`learning-rogue:pixel-rpg:v1:${slot}:auto`)).state;
      const a=w.area(position.map), landmark=a.points.find(e=>e.kind===kind&&(!label||e.label[1]===label));
      if(!landmark)throw new Error('Unknown landmark '+kind+' '+label+' in '+position.map);
      const q=[{p:position,path:[]}], seen=new Set([`${position.x},${position.y}`]);
      const keys={up:'ArrowUp',right:'ArrowRight',down:'ArrowDown',left:'ArrowLeft'};
      while(q.length){
        const {p,path}=q.shift();
        if(w.same(p,landmark))return {path,target:{x:landmark.x,y:landmark.y,map:a.id}};
        for(const d of Object.keys(keys)){
          const move=game.step({...state,at:p,trail:[p],repellent:64},d).state;
          const next=move.at,k=`${next.x},${next.y}`;
          const liveEnemy=a.points.some(e=>e.kind==='enemy'&&w.same(e,next)&&!state.completed.includes(e.id));
          if(!liveEnemy&&!seen.has(k)){
            seen.add(k);q.push({p:next,path:[...path,keys[d]]});
          }
        }
      }
      throw new Error(landmark.id+' unreachable from '+JSON.stringify(position));
    },{position:await coords(),kind,label,slot});
    for(const direction of plan.path)await key(direction);
    assert.deepEqual(await coords(),plan.target,'Approach '+kind+' '+(label??''));
    await page.locator('.pr-action-main').click();
  }
  await approachAndUse('chest');
  await approachAndUse('exit');
  await approachAndUse('site','The Forgotten Cave');
  await finishDialog();
  await shot('10-dungeon-cave');
  await approachAndUse('feature');
  await approachAndUse('stairs');
  await shot('10-dungeon-rotor');
  await approachAndUse('feature');
  await key('x');
  await button(/^(記録|Save)$/).click();
  await page.locator('.pr-window .pr-primary').click();
  await dialog().locator('button[data-pr-close]').click();
  const beforeBoss=await coords();
  await approachAndUse('boss');
  await battleReady();
  assert.match(await page.locator('.pr-link').innerText(),new RegExp(`LINK ${bankedLink}/12`));
  const control=page.locator('.pr-deck-meta>div:first-child>b');
  const firstActor=await control.innerText();
  const handNow=()=>page.locator('.pr-hand-card[aria-disabled="false"]');
  for(let n=0;n<24&&!await page.locator('.pr-endturn[data-ready]').count();n++){
    const defense=handNow().filter({hasText:/防御|Block/}).first();
    const card=await defense.count()?defense:handNow().first();
    if(!await card.count())break;
    await card.click();
    await combatInputReady();
  }
  assert.notEqual(await control.innerText(),firstActor,'Running out of playable cards selects the next traveler');
  assert(await page.locator('.pr-endturn[data-ready]').isVisible(),'Exhausting all turns highlights End turn');
  await page.locator('.pr-link-ready').click();
  await page.getByRole('button',{name:/旅路の呼吸|On the Same Road/}).click();
  await combatInputReady();
  assert.match(await page.locator('.pr-link').innerText(),/LINK 0\/12/);
  for(let round=0;round<55&&!await page.locator('.pr-outcome').count();round++){
    await page.locator('.pr-endturn').click();await combatInputReady();
  }
  assert.match(await page.locator('.pr-outcome strong').innerText(),/冒険隊は力尽きた|The party fell/);
  await layout('.pr-outcome .pr-primary');await shot('11-boss-defeat');
  await page.locator('.pr-outcome .pr-primary').click();
  assert.equal((await coords()).map,'r0-s0-f0');
  await boot('MINI_GAME_PIXEL_RPG');
  await page.locator('.pr-title h1').waitFor();
  await button(/^(旅を続ける|Continue)$/).click();
  await page.locator('.pr-save-list article').first().getByRole('button',{name:/手動記録|Manual save/}).click();
  assert.deepEqual(await coords(),beforeBoss);
  await approachAndUse('boss');
  await battleReady();
  let secondPhase=false;
  for(let round=0;round<16&&!await page.locator('.pr-outcome').count();round++){
    const n=await page.locator('.pr-unit-ally:enabled').count();
    for(let a=0;a<n&&!await page.locator('.pr-outcome').count();a++){
      const ally=page.locator('.pr-unit-ally:enabled').nth(a);
      if(!await ally.count())break;
      await ally.click();
      for(let c=0;c<4&&!await page.locator('.pr-outcome').count();c++){
        const hand=page.locator('.pr-hand-card[aria-disabled="false"]').filter({hasText:/威力|Power/});
        if(!await hand.count())break;
        await hand.first().click();
        await combatInputReady();
        if(!secondPhase&&(await page.locator('.pr-combat-top').innerText()).match(/第二形態|Second phase/)){
          secondPhase=true;await shot('12-boss-phase-two');
        }
      }
    }
    if(!await page.locator('.pr-outcome').count()){
      await page.locator('.pr-endturn').click();await combatInputReady();
    }
  }
  assert(secondPhase,'The guardian visibly transitions to phase two');
  assert.match(await page.locator('.pr-outcome strong').innerText(),/勝利|Victory/);
  assert.match(await page.locator('.pr-reward-loot').innerText(),/旅の薬|Travel Tonic/);
  assert.match(await page.locator('.pr-reward-loot').innerText(),/×2/);
  await shot('12-boss-rewards');
  await page.setViewportSize({width:390,height:844});
  await layout('.pr-outcome .pr-primary');
  await shot('12-boss-rewards-phone');
  await page.locator('.pr-outcome .pr-primary').click();
  await finishDialog();
  const cleared=await page.evaluate(()=>JSON.parse(localStorage.getItem('learning-rogue:pixel-rpg:v1:1:auto')).state);
  assert.equal(cleared.stage,1);
  assert(cleared.licenses.includes('canoe'));
  await key('x');
  await button(/^(設定|Settings)$/).click();
  const languagePicker=page.locator('.pr-settings select').last();
  await languagePicker.selectOption('JAPANESE');
  await page.getByRole('dialog',{name:'旅の手帳'}).waitFor();
  assert.equal(await page.locator('.pixel-rpg').getAttribute('lang'),'ja');
  await languagePicker.selectOption('HIRAGANA');
  await page.getByRole('dialog',{name:/たびの[ 　]?てちょう/}).waitFor();
  await shot('13-hiragana-settings');

  const testSlot=2;
  const houseSave=()=>page.evaluate(slot=>JSON.parse(localStorage.getItem(`learning-rogue:pixel-rpg:v1:${slot}:auto`)).state,testSlot);
  async function loadHouseSlot(prepare){
    await boot('MINI_GAME_PIXEL_RPG');
    const resume=button(/^(旅を続ける|Continue)$/);
    if(prepare){
      await prepare();
      if(await resume.isDisabled())await boot('MINI_GAME_PIXEL_RPG');
    }
    await resume.click();
    await page.locator('.pr-save-list article').nth(testSlot-1).getByRole('button',{name:/自動記録|Autosave/}).click();
    await field().waitFor();
  }
  async function visitTown(region){
    await loadHouseSlot(()=>page.evaluate(async({region,slot})=>{
      const {newAdventure}=await import('/src/mini-games/pixel-rpg/adventure.ts');
      const {area,mapId}=await import('/src/mini-games/pixel-rpg/world.ts');
      const {writeSave}=await import('/src/mini-games/pixel-rpg/save.ts');
      const town=area(mapId(region,0)),s=newAdventure('magic-akari',42,{language:'JAPANESE',encounters:'symbol'});
      writeSave(slot,{...s,map:town.id,at:town.start,trail:[town.start],stage:region},'auto');
    },{region,slot:testSlot}));
  }
  const useHouse=(kind,label)=>approachAndUse(kind,label,testSlot);
  const startHouseGame=()=>button(/^(対戦する|Play a match)$/).click();
  const returnHome=()=>button(/^(民家へ戻る|Return to the house)$/).filter({visible:true}).click();
  await visitTown(0);
  await useHouse('door','Inn');
  await page.waitForFunction(()=>document.fonts.status==='loaded');
  await shot('14-inn');
  await useHouse('service');
  await page.getByRole('dialog',{name:/宿屋|Inn/}).waitFor();
  await dialog().locator('button[data-pr-close]').click();
  await useHouse('exit');
  await useHouse('door','Root House');
  await useHouse('resident');
  const rootHouse=await coords(),beforeMatch=await houseSave();
  await dialog().getByText(/24 G/).waitFor();
  await shot('15-house-invitation-phone');
  await startHouseGame();
  const match=page.locator('.pr-house-match');
  const houseBoard=match.locator('.gc-party-board'),columns=match.locator('.gc-party-columns button');
  await houseBoard.waitFor();
  await layout('.gc-party-columns');
  await columns.nth(3).tap();
  await houseBoard.locator('.piece-2').first().waitFor();
  await shot('16-four-in-a-row-phone');
  await page.setViewportSize({width:844,height:390});
  await layout('.gc-party-board');
  for(const i of [1,2,0])await columns.nth(i).tap();
  await match.getByRole('status').filter({hasText:/24 G/}).waitFor();
  await shot('17-house-win-landscape');
  await match.locator('.pr-house-continue').click();
  assert.deepEqual(await coords(),rootHouse);
  const afterMatch=await houseSave();
  assert.equal(afterMatch.gold,beforeMatch.gold+24);
  assert.equal(afterMatch.items.tonic,beforeMatch.items.tonic+2);
  await loadHouseSlot();
  assert.deepEqual(await coords(),rootHouse);
  await useHouse('resident');
  await dialog().getByText(/受け取り済み|reward collected/).waitFor();
  await startHouseGame();
  for(const i of [3,1,2,0])await columns.nth(i).click();
  await match.getByRole('status').filter({hasText:/受け取り済み|already collected/}).waitFor();
  await match.locator('.pr-house-continue').click();
  assert.equal((await houseSave()).gold,afterMatch.gold,'A second win cannot grant another prize');
  await shot('18-root-house-landscape');

  await page.setViewportSize({width:390,height:844});
  await visitTown(2);
  await useHouse('door','Window Study');
  await useHouse('resident');
  const studyPosition=await coords(),studyGold=(await houseSave()).gold;
  await startHouseGame();
  await match.locator('[data-club-game=crazyeight] [data-portrait=chronicle-puzzle]').first().waitFor();
  const cardAction=match.locator('.cc-actions button:enabled').first();
  const cardCpuMoves=match.locator('.cc-log-entries p').filter({hasText:/ラシェ|Rache/});
  for(let i=0;i<8&&!await cardCpuMoves.count();i++)await cardAction.click();
  await page.waitForFunction(()=>/ラシェ|Rache/.test(document.querySelector('.cc-log-entries')?.textContent??''));
  await shot('19-house-card-club');
  await returnHome();
  assert.deepEqual(await coords(),studyPosition);
  assert.equal((await houseSave()).gold,studyGold,'Leaving an incomplete match gives no reward');

  await page.setViewportSize({width:844,height:390});
  await visitTown(1);
  await useHouse('door','Clock House');
  await useHouse('resident');
  const clockHouse=await coords();
  await startHouseGame();
  const domino=match.locator('[data-table-game=austrian-draw]');
  await domino.locator('[data-portrait=chronicle-clockwork]').waitFor();
  const dominoAction=domino.locator('.tt-hand button:enabled,.tt-play-actions button:enabled').first();
  const cpuMove=domino.locator('.tt-last-play').filter({hasText:/エル|Ell/});
  for(let i=0;i<16;i++){
    await cpuMove.or(dominoAction).first().waitFor();
    if(await cpuMove.count())break;
    await dominoAction.click();
    const dominoEnd=domino.locator('.tt-domino-map-end[data-target=true]').first();
    if(await dominoEnd.count())await dominoEnd.click();
  }
  await page.waitForFunction(()=>/エル|Ell/.test(document.querySelector('.tt-last-play')?.textContent??''));
  await shot('20-house-domino');
  await returnHome();
  assert.deepEqual(await coords(),clockHouse);
  await shot('21-clock-house-landscape');

  assert(battleArt.has('battle-meadow.webp'));
  for(const track of ['menu','rest','battle','boss','victory','game_over']){
    assert(musicRequests.has(`bgm/${track}.mp3`),`Missing old elementary track ${track}; requested ${[...musicRequests]}`);
  }
  assert(![...musicRequests].some(path=>path.startsWith('bgm-new/pixel-rpg/')));
  assert.deepEqual(errors,[]);
  console.log(`PASS real mini-game entry, hero selection, movement on keyboard/touch/pad, party joins, job/palette change, study, targeting, boss victory and defeat, audio, both save paths, and all three house CPU duel families with persisted first-win rewards. Screenshots: ${output}`);
}catch(error){
  console.error(`Pixel RPG playtest screenshots: ${output}`);
  throw error;
}finally{
  await browser?.close();await server.close();
}
