import assert from 'node:assert/strict';
import { createServer as createHttpServer } from 'node:http';
import { mkdir } from 'node:fs/promises';
import { build } from 'esbuild';
import { WebSocket } from 'ws';
await mkdir('tmp/golf-server', { recursive: true });
await build({ entryPoints: ['server/golfRooms.ts'], outfile: 'tmp/golf-server/adapter.mjs', bundle: true, platform: 'node', format: 'esm', target: 'node22', packages: 'external', define: { 'import.meta.env': '{}' } });
const { createGolfServer } = await import('../tmp/golf-server/adapter.mjs');
const adapter = createGolfServer({ allowedOrigins: new Set(['https://golf.test']), idleMs: 20000 });
const server = createHttpServer((_req, res) => { res.writeHead(200); res.end('ok'); });
server.on('upgrade', (req, socket, head) => {
  if (req.url !== '/golf') { socket.destroy(); return; }
  adapter.sockets.handleUpgrade(req, socket, head, ws => adapter.sockets.emit('connection', ws, req));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `ws://127.0.0.1:${server.address().port}/golf`;
const clients = [];
const wait = async (predicate, message = 'condition', timeout = 10000) => { const end = Date.now() + timeout; while (!predicate()) { if (Date.now() > end) throw new Error(`Timed out: ${message}`); await new Promise(resolve => setTimeout(resolve, 20)); } };
async function connect(hello, origin = 'https://golf.test') {
  const socket = new WebSocket(url, { origin });
  const client = { socket, id: '', code: '', host: false, view: null, errors: [], closed: false }; clients.push(client);
  socket.on('message', raw => { const p = JSON.parse(raw.toString()); if (p.type === 'connected') Object.assign(client, { id: p.id, code: p.code, host: p.host }); if (['init', 'state'].includes(p.type)) client.view = p.state; if (p.type === 'error') client.errors.push(p.message); });
  socket.on('close', () => { client.closed = true; }); socket.on('error', () => {});
  await new Promise(resolve => { socket.once('open', resolve); socket.once('close', resolve); });
  if (!client.closed) socket.send(JSON.stringify({ type: 'connect', protocol: 3, ...hello }));
  await wait(() => client.view || client.closed || client.errors.length, 'handshake'); return client;
}
const send = (c, d) => c.socket.send(JSON.stringify(d));
try {
  const denied = await connect({ create: true, name: 'Denied' }, 'https://invalid.test'); assert(denied.closed); assert.equal(adapter.roomCount, 0);
  const host = await connect({ create: true, name: 'Host' }); assert(host.host);
  send(host, { type: 'lesson', selection: { mode: 'INVALID' } }); await wait(() => host.errors.length); assert.equal(host.view.title, '');
  const selection = { mode: 'ADDITION', assignment: { title: 'Server lesson', units: [], customProblems: [{ id: 'custom', question: '1 + 1 = ?', answer: '2', options: ['3', '4', '5'] }] } };
  send(host, { type: 'lesson', selection }); await wait(() => host.view.title === 'Server lesson');
  const golfers = [host]; for (let i = 1; i < 40; i++) golfers.push(await connect({ create: false, code: host.code, name: `Player ${i}` }));
  await wait(() => golfers.every(c => c.view.players.length === 40));
  const avatar={species:4,body:4,outfit:2,hair:1,accessory:0,hairStyle:0,kart:0,expression:1};
  send(golfers[1],{type:'command',command:{type:'avatar',avatar}});
  await wait(()=>golfers.every(c=>c.view.players.find(p=>p.id===golfers[1].id).avatar.species===4),'avatar shared with all players');
  assert.deepEqual(host.view.players.find(p=>p.id===golfers[1].id).avatar,avatar);
  const overflow = await connect({ create: false, code: host.code, name: 'Overflow' }); assert(overflow.errors.length || overflow.closed);
  send(golfers[1], { type: 'start' }); await wait(() => golfers[1].errors.length); assert.equal(host.view.phase, 'lobby');
  send(host, { type: 'start' }); await wait(() => golfers.every(c => c.view.phase === 'playing'));
  const late = await connect({ create: false, code: host.code, name: 'Late' }); assert(late.errors.length || late.closed);
  for (const c of golfers) send(c, { type: 'command', command: { type: 'quiz' } });
  await wait(() => golfers.every(c => c.view.quiz));
  assert(golfers.every(c => !Object.hasOwn(c.view.quiz.question, 'correct') && c.view.quiz.answer === null && c.view.players.every(p => !Object.hasOwn(p, 'lesson'))));
  for (let index = 0; index < 3; index++) {
    for (let n = 0; n < golfers.length; n++) { const c = golfers[n], quiz = c.view.quiz; const answer = quiz.question.options.indexOf('2'); send(c, { type: 'command', command: { type: 'answer', shotId: quiz.shotId, index, option: index < n % 4 ? answer : (answer + 1) % 4, correct: 3 } }); }
    await wait(() => golfers.every(c => c.view.quiz?.answer !== null));
    for (const c of golfers) send(c, { type: 'command', command: { type: 'continue', shotId: c.view.quiz.shotId, index } });
    await wait(() => golfers.every(c => index === 2 ? c.view.quiz === null : c.view.quiz?.index === index + 1 && c.view.quiz.answer === null));
  }
  for (let n = 0; n < golfers.length; n++) { const c = golfers[n], me = c.view.players.find(p => p.id === c.id); assert.equal(me.correct, n % 4, 'server grades answers, ignoring client-supplied correct count'); send(c, { type: 'command', command: { type: 'shot', shotId: me.shotId, club: 'iron', angle: 0, power: .7, spin: -.6, impact: .4 } }); send(c, { type: 'command', command: { type: 'shot', shotId: me.shotId, club: 'driver', angle: 0, power: 1 } }); }
  await wait(() => host.view.players.every(p => p.strokes === 1));
  assert(host.view.players.every(p=>Number.isFinite(p.vx)&&Number.isFinite(p.vy)&&p.shotClub==='iron'),'kinematics and club are available for smooth rendering');
  assert(host.view.players.every(p=>p.shotSpin===-.6&&p.shotImpact===.4&&p.shotQuality==='good'),'spin and server-derived timing grade are synchronized');
  host.socket.close(); await wait(() => golfers[1].host, 'owner handoff');
  await wait(() => golfers[1].view.players.filter(p => p.connected).every(p => p.phase === 'aim' && p.shotsLeft === 2), 'server continues after owner leaves', 15000);
  assert(golfers[1].view.players.filter(p => p.connected).every(p => p.strokes === 1 && p.z > 20));
  assert.equal(golfers[1].view.paused, false);
  for (const c of golfers.slice(1)) c.socket.close(); await wait(() => adapter.roomCount === 0, 'empty room cleanup');
  console.log('Golf Render adapter: origin enforcement, 40 WebSocket players, overflow/late-join rejection, owner-only configuration, private questions, authoritative grading, duplicate shot rejection, owner handoff and physics continuity passed.');
} finally { for (const c of clients) c.socket.terminate(); adapter.close(); await new Promise(resolve => server.close(resolve)); }
