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
assert.equal(nextSpectatorTarget([], null), null);
assert.equal(nextSpectatorTarget(['a'], 'a'), 'a');
assert.equal(nextSpectatorTarget(['a', 'b', 'c'], 'a', () => .99), 'c');
const race = kart.createRace(); kart.addRacer(race, 'host', 'Teacher');
assert(kart.setSpectator(race, 'host', true)); kart.startRace(race); assert.equal(race.phase, 'lobby');
kart.addRacer(race, 'guest', 'Student'); race.lesson = lesson; kart.startRace(race); race.phase = 'race';
kart.command(race, 'host', { type: 'input', steer: 1, brake: false, drift: true });
const distance = race.players.host.distance; kart.tick(race, .05);
assert.equal(race.players.host.distance, distance); assert.equal(race.players.host.steer, 0);
assert.deepEqual(kart.ranking(race).map(p => p.id), ['guest']);
assert.equal(kart.setSpectator(race, 'host', false), false, 'race roles stay fixed');
const roster = kartProtocol.roster(race), received = kartProtocol.acceptRoster(roster, null);
assert(kartProtocol.decodeSnapshot(kartProtocol.encodeSnapshot(race, 1), received, -1).world.players.host.spectator);
race.players.guest.finish = 1; kart.tick(race, .05); assert.equal(race.phase, 'result', 'observer does not delay race results');

const round = golf.createGolf(); golf.addPlayer(round, 'host', 'Teacher'); golf.setSpectator(round, 'host', true);
assert.equal(golf.startGolf(round, lesson.title), false);
golf.addPlayer(round, 'a', 'Student A'); golf.addPlayer(round, 'b', 'Student B'); golf.startGolf(round, lesson.title);
assert.equal(golf.command(round, 'host', { type: 'quiz' }, () => lesson), false);
golf.command(round, 'a', { type: 'quiz' }, () => lesson);
assert.equal(golf.viewFor(round, 'b', 'a').quiz, null, 'guests cannot receive other players questions');
const observed = golf.viewFor(round, 'host', 'a'); assert(golfProtocol.validView(observed));
assert.equal(observed.observedId, 'a'); assert(!Object.hasOwn(observed.quiz.question, 'correct'));
golf.disconnectPlayer(round, 'a'); golf.disconnectPlayer(round, 'b'); assert.equal(round.phase, 'result');

const island = craft.createWorld(); craft.addPlayer(island, 'host', 'Teacher');
craft.setSpectator(island, 'host', true); const before = structuredClone(island.players.host);
craft.applyCommand(island, 'host', { type: 'move', dx: 1, dz: 0 }); craft.tick(island, .1);
assert.equal(island.players.host.x, before.x); assert.equal(island.players.host.energy, before.energy);
const bank = new craft.QuizBank([question]); assert.equal(bank.ask(island, 'host'), undefined);
craft.setSpectator(island, 'host', false); assert(bank.ask(island, 'host'), 'craft can return to play');

const world = rpg.createWorld(1, setup); world.started = false;
rpg.addPlayer(world, 'host', 'Teacher'); rpg.addPlayer(world, 'guest', 'Student');
rpg.setSpectator(world, 'host', true); assert(rpg.applyAction(world, 'host', { type: 'rpg-start' }));
assert.equal(rpg.applyAction(world, 'host', { type: 'move', dx: 1, dy: 0 }), false);
assert.equal(rpg.applyAction(world, 'guest', { type: 'duel-request', target: 'host' }), false);
rpg.advanceWorld(world, world.deadlineAt + 1); assert(!world.rankingAwards.host, 'no ranking award for observer');
console.log('PASS spectator engines: no inputs, physics, ranking or finish interference; private questions and protocol roundtrip.');

// Exercise the same authoritative WebSocket routes used in production.
const port = 10105, clients = [];
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
    if (d.type === 'connected') Object.assign(client, { id: d.id, code: d.code, host: d.host });
    if (d.type === 'roster') client.state = kartProtocol.acceptRoster(d, client.state);
    if (d.type === 'init' && game === 'rpg') client.state = d.world;
    if (d.type === 'state') client.state = game === 'craft' ? d : d.state;
    if (d.type === 'error') client.errors.push(d.message);
  });
  await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
  send(client, { type: 'connect', protocol: 1, ...hello }); await wait(() => client.id && client.state, `${game} join`); return client;
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
      const x = member(host).x; send(host, { type: 'action', action: { type: 'move', dx: 1, dy: 0 } });
      send(a, { type: 'action', action: { type: 'move', dx: 1, dy: 0 } });
      await new Promise(r => setTimeout(r, 300)); assert.equal(member(host).x, x);
    } else if (game === 'kart') {
      send(host, { type: 'lesson', lesson }); send(host, { type: 'start', fill: false }); await wait(() => host.state.phase === 'race');
      send(host, { type: 'command', command: { type: 'input', steer: 1, drift: true, brake: false } });
      await wait(() => member(host, a.id).speed > 0); assert.equal(member(host).speed, 0);
      assert(!kart.ranking(host.state).some(p => p.id === host.id));
    } else if (game === 'craft') {
      send(host, { type: 'observe', id: a.id }); send(host, { type: 'command', command: { type: 'quiz' } });
      const x = member(host)[3]; send(host, { type: 'command', command: { type: 'move', dx: 1, dz: 0 } });
      await new Promise(r => setTimeout(r, 300)); assert.equal(member(host)[3], x);
      send(host, { type: 'spectator', enabled: false }); await wait(() => !member(host)[14]);
    } else {
      send(host, { type: 'lesson', selection: { mode: 'ADDITION' } }); await wait(() => host.state.title);
      send(host, { type: 'start' }); await wait(() => host.state.phase === 'playing');
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

await build({ stdin: { contents: `import React,{useState} from 'react';import{createRoot}from'react-dom/client';
import HostSpectator,{useSpectatorTarget}from'./src/mini-games/shared/HostSpectator';
function Test(){const [ids,setIds]=useState([]),[enabled,setEnabled]=useState(true);window.setCandidates=setIds;const s=useSpectatorTarget(enabled,ids);return <HostSpectator enabled={enabled} onChange={setEnabled} name={s.target||undefined} count={ids.length} onNext={s.next} languageMode="ENGLISH"/>;}
window.root=createRoot(document.getElementById('root'));window.root.render(<Test/>);`, loader: 'tsx', resolveDir: process.cwd() }, outfile: 'tmp/host-spectator/browser.js', bundle: true, format: 'esm', define: { 'import.meta.env': '{}' } });
const web = createServer(async (req, res) => {
  if (req.url === '/browser.js' || req.url === '/browser.css') { res.setHeader('Content-Type', req.url.endsWith('.js') ? 'text/javascript' : 'text/css'); res.end(await readFile(`tmp/host-spectator${req.url}`)); }
  else res.end('<html><head><link rel="stylesheet" href="/browser.css"></head><body><div id="root"></div><script type="module" src="/browser.js"></script></body></html>');
});
await new Promise(r => web.listen(0, '127.0.0.1', r));
let browser;
try {
  browser = await chromium.launch({ headless: true }); const page = await browser.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message)); await page.clock.install();
  await page.goto(`http://127.0.0.1:${web.address().port}`);
  await page.getByText('Waiting for players to join.').waitFor(); assert(await page.getByRole('button', { name: 'Next player' }).isDisabled());
  await page.evaluate(() => window.setCandidates(['Alice', 'Bob', 'Carol'])); await page.locator('.host-spectator strong').filter({ hasText: /Alice|Bob|Carol/ }).waitFor();
  const first = await page.locator('.host-spectator strong').innerText(); await page.clock.fastForward(8100);
  const second = await page.locator('.host-spectator strong').innerText(); assert.notEqual(second, first, 'automatic camera does not repeat target');
  await page.getByRole('button', { name: 'Next player' }).click(); assert.notEqual(await page.locator('.host-spectator strong').innerText(), second);
  await page.evaluate(() => window.setCandidates(['Last player'])); await page.getByText('Last player', { exact: true }).waitFor();
  await page.clock.fastForward(8100); assert.equal(await page.locator('.host-spectator strong').innerText(), 'Last player');
  await page.evaluate(() => window.setCandidates([])); await page.getByText('Waiting for players to join.').waitFor();
  await page.getByRole('button', { name: 'Return to play' }).click(); assert.equal(await page.getByRole('button', { name: 'Next player' }).count(), 0);
  await page.evaluate(() => window.root.unmount()); await page.clock.fastForward(16000); assert.deepEqual(errors, []);
  console.log('PASS spectator browser: automatic/manual switching, disconnect, empty/single roster, return and unmount.');
} finally { await browser?.close(); await new Promise(r => web.close(r)); }
