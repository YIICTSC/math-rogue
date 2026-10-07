import assert from 'node:assert/strict';
import {preview} from 'vite';
import {chromium} from 'playwright';
const server=await preview({preview:{host:'127.0.0.1',port:4250,strictPort:true}});let browser;
try{
 browser=await chromium.launch();const page=await browser.newPage();page.setDefaultTimeout(90000);
 await page.addInitScript(()=>localStorage.setItem('pixel_spire_debug_math_skip_v1','true'));
 await page.goto('http://127.0.0.1:4250/');const logo=page.locator('.start-menu-title');await logo.waitFor();
 if(await page.locator('[data-gamepad-zone="student-grade-options"]').first().isVisible())await page.locator('[data-gamepad-zone="student-grade-options"]').first().click();
 for(let i=0;i<10;i++){
  await page.waitForTimeout(300);
  const later=page.locator('[data-gamepad-initial-scope="online-profile-register"]').getByRole('button',{name:'あとで決める',exact:true}).first();
  if(await later.isVisible())await later.click();
  await logo.click();
 }
 assert.equal(await page.getByText('(デバッグ: けいさん スキップ ON)',{exact:true}).count(),0);
 assert.notEqual(await page.evaluate(()=>localStorage.getItem('pixel_spire_debug_math_skip_v1')),'true');
 console.log('PASS: ten logo taps do not enable calculation skip, including a legacy saved flag.');
}finally{await browser?.close();await new Promise(r=>server.httpServer.close(r));}
