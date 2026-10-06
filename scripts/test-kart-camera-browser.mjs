import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright';
const root = path.resolve('tmp/kart-camera-qa'); await fs.mkdir(root, { recursive: true });
await fs.writeFile(path.join(root, 'index.html'), '<html><body style="margin:0"><canvas style="width:100vw;height:100vh"></canvas><script type="module" src="./fixture.js"></script></body></html>');
await fs.writeFile(path.join(root, 'fixture.js'), `import {KartScene} from '/src/mini-games/gakuro-kart/scene.ts';import {createRace,addRacer} from '/src/mini-games/gakuro-kart/engine.ts';import {getTrack,sampleTrack} from '/src/mini-games/gakuro-kart/track.ts';import * as T from 'three';window.world=createRace(1);addRacer(world,'self','Self');world.phase='race';world.players.self.x=0;window.scene=new KartScene(document.querySelector('canvas'),world,'self',false,()=>{window.failed=true},'low');window.track=getTrack(1);window.sampleTrack=sampleTrack;window.T=T;window.ready=true;function frame(now){if(!window.paused){scene.setWorld(world);scene.draw(now);}requestAnimationFrame(frame)}requestAnimationFrame(frame);`);
const server = await createServer({configFile:false,cacheDir:'node_modules/.vite-kart-camera-qa',optimizeDeps:{entries:['tmp/kart-camera-qa/index.html']},logLevel:'error',server:{host:'127.0.0.1',port:5199,strictPort:true}}); await server.listen();
const browser = await chromium.launch({headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
  const page = await browser.newPage({viewport:{width:1280,height:800}}), errors=[];
  page.setDefaultTimeout(60000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:5199/tmp/kart-camera-qa/index.html', {waitUntil:'domcontentloaded',timeout:120000}); await page.waitForFunction(()=>window.ready);await page.waitForFunction(()=>Number(document.querySelector('canvas').dataset.blenderModels)>0);assert(Number(await page.locator('canvas').getAttribute('data-blender-animations'))>0);await page.waitForFunction(()=>document.querySelector('canvas').dataset.characterStyle==='blender-storybook');
  const slopes=await page.evaluate(()=>{
    const points=track.points.map((p,i)=>({...p,distance:i/1024*track.length}));
    return [points.reduce((a,b)=>a.ty>b.ty?a:b).distance,points.reduce((a,b)=>a.ty<b.ty?a:b).distance,points.reduce((a,b)=>a.y>b.y?a:b).distance];
  });
  for(const [index,distance] of slopes.entries()) {
    await page.evaluate(distance=>{world.players.self.distance=distance;scene.smoothed.clear();scene.cameraReady=false;},distance);
    await page.waitForTimeout(250);
    const clearance=await page.evaluate(()=>{
      const road=scene.scene.children.find(o=>o.isMesh&&o.geometry?.attributes.position.count===2050&&o.material?.map);
      const ray=new T.Raycaster(new T.Vector3(scene.camera.position.x,scene.camera.position.y+1000,scene.camera.position.z),new T.Vector3(0,-1,0));
      const hit=ray.intersectObject(road)[0];
      return hit?scene.camera.position.y-hit.point.y:null;
    });
    assert(clearance!==null&&clearance>=2.79,`Road penetration at slope ${index}: ${clearance}`);
    assert.equal(await page.evaluate(()=>!!window.failed),false);
    await page.evaluate(()=>window.paused=true);await page.screenshot({path:path.join(root,`slope-${index}.png`)});await page.evaluate(()=>window.paused=false);
  }
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);await page.evaluate(()=>window.paused=true);await page.screenshot({path:path.join(root,'slope-phone.png')});
  assert.deepEqual(errors,[]);
  console.log('Course two ascent, descent and crest: real 3D road raycasts confirm camera clearance; desktop and phone rendering passed.');
} finally {await browser.close();await server.close();}
