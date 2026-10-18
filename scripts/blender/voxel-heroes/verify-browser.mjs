import { chromium } from 'playwright';import fs from 'node:fs/promises';import path from 'node:path';
const root=process.argv[2]||'/workspace/artifacts/voxel-heroes';const only=process.argv[3];const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:512,height:512},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
try{
 await page.goto('http://127.0.0.1:8768/viewer.html?capture',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.ready,{timeout:60000});const cdp=await page.context().newCDPSession(page);const designs=await page.evaluate(()=>heroReview.designs);const all=[];
 for(const d of designs.filter(d=>!only||d.id===only)){
  const data=await page.evaluate(id=>heroReview.load(id),d.id);if(data.clips.map(c=>c.name).join()!=['Idle','Walk','Jump','Attack'].join())throw Error('Clip mismatch '+d.id);
  const ground=data.bounds.min[1];if(ground<-.03||ground>.04)throw Error('Feet origin '+d.id+' '+ground);
  if(data.bounds.max[1]<1.6||data.bounds.max[1]>2.1)throw Error('Scale '+d.id);
  const poses=[];
  for(const clip of data.clips){
   const samples=[];for(const fraction of [0,.25,.5,.75]){const b=await page.evaluate(({name,t})=>{heroReview.pose(name,t);return heroReview.bounds()},{name:clip.name,t:clip.duration*fraction});samples.push(b);if(![...b.min,...b.max].every(Number.isFinite))throw Error('Nonfinite animation '+d.id);if(b.max[1]>2.6||b.min[1]<-.2)throw Error('Bad animated bounds '+d.id+' '+clip.name+' '+JSON.stringify(b))}
   if(JSON.stringify(samples[0])===JSON.stringify(samples[1])&&JSON.stringify(samples[1])===JSON.stringify(samples[2]))throw Error('Frozen clip '+d.id+' '+clip.name);
   poses.push({name:clip.name,samples});
  }
  await page.evaluate(()=>heroReview.pose());
  for(const view of ['front','back','side','three-quarter','gameplay']){
   await page.evaluate(view=>heroReview.view(view),view);const img=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(path.join(root,d.id,view+'.png'),Buffer.from(img.data,'base64'));
  }
  // Four actual animation poses, checked on every model, suitable for a contact sheet.
  for(const [clip,t]of [['Idle',1],['Walk',.25],['Jump',.6],['Attack',.32]]){
   await page.evaluate(({clip,t})=>{heroReview.pose(clip,t);heroReview.view('three-quarter')},{clip,t});const img=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(path.join(root,d.id,'motion-'+clip+'.png'),Buffer.from(img.data,'base64'));
  }
  const r={...data,poses};all.push(r);console.log('HERO_VERIFIED '+d.id);
 }
 if(errors.length)throw Error(errors.join('\n'));
 await fs.writeFile(path.join(root,'browser-verification'+(only?'-'+only:'')+'.json'),JSON.stringify({models:all,errors},null,2));
}finally{await browser.close()}
