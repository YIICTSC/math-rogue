const series=Number(process.env.SERIES||(process.argv.includes('--series=2')?2:1));
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const entry=`.chronicle-endings-test-${process.pid}.tsx`,out='tmp/chronicles-1';let server,browser;
try{
 await fs.mkdir(out,{recursive:true});
 await fs.writeFile(entry,`import React from 'react';import{createRoot}from'react-dom/client';import Game from'./src/components/${series===2?'SchoolDungeonRPG2':'SchoolDungeonRPG'}';import './src/styles.css';import * as motion from './src/components/school-dungeon/dungeons1/heroActions';import{loadD1HeroArt}from './src/components/school-dungeon/dungeons1/drawHero';import{studentPoseAtlas}from './src/components/school-dungeon/dungeons1/poseAtlas';import{loadStudentSprite,drawStudentSprite}from './src/components/school-dungeon/student/sprites';import{PROTAGONISTS}from './src/components/school-dungeon/student/content';import * as world from './src/components/school-dungeon/dungeons2/pixelWorld';Object.assign(window,{__motion:motion,__pose:studentPoseAtlas,__painted:loadD1HeroArt,__load:loadStudentSprite,__draw:drawStudentSprite,__heroes:PROTAGONISTS,__world:world});createRoot(document.getElementById('root')).render(<Game languageMode="ENGLISH" onBack={()=>{}}/>);`);
 server=await createServer({cacheDir:'node_modules/.vite-d1-art',optimizeDeps:{noDiscovery:true,include:['react','react-dom/client','react/jsx-runtime','three']},server:{host:'127.0.0.1',port:5274,hmr:false},logLevel:'error',plugins:[{name:'d1-art-fixture',enforce:'pre',transform(code,id){
  if(id.endsWith('/components/SchoolDungeonRPG.tsx'))return code.replace('  const { C0, C1, C2, C3 } = currentTheme.colors;', '(window as any).__game={inventory,player,enemies,handleMoveInput,handleActionBtn,handleItemAction,handleThrowItem,fireRangedWeapon,setMenuOpen,setShowMap};\n  const { C0, C1, C2, C3 } = currentTheme.colors;');
  if(id.endsWith('/school-dungeon/useSchoolAdventure.ts'))return code.replace(' return {known:', ' const api={known:').replace('\n };\n}\nexport type','\n };\n(window as any).__adventure=api;(window as any).__bridge=b.current;return api;\n}\nexport type');
 },configureServer(s){s.middlewares.use('/__d1',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml('/__d1',`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><style>body{margin:0}#root{height:100dvh;width:100vw}</style></head><body><div id="root"></div><script type="module" src="/${entry}"></script></body></html>`));});}}]});
 await server.listen();browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5274/__d1');await page.getByRole('button',{name:'New game',exact:true}).click();await page.getByRole('button',{name:'Begin this journey',exact:true}).click();await page.locator('.d2-pixel-town').waitFor();
 await page.locator('.town-mountains').evaluate(async e=>{const i=new Image();i.src=getComputedStyle(e).backgroundImage.slice(5,-2);await i.decode();});
 assert.equal(await page.locator('.town-facade').first().evaluate(e=>getComputedStyle(e).backgroundSize),'400% 200%');
 for(const [width,height]of [[1280,800],[390,844],[844,390]]){await page.setViewportSize({width,height});await page.waitForTimeout(150);await page.screenshot({path:`${out}/town-${width}.png`});}


 const routes=JSON.parse(await fs.readFile('assets-source/dungeons-chronicles/routes.json','utf8'));let tested=0;
 for(const route of routes.filter(r=>series===2||r.series===1))for(const branch of ['release','accord','defy']){
  await page.evaluate(({mode,branch})=>{const a=window.__adventure,b=window.__bridge;const snapshot=a.snapshot();Object.assign(snapshot,{mode,place:'DUNGEON',returned:false,rescued:false,floor:99,rescueTarget:99,pendingStory:undefined,storySeen:[1,5,10,15,20,21],town:false,scene:undefined,chronicle:{version:1,mode,heroId:a.hero.id,seen:[0,1,2],choices:{0:branch,1:branch,2:branch}}});b.setGameClear(false);a.restore(snapshot,99);}, {mode:route.id,branch});
  await page.waitForFunction(()=>!window.__bridge.gameClear);await page.evaluate(()=>window.__bridge.setGameClear(true));await page.getByRole('button',{name:'Talk with the NPC about the ending',exact:true}).click();await page.waitForFunction(()=>window.__adventure.chronicleScene?.ending);
  assert.equal(await page.evaluate(()=>window.__adventure.state.chronicle.ending),branch);assert.equal(await page.locator('.chronicle-copy h3').innerText(),route.endings.find(e=>e.id===branch).title[1]);await page.locator('.chronicle-background').evaluate(e=>e.decode());await page.locator('.chronicle-npc').evaluate(e=>e.decode());assert.equal(await page.locator('.chronicle-background').evaluate(e=>getComputedStyle(e).filter),'none');
  const clears=await page.evaluate(()=>window.__adventure.base.clears[window.__adventure.state.mode]);
  for(let i=0;i<6;i++)await page.locator('.chronicle-copy>button').click();await page.locator('.wanderer-town').waitFor();assert.equal(await page.evaluate(()=>window.__adventure.base.clears[window.__adventure.state.mode]),clears);tested++;
 }
 assert.equal(await page.evaluate(()=>window.__adventure.base.chronicleRecords.length),tested);assert.deepEqual(errors,[]);console.log('PASS: series '+series+' '+tested+' real ending completions across every available route, full-color generated art and no duplicate rewards.');
}finally{await browser?.close();await server?.close();await fs.rm(entry,{force:true});}
