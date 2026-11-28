import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.LEARNING_ROGUE_URL || 'http://127.0.0.1:5173/';
const saveKey = 'pixel_spire_save_state_v1';
const card = (id,name)=>({id,name,type:'ATTACK',rarity:'BASIC',cost:1,damage:6,description:'6ダメージ。'});
const state = {
  screen:'MAP', mode:'MULTIPLICATION', visualTheme:'elementary', answerMode:'CHOICE',
  shopRemoveCount:0, act:1, floor:3, turn:0,
  currentMapNodeId:'entry',
  map:[
    {id:'entry',x:2,y:0,type:'COMBAT',completed:true,nextNodes:['first']},
    {id:'first',x:2,y:3,type:'REST',completed:false,nextNodes:['second']},
    {id:'second',x:2,y:6,type:'REST',completed:false,nextNodes:[]},
  ],
  player:{
    id:'WARRIOR',currentHp:44,maxHp:80,maxEnergy:3,currentEnergy:3,block:0,strength:0,gold:80,
    deck:[card('first-material','はじめの一撃'),card('second-material','旅の一撃')],
    hand:[],discardPile:[],drawPile:[],relics:[],potions:[],powers:{},relicCounters:{},turnFlags:{},echoes:0,
    cardsPlayedThisTurn:0,attacksPlayedThisTurn:0,typesPlayedThisTurn:[],imageData:'',floatingText:null,
    nextTurnEnergy:0,nextTurnDraw:0,codexBuffer:[],
  },
  enemies:[],selectedEnemyId:null,narrativeLog:[],combatLog:[],rewards:[],
  selectionState:{active:false,type:'DISCARD',amount:0},isEndless:false,
  parryState:{active:false,enemyId:null,success:false},activeEffects:[],currentStoryIndex:0,
  actStats:{enemiesDefeated:0,goldGained:0,mathCorrect:0},
};

const browser = await chromium.launch({headless:true});
let page;
const errors=[];
async function openAdventure(difficultyLevel) {
  const adventure=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'ja-JP'});
  adventure.on('pageerror',error=>errors.push(error.message));
  await adventure.addInitScript(({saveKey,state})=>{
    if(!localStorage.getItem(saveKey))localStorage.setItem(saveKey,JSON.stringify(state));
    localStorage.setItem('pixel_spire_language_mode_v1','JAPANESE');
    localStorage.setItem('pixel_spire_student_profile_v1',JSON.stringify({
      grade:'小学1年',schoolYear:'2026',dailyAssignmentLanguageMode:'JAPANESE',
    }));
    localStorage.setItem('learning_rogue_online_ranking_initial_prompt_declined_v1','1');
  },{saveKey,state:{...state,difficultyLevel}});
  await adventure.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:90_000});
  return adventure;
}
async function enterSpecialEducation(adventure) {
  await adventure.getByRole('button',{name:'つづきから',exact:true}).click({timeout:30_000});
  await adventure.locator('.mode-selection-summary').getByRole('button',{name:'戻る',exact:true}).click();
  // A 99% roll distinguishes the guarantee from the normal 5% chance.
  await adventure.evaluate(()=>{Math.random=()=>0.99;});
  await adventure.locator('div[role="button"][data-gamepad-initial-choice="true"]').first().press('Enter');
  const science=adventure.locator('.rest-choice-grid').getByRole('button',{name:/理科室/});
  await science.waitFor();
  return science;
}
try {
  page=await openAdventure(9);
  const science=await enterSpecialEducation(page);
  assert(await science.isEnabled(),'The first visit opens the Science Room at the highest eligible difficulty.');
  await science.click();
  const cards=page.locator('[data-rest-mode="SYNTHESIS"] [role="button"][data-gamepad-initial-choice]');
  assert.equal(await cards.count(),2);
  await cards.nth(0).press('Enter');
  await cards.nth(1).press('Enter');
  await page.getByRole('button',{name:/実験開始/}).waitFor();
  await page.locator('[data-rest-mode="PREVIEW_SYNTHESIS"]').getByRole('button',{name:'戻る',exact:true}).click();
  await page.locator('[data-rest-mode="SYNTHESIS"]').getByRole('button',{name:'戻る',exact:true}).click();
  await page.locator('.rest-choice-grid').getByRole('button',{name:/保健室/}).click();
  await page.getByRole('button',{name:'出発する',exact:true}).click();
  await page.waitForFunction(key=>{
    const saved=JSON.parse(localStorage.getItem(key)||'{}');
    return saved.player?.completedSpecialEducation===true;
  },saveKey);
  await page.reload({waitUntil:'domcontentloaded'});
  const secondVisit=await enterSpecialEducation(page);
  assert(await secondVisit.isDisabled(),'The second rest uses the normal chance after a save and reload.');
  await page.close();
  page=await openAdventure(10);
  const closedDifficulty=await enterSpecialEducation(page);
  assert(await closedDifficulty.isDisabled(),'The first visit honors the closed Science Room at difficulty 10.');
  assert.deepEqual(errors,[]);
  console.log('PASS main-story Science Room opens on the first eligible visit, respects difficulty 10, and restores the normal chance after resume.');
} catch(error) {
  console.error('Browser errors:',errors,(await page?.locator('body').innerText({timeout:3000}).catch(()=>''))?.slice(0,1200));
  throw error;
} finally {
  await browser.close();
}
