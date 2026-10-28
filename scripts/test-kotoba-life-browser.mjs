import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { chromium } from 'playwright';

const directory = 'tmp/kotoba-life-browser';
const saveKey = 'learning-rogue:kotoba-life:v1';
await mkdir(directory, { recursive: true });
await writeFile(`${directory}/index.html`, '<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>html,body,#root{margin:0;width:100%;height:100%;overflow:hidden}</style><body><div id="root"></div><script type="module" src="./entry.tsx"></script></body></html>');
await writeFile(`${directory}/entry.tsx`, `import React from 'react';
import {createRoot} from 'react-dom/client';
import KotobaLife from '/src/mini-games/kotoba-life/KotobaLife';
import {GameMode} from '/src/types';
import '/src/styles.css';
const assignment={id:'kotoba-browser-questions',title:'Energy questions',units:[],customProblems:[0,1,2].map(i=>({id:'energy-'+i,question:'1 + 1 = ?',answer:'2',options:['2','3','4','5']})),dueAt:'2099-01-01T00:00:00.000Z',gameMode:'FREE',answerMode:'CHOICE',createdAt:'2026-10-28T00:00:00.000Z'};
window.__answers=[];
createRoot(document.getElementById('root')).render(<KotobaLife onBack={()=>{window.__leftGame=true;}} problemMode={GameMode.ADDITION} assignment={assignment} onAnswerResult={answer=>window.__answers.push(answer)} languageMode={location.search.includes('en')?'ENGLISH':'JAPANESE'}/>);`);

const server = await createServer({ configFile: false, plugins: [react(), { name: 'pages-path-rebase', transform(code, id) { if (id.endsWith('/kotoba-life/data.ts')) return code.replaceAll('/sprites/', '/math-rogue/sprites/'); } }], base: '/math-rogue/', define: { __APP_ASSET_VERSION__: JSON.stringify('kotoba-browser-test') }, server: { host: '127.0.0.1', port: 0, hmr: false }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [], missing = [];
const url = `http://127.0.0.1:${server.httpServer.address().port}/math-rogue/${directory}/index.html`;
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const observe = p => {
  p.on('pageerror', error => errors.push(error.message));
  p.on('response', response => { if (response.status() === 404 && /kotoba-life/.test(response.url())) missing.push(response.url()); });
  p.setDefaultTimeout(60000);
};
observe(page);
await page.addInitScript(() => {
  window.__kotobaDraws = 0;
  for (const ctor of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    if (!ctor) continue;
    for (const method of ['drawElements', 'drawArrays']) {
      const original = ctor.prototype[method];
      ctor.prototype[method] = function (...args) { window.__kotobaDraws++; return original.apply(this, args); };
    }
  }
});

const saved = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);
const button = name => page.getByRole('button', { name, exact: true });
const closeDialog = async () => { await page.getByRole('dialog').getByRole('button', { name: '閉じる', exact: true }).click(); await page.getByRole('dialog').waitFor({ state: 'hidden' }); };
const shot = async name => {await page.screenshot({ path: `${directory}/${name}.png` });console.log('Screenshot:',name);};
const assertNoOverflow = async (p, label) => assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1 || document.querySelector('.kl-root').scrollWidth > innerWidth + 1), false, `${label}: no horizontal overflow`);
const assertInViewport = async (p, selector, label) => {
  const bounds = await p.locator(selector).evaluateAll(nodes => nodes.map(node => ({ text: node.getAttribute('aria-label') || node.textContent, ...node.getBoundingClientRect().toJSON() })));
  const viewport = p.viewportSize();
  for (const box of bounds) assert(box.x >= -.5 && box.y >= -.5 && box.right <= viewport.width + .5 && box.bottom <= viewport.height + .5, `${label}: ${box.text} outside viewport: ${JSON.stringify(box)}`);
};
const showSettings = async tab => {
  await button('ともだち・おへやを選ぶ').click();
  await page.getByRole('tab', { name: tab, exact: true }).click();
};
const teach = async (value, category = 'thing', reading = value) => {
  await button('ことば').click();
  await page.locator('#kl-word').fill(value);
  if (await page.locator('#kl-reading').count()) await page.locator('#kl-reading').fill(reading);
  await page.locator('#kl-category').selectOption(category);
  await button('このことばを教える').click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
};
const readDialogue = async ({ chooseReply = false } = {}) => {
  const texts = [];
  for (let step = 0; step < 24; step++) {
    texts.push(await page.locator('.kl-dialogue>p').innerText());
    const next = button('つぎのおはなし');
    if (await next.count()) { await next.click(); continue; }
    const choices = page.locator('.kl-reply-choices button');
    if (chooseReply && await choices.count()) { await choices.first().click(); chooseReply = false; continue; }
    break;
  }
  return texts.join('\n');
};

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.getByRole('heading', { name: 'ことば日和', exact: true }).waitFor();
  await page.evaluate(async () => {
    for (const path of ['title', ...['sunroom','tatami','loft','seaside','forest','atelier','rainy','attic'].map(id => `rooms/${id}`), ...['bakery','florist','station'].map(id => `town/${id}`)]) {
      const image = new Image(); image.src = `/math-rogue/sprites/kotoba-life/${path}.webp`; await image.decode();
    }
  });
  await shot('title-desktop');
  await button('小さな暮らしをはじめる').click();
  assert.equal(await page.locator('.kl-friend-choices button').count(), 5, 'All five companions are available immediately');
  await page.locator('.kl-friend-choices').getByRole('button', { name: 'もも', exact: true }).click();
  await page.getByRole('tab', { name: 'おへや', exact: true }).click();
  assert.equal(await page.locator('.kl-room-choices button').count(), 8, 'All eight rooms are available immediately');
  await page.locator('.kl-room-choices img').evaluateAll(async images => { for (const image of images) { image.loading='eager'; await image.decode(); if (!image.naturalWidth || image.src.includes('/math-rogue/math-rogue/')) throw Error('Room image did not load from the deployed base'); } });
  await page.locator('.kl-room-choices').getByRole('button', { name: '海辺の家', exact: true }).click();
  await button('この暮らしをはじめる').click();
  await page.locator('.kl-living').waitFor();
  assert.equal((await saved()).character, 'momo');
  assert.equal((await saved()).room, 'seaside');
  assert.equal((await saved()).energy, 6);
  await page.waitForFunction(() => window.__kotobaDraws > 30 && document.querySelector('.kl-character-stage [data-renderer="webgl"] canvas')?.width > 0);

  await teach('りんご', 'food');
  let state = await saved();
  assert.equal(state.energy, 5);
  assert.equal(state.companions.momo.words[0].value, 'りんご');
  await button('ことば').click();
  await page.locator('#kl-word').fill('りんご');
  await button('このことばを教える').click();
  await page.getByRole('alert').filter({ hasText: 'もう覚えている' }).waitFor();
  assert.equal((await saved()).energy, 5, 'Duplicate teaching never spends energy');
  await closeDialog();
  await button('おしゃべり').click();
  assert.match(await readDialogue({ chooseReply: true }), /りんご/, 'Conversation actually uses the taught word');
  assert.equal((await saved()).energy, 5, 'Chat and replies are free');
  for (const action of ['なでなで', 'おやつにしよう', 'いっしょに遊ぶ', 'のんびり休む']) {
    await button('ふれあい').click();
    await page.locator('.kl-care-list').getByRole('button', { name: new RegExp(action) }).click();
    assert.equal((await saved()).energy, 5, `${action} is free`);
  }

  for (const [id, name] of [['mugi','むぎ'],['momo','もも'],['sora','そら'],['kohaku','こはく'],['pico','ぴこ']]) {
    await showSettings('ともだち');
    await page.locator('.kl-friend-choices').getByRole('button', { name, exact: true }).click();
    await closeDialog();
    await page.waitForFunction(id => document.querySelector(`.kl-character-stage [data-character="${id}"][data-renderer="webgl"] canvas`)?.width > 0, id);
    const before = await page.evaluate(() => window.__kotobaDraws);
    await page.waitForFunction(before => window.__kotobaDraws > before + 30, before);
    assert.equal((await saved()).energy, 5, 'Changing companion does not reset energy');
    await shot(`companion-${id}`);
  }
  await showSettings('ともだち');
  await page.locator('.kl-friend-choices').getByRole('button', { name: 'もも', exact: true }).click();
  assert.equal((await saved()).companions.momo.words[0].value, 'りんご', 'Words belong to their companion');
  await closeDialog();
  const rooms = [['sunroom','木漏れ日の部屋'],['tatami','畳の小部屋'],['loft','街のロフト'],['seaside','海辺の家'],['forest','森のコテージ'],['atelier','小さなアトリエ'],['rainy','雨音の部屋'],['attic','屋根裏の部屋']];
  for (const [id, name] of rooms) {
    await showSettings('おへや');
    await page.locator('.kl-room-choices').getByRole('button', { name, exact: true }).click();
    await closeDialog();
    assert.equal((await saved()).room, id);
    assert.match(await page.locator('.kl-world').evaluate(node => getComputedStyle(node).backgroundImage), new RegExp(`rooms/${id}\\.webp`));
    await shot(`room-${id}`);
  }

  for (const [id, name] of [['bakery','川村さん'],['florist','佐伯さん'],['station','中村さん']]) {
    const friendship = (await saved()).companions.momo.friendships[id];
    await button('おさんぽ').click();
    await page.locator('.kl-town-choices').getByRole('button', { name: new RegExp(name) }).click();
    const pause = button('自動再生を止める'); if (await pause.count()) await pause.click();
    assert.match(await page.locator('.kl-world').evaluate(node => getComputedStyle(node).backgroundImage), new RegExp(`town/${id}\\.webp`));
    const lines = await readDialogue({ chooseReply: true });
    assert.match(lines, /りんご/, `${id}: the companion brings a taught word to town`);
    assert((await saved()).companions.momo.friendships[id] > friendship, `${id}: the visit grows friendship`);
    assert.equal((await saved()).energy, 5, 'Town visits are free');
    await shot(`town-${id}`);
    await button('おへやに帰る').click();
  }

  await teach('宇宙', 'thing', 'うちゅう');
  for (const [value, category] of [['ひだまり','place'],['おえかき','activity'],['うれしい','feeling'],['あおい','person']]) await teach(value, category);
  assert.equal((await saved()).energy, 0);
  await button('ことば').click();
  assert.equal(await page.locator('#kl-word').count(), 0, 'Teaching is unavailable when energy is empty');
  await button('問題でチャージする').click();
  await page.locator('.kl-study').waitFor();
  await page.locator('.kl-study>header').getByRole('button', { name: 'おへやに戻る', exact: true }).click();
  assert.equal((await saved()).energy, 0, 'Cancelling a quiz gives no energy');
  await button('ことば').click(); await button('問題でチャージする').click();
  for (let index = 0; index < 3; index++) {
    await page.locator('.kl-study').getByRole('button', { name: index === 0 ? '2' : '3', exact: true }).click();
    await page.waitForFunction(count => window.__answers.length >= count, index + 1);
  }
  await page.locator('.kl-study').waitFor({ state: 'hidden' });
  assert.equal((await saved()).energy, 2, 'One correct answer out of three restores exactly two energy');
  assert.equal(await page.evaluate(() => window.__answers.filter(answer => answer.correct).length), 1);
  assert.equal(await page.evaluate(() => window.__answers.every(answer => answer.mode === 'ASSIGNMENT_CUSTOM')), true, 'Quiz keeps the chosen assignment');

  const snapshot = await saved();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await button('ももに会いにいく').click();
  state = await saved();
  assert.deepEqual(state.companions, snapshot.companions, 'Words, growth, memories and friendships survive reload');
  assert.equal(state.energy, 2);
  assert.equal(state.character, 'momo');
  assert.equal(state.room, 'attic');
  for (const [width, height] of [[320,568],[390,844],[844,390],[1280,800]]) {
    await page.setViewportSize({ width, height });
    await assertNoOverflow(page, `${width}x${height}`);
    await assertInViewport(page, '.kl-header,.kl-action-dock,.kl-dialogue', `${width}x${height}`);
    for (const box of await page.locator('.kl-action-dock button').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON()))) assert(box.width >= 44 && box.height >= 44, 'Primary touch actions are at least 44px');
    await shot(`living-${width}`);
    await button('ことば').click();
    await page.locator('#kl-word').fill('あした');
    await page.locator('#kl-word').focus();
    await button('このことばを教える').scrollIntoViewIfNeeded();
    await assertInViewport(page, '.kl-dialog', `Teaching dialog ${width}`);
    await shot(`teaching-${width}`);
    await closeDialog();
    await showSettings('おへや');
    await page.locator('.kl-room-choices button').last().scrollIntoViewIfNeeded();
    await page.getByRole('dialog').getByRole('button', { name: 'おへやに戻る', exact: true }).scrollIntoViewIfNeeded();
    await assertNoOverflow(page, `Room picker ${width}`);
    await shot(`rooms-menu-${width}`);
    await page.getByRole('dialog').getByRole('button', { name: 'おへやに戻る', exact: true }).click();
    await button('ふたりの手帳').click();
    await page.getByRole('tab', { name: '思い出', exact: true }).click();
    await assertInViewport(page, '.kl-dialog', `Notebook ${width}`);
    await shot(`notebook-${width}`);
    await closeDialog();
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await button('おしゃべり').click();
  await page.locator('.kl-dialogue>p').waitFor();
  await shot('reduced-motion');
  await button('タイトルへ戻る').click();
  await button('ゲーム一覧').click();
  assert.equal(await page.evaluate(() => window.__leftGame), true);

  const english = await browser.newPage({ viewport: { width: 390, height: 844 } }); observe(english);
  await english.goto(url + '?en', { waitUntil: 'domcontentloaded' });
  await english.getByRole('button', { name: 'Begin our little life', exact: true }).click();
  await english.getByRole('button', { name: 'Make ourselves at home', exact: true }).click();
  await english.getByRole('button', { name: 'Chat', exact: true }).click();
  assert.equal(/[ぁ-ゖァ-ヺ一-龯]/u.test(await english.locator('.kl-root').innerText()), false, 'English UI and authored dialogue contain no Japanese');
  await assertNoOverflow(english, 'English mobile');
  await english.screenshot({ path: `${directory}/english-mobile.png` });

  const fallback = await browser.newPage({ viewport: { width: 390, height: 844 } }); observe(fallback);
  await fallback.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) { return /^webgl/.test(kind) ? null : getContext.call(this, kind, ...args); };
  });
  await fallback.goto(url, { waitUntil: 'domcontentloaded' });
  await fallback.getByRole('button', { name: '小さな暮らしをはじめる', exact: true }).click();
  await fallback.getByRole('button', { name: 'この暮らしをはじめる', exact: true }).click();
  await fallback.locator('.kl-character-stage [data-renderer="fallback"] svg').waitFor();
  await fallback.getByRole('button', { name: 'なでる', exact: true }).click();
  await fallback.screenshot({ path: `${directory}/webgl-fallback.png` });
  assert.deepEqual(errors, [], 'No unhandled browser errors');
  assert.deepEqual(missing, [], 'All generated game assets load');
  console.log('PASS: Kotoba Days title, five live 3D companions, eight rooms, vocabulary, energy quiz, free care, town exchanges, persistence, mobile/English layouts and WebGL fallback.');
} catch(error) { await page.screenshot({path:directory+'/failure.png'}); console.error(await page.locator('body').innerText()); throw error; } finally {
  await browser.close();
  await server.close();
}
