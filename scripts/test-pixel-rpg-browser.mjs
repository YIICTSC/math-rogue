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
    if(r.ok()&&r.url().includes('/bgm-new/pixel-rpg/'))musicRequests.add(r.url().split('/').at(-1).split('?')[0]);
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
  const coords=async()=>field().evaluate(n=>({x:Number(n.dataset.prX),y:Number(n.dataset.prY),map:n.dataset.prMap}));
  async function key(key,count=1){for(let n=0;n<count;n++)await page.keyboard.press(key,{delay:8});}
  await boot();
  await page.locator('.mini-game-select-card').filter({hasText:/知識の旅人|Knowledge Travelers/}).click();
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
  await shot('03-extra-travelers');
  await button(/^(この旅人で進む|Continue with this traveler)$/).click();
  await page.locator('.pr-save-list article').first().getByRole('button').click();
  await finishDialog();
  assert.deepEqual(await coords(),{x:17,y:21,map:'r0-s0-f0'});
  await layout('.pr-dpad');await layout('.pr-action-main');await shot('04-first-village');
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
  await page.locator('.pr-settings select').nth(2).selectOption('instant');
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
    await page.setViewportSize({width,height});await layout('.pr-field');await layout('.pr-dpad');await layout('.pr-action-main');await shot(`05-party-${width}`);
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
  await page.locator('.pr-combat').waitFor();
  await finishDialog();
  await layout('.pr-arena');await layout('.pr-endturn');
  await shot('06-battle-phone');
  await page.setViewportSize({width:844,height:390});await layout('.pr-arena');await layout('.pr-endturn');await shot('07-battle-landscape');
  await button(/^(ひらめき|Study)$/).click();
  await page.locator('.pr-study h3').waitFor({timeout:45000});
  const question=await page.locator('.pr-study h3').innerText();
  assert(question.length>1);
  await shot('08-question-landscape');
  // Simple default addition uses numeric operands and a known expected answer.
  const matches=question.match(/(-?\d+)\s*[＋+]\s*(-?\d+)/u);
  if(matches){
    const answer=String(Number(matches[1])+Number(matches[2]));
    const options=await page.locator('.pr-choice-grid button').allTextContents();
    const index=options.findIndex((o,i)=>o.slice(String(i+1).length).trim()===answer);
    assert(index>=0,`Question did not include the correct option: ${question} · ${options}`);
    await page.locator('.pr-choice-grid button').nth(index).click();
    assert.match(await page.locator('.pr-study-feedback strong').innerText(),/正解|Correct/);
    await page.locator('.pr-study-feedback button.pr-primary').click();
    assert.match(await page.locator('.pr-energy').innerText(),/3 EN/);
  }else{
    await page.locator('.pr-choice-grid button').first().click();
    await page.locator('.pr-study-feedback button.pr-primary').click();
  }
  for(let round=0;round<14&&!await page.locator('.pr-outcome').count();round++){
    const combatants=page.locator('.pr-unit-ally:enabled');
    for(let a=0;a<await combatants.count()&&!await page.locator('.pr-outcome').count();a++){
      await combatants.nth(a).click();
      for(let n=0;n<4&&!await page.locator('.pr-outcome').count();n++){
        const hand=page.locator('.pr-hand-card:enabled').filter({hasText:/威力|Power/});
        if(!await hand.count())break;
        await hand.first().click();
        const foe=page.locator('.pr-unit-enemy.pr-target:enabled').first();
        if(await foe.count())await foe.click();
        else if(await page.locator('.pr-target-bar .pr-primary').count())await page.locator('.pr-target-bar .pr-primary').click();
        else {await page.locator('.pr-target-bar button').first().click();break;}
      }
    }
    if(!await page.locator('.pr-outcome').count())await page.locator('.pr-endturn').click();
  }
  await page.locator('.pr-outcome').waitFor();
  assert.match(await page.locator('.pr-outcome strong').innerText(),/勝利|Victory/);
  await shot('09-victory-landscape');
  await page.locator('.pr-outcome .pr-primary').click();
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
  async function approachAndUse(kind,label){
    const plan=await page.evaluate(async ({position,kind,label})=>{
      const w=await import('/src/mini-games/pixel-rpg/world.ts');
      const game=await import('/src/mini-games/pixel-rpg/adventure.ts');
      const state=JSON.parse(localStorage.getItem('learning-rogue:pixel-rpg:v1:1:auto')).state;
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
    },{position:await coords(),kind,label});
    for(const direction of plan.path)await key(direction);
    assert.deepEqual(await coords(),plan.target,'Approach '+kind+' '+(label??''));
    await page.locator('.pr-action-main').click();
  }
  await approachAndUse('chest');
  await approachAndUse('exit');
  await approachAndUse('site','The Forgotten Cave');
  await finishDialog();
  await approachAndUse('feature');
  await approachAndUse('stairs');
  await approachAndUse('feature');
  await key('x');
  await button(/^(記録|Save)$/).click();
  await page.locator('.pr-window .pr-primary').click();
  await dialog().locator('button[data-pr-close]').click();
  const beforeBoss=await coords();
  await approachAndUse('boss');
  await page.locator('.pr-combat').waitFor();
  for(let round=0;round<55&&!await page.locator('.pr-outcome').count();round++)await page.locator('.pr-endturn').click();
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
  await page.locator('.pr-combat').waitFor();
  let secondPhase=false;
  for(let round=0;round<16&&!await page.locator('.pr-outcome').count();round++){
    const n=await page.locator('.pr-unit-ally:enabled').count();
    for(let a=0;a<n&&!await page.locator('.pr-outcome').count();a++){
      const ally=page.locator('.pr-unit-ally:enabled').nth(a);
      if(!await ally.count())break;
      await ally.click();
      for(let c=0;c<4&&!await page.locator('.pr-outcome').count();c++){
        const hand=page.locator('.pr-hand-card:enabled').filter({hasText:/威力|Power/});
        if(!await hand.count())break;
        await hand.first().click();
        const foe=page.locator('.pr-unit-enemy.pr-target:enabled').first(),play=page.locator('.pr-target-bar .pr-primary');
        if(await foe.count())await foe.click();
        else if(await play.count())await play.click();
        else {await page.locator('.pr-target-bar button').first().click();break;}
        if(!secondPhase&&(await page.locator('.pr-combat-top').innerText()).match(/第二形態|Second phase/)){
          secondPhase=true;await shot('12-boss-phase-two');
        }
      }
    }
    if(!await page.locator('.pr-outcome').count())await page.locator('.pr-endturn').click();
  }
  assert(secondPhase,'The guardian visibly transitions to phase two');
  assert.match(await page.locator('.pr-outcome strong').innerText(),/勝利|Victory/);
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
  assert(battleArt.has('battle-meadow.webp'));
  assert(musicRequests.has('title.mp3')&&musicRequests.has('village.mp3')&&musicRequests.has('battle.mp3'),`BGM tracks requested: ${[...musicRequests]}`);
  assert.deepEqual(errors,[]);
  console.log(`PASS real mini-game entry, hero selection, movement on keyboard/touch/pad, party joins, job/palette change, study, targeting, boss victory and defeat, audio and both save paths. Screenshots: ${output}`);
}finally{
  await browser?.close();await server.close();
}
