import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const dir=process.env.RPG_ADVENTURE_DIR||'tmp/rpg-adventure';await mkdir(dir,{recursive:true});
let server,browser;const errors=[],results=[];
try{
 server=await createServer({logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{name:'adventure-preview',configureServer(s){s.middlewares.use('/adventure-preview',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml(req.url,'<html><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><body style="margin:0"><div id="root"></div><script type="module" src="/scripts/fixtures/rpg-landscape.tsx"></script></body></html>'));});}}]});
 await server.listen();browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:Number(process.env.RPG_ADVENTURE_WIDTH||1280),height:Number(process.env.RPG_ADVENTURE_HEIGHT||720)}});page.setDefaultTimeout(120000);
 page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});page.on('console',m=>{if(m.type()==='error'&&/THREE|shader|WebGL/i.test(m.text()))errors.push(m.text());});
 await page.addInitScript(()=>localStorage.setItem('rpg-preferences-v1',JSON.stringify({mapQuality:'high'})));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/adventure-preview`,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('canvas[data-render-stats]'));
 const cdp=await page.context().newCDPSession(page);
 const destinations=await page.evaluate(async()=>{const w=window.world,town=w.sites.find(s=>s.kind==='town'),boss=w.sites.find(s=>s.kind==='boss'),V=await import('/src/rpg/voxel.ts'),C=await import('/src/rpg/adventureCamera.ts');let forest=[37.5,27.5,undefined,-.7],mountain=[187.5,55.5,undefined,-1.5544];const peak=[...(w.terrainPeaks||[])].sort((a,b)=>b.height-a.height)[0];if(peak){for(let i=0;i<48;i++){const angle=i*Math.PI/24,x=Math.floor(peak.x+Math.cos(angle)*45)+.5,z=Math.floor(peak.z+Math.sin(angle)*45)+.5;if(x<8||z<8||x>184||z>80||!['grass','road'].includes(w.tiles[Math.floor(z)*192+Math.floor(x)]))continue;const h=V.terrainHeight(w,Math.floor(x),Math.floor(z)),yaw=Math.atan2(peak.x+.5-x,-(peak.z+.5-z)),pitch=.225,back={x:-Math.sin(yaw)*Math.cos(pitch),y:-Math.sin(pitch),z:Math.cos(yaw)*Math.cos(pitch)};if(h<20&&C.cameraBoom(w,{x,y:h+2.07,z},back,5.2)===5.2){mountain=[x,z,undefined,yaw/(Math.PI/2)];break;}}}outer:for(let z=26;z<36;z++)for(let x=34;x<48;x++){if(w.tiles[z*192+x]!=='grass')continue;const h=V.terrainHeight(w,x,z),yaw=Math.atan2(30-x,-(20-z));if(C.cameraBoom(w,{x:x+.5,y:h+2.07,z:z+.5},{x:-Math.sin(yaw),y:0,z:Math.cos(yaw)},5.2)===5.2){forest=[x+.5,z+.5,undefined,yaw/(Math.PI/2)];break outer;}}let fall=null;if(peak){const choices=[];for(let z=2;z<86;z++)for(let x=2;x<190;x++){const pool=V.voxelWater(w,x,z);if(pool?.kind!=='waterfall'||pool.surface<2||pool.surface>30)continue;const next=V.voxelWater(w,x+pool.flowX,z+pool.flowZ);if(!next||pool.surface-next.surface<2)continue;const target={x:x+.5+pool.flowX*.52,y:(pool.surface+next.surface)/2,z:z+.5+pool.flowZ*.52};for(const forward of [1,2,3,5,8])for(const side of [-8,-5,0,5,8]){const px=x+.5+pool.flowX*forward-pool.flowZ*side,pz=z+.5+pool.flowZ*forward+pool.flowX*side,ix=Math.floor(px),iz=Math.floor(pz);if(ix<2||iz<2||ix>189||iz>85||!['grass','road','forest'].includes(w.tiles[iz*192+ix]))continue;const water=V.voxelWater(w,ix,iz);if(water&&water.kind!=='waterfall')continue;const h=water?water.surface-water.depth:V.terrainHeight(w,ix,iz),eye={x:px,y:h+1.62,z:pz};if(V.blockAt(w,ix,Math.floor(eye.y),iz))continue;const dx=target.x-px,dy=target.y-eye.y,dz=target.z-pz,distance=Math.hypot(dx,dy,dz),dir={x:dx/distance,y:dy/distance,z:dz/distance},hit=V.traceVoxel(w,eye,dir,distance+.3);if(hit&&hit.distance<distance-1)continue;const pitch=Math.atan2(dy,Math.hypot(dx,dz));if(Math.abs(pitch)>1.2)continue;choices.push({shot:['waterfall',px,pz,h,Math.atan2(dx,-dz)/(Math.PI/2),pitch],score:Math.abs(pitch-.2)+Math.abs(distance-9)*.02});}}choices.sort((a,b)=>a.score-b.score);fall=choices[0]?.shot;}return [['town',town.x,town.y+6,undefined,0],['castle',boss.x,boss.y+8,undefined,0],['mountains',...mountain],['forest',...forest],['lake',100,66,undefined,.4],['town-night',town.x,town.y+6,undefined,0],...(fall?[fall]:[])];});
 const requested=process.env.RPG_ADVENTURE_SCENES?.split(',');if(requested)for(const name of requested)assert(destinations.some(d=>d[0]===name),`${name}: no valid camera position found`);
 for(const [name,x,z,y,heading,lookPitch]of destinations.filter(d=>!requested||requested.includes(d[0]))){
  await page.evaluate(night=>{window.world.town.elapsed=night?140:0;},name==='town-night');
  if(name==='waterfall')await page.getByRole('button',{name:'カメラ切替',exact:true}).click();
  await page.evaluate(([x,z,y,h])=>window.visit(x,z,y,h),[x,z,y,heading]);await page.getByRole('button',{name:'視点を水平に戻す',exact:true}).click();
  if(lookPitch!==undefined)await page.evaluate(p=>window.dispatchEvent(new CustomEvent('learning-rogue:rpg-controller-look',{detail:{x:0,y:-p/.075,dt:.05,reset:false}})),lookPitch);
  if(name==='mountains')await page.evaluate(()=>{for(let i=0;i<3;i++)window.dispatchEvent(new CustomEvent('learning-rogue:rpg-controller-look',{detail:{x:0,y:-1,dt:.05,reset:false}}));});
  await page.waitForTimeout(2500);
  const stats=await page.locator('canvas[data-render-stats]').evaluate(c=>({...c.dataset,width:c.width,height:c.height}));
  if(['forest','mountains'].includes(name))assert(Number(stats.cameraDistance)>3,`${name}: camera must have an unobstructed boom for the overview screenshot`);assert.equal(stats.cameraMode,name==='waterfall'?'first-person':'third-person');assert(Number.isFinite(Number(stats.cameraY)));assert(JSON.parse(stats.renderStats).calls>0);
  const shot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`${dir}/${name}.png`,Buffer.from(shot.data,'base64'));results.push({name,...stats});console.log(name,stats.renderStats);
 }
 if(process.env.RPG_ADVENTURE_SHOTS_ONLY!=='1'){
 if(await page.locator('canvas[data-render-stats]').evaluate(c=>c.dataset.cameraMode)!=='third-person')await page.getByRole('button',{name:'カメラ切替',exact:true}).click();
 await page.getByRole('button',{name:'カメラ切替',exact:true}).click();await page.waitForFunction(()=>document.querySelector('canvas').dataset.cameraMode==='first-person');
 await page.getByRole('button',{name:'カメラ切替',exact:true}).click();await page.waitForFunction(()=>document.querySelector('canvas').dataset.cameraMode==='third-person');
 await page.evaluate(()=>{
  const w=window.world;w.sites=w.sites.filter(s=>Math.abs(s.x-20)+Math.abs(s.y-20)>10);w.voxels={edits:{},revision:0,terrainVersion:2,legacyFlat:[]};
  for(let z=12;z<29;z++)for(let x=12;x<29;x++){w.voxels.legacyFlat.push(`${x},${z}`);for(let y=0;y<8;y++)w.voxels.edits[`${x},${y},${z}`]=null;}
  w.players.local.life.energy=6;w.players.local.life.bag.wood=10;window.visit(20.5,20.5,0,0);window.editMap({'20,1,18':'wood','20,0,18':'wood'});
 });
 await page.getByRole('button',{name:'視点を水平に戻す',exact:true}).click();
 await page.getByRole('button',{name:'カメラ切替',exact:true}).click();await page.waitForFunction(()=>document.querySelector('canvas').dataset.cameraMode==='first-person');await page.waitForTimeout(1000);
 await page.getByRole('button',{name:'⛏ 壊す',exact:true}).click();await page.waitForFunction(()=>window.world.voxels.edits['20,1,18']===null);
 await page.evaluate(()=>window.editMap({'20,1,18':'wood'}));
 await page.getByRole('button',{name:'カメラ切替',exact:true}).click();await page.waitForFunction(()=>document.querySelector('canvas').dataset.cameraMode==='third-person');await page.waitForTimeout(1000);
 await page.getByRole('button',{name:'⛏ 壊す',exact:true}).click();await page.waitForFunction(()=>window.world.voxels.edits['20,1,18']===null);
 await page.getByRole('button',{name:'カメラ切替',exact:true}).click();await page.waitForFunction(()=>document.querySelector('canvas').dataset.cameraMode==='first-person');
 await page.evaluate(()=>{for(let i=0;i<8;i++)window.dispatchEvent(new CustomEvent('learning-rogue:rpg-controller-look',{detail:{x:0,y:.5,dt:.05,reset:false}}));});await page.waitForTimeout(1000);
 await page.getByRole('button',{name:'＋ 置く',exact:true}).click();await page.waitForFunction(()=>window.world.voxels.edits['20,1,18']==='wood');
 console.log('PASS first/third-person authoritative mining and supported placement through UI');
 }
 assert.deepEqual(errors,[]);let prior=[];try{prior=JSON.parse(await readFile(`${dir}/report.json`,'utf8'));}catch{}await writeFile(`${dir}/report.json`,JSON.stringify([...prior.filter(p=>!results.some(r=>r.name===p.name)),...results],null,2));console.log(process.env.RPG_ADVENTURE_SHOTS_ONLY==='1'?'PASS rendered scenes and shader compilation':'PASS rendered scenes, camera switch, mining, placement and shader compilation');
}finally{await browser?.close();await server?.close();}
