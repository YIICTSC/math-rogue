import { chromium } from 'playwright';import fs from 'node:fs/promises';import path from 'node:path';
const root=process.argv[2],frames=path.join(root,'.demo-frames');await fs.mkdir(frames,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:512,height:512}});
try{await page.goto('http://127.0.0.1:8768/viewer.html?capture',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.ready);const cdp=await page.context().newCDPSession(page);
const demos=[['elementary-warrior','Idle'],['magic-akari','Walk'],['high-school-dodgeball','Jump'],['magic-leon','Attack']];
for(let i=0;i<demos.length;i++){const [id,clip]=demos[i];await page.evaluate(id=>heroReview.load(id),id);for(let f=0;f<24;f++){await page.evaluate(({clip,t})=>{heroReview.pose(clip,t);heroReview.view('three-quarter')},{clip,t:f*.1});const image=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(path.join(frames,`${i}-${f}.png`),Buffer.from(image.data,'base64'));}console.log('MOTION_DEMO',id,clip)}
}finally{await browser.close()}
