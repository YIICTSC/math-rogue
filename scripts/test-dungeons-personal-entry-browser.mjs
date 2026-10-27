import {waitForConversationArt} from './helpers/dialogue.mjs';
import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {createServer} from 'vite';import {chromium} from 'playwright';
const entry=`.dungeons-revision-${process.pid}.tsx`,out='tmp/dungeons-optional-npcs';let server,browser;
try{
 await fs.mkdir(out,{recursive:true});await fs.writeFile(entry,`import React from'react';import{createRoot}from'react-dom/client';import D1 from'./src/components/SchoolDungeonRPG';import D2 from'./src/components/SchoolDungeonRPG2';import'./src/styles.css';import{audioService as audio}from'./src/services/audioService';audio.playBGM=async()=>{};audio.playDungeonChronicleVoiceFile=async()=>false;audio.canPlayConversationVoice=()=>false;for(const m of ['playSound','playBattleSound','playAttackEffectSound','playStatusEffectSound','playDungeonsAbilitySound'])audio[m]=()=>{};createRoot(document.getElementById('root')).render(new URLSearchParams(location.search).get('game')==='2'?<D2 languageMode="ENGLISH" onBack={()=>{}}/>:<D1 languageMode="ENGLISH" onBack={()=>{}}/>);`);
 server=await createServer({logLevel:'error',cacheDir:'node_modules/.vite-dungeons-optional-npcs',optimizeDeps:{noDiscovery:true,include:['react','react-dom/client','react-dom','react/jsx-runtime','three']},server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{name:'revision',enforce:'pre',transform(code,id){if(/\/components\/SchoolDungeonRPG2?\.tsx$/.test(id))return code.replace(/^  const \{ C0, C1, C2, C3 \} = currentTheme.colors;$/m,` (window as any).__game={player,enemies,inventory,map,menuOpen,shopState,setShopState,setGameOver,setMenuOpen,setPlayer,setEnemies,setInventory,setFloorItems,setTraps,setMap,setFloor,handleActionBtn,handleMoveInput,handleItemAction,handleShopAction,renderGame,visualEffects};\n  const { C0, C1, C2, C3 } = currentTheme.colors;`);if(id.endsWith('/school-dungeon/useSchoolAdventure.ts'))return code.replace(' return {known:', ' const api={known:').replace('\n };\n}\nexport type','\n };\n(window as any).__adventure=api;(window as any).__bridge=b.current;return api;\n}\nexport type');},configureServer(s){s.middlewares.use('/__revision',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml(req.url,`<meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><div id="root" style="height:100dvh;width:100vw"></div><script type="module" src="/${entry}"></script>`));});}}]});await server.listen();browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];page.setDefaultTimeout(60000);page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});page.on('dialog',d=>d.accept());
 const url=`http://127.0.0.1:${server.httpServer.address().port}/__revision`;
 const routes=JSON.parse(await fs.readFile('src/components/school-dungeon/chronicles/routes.json','utf8'));
 for(const game of [1,2]){
  await page.goto(url+'?game='+game);await page.getByRole('button',{name:'New game',exact:true}).click();await page.getByRole('button',{name:'Begin this journey',exact:true}).click();await page.locator('.d2-pixel-town').waitFor();
  await page.evaluate(()=>window.__adventure.departRoute('STORY'));
  await page.locator('.dialogue-student').waitFor();await waitForConversationArt(page);
  assert.equal(await page.locator('.conversation-actor').count(),1,'personal story uses only the protagonist portrait');
  assert.equal(await page.locator('.conversation-portrait').getAttribute('data-portrait'),await page.evaluate(()=>window.__adventure.hero.id));
  assert((await page.locator('.conversation-landscape').evaluate(e=>getComputedStyle(e).backgroundImage)).includes('/background/story.webp'));
  assert.equal(await page.evaluate(()=>Object.values(window.__adventure.state.events).some(e=>e.kind==='PERSONAL')),false);
  assert.equal(await page.evaluate(()=>window.__adventure.townBuildings.some(e=>e.kind==='PERSONAL_NPC')),false);
  const saved=await page.evaluate(()=>window.__adventure.snapshot());assert.equal(saved.pendingStory,0);
  await page.locator('.dialogue-student .conversation-primary').click();assert.equal(await page.evaluate(()=>window.__adventure.state.pendingStoryLine),1);
  const total=Number((await page.locator('.conversation-speaker small').innerText()).split('/')[1]);for(let i=1;i<total;i++)await page.locator('.dialogue-student .conversation-primary').click();await page.locator('.dialogue-student').waitFor({state:'detached'});
  assert(await page.evaluate(()=>window.__adventure.state.storySeen.includes(1)));
  await page.waitForTimeout(250);assert.equal(await page.locator('.dialogue-student').count(),0,'completed stories do not reopen');
  const hero=await page.evaluate(()=>window.__adventure.hero.id);
  await page.evaluate(({saved,hero})=>{const a=window.__adventure;a.restore({...saved,heroId:hero,pendingStoryLine:1},1);},{saved,hero});
  await page.locator('.dialogue-student').waitFor();assert.equal(await page.locator('.conversation-speaker small').innerText(),`2 / ${total}`);
  await page.waitForTimeout(350);await page.screenshot({path:`${out}/personal-entry-${game}.png`});
  await page.getByRole('button',{name:'Resume',exact:true}).click();
  await page.evaluate(()=>{const a=window.__adventure,s=a.snapshot();delete s.pendingStory;delete s.pendingStoryLine;a.restore({...s,place:'RELAY',town:true,storySeen:[1]},5);});
  await page.locator('.dialogue-student').waitFor();assert.equal(await page.evaluate(()=>window.__adventure.storyAct.floor),5,'milestone story starts on arrival in the relay town');
  await page.getByRole('button',{name:'Back to town',exact:true}).click();await page.waitForTimeout(200);assert.equal(await page.locator('.dialogue-student').count(),0,'closing a story does not reopen it on the same arrival');
  console.log(`PASS Dungeons ${game}: arrival story, protagonist portrait, no story NPC, progress and restored dialogue.`);
 }
 assert.deepEqual(errors,[]);
}finally{await browser?.close();await server?.close();await fs.rm(entry,{force:true});}
