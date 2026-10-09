import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';

await mkdir('tmp/school-3d',{recursive:true});
await writeFile('tmp/school-3d/index.html','<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><div id="root" style="height:100dvh"></div><script type="module" src="./entry.tsx"></script></body></html>');
await writeFile('tmp/school-3d/entry.tsx',`import React from 'react';import{createRoot}from'react-dom/client';import '../../src/styles.css';import One from '../../src/components/SchoolDungeonRPG';import Two from '../../src/components/SchoolDungeonRPG2';const Game=new URLSearchParams(location.search).get('game')==='2'?Two:One;createRoot(document.getElementById('root')!).render(<React.StrictMode><Game onBack={()=>{}}/></React.StrictMode>);`);
const server=await createServer({server:{port:5174,strictPort:true,host:'127.0.0.1'},plugins:[{name:'school-test-observer',enforce:'pre',transform(source,id){source=source.replace(/\r\n/g,'\n');
  if(id.endsWith('/useSchoolAdventure.ts'))return source.replace(' return {state:state.current',' const api={state:state.current').replace(/\n };\n}\nexport type/,'\n };\n (window as any).__adventure=api;(window as any).__bridge=b.current;return api;\n}\nexport type');
  if(id.endsWith('/three/scene.ts'))return source.replace('renderer.render(scene,camera);','renderer.render(scene,camera); (window as any).__scene={world,renderer,frame:f,nodes,draw,kit,animations:heroAsset.animations,castAnimations};');
}}]});
await server.listen();
const browser=await chromium.launch({args:['--use-angle=swiftshader']});
try{
 for(const game of [1,2]){
  const page=await browser.newPage({viewport:{width:1366,height:900}});page.setDefaultTimeout(90000);
  const errors=[];page.on('pageerror',e=>{errors.push(e.stack||e.message);console.error(e.message);});
  await page.goto(`http://127.0.0.1:5174/tmp/school-3d/index.html?game=${game}`,{waitUntil:"domcontentloaded"});
  await page.getByRole('button',{name:'このルールで出発',exact:true}).click();assert.equal(await page.getByRole('button',{name:'2D / 3D',exact:true}).innerText(),'2D');await page.getByRole('button',{name:'2D / 3D',exact:true}).click();
  await page.locator('[data-school-dungeon3d="ready"]').waitFor();console.log('3D ready',game);
  await page.evaluate(()=>{
    const b=window.__bridge,a=window.__adventure;
    b.setMap(Array.from({length:26},(_,y)=>Array.from({length:26},(_,x)=>x===0||y===0||x===25||y===25||y===8&&x!==12?'WALL':x===15&&y===14?'STAIRS':'FLOOR')));
    b.setPlayer(p=>({...p,x:12,y:12,dir:{x:0,y:1},equipment:{weapon:null,armor:null,ranged:null,accessory:null}}));
    a.state.scene=0;a.state.town=true;a.state.terrain={'10,11':'WATER','11,11':'ICE','13,11':'HOLE','14,11':'CRACK','11,8':'SECRET'};
    // Force visibility for the equipment screenshot, then test concealment separately.
    a.state.scene=undefined;b.setPlayer(p=>({...p,equipment:{...p.equipment,accessory:{...b.catalog.RING_SIGHT,id:'sight'}}}));
    b.setEnemies(['SLIME','GHOST','BAT','DRAGON','SHOPKEEPER','MANDRAKE'].map((enemyType,i)=>({id:900+i,type:'ENEMY',enemyType,x:9+i,y:10,hp:15,maxHp:15,attack:1,defense:0,xp:0,name:enemyType,dir:{x:0,y:1},status:{sleep:100}})));
    b.setInventory(['PENCIL_SWORD','RANDO_SERU','DISASTER_HOOD','VINYL_APRON','METAL_BAT','PRINCIPAL_SHIELD'].map((type,i)=>({...b.catalog[type],id:'gear-'+i})));
    b.setFloorItems(['FOOD_ONIGIRI','SCROLL_MAP','PENCIL_SWORD','GYM_CLOTHES','CHALK','GRASS_HEAL'].map((type,i)=>({id:800+i,type:'ITEM',x:9+i,y:14,itemData:{...b.catalog[type],id:'drop-'+i}})));
    a.state.companion={name:'friend',role:'HEAL',x:13,y:12,hp:40,level:1,xp:0,order:'FOLLOW'};
  });
  await page.waitForTimeout(300);
  // Equip through the actual inventory buttons, not by modifying the renderer.
  for(const [name,type] of [['えんぴつソード','PENCIL_SWORD'],['ランドセル','RANDO_SERU'],['防災頭巾','DISASTER_HOOD'],['ビニールエプロン','VINYL_APRON'],['金属バット','METAL_BAT'],['校長の盾','PRINCIPAL_SHIELD'],['えんぴつソード','PENCIL_SWORD']]){
    await page.evaluate(()=>window.__bridge.setMenuOpen(true));
    const button=page.getByRole('button').filter({hasText:name}).filter({hasText:'装備'}).first();
    await button.click();
    await page.waitForFunction(type=>document.querySelector('[data-school-dungeon3d]')?.getAttribute('data-equipment')?.includes(type),type);
    assert(await page.evaluate(type=>{let found=false;window.__scene.world.traverse(o=>{if(o.name.endsWith('_'+type))found=true;});return found;},type));
    if(type==='DISASTER_HOOD')assert(await page.evaluate(()=>{let seen=0;let hidden=0;window.__scene.nodes.get('player').object.traverse(o=>{if(o.name.startsWith('hero_motion_head_hair_')){seen++;if(!o.visible)hidden++;}});return seen>0&&seen===hidden;}),'hood removes the new hairstyle');
  }
  await page.evaluate(()=>window.__bridge.setMenuOpen(false));
  await page.screenshot({path:`tmp/school-3d/dungeon-${game}.png`});
  const coverage=await page.evaluate(async()=>{
    const {itemModel}=await import('/src/components/school-dungeon/three/appearance.ts');
    const s=window.__scene;
    const missing=Object.values(window.__bridge.catalog).map(itemModel).filter(name=>!s.kit.getObjectByName(name));
    const f={...s.frame,enemies:[{id:'hidden',x:s.frame.player.x+1,y:s.frame.player.y,enemyType:'SLIME'}],floorItems:[{id:'hidden',x:s.frame.player.x+1,y:s.frame.player.y,itemData:{type:'PENCIL_SWORD',category:'WEAPON'}}],traps:[{x:s.frame.player.x+1,y:s.frame.player.y,visible:true}],visible:()=>false,sight:false,trapSight:false};
    s.draw(f);const concealed=!s.nodes.has('enemy:hidden')&&!s.nodes.has('item:hidden')&&!s.nodes.has(`trap:${f.player.x+1}:${f.player.y}`);
    s.draw({...f,sight:true});const magicSight=s.nodes.has('enemy:hidden')&&s.nodes.has('item:hidden')&&!s.nodes.has(`trap:${f.player.x+1}:${f.player.y}`);
    const invalidMaterials=[];s.world.traverse(o=>{if(o.isMesh&&Array.isArray(o.material)&&!o.geometry.groups.length)invalidMaterials.push(o.name);});return {missing,concealed,magicSight,invalidMaterials,catalog:Object.keys(window.__bridge.catalog).length};
  });
  assert.deepEqual(coverage.missing,[]);assert.deepEqual(coverage.invalidMaterials,[]);assert(coverage.concealed&&coverage.magicSight);console.log('Catalog / visibility',game,coverage.catalog);
  await page.getByRole('button',{name:'Sts',exact:true}).click();
  await page.locator('[data-gamepad-modal] [data-school-dungeon3d="ready"]').waitFor();
  await page.screenshot({path:`tmp/school-3d/equipment-${game}.png`});
  const quality=await page.evaluate(()=>{
    const s=window.__scene,root=s.world.getObjectByName('actorBody');
    const clips=s.animations.map(c=>c.name).sort();const states=['neutral','smile','surprise','anger','sad','hit','victory'];
    const expressions=states.filter(name=>root.getObjectByName('hero_expression_'+name));
    const visible=states.filter(name=>root.getObjectByName('hero_expression_'+name)?.visible);
    const socket=root.getObjectByName('hero_socket_weapon');const arm=root.getObjectByName('hero_motion_arm_r');
    const before=arm.quaternion.toArray();const mixer=root.userData.animationMixer;mixer.stopAllAction();const action=mixer.clipAction(s.animations.find(c=>c.name==='Attack')).reset().play();mixer.update(.3);
    return {clips,expressions,visible,weaponFollowsSocket:socket.children.some(c=>c.name.startsWith('equipped_weapon_')),animated:before.some((n,i)=>Math.abs(n-arm.quaternion.toArray()[i])>.01)};
  });
  assert.deepEqual(quality.clips,['Attack','Defeat','Hit','Idle','Run','Victory','Walk']);assert.equal(quality.expressions.length,7);assert.deepEqual(quality.visible,['neutral']);assert(quality.weaponFollowsSocket&&quality.animated);console.log('PASS quality hero clips, expressions and held weapon animation',game);

  await page.getByRole('button',{name:'閉じる',exact:true}).first().click();
  await page.evaluate(()=>{
    const b=window.__bridge,a=window.__adventure;a.state.scene=undefined;a.state.terrain={};
    b.setPlayer(p=>({...p,x:12,y:12}));
    b.setEnemies(Array.from({length:6},(_,i)=>({id:710+i,type:'ENEMY',enemyType:'SLIME',x:9+i,y:10,hp:10,maxHp:10,attack:1,defense:0,xp:0,name:'Rank test',visualTier:Math.min(4,i+1),schoolRank:Math.max(1,i-2),dir:{x:0,y:1},status:{sleep:0}})));
  });
  await page.waitForFunction(()=>window.__scene.nodes.has('enemy:715'));
  const rankColors=await page.evaluate(()=>Array.from({length:6},(_,i)=>{const o=window.__scene.nodes.get('enemy:'+(710+i)).object;let color; o.traverse(m=>{if(m.isMesh){for(const mat of (Array.isArray(m.material)?m.material:[m.material]))if(mat.name.startsWith('enemy_primary'))color=mat.color.getHexString();}});return {rank:o.userData.enemyRank,color,badge:o.userData.rankColor};}));
  assert.deepEqual(rankColors.map(r=>r.rank),[1,2,3,4,5,6]);assert.equal(new Set(rankColors.map(r=>r.color)).size,6);assert.equal(new Set(rankColors.map(r=>r.badge)).size,6);
  await page.screenshot({path:`tmp/school-3d/ranks-${game}.png`});
  const beforeRank=rankColors[0].color;
  await page.evaluate(()=>window.__bridge.setEnemies(a=>a.map(e=>e.id===710?{...e,schoolRank:2,maxHp:22}:e)));
  await page.waitForFunction(()=>window.__scene.nodes.get('enemy:710').object.userData.enemyRank===2);
  const afterRank=await page.evaluate(()=>{let c;window.__scene.nodes.get('enemy:710').object.traverse(m=>{if(m.isMesh&&!Array.isArray(m.material)&&m.material.name.startsWith('enemy_primary'))c=m.material.color.getHexString();});return c;});assert.notEqual(afterRank,beforeRank);
  console.log('PASS six distinct rank body colors, numeric badges and evolution updates',game);

  const cast=await page.evaluate(async()=>{
    const s=window.__scene;const {enemyModel}=await import('/src/components/school-dungeon/three/appearance.ts');
    const types=['SLIME','BAT','DRAGON','MANDRAKE','THIEF','RICE'];
    const frame={...s.frame,enemies:types.map((enemyType,i)=>({id:750+i,enemyType,x:9+i,y:10,hp:20,maxHp:20,visualTier:1,dir:{x:0,y:1}}))};
    s.draw(frame);
    const colors=types.map((_,i)=>{let color;s.nodes.get('enemy:'+(750+i)).object.traverse(o=>{if(o.isMesh&&!Array.isArray(o.material)&&o.material.name.startsWith('enemy_primary'))color=o.material.color.getHexString();});return color;});
    const checks=[];
    const {AnimationMixer}=await import('/node_modules/three/build/three.module.js');
    const bases=[...new Set(s.castAnimations.map(c=>c.name.replace(/_(Idle|Walk|Attack|Hit)$/,'')))];
    for(const base of bases){const root=s.kit.getObjectByName(base).clone(true);const mixer=new AnimationMixer(root);
      for(const action of ['Walk','Attack','Hit']){const clip=s.castAnimations.find(c=>c.name===base+'_'+action);if(!clip){checks.push({base,action,changed:false});continue;}
        const before=new Map();root.traverse(o=>before.set(o.name,[...o.position.toArray(),...o.quaternion.toArray()]));mixer.stopAllAction();mixer.clipAction(clip).reset().play();mixer.update(.15);let changed=false;root.traverse(o=>{const values=[...o.position.toArray(),...o.quaternion.toArray()];if(values.some((v,i)=>Math.abs(v-before.get(o.name)[i])>.005))changed=true;});checks.push({base,action,changed});}
      mixer.stopAllAction();mixer.uncacheRoot(root);
    }
    s.draw(frame);
    const e=frame.enemies[0];s.draw({...frame,enemies:[{...e,x:e.x+1}]});const walk=s.nodes.get('enemy:750').object.getObjectByName('actorBody').userData.heroState.action;
    const b=frame.enemies[1];s.draw({...frame,enemies:[{...b,offset:{x:6,y:0}}]});const attack=s.nodes.get('enemy:751').object.getObjectByName('actorBody').userData.heroState.action;
    s.draw({...frame,enemies:[{...b,hp:10}]});const hit=s.nodes.get('enemy:751').object.getObjectByName('actorBody').userData.heroState.action;
    const friend={name:'test',role:'HEAL',x:12,y:11,hp:40,level:1,xp:0,order:'FOLLOW',direction:2};
    s.draw({...frame,adventure:{...frame.adventure,companion:friend}});s.draw({...frame,adventure:{...frame.adventure,companion:{...friend,x:11}}});const companionWalk=s.nodes.get('companion').object.getObjectByName('actorBody').userData.heroState.action;
    s.draw({...frame,adventure:{...frame.adventure,companion:{...friend,attackVisualAt:Date.now()}}});const companionAttack=s.nodes.get('companion').object.getObjectByName('actorBody').userData.heroState.action;
    s.draw(frame);return {colors,checks,walk,attack,hit,companionWalk,companionAttack,clipCount:s.castAnimations.length};
  });
  assert.equal(new Set(cast.colors).size,6);assert(cast.checks.every(c=>c.changed),JSON.stringify(cast.checks));assert.equal(cast.walk,'Walk');assert.equal(cast.attack,'Attack');assert.equal(cast.hit,'Hit');assert.equal(cast.companionWalk,'Walk');assert.equal(cast.companionAttack,'Attack');assert.equal(cast.clipCount,136);
  console.log('PASS species colors, authored movement/attack/hit clips and turn-driven playback',game,cast.clipCount);

  await page.evaluate(async()=>{const {journeyLayout}=await import('/src/components/school-dungeon/expansion.ts');const b=window.__bridge,a=window.__adventure;const layout=journeyLayout(26,26,false,0);b.setMap(layout.map);a.state.scene=layout.scene;a.state.town=false;a.state.terrain={};a.state.events={};b.setPlayer(p=>({...p,x:4,y:5}));});
  await page.waitForFunction(()=>document.querySelector('[data-school-dungeon3d]')?.getAttribute('data-scene')==='journey');
  for(const size of [{width:1366,height:900},{width:390,height:844},{width:844,height:390}]){
    await page.setViewportSize(size);await page.waitForTimeout(150);
    const box=await page.locator('[data-school-dungeon3d]').boundingBox();assert(box.width>100&&box.height>90,JSON.stringify(box));
    assert(box.x>=0&&box.y>=0&&box.x+box.width<=size.width+1&&box.y+box.height<=size.height+1);
    await page.screenshot({path:`tmp/school-3d/game-${game}-${size.width}.png`});
  }
  // Renderer switching never changes equipment or consumes a turn.
  const before=await page.evaluate(()=>JSON.stringify([window.__bridge.player,window.__bridge.inventory,window.__adventure.state.floorTurns]));
  await page.getByRole('button',{name:'2D / 3D',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('[data-school-dungeon3d]'));
  await page.getByRole('button',{name:'2D / 3D',exact:true}).click();await page.locator('[data-school-dungeon3d="ready"]').waitFor();
  assert.equal(await page.evaluate(()=>JSON.stringify([window.__bridge.player,window.__bridge.inventory,window.__adventure.state.floorTurns])),before);
  assert.equal(await page.evaluate(()=>localStorage.getItem('school-wanderer-3d')),'on');
  await page.reload({waitUntil:'domcontentloaded'});
  const depart=page.getByRole('button',{name:'このルールで出発',exact:true});if(await depart.isVisible())await depart.click();
  await page.locator('[data-school-dungeon3d="ready"]').waitFor();
  assert.equal(await page.getByRole('button',{name:'2D / 3D',exact:true}).innerText(),'3D');
  await page.evaluate(()=>window.__adventure.beginDojo(1));
  await page.waitForFunction(()=>document.querySelector('[data-school-dungeon3d]')?.getAttribute('data-scene')==='dojo');
  const turns=await page.evaluate(()=>window.__adventure.dojoRun.turns);await page.keyboard.press('ArrowRight');
  await page.waitForFunction(turns=>window.__adventure.dojoRun.turns===turns+1,turns);
  // A lost graphics context falls back to the working 2D canvas.
  await page.evaluate(()=>window.__scene.renderer.forceContextLoss());
  await page.waitForFunction(()=>!document.querySelector('[data-school-dungeon3d]'));
  assert.equal(await page.getByRole('button',{name:'2D / 3D',exact:true}).innerText(),'2D');
  assert.equal(await page.evaluate(()=>localStorage.getItem('school-wanderer-3d')),'off');
  assert.deepEqual(errors,[]);
  console.log(`PASS series ${game}: Blender scene, seven equipment operations, journey, three viewport sizes, 2D/3D, dojo movement and context fallback`);
  await page.close();
 }
}finally{for(const p of browser.contexts().flatMap(c=>c.pages()))await p.screenshot({path:"tmp/school-3d/last-state.png"}).catch(()=>{});await browser.close();await server.close();}
