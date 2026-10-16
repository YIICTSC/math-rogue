import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const injections=[
 ['gakurogear/GakuroGear.tsx','  const count =','window.qa={start,input,live,view,hud};'],
 ['gakuro-kart/GakuroKart.tsx','  const chooseLesson =','window.qa={start,room,world,setWorld,controllerInput};'],
 ['gakuro-golf/GakuroGolf.tsx','  const bonus =','window.qa={room,setView,view,club,offset,spin};'],
 ['rpg/RpgOnline.tsx','  const homeRoom=','window.qa={start,room,world,setWorld,facing};'],
];
const server=await createServer({logLevel:'error',server:{host:'127.0.0.1',port:0,watch:null,hmr:false},plugins:[{name:'controller-test-only',enforce:'pre',async load(id){const match=injections.find(([f])=>id.endsWith(f));if(!match)return;const source=await readFile(id,'utf8');assert(source.includes(match[1]));return source.replace(match[1],match[2]+'\n'+match[1]);}}]});
await server.listen();const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{localStorage.setItem('gakuro-vr-action-tutorials-v1',JSON.stringify(['collect','crouch','hold','shoot','switch','sensor','defend','decoy']));const pad=window.pad={connected:true,mapping:'standard',index:2,id:'Xbox Wireless Controller',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>pad.connected?[null,null,pad,null]:[]});});
const press=async i=>{await page.evaluate(i=>pad.buttons[i]={pressed:true,value:1},i);await page.waitForTimeout(180);await page.evaluate(i=>pad.buttons[i]={pressed:false,value:0},i);await page.waitForTimeout(180);};
const lesson={title:'Controller QA',questions:Array.from({length:12},(_,i)=>({id:String(i),mode:'ADDITION',question:'1 + 1',options:['2','1','3','4'],correct:0}))};
try{
 await mkdir('tmp/controller-gameplay',{recursive:true});
 for(const mode of ['vr','race','golf','rpg']){
  errors.length=0;await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/controller-gameplay.html?mode=${mode}`);await page.bringToFront();await page.waitForFunction(()=>!!window.qa);
  if(mode==='vr'){
   await page.evaluate(()=>qa.start(0));await page.waitForSelector('[data-gamepad-live="vr"]');await press(1);assert.equal(await page.evaluate(()=>qa.input.current.crouch),true);
   await page.evaluate(()=>pad.buttons[0]={pressed:true,value:1});await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>qa.input.current.interact),true);await page.evaluate(()=>pad.buttons[0]={pressed:false,value:0});await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>qa.input.current.interact),false);
   await page.evaluate(()=>pad.buttons[2]={pressed:true,value:1});await page.waitForTimeout(160);assert.equal(await page.evaluate(()=>qa.input.current.hold),true);await page.evaluate(()=>pad.buttons[2]={pressed:false,value:0});await page.waitForTimeout(160);assert.equal(await page.evaluate(()=>qa.input.current.hold),false);
   await press(9);await page.getByRole('button',{name:'再開',exact:true}).waitFor();await press(0);await page.waitForSelector('[data-gamepad-live="vr"]');
  }else if(mode==='race'){
   await page.evaluate(async lesson=>{await qa.start('practice',lesson);qa.room.current.start(false);},lesson);await page.waitForSelector('[data-gamepad-live="race"]');
   await page.evaluate(()=>pad.axes[0]=.8);await page.waitForTimeout(300);assert((await page.evaluate(()=>qa.controllerInput.current.steer))>.5);
   await page.evaluate(()=>pad.buttons[0]={pressed:true,value:1});await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>qa.controllerInput.current.drift),true);await page.evaluate(()=>{pad.buttons[0]={pressed:false,value:0};pad.axes[0]=0;});
  }else if(mode==='golf'){
   await page.evaluate(async()=>{const {GolfRoom}=await import('/src/mini-games/gakuro-golf/network.ts');const r=new GolfRoom(v=>qa.setView(v),()=>{});qa.room.current=r;r.practice('Controller');r.world.phase='playing';const p=r.world.players[r.selfId];p.phase='aim';p.correct=3;p.shotsLeft=3;});await page.waitForSelector('[data-gamepad-live="golf"]');
   await page.evaluate(()=>pad.axes[0]=.8);await page.waitForTimeout(350);assert((await page.evaluate(()=>qa.offset))<0);await page.evaluate(()=>pad.axes[0]=0);
   await press(5);assert.notEqual(await page.evaluate(()=>qa.club),'driver');await press(0);await page.waitForSelector('.gg-timing[data-active="true"]');await press(1);await page.waitForSelector('.gg-timing[data-active="false"]');
  }else{
   await page.evaluate(async()=>{await qa.start('practice');qa.room.current.world.started=true;qa.room.current.world.revision++;qa.setWorld({...qa.room.current.world});});await page.waitForSelector('[data-gamepad-live="rpg"]');
   await page.evaluate(()=>{window.commands=[];const send=qa.room.current.send.bind(qa.room.current);qa.room.current.send=c=>{commands.push(c);send(c);};pad.axes[0]=.8;});await page.waitForTimeout(450);assert(await page.evaluate(()=>commands.some(c=>(c.type==='move'||c.type==='voxel-move')&&c.dx)));await page.evaluate(()=>pad.axes[0]=0);
   await press(9);assert.equal(await page.locator('[data-gamepad-live="rpg"]').count(),0);
  }
  await page.screenshot({path:`tmp/controller-gameplay/${mode}.png`});
  if(mode!=='rpg'){
   await press(8);await page.getByRole('dialog',{name:'ゲームメニュー',exact:true}).waitFor();await page.evaluate(()=>{pad.axes[0]=.8;pad.connected=false;});await page.waitForTimeout(180);
   if(mode==='vr')assert.equal(await page.evaluate(()=>!!(qa.input.current.interact||qa.input.current.hold||qa.input.current.x)),false);
   if(mode==='race')assert.equal(await page.evaluate(()=>qa.controllerInput.current.steer),0);
  }
  assert.deepEqual(errors,[],mode+' browser errors');console.log('PASS '+mode+': real scene, Xbox slot 2, gameplay/menu routing, held input and release.');
 }
}finally{await browser.close();await server.close();}
