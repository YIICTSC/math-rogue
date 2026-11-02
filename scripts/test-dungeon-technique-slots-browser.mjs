import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const entry=`.technique-slots-${process.pid}.tsx`,out='tmp/technique-slots';let server,browser;
try{
 await fs.mkdir(out,{recursive:true});
 await fs.writeFile(entry,`import React from 'react';import{createRoot}from'react-dom/client';import D1 from'./src/components/SchoolDungeonRPG';import D2 from'./src/components/SchoolDungeonRPG2';import './src/styles.css';createRoot(document.getElementById('root')).render(new URLSearchParams(location.search).get('series')==='2'?<D2 languageMode="ENGLISH" onBack={()=>{}}/>:<D1 languageMode="ENGLISH" onBack={()=>{}}/>);`);
 server=await createServer({cacheDir:'node_modules/.vite-technique-slots',optimizeDeps:{noDiscovery:true,include:['react','react-dom/client','react/jsx-runtime','three']},server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error',plugins:[{name:'technique-fixture',enforce:'pre',transform(code,id){
  if(/\/components\/SchoolDungeonRPG2?\.tsx$/.test(id))return code.replace('  const { C0, C1, C2, C3 } = currentTheme.colors;', '(window as any).__game={player,enemies,map,attackEnemy,useMartialTechnique,handleActionBtn};\n  const { C0, C1, C2, C3 } = currentTheme.colors;');
  if(id.endsWith('/school-dungeon/useSchoolAdventure.ts'))return code.replace(' return {known:', ' const api={known:').replace('\n };\n}\nexport type','\n };\n(window as any).__adventure=api;(window as any).__bridge=b.current;return api;\n}\nexport type');
 },configureServer(s){s.middlewares.use('/__techniques',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml('/__techniques',`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><style>body{margin:0}#root{height:100dvh;width:100vw}</style></head><body><div id="root"></div><script type="module" src="/${entry}"></script></body></html>`));});}}]});
 await server.listen();browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const series of (process.argv.includes('--d2')?[2]:[1,2])){
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(60000);
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__techniques?series=${series}`,{timeout:180000,waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'New game',exact:true}).click();await page.getByRole('button',{name:'Begin this journey',exact:true}).click();await page.locator('.d2-pixel-town').waitFor();
 await page.evaluate(()=>window.__adventure.departRoute('STORY'));await page.waitForFunction(()=>window.__adventure.state.place==='DUNGEON');
 await page.evaluate(()=>{const a=window.__adventure,b=window.__bridge;a.setPanel(null);Object.assign(a.state,{place:'DUNGEON',mode:'STORY',floor:2,floorTurns:10,town:false,scene:undefined,terrain:{},events:{},pendingStory:undefined,chronicle:{version:1,mode:'STORY',heroId:a.hero.id,seen:[0,1,2],choices:{}},storySeen:[1],techniqueGauge:0});b.setMap(Array.from({length:26},(_,y)=>Array.from({length:26},(_,x)=>x>1&&x<14&&y>1&&y<12?'FLOOR':'WALL')));b.setPlayer(p=>({...p,x:6,y:7,hp:5000,maxHp:5000,attack:10,defense:500,status:{},dir:{x:1,y:0},equipment:{weapon:{id:'training',type:'D1_TRAINING_SWORD',name:'Practice sword',category:'WEAPON',weaponKind:'sword',power:4},armor:null,ranged:null,accessory:null}}));b.setEnemies([{id:991,type:'ENEMY',enemyType:'SLIME',x:7,y:7,hp:50000,maxHp:50000,attack:1,defense:0,baseAttack:1,baseDefense:0,xp:1,name:'Sentinel',dir:{x:1,y:0},status:{}}]);b.setFloorItems([]);b.setTraps([]);Math.random=()=>0;});
 await page.waitForFunction(()=>!window.__adventure.abilityBlocked&&window.__game.enemies.some(e=>e.id===991)&&window.__bridge.player.equipment.weapon?.weaponKind==='sword');
 await page.evaluate(()=>{for(let i=0;i<6;i++)window.__game.attackEnemy(window.__game.enemies.find(e=>e.id===991));});
 await page.waitForFunction(()=>window.__adventure.martialProgress.learned.includes('sword-1'));
 assert.equal(await page.evaluate(()=>window.__adventure.techniqueGauge),100);
 assert.equal(await page.evaluate(()=>window.__adventure.martialProgress.techniqueUses['sword-1']),1,'discovery is a free single activation');
 await page.evaluate(()=>window.__game.attackEnemy(window.__game.enemies.find(e=>e.id===991)));
 await page.waitForFunction(()=>window.__adventure.martialProgress.weaponXp.sword===7);
 assert.equal(await page.evaluate(()=>window.__adventure.martialProgress.techniqueUses['sword-1']),1,'normal attacks no longer automatically use learned techniques');
 const before=await page.evaluate(()=>window.__adventure.state.floorTurns);
 const result=await page.evaluate(()=>[window.__game.useMartialTechnique('sword-1'),window.__game.useMartialTechnique('sword-1')]);assert.deepEqual(result,[true,false],'same-frame taps consume one technique only');
 await page.waitForFunction(()=>window.__adventure.martialProgress.techniqueUses['sword-1']===2);
 assert.equal(await page.evaluate(()=>window.__adventure.techniqueGauge),70);assert.equal(await page.evaluate(()=>window.__adventure.state.floorTurns),before+1);
 // Leave native D2 skills independent of the new TP system.
 if(series===2)assert.equal(await page.locator('.student-ability-button:visible').count(),3);
 await page.evaluate(()=>{const a=window.__adventure,p=a.base.martial[a.hero.id];p.learned.push('sword-2');p.techniqueUses['sword-2']=0;a.selectMartialTechnique('sword','sword-1');a.setTechniqueSlot('sword',1,'sword-2');});
 await page.waitForFunction(()=>window.__adventure.martialProgress.slots.sword[1]==='sword-2');
 await page.evaluate(()=>window.__adventure.setTechniqueSlot('sword',0,'sword-2'));await page.waitForFunction(()=>window.__adventure.martialProgress.slots.sword[0]==='sword-2');
 assert.equal(await page.evaluate(()=>window.__adventure.martialProgress.slots.sword[1]),'sword-1','slot reassignment swaps without duplicates');
 // Long press opens detail; it must not fire when released.
 const uses=await page.evaluate(()=>window.__adventure.martialProgress.techniqueUses['sword-2']);const slot=page.locator('.technique-shortcut').first();await slot.dispatchEvent('pointerdown');await page.waitForTimeout(500);await slot.dispatchEvent('pointerup');await slot.dispatchEvent('click');await page.getByRole('dialog',{name:'Discovered techniques',exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>window.__adventure.martialProgress.techniqueUses['sword-2']),uses);assert.equal(await page.locator('.technique-modal nav button').count(),11);
 await page.screenshot({path:`${out}/d${series}-menu.png`});await page.getByRole('button',{name:'Close ×'}).click();
 for(const [width,height]of [[390,844],[844,390],[1280,800]]){await page.setViewportSize({width,height});await page.waitForTimeout(200);const rect=await page.locator('.dungeon-technique-bar').boundingBox();assert(rect.x>=0&&rect.x+rect.width<=width+1);const style=await page.locator('.dungeon-log-strip').evaluate(e=>({bg:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color}));assert.deepEqual(style,{bg:'rgb(0, 0, 0)',color:'rgb(255, 255, 255)'});await page.screenshot({path:`${out}/d${series}-${width}.png`});}
 await page.evaluate(()=>{window.__adventure.state.techniqueGauge=0;window.__adventure.setPanel(null);});await page.waitForFunction(()=>window.__adventure.techniqueGauge===0);const snapshot=await page.evaluate(()=>({turn:window.__adventure.state.floorTurns,uses:window.__adventure.martialProgress.techniqueUses['sword-1']}));assert.equal(await page.evaluate(()=>window.__game.useMartialTechnique('sword-1')),false);assert.deepEqual(await page.evaluate(()=>({turn:window.__adventure.state.floorTurns,uses:window.__adventure.martialProgress.techniqueUses['sword-1']})),snapshot);
 assert.deepEqual(errors,[]);await page.close();console.log('PASS D'+series+': free discovery, manual TP consumption, double-tap guard, slot swap, long press, responsive layout, black/white logs, existing ability separation.');
 }
}finally{await browser?.close();await server?.close();await fs.rm(entry,{force:true});}
