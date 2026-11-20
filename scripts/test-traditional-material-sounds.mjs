import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});
try {
  const { placementSounds } = await vite.ssrLoadModule(
    '/src/mini-games/traditional-games/sounds.ts',
  );
  const c = await vite.ssrLoadModule('/src/mini-games/traditional-games/crokinole.ts');
  const { TABLE_MATERIALS, nextMaterialTake } = await vite.ssrLoadModule(
    '/src/services/traditionalTableSound.ts',
  );
  const { createTable, tableViewFor, applyTableAction, playTableCpu } = await vite.ssrLoadModule(
    '/src/mini-games/traditional-games/engine.ts',
  );
  const { CARD_CLUB_VOICE_HEROES } = await vite.ssrLoadModule('/src/data/cardClubVoices.ts');
  const players = Array.from({ length: 4 }, (_, i) => ({
    id: String(i),
    name: 'Player ' + i,
    hero: CARD_CLUB_VOICE_HEROES[i],
    cpu: true,
  }));
  for (const kind of TABLE_MATERIALS) {
    let last;
    for (let i = 0; i < 40; i++) {
      const next = nextMaterialTake(last, () => i / 40);
      assert(next >= 0 && next < 3);
      assert.notEqual(next, last);
      last = next;
    }
  }
  const meta = JSON.parse(await readFile('assets/traditional-games/sound-build.json', 'utf8'));
  assert.equal(Object.keys(meta.clips).length, 24);
  const hashes = new Set();
  for (const [key, clip] of Object.entries(meta.clips)) {
    const path = 'public/sfx/traditional-table/' + key + '.mp3',
      bytes = await readFile(path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), clip.sha256);
    assert(!hashes.has(clip.sha256));
    hashes.add(clip.sha256);
    const raw = execFileSync('ffmpeg', [
      '-v',
      'error',
      '-i',
      path,
      '-ar',
      '44100',
      '-ac',
      '1',
      '-f',
      'f32le',
      '-',
    ]);
    const samples = new Float32Array(
      raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength),
    );
    assert(samples.length > 2205 && samples.length < 22050);
    let peak = 0,
      power = 0,
      tail = 0;
    for (let i = 0; i < samples.length; i++) {
      peak = Math.max(peak, Math.abs(samples[i]));
      power += samples[i] ** 2;
      if (i >= samples.length - 661) tail += samples[i] ** 2;
    }
    assert(peak > 0.05 && peak < 0.92, key + ': impact peak');
    assert(Math.sqrt(power / samples.length) > 0.008, key + ': non-silent');
    assert(Math.sqrt(tail / 661) < 0.003, key + ': short quiet tail');
  }
  for (const [game, material] of [
    ['competitive', 'ivory'],
    ['forty-two', 'ivory'],
    ['peeper', 'resin'],
    ['goita', 'bamboo'],
  ]) {
    const state = createTable(game, players, 1);
    assert.deepEqual(
      placementSounds(tableViewFor(state, state.turn)),
      [],
      'dealing does not sound like placing',
    );
    let heard = 0;
    while (state.phase === 'play' && heard < 4) {
      assert(playTableCpu(state));
      const view = tableViewFor(state, state.turn),
        sounds = placementSounds(view);
      if (sounds.length) {
        assert(sounds.every((s) => s.material === material));
        heard++;
      }
      assert.deepEqual(placementSounds({ ...view, event: { key: 'pass', seat: 0 } }), []);
      assert.deepEqual(placementSounds({ ...view, event: { key: 'bid', seat: 0 } }), []);
    }
    assert(heard > 0, game + ': physical moves produce material sounds');
  }
  const shot = { type: 'shot', angle: 0, aim: 0, power: 0.56 };
  const before = [{ id: 90, seat: 1, x: 0, y: 0.5 }];
  const hit = c.resolveShot(before, 0, 2, shot, 91, true);
  assert(
    hit.sounds.some((s) => s.material === 'wood' && s.frame > 0),
    'disc collision cue',
  );
  assert.equal(hit.sounds[0].material, 'flick');
  assert.deepEqual(c.resolveShot(before, 0, 2, shot, 91).sounds, [], 'CPU search is silent');
  const pocket = c.resolveShot([], 0, 2, shot, 92, true);
  assert(
    pocket.sounds.some((s) => s.material === 'pocket'),
    'central hole cue',
  );
  const pegShot = { ...shot, power: 0.9, aim: c.aimAt(0, 2, 0, c.PEGS[1].x, c.PEGS[1].y) };
  assert(
    c.resolveShot([], 0, 2, pegShot, 93, true).sounds.some((s) => s.material === 'peg'),
    'wooden peg cue',
  );
  for (const cue of hit.sounds) {
    assert(cue.frame < hit.frames.length);
    assert(cue.strength > 0 && cue.strength <= 1);
  }
  const online = createTable('crokinole', players, 1);
  online.turn = 0;
  assert(applyTableAction(online, 0, shot));
  const replay = tableViewFor(online, 1).lastShot;
  const a = c.resolveShot(replay.before, replay.seat, 4, replay.shot, replay.discId, true);
  const b = c.resolveShot(replay.before, replay.seat, 4, replay.shot, replay.discId, true);
  assert.deepEqual(a.sounds, b.sounds, 'host/guest reproduce the same contacts');
  console.log(
    'PASS 24 unique short foley clips, material selection, quiet passes, nonrepeating takes, timed disc/peg/pocket contacts and online replay.',
  );
} finally {
  await vite.close();
}
