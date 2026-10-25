import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const hero=process.argv.find(arg=>arg.startsWith('--hero='))?.slice(7)||'elementary-warrior';
const entry=`.d1-mastery-test-${process.pid}.tsx`,out='tmp/d1-mastery';let server,browser;
try{
 await fs.mkdir(out,{recursive:true});
 await fs.writeFile(entry,`import React from 'react';import{createRoot}from'react-dom/client';import Game from'./src/components/SchoolDungeonRPG';import './src/styles.css';import * as motion from './src/components/school-dungeon/dungeons1/heroActions';import{loadD1HeroArt}from './src/components/school-dungeon/dungeons1/drawHero';import{studentPoseAtlas}from './src/components/school-dungeon/dungeons1/poseAtlas';import{loadStudentSprite,drawStudentSprite}from './src/components/school-dungeon/student/sprites';import{PROTAGONISTS}from './src/components/school-dungeon/student/content';import * as world from './src/components/school-dungeon/dungeons2/pixelWorld';Object.assign(window,{__motion:motion,__pose:studentPoseAtlas,__painted:loadD1HeroArt,__load:loadStudentSprite,__draw:drawStudentSprite,__heroes:PROTAGONISTS,__world:world});createRoot(document.getElementById('root')).render(<Game languageMode="ENGLISH" onBack={()=>{}}/>);`);
 server=await createServer({cacheDir:'node_modules/.vite-d1-art',optimizeDeps:{noDiscovery:true,include:['react','react-dom/client','react/jsx-runtime','three']},server:{host:'127.0.0.1',port:5274,hmr:false},logLevel:'error',plugins:[{name:'d1-art-fixture',enforce:'pre',transform(code,id){
  if(id.endsWith('/components/SchoolDungeonRPG.tsx'))return code.replace('  const { C0, C1, C2, C3 } = currentTheme.colors;', '(window as any).__game={inventory,player,enemies,map,attackEnemy,turns:turnCounter.current,handleMoveInput,handleActionBtn,handleItemAction,handleThrowItem,fireRangedWeapon,setMenuOpen,setShowMap};\n  const { C0, C1, C2, C3 } = currentTheme.colors;');
  if(id.endsWith('/school-dungeon/useSchoolAdventure.ts'))return code.replace(' return {known:', ' const api={known:').replace('\n };\n}\nexport type','\n };\n(window as any).__adventure=api;(window as any).__bridge=b.current;return api;\n}\nexport type');
 },configureServer(s){s.middlewares.use('/__d1',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml('/__d1',`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><style>body{margin:0}#root{height:100dvh;width:100vw}</style></head><body><div id="root"></div><script type="module" src="/${entry}"></script></body></html>`));});}}]});
 await server.listen();browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5274/__d1');await page.getByRole('button',{name:'New game',exact:true}).click();await page.evaluate(id=>window.__adventure.setHero(id),hero);await page.waitForFunction(id=>window.__adventure.selectedHero.id===id,hero);await page.getByRole('button',{name:'Begin this journey',exact:true}).click();await page.locator('.d2-pixel-town').waitFor();assert.equal(await page.evaluate(()=>window.__adventure.hero.id),hero);await page.evaluate(async id=>{await window.__painted(id).decode();},hero);

 await page.getByRole('button',{name:'Techniques',exact:true}).last().click();
 assert.equal(await page.locator('.d1-weapon-tabs button').count(),11);
 for(const [width,height]of [[1280,800],[390,844],[844,390]]){await page.setViewportSize({width,height});await page.screenshot({path:`${out}/mastery-${width}.png`});assert(await page.locator('.d1-mastery').evaluate(e=>e.scrollWidth<=e.clientWidth+1));}
 await page.getByRole('button',{name:'Back to town',exact:true}).click();
 await page.evaluate(()=>window.__bridge.setPlayer(p=>({...p,gold:10000})));
 await page.waitForFunction(()=>window.__bridge.player.gold===10000);
 await page.evaluate(()=>window.__adventure.townAction('SHOP','D1_TRAINING_BOW'));
 await page.waitForFunction(()=>window.__bridge.inventory.some(i=>i.type==='D1_TRAINING_BOW'));
 assert.equal(await page.evaluate(()=>window.__bridge.inventory.find(i=>i.type==='D1_TRAINING_BOW').weaponKind),'bow');
 await page.evaluate(()=>window.__adventure.beginDojo(1));
 assert.equal(await page.evaluate(()=>window.__adventure.practiceMartialAttack()),null,'dojo does not grant permanent combat mastery');
 await page.evaluate(()=>{window.__adventure.exitDojo();window.__adventure.setPanel(null);});
 await page.evaluate(()=>window.__adventure.departRoute('STORY'));await page.waitForFunction(()=>window.__adventure.state.place==='DUNGEON');
 await page.evaluate(()=>{const a=window.__adventure,b=window.__bridge;a.setPanel(null);Object.assign(a.state,{place:'DUNGEON',mode:'STORY',floor:2,floorTurns:10,town:false,scene:undefined,terrain:{},events:{},pendingStory:undefined,chronicle:{version:1,mode:'STORY',heroId:a.hero.id,seen:[0,1,2],choices:{}},storySeen:[1]});const map=Array.from({length:26},(_,y)=>Array.from({length:26},(_,x)=>x>1&&x<14&&y>1&&y<12?'FLOOR':'WALL'));map[9][11]='STAIRS';b.setMap(map);b.setPlayer(p=>({...p,x:6,y:7,hp:5000,maxHp:5000,attack:10,defense:500,status:{},dir:{x:1,y:0},equipment:{weapon:{id:'training',type:'D1_TRAINING_SWORD',name:'Practice sword',category:'WEAPON',weaponKind:'sword',power:4},armor:null,ranged:null,accessory:null}}));b.setEnemies([{id:991,type:'ENEMY',enemyType:'SLIME',x:7,y:7,hp:50000,maxHp:50000,attack:1,defense:0,baseAttack:1,baseDefense:0,xp:1,name:'Sentinel',dir:{x:1,y:0},status:{sleep:0,frozen:0,confused:0,poison:0}}]);b.setFloorItems([]);b.setTraps([]);Math.random=()=>0;});
 await page.waitForFunction(()=>!window.__adventure.abilityBlocked&&window.__game.enemies.some(e=>e.id===991)&&window.__bridge.player.equipment.weapon?.weaponKind==='sword');
 const before=await page.evaluate(()=>window.__adventure.state.floorTurns);
 await page.waitForFunction(()=>!window.__adventure.blocksInput());
 await page.evaluate(()=>window.__game.handleActionBtn());
 await page.waitForFunction(()=>window.__adventure.martialProgress.weaponXp.sword===1);
 assert.equal(await page.evaluate(()=>window.__adventure.state.floorTurns),before+1,'normal input spends exactly one turn');
 await page.evaluate(()=>{for(let i=0;i<35;i++)window.__game.attackEnemy(window.__game.enemies.find(e=>e.id===991));});
 await page.waitForFunction(()=>window.__adventure.martialProgress.learned.includes('sword-2'));
 const sword=await page.evaluate(()=>window.__adventure.martialProgress);
 assert.equal(sword.weaponXp.sword,36);assert.deepEqual(sword.learned,['sword-1','sword-2']);assert.equal(sword.selected.sword,'sword-2');assert.equal(sword.techniqueUses['sword-1'],30);
 await page.screenshot({path:out+'/breakthrough.png'});
 await page.evaluate(()=>window.__adventure.selectMartialTechnique('sword','sword-1'));await page.waitForFunction(()=>window.__adventure.martialProgress.selected.sword==='sword-1');
 const previous=await page.evaluate(()=>JSON.stringify(window.__adventure.martialProgress));
 await page.evaluate(()=>window.__game.attackEnemy({...window.__game.enemies[0],enemyType:'SHOPKEEPER'}));
 assert.equal(await page.evaluate(()=>JSON.stringify(window.__adventure.martialProgress)),previous,'shopkeeper attack awards no mastery');
 await page.evaluate(()=>window.__bridge.setPlayer(p=>({...p,equipment:{...p.equipment,weapon:null}})));await page.waitForFunction(()=>!window.__bridge.player.equipment.weapon);
 await page.evaluate(()=>{for(let i=0;i<6;i++)window.__game.attackEnemy(window.__game.enemies.find(e=>e.id===991));});await page.waitForFunction(()=>window.__adventure.martialProgress.learned.includes('fist-1'));
 assert.equal(await page.evaluate(()=>window.__adventure.martialProgress.weaponXp.sword),36);
 await page.evaluate(()=>{const b=window.__bridge;b.setPlayer(p=>({...p,equipment:{...p.equipment,weapon:{id:'bow',type:'D1_TRAINING_BOW',name:'Bow',category:'WEAPON',weaponKind:'bow',power:4}}}));b.setEnemies(b.enemies.map(e=>({...e,x:10,y:7})));});
 await page.waitForFunction(()=>window.__bridge.player.equipment.weapon?.weaponKind==='bow'&&window.__game.enemies[0]?.x===10);
 await page.evaluate(()=>window.__game.handleActionBtn());await page.waitForFunction(()=>window.__adventure.martialProgress.weaponXp.bow===1);
 // A wall blocks the ranged attack and an empty swing does not train.
 await page.evaluate(()=>{const b=window.__bridge;b.setEnemies(b.enemies.map(e=>({...e,x:10,y:7})));b.setMap(m=>m.map((row,y)=>row.map((v,x)=>x===7&&y===7?'WALL':v)));});await page.waitForFunction(()=>window.__game.map[7][7]==='WALL'&&window.__game.enemies[0]?.x===10);

 await page.evaluate(()=>window.__game.handleActionBtn());
 assert.equal(await page.evaluate(()=>window.__adventure.martialProgress.weaponXp.bow),1);
 // The same attack can hit a group but trains exactly once, and spares neutral merchants.
 await page.evaluate(()=>{const a=window.__adventure,b=window.__bridge,p=a.base.martial[a.hero.id];p.weaponXp.fist=200;p.learned.push('fist-4');a.selectMartialTechnique('fist','fist-4');b.setPlayer(p=>({...p,equipment:{...p.equipment,weapon:null}}));const cells=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];b.setEnemies(cells.map(([dx,dy],i)=>({id:1000+i,type:'ENEMY',enemyType:i===7?'SHOPKEEPER':'SLIME',x:6+dx,y:7+dy,hp:500,maxHp:500,attack:1,defense:0,baseAttack:1,baseDefense:0,xp:1,name:'Group target',dir:{x:1,y:0},status:{}})));});
 await page.waitForFunction(()=>window.__adventure.martialProgress.selected.fist==='fist-4'&&!window.__game.player.equipment.weapon&&window.__game.enemies.length===8);
 await page.evaluate(()=>window.__game.attackEnemy(window.__game.enemies.find(e=>e.id===1000)));
 await page.waitForFunction(()=>window.__adventure.martialProgress.weaponXp.fist===201);

 await page.waitForFunction(()=>window.__game.enemies.some(e=>e.hp<500),{},{timeout:5000});
 assert.equal(await page.evaluate(()=>window.__game.enemies.filter(e=>e.enemyType!=='SHOPKEEPER'&&e.hp<500).length),7);
 assert.equal(await page.evaluate(()=>window.__game.enemies.find(e=>e.enemyType==='SHOPKEEPER').hp),500);
 await page.screenshot({path:out+'/area-technique.png'});
 await page.evaluate(()=>window.__adventure.setPanel('MASTERY'));await page.getByRole('button',{name:/Sword Lv/}).click();await page.screenshot({path:out+'/learned-techniques.png'});
 const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('learning-rogue:school-base:1')).martial['elementary-warrior']);assert(persisted.learned.includes('fist-1'));assert.equal(persisted.selected.sword,'sword-1');
 await page.reload();await page.waitForFunction(()=>window.__adventure);
 assert.equal(await page.evaluate(()=>window.__adventure.base.martial['elementary-warrior'].weaponXp.sword),36,'progress survives reload');
 assert.deepEqual(errors,[]);
 console.log('PASS: real D1 combat trains once per turn, ordered breakthroughs auto-select, selected techniques and unarmed progress persist through reload, bow reaches ranged foes and stops at walls, shopkeepers/dojo/empty swings give no mastery, town sells new weapons, responsive mastery UI.');
}finally{await browser?.close();await server?.close();await fs.rm(entry,{force:true});}
