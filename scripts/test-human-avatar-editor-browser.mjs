import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { chromium } from 'playwright';

const dir='tmp/human-editor-qa';await fs.mkdir(dir,{recursive:true});
await fs.writeFile(`${dir}/index.html`,'<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module" src="./fixture.tsx"></script>');
await fs.writeFile(`${dir}/fixture.tsx`, `import React from 'react';import{createRoot}from'react-dom/client';import '/src/styles.css';import GakuroGolf from '/src/mini-games/gakuro-golf/GakuroGolf';import GakuroKart from '/src/mini-games/gakuro-kart/GakuroKart';createRoot(document.getElementById('root')).render(location.search.includes('golf')?<GakuroGolf onClose={()=>{}}/>:<GakuroKart onClose={()=>{}}/>);`);
let server,browser;
try{
  server=await createServer({configFile:false,plugins:[react()],cacheDir:'node_modules/.vite-human-editor',logLevel:'error',server:{host:'127.0.0.1',port:5248,strictPort:true}});await server.listen();
  browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  for(const game of ['golf','kart']){
    const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(60000);
    const open=async()=>{await page.goto(`http://127.0.0.1:5248/${dir}/index.html?${game}`);if(game==='kart')await page.getByRole('button',{name:'ひとりでレース',exact:true}).click();await page.getByRole('button',{name:'キャラクタークリエイト',exact:true}).click();};
    await open();
    await page.locator('.gk-avatar-species button').nth(0).click();
    for(const [selector,count] of [['faceShape',5],['faceStyle',4],['eyeStyle',6]]){
      assert.equal(await page.locator(`.gk-${selector} button`).count(),count);
      for(let i=0;i<count;i++){await page.locator(`.gk-${selector} button`).nth(i).click();assert.equal(await page.locator(`.gk-${selector} button`).nth(i).getAttribute('aria-pressed'),'true');}
    }
    assert.equal(await page.locator('.gk-avatar-accessories button').count(),14);
    for(let i=0;i<14;i++)await page.locator('.gk-avatar-accessories button').nth(i).click();
    await page.getByRole('button',{name:'瞳の色 2',exact:true}).click();
    await open();
    for(const [selector,i] of [['faceShape',4],['faceStyle',3],['eyeStyle',5]])assert.equal(await page.locator(`.gk-${selector} button`).nth(i).getAttribute('aria-pressed'),'true');
    assert.equal(await page.getByRole('button',{name:'瞳の色 2',exact:true}).getAttribute('aria-pressed'),'true');
    for(const size of [{width:1280,height:720},{width:390,height:844},{width:844,height:390}]){
      await page.setViewportSize(size);
      const bottom=page.locator('.gk-avatar-accessories button').last();await bottom.click();
      const bounds=await bottom.boundingBox();assert(bounds&&bounds.y>=0&&bounds.y+bounds.height<=size.height+1,'Last accessory must be reachable inside the viewport');
      assert.equal(await bottom.getAttribute('aria-pressed'),'true');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
      await page.screenshot({path:`${dir}/${game}-${size.width}x${size.height}.png`});
    }
    assert.equal(await page.locator('.gg-render-error,.gk-render-error').count(),0);assert.deepEqual(errors,[]);await page.close();
  }
  console.log('Kart and golf face/eye/accessory choices, saved appearance, and bottom-of-editor access passed at desktop, portrait and landscape sizes.');
}finally{await browser?.close();await server?.close();}
