import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const shots=process.env.STUDENT_SHOTS||'tmp/wandering-student';await mkdir(shots,{recursive:true});let server,browser;
const html='<html><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><body style="margin:0"><div id="root" style="height:100dvh"></div><script type="module" src="/scripts/fixtures/wandering-student.tsx"></script></body></html>';
try{
 server=await createServer({logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{name:'student-test',enforce:'pre',configureServer(s){s.middlewares.use('/student-test',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml(req.url,html));});},transform(source,id){source=source.replace(/\r\n/g,'\n');if(id.endsWith('/useSchoolAdventure.ts'))return source.replace(' return {state:state.current',' const api={state:state.current').replace(/\n };\n}\nexport type/,'\n };\n (window as any).__adventure=api;(window as any).__bridge=b.current;return api;\n}\nexport type');if(id.endsWith('/three/scene.ts'))return source.replace('renderer.render(scene,camera);','renderer.render(scene,camera);(window as any).__scene={world,renderer,frame:f,nodes,draw};');}}]});await server.listen();
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const read=async(page,fn)=>page.evaluate(fn);
 const story=async page=>{await page.waitForFunction(()=>window.__adventure.panel==='STUDENT_STORY');for(let i=0;i<3;i++)await page.getByRole('button',{name:i<2?'次のことば':'旅を続ける',exact:true}).click();await page.waitForFunction(()=>window.__adventure.panel===null);};
 for(const game of [1,2]){
  console.log('Starting game',game);const page=await browser.newPage({viewport:{width:844,height:390}});page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.stack||String(e)));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/student-test?game=${game}`);await page.waitForFunction(()=>window.__adventure&&window.__bridge.map.length>0);
  for(const [chapter,count,id]of [['小学生編',9,'elementary-warrior'],['高校生編',9,'high-school-caretaker'],['魔法学園編',17,'magic-akari']]){
   await page.getByRole('button',{name:chapter,exact:true}).click();assert.equal(await page.locator('.student-hero-grid button').count(),count);await page.evaluate(id=>window.__adventure.setHero(id),id);await page.waitForFunction(id=>window.__adventure.selectedHero.id===id,id);assert.equal(await read(page,()=>window.__adventure.selectedHero.id),id);
  }
  console.log('Selected all chapters',game);await page.screenshot({path:`${shots}/selection-${game}.png`});
  // Decode every frame using the exact runtime draw function and verify the input map.
  const sprites=await page.evaluate(async()=>{
   const {PROTAGONISTS}=await import('/src/three/protagonistCatalog.ts');const {loadStudentSprite,drawStudentSprite,studentDirection}=await import('/src/components/school-dungeon/student/sprites.ts');
   const dirs=[[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,1],[1,-1],[-1,-1]],out=[];
   for(const h of PROTAGONISTS)for(const form of h.id.startsWith('magic-')?[false,true]:[false]){
    const im=loadStudentSprite(h.id,form);await im.decode();const signatures=[];
    for(let i=0;i<8;i++){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');const drawn=drawStudentSprite(ctx,h.id,{x:dirs[i][0],y:dirs[i][1]},0,0,128,form),data=ctx.getImageData(0,0,128,128).data;signatures.push(c.toDataURL());out.push({id:h.id,form,i,index:studentDirection({x:dirs[i][0],y:dirs[i][1]}),drawn,opaque:Array.from(data).filter((_,n)=>n%4===3).filter(v=>v>128).length,corner:data[3]});}if(new Set(signatures).size!==8)throw Error('Duplicate frame '+h.id);
   }return out;
  });assert.equal(sprites.length,416);assert(sprites.every(s=>s.drawn&&s.opaque>100&&s.corner===0&&s.i===s.index));
  await page.getByRole('button',{name:'このルールで出発',exact:true}).click();await story(page);
  assert.equal(await read(page,()=>window.__adventure.hero.id),'magic-akari');assert.deepEqual(await read(page,()=>window.__adventure.state.storySeen),[1]);
  assert((await read(page,()=>window.__bridge.inventory)).some(i=>i.type==='STUDENT_M_WAND'));
  // Milestone rewards are real equipment, awarded once; replay is read-only.
  await page.evaluate(()=>{window.__bridge.setEnemies([]);window.__adventure.openStory(1);});await story(page);const rewarded=await read(page,()=>window.__bridge.inventory.length);
  await page.evaluate(()=>window.__adventure.openStory(1,true));await page.waitForFunction(()=>window.__adventure.panel==='STUDENT_STORY');for(let i=0;i<3;i++)await page.getByRole('button',{name:i<2?'次のことば':'旅を続ける',exact:true}).click();assert.equal(await read(page,()=>window.__bridge.inventory.length),rewarded);await page.evaluate(()=>window.__adventure.setPanel(null));
  // Real transform button costs a turn, doubles both HP damage directions and changes the sheet.
  await page.evaluate(()=>{const b=window.__bridge;b.setEnemies([]);b.setPlayer(p=>({...p,hp:80,maxHp:80,attack:12,defense:4,baseAttack:12,baseDefense:4,x:12,y:12,dir:{x:1,y:0},equipment:{weapon:null,armor:null,ranged:null,accessory:null},status:{}}));b.setMap(Array.from({length:26},(_,y)=>Array.from({length:26},(_,x)=>x&&y&&x<25&&y<25?'FLOOR':'WALL')));window.__adventure.state.scene=undefined;window.__adventure.state.terrain={};window.__adventure.state.events={};Math.random=()=>.5;});await page.waitForTimeout(100);
  const beforeTurns=await read(page,()=>window.__adventure.state.floorTurns);await page.getByRole('button',{name:'変身',exact:true}).click();await page.waitForFunction(()=>window.__adventure.state.transformed===true);assert.equal(await read(page,()=>window.__adventure.state.floorTurns),beforeTurns+1);assert.equal(await read(page,()=>window.__adventure.damage(7)),14);assert.equal(await read(page,()=>window.__adventure.damage(0)),0);
  await page.screenshot({path:`${shots}/transformed-2d-${game}.png`});
  // An adjacent foe takes (12-2)*2 and its counterattack deals (9-4)*2.
  await page.evaluate(()=>window.__bridge.setEnemies([{id:991,type:'ENEMY',enemyType:'SLIME',name:'Test foe',x:13,y:12,hp:100,maxHp:100,attack:9,defense:2,xp:0,dir:{x:-1,y:0},status:{}}]));await page.waitForFunction(()=>window.__bridge.enemies.length===1);await page.keyboard.press('z');await page.waitForFunction(()=>window.__bridge.enemies[0]?.hp===80);assert.equal(await read(page,()=>window.__bridge.player.hp),70);
  const saved=await read(page,()=>JSON.parse(JSON.stringify(window.__adventure.snapshot())));assert(saved.transformed);await page.evaluate(saved=>{window.__adventure.state.transformed=false;window.__adventure.restore(saved,1);},saved);await page.waitForFunction(()=>window.__adventure.state.transformed);assert.equal(await read(page,()=>window.__adventure.hero.id),'magic-akari');
  await page.waitForFunction(()=>Object.values(localStorage).some(raw=>{try{return JSON.parse(raw)?.adventure?.transformed===true;}catch{return false;}}));await page.reload();await page.waitForFunction(()=>window.__adventure?.state.transformed&&window.__bridge.map.length>0);assert.equal(await read(page,()=>window.__adventure.hero.id),'magic-akari');
  await page.getByRole('button',{name:'2D / 3D',exact:true}).click();await page.locator('[data-school-dungeon3d="ready"][data-student-hero="magic-akari"][data-student-hero-ready="true"][data-student-transformed="true"]').waitFor();
  assert(await page.evaluate(()=>window.__scene.nodes.get('player').object.getObjectByName('LearningRogueProtagonist').userData.protagonist==='magic-akari-transformed'));await page.waitForTimeout(200);await page.screenshot({path:`${shots}/transformed-3d-${game}.png`});await page.setViewportSize({width:1100,height:800});await page.getByRole('button',{name:'Sts',exact:true}).click();await page.locator('[data-gamepad-modal] [data-student-transformed="true"][data-student-hero-ready="true"]').waitFor();await page.waitForTimeout(200);await page.screenshot({path:`${shots}/transformed-equipment-${game}.png`});await page.getByRole('button',{name:'閉じる',exact:true}).first().click();await page.setViewportSize({width:844,height:390});
  // Actual floor generation clears the form; selected identity and story history survive.
  await page.evaluate(()=>window.__bridge.descend(2));await page.waitForFunction(()=>window.__bridge.floor===2&&!window.__adventure.state.transformed);assert.equal(await read(page,()=>window.__adventure.damage(7)),7);assert.equal(await read(page,()=>window.__adventure.hero.id),'magic-akari');await page.locator('[data-student-hero-ready="true"][data-student-transformed="false"]').waitFor();
  // Persistent next-departure selection never changes an active expedition.
  await page.evaluate(()=>window.__adventure.setHero('high-school-warrior'));assert.equal(await read(page,()=>window.__adventure.hero.id),'magic-akari');assert.equal(await read(page,()=>window.__adventure.selectedHero.id),'high-school-warrior');
  await page.evaluate(()=>{window.__adventure.restore(undefined,4);});assert.equal(await read(page,()=>window.__adventure.hero.id),'high-school-warrior');assert.equal(await read(page,()=>window.__adventure.damage(7)),7);
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:`${shots}/portrait-3d-${game}.png`});assert.deepEqual(errors,[]);console.log('PASS game',game,'35 choices, 416 direction frames, story/reward replay, transform turn, real outgoing/incoming damage, snapshot, 3D form and next-floor reset');await page.close();
 }
}finally{await browser?.close();await server?.close();}
