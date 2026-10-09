import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
// PeerServer owns recurring maintenance timers; isolate it so teardown clears every timer.
const signaling = spawn(process.execPath, ['--input-type=module', '-e', `import { PeerServer } from 'peer'; PeerServer({ host: '127.0.0.1', port: 9014, path: '/golf' }, () => process.send('ready'));`], { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
await new Promise((resolve, reject) => { const timeout = setTimeout(() => { signaling.kill(); reject(new Error('Signaling server did not start')); }, 10000); signaling.once('message', () => { clearTimeout(timeout); resolve(); }); signaling.once('error', error => { clearTimeout(timeout); reject(error); }); });
const server = await createServer({
  cacheDir: 'node_modules/.vite-golf-test', optimizeDeps: { entries: ['index.html'] },
  define: { 'import.meta.env.VITE_ONLINE_SERVER_URL': '""', 'import.meta.env.VITE_ENABLE_DEBUG_FEATURES': '"true"', 'import.meta.env.VITE_RPG_PEER_HOST': '"127.0.0.1"', 'import.meta.env.VITE_RPG_PEER_PORT': '"9014"', 'import.meta.env.VITE_RPG_PEER_PATH': '"/golf"', 'import.meta.env.VITE_RPG_PEER_SECURE': '"false"', 'import.meta.env.VITE_GOLF_ICE_SERVERS': '"[]"' },
  server: { host: '127.0.0.1', port: 5194, strictPort: true, watch: null, hmr: false },
  plugins: [{ name: 'golf-test-only', enforce: 'pre', async load(id) {
    if (id.endsWith('/src/App.tsx')) { const code = await readFile(id, 'utf8'); const at = code.lastIndexOf('\n    return ('); return code.slice(0, at) + '\n window.__golfApp = { debug: (v) => setIsDebugMode(v), screen: gameState.screen, setScreen: (screen) => setGameState(s => ({...s, screen})), language: setLanguageMode };\n' + code.slice(at); }
    if (id.endsWith('/gakuro-golf/GakuroGolf.tsx')) { const code = await readFile(id, 'utf8'); return code.replace('  return <TranslatedUiTree', '  window.__golf = { room: room.current, view, selectLesson };\n  return <TranslatedUiTree'); }
  }, configureServer(s) { s.middlewares.use('/__golf-network', (_req, res) => { res.setHeader('Content-Type', 'text/html'); res.end('<html><body><script type="module">import {GolfRoom, validView} from "/src/mini-games/gakuro-golf/network.ts"; window.GolfRoom=GolfRoom; window.validView=validView;</script></body></html>'); }); } }],
});
await server.listen();
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); page.setDefaultTimeout(45000);
await page.addInitScript(() => localStorage.setItem('pixel_spire_language_mode_v1', 'JAPANESE'));
const errors = []; page.on('pageerror', e => errors.push(e.message));
try {
  await mkdir('tmp/golf-qa', { recursive: true });
  await page.goto('http://127.0.0.1:5194/', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.getByRole('button', { name: '小学5年生', exact: true }).click();
  await page.getByRole('button', { name: 'あとで決める', exact: true }).last().click();
  await page.waitForFunction(() => !!window.__golfApp);
  assert.equal(await page.getByRole('button', { name: 'GAKURO GOLF 40人オンラインゴルフ' }).count(), 0);
  await page.evaluate(() => window.__golfApp.setScreen('GAKURO_GOLF'));
  await page.waitForFunction(() => window.__golfApp.screen === 'START_MENU');
  await page.evaluate(() => window.__golfApp.debug(true));
  await page.getByRole('button', { name: 'GAKURO GOLF 40人オンラインゴルフ' }).click();
  const later = page.getByRole('button', { name: 'あとで', exact: true });
  await Promise.race([later.waitFor(), page.locator('.gg-root').waitFor()]);
  if (await later.isVisible()) { await later.click(); if (!await page.locator('.gg-root').count()) await page.getByRole('button', { name: 'GAKURO GOLF 40人オンラインゴルフ' }).click(); }
  console.log('Debug golf entry opened.');
  await page.getByRole('button', { name: 'キャラクタークリエイト', exact: true }).click();
  const creator = page.getByRole('dialog', { name: 'キャラクタークリエイト' });
  await creator.getByRole('button', { name: 'ウサギ', exact: true }).click();
  await creator.getByRole('button', { name: 'ウインク', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.gg-character-preview canvas')?.dataset.golferCount === '1');
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'tmp/golf-qa/character-create.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await creator.evaluate(el=>el.scrollWidth>el.clientWidth),false);
  await page.screenshot({path:'tmp/golf-qa/character-mobile.png'});
  await creator.getByRole('button', { name: '確定', exact: true }).click();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('gakuro-golf-avatar-v1')).species),3);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: 'ひとりで練習', exact: true }).click();
  await page.getByRole('heading', { name: 'モード選択', exact: true }).waitFor();
  assert.equal(await page.locator('.main-mode-selection-screen').evaluate(el=>!!el.closest('.gg-root')),false,'main picker is isolated from golf theme');
  await page.screenshot({ path: 'tmp/golf-qa/lesson-picker.png' });
  // Exercise the existing unit buttons and their real onSelectMode callback.
  await page.getByRole('button', { name: /^1ケタのたし算/ }).first().click();
  assert.equal(await page.getByRole('button', {name:/^1ケタのたし算/}).first().evaluate(el=>getComputedStyle(el).borderColor),'rgb(255, 255, 255)');
  assert.equal(await page.locator('.mode-category-button.border-yellow-400').evaluate(el=>getComputedStyle(el).borderColor),'rgb(250, 204, 21)');
  await page.getByRole('button', { name: 'この条件で開始', exact: true }).click();
  await page.getByRole('button', { name: 'ラウンド開始', exact: true }).click();
  assert.equal(await page.evaluate(()=>window.__golf.view.players[0].avatar.species),3);
  await page.getByRole('button', { name: '3問に挑戦', exact: true }).click();
  await page.locator('.gg-quiz').waitFor();
  await page.screenshot({ path: 'tmp/golf-qa/desktop-quiz.png' });
  for (const [width, height] of [[390, 844], [844, 390]]) {
    await page.setViewportSize({ width, height });
    assert.equal(await page.locator('.gg-root').evaluate(el => el.scrollWidth > el.clientWidth), false);
    await page.screenshot({ path: `tmp/golf-qa/quiz-${width}.png` });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (let i = 0; i < 3; i++) {
    const correct = await page.evaluate(() => { const r = window.__golf.room; return r.world.players[r.selfId].lesson.questions[window.__golf.view.quiz.index].correct; });
    await page.locator('.gg-options button').nth(correct).click();
    await page.waitForFunction(i=>!window.__golf.view.quiz||window.__golf.view.quiz.index>i,i);
  }
  await page.getByRole('button', { name: 'ショット！', exact: true }).waitFor();
  assert.match(await page.locator('.gg-bonus').innerText(), /100%/);
  await page.waitForFunction(()=>Number(document.querySelector('.gg-canvas')?.dataset.trajectoryHeight)>5);
  await page.getByRole('button',{name:'パター',exact:true}).click();
  await page.waitForFunction(()=>Number(document.querySelector('.gg-canvas')?.dataset.trajectoryHeight)===.55);
  await page.getByRole('button',{name:'ドライバー',exact:true}).click();
  await page.waitForFunction(()=>Number(document.querySelector('.gg-canvas')?.dataset.trajectoryHeight)>10);
  await page.screenshot({ path: 'tmp/golf-qa/desktop-aim.png' });
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(300);
  assert(await page.locator('.gg-stage>.gg-canvas').evaluate(el=>el.getBoundingClientRect().bottom<=document.querySelector('.gg-play-ui').getBoundingClientRect().top),'portrait controls leave the character and arc visible');
  await page.screenshot({path:'tmp/golf-qa/mobile-aim.png'});
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole('button', { name: 'ショット！', exact: true }).click();
  await page.waitForFunction(() => window.__golf.view.players[0].strokes === 1);
  await page.waitForFunction(()=>Math.abs(Number(document.querySelector('.gg-canvas')?.dataset.swing))>.3);
  await page.waitForFunction(()=>Number(document.querySelector('.gg-canvas')?.dataset.ballHeight)>4);
  await page.screenshot({path:'tmp/golf-qa/flight.png'});
  await page.getByRole('button', { name: '3問に挑戦', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'ショット！', exact: true }).count(), 0);
  await page.evaluate(() => window.__golfApp.language('ENGLISH'));
  await page.getByRole('button',{name:'Create your character',exact:true}).click();
  assert.equal(await page.getByRole('dialog').getByText('Customize freely before the round starts.',{exact:true}).count(),1);
  await page.getByRole('dialog').getByRole('button',{name:'Confirmed',exact:true}).click();
  // The existing App remounts its shell on language changes; start a fresh English practice.
  await page.getByRole('button', { name: 'Practice solo', exact: true }).click();
  await page.evaluate(() => window.__golf.selectLesson({ mode: 'ADDITION', title: 'Golf arithmetic' }));
  await page.getByRole('button', { name: 'Start round', exact: true }).click();
  await page.getByRole('button', { name: 'Take the three-question challenge', exact: true }).click();
  await page.locator('.gg-quiz').waitFor();
  const untranslated = await page.locator('.gg-root').evaluate(root => [...root.querySelectorAll('*')].filter(el => !el.closest('[data-allow-japanese="true"]') && el.childNodes.length && [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && /[ぁ-んァ-ヶ一-龠]/.test(n.textContent || ''))).map(el => el.textContent));
  assert.deepEqual(untranslated, []);
  await page.evaluate(() => window.__golfApp.debug(false));
  await page.waitForFunction(() => window.__golfApp.screen === 'START_MENU');
  assert.equal(await page.locator('.gg-root').count(), 0);
  assert.equal(await page.evaluate(() => localStorage.getItem('pixel_spire_save_state_v1')), null, 'golf never creates a main-adventure save');
  assert.deepEqual(errors, []);
  console.log('Golf UI: debug-only entry/exit, real lesson picker, mobile layouts, quiz, reward, shot and English UI passed.');

  await page.goto('http://127.0.0.1:5194/__golf-network');
  await page.waitForFunction(() => !!window.GolfRoom);
  await page.evaluate(async () => {
    window.views = {}; window.rooms = []; window.netErrors = [];
    const host = new window.GolfRoom(v => window.hostView = v, m => window.netErrors.push(m)); window.host = host;
    await host.create('Host');
    host.setLesson(() => ({ title: 'Test', questions: Array.from({ length: 3 }, (_, i) => ({ id: `q${i}`, mode: 'ADDITION', question: '1 + 1 = ?', options: ['2', '3', '4', '5'], correct: 0 })) }));
    for (let batch = 0; batch < 13; batch++) await Promise.all(Array.from({ length: 3 }, async (_, j) => {
      const index = batch * 3 + j; const r = new window.GolfRoom(v => window.views[index] = v, m => window.netErrors.push(m)); window.rooms[index] = r; await r.join(host.code, `Guest ${index + 1}`);
    }));
  });
  await page.waitForFunction(() => window.hostView.players.length === 40 && Object.values(window.views).every(v => v.players.length === 40));
  assert.equal(await page.evaluate(() => Object.values(window.views).every(v => window.validView(v))), true);
  assert.equal(await page.evaluate(() => { const bad = structuredClone(window.views[0]); bad.players[0].x = NaN; return window.validView(bad); }), false);
  console.log('40 WebRTC participants connected.');
  assert.equal(await page.evaluate(async () => { const extra = new window.GolfRoom(() => {}, () => {}); try { await extra.join(window.host.code, 'Overflow'); return false; } catch { return true; } finally { extra.close(); } }), true);
  await page.evaluate(() => { window.host.start(); });
  await page.waitForFunction(() => Object.values(window.views).every(v => v.phase === 'playing'));
  await page.evaluate(() => { window.host.send({ type: 'quiz' }); for (const r of window.rooms) r.send({ type: 'quiz' }); });
  await page.waitForFunction(() => window.hostView.quiz && Object.values(window.views).every(v => v.quiz));
  assert.equal(await page.evaluate(() => Object.values(window.views).every(v => !('correct' in v.quiz.question) && v.quiz.answer === null && !('lesson' in v.players[0]))), true);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForFunction(() => Object.values(window.views).every(v => v.paused));
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForFunction(() => Object.values(window.views).every(v => !v.paused));
  for (let i = 0; i < 3; i++) {
    await page.evaluate(i => { for (const [index, r] of window.rooms.entries()) r.send({ type: 'answer', shotId: window.views[index].quiz.shotId, index: i, option: 0 }); window.host.send({ type: 'answer', shotId: window.hostView.quiz.shotId, index: i, option: 0 }); }, i);
    await page.waitForFunction(() => Object.values(window.views).every(v => v.quiz?.answer === 0));
    await page.evaluate(i => { for (const [index, r] of window.rooms.entries()) r.send({ type: 'continue', shotId: window.views[index].quiz.shotId, index: i }); window.host.send({ type: 'continue', shotId: window.hostView.quiz.shotId, index: i }); }, i);
    await page.waitForFunction(i => Object.values(window.views).every(v => i === 2 ? v.quiz === null : v.quiz?.index === i + 1 && v.quiz.answer === null), i);
  }
  await page.evaluate(() => { for (const [index, r] of window.rooms.entries()) { const me = window.views[index].players.find(p => p.id === r.selfId); r.send({ type: 'shot', shotId: me.shotId, club: 'iron', power: .7, angle: 0 }); } const me = window.hostView.players.find(p => p.id === window.host.selfId); window.host.send({ type: 'shot', shotId: me.shotId, club: 'iron', power: .7, angle: 0 }); });
  await page.waitForFunction(() => window.hostView.players.every(p => p.strokes === 1));
  await page.waitForFunction(() => window.hostView.players.every(p => p.phase === 'ready'));
  assert.equal(await page.evaluate(() => window.hostView.players.every(p => p.z > 20)), true);
  await page.evaluate(() => window.rooms[0].close());
  await page.waitForFunction(() => window.hostView.players.filter(p => p.connected).length === 39);
  await page.evaluate(() => window.host.close());
  await page.waitForFunction(() => window.views[1] === null);
  await page.evaluate(() => window.rooms.forEach(r => r.close()));
  console.log('Golf multiplayer: 40 real local WebRTC participants, 41st rejection, private quizzes, 40 simultaneous shots and disconnect cleanup passed.');
} catch (error) { console.error(error); console.error(await page.locator('body').innerText().catch(() => '')); await page.screenshot({path: 'tmp/golf-qa/failure.png'}).catch(() => {}); throw error; } finally { await browser.close(); await server.close(); signaling.kill(); await new Promise(resolve => signaling.once('exit', resolve)); }
