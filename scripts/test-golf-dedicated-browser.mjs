import assert from 'node:assert/strict';
import { createServer as createHttpServer } from 'node:http';
import { mkdir } from 'node:fs/promises';
import { build } from 'esbuild';
import { chromium } from 'playwright';
await mkdir('tmp/golf-server', { recursive: true });
await build({ entryPoints: ['server/golfRooms.ts'], outfile: 'tmp/golf-server/browser-adapter.mjs', bundle: true, platform: 'node', format: 'esm', target: 'node22', packages: 'external', define: { 'import.meta.env': '{}' } });
const { createGolfServer } = await import('../tmp/golf-server/browser-adapter.mjs');
const adapter = createGolfServer();
const http = createHttpServer((_req, res) => res.end('ok'));
http.on('upgrade', (req, socket, head) => { if (req.url !== '/golf') { socket.destroy(); return; } adapter.sockets.handleUpgrade(req, socket, head, ws => adapter.sockets.emit('connection', ws, req)); });
await new Promise(resolve => http.listen(0, '127.0.0.1', resolve));
const remote=process.env.TEST_ONLINE_SERVER_URL;
const serverUrl=remote||`http://127.0.0.1:${http.address().port}`;
const client=await build({stdin:{contents:'import{GolfRoom}from"./src/mini-games/gakuro-golf/network.ts";window.GolfRoom=GolfRoom;',resolveDir:process.cwd()},bundle:true,write:false,format:'esm',define:{'import.meta.env':JSON.stringify({VITE_ONLINE_SERVER_URL:serverUrl})}});
const fixture=createHttpServer((req,res)=>{res.setHeader('Content-Type',req.url==='/bundle.js'?'text/javascript':'text/html');res.end(req.url==='/bundle.js'?client.outputFiles[0].text:'<script type="module" src="/bundle.js"></script>');});
await new Promise(r=>fixture.listen(5204,'127.0.0.1',r));
const browser = await chromium.launch(); const page = await browser.newPage(); page.setDefaultTimeout(15000);
try {
  if(remote){await page.route('**/__golf',r=>r.fulfill({contentType:'text/html',body:'<script type="module" src="/__golf_bundle.js"></script>'}));await page.route('**/__golf_bundle.js',r=>r.fulfill({contentType:'text/javascript',body:client.outputFiles[0].text}));}
  await page.goto(remote?'http://127.0.0.1:5173/__golf':'http://127.0.0.1:5204/__golf'); await page.waitForFunction(() => window.GolfRoom);
  await page.evaluate(async () => {
    window.views = {}; window.rooms = []; window.statuses = [];
    window.host = new window.GolfRoom(v => window.hostView = v, m => window.statuses.push(m));
    await window.host.create('Host');
    window.host.setLesson(() => { throw new Error('Browser must not grade or generate server questions'); }, { mode: 'ADDITION', title: 'Render arithmetic' });
  });
  await page.waitForFunction(() => window.hostView.title === 'Render arithmetic');
  assert.equal(await page.evaluate(() => window.host.serverHosted), true);
  await page.evaluate(async () => { await Promise.all(Array.from({ length: 39 }, async (_, i) => { const room = new window.GolfRoom(v => window.views[i] = v, m => window.statuses.push(m)); window.rooms[i] = room; await room.join(window.host.code, `Guest ${i}`); })); });
  await page.waitForFunction(() => Object.values(window.views).length === 39 && Object.values(window.views).every(v => v.players.length === 40));
  await page.evaluate(() => window.host.start()); await page.waitForFunction(() => Object.values(window.views).every(v => v.phase === 'playing'));
  await page.evaluate(() => window.rooms.forEach(r => r.send({ type: 'quiz' })));
  await page.waitForFunction(() => Object.values(window.views).every(v => v.quiz));
  for (let index = 0; index < 3; index++) {
    await page.evaluate(index => { window.rooms.forEach((r, i) => { const q = window.views[i].quiz; const nums = q.question.question.match(/\d+/g).map(Number); const answer = String(nums[0] + nums[1]); const option = q.question.options.indexOf(answer); if (option < 0) throw new Error('Unexpected arithmetic question'); r.send({ type: 'answer', shotId: q.shotId, index, option }); }); }, index);
    await page.waitForFunction(() => Object.values(window.views).every(v => v.quiz.answer !== null));
    await page.evaluate(index => window.rooms.forEach((r, i) => r.send({ type: 'continue', shotId: window.views[i].quiz.shotId, index })), index);
    await page.waitForFunction(index => Object.values(window.views).every(v => index === 2 ? !v.quiz : v.quiz?.index === index + 1 && v.quiz.answer === null), index);
  }
  await page.evaluate(() => window.rooms.forEach((r, i) => { const me = window.views[i].players.find(p => p.id === r.selfId); r.send({ type: 'shot', shotId: me.shotId, club: 'iron', angle: 0, power: .7 }); }));
  await page.waitForFunction(() => window.hostView.players.filter(p => p.id !== window.host.selfId).every(p => p.strokes === 1));
  await page.evaluate(() => window.host.close());
  await page.waitForFunction(() => window.rooms[0].host);
  await page.waitForFunction(() => window.views[0].players.filter(p => p.connected).every(p => p.phase === 'ready'));
  assert.equal(await page.evaluate(() => window.views[0].paused), false);
  await page.evaluate(() => window.rooms.forEach(r => r.close()));
  const end = Date.now() + 5000; while (adapter.roomCount && Date.now() < end) await new Promise(r => setTimeout(r, 20)); assert.equal(adapter.roomCount, 0);
  console.log('GolfRoom Render client: VITE_ONLINE_SERVER_URL routing, 40 browser WebSockets, server-generated arithmetic, private feedback, concurrent shots, host handoff and cleanup passed.');
} finally { await browser.close(); await new Promise(resolve=>fixture.close(resolve)); adapter.close(); await new Promise(resolve => http.close(resolve)); }
