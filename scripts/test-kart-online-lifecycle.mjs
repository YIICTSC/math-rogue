import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { build } from 'esbuild';
import { chromium } from 'playwright';

// Shorten only the test server's race, so repeated real result/rematch transitions
// exercise production room handlers without waiting six minutes per race.
await mkdir('tmp/kart-lifecycle', { recursive: true });
await build({ entryPoints: ['server/index.ts'], outfile: 'tmp/kart-lifecycle/server.mjs',
  bundle: true, platform: 'node', format: 'esm', packages: 'external',
  define: { 'import.meta.env': '{}' }, plugins: [{ name: 'short-test-races', setup(b) {
    b.onLoad({ filter: /server\/miniRooms\.ts$/ }, async ({ path }) => ({
      contents: (await readFile(path, 'utf8')).replace('Date.now()-member.disconnectedAt>30000', 'Date.now()-member.disconnectedAt>1500'), loader: 'ts',
    }));
    b.onLoad({ filter: /gakuro-kart\/engine\.ts$/ }, async ({ path }) => ({
      contents: (await readFile(path, 'utf8')).replace('RACE_LIMIT = 360', 'RACE_LIMIT = 1'), loader: 'ts',
    }));
  } }],
});
const bundle = await build({ stdin: { contents: `
  export {KartRoom} from './src/mini-games/gakuro-kart/network';
  import {KartRoom} from './src/mini-games/gakuro-kart/network';
  import {RaceStartSync} from './src/mini-games/gakuro-kart/startSync';
  import * as engine from './src/mini-games/gakuro-kart/engine';
  Object.assign(window,{KartRoom,RaceStartSync,engine});`, resolveDir: process.cwd() },
  bundle: true, write: false, format: 'esm', define: { 'import.meta.env': JSON.stringify({ VITE_ONLINE_SERVER_URL: 'http://127.0.0.1:10119' }) },
});
const backend = spawn(process.execPath, ['tmp/kart-lifecycle/server.mjs'], {
  env: { ...process.env, PORT: '10119', ALLOWED_ORIGINS: '' }, stdio: ['ignore', 'pipe', 'pipe'],
});
backend.stderr.on('data', d => process.stderr.write(d));
const server = createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/bundle.js' ? 'text/javascript' : 'text/html');
  res.end(req.url === '/bundle.js' ? bundle.outputFiles[0].text : '<script type="module" src="/bundle.js"></script>');
});
let browser;
try {
  await new Promise((resolve, reject) => { backend.stdout.once('data', resolve); backend.once('exit', code => reject(Error(`Server exited: ${code}`))); });
  await new Promise(r => server.listen(5219, '127.0.0.1', r));
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:5219');
  await page.waitForFunction(() => window.KartRoom);
  const result = await page.evaluate(async () => {
    const { KartRoom, RaceStartSync, engine: e } = window;
    const check = (value, message) => { if (!value) throw Error(message); };
    const wait = async (fn, timeout = 12000) => {
      const end = Date.now() + timeout;
      while (!fn()) { if (Date.now() > end) throw Error('Condition timed out'); await new Promise(r => setTimeout(r, 20)); }
    };
    const pause = ms => new Promise(r => setTimeout(r, ms));
    // Deterministic timeout, stale acknowledgement and disconnect coverage.
    const sync = new RaceStartSync(), w = e.createRace();
    e.addRacer(w, 'a', 'A'); e.startRace(w); sync.begin(w, ['a', 'b'], 0);
    sync.ready(w, 'a', w.seed + 1); check(!sync.advance(w, 100), 'Stale ready released start');
    sync.ready(w, 'a', w.seed); check(!sync.advance(w, 100), 'Missing guest released start');
    sync.remove('b'); check(sync.advance(w, 101) && !w.paused && w.remaining === 3, 'Disconnect blocked countdown');
    sync.begin(w, ['a'], 0); check(!sync.advance(w, 14999) && sync.advance(w, 15000), 'Readiness timeout failed');

    // Old disconnected BOTs must never be copied into another P2P race.
    const local = new KartRoom(() => {}, () => {});
    local.host = true; local.world = e.createRace();
    e.addRacer(local.world, local.selfId, 'Host'); e.addRacer(local.world, 'lost-peer', 'Guest [BOT]', 0, true);
    e.addRacer(local.world, 'cpu-0', 'BOT 01', 0, true); local.world.phase = 'result';
    local.rematch(); check(!local.world.players['lost-peer'] && local.world.players['cpu-0'], 'P2P rematch copied a departed guest'); local.close();

    const rooms = [], states = [];
    try {
      const host = new KartRoom(w => states[0] = w, () => {}); host.transport = 'server'; rooms.push(host);
      await host.create('Host', 0, 0);
      const guest = new KartRoom(w => states[1] = w, () => {}); guest.transport = 'server'; rooms.push(guest);
      await guest.join(host.code, 'Guest', 1);
      const id = guest.selfId, code = host.code;
      const departed = new KartRoom(() => {}, () => {}); departed.transport = 'server'; rooms.push(departed);
      await departed.join(code, 'Departed', 2);
      departed.resumeDedicated = () => {};
      departed.dedicated.socket.close();
      await wait(() => !states[0]?.players[departed.selfId]);
      check(Object.values(states[0].players).every(p => !p.cpu), 'Expired connection became a BOT');
      // Simulate a network close, not the explicit Leave action.
      for (let i = 0; i < 3; i++) {
        const connection = guest.dedicated; connection.socket.close();
        await wait(() => !guest.reconnecting && guest.dedicated !== connection && guest.dedicated.socket?.readyState === WebSocket.OPEN && states[1]?.players[id]);
        check(guest.selfId === id, 'Reconnect changed participant identity');
        await wait(() => Object.keys(states[0].players).length === 2);
        check(Object.values(states[0].players).every(p => !p.cpu), 'Reconnect created BOT');
      }
      // Delay one readiness response beyond a normal snapshot interval.
      let held;
      const send = guest.dedicated.send.bind(guest.dedicated);
      guest.dedicated.send = packet => packet.type === 'ready' ? (held = packet, true) : send(packet);
      host.start(false);
      await wait(() => held && states[0].paused);
      await pause(600);
      check(states[0].phase === 'countdown' && states[0].remaining === 3, 'Countdown ran before guest was ready');
      send(held); guest.dedicated.send = send;
      await wait(() => states[0]?.phase === 'race' && states[1]?.phase === 'race');
      check(Math.abs(states[0].time - states[1].time) < .25, 'Race starts drifted apart');
      await wait(() => states[0]?.phase === 'result');
      // Resume on the result screen must work even though new racers are rejected there.
      const before = guest.dedicated; before.socket.close();
      await wait(() => !guest.reconnecting && guest.dedicated !== before && states[1]?.phase === 'result' && guest.dedicated.socket?.readyState === WebSocket.OPEN);
      check(guest.selfId === id, 'Result reconnect created a new racer');
      for (let i = 0; i < 2; i++) {
        host.rematch(undefined, i + 1, 1);
        await wait(() => states[0]?.phase === 'countdown');
        await wait(() => states[0]?.phase === 'result');
        check(Object.keys(states[0].players).length === 2 && Object.values(states[0].players).every(p => !p.cpu), 'Rematch grew participants');
      }
      guest.close(); await wait(() => !states[0]?.players[id]);
      host.rematch(); await wait(() => states[0]?.phase === 'countdown');
      check(Object.keys(states[0].players).length === 1, 'Leave left a ghost racer');
      // The creator also reconnects to the same room, rather than creating another.
      const hostId = host.selfId, previous = host.dedicated; previous.socket.close();
      await wait(() => !host.reconnecting && host.dedicated !== previous && host.dedicated.socket?.readyState === WebSocket.OPEN && host.host);
      check(host.code === code && host.selfId === hostId, 'Creator reconnect made a new room');
      const fullStates = [], fullRooms = [];
      try {
        const teacher = new KartRoom(w => fullStates[0] = w, () => {}); teacher.transport = 'server'; fullRooms.push(teacher);
        await teacher.create('Teacher', 0, 0);
        await Promise.all(Array.from({length:39}, async (_, i) => {
          const room = new KartRoom(w => fullStates[i + 1] = w, () => {}); room.transport = 'server'; fullRooms.push(room);
          await room.join(teacher.code, `Student ${i}`, i % 3);
        }));
        await wait(() => Object.keys(fullStates[0].players).length === 40);
        teacher.start(false);
        await wait(() => fullStates.length === 40 && fullStates.every(w => w?.phase === 'race'), 7000);
        check(fullStates.every(w => !w.paused && Object.keys(w.players).length === 40), '40-player start was not synchronized');
        const student = fullRooms[1], studentId = student.selfId, connection = student.dedicated;
        connection.socket.close();
        await wait(() => !student.reconnecting && student.dedicated !== connection && student.dedicated.socket?.readyState === WebSocket.OPEN);
        check(student.selfId === studentId && Object.keys(fullStates[0].players).length === 40, 'Full room could not resume its existing racer');
      } finally { fullRooms.forEach(room => room.close()); }
      return { players: 40, reconnects: 6, rematches: 3, stableParticipants: true, expiredConnectionsRemoved: true, readyBarrier: true, timeout: true, legacyBotsRemoved: true };
    } finally { rooms.forEach(room => room.close()); }
  });
  assert.deepEqual(errors, []);
  console.log('PASS kart online lifecycle:', JSON.stringify(result));
} finally {
  await browser?.close();
  await new Promise(r => server.close(r));
  backend.kill();
}
