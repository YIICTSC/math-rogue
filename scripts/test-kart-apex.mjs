import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const e = await server.ssrLoadModule('/src/mini-games/gakuro-kart/engine.ts');
  const t = await server.ssrLoadModule('/src/mini-games/gakuro-kart/track.ts');
  const net = await server.ssrLoadModule('/src/mini-games/gakuro-kart/protocol.ts');
  const w = e.createRace(); for (let i = 0; i < 40; i++) assert(e.addRacer(w, `p${i}`, `Player ${i}`, i % 3));
  assert.equal(e.addRacer(w, 'overflow', 'Overflow'), false);
  const copy = net.acceptRoster(net.roster(w), null); assert(copy);
  w.players.p0.distance = 123.456; w.players.p0.x = -3.5; w.players.p0.speed = 72; w.players.p0.item = 'rocket'; w.players.p0.boost = 2.7;
  const packet = net.encodeSnapshot(w, 4); assert.equal(packet.byteLength, 2272);
  const decoded = net.decodeSnapshot(packet, copy, 3); assert(decoded); assert.equal(decoded.world.players.p0.item, 'rocket'); assert.equal(decoded.world.players.p0.boost, 2.7);
  assert(Math.abs(decoded.world.players.p0.distance - 123.456) < .001);
  assert.equal(net.decodeSnapshot(packet, copy, 4), null); assert.equal(net.decodeSnapshot(packet.slice(0, 100), copy, 3), null);
  const bad = packet.slice(0); new DataView(bad).setFloat32(36, NaN); assert.equal(net.decodeSnapshot(bad, copy, 3), null);
  const duplicateRoster = net.roster(w); duplicateRoster.players[1].slot = 0; assert.equal(net.acceptRoster(duplicateRoster, null), null);
  const drive = e.createRace(); e.addRacer(drive, 'self', 'Self'); drive.phase = 'race'; const p = drive.players.self; p.x = 2; p.distance = 10; p.speed = 58;
  for (let i = 0; i < 30; i++) { e.command(drive, 'self', { type: 'input', steer: 0, brake: false, drift: false }); e.tick(drive, 1 / 60); }
  assert(Math.abs(p.x - 2) < .01, `Straight track moved the kart: ${p.x}`);
  const before = p.speed; e.command(drive, 'self', { type: 'input', steer: 0, brake: true, drift: false }); e.tick(drive, .05); assert(p.speed < before);
  e.command(drive, 'self', { type: 'input', steer: NaN, brake: false, drift: false }); assert(Number.isFinite(p.steer));
  p.charge = 1.8; p.drift = false; e.tick(drive, 1 / 60); assert(p.boost > 1.9); assert.equal(p.drifts, 1);
  p.item = 'nitro'; e.command(drive, 'self', { type: 'item' }); assert.equal(p.item, null); assert(p.boost >= 2.8); e.command(drive, 'self', { type: 'item' }); assert.equal(p.boost, 2.8);
  p.item = 'shield'; p.slow = 1; e.command(drive, 'self', { type: 'item' }); assert.equal(p.slow, 0); assert.equal(p.shield, 6);
  for (let course = 0; course < 3; course++) {
    const world = e.createRace(course, 137), track = t.getTrack(course);
    const a = t.sampleTrack(0, course), b = t.sampleTrack(track.length, course); assert(Math.hypot(a.x - b.x, a.z - b.z) < .001);
    for (let i = 0; i < 40; i++) e.addRacer(world, `bot${i}`, `Bot ${i}`, i % 3, true);
    e.startRace(world); const started = performance.now();
    for (let step = 0; step < 22000 && world.phase !== 'result'; step++) e.tick(world, 1 / 60);
    assert.equal(world.phase, 'result'); assert.equal(e.ranking(world).length, 40);
    const finished = e.ranking(world).filter(p => p.finish);
    assert(finished.length >= 35, `Only ${finished.length} bots finished course ${course}`);
    assert(finished[0].finish < 300); assert(e.ranking(world).some(p => p.drifts > 0));
    for (const p of Object.values(world.players)) { assert([p.x, p.distance, p.speed].every(Number.isFinite)); assert(Math.abs(p.x) <= 14); }
    assert(finished.every((p, i) => !i || finished[i - 1].finish <= p.finish));
    console.log(`Course ${course}: ${finished.length}/40 finish, winner ${finished[0].finish.toFixed(2)}s, simulation ${(performance.now() - started).toFixed(0)}ms`);
  }
  console.log('40-slot capacity, binary protocol, invalid/stale packets, straight handling, braking, drift release, items, 3 complete races passed.');
} finally { await server.close(); }
