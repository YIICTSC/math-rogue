import assert from 'node:assert/strict';
import { createServer as createHttpServer } from 'node:http';
import { mkdir } from 'node:fs/promises';
import { build } from 'esbuild';
import { WebSocket } from 'ws';
await mkdir('tmp/golf-server', { recursive: true });
await build({ entryPoints: ['server/golfRooms.ts'], outfile: 'tmp/golf-server/adapter.mjs', bundle: true, platform: 'node', format: 'esm', target: 'node22', packages: 'external', define: { 'import.meta.env': '{}' } });
const { createGolfServer,GOLF_SERVER_PROTOCOL } = await import('../tmp/golf-server/adapter.mjs');
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
  if (!client.closed) socket.send(JSON.stringify({ type: 'connect', protocol: GOLF_SERVER_PROTOCOL, terrain:1,sideGolf:1, ...hello }));
  await wait(() => client.view || client.closed || client.errors.length, 'handshake'); return client;
}
const send = (c, d) => c.socket.send(JSON.stringify(d));
try {
  const denied = await connect({ create: true, name: 'Denied' }, 'https://invalid.test'); assert(denied.closed); assert.equal(adapter.roomCount, 0);
  const host = await connect({ create: true, name: 'Host' }); assert(host.host);
  const legacy=await connect({create:false,code:host.code,name:'Legacy',terrain:undefined});assert(legacy.view,'older clients still connect to classic rooms');send(host,{type:'course',course:'adventure'});await wait(()=>host.errors.some(s=>s.includes('最新版')));assert.equal(host.view.course,'classic');legacy.socket.close();await wait(()=>host.view.players.every(p=>p.id!==legacy.id));
  send(host, {type:'course',course:'adventure'});await wait(()=>host.view.course==='adventure');assert.equal(host.view.players[0].course,'adventure');const blockedLegacy=await connect({create:false,code:host.code,name:'Legacy',terrain:undefined});assert(blockedLegacy.closed||blockedLegacy.errors.length,'older clients cannot misrender an adventure room');
  send(host,{type:'course',course:'classic'});await wait(()=>host.view.course==='classic');
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
  const sideHost=await connect({create:true,name:'2D Host'}),sideGuest=await connect({create:false,code:sideHost.code,name:'2D Guest'});
  send(sideHost,{type:'course',course:'side-1'});await wait(()=>sideGuest.view.course==='side-1'&&sideHost.view.course==='side-1');assert.equal(sideGuest.view.holeCount,18);assert.equal(sideGuest.view.sideState.courseId,0);
  const oldSide=await connect({create:false,code:sideHost.code,name:'Old client',sideGolf:undefined});assert(oldSide.closed||oldSide.errors.length,'old clients cannot join a 2D course');
  send(sideHost,{type:'lesson',selection});await wait(()=>sideGuest.view.title==='Server lesson');send(sideHost,{type:'start'});await wait(()=>sideGuest.view.phase==='playing');
  const study=async(c)=>{send(c,{type:'command',command:{type:'quiz'}});await wait(()=>c.view.quiz);for(let index=0;index<3;index++){const quiz=c.view.quiz;send(c,{type:'command',command:{type:'answer',shotId:quiz.shotId,index,option:quiz.question.options.indexOf('2')}});await wait(()=>c.view.quiz?.answer!==null);send(c,{type:'command',command:{type:'continue',shotId:quiz.shotId,index}});await wait(()=>index===2?!c.view.quiz:c.view.quiz?.index===index+1&&c.view.quiz.answer===null);}};
  await study(sideGuest);assert.equal(sideHost.view.quiz,null,'2D question contents remain private');assert(Object.entries(sideGuest.view.sideState.inventory).every(([item,n])=>item==='normal'||n===0));
  for(let n=0;n<3;n++){const me=sideGuest.view.players.find(p=>p.id===sideGuest.id);send(sideGuest,{type:'command',command:{type:'side-shot',shotId:me.shotId,angle:90,power:.05,ball:'normal'}});await wait(()=>sideGuest.view.players.find(p=>p.id===sideGuest.id).shotId>me.shotId);await wait(()=>sideGuest.view.players.find(p=>p.id===sideGuest.id).phase!=='moving','2D settle',10000);}
  await study(sideGuest);const sg=sideGuest.view.players.find(p=>p.id===sideGuest.id);assert(sg.starEnergy>=.999);send(sideGuest,{type:'command',command:{type:'side-shot',shotId:sg.shotId,angle:25,power:1,ball:'normal',special:true}});await wait(()=>sideGuest.view.sideState.fragments.length>0&&sideHost.view.sideState.fragments.length>0,'2D shared destruction');assert.equal(sideGuest.view.players.find(p=>p.id===sideGuest.id).starEnergy,0);assert.deepEqual(sideHost.view.sideState.broken,sideGuest.view.sideState.broken);assert(sideHost.view.sideState.fragments.some(f=>Math.hypot(f.vx,f.vy)>0));sideHost.socket.close();sideGuest.socket.close();await wait(()=>adapter.roomCount===0);
  console.log('Golf 2D WebSocket: course sync, lesson privacy, zero inventory, three-shot cadence, six-answer special and authoritative shared debris passed.');
  console.log('Golf Render adapter: origin enforcement, 40 WebSocket players, overflow/late-join rejection, owner-only configuration, private questions, authoritative grading, duplicate shot rejection, owner handoff and physics continuity passed.');
} finally { for (const c of clients) c.socket.terminate(); adapter.close(); await new Promise(resolve => server.close(resolve)); }
