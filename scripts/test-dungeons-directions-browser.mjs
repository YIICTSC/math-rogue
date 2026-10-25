import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const entry=`.directions-${process.pid}.ts`;let server,browser;
try{
 await fs.writeFile(entry,`import * as sprites from './src/components/school-dungeon/student/sprites';import * as motion from './src/components/school-dungeon/dungeons2/heroActions';import {useCanonicalD2Pose} from './src/components/school-dungeon/dungeons2/directionPolicy';Object.assign(window,{sprites,motion,useCanonicalD2Pose});`);
 server=await createServer({server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error',plugins:[{name:'directions',configureServer(s){s.middlewares.use('/__directions',async(req,res)=>res.end(await s.transformIndexHtml('/__directions',`<body style="background:#263644"><script type="module" src="/${entry}"></script>`)));}}]});await server.listen();
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__directions`);await page.waitForFunction(()=>window.sprites);
 const assets=JSON.parse(await fs.readFile('assets/dungeons2/hero-actions-build.json','utf8')).assets;
 const result=await page.evaluate(async assets=>{
 const {sprites,motion,useCanonicalD2Pose}=window;const dirs=[{x:0,y:1},{x:0,y:-1},{x:1,y:0},{x:-1,y:0},{x:1,y:1},{x:-1,y:1},{x:1,y:-1},{x:-1,y:-1}];dirs.forEach((d,i)=>{if(sprites.studentDirection(d)!==i)throw Error('Direction order');});
 let time=1000,draws=0,canonical=0;const clock=performance.now;performance.now=()=>time;
 try{for(const a of assets){
 const source=sprites.loadStudentSprite(a.heroId,a.transformed);await source.decode();await motion.loadD2HeroActions(a.heroId,a.transformed).decode();
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=576;canvas.id=a.key;document.body.append(canvas);const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.font='16px sans-serif';ctx.fillText(a.key+' / S N E W SE SW NE NW',8,20);
 for(let row=0;row<8;row++){
 time+=1000;const action=row<2?'walk':['attack','throw','swing','read','use','shoot'][row-2];motion.cueD2HeroAction(a.heroId,action);time+=row===1?110:50;
 for(let dir=0;dir<8;dir++){
 const calls=[];const spy={save(){},restore(){},drawImage(...args){calls.push(args);}};
 if(!motion.drawD2HeroAction(spy,a.heroId,dir,0,0,48,a.transformed,source))throw Error('Missing '+a.key);
 const [image,sx]=calls.at(-1);if(sx!==dir*96)throw Error('Wrong column');
 if(useCanonicalD2Pose(a.heroId,a.transformed,dir)){if(!(image instanceof HTMLCanvasElement))throw Error('Incorrect diagonal source');canonical++;}
 else if(!(image instanceof HTMLImageElement))throw Error('Lost painted cardinal');
 if(!sprites.drawStudentSprite(ctx,a.heroId,dirs[dir],dir*64+8,row*64+40,48,a.transformed))throw Error('No visible sprite');draws++;
 }
 }
 }return {draws,canonical};}finally{performance.now=clock;}
 },assets);
 assert.equal(result.draws,1152);assert.equal(result.canonical,584);assert.deepEqual(errors,[]);await fs.mkdir('tmp/directions',{recursive:true});
 for(const a of assets)await page.locator(`[id="${a.key}"]`).screenshot({path:`tmp/directions/${a.key}.png`});
 console.log('PASS: 18 forms, 1152 action/direction draws, 584 canonical corrections, correct original/transformed sources, zero browser errors. D1 all 52 forms verified separately.');
}finally{await browser?.close();await server?.close();await fs.rm(entry,{force:true});}
