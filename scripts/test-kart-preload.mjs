import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';

const bundle = await build({ stdin: { contents: `export * from './src/generated/kartVisualAssets';export {PROTAGONISTS} from './src/three/protagonistCatalog';export * from './src/utils/assetPaths';export * from './src/utils/preparedVisualAssets';`, resolveDir: process.cwd() }, bundle: true, format: 'esm', platform: 'node', write: false, define: { 'import.meta.env': '{}' } });
const api = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const files = api.GP_VISUAL_FILES, paths = new Set(files.map(f => f.path));
assert.equal(paths.size, files.length);
assert.deepEqual(paths, new Set([
  'models/storybook/characters-v3.glb', 'models/storybook/storybook-v1.glb',
  'sprites/online-titles/gp-logo.webp', 'sprites/mini-game-titles/kart-landscape-v1.webp', 'sprites/mini-game-titles/kart-portrait-v1.webp',
  ...api.PROTAGONISTS.map(p => `models/protagonists/${p.id}.glb`),
]));
let bytes = 0;
for (const file of files) {
  const data = await readFile(`public/${file.path}`); bytes += data.length;
  assert.equal(file.bytes, data.length, file.path);
  assert.equal(file.sha256, createHash('sha256').update(data).digest('hex'), file.path);
}
assert.equal(bytes, api.GP_VISUAL_BYTES);
assert.equal(api.GP_VISUAL_VERSION, createHash('sha256').update(JSON.stringify(files)).digest('hex').slice(0, 16));
const file = files[0], original = api.assetUrl(file.path), other = api.assetUrl('sprites/learning-rogue-title-background.webp');
api.registerPreparedVisual(file.path, file.sha256, new Blob([await readFile(`public/${file.path}`)]));
const prepared = api.assetUrl(file.path);
assert(prepared.startsWith('blob:'));
assert.equal(api.assetSourceUrl(file.path), original);
assert.equal(api.assetUrl('sprites/learning-rogue-title-background.webp'), other);
assert(api.isVisualPrepared(file.path, file.sha256));
api.registerPreparedVisual(file.path, file.sha256, new Blob(['same version']));
assert.equal(api.assetUrl(file.path), prepared);
api.registerPreparedVisual(file.path, 'updated', new Blob(['updated bytes']));
assert.notEqual(api.assetUrl(file.path), prepared);
assert(!api.isVisualPrepared(file.path, file.sha256));
await assert.rejects(fetch(prepared));
console.log(`PASS: GP-only ${files.length}-file/${(bytes / 1048576).toFixed(2)} MiB scope, current content hashes, real Blob reuse, source/other-game isolation and replacement cleanup.`);
