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
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    try {
      await page.goto('http://127.0.0.1:5195/');
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
      const practice=page.getByRole('button',{name:'まずはひとりで練習する'});
      await Promise.race([practice.waitFor(),page.getByRole('button',{name:'あとで',exact:true}).waitFor()]);
      if(await page.getByRole('button',{name:'あとで',exact:true}).isVisible()) {
        await page.getByRole('button',{name:'あとで',exact:true}).click();await entry.click();
      }
      await practice.click();
      await page.getByRole('heading',{name:'木漏れ日の町',exact:true}).waitFor();
      assert.equal(await page.locator('.rpg-dev-badge').innerText(),'開発中');
      assert.equal(await page.evaluate(()=>localStorage.getItem('pixel_spire_save_state_v1')),null,'debug RPG does not create an invalid main save');
      await page.screenshot({path:'tmp/rpg-qa/debug-only-integrated.png'});
      assert.deepEqual(errors,[]);
    } finally {await page.close();await server.close();}
  }
  console.log('RPG access: hidden in normal build and inactive debug, available only after debug activation; development label and save isolation passed.');
} finally {await browser.close();}
