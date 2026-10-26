import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';

const entry=`.dialogue-ui-${process.pid}.tsx`,out='tmp/dialogue/review';
let server,browser;
try{
 await fs.mkdir(out,{recursive:true});
 await fs.writeFile(entry,`import React,{useState}from'react';import{createRoot}from'react-dom/client';import Stage from'./src/components/dialogue/ConversationStage';import{useXboxControllerNavigation}from'./src/hooks/useXboxControllerNavigation';import'./src/styles.css';import'./src/components/school-dungeon/adventure.css';import'./src/components/school-dungeon/chronicles/chronicles.css';
 function App(){useXboxControllerNavigation();const[open,setOpen]=useState(false),[step,setStep]=useState(0),[choices,setChoices]=useState(false),[theme,setTheme]=useState<'sea'|'dungeon'>('sea');const moods=['neutral','joy','concern','resolve']as const;Object.assign(window,{__setChoices:setChoices,__setTheme:setTheme,__step:step,__close:()=>setOpen(false)});return <><button id="open" onClick={()=>setOpen(true)}>Open conversation</button>{open&&<Stage title="潮風の約束" eyebrow="STAR TIDE · ENCOUNTER" theme={theme} background="sprites/star-tide/events/0.webp" left={{id:'star-nagi',name:'ナギ',reaction:moods[step%4]}} right={{id:'star-towa',name:'トワ',reaction:moods[(step+1)%4]}} active={step%2?'left':'right'} speaker={step%2?'ナギ':'トワ'} text={choices?'The sea remembers every promise. We can share the burden, return what was taken, or discover another route. '+('There is still a way forward, together. ').repeat(12):'なくした灯を、もう一度つなぎたい。きっと、この海の向こうに答えがあるよ。'} lineKey={String(step)+choices} progress={String(step%4+1)+' / 4'} onClose={()=>setOpen(false)} closeLabel="Close">{choices?<div className="conversation-choice-group chronicle-choices">{['Let go and return what was taken','Share the burden and remake the promise','Refuse the dilemma and make another road'].map((label,i)=><button key={label} data-gamepad-initial-choice={i===0} onClick={()=>{(window as any).__choice=i;setOpen(false);}}><strong>{label}</strong><small>{'We will face the consequences and continue the journey together. '.repeat(2)}</small></button>)}</div>:<><button id="replay" onClick={()=>{(window as any).__replay=((window as any).__replay||0)+1;}}>Replay voice</button><button id="next" autoFocus data-gamepad-initial-choice className="conversation-primary" onClick={()=>setStep(v=>v+1)}>Next</button></>}</Stage>}</>};createRoot(document.getElementById('root')).render(<App/>);`);
 server=await createServer({logLevel:'error',cacheDir:'node_modules/.vite-dialogue-ui',optimizeDeps:{noDiscovery:true,include:['react','react-dom/client','react-dom','react/jsx-runtime']},server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{name:'dialogue-fixture',configureServer(s){s.middlewares.use('/__dialogue',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml('/__dialogue',`<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>html,body,#root{height:100%;margin:0}</style><div id="root"></div><script type="module" src="/${entry}"></script>`));});}}]});
 await server.listen();browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__pad={id:'Xbox test controller',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__pad]});});
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__dialogue`);
 await page.locator('#open').click();await page.locator('[data-conversation-stage]').waitFor();
 await page.locator('.conversation-portrait image').evaluateAll(async imgs=>Promise.all(imgs.map(async el=>{const i=new Image();i.src=el.getAttribute('href');await i.decode();})));
 assert.equal(await page.locator('[role="dialog"]').count(),1);
 assert(await page.locator('#next').evaluate(e=>e===document.activeElement),'advance retains initial focus');
 await page.keyboard.press('Tab');assert(await page.locator('.conversation-header button').evaluate(e=>e===document.activeElement),'Tab wraps within the dialogue');
 await page.keyboard.press('Shift+Tab');assert(await page.locator('#next').evaluate(e=>e===document.activeElement));
 for(let step=0;step<4;step++){
  assert.equal(await page.locator('[data-portrait="star-nagi"]').getAttribute('data-reaction'),['neutral','joy','concern','resolve'][step]);
  assert.equal(await page.locator('[data-portrait="star-nagi"] image').getAttribute('x'),String(-step*384));
  if(step<3)await page.locator('#next').click();
 }
 assert.equal(await page.evaluate(()=>window.__step),3);
 await page.evaluate(()=>{Object.assign(window.__pad.buttons[0],{pressed:true,touched:true,value:1});});await page.waitForFunction(()=>window.__step===4);await page.evaluate(()=>{Object.assign(window.__pad.buttons[0],{pressed:false,touched:false,value:0});});await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.__step),4,'controller A advances once instead of closing or replaying');
 for(const[theme,color]of[['sea','rgb(185, 222, 210)'],['dungeon','rgb(212, 185, 132)']]){await page.evaluate(v=>window.__setTheme(v),theme);await page.locator('#next').hover();assert.equal(await page.locator('#next').evaluate(el=>getComputedStyle(el).backgroundColor),color,'advance button keeps a readable highlight while hovered');}await page.evaluate(()=>window.__setTheme('sea'));
 await page.locator('#replay').click();assert.equal(await page.evaluate(()=>window.__replay),1);
 for(const[width,height]of[[390,844],[320,568],[844,390],[1280,800]]){
  await page.setViewportSize({width,height});
  for(const choices of[false,true]){
   await page.evaluate(v=>window.__setChoices(v),choices);await page.waitForTimeout(220);
   const bounds=await page.locator('[data-conversation-stage]').boundingBox();assert(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=width+1&&bounds.y+bounds.height<=height+1);
   const script=await page.locator('.conversation-script').boundingBox(),cast=await page.locator('.conversation-cast').boundingBox();
   assert(script.height>=Math.min(90,height*.2)&&script.y+script.height<=height+1,`readable conversation card at ${width}x${height}: ${JSON.stringify(script)}`);
   assert(cast.height>=80,'portraits keep a visible stage');
   assert(await page.locator('.conversation-text').evaluate(el=>el.clientHeight>=20&&el.scrollWidth<=el.clientWidth+1),'long text stays scrollable without horizontal clipping');
   const buttons=page.locator('.conversation-actions button');
   for(let i=0;i<await buttons.count();i++){await buttons.nth(i).scrollIntoViewIfNeeded();const b=await buttons.nth(i).boundingBox();assert(b.x>=0&&b.x+b.width<=width+1&&b.y>=0&&b.y+b.height<=height+1,'every action is reachable');}
   await page.screenshot({path:`${out}/${choices?'choices':'dialogue'}-${width}.png`});
  }
 }
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.conversation-text').evaluate(el=>getComputedStyle(el).animationName),'none');
 await page.keyboard.press('Escape');await page.locator('[data-conversation-stage]').waitFor({state:'detached'});assert(await page.locator('#open').evaluate(el=>el===document.activeElement),'close restores the launcher focus');
 await page.locator('#open').click();await page.evaluate(()=>{Object.assign(window.__pad.buttons[1],{pressed:true,touched:true,value:1});});await page.locator('[data-conversation-stage]').waitFor({state:'detached'});await page.evaluate(()=>{Object.assign(window.__pad.buttons[1],{pressed:false,touched:false,value:0});});await page.waitForTimeout(100);
 await page.locator('#open').click();await page.locator('.conversation-choice-group button').nth(2).click();assert.equal(await page.evaluate(()=>window.__choice),2);assert.equal(await page.locator('[data-conversation-stage]').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: inward-facing reaction atlas frames, single dialogue portal, keyboard focus/escape, controller A/B, action callbacks, reduced motion, scrollable long text and reachable choices at 320/390 portrait, phone landscape and desktop.');
}finally{await browser?.close();await server?.close();await fs.rm(entry,{force:true});}
