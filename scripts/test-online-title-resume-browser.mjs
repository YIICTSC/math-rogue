import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const player = {
  maxHp: 100,
  currentHp: 100,
  maxEnergy: 3,
  currentEnergy: 3,
  block: 0,
  strength: 0,
  gold: 99,
  deck: [],
  hand: [],
  discardPile: [],
  drawPile: [],
  relics: [],
  potions: [],
  powers: {},
  echoes: 0,
  cardsPlayedThisTurn: 0,
  attacksPlayedThisTurn: 0,
  typesPlayedThisTurn: [],
  relicCounters: {},
  turnFlags: {},
  imageData: '',
  floatingText: null,
  nextTurnEnergy: 0,
  nextTurnDraw: 0,
  codexBuffer: [],
};

const savedMainState = {
  screen: 'MAP',
  mode: 'MULTIPLICATION',
  visualTheme: 'elementary',
  answerMode: 'CHOICE',
  difficultyLevel: 1,
  shopRemoveCount: 0,
  act: 1,
  floor: 3,
  turn: 0,
  map: [],
  currentMapNodeId: null,
  player,
  enemies: [],
  selectedEnemyId: null,
  narrativeLog: ['復帰テスト'],
  combatLog: [],
  rewards: [],
  selectionState: { active: false, type: 'DISCARD', amount: 0 },
  isEndless: false,
  parryState: { active: false, enemyId: null, success: false },
  activeEffects: [],
  currentStoryIndex: 0,
  actStats: { enemiesDefeated: 0, goldGained: 0, mathCorrect: 0 },
};

const key='pixel_spire_save_state_v1';
const server=await createServer({cacheDir:'node_modules/.vite-main-resume-qa',optimizeDeps:{entries:['index.html']},server:{host:'127.0.0.1',port:5290,strictPort:true,hmr:false,watch:null},logLevel:'error',plugins:[{name:'observe-resume-state',enforce:'pre',async load(id){if(id.endsWith('/src/App.tsx')){const source=await fs.readFile(id,'utf8');const at=source.lastIndexOf('\n    return (');assert(at>0);return source.slice(0,at)+'\n window.resumeQA={state:gameState,setPending:setPendingAssignmentResumeState};\n'+source.slice(at);}}}]});
await server.listen();const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
let page;try{page=await browser.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{localStorage.setItem('pixel_spire_student_profile_v1',JSON.stringify({grade:'小学1年生',schoolYear:2026,dailyAssignmentLanguageMode:'JAPANESE'}));localStorage.setItem('learning_rogue_online_ranking_initial_prompt_declined_v1','1');});await page.goto('http://127.0.0.1:5290/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.resumeQA);
// All four entrances must leave the genuine main save untouched.
await page.evaluate(({key,saved})=>localStorage.setItem(key,JSON.stringify(saved)),{key,saved:savedMainState});await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'つづきから',exact:true}).waitFor();
for(const [kind,label] of [['vr','VR'],['kart','GAKURO GP'],['golf','ゴルフ'],['rpg','RPG']]){await page.getByRole('button',{name:label,exact:true}).click();await page.locator('.assignment-letter-overlay:visible,.game-launch-title.'+kind).first().waitFor();if(await page.locator('.assignment-letter-overlay:visible').count()){await page.locator('.assignment-letter-overlay:visible').getByRole('button',{name:'あとで',exact:true}).click();await page.getByRole('button',{name:label,exact:true}).click();}await page.locator('.game-launch-title.'+kind).waitFor();await page.waitForTimeout(150);const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);assert.equal(saved.screen,'MAP',kind+' cannot overwrite main save');assert.equal(saved.player.gold,99);await page.locator('.game-launch-title.'+kind+' .game-launch-back').click();await page.getByRole('button',{name:'つづきから',exact:true}).waitFor();console.log('Preserves main save:',kind);}
// Even a stale in-memory assignment resume must not bypass storage validation.
await page.evaluate(saved=>window.resumeQA.setPending({...saved,screen:'MINI_GAME_GAKUROGEAR'}),savedMainState);await page.getByRole('button',{name:'つづきから',exact:true}).click();await page.waitForFunction(()=>window.resumeQA.state.screen==='MAP');assert.equal(await page.evaluate(()=>!!window.resumeQA.state.rpgOnline),false);assert.equal(await page.evaluate(()=>window.resumeQA.state.player.gold),99);await fs.mkdir('tmp/main-resume-qa',{recursive:true});await page.screenshot({path:'tmp/main-resume-qa/main-continue.png'});
for(const screen of ['MINI_GAME_GAKUROGEAR','GAKURO_KART','GAKURO_GOLF','RPG_ONLINE']){await page.evaluate(({key,saved,screen})=>localStorage.setItem(key,JSON.stringify({...saved,screen})),{key,saved:savedMainState,screen});await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'冒険を始める',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'つづきから',exact:true}).count(),0,screen+' legacy save cannot enable Continue');assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),null);console.log('Rejects legacy online save:',screen);}
assert.deepEqual(errors,[]);await page.screenshot({path:'tmp/main-resume-qa/no-online-continue.png'});console.log('PASS: four real game entrances preserve main Continue; Continue resumes main despite stale pending VR state; four legacy online saves disabled; no runtime errors.');}catch(error){if(page){console.log((await page.locator('body').innerText()).slice(-2500));await page.screenshot({path:'tmp/main-resume-failure.png'});}throw error;}finally{await browser.close();await server.close();}
