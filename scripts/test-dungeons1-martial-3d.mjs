import assert from 'node:assert/strict';import fs from 'node:fs/promises';import{createServer}from'vite';import{chromium}from'playwright';
const entry=`.d1-martial-3d-${process.pid}.ts`,out='tmp/d1-martial-3d';let server,browser;
try{
 await fs.mkdir(out,{recursive:true});await fs.writeFile(entry,`import {createDungeonScene} from './src/components/school-dungeon/three/scene';import{newAdventure}from'./src/components/school-dungeon/adventure';import{TRAINING_WEAPONS,WEAPON_KINDS}from'./src/components/school-dungeon/dungeons1/mastery';import {weaponFootprint} from './src/components/school-dungeon/dungeons1/martialEffects';import{weaponArea}from'./src/components/school-dungeon/dungeons1/weaponArea';const scene=await createDungeonScene(document.getElementById('view')!);const frame={map:Array.from({length:22},()=>Array(22).fill('FLOOR')),player:{x:10,y:10,hp:50,maxHp:50,dir:{x:1,y:0},equipment:{weapon:TRAINING_WEAPONS.D1_TRAINING_BOW}},enemies:[],floorItems:[{id:'new-bow',x:9,y:10,itemData:TRAINING_WEAPONS.D1_TRAINING_BOW}],traps:[],visible:()=>true,knownItem:()=>true,sight:false,trapSight:false,adventure:newAdventure(),dojo:null,floor:1,effects:[]};Object.assign(window,{__api:scene,__frame:frame,__kinds:WEAPON_KINDS,__footprints:{weaponFootprint,weaponArea}});function draw(){scene.draw(frame);requestAnimationFrame(draw);}draw();`);
 server=await createServer({optimizeDeps:{noDiscovery:true,include:['three']},server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error',plugins:[{name:'d1-3d-fixture',enforce:'pre',transform(code,id){if(id.endsWith('/three/scene.ts'))return code.replace('renderer.render(scene,camera);','renderer.render(scene,camera);(window as any).__scene={nodes,textures:textTextures,frame:f};');},configureServer(s){s.middlewares.use('/__d1-3d',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml('/__d1-3d',`<html><body style="margin:0"><div id="view" style="width:100vw;height:100vh"></div><script type="module" src="/${entry}"></script></body></html>`));});}}]});await server.listen();
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1000,height:700}}),errors=[];page.setDefaultTimeout(90000);page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__d1-3d`);await page.waitForFunction(()=>window.__scene,{},{timeout:20000});
 assert(await page.evaluate(()=>{let found=false;window.__scene.nodes.get('item:new-bow').object.traverse(o=>{if(o.userData.weaponKind==='bow'&&o.isSprite)found=true;});return found;}),'new weapons use their actual illustration in 3D');
 const before=await page.evaluate(()=>window.__scene.textures.size);
 for(const kind of await page.evaluate(()=>window.__kinds)){
  await page.evaluate(kind=>{
   const f=window.__frame,origin={x:9,y:10},dir={x:1,y:0};
   const {weaponFootprint,weaponArea}=window.__footprints,cells=weaponArea(kind,origin,dir,f.map);
   f.effects=[{type:'MARTIAL',...origin,duration:7,maxDuration:13,footprint:weaponFootprint(kind,origin,dir,cells,[],4)}];
  },kind);
  await page.evaluate(()=>window.__api.draw(window.__frame));
  await page.waitForFunction(()=>window.__scene.nodes.get('fx:0')?.object.userData.footprintCanvas);
  assert.equal(await page.evaluate(()=>window.__scene.nodes.get('player').object.getObjectByName('actorBody').userData.heroState.action),'Attack');
  const painted=await page.evaluate(()=>{
   const mesh=window.__scene.nodes.get('fx:0').object;
   const {footprint}=window.__frame.effects[0],canvas=mesh.userData.footprintCanvas,ctx=canvas.getContext('2d');
   const left=mesh.position.x-(mesh.scale.x-1)/2,top=mesh.position.z-(mesh.scale.z-1)/2;
   const membership=new Set(footprint.cells.map(({x,y})=>x+','+y));
   for(let row=0;row<mesh.scale.z;row++)for(let col=0;col<mesh.scale.x;col++){
    const alpha=ctx.getImageData(col*64+6,row*64+6,1,1).data[3];
    if(Boolean(alpha)!==membership.has((col+left)+','+(row+top)))return false;
   }
   return true;
  });
  assert(painted,kind+' covers exactly the affected tiles, even with no enemies');
  if(['greatsword','spear','chakram'].includes(kind))await page.screenshot({path:out+'/'+kind+'.png'});
 }
 assert(await page.evaluate(()=>{let found=false;window.__scene.nodes.get('player').object.traverse(o=>{if(o.name.startsWith('equipped_weapon_')&&o.visible)found=true;});return found;}),'the bow remains in the character’s hand during the attack');
 await page.evaluate(()=>{window.__frame.effects=[];});await page.waitForFunction(()=>!window.__scene.nodes.has('fx:0'));
 assert.equal(await page.evaluate(()=>window.__scene.textures.size),before,'temporary effect textures are disposed');
 const state=await page.evaluate(()=>JSON.stringify(window.__frame));await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>JSON.stringify(window.__frame)),state,'3D rendering never changes simulation');assert.deepEqual(errors,[]);
 console.log('PASS: all 11 weapon effects cover their exact empty-tile footprints in 3D; hero animation, equipment, texture disposal and unchanged simulation.');
}finally{await browser?.close();await server?.close();await fs.rm(entry,{force:true});}
