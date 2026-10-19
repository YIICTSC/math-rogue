import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const out=process.env.DUNGEONS_SCREENSHOT_DIR||'/workspace/dungeons-cutins-review';await mkdir(out,{recursive:true});
const base=process.env.WANDERER_TEST_BASE_URL||'http://localhost:5173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const boot=async(screen='MINI_GAME_DUNGEON')=>{await page.goto(base+'/?adminDebug=1&gamepadTestScreen='+screen,{waitUntil:'domcontentloaded',timeout:120000});const grade=page.getByRole('button',{name:'Grade 6',exact:true});if(await grade.count())await grade.click();await page.locator('.wanderer-title').waitFor({timeout:60000});await page.evaluate(()=>document.querySelector('.app-shell')?.classList.remove('gamepad-shortcuts-debug'));await page.addStyleTag({content:'[class*="z-[10060]"],[data-gamepad-initial-scope="online-profile-register"]{display:none!important}'});};
 await boot('MINI_GAME_DUNGEON_2');await page.getByRole('button',{name:'New game',exact:true}).click();await page.getByRole('button',{name:'Begin this journey',exact:true}).click();await page.locator('.wanderer-town').waitFor();const seed=await page.evaluate(()=>JSON.parse(localStorage.getItem('pixel_spire_dungeon_state_2_v1')));
 const make=(hero='high-school-warrior',mode='STORY')=>{const s=structuredClone(seed);s.floor=2;s.gameOver=false;s.gameClear=false;s.player.x=5;s.player.y=5;s.player.hp=500;s.player.maxHp=1000;s.player.attack=10;s.player.dir={x:1,y:0};s.player.status={};s.map=Array.from({length:26},(_,y)=>Array.from({length:26},(_,x)=>x>0&&y>0&&x<25&&y<25?'FLOOR':'WALL'));s.map[23][23]='STAIRS';s.traps=[];s.floorItems=[];s.enemies=[{id:9001,type:'ENEMY',enemyType:'SLIME',x:6,y:5,char:'s',name:'Training sentinel',hp:150,maxHp:150,attack:8,baseAttack:8,defense:0,baseDefense:0,xp:1,dir:{x:-1,y:0},status:{sleep:0,confused:0,frozen:0,poison:0}}];Object.assign(s.adventure,{heroId:hero,runId:'ability-'+hero+'-'+mode,mode,floor:2,floorTurns:0,place:'DUNGEON',town:false,scene:undefined,terrain:{},events:{},storySeen:[1],pendingStory:undefined,pendingStoryLine:undefined,abilityFloor:undefined,abilityReadyAt:undefined});return s;};
 let index=0;const load=async(s,series=2,clears=8)=>{const flag='abyss-fixture-'+(++index);await page.addInitScript(({s,series,clears,flag})=>{if(sessionStorage.getItem(flag))return;sessionStorage.setItem(flag,'1');localStorage.setItem(series===2?'pixel_spire_dungeon_state_2_v1':'pixel_spire_dungeon_state_v1',JSON.stringify(s));localStorage.setItem('school-wanderer-3d','off');localStorage.setItem('learning-rogue:school-base:'+series,JSON.stringify({version:1,selectedHero:s.adventure.heroId,dungeons2Clears:clears,warehouse:[],bank:0,visits:0,story:0,clears:{STORY:1}}));},{s,series,clears,flag});await boot(series===2?'MINI_GAME_DUNGEON_2':'MINI_GAME_DUNGEON');await page.getByRole('button',{name:'Continue',exact:true}).click();await page.locator('.wanderer-title').waitFor({state:'detached'});await page.evaluate(()=>{window.abyssTestRandom ||= Math.random;Math.random=()=>.99;});};

 let clockInstalled=false;
 for(const series of [1,2]){
  const hero=series===1?'high-school-warrior':'dungeons2-lyria',screen=series===1?'MINI_GAME_DUNGEON':'MINI_GAME_DUNGEON_2';
  await load(make(hero),series);
  await page.getByRole('button',{name:'Sts',exact:true}).locator('visible=true').click();
  const status=page.locator('[data-gamepad-initial-scope="'+(series===1?'dungeon-one-status':'dungeon-two-status')+'"]');
  assert.equal(await status.locator('.ability-reference-card').count(),series===1?1:4);
  assert.ok((await status.innerText()).includes('Recharge'));
  await page.screenshot({path:out+'/d'+series+'-status-desktop.png'});
  await status.getByRole('button',{name:'Close',exact:true}).first().click();
  // Inspect new-game selection with all heroes unlocked by the fixture's base.
  await boot(screen);await page.getByRole('button',{name:'New game',exact:true}).click();
  for(const size of [{width:1280,height:720},{width:390,height:844},{width:844,height:390}]){
   await page.setViewportSize(size);await page.waitForTimeout(100);
   const info=page.locator('.ability-reference');assert.equal(await info.locator('.ability-reference-card').count(),series===1?1:4);
   const begin=page.getByRole('button',{name:'Begin this journey',exact:true});await begin.scrollIntoViewIfNeeded();assert.ok(await begin.isVisible());
   await page.screenshot({path:out+'/d'+series+'-selection-'+size.width+'.png'});
  }
  await page.setViewportSize({width:390,height:844});await load(make(hero),series);
  await page.getByRole('button',{name:'Sts',exact:true}).locator('visible=true').click();
  await page.locator('.ability-reference').scrollIntoViewIfNeeded();await page.screenshot({path:out+'/d'+series+'-status-mobile.png'});
  await page.locator('[data-gamepad-back]').filter({visible:true}).first().click();
  for(let slot=0;slot<(series===1?1:3);slot++){
   await page.setViewportSize({width:844,height:390});await load(make(hero),series);await page.waitForTimeout(300);
   if(!clockInstalled){await page.clock.install();clockInstalled=true;}await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now()+1000)));
   await page.addStyleTag({content:'.blender-ultimate-fx.ready{animation:none!important;background-position:60% 33.33333%!important}.student-ability-burst,.ultimate-character-cutin{animation:none!important;opacity:1!important;transform:none!important}'});
   await page.keyboard.press(['q','e','f'][slot]);
   const art=page.locator('.ultimate-character-cutin');await art.waitFor();
   assert.equal(await art.getAttribute('data-cutin-hero'),hero);assert.equal(await art.getAttribute('data-cutin-slot'),String(slot+1));
   const image=art.locator('img');await image.evaluate(e=>e.decode());assert.ok((await image.getAttribute('src')).includes(hero+'-skill-'+(slot+1)+'.webp'));
   await page.locator('.blender-ultimate-fx.ready').waitFor();
   await page.screenshot({path:out+'/d'+series+'-skill-'+(slot+1)+'-landscape.png'});
   if(slot===0){await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/d'+series+'-skill-mobile.png'});}
   await page.clock.runFor(1500);assert.equal(await page.locator('.student-ability-burst').count(),0);assert.equal(await page.evaluate(series=>JSON.parse(localStorage.getItem(series===1?'pixel_spire_dungeon_state_v1':'pixel_spire_dungeon_state_2_v1')).adventure.floorTurns,series),1,'An ultimate still uses exactly one turn');await page.clock.resume();
  }
 }
 for(const [series,hero] of [[1,'magic-akari'],[2,'dungeons2-lyria']]){
  const s=make(hero);s.adventure.transformed=true;await page.setViewportSize({width:844,height:390});await load(s,series);await page.waitForTimeout(300);
  await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now()+1000)));await page.addStyleTag({content:'.blender-ultimate-fx.ready{animation:none!important;background-position:60% 33.33333%!important}.student-ability-burst,.ultimate-character-cutin{animation:none!important;opacity:1!important;transform:none!important}'});
  await page.keyboard.press('q');const art=page.locator('.ultimate-character-cutin');await art.waitFor();assert.equal(await art.getAttribute('data-cutin-form'),'transformed');assert.equal(await art.getAttribute('data-cutin-hero'),hero);await art.locator('img').evaluate(e=>e.decode().catch(error=>{throw Error(e.src+' | '+error.message)}));assert.ok((await art.locator('img').getAttribute('src')).includes('-transformed.webp'));
  await page.locator('.blender-ultimate-fx.ready').waitFor();await page.screenshot({path:out+'/d'+series+'-transformed-cutin.png'});await page.clock.runFor(1500);await page.clock.resume();
 }
 assert.deepEqual(errors,[]);console.log('PASS: both selections and statuses display actual skill effects; desktop, portrait and landscape screenshots; D1 ultimate and D2 Q/E/F each use matching distinct decoded cut-ins, Blender FX and clean teardown.');
}finally{await browser.close();}
