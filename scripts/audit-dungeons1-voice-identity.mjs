import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

const hash = data => createHash('sha256').update(data).digest('hex');
const module = await build({ entryPoints: ['src/components/school-dungeon/student/battleVoicePolicy.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { mainBattleVoiceIdentity } = await import('data:text/javascript;base64,' + Buffer.from(module.outputFiles[0].text).toString('base64'));
const designBytes = await fs.readFile('assets-source/dungeons-chronicles/voice-design.json');
const generationBytes = await fs.readFile('assets-source/dungeons-chronicles/voice-generation.json');
const design = JSON.parse(designBytes), generation = JSON.parse(generationBytes);
const generator = await fs.readFile('scripts/dungeons-chronicles/generate-voices.py', 'utf8');
assert.match(generator, /no_ref\s*=\s*True/);
const delivered = new Map(generation.clips.map(clip => [clip.path, clip]));
const actors = [...new Set(design.clips.map(clip => clip.actor))].filter(actor => mainBattleVoiceIdentity(actor)).sort();
assert.equal(actors.length, 26);
const heroes = [];
let excluded = 0, mainFiles = 0;
for (const actor of actors) {
  const identity = mainBattleVoiceIdentity(actor);
  const clips = design.clips.filter(clip => clip.actor === actor);
  assert.equal(clips.length, 20);
  for (const clip of clips) {
    assert(!clip.ref_wav && !clip.reference && !clip.referenceAudio);
    const record = delivered.get(clip.path);
    assert(record && record.text === clip.text, clip.path);
    assert.equal(hash(await fs.readFile('public/' + clip.path)), record.sha256, clip.path);
  }
  excluded += clips.length;
  const categories = identity.theme === 'high-school' ? ['attack', 'power', 'damage', 'item', 'finish', 'defeat'] : ['attack', 'damage', 'spell'];
  const count = identity.theme === 'high-school' ? 5 : 3;
  const files = {};
  for (const category of categories) for (let variant = 1; variant <= count; variant++) {
    const path = `public/sfx/${identity.theme}-voices/${identity.id}/${category}-${variant}.ogg`;
    files[path] = hash(await fs.readFile(path));mainFiles++;
  }
  heroes.push({ actor, mainBank: `sfx/${identity.theme}-voices/${identity.id}`, mainFiles: files,
    excludedChronicleClips: clips.length, chronicleReferenceAudio: null, chronicleNoRef: true,
    identityConclusion: 'Chronicle clips were synthesized without speaker reference; Dungeons 1 uses the exact main-battle files instead.' });
}
assert.equal(excluded, 520);assert.equal(mainFiles, 423);
const report = { schemaVersion: 1, auditedDate: '2026-10-25',
  designSha256: hash(designBytes), generationSha256: hash(generationBytes),
  generatorSha256: hash(generator), sourceModel: design.model, sourceModelRevision: design.modelRevision,
  sourceCodeRevision: design.codeRevision, sourceDevice: design.device, sourceCodecDevice: design.codecDevice,
  heroCount: actors.length, excludedUnreferencedClips: excluded, reusedMainBattleFiles: mainFiles, heroes };
const output = 'docs/dungeons/dungeons1-voice-audit.json';
if (process.argv.includes('--write')) await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
else assert.deepEqual(JSON.parse(await fs.readFile(output, 'utf8')), report, 'Voice provenance or canonical file bytes changed; review and update the audit.');
console.log(`PASS: ${actors.length} heroes, ${excluded} delivered no-reference clips verified by SHA-256, ${mainFiles} exact main-battle clips audited.`);
