import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
await mkdir('tmp/gakurogear', { recursive: true });
await writeFile('tmp/gakurogear/entry.tsx', `import React from 'react';import{createRoot}from'react-dom/client';import Gear from '../../src/mini-games/gakurogear/GakuroGear';createRoot(document.getElementById('root')!).render(<Gear onBack={()=>{document.body.dataset.back='yes'}} problemMode={'MATH' as any} languageMode={'JAPANESE'}/>);`);
await writeFile('tmp/gakurogear/index.html', '<html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><div id="root"></div><script type="module" src="./entry.tsx"></script></body></html>');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-webgl'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/tmp/gakurogear/index.html');
  await page.getByRole('button', { name: '訓練開始' }).click();
  await page.waitForSelector('[data-models="blender"]');
  await page.locator('.gear-canvas canvas').waitFor();
  await page.keyboard.press('c');
  assert.equal(await page.getByRole('button', { name: /しゃがみ中/ }).getAttribute('aria-pressed'), 'true');
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(2000); await page.keyboard.up('ArrowUp');
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  const clock = await page.locator('.gear-hud').innerText(); await page.waitForTimeout(600); assert.equal(await page.locator('.gear-hud').innerText(), clock);
  await page.getByRole('button', { name: '再開', exact: true }).click();
  await page.keyboard.press('q'); await page.waitForTimeout(150);
  assert.match(await page.locator('.gear-controls').innerText(), /音のデコイ 2/);
  await page.screenshot({ path: 'tmp/gakurogear/desktop.png' });
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport); await page.waitForTimeout(200);
    for (const selector of ['.gear-controls', '.gear-header', '.gear-hud', '.gear-field']) { const b = await page.locator(selector).boundingBox(); assert(b && b.x >= 0 && b.y >= 0 && b.x + b.width <= viewport.width + 1 && b.y + b.height <= viewport.height + 1, `${selector} clipped`); }
    await page.screenshot({ path: `tmp/gakurogear/mobile-${viewport.width}.png` });
  }
  await page.getByRole('button', { name: '← 戻る', exact: true }).click();
  assert.equal(await page.locator('canvas').count(), 0);
  for (let tier = 0; tier < 5; tier++) {
    await page.locator('.gear-difficulties button').nth(tier).click();
    assert.equal(await page.locator('.gear-mission').count(),10);
    for (let i = 0; i < 10; i++) {
      await page.locator('.gear-mission').nth(i).click(); await page.getByRole('button', { name: '訓練開始' }).click(); await page.waitForSelector('[data-models="blender"]'); await page.waitForTimeout(100); await page.getByRole('button', { name: '← 戻る', exact: true }).click();
    }
  }
  await page.locator('.gear-difficulties button').first().click();
  await page.locator('.gear-mission').nth(6).click(); await page.getByRole('button', {name:'訓練開始'}).click(); await page.waitForSelector('[data-models="blender"]');
  await page.keyboard.press('c'); await page.keyboard.down('ArrowUp'); await page.locator('.gear-action-ready').waitFor({timeout:15000}); await page.keyboard.up('ArrowUp');
  await page.keyboard.down('f'); await page.waitForTimeout(1300); await page.keyboard.up('f');
  assert.match(await page.locator('.gear-equipment').innerText(), /ホールド 1\/1/);
  assert.match(await page.locator('.gear-equipment').innerText(), /おやすみ中 1/);
  await page.screenshot({path:'tmp/gakurogear/hold.png'});
  await page.getByRole('button', { name: '← 戻る', exact: true }).click();
  await page.locator('.gear-mission').nth(7).click(); await page.getByRole('button', {name:'訓練開始'}).click(); await page.waitForSelector('[data-models="blender"]');
  await page.getByRole('button', {name:/シャボン銃/}).click(); await page.waitForTimeout(200);
  assert.match(await page.locator('.gear-equipment').innerText(), /シャボン命中 1\/1/);
  await page.screenshot({path:'tmp/gakurogear/bubble.png'});
  await page.getByRole('button', { name: '← 戻る', exact: true }).click();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.locator('.gear-mission').first().click(); await page.getByRole('button', { name: '訓練開始' }).click(); await page.waitForSelector('[data-models="blender"]');
  await page.keyboard.press('c');
  async function move(key, axis, target, sign) {
    await page.keyboard.down(key);
    try { await page.waitForFunction(({ axis, target, sign }) => { const p = document.querySelector('.gear-radar > circle:last-child'); return p && (Number(p.getAttribute(axis)) - target) * sign >= 0; }, { axis, target, sign }, { timeout: 25000 }); }
    finally { await page.keyboard.up(key); }
  }
  await move('ArrowUp', 'cy', -5, -1);
  await page.keyboard.down('e'); await page.waitForTimeout(1100); await page.keyboard.up('e');
  assert.match(await page.locator('.gear-hud').innerText(), /1 \/ 1/);
  await move('ArrowUp', 'cy', -7, -1);
  await move('ArrowRight', 'cx', 6.9, 1);
  await page.keyboard.down('ArrowDown'); await page.getByRole('heading', { name: 'MISSION COMPLETE' }).waitFor({ timeout: 5000 }); await page.keyboard.up('ArrowDown');
  assert(await page.evaluate(() => JSON.parse(localStorage.getItem('gakurogear-vr-v1'))[1].time > 0));
  await page.screenshot({ path: 'tmp/gakurogear/clear.png' });
  await page.getByRole('button', { name: '次のミッション' }).click(); await page.waitForTimeout(200); assert.match(await page.locator('.gear-hud').innerText(), /MISSION 02/);
  await page.getByRole('button', { name: '← 戻る', exact: true }).click();
  await page.reload(); await page.locator('.gear-mission').first().waitFor(); assert.match(await page.locator('.gear-mission').first().innerText(), /[SAB]$/);
  assert.deepEqual(errors, []);
  console.log('PASS: all 50 missions launch; five difficulty filters, actual rear hold and bubble shot, Blender GLB loads, movement/crouch/decoy/pause, portrait/landscape layout, actual keyboard collection and extraction, next mission, saved score after reload, exit cleanup, no browser errors.');
} finally { await browser.close(); }
