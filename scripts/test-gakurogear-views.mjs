import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
await mkdir('tmp/gakurogear', { recursive: true });
await writeFile('tmp/gakurogear/views.tsx', `import React from 'react';import{createRoot}from'react-dom/client';import Gear from '../../src/mini-games/gakurogear/GakuroGear';createRoot(document.getElementById('root')!).render(<Gear onBack={()=>{}} problemMode={'MATH' as any} languageMode={'JAPANESE'}/>);`);
await writeFile('tmp/gakurogear/views.html', '<html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><div id="root"></div><script type="module" src="./views.tsx"></script></body></html>');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-webgl'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/tmp/gakurogear/views.html');
  await page.getByRole('button', { name: '訓練開始' }).click(); await page.waitForSelector('[data-models="blender"]');
  for (const [label, mode] of [['一人称', 'first'], ['三人称', 'third'], ['俯瞰', 'overhead']]) {
    await page.getByRole('button', {name: label, exact: true}).click(); await page.waitForSelector(`[data-view="${mode}"]`); await page.waitForTimeout(150);
    await page.screenshot({path:`tmp/gakurogear/view-${mode}.png`});
  }
  await page.keyboard.press('v'); await page.waitForSelector('[data-view="first"]');
  const position = () => page.locator('.gear-radar > circle:last-child').evaluate(e => ({ x: Number(e.getAttribute('cx')), z: Number(e.getAttribute('cy')) }));
  const before = await position();
  await page.keyboard.down('d'); await page.waitForTimeout(350); await page.keyboard.up('d'); await page.waitForTimeout(120);
  assert((await position()).x > before.x + .3, 'strafe right must follow camera orientation');
  const area = await page.locator('.gear-canvas').boundingBox();
  await page.mouse.move(area.x + area.width / 2, area.y + area.height / 2); await page.mouse.down(); await page.mouse.move(area.x + area.width / 2 + 80, area.y + area.height / 2); await page.mouse.up();
  const afterTurn = await position(); await page.keyboard.down('w'); await page.waitForTimeout(250); await page.keyboard.up('w'); await page.waitForTimeout(120);
  assert((await position()).x > afterTurn.x, 'dragged view must change forward movement');
  for (const viewport of [{width:390,height:844},{width:844,height:390}]) {
    await page.setViewportSize(viewport); await page.waitForTimeout(100);
    for (const selector of ['.gear-viewbar','.gear-controls','.gear-field']) { const b = await page.locator(selector).boundingBox(); assert(b && b.x >= 0 && b.y >= 0 && b.x+b.width <= viewport.width+1 && b.y+b.height <= viewport.height+1 && b.height > 20); }
    await page.screenshot({path:`tmp/gakurogear/view-mobile-${viewport.width}.png`});
  }
  await page.setViewportSize({width:1280,height:800});
  await page.getByRole('button',{name:'← 戻る',exact:true}).click(); await page.getByRole('button',{name:'訓練開始'}).click(); await page.waitForSelector('[data-models="blender"]');
  await page.getByRole('button',{name:'俯瞰',exact:true}).click();
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(1300); await page.keyboard.up('ArrowUp'); await page.waitForTimeout(100);
  assert((await position()).z > 3.8, 'standing player should be blocked by low shutter');
  await page.keyboard.press('c'); await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => Number(document.querySelector('.gear-radar > circle:last-child')?.getAttribute('cy')) < 3.1); await page.keyboard.up('ArrowUp');
  await page.keyboard.press('c'); await page.waitForTimeout(100); assert.equal(await page.getByRole('button',{name:/しゃがみ中/}).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'一人称',exact:true}).click(); await page.screenshot({path:'tmp/gakurogear/view-crawl.png'});
  await page.getByRole('button',{name:'俯瞰',exact:true}).click(); await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => Number(document.querySelector('.gear-radar > circle:last-child')?.getAttribute('cy')) < 1.9); await page.keyboard.up('ArrowUp'); await page.waitForTimeout(120);
  assert.equal(await page.getByRole('button',{name:/しゃがむ/}).getAttribute('aria-pressed'),'false');
  // Visit the classroom switch using real movement, then open the door.
  await page.getByRole('button',{name:'← 戻る',exact:true}).click(); await page.locator('.gear-mission').nth(1).click(); await page.getByRole('button',{name:'訓練開始'}).click(); await page.waitForSelector('[data-models="blender"]');
  await page.keyboard.press('c'); await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => Number(document.querySelector('.gear-radar > circle:last-child')?.getAttribute('cy')) < -.45); await page.keyboard.up('ArrowUp');
  assert.match(await page.locator('.gear-objective').innerText(), /扉を開く/);
  await page.keyboard.down('e'); await page.waitForTimeout(900); await page.keyboard.up('e');
  assert.equal(await page.locator('.gear-radar rect[fill="#538ea5"]').count(),0);
  await page.screenshot({path:'tmp/gakurogear/door-open.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS: three camera modes, view-relative movement, drag look, mobile layout, crawl collision/stand prevention/exit, actual switch opens door.');
} finally { await browser.close(); }
