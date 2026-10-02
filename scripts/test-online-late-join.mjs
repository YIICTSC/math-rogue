import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { build } from 'esbuild';
import { WebSocket } from 'ws';
import { chromium } from 'playwright';

await mkdir('tmp/host-spectator', { recursive: true });
await build({ stdin: { contents: `export * as kart from './src/mini-games/gakuro-kart/engine';
export * as kartProtocol from './src/mini-games/gakuro-kart/protocol';
export * as golf from './src/mini-games/gakuro-golf/engine';
export * as golfProtocol from './src/mini-games/gakuro-golf/protocol';
export * as craft from './src/mini-games/gakuro-craft/engine';
export * as rpg from './src/rpg/engine';
export {defaultAvatar} from './src/mini-games/gakuro-kart/avatar';
export * from './src/mini-games/shared/spectator';`, resolveDir: process.cwd() },
  outfile: 'tmp/host-spectator/engines.mjs', bundle: true, platform: 'node', format: 'esm', packages: 'external', define: { 'import.meta.env': '{}' } });
const { kart, kartProtocol, golf, golfProtocol, craft, rpg, defaultAvatar, nextSpectatorTarget } = await import('../tmp/host-spectator/engines.mjs');
const question = { id: 'spectator-q', mode: 'ADDITION', question: '1 + 1', options: ['1', '2', '3', '4'], correct: 1 };
const lesson = { title: 'Spectator test', questions: [question, { ...question, id: 'q2' }, { ...question, id: 'q3' }] };
const setup = { visualTheme: 'elementary', mode: 'ADDITION', answerMode: 'CHOICE', difficultyLevel: 1 };
// Exercise the same authoritative WebSocket routes used in production.
const port = 10109, clients = [];
const backend = spawn(process.execPath, ['server/dist/index.mjs'], { env: { ...process.env, PORT: String(port), ALLOWED_ORIGINS: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
backend.stderr.on('data', d => process.stderr.write(d));
const wait = async (predicate, message = 'condition', timeout = 10000) => {
  const end = Date.now() + timeout;
  while (!predicate()) { if (Date.now() > end) throw Error(`Timed out: ${message}`); await new Promise(r => setTimeout(r, 20)); }
};
const send = (client, packet) => client.socket.send(JSON.stringify(packet));
async function connect(game, hello) {
  const socket = new WebSocket(`ws://127.0.0.1:${port}/${game === 'rpg' ? 'online' : game}`);
  const client = { socket, id: '', code: '', state: null, roster: null, errors: [] }; clients.push(client);
  socket.on('message', (raw, binary) => {
    if (binary) { if (client.state) { const buf = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength); const next = kartProtocol.decodeSnapshot(buf, client.state, -1); if (next) client.state = next.world; } return; }
    const d = JSON.parse(raw.toString());
    if(d.type==='lobby')client.lobby=d.setup;
    if (d.type === 'connected') Object.assign(client, { id: d.id, code: d.code, host: d.host });
    if (d.type === 'roster') client.state = kartProtocol.acceptRoster(d, client.state);
    if (d.type === 'init' && game === 'rpg') client.state = d.world;
    if (d.type === 'state') client.state = game === 'craft' ? d : d.state;
    if (d.type === 'error') client.errors.push(d.message);
  });
  await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
  send(client, { type: 'connect', protocol: 1, ...hello }); await wait(() => client.id && (client.state || client.lobby), `${game} join`); return client;
}
function member(client, id = client.id) {
  const players = client.state?.players;
  return Array.isArray(players) ? players.find(p => Array.isArray(p) ? p[0] === id : p.id === id) : players?.[id];
}
try {
  await new Promise((resolve, reject) => { backend.stdout.once('data', resolve); backend.once('exit', code => reject(Error(`Server exited ${code}`))); });
  for (const game of ['rpg', 'kart', 'craft', 'golf']) {
    const host = await connect(game, { create: true, name: 'Teacher', setup, minutes: 1, hero: 0, course: 0, avatar: defaultAvatar(), profileId: 'teacher-profile', questions: [question], title: lesson.title });
    const a = await connect(game, { create: false, code: host.code, name: 'Student A', hero: 0, avatar: defaultAvatar(), profileId: 'student-a-profile' });
    const b = await connect(game, { create: false, code: host.code, name: 'Student B', hero: 0, avatar: defaultAvatar(), profileId: 'student-b-profile' });
    send(a, { type: 'spectator', enabled: true });
    send(host, { type: 'spectator', enabled: true });
    await wait(() => game === 'craft' ? member(host)?.[14] : member(host)?.spectator, `${game} observer role`);
    assert(!(game === 'craft' ? member(host, a.id)?.[14] : member(host, a.id)?.spectator), `${game}: guests cannot change roles`);
    if (game === 'rpg') {
      send(host, { type: 'action', action: { type: 'rpg-start' } }); await wait(() => host.state.started);
      const late=await connect(game,{create:false,code:host.code,name:'Late code'});assert(late.state.started&&member(late));
      const invited=await connect(game,{create:false,code:host.code,name:'Late URL',prepare:true});assert(invited.lobby);send(invited,{type:'enter',profile:{hp:75,maxHp:75,gold:0,deckSize:0,character:'WARRIOR',image:''}});await wait(()=>invited.state);assert(invited.state.started&&member(invited));
      const x = member(host).x; send(host, { type: 'action', action: { type: 'move', dx: 1, dy: 0 } });
      send(a, { type: 'action', action: { type: 'move', dx: 1, dy: 0 } });
      await new Promise(r => setTimeout(r, 300)); assert.equal(member(host).x, x);
    } else if (game === 'kart') {
      send(host, { type: 'lesson', lesson }); send(host, { type: 'start', fill: true }); await wait(() => host.state.phase === 'race');
      const late=await connect(game,{create:false,code:host.code,name:'Late racer',hero:0,avatar:defaultAvatar()});assert(member(late));assert.equal(Object.keys(late.state.players).length,40);assert.equal(member(late).cpu,false);
      send(host, { type: 'command', command: { type: 'input', steer: 1, drift: true, brake: false } });
      await wait(() => member(host, a.id).speed > 0); assert.equal(member(host).speed, 0);
      assert(!kart.ranking(host.state).some(p => p.id === host.id));
    } else if (game === 'craft') {
      const late=await connect(game,{create:false,code:host.code,name:'Late resident',profileId:'late-resident-profile',avatar:defaultAvatar()});assert(member(late));
      send(host, { type: 'observe', id: a.id }); send(host, { type: 'command', command: { type: 'quiz' } });
      const x = member(host)[3]; send(host, { type: 'command', command: { type: 'move', dx: 1, dz: 0 } });
      await new Promise(r => setTimeout(r, 300)); assert.equal(member(host)[3], x);
      send(host, { type: 'spectator', enabled: false }); await wait(() => !member(host)[14]);
    } else {
      send(host, { type: 'lesson', selection: { mode: 'ADDITION' } }); await wait(() => host.state.title);
      send(host, { type: 'start' }); await wait(() => host.state.phase === 'playing');
      const late=await connect(game,{create:false,code:host.code,name:'Late golfer'});assert(member(late));send(late,{type:'command',command:{type:'quiz'}});await wait(()=>late.state.quiz);assert.equal(member(late).hole,0);late.socket.close();
      send(a, { type: 'command', command: { type: 'quiz' } }); await wait(() => a.state.quiz);
      send(b, { type: 'observe', id: a.id }); send(host, { type: 'observe', id: a.id });
      await wait(() => host.state.observedId === a.id && host.state.quiz);
      assert.equal(b.state.quiz, null); assert(!Object.hasOwn(host.state.quiz.question, 'correct'));
      send(host, { type: 'command', command: { type: 'answer', shotId: a.state.quiz.shotId, index: 0, option: 1 } });
      await new Promise(r => setTimeout(r, 250)); assert.equal(a.state.quiz.selected, null);
      send(host, { type: 'observe', id: b.id }); await wait(() => host.state.observedId === b.id && host.state.quiz === null);
      a.socket.close(); b.socket.close(); await wait(() => host.state.phase === 'result', 'spectator never blocks golf result');
    }
    for (const c of [a, b, host]) c.socket.close();
    console.log(`PASS ${game} dedicated host observer and guest permissions.`);
  }
} finally { for (const c of clients) c.socket.terminate(); backend.kill(); }
