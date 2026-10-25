import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';

const entry=`.d1-actions-test-${process.pid}.ts`,out='tmp/d1-actions';let server,browser;
const expected=process.argv.includes('--partial')?JSON.parse(await fs.readFile('assets/dungeons1/hero-actions-build.json','utf8')).assets.length:52;
try{
 await fs.mkdir(out,{recursive:true});
 await fs.writeFile(entry,`import * as motion from './src/components/school-dungeon/dungeons1/heroActions';import * as art from './src/components/school-dungeon/dungeons1/drawHero';import * as weaponless from './src/components/school-dungeon/dungeons1/weaponlessArt';import {D1_HERO_ACTION_KEYS} from './src/data/dungeons1HeroActionKeys';Object.assign(window,{motion,art,weaponless,keys:[...D1_HERO_ACTION_KEYS]});`);
 server=await createServer({server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error',plugins:[{name:'actions-fixture',configureServer(s){s.middlewares.use('/__actions',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml('/__actions',`<html><body style="background:#30454d;color:white"><script type="module" src="/${entry}"></script></body></html>`));});}}]});
 await server.listen();const address=server.httpServer.address();
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${address.port}/__actions`);await page.waitForFunction(count=>window.keys?.length===count,expected);
 const coverage=await page.evaluate(async()=>{
  const {motion,art,weaponless,keys}=window,canvas=document.createElement('canvas');canvas.width=8*112;canvas.height=52*112;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  let time=1000,calls=0,firstImage;const originalNow=performance.now;performance.now=()=>time;
  const rows=['walk','walk','attack','throw','swing','read','use','shoot'];
  const proxy={save(){},restore(){},translate(){},scale(){},drawImage(...args){calls++;proxy.last=args;}};
  try{
   for(let index=0;index<keys.length;index++){
    const key=keys[index],form=key.endsWith('-transformed'),id=key.replace(/-transformed$/,'');
    const image=art.loadD1HeroArt(id,form);await image.decode();const gestures=weaponless.loadWeaponlessArt(id,form);await gestures.decode();if(index===0)firstImage=image;
    if(!image.src.includes('/'+key+'.webp'))throw Error('Wrong form: '+key);
    const source=new Image();source.src='/sprites/wandering-student/'+key+'.webp';await source.decode();
    for(let row=0;row<8;row++){
     time+=1000;motion.cueStudentAction(id,rows[row]);const start=time;time+=rows[row]==='walk'?row===0?10:160:180;
     const snapshot=motion.studentActionSnapshot(id),paintedRow=rows[row]==='walk'?(snapshot.frame<3?0:1):row;
     for(let dir=0;dir<8;dir++){
      if(!art.drawD1HeroAction(proxy,id,source,dir,10,20,48,form))throw Error('No action pose '+key);
      const [used,sx,sy,sw,sh]=proxy.last;
      const directed=['attack','throw','swing','shoot'].includes(rows[row]);if(sx!==dir*96||sy!==(directed?snapshot.row:paintedRow)*96||sw!==96||sh!==96||directed&&!(used instanceof HTMLCanvasElement)||!directed&&used!==image)throw Error('Wrong cell '+key+'/'+row+'/'+dir);
     }
     ctx.drawImage(image,0,paintedRow*96,96,96,row*112+8,index*112+8,96,96);
     time=start+snapshot.duration;
     if(art.drawD1HeroAction(proxy,id,source,0,0,0,48,form))throw Error('Motion did not restore idle '+key);
    }
   }
   const reloaded=art.loadD1HeroArt(keys[0].replace(/-transformed$/,''),keys[0].endsWith('-transformed'));await reloaded.decode();
   if(keys.length>8&&reloaded===firstImage)throw Error('Painted image cache did not release older heroes');
   if(art.loadD1HeroArt('dungeons2-lyria')||art.loadD1HeroArt('unknown'))throw Error('Requested an unknown D1 atlas');
  }finally{performance.now=originalNow;}
  canvas.id='preview';document.body.append(canvas);return {variants:keys.length,calls};
 });
 assert.equal(coverage.variants,expected);assert.equal(coverage.calls,expected*64);assert.deepEqual(errors,[]);
 await page.locator('#preview').screenshot({path:out+'/all-52-painted-actions.png'});
 for(const [width,height]of [[390,844],[844,390],[1280,900]]){
  await page.setViewportSize({width,height});await page.screenshot({path:`${out}/painted-${width}.png`});
 }
 const fallback=await browser.newPage();fallback.on('pageerror',e=>errors.push(e.message));
 await fallback.route('**/sprites/dungeons1/actions/elementary-caretaker.webp*',route=>route.abort());
 await fallback.goto(`http://127.0.0.1:${address.port}/__actions`);await fallback.waitForFunction(()=>window.art&&window.motion);
 assert(await fallback.evaluate(async()=>{
  const source=new Image();source.src='/sprites/wandering-student/elementary-caretaker.webp';await source.decode();
  await window.art.loadD1HeroArt('elementary-caretaker').decode().catch(()=>{});
  const canvas=document.createElement('canvas');canvas.width=96;canvas.height=96;const ctx=canvas.getContext('2d');
  window.motion.cueStudentAction('elementary-caretaker','walk');
  return window.art.drawD1HeroAction(ctx,'elementary-caretaker',source,0,24,24,48)&&ctx.getImageData(0,0,96,96).data.some((v,i)=>i%4===3&&v>80);
 }),'Failed painted downloads must retain a visible fallback');
 assert.deepEqual(errors,[]);await fallback.close();
 console.log(`PASS: ${expected} real WebP atlases decode, ${coverage.calls} runtime action-cell draws, correct transformed forms, idle restoration, bounded cache, visible fallback on download failure and zero runtime errors.`);
}finally{await browser?.close();await server?.close();await fs.rm(entry,{force:true});}
