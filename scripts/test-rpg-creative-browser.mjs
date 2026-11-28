import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const baseUrl=process.env.LEARNING_ROGUE_URL||'http://127.0.0.1:5173/';
const output=process.env.RPG_MACHINERY_QA||'tmp/rpg-creative-qa';
const vite=await createServer({
  optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error',
});
let browser,page;
const errors=[];
try{
  const {createWorld,addPlayer}=await vite.ssrLoadModule('/src/rpg/engine.ts');
  const {openCreativeWorld}=await vite.ssrLoadModule('/src/rpg/creative.ts');
  const seed=230023,now=Date.now();
  const normal=createWorld(seed,undefined,0,now);
  addPlayer(normal,'local','Normal save');
  const character={id:'WARRIOR',currentHp:72,maxHp:72,gold:100,deck:[],relics:[]};
  assert(!normal.creative);
  const preview=structuredClone(normal);
  openCreativeWorld(preview,preview.players.local);
  assert(preview.players.local.life.bag.crystal_wire>100);
  assert.notEqual(preview.players.local.life.bag.crystal_wire,normal.players.local.life.bag.crystal_wire);
  await vite.close();
  await mkdir(output,{recursive:true});
  browser=await chromium.launch({headless:true,executablePath:process.env.RPG_QA_BROWSER,
    args:['--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader']});
  page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'ja-JP'});
  page.setDefaultTimeout(40000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    localStorage.setItem('pixel_spire_language_mode_v1','JAPANESE');
    localStorage.setItem('pixel_spire_student_profile_v1',JSON.stringify({
      grade:'小学1年',schoolYear:'2026',dailyAssignmentLanguageMode:'JAPANESE',
    }));
    localStorage.setItem('learning_rogue_online_ranking_initial_prompt_declined_v1','1');
  });
  await page.goto(baseUrl,{waitUntil:'domcontentloaded'});
  await page.evaluate(save=>new Promise((resolve,reject)=>{
    const request=indexedDB.open('learning-rogue-rpg-world',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('saves');
    request.onerror=()=>reject(request.error);
    request.onsuccess=()=>{
      const db=request.result,tx=db.transaction('saves','readwrite');
      tx.objectStore('saves').put(save,'latest');
      tx.oncomplete=()=>{db.close();resolve(null);};
      tx.onerror=()=>reject(tx.error);
    };
  }),{version:1,savedAt:now,selfId:'local',world:normal,player:character});
  async function openTitle(){
    await page.getByRole('button',{name:'RPG',exact:true}).click();
    const title=page.locator('[data-game-title="rpg"]'),later=page.getByRole('button',{name:'あとで',exact:true});
    await title.or(later).first().waitFor();
    if(await later.isVisible())await later.click();
    await title.waitFor();
  }
  const workshop=page.getByRole('button',{name:'創造工房',exact:true});
  const flight=page.locator('.rpg-creative-controls');
  const button=(name,region=page)=>region.getByRole('button',{name,exact:true});
  const altitude=async()=>Number((await flight.locator('span').innerText()).split(' ').at(-1));
  await openTitle();
  await page.setViewportSize({width:844,height:390});
  await workshop.waitFor();
  await page.screenshot({path:join(output,'creative-title-landscape.png')});
  await page.setViewportSize({width:390,height:844});
  await workshop.click();
  await page.locator('.rpg-hero-content .character-selection-card[role="button"]').first().press('Enter');
  await button('飛行',flight).click();
  const ground=await altitude();
  await button('上昇',flight).click();
  await page.waitForFunction(value=>document.querySelector('.rpg-creative-controls span')?.textContent===`Y ${value}`,ground+1);
  await page.waitForTimeout(140);
  await page.keyboard.press('Space');
  await page.waitForFunction(value=>document.querySelector('.rpg-creative-controls span')?.textContent===`Y ${value}`,ground+2);
  await page.screenshot({path:join(output,'creative-flight-2d.png')});
  await button('2D / 3D').click();
  const canvas=page.getByTestId('rpg-world-3d');
  await canvas.waitFor();
  await page.keyboard.press('KeyC');
  await page.waitForFunction(value=>document.querySelector('.rpg-creative-controls span')?.textContent===`Y ${value}`,ground+1);
  const measured=Number(await canvas.getAttribute('data-camera-y'));
  assert(Number.isFinite(measured)&&measured>ground+1);
  await page.screenshot({path:join(output,'creative-flight-3d.png')});
  await button('着地',flight).click();
  await button('飛行',flight).waitFor();
  await button('部屋と操作の詳細').click();
  await button('保存してRPGタイトルへ').click();
  await workshop.waitFor();
  const saved=await page.evaluate(async()=>new Promise((resolve,reject)=>{
    const request=indexedDB.open('learning-rogue-rpg-world',1);
    request.onerror=()=>reject(request.error);
    request.onsuccess=()=>{
      const db=request.result,tx=db.transaction('saves','readonly'),store=tx.objectStore('saves');
      const adventure=store.get('latest'),creative=store.get('creative');
      tx.oncomplete=()=>{db.close();resolve({latest:adventure.result,creative:creative.result});};
      tx.onerror=()=>reject(tx.error);
    };
  }));
  assert.equal(saved.latest?.world.seed,seed);
  assert.deepEqual(saved.latest?.world.players.local.life.bag,normal.players.local.life.bag);
  assert.equal(saved.creative?.world.creative,true);
  assert(saved.creative.world.players.local.life.bag.crystal_wire>=512);
  assert.equal(Object.keys(saved.creative.world.rankingAwards).length,0);
  await page.reload({waitUntil:'domcontentloaded'});
  await openTitle();
  await workshop.click();
  await button('飛行',flight).waitFor();
  assert.deepEqual(errors,[]);
  console.log('PASS production Creative Workshop title, hero selection, 2D/3D flight, landing, separate IndexedDB save and resume.');
}catch(error){
  console.error(errors,(await page?.locator('body').innerText({timeout:3000}).catch(()=>''))?.slice(0,900));
  throw error;
}finally{
  await browser?.close();
  await vite.close();
}
