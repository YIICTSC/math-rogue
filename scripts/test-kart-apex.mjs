import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const e = await server.ssrLoadModule('/src/mini-games/gakuro-kart/engine.ts');
  const t = await server.ssrLoadModule('/src/mini-games/gakuro-kart/track.ts');
  const net = await server.ssrLoadModule('/src/mini-games/gakuro-kart/protocol.ts');
  const w = e.createRace(); for (let i = 0; i < 40; i++) assert(e.addRacer(w, `p${i}`, `Player ${i}`, i % 3));
  assert.equal(e.addRacer(w, 'overflow', 'Overflow'), false);
  const avatars = await server.ssrLoadModule('/src/mini-games/gakuro-kart/avatar.ts');
  assert.equal(avatars.validAvatar({...avatars.defaultAvatar(),species:8}),false);
  assert.equal(avatars.validAvatar({...avatars.defaultAvatar(),outfit:NaN}),false);
  assert.equal(avatars.validAvatar({...avatars.defaultAvatar(),hairStyle:12}),false);
  assert.equal(avatars.validAvatar({...avatars.defaultAvatar(),kart:8}),false);
  assert.equal(avatars.validAvatar({...avatars.defaultAvatar(),expression:8}),false);
  globalThis.localStorage = {getItem:()=>JSON.stringify({species:4,body:2,outfit:3,hair:1,accessory:1})};
  assert.deepEqual(avatars.loadAvatar(),{species:4,body:2,outfit:3,hair:1,accessory:1,hairStyle:0,kart:0,expression:0});
  delete globalThis.localStorage;
  const models = await server.ssrLoadModule('/src/mini-games/gakuro-kart/avatarModels.ts');
  const karts = await server.ssrLoadModule('/src/mini-games/gakuro-kart/kartModels.ts');
  const hair = await server.ssrLoadModule('/src/mini-games/gakuro-kart/hairModels.ts');
  const hairParts=hair.createHairParts(), kartParts=karts.createKartParts();
  const expressions = await server.ssrLoadModule('/src/mini-games/gakuro-kart/expressionModels.ts');
  const expressionParts = expressions.createExpressionParts();
  const signature = (parts,avatar)=>JSON.stringify(parts.filter(p=>!p.visible||p.visible(avatar)).map(p=>[p.position,p.scale,p.geometry.type]));
  assert.equal(new Set(Array.from({length:12},(_,hairStyle)=>signature(hairParts,{...avatars.defaultAvatar(),hairStyle}))).size,12);
  assert.equal(new Set(Array.from({length:8},(_,kart)=>signature(kartParts,{...avatars.defaultAvatar(),kart}))).size,8);
  assert(hairParts.every(p=>!p.visible({...avatars.defaultAvatar(),accessory:2})));
  for(let species=0;species<8;species++) assert.equal(new Set(Array.from({length:8},(_,expression)=>signature(expressionParts,{...avatars.defaultAvatar(),species,expression}))).size,8);
  for(const p of [...hairParts,...kartParts,...expressionParts,...models.createAvatarParts()]){p.geometry.dispose();p.material.dispose();}
  for (const p of Object.values(w.players)) p.avatar = {...avatars.defaultAvatar(p.slot), species:p.slot%8};
  const copy = net.acceptRoster(net.roster(w), null); assert(copy);
  assert.deepEqual(copy.players.p7.avatar,w.players.p7.avatar);
  const invalidAvatar = net.roster(w); invalidAvatar.players[0] = {...invalidAvatar.players[0],avatar:{...avatars.defaultAvatar(),accessory:-1}};
  assert.equal(net.acceptRoster(invalidAvatar,null),null);
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
  for (let course = 0; course < t.COURSES.length; course++) {
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
  console.log('40-slot capacity, binary protocol, invalid/stale packets, straight handling, braking, drift release, items, 8 complete races passed.');
} finally { await server.close(); }
