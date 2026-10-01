import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
try {
  for(const debug of [false,true]) {
    const server=await createServer({
      cacheDir:`node_modules/.vite-rpg-access-${debug}`,
      define:{'import.meta.env.VITE_ENABLE_DEBUG_FEATURES':JSON.stringify(String(debug))},
      optimizeDeps:{entries:['index.html']},
      server:{host:'127.0.0.1',port:5195,strictPort:true},
    });
    await server.listen();
    const adminPage=await browser.newPage({viewport:{width:1440,height:1000}});
    try {
      await adminPage.goto('http://127.0.0.1:5195/?adminDebug=1', {waitUntil:'domcontentloaded',timeout:120000});
      await adminPage.getByRole('button',{name:'小学5年生',exact:true}).click();
      await adminPage.getByRole('button',{name:'あとで決める',exact:true}).last().click();
      if(debug) {
        const entry=adminPage.getByRole('button',{name:'RPGオンライン 開発中・デバッグ限定'});
        await entry.waitFor();
        assert.equal(await entry.isVisible(),true,'admin URL opens the title with debug enabled');
        assert.equal(await adminPage.getByRole('button',{name:'問題デバッグ',exact:true}).count(),0,'admin URL stays on the title instead of opening the debug menu');
      } else {
        assert.equal(await adminPage.getByRole('button',{name:'RPGオンライン 開発中・デバッグ限定'}).count(),0,'admin URL cannot enable a production build without debug features');
      }
    } finally {await adminPage.close();}
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    try {
      await page.goto('http://127.0.0.1:5195/', {waitUntil:'domcontentloaded',timeout:120000});
      await page.getByRole('button',{name:'小学5年生',exact:true}).click();
      await page.getByRole('button',{name:'あとで決める',exact:true}).last().click();
      const entry=page.getByRole('button',{name:'RPGオンライン 開発中・デバッグ限定'});
      assert.equal(await entry.count(),0,`hidden before entering debug mode (flag ${debug})`);
      await page.locator('.start-menu-version').click();
      const unlock=page.getByRole('button',{name:'System Release Notes v1.0.7',exact:true});
      if(!debug){assert.equal(await unlock.count(),0,'normal build cannot unlock debug');continue;}
      for(let i=0;i<10;i++)await unlock.click();
      await page.getByRole('button',{name:'戻る',exact:true}).first().click();
      await entry.waitFor();
      await entry.click();
      const modeSelection=page.getByRole('heading',{name:'モード選択',exact:true});
      if(await page.getByRole('button',{name:'あとで',exact:true}).isVisible())
        await page.getByRole('button',{name:'あとで',exact:true}).click();
      await modeSelection.waitFor();
      assert.equal(await page.evaluate(()=>localStorage.getItem('pixel_spire_save_state_v1')),null,'debug RPG does not create an invalid main save');
      await page.screenshot({path:'tmp/rpg-qa/debug-only-integrated.png'});
      assert.deepEqual(errors,[]);
    } finally {await page.close();await server.close();}
  }
  console.log('RPG access: hidden in normal build and inactive debug, available only after debug activation; development label and save isolation passed.');
} finally {await browser.close();}
