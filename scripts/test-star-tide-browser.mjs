import {createServer} from 'vite';import {chromium} from 'playwright';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const entry=`.star-tide-${process.pid}.tsx`;let server,browser;
try{await fs.writeFile(entry,`import React from 'react';import{createRoot}from'react-dom/client';import Game from './src/mini-games/star-tide/StarTide';import './src/styles.css';import{GameMode}from './src/types';createRoot(document.getElementById('root')).render(<div className="app-shell ios-edge-active"><div className="app-screen-stage" style={{position:'relative',width:'100%',height:'100%'}}><div className="absolute inset-0"><Game onBack={()=>{(window as any).__left=true;}} problemMode={GameMode.ADDITION} languageMode={location.search.includes('en')?'ENGLISH':undefined}/></div></div></div>);`);
server=await createServer({logLevel:'error',cacheDir:'node_modules/.vite-star-tide-tests',optimizeDeps:{noDiscovery:true,include:['react','react-dom/client','react/jsx-runtime']},server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{name:'fixture',enforce:'pre',transform(code,id){if(id.endsWith('/star-tide/StarTide.tsx'))return code.replace('const w=world.current;','const w=world.current;(window as any).__starWorld=w;');},configureServer(s){s.middlewares.use('/__star',async(req,res)=>res.end(await s.transformIndexHtml('/__star',`<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>html,body,#root{height:100%;margin:0}</style><div id="root"></div><script type="module" src="/${entry}"></script>`)));}}]});await server.listen();browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1000,height:1000}}),errors=[];page.setDefaultNavigationTimeout(60000);page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__star`);await page.getByRole('button',{name:/航海を(?:続ける|はじめる)/}).click();await page.getByRole('button',{name:'人と記憶をつなぐ',exact:true}).click();await page.waitForTimeout(500);const startX=await page.evaluate(()=>window.__starWorld.x);const before=await page.locator('canvas').screenshot();await page.keyboard.down('ArrowRight');await page.waitForTimeout(500);await page.keyboard.up('ArrowRight');const after=await page.locator('canvas').screenshot();assert(!before.equals(after));assert(await page.evaluate(x=>window.__starWorld.x>x+.5,startX));await page.keyboard.press('Escape');await page.getByRole('heading',{name:'冒険手帳'}).waitFor();const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('learning-rogue:star-tide:v1')));assert.equal(saved.choices[0],1);await page.getByRole('button',{name:'再開',exact:true}).click();await fs.mkdir('tmp/star-tide',{recursive:true});for(const [width,height]of[[1000,1000],[390,844],[844,390]]){await page.setViewportSize({width,height});await page.screenshot({path:`tmp/star-tide/${width}.png`});assert(await page.locator('.st-stick').isVisible());const pad=await page.locator('.st-stick').boundingBox();await page.mouse.move(pad.x+pad.width/2,pad.y+pad.height/2);await page.mouse.down();await page.mouse.move(pad.x+pad.width*.7,pad.y+pad.height/2);await page.waitForTimeout(100);await page.mouse.up();assert.equal(await page.locator('.st-stick span').evaluate(el=>el.style.transform),'translate(0px, 0px)');}
await page.reload();await page.getByRole('button',{name:/航海を(?:続ける|はじめる)/}).click();assert.equal(await page.getByRole('heading',{name:'消えた潮の音'}).count(),0);await page.evaluate(()=>{window.__fakePad={connected:true,mapping:'standard',axes:[1,0,0,0],buttons:Array.from({length:17},()=>({pressed:false}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.__fakePad]});});const padX=await page.evaluate(()=>window.__starWorld.x);await page.waitForFunction(x=>window.__starWorld.x>x+.35,padX);await page.evaluate(()=>{window.__fakePad.axes[0]=0;window.__fakePad.buttons[0].pressed=true;});await page.waitForFunction(()=>window.__starWorld.attack>0);await page.evaluate(()=>{window.__fakePad.buttons[0].pressed=false;window.__fakePad.buttons[9].pressed=true;});await page.getByRole('heading',{name:'冒険手帳'}).waitFor();await page.getByRole('button',{name:'再開',exact:true}).click();await page.waitForTimeout(100);assert.equal(await page.getByRole('heading',{name:'冒険手帳'}).count(),0);await page.evaluate(()=>window.__fakePad.buttons[9].pressed=false);await page.evaluate(()=>{window.__starWorld.s.beacons=[0];window.__starWorld.s.glideAwakened=true;});await page.getByRole('button',{name:'滑空 G',exact:true}).click();assert(await page.evaluate(()=>window.__starWorld.gliding));await page.screenshot({path:'tmp/star-tide/glide.png'});await page.getByRole('button',{name:'滑空 G',exact:true}).click();assert.equal(await page.evaluate(()=>window.__starWorld.gliding),false);await page.evaluate(()=>{const w=window.__starWorld;w.x=15.5;w.y=10.5;w.s.hp=1;w.s.inventory.apple=2;w.dirty=true;});await page.getByRole('button',{name:'冒険手帳',exact:true}).click();await page.getByRole('tab',{name:/料理/}).click();const meals=await page.evaluate(()=>window.__starWorld.s.inventory.meal);await page.getByRole('button',{name:/焼きりんご/}).click();assert.equal(await page.evaluate(()=>window.__starWorld.s.inventory.meal),meals+1);assert.equal(await page.evaluate(()=>window.__starWorld.s.inventory.apple),0);await page.getByRole('button',{name:/料理を食べる/}).click();assert.equal(await page.evaluate(()=>window.__starWorld.s.hp),6);await page.screenshot({path:'tmp/star-tide/cooking.png'});await page.getByRole('button',{name:'再開',exact:true}).click();await page.evaluate(()=>{const w=window.__starWorld;w.s.beacons=[0];w.s.glideAwakened=true;w.dirty=true;});await page.getByRole('button',{name:'冒険手帳',exact:true}).click();await page.getByRole('tab',{name:/地図/}).click();await page.getByRole('button',{name:/^9\./}).click();await page.getByRole('heading',{name:'鳴らない鐘',exact:true}).waitFor();await page.getByRole('button',{name:'人と記憶をつなぐ',exact:true}).click();assert.equal(await page.evaluate(()=>window.__starWorld.s.chapter),8);await page.screenshot({path:'tmp/star-tide/free-island.png'});
await page.addInitScript(()=>{const seed=sessionStorage.getItem('star-test-seed');if(seed){localStorage.setItem('learning-rogue:star-tide:v1',seed);sessionStorage.removeItem('star-test-seed');}});for(const scenario of ['blocks','beam','circuit','circuit-npc','ice','boss','question','ending']){await page.evaluate(scenario=>{const s=JSON.parse(localStorage.getItem('learning-rogue:star-tide:v1'));Object.assign(s,{chapter:11,maxChapter:11,unlockedTools:7,ownedTools:[0,1,2,3,4,5,6,7],tool:7,room:scenario==='blocks'?9:scenario==='beam'?11:scenario==='circuit'?8:scenario==='circuit-npc'?12:scenario==='ice'?19:23,choices:Array(12).fill(1),glideAwakened:true,beacons:scenario==='ending'?Array.from({length:12},(_,i)=>i):Array.from({length:11},(_,i)=>i),ending:scenario==='ending',gate:scenario==='question'?'11:23':null,cleared:[],solved:[]});sessionStorage.setItem('star-test-seed',JSON.stringify(s));},scenario);await page.reload();await page.getByRole('button',{name:/航海を(?:続ける|はじめる)/}).click();await page.waitForTimeout(400);if(scenario==='question'){assert(await page.locator('.st-question').isVisible());await page.locator('.st-question .main-challenge-screen').waitFor({state:'visible'});if(await page.locator('.unit-board-close').isVisible())await page.locator('.unit-board-close').click();await page.screenshot({path:'tmp/star-tide/question-loaded.png'});await page.getByRole('button',{name:'保存して一覧へ',exact:true}).click();assert(await page.evaluate(()=>window.__left));assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('learning-rogue:star-tide:v1')).gate),'11:23');}if(scenario==='ending')await page.getByRole('heading',{name:'明日へ続く航路'}).waitFor();if(scenario.startsWith('circuit')){const initial=await page.evaluate(()=>{const w=window.__starWorld;w.x=7.5;w.y=3.5;w.enemies=[];return w.circuit.bits;});await page.keyboard.press('z');await page.waitForTimeout(100);const changed=await page.evaluate(()=>window.__starWorld.circuit.bits);assert.notEqual(changed,initial);await page.reload();await page.getByRole('button',{name:/航海を(?:続ける|はじめる)/}).click();assert.equal(await page.evaluate(()=>window.__starWorld.circuit.bits),changed);}await page.screenshot({path:`tmp/star-tide/${scenario}.png`});}// Graphics QA exercises the actual renderer with deterministic, paused fixture states.
await page.evaluate(()=>{
 const s=JSON.parse(localStorage.getItem('learning-rogue:star-tide:v1'));
 Object.assign(s,{chapter:0,room:0,ending:false,gate:null,choices:Array(12).fill(1)});
 sessionStorage.setItem('star-test-seed',JSON.stringify(s));
});
await page.setViewportSize({width:1000,height:1000});await page.reload();
assert.equal(await page.getByRole('group',{name:'操作する仲間'}).count(),0);
assert.equal(await page.evaluate(()=>window.__starWorld.s.hero),'nagi');
await page.screenshot({path:'tmp/star-tide/title-nagi.png'});
await page.getByRole('button',{name:/航海を(?:続ける|はじめる)/}).click();
await page.getByRole('button',{name:'冒険手帳',exact:true}).click();
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('learning-rogue:star-tide:v1')).hero),'nagi');
await page.getByRole('button',{name:'再開',exact:true}).click();
await page.evaluate(async()=>{
 const names=['hero-nagi-walk','hero-nagi-profile','hero-nagi-combo','hero-nagi-tools','hero-nagi','hero-mio','hero-sena','hero-nagi-vertical','hero-mio-vertical','hero-sena-vertical','enemies-a','enemies-b','enemies-c','boss-motion','terrain','props','floors','shore-rounding','cliff-rounding'];
 await Promise.all(names.map(name=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i.naturalWidth);i.onerror=()=>reject(new Error('Missing graphics '+name));i.src='/sprites/star-tide/'+name+'.webp';})));
 window.__starWorld.tick=()=>{};
});
await fs.mkdir('tmp/star-tide/graphics',{recursive:true});
for(let c=0;c<12;c++)for(let variant=0;variant<2;variant++){
 await page.evaluate(({c,variant})=>{const w=window.__starWorld;Object.assign(w.s,{chapter:c,room:variant?2:1,hero:'nagi',gate:null});w.enter();Object.assign(w,{x:10.5,y:7.5,hurt:0,attack:0,time:2,dx:1,dy:0});},{c,variant});
 await page.waitForTimeout(60);
 await page.locator('canvas').screenshot({path:`tmp/star-tide/graphics/biome-${c}-${variant}.png`});
}
for(let c=0;c<12;c++){
 await page.evaluate(c=>{const w=window.__starWorld;Object.assign(w.s,{chapter:c,room:3});w.enter();w.map=Array.from({length:14},()=>Array(20).fill(0));for(let y=3;y<=10;y++)for(let x=5;x<=14;x++)if(!(x<9&&y<7)&&!(x>11&&y>8))w.map[y][x]=2;Object.assign(w,{x:3.5,y:7.5,enemies:[],hurt:0,attack:0});},c);
 await page.waitForTimeout(50);await page.locator('canvas').screenshot({path:`tmp/star-tide/graphics/rounded-shore-${c}.png`});
}
for(const hero of ['nagi']){
 await page.evaluate(hero=>{const w=window.__starWorld;Object.assign(w.s,{hero,chapter:1,room:1});w.enter();w.enemies=[];Object.assign(w,{x:10.5,y:7.5,time:0,hurt:0,dash:0,attack:0,gliding:false,moving:true,walk:0,dx:1,dy:0});},hero);
 await page.waitForTimeout(50);const a=await page.locator('canvas').screenshot();
 await page.evaluate(()=>window.__starWorld.walk=.25);await page.waitForTimeout(50);const b=await page.locator('canvas').screenshot();assert(!a.equals(b),hero+' must animate its walk');
 await page.evaluate(()=>{const w=window.__starWorld;w.moving=false;w.attack=.14;w.dy=-1;w.dx=0;});await page.waitForTimeout(50);const up=await page.locator('canvas').screenshot();assert(!b.equals(up));
 await page.locator('canvas').screenshot({path:`tmp/star-tide/graphics/${hero}-up-attack.png`});
 await page.evaluate(()=>{const w=window.__starWorld;w.dy=1;});await page.waitForTimeout(50);const down=await page.locator('canvas').screenshot();assert(!up.equals(down),'Up/down must use different body frames');
 await page.locator('canvas').screenshot({path:`tmp/star-tide/graphics/${hero}-down-attack.png`});
}
for(let c=0;c<12;c++){
 await page.evaluate(c=>{const w=window.__starWorld;Object.assign(w.s,{chapter:c,room:23});w.enter();w.enemies[0].strike=.25;w.x=8.5;w.y=7.5;w.attack=0;w.hurt=0;},c);
 await page.waitForTimeout(50);await page.locator('canvas').screenshot({path:`tmp/star-tide/graphics/boss-${c}.png`});
}
// Draw the whole actual enemy catalog in four battle-sized groups, with action poses.
for(let group=0;group<4;group++){
 await page.evaluate(group=>{const w=window.__starWorld;Object.assign(w.s,{chapter:group*3,room:0});w.enter();w.map=Array.from({length:14},(_,y)=>Array.from({length:20},(_,x)=>x===0||y===0||x===19||y===13?3:0));w.enemies=Array.from({length:6},(_,i)=>({kind:group*6+i,x:5+i%3*5,y:4.5+Math.floor(i/3)*4,hp:8,max:8,cool:1,phase:i*.2,moving:true,strike:i%2?.25:0,windup:i%2?0:.4}));w.x=10;w.y=11;w.attack=0;w.hurt=0;},group);
 await page.waitForTimeout(60);await page.locator('canvas').screenshot({path:`tmp/star-tide/graphics/enemies-${group}.png`});
}
for(const [width,height] of [[390,844],[844,390]]){
 await page.setViewportSize({width,height});await page.screenshot({path:`tmp/star-tide/graphics/responsive-${width}.png`});
 assert(await page.locator('.st-stick').isVisible());assert(await page.getByRole('button',{name:'A 装備武器・調べる'}).isVisible());
}
for(const [width,height] of [[360,640],[390,844],[430,932],[844,390],[932,430]]){
 await page.setViewportSize({width,height});await page.waitForTimeout(100);
 const field=await page.locator('.st-screen').boundingBox();assert(field.width>width*.96,'Field should fill phone width');
 assert(field.height>height*(width>height?.8:.45),'Field should use remaining height');
 for(const selector of ['.st-stick','.st-buttons','.st-glide']){
  const b=await page.locator(selector).boundingBox();assert(b.x>=0&&b.y>=0&&b.x+b.width<=width+1&&b.y+b.height<=height+1,selector+' outside phone viewport');
 }
 const scroll=await page.evaluate(()=>({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight}));assert(scroll.w<=width&&scroll.h<=height,'No page scrolling during play');
 await page.screenshot({path:`tmp/star-tide/graphics/phone-${width}.png`});
}
const english=await browser.newPage({viewport:{width:390,height:844}});english.on('pageerror',e=>errors.push(e.message));
await english.goto(`http://127.0.0.1:${server.httpServer.address().port}/__star?en`);
await english.getByRole('button',{name:/Continue voyage|Begin voyage/}).waitFor();
assert.equal(await english.getByRole('group',{name:'Playable crew'}).count(),0);
await english.screenshot({path:'tmp/star-tide/graphics/english-title.png'});await english.close();
const touchContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});
const touch=await touchContext.newPage();touch.on('pageerror',e=>errors.push(e.message));await touch.goto(`http://127.0.0.1:${server.httpServer.address().port}/__star`);
await touch.getByRole('button',{name:/航海を(?:続ける|はじめる)/}).click();await touch.getByRole('button',{name:'人と記憶をつなぐ',exact:true}).click();
assert.equal(await touch.evaluate(()=>innerWidth),390);const cssField=await touch.locator('canvas').boundingBox();assert(cssField.width>380);
assert.equal(await touch.locator('canvas').evaluate(e=>e.width),Math.round(cssField.width*2));
await touch.evaluate(()=>{window.__starWorld.s.beacons=[0];window.__starWorld.s.glideAwakened=true;});await touch.getByRole('button',{name:'滑空 G',exact:true}).tap();assert(await touch.evaluate(()=>window.__starWorld.gliding));
await touch.screenshot({path:'tmp/star-tide/graphics/touch-portrait.png'});await touch.setViewportSize({width:844,height:390});await touch.waitForTimeout(100);
assert.equal(await touch.evaluate(()=>window.__starWorld.s.chapter),0);assert((await touch.locator('canvas').boundingBox()).width>830);
await touch.screenshot({path:'tmp/star-tide/graphics/touch-landscape.png'});
await touch.evaluate(()=>document.documentElement.classList.add('app-platform-ios'));await touch.waitForTimeout(100);
const iosWide=await touch.locator('.st-screen').boundingBox();assert(iosWide.width>830,'iOS global padding must not shrink the field');
const iosPad=await touch.locator('.st-stick').boundingBox();assert(iosPad.x>=62,'iOS notch controls stay inset');
await touch.screenshot({path:'tmp/star-tide/graphics/ios-landscape.png'});
await touch.setViewportSize({width:390,height:844});await touch.waitForTimeout(100);
const iosTall=await touch.locator('.st-screen').boundingBox();assert(iosTall.width>=386);assert(iosTall.y>=96&&iosTall.y<120,'iOS top inset applies exactly once');
const iosButtons=await touch.locator('.st-buttons').boundingBox();assert(iosButtons.y+iosButtons.height<=810,'iOS home indicator remains clear');
await touch.screenshot({path:'tmp/star-tide/graphics/ios-portrait.png'});
await touch.getByRole('button',{name:'冒険手帳',exact:true}).tap();const head=await touch.locator('.st-pouch-head').boundingBox(),foot=await touch.locator('.st-pouch-footer').boundingBox();assert(head.y>=62&&foot.y+foot.height<=810,'iOS journal controls stay inside safe bounds');await touch.getByRole('button',{name:'再開',exact:true}).tap();
await touch.evaluate(()=>{const w=window.__starWorld;w.s.room=3;w.enter();w.s.gate='0:3';});await touch.locator('.st-question-head').waitFor();
const leave=await touch.getByRole('button',{name:'保存して一覧へ',exact:true}).boundingBox();assert(leave.y>=62,'Learning exit stays below the iOS notch');
await touchContext.close();


assert.deepEqual(errors,[]);console.log('PASS: boot/story, keyboard/analog/native pad, held-menu guard, glide, cooking, free island order, five mechanism views, partial save, questions, ending and three viewports; 24 biome views, Nagi and boss animations, all 24 enemy species, translated weapon loadouts; zero browser exceptions.');
}finally{await browser?.close();await server?.close();await fs.rm(entry,{force:true});}
