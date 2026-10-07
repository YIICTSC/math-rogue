import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const dir='tmp/voxel-workshop-qa';await fs.mkdir(dir,{recursive:true});
await fs.writeFile(dir+'/index.html','<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>建築工房 · 3Dプレビュー</title><div id="root"></div><script type="module" src="/scripts/fixtures/voxel-workshop.tsx"></script>');
let server,browser;
try{
 server=await createServer({cacheDir:'node_modules/.vite-voxel-workshop',server:{port:4246,host:'127.0.0.1',strictPort:true,hmr:false},logLevel:'error'});
 await server.listen();browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(120000);
 const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.stack);});
 await page.addInitScript(()=>localStorage.setItem('rpg-preferences-v1',JSON.stringify({mapQuality:'low'})));
 await page.goto('http://127.0.0.1:4246/'+dir+'/index.html');
 await page.waitForFunction(()=>document.querySelector('canvas[data-testid="rpg-world-3d"]')?.dataset.workshopModels==='11');
 await page.screenshot({path:dir+'/world.png'});
 await page.getByRole('button',{name:'建築工房',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'建築工房'});await dialog.waitFor();
 assert.equal(await dialog.locator('.voxel-material-grid button').count(),78);
 await page.getByRole('textbox',{name:'素材を検索'}).fill('ガラス');
 assert.equal(await dialog.locator('.voxel-material-grid button').count(),4);
 await page.getByRole('textbox',{name:'素材を検索'}).fill('');
 await page.getByRole('button',{name:'クラフト',exact:true}).click();
 assert.equal(await dialog.locator('.voxel-recipe-grid article').count(),67);
 await page.waitForFunction(()=>{const icons=[...document.querySelectorAll('.voxel-recipe-grid .voxel-item-icon')];return icons.length===13&&icons.every(i=>i.complete&&i.naturalWidth>0);});
 const planks=dialog.locator('.voxel-recipe-grid article').filter({has:page.getByText('木の板 ×4',{exact:true})});
 const before=await page.evaluate(()=>window.world.players.local.life.bag.plank);
 await planks.getByRole('button',{name:'作る',exact:true}).click();
 await page.waitForFunction(n=>window.world.players.local.life.bag.plank===n+4,before);
 await page.screenshot({path:dir+'/craft.png'});
 await page.getByRole('textbox',{name:'素材を検索'}).fill('シャベル');
 assert.equal(await dialog.locator('.voxel-item-icon').count(),4);
 await page.screenshot({path:dir+'/shovels.png'});
 await page.getByRole('textbox',{name:'素材を検索'}).fill('');
 for(const [width,height]of[[390,844],[844,390],[1280,800]]){
  await page.setViewportSize({width,height});await page.getByRole('button',{name:'建材',exact:true}).click();
  const last=dialog.locator('.voxel-material-grid button').last();await last.focus();await last.scrollIntoViewIfNeeded();
  const box=await last.boundingBox();assert(box.y>=0&&box.y+box.height<=height,JSON.stringify(box));
  const d=await dialog.boundingBox();assert(d.x>=0&&d.y>=0&&d.x+d.width<=width+1&&d.y+d.height<=height+1);
  await page.screenshot({path:dir+'/palette-'+width+'.png'});
 }
 await page.getByRole('button',{name:'閉じる ×'}).click();
 await page.getByRole('button',{name:'建材を回転'}).click();
 assert.match(await page.getByRole('button',{name:'建材を回転'}).innerText(),/90/);
 assert.deepEqual(errors,[]);
 console.log('PASS: 11 Blender meshes, 78 searchable materials, 67 recipes, crafting, rotation and scrolling at desktop/portrait/landscape sizes.');
}finally{await browser?.close();await server?.close();}
