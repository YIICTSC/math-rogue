import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const baseline=process.argv.includes('--baseline'),responsive=process.argv.includes('--responsive-only'),dir=`tmp/kart-scenery-${responsive?'responsive':baseline?'before':'after'}`;await mkdir(dir,{recursive:true});
const previous=existsSync('tmp/kart-scenery-before/report.json')?JSON.parse(readFileSync('tmp/kart-scenery-before/report.json','utf8')):[];
const vite=await createServer({configFile:false,define:{__APP_ASSET_VERSION__:JSON.stringify('kart-scenery-audit'),'import.meta.env.VITE_LARGE_ASSET_BASE_URL':JSON.stringify('/')},server:{host:'127.0.0.1',port:0,watch:null,hmr:false},logLevel:'error'});await vite.listen();
let browser;
try{
 const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
 browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:existsSync(chrome)?{executablePath:chrome}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[],reports=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(60000);
 await page.goto(`http://127.0.0.1:${vite.httpServer.address().port}/scripts/fixtures/kart-scenery-audit.html`);await page.waitForFunction(()=>window.courseNames);
 for(const quality of baseline||responsive?['low']:['low','high'])for(const course of responsive?[1,7]:Array.from({length:8},(_,i)=>i)){
  await page.evaluate(({course,quality})=>window.showCourse(course,quality),{course,quality});await page.waitForFunction(()=>window.modelsReady());
  await page.waitForFunction(()=>document.querySelector('canvas').dataset.characterStyle==='blender-storybook');
  await page.evaluate(()=>window.pauseCourse());
  const report=await page.evaluate(()=>window.auditScenery());assert(report.modelsReady&&!report.modelsFailed,'GLB scenery loaded');reports.push({quality,...report});
  const prior=previous.find(r=>r.course===course);
  const fraction=report.blockers.length?report.blockers[0].segment/1024:prior?.blockers.length?prior.blockers[0].segment/1024:.64;
  const views=responsive?[[390,844],[844,390]]:[[1280,800]];
  for(const [width,height]of views){await page.setViewportSize({width,height});
  for(const [label,at]of responsive?[['bend',fraction]]:[['start',0],['bend',fraction],['return',.88]]){
   await page.evaluate(at=>window.seekCourse(at),at);await page.waitForTimeout(120);await page.screenshot({path:`${dir}/${quality}-course-${course+1}-${label}.png`});
   if(responsive)await page.screenshot({path:`${dir}/course-${course+1}-${width}.png`});
   if(course===1)assert(Number(await page.locator('canvas').getAttribute('data-blender-animations'))>0,'Keep animated windmills in Cloud Garden');
  }
  }
  console.log(`${report.name} (${quality}): ${report.blockers.length} road overlaps / ${report.checked} scenery parts`);
  await writeFile(`${dir}/report.json`,JSON.stringify(reports,null,2));
 }
 await writeFile(`${dir}/report.json`,JSON.stringify(reports,null,2));
 if(!baseline)for(const report of reports)assert.equal(report.blockers.length,0,`${report.name} (${report.quality}) road scenery overlaps`);
 assert.deepEqual(errors,[]);
}finally{await browser?.close();await vite.close();}
