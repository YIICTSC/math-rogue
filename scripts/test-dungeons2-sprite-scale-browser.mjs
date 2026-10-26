import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const entry=`.d2-scale-${process.pid}.ts`;let server,browser;
try {
 await fs.mkdir('tmp/d2-scale',{recursive:true});
 await fs.writeFile(entry,`import * as sprites from './src/components/school-dungeon/student/sprites';import * as actions from './src/components/school-dungeon/dungeons2/heroActions';Object.assign(window,{sprites,actions});`);
 server=await createServer({logLevel:'error',optimizeDeps:{noDiscovery:true},server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{name:'scale-fixture',configureServer(s){s.middlewares.use('/__scale',async(req,res)=>res.end(await s.transformIndexHtml('/__scale',`<style>body{margin:0;background:#263645;color:#fff;font:14px sans-serif}canvas{display:block;image-rendering:pixelated}</style><script type="module" src="/${entry}"></script>`)));}}]});
 await server.listen();browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__scale`);await page.waitForFunction(()=>window.sprites&&window.actions);
 const meta=JSON.parse(await fs.readFile('assets/dungeons2/render-metrics.json','utf8'));
 for(const r of meta.records)for(const [path,sha] of [[r.idle,r.idleSha256],[r.actions,r.actionSha256]])assert.equal(createHash('sha256').update(await fs.readFile(path)).digest('hex'),sha,'Regenerate calibration when artwork changes');
 const results=[];
 for(const record of meta.records){
  const result=await page.evaluate(async(record)=>{
   const {sprites,actions}=window,id='dungeons2-'+record.key.replace(/-transformed$/,''),transformed=record.key.endsWith('-transformed');
   await sprites.loadStudentSprite(id,transformed).decode();await actions.loadD2HeroActions(id,transformed).decode();
   const directions=[{x:0,y:1},{x:0,y:-1},{x:1,y:0},{x:-1,y:0},{x:1,y:1},{x:-1,y:1},{x:1,y:-1},{x:-1,y:-1}];
   let time=1000;performance.now=()=>time;
   document.querySelector('canvas')?.remove();const preview=document.createElement('canvas');preview.width=1280;preview.height=1000;document.body.append(preview);const display=preview.getContext('2d');display.fillStyle='#263645';display.fillRect(0,0,1280,1000);display.fillStyle='#fff';display.font='14px sans-serif';display.fillText(record.key+' — idle / walk × 4 / idle',12,18);
   const results=[];
   for(const size of [48,128])for(let d=0;d<8;d++){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=192;const ctx=canvas.getContext('2d');
    const draw=()=>{ctx.clearRect(0,0,192,192);if(!sprites.drawStudentSprite(ctx,id,directions[d],24,24,size,transformed))throw Error('Missing sprite');const image=ctx.getImageData(0,0,192,192);let top=192,bottom=-1;for(let y=0;y<192;y++)for(let x=0;x<192;x++)if(image.data[(y*192+x)*4+3]>64){top=Math.min(top,y);bottom=Math.max(bottom,y);}return {height:bottom-top+1,bottom,bytes:image.data};};
    actions.clearD2HeroAction(id);const idle=draw(),walk=[];
    if(size===128)display.drawImage(canvas,0,0,160,160,d*160,24,160,160);
    actions.cueD2HeroAction(id,'walk');const motion=actions.d2HeroActionSnapshot(id);
    for(let f=0;f<4;f++){time=motion.started+(f+.05)/4*motion.duration;const frame=draw();walk.push({height:frame.height,bottom:frame.bottom});if(size===128)display.drawImage(canvas,0,0,160,160,d*160,24+(f+1)*160,160,160);}
    time=motion.started+motion.duration+1;const restored=draw();if(size===128)display.drawImage(canvas,0,0,160,160,d*160,824,160,160);
    if(!idle.bytes.every((v,i)=>v===restored.bytes[i]))throw Error('Idle not restored '+record.key+'/'+d);
    const median=[...walk.map(w=>w.height)].sort((a,b)=>a-b);const medianHeight=(median[1]+median[2])/2;
    if(Math.abs(medianHeight-idle.height)>2)throw Error('Size jump '+record.key+'/'+d+'/'+size+': '+JSON.stringify({idle:idle.height,walk}));
    for(const frame of walk){if(Math.abs(frame.bottom-idle.bottom)>2)throw Error('Foot jumps '+record.key+'/'+d);if(frame.height/idle.height<.87||frame.height/idle.height>1.13)throw Error('Walk frame scale drift '+record.key+'/'+d);}
    results.push({size,direction:d,idleHeight:idle.height,walkHeights:walk.map(f=>f.height),footDelta:Math.max(...walk.map(f=>Math.abs(f.bottom-idle.bottom)))});
   }
   return results;
  },record);
  results.push({key:record.key,directions:result});await page.locator('canvas').screenshot({path:`tmp/d2-scale/${record.key}.png`});
 }
 await fs.writeFile('tmp/d2-scale/results.json',JSON.stringify(results,null,2)+'\n');assert.equal(results.length,18);assert.deepEqual(errors,[]);
 console.log('PASS: all 9 heroes / 18 forms × 8 facings at 48px and 128px; 1152 walk frames match idle median height within 2px, share the foot baseline within 2px and restore identical idle pixels; artwork calibration hashes verified; zero browser exceptions.');
} finally {await browser?.close();await server?.close();await fs.rm(entry,{force:true});}
