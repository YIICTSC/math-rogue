import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';

const entry=`.dodge-layout-${process.pid}.tsx`,errors=[];
let server,browser;
try {
 await fs.mkdir('tmp/dodgeball-layout',{recursive:true});
 await fs.writeFile(entry,`
import React from 'react';
import {createRoot} from 'react-dom/client';
import Dodgeball from './src/mini-games/dodgeball/Dodgeball';
import * as E from './src/mini-games/dodgeball/engine';
import * as T from 'three';
import {defaultAvatar} from './src/mini-games/gakuro-kart/avatar';
import {audioService as audio} from './src/services/audioService';
import './src/styles.css';
const release=()=>{};release.update=()=>{};audio.acquireBgmScene=()=>release;audio.playSound=()=>{};
const w=E.createDodgeball(1,true),params=new URLSearchParams(location.search);
E.addPlayer(w,'local','Nagi');
const factory=()=>({title:'Addition',questions:[0,1,2].map(i=>({id:'q'+i,mode:'ADDITION',question:'1+1',options:['0','1','2','3'],correct:2}))});
E.startDodgeball(w,factory);
while(w.players.local.quiz){const q=w.players.local.quiz;E.command(w,'local',{type:'answer',id:q.id,index:q.index,option:2});E.command(w,'local',{type:'continue',id:q.id,index:q.index});}
const heroes=['elementary-dodgeball','high-school-warrior','magic-warrior','elementary-caretaker','magic-cleric','elementary-assassin'];
w.matches[0].units.forEach((u,i)=>{u.avatar={...defaultAvatar(i),protagonist:heroes[i]};if(params.get('side')==='1'){u.side=1-u.side;u.y=-u.y;}});
window.__layoutView=E.viewFor(w,'local');window.T=T;
createRoot(document.getElementById('root')).render(<Dodgeball languageMode={params.get('lang')||'JAPANESE'} onClose={()=>{}}/>);
`);
 server=await createServer({
  logLevel:'error',cacheDir:'node_modules/.vite-dodge-layout',
  optimizeDeps:{noDiscovery:true,include:['react','react-dom','react-dom/client','react/jsx-runtime','three','peerjs','lucide-react']},
  server:{watch:null,host:'127.0.0.1',port:0,hmr:false},
  plugins:[{name:'dodge-layout',enforce:'pre',transform(code,id){
   if(id.endsWith('/dodgeball/Dodgeball.tsx'))return code.replace('useState<DodgeView|null>(null)','useState<DodgeView|null>((window as any).__layoutView)').replace('useSportsInvitation(inviteCode,inviteName,join);','(window as any).__setLayoutView=setView;useSportsInvitation(inviteCode,inviteName,join);');
   if(id.endsWith('/dodgeball/DodgeCanvas.tsx'))return code.replace("scene.background=new T.Color('#172f40');","scene.background=new T.Color('#172f40');(window as any).__courtCamera=camera;").replace('renderer.setSize(w,h,false);','renderer.setSize(w,h,false);(window as any).__courtSize={width:w,height:h};');
  },configureServer(s){s.middlewares.use('/__layout',async(req,res)=>res.end(await s.transformIndexHtml('/__layout',`<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>html,body,#root{height:100%;margin:0}</style><div id="root"></div><script type="module" src="/${entry}"></script>`)));}}],
 });
 await server.listen();
 const base=`http://127.0.0.1:${server.httpServer.address().port}/__layout`;
 browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});page.setDefaultTimeout(90_000);page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
 const sizes=[[320,568],[390,844],[430,932],[568,320],[844,390],[932,430],[768,1024],[1024,768],[1280,800],[1920,1080],[2560,1080]];
 for(const side of [0,1]) {
  await page.setViewportSize({width:390,height:844});
  await page.goto(`${base}?side=${side}&lang=${side===1?'ENGLISH':'JAPANESE'}`,{waitUntil:'domcontentloaded',timeout:120_000});
  await page.locator('.dg-playing').waitFor();
  await page.waitForFunction(()=>document.querySelector('.dg-canvas canvas')?.dataset.players==='6');
  await page.waitForTimeout(1500);
  console.log('Scene',side,await page.locator('.dg-canvas canvas').evaluate(e=>({...e.dataset})));
  await page.screenshot({path:'tmp/dodgeball-layout/initial.png'});
  for(const [width,height] of sizes){
   await page.setViewportSize({width,height});await page.waitForFunction(([w,h])=>window.__courtSize?.width===w&&window.__courtSize?.height===h,[width,height]);console.log('Layout',side,width,height);
   const measurements=await page.evaluate(()=>{
    const box=e=>e.getBoundingClientRect().toJSON(),root=document.querySelector('.dg-playing'),canvas=document.querySelector('.dg-canvas canvas'),frame=document.querySelector('.dg-court-frame');
    const obstacles=[...document.querySelectorAll('.dg-stick,.dg-actions button,.tn-header button,.dg-scoreboard,.dg-direction-hint')].map(e=>({name:e.className||e.textContent,box:box(e)}));
    const points=[];
    for(const x of [-9,9])for(const y of [-12.7,12.7])for(const z of [0]){
     const p=new window.T.Vector3(x,z,-y).project(window.__courtCamera);points.push({x:(p.x+1)/2*innerWidth,y:(1-p.y)/2*innerHeight});
    }
    return{camera:{left:window.__courtCamera.left,right:window.__courtCamera.right,top:window.__courtCamera.top,bottom:window.__courtCamera.bottom},root:box(root),canvas:box(canvas),frame:box(frame),obstacles,points,scroll:[root.scrollWidth,root.scrollHeight],targets:[...document.querySelectorAll('.dg-actions button,.tn-header button')].map(box)};
   });
   assert.equal(measurements.canvas.x,0);assert.equal(measurements.canvas.y,0);
   assert.equal(measurements.canvas.width,width);assert.equal(measurements.canvas.height,height);
   assert.deepEqual(measurements.scroll,[width,height],`No match overflow at ${width}×${height}`);
   const {frame}=measurements;assert(frame.width>0&&frame.height>0);

   for(const {name,box:r} of measurements.obstacles)assert(r.x>=0&&r.y>=0&&r.right<=width+.5&&r.bottom<=height+.5,`${name} must be visible at ${width}×${height}: ${JSON.stringify(r)}`);
   for(const r of measurements.targets)assert(r.width>=44&&r.height>=44,`Touch target at ${width}×${height}: ${JSON.stringify(r)}`);
   for(const p of measurements.points){
    assert(p.x>=frame.left-.5&&p.x<=frame.right+.5&&p.y>=frame.top-.5&&p.y<=frame.bottom+.5,`Court and outfields must fit at ${width}×${height}: ${JSON.stringify(p)}`);

   }
   const xs=measurements.points.map(p=>p.x),ys=measurements.points.map(p=>p.y);assert(Math.max((Math.max(...xs)-Math.min(...xs))/frame.width,(Math.max(...ys)-Math.min(...ys))/frame.height)>.99,'Court fills at least one viewport axis');
   for(let i=0;i<measurements.obstacles.length;i++)for(let j=i+1;j<measurements.obstacles.length;j++){
    const a=measurements.obstacles[i],b=measurements.obstacles[j];
    assert(!(a.box.left<b.box.right-1&&a.box.right>b.box.left+1&&a.box.top<b.box.bottom-1&&a.box.bottom>b.box.top+1),`Overlapping controls ${a.name}, ${b.name} at ${width}×${height}`);
   }
   const actions=await page.locator('.dg-actions').boundingBox();assert(actions.x+actions.width>width-50&&actions.y>height/2,'Actions stay at the lower right');
   if(side===0||width===390||width===844)await page.screenshot({path:`tmp/dodgeball-layout/match-${width}-${height}-side${side}.png`});
  }
  if(side===1)assert(!/[ぁ-んァ-ヶ一-龠]/.test(await page.locator('.dg-playing').innerText()),'English match HUD is translated');
 }
 // A different controlled team must update the camera without replacing the arena.
 await page.evaluate(()=>{const view=structuredClone(window.__layoutView);view.match.units.forEach(u=>{u.side=1-u.side;u.y=-u.y;});window.__setLayoutView(view);});
 await page.waitForFunction(()=>window.__courtCamera.position.x>0);
 // Simulate native safe areas, then resize in-place while the same match is mounted.
 await page.setViewportSize({width:844,height:390});
 await page.waitForFunction(()=>window.__courtSize?.width===844&&window.__courtSize?.height===390);
 await page.evaluate(()=>{const s=document.documentElement.style;for(const [edge,value]of Object.entries({top:24,right:44,bottom:21,left:44}))s.setProperty('--ios-ui-safe-'+edge,value+'px');});
 await page.waitForTimeout(200);
 for(const r of await page.locator('.tn-header button,.dg-actions button,.dg-stick,.dg-scoreboard').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().toJSON())))assert(r.left>=44&&r.right<=800&&r.top>=24&&r.bottom<=369,'Safe-area insets protect controls');
 await page.screenshot({path:'tmp/dodgeball-layout/safe-area-landscape.png'});
 await page.evaluate(()=>document.documentElement.removeAttribute('style'));
 await page.keyboard.press('Escape');await page.locator('.tn-modal').waitFor();
 for(const [width,height]of[[320,568],[568,320],[1280,800]]){await page.setViewportSize({width,height});const r=await page.getByRole('dialog').boundingBox();assert(r.x>=0&&r.y>=0&&r.x+r.width<=width&&r.y+r.height<=height);}
 await page.locator('.tn-modal header button').click();
 await page.waitForFunction(()=>!document.querySelector('[role=dialog]'));
 // An unowned match gets the same full-screen arena without reserving control space.
 const before=await page.locator('.dg-court-frame').boundingBox();
 await page.evaluate(()=>{const view=structuredClone(window.__layoutView);view.match.units.forEach(u=>u.owner=null);window.__setLayoutView(view);});
 await page.locator('.dg-spectating').waitFor();assert.equal(await page.locator('.dg-controls').count(),0);assert.equal((await page.locator('.dg-court-frame').boundingBox()).height,before.height);
 const fallback=await browser.newPage({viewport:{width:390,height:844}});fallback.on('pageerror',e=>errors.push(e.message));
 await fallback.addInitScript(()=>{const context=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return String(kind).includes('webgl')?null:context.call(this,kind,...args);};});
 await fallback.goto(base,{waitUntil:'domcontentloaded',timeout:120_000});await fallback.locator('.dg-fallback svg').waitFor();
 for(const [width,height]of[[390,844],[844,390],[320,568],[568,320]]){
  await fallback.setViewportSize({width,height});await fallback.waitForFunction(()=>{const f=document.querySelector('.dg-court-frame').getBoundingClientRect(),s=document.querySelector('.dg-fallback svg').getBoundingClientRect();return f.left===s.left&&f.top===s.top&&f.width===s.width&&f.height===s.height;});
  const frame=await fallback.locator('.dg-court-frame').boundingBox(),svg=await fallback.locator('.dg-fallback svg').boundingBox();
  assert.deepEqual(svg,frame,'2D fallback uses the protected court region after rotation');
  assert.equal(await fallback.locator('.dg-fallback g').getAttribute('transform'),width/height>1.3?'rotate(90)':null);
  await fallback.screenshot({path:`tmp/dodgeball-layout/fallback-${width}.png`});
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: full-screen arena, 11 phone/tablet/desktop/ultrawide sizes on both sides, edge-to-edge court/outfields, separate 44px controls, safe areas, live resize, pause menu, spectators and rotating 2D fallback.');
}finally{await browser?.close();await server?.close();await fs.rm(entry,{force:true});}
