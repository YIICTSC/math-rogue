import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const server=await createServer({logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{name:'gp-performance-qa',configureServer(s){s.middlewares.use('/gp-performance',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml(req.url,'<html><div id="root"></div><div id="course"></div><script type="module" src="/scripts/fixtures/kart-performance.tsx"></script></html>'));});}}]});
await server.listen();const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||(process.platform==='darwin'?'chrome':undefined),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage();page.setDefaultTimeout(60000);const errors=[],glbs=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/\.glb(?:\?|$)/.test(r.url()))glbs.push(r.url());});await page.route('https://**/*',r=>r.abort());
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/gp-performance`);await page.waitForFunction(()=>window.connect);
 await page.evaluate(()=>{Object.defineProperty(navigator,'connection',{configurable:true,value:Object.assign(new EventTarget(),{downlink:20,rtt:20})});window.setQuality('high');window.connect();});
 await page.locator('[data-kart-quality="high"]').waitFor();await page.waitForTimeout(700);assert.equal(await page.locator('[data-kart-quality="minimal"]').count(),0);
 await page.evaluate(()=>window.stall());await page.locator('[data-kart-quality="minimal"]').waitFor();assert((await page.locator('button').textContent()).includes('Auto'));
 await page.evaluate(()=>window.offline());await page.locator('[data-kart-quality="high"]').waitFor();
 await page.evaluate(()=>window.connect());await page.waitForTimeout(100);await page.evaluate(()=>window.slowFrame());await page.locator('[data-kart-quality="minimal"]').waitFor();
 await page.evaluate(()=>window.connect());await page.locator('[data-kart-quality="high"]').waitFor();
 await page.evaluate(()=>{navigator.connection.rtt=600;navigator.connection.dispatchEvent(new Event('change'));});await page.locator('[data-kart-quality="minimal"]').waitFor();
 const minimal=[];for(let course=0;course<8;course++)minimal.push(await page.evaluate(course=>window.showScene('minimal',course),course));
 assert.equal(glbs.length,0,'Minimal graphics must not request scenery/hero GLBs');for(const r of minimal){assert.equal(r.players,40);assert(r.pixels<=640*360);assert.equal(r.parts,7);assert(!r.antialias&&!r.shadows&&!r.imported);}
 const low=await page.evaluate(()=>window.showScene('low'));assert(minimal[0].parts<low.parts/4);assert(minimal[0].triangles<low.triangles);console.log(JSON.stringify({minimal:minimal[0],low},null,2));
 assert.deepEqual(errors,[]);console.log('PASS: healthy/slow/reconnected/offline sessions, slow device and connection hints; all 8 courses render 40 racers with a bounded minimal GPU budget and no model downloads.');
}finally{await browser.close();await server.close();}
