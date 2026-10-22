import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createServer } from 'vite';
import { chromium } from 'playwright';
const out = 'tmp/mahjong-qa'; await fs.mkdir(out, { recursive: true });
let server, browser;
try {
  server = await createServer({ logLevel: 'error', cacheDir: 'node_modules/.vite-mahjong-qa', optimizeDeps: { entries: ['scripts/fixtures/mahjong.tsx'] }, server: { host: '127.0.0.1', port: 0, hmr: false }, plugins: [{ name: 'mahjong-qa', enforce: 'pre',
    configureServer(s) { s.middlewares.use('/mahjong-test', async (req, res) => { res.setHeader('Content-Type', 'text/html'); res.end(await s.transformIndexHtml(req.url, '<html><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><body style="margin:0"><div id="root" style="height:100dvh"></div><script type="module" src="/scripts/fixtures/mahjong.tsx"></script></body></html>')); }); },
    transform(source, id) { if (!id.endsWith('/mahjong/MahjongGame.tsx')) return; return `import {flushSync as qaFlush} from 'react-dom';\n` + source.replace('  const title = mode', `  Object.assign(window,{__mahjong:{table,rogue,mode,selection,setTable:(v:any)=>qaFlush(()=>setTable(v)),setRogue:(v:any)=>qaFlush(()=>setRogue(v))}});\n  const title = mode`); },
  }] });
  await server.listen();
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, hasTouch: true }); page.setDefaultTimeout(60000);
  const errors = []; page.on('pageerror', e => { errors.push(e.message); console.error('Mahjong page error:', e.message); });
  const base = `http://127.0.0.1:${server.httpServer.address().port}/mahjong-test`;
  await page.goto(base); await page.getByRole('heading', { name: '放課後麻雀', exact: true }).waitFor();
  await page.locator('.mj-hero img').evaluateAll(async imgs => Promise.all(imgs.map(img => img.decode())));
  await page.screenshot({ path: `${out}/lobby-desktop.png`, fullPage: true });
  await page.getByRole('button', { name: '開始', exact: true }).first().click();
  assert.equal(await page.locator('.mj-seat').count(), 4); assert.equal(await page.locator('.mj-hand [data-tile-id]').count(), 13);
  await page.getByRole('button', { name: 'ツモる', exact: true }).click();
  assert.equal(await page.locator('.mj-hand [data-tile-id]').count(), 14);
  await page.locator('.mj-hand img').evaluateAll(async imgs => Promise.all(imgs.map(img => img.decode())));
  await page.screenshot({ path: `${out}/table-desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${out}/table-portrait.png`, fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  const bounds = await page.locator('.mj-hand .mj-tile-button').evaluateAll(buttons => buttons.map(b => { const r = b.getBoundingClientRect(); return { x: r.x, right: r.right, h: r.height }; }));
  assert.ok(bounds.every(r => r.x >= 0 && r.right <= 391 && r.h >= 44));
  await page.setViewportSize({ width: 844, height: 390 }); await page.screenshot({ path: `${out}/table-landscape.png`, fullPage: true });
  await page.getByRole('button', { name: '形のヒント' }).click(); assert.equal(await page.locator('.mj-hand .is-selected').count(), 1);
  await page.getByRole('button', { name: '捨てる', exact: true }).click();
  await page.waitForFunction(() => __mahjong.table.turn === 0 || __mahjong.table.phase === 'result' || (__mahjong.table.phase === 'reaction' && __mahjong.table.pending.calls.some(c => c.seat === 0)));
  // A controlled real winning hand checks the win declaration and settlement UI.
  await page.evaluate(async () => {
    const { createTable } = await import('/src/mini-games/mahjong/table.ts');
    const t = createTable(); t.turn = 0; t.phase = 'discard'; t.interrupted=true;
    t.players[0].hand = [0,1,2,3,4,5,12,13,14,19,20,21,13,13].map((type,i)=>({id:'win-'+i,type})); t.drawn = 'win-11';
    __mahjong.setTable(t);
  });
  await page.getByRole('button', { name: 'ツモ和了', exact: true }).click();
  await page.getByRole('dialog').waitFor(); assert.match(await page.locator('.mj-yaku-list').innerText(), /平和/);
  await page.screenshot({ path: `${out}/settlement.png`, fullPage: true });
  await page.getByRole('button', { name: '次の局へ' }).click();
  assert.equal(await page.locator('[role=dialog]').count(), 0);
  await page.evaluate(async () => {
    const {createTable,tableStep}=await import('/src/mini-games/mahjong/table.ts');
    const t=createTable();t.turn=3;t.phase='discard';
    t.players.forEach((p,s)=>{p.hand=[0,2,4,6,8,9,11,13,15,17,27,29,31].map((type,i)=>({type,id:`no-${s}-${i}`}));});
    t.players[0].hand=[0,1,5,6,9,11,14,16,18,20,23,25,30].map((type,i)=>({type,id:`chi-${i}`}));
    t.players[3].hand.push({type:2,id:'called'});
    __mahjong.setTable(tableStep(t,{type:'discard',id:'called'}));
  });
  await page.getByRole('button',{name:'チー',exact:true}).click();
  assert.equal(await page.evaluate(()=>__mahjong.table.players[0].melds.length),1);
  assert.equal(await page.locator('.mj-hand [data-tile-id]').count(),11);
  assert.equal(await page.getByRole('button',{name:'ツモる',exact:true}).count(),0);
  await page.getByRole('button', { name: '戻る', exact: true }).click();
  await page.getByRole('button', { name: '開始', exact: true }).nth(2).click();
  assert.equal(await page.locator('.mj-hand [data-tile-id]').count(), 16);
  await page.getByRole('button', { name: '形のヒント', exact: true }).click();
  const selected = await page.locator('.mj-hand .is-selected').count(); assert.ok(selected >= 2 && selected <= 3);
  await page.getByRole('button', { name: /組を確定/ }).click();
  assert.equal(await page.evaluate(() => __mahjong.rogue.banks.length), 1);
  const before = await page.evaluate(() => __mahjong.rogue.exchanges);
  await page.locator('.mj-hand .mj-tile-button').first().click(); await page.getByRole('button', { name: '選んだ牌を交換' }).click();
  assert.equal(await page.evaluate(() => __mahjong.rogue.exchanges), before - 1);
  await page.setViewportSize({ width: 1280, height: 900 }); await page.screenshot({ path: `${out}/rogue-desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: `${out}/rogue-portrait.png`, fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.locator('.mj-screen').evaluate(el=>el.scrollTop=0);
  await page.screenshot({path:`${out}/rogue-portrait-top.png`});
  const savedStage = await page.evaluate(() => __mahjong.rogue.banks.length);
  await page.reload(); await page.getByRole('button', { name: '続きから' }).click();
  assert.equal(await page.evaluate(() => __mahjong.rogue.banks.length), savedStage);
  // Shop purchase and saved next-gate progression.
  await page.evaluate(async () => {
    const { rogueStep } = await import('/src/mini-games/mahjong/rogue.ts');
    let s = __mahjong.rogue; s.banks=[]; s.phase='play';
    for(const [n,values] of [[0,[0,1,2]],[1,[9,10,11]],[2,[18,19,20]],[3,[31,31,31]],[4,[27,27]]]){
      const group=values.map((type,i)=>({type,id:`shop-${n}-${i}`}));s.hand=[...group,...s.hand].slice(0,16);s=rogueStep(s,{type:'bank',ids:group.map(t=>t.id)});
    } __mahjong.setRogue(s);
  });
  await page.getByRole('heading', { name: /旅のショップ/ }).waitFor();
  await page.screenshot({ path: `${out}/shop-portrait.png`, fullPage: true });
  await page.locator('.mj-shop-grid button:not(:disabled)').first().click();
  assert.equal(await page.locator('.mj-shop-grid button:has-text("購入済み")').count(), 1);
  await page.getByRole('button', { name: '次の関門へ' }).click();
  assert.equal(await page.evaluate(() => __mahjong.rogue.stage), 2);
  await page.getByRole('button', { name: 'ルールと役' }).click(); assert.equal(await page.getByRole('dialog').count(), 1);
  await page.getByRole('button', { name: '閉じる', exact: true }).click();
  for (const lang of ['en','hi']) {
    await page.goto(`${base}?lang=${lang}`); await page.locator('.mj-mode-cards article').first().waitFor();
    if(lang==='en') assert.equal(/[ぁ-んァ-ヶ一-龠]/.test(await page.locator('.mj-content').innerText()), false);
    await page.locator('.mj-mode-cards article button').first().click();
    await page.screenshot({ path: `${out}/table-${lang}.png`, fullPage: true });
    if(lang==='en') assert.equal(/[ぁ-んァ-ヶ一-龠]/.test(await page.locator('.mj-content').innerText()), false);
    await page.locator('.mj-header>button').first().click();
    await page.locator('.mj-mode-cards article').nth(2).getByRole('button').first().click();
    if(lang==='en') assert.equal(/[ぁ-んァ-ヶ一-龠]/.test(await page.locator('.mj-content').innerText()), false);
    await page.locator('.mj-header>button').last().click();
    if(lang==='en') assert.equal(/[ぁ-んァ-ヶ一-龠]/.test(await page.locator('.mj-modal').innerText()), false);
    if(lang==='hi') assert.equal(/[一-龠]/.test(await page.locator('.mj-modal').innerText()), false);
    await page.locator('.mj-modal button').click();
  }
  assert.deepEqual(errors, []); console.log('Mahjong browser QA passed: desktop, portrait, landscape, calls, win UI, rogue banking/exchange/shop/save, English and hiragana.');
} finally { await browser?.close(); await server?.close(); }
