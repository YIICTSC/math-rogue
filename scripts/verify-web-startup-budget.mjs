import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const root = path.resolve('dist');
const manifest = JSON.parse(await readFile(path.join(root, '.vite/manifest.json'), 'utf8'));
const entry = Object.keys(manifest).find(key => manifest[key].isEntry && key.endsWith('index.html'));
assert(entry, 'production entry must be present');
function dependencies(key, visited = new Set()) {
  if (visited.has(key)) return visited;
  visited.add(key);
  for (const dependency of manifest[key].imports || []) dependencies(dependency, visited);
  return visited;
}
async function size(keys) {
  let rawBytes = 0, gzipBytes = 0;
  for (const key of keys) {
    const bytes = await readFile(path.join(root, manifest[key].file));
    rawBytes += bytes.length; gzipBytes += gzipSync(bytes).length;
  }
  return { files: keys.size, rawBytes, gzipBytes };
}
const boot = dependencies(entry);
const appKey = Object.keys(manifest).find(key => manifest[key].name === 'App' && manifest[key].isDynamicEntry);
assert(appKey, 'game must load separately from the startup shell');
const title = dependencies(appKey, new Set(boot));
for (const key of title) assert(!/subjectData|GeneralChallengeScreen|KanjiChallengeScreen|EnglishChallengeScreen|MiniGameRouter|DebugMenuScreen/.test(key), `not needed on title: ${key}`);
const result = { shell: await size(boot), title: await size(title) };
assert(result.shell.gzipBytes < 300_000, 'startup shell must stay under 300 KB gzip');
assert(result.title.gzipBytes < 4_800_000, 'title JS must be at least 20% below the previous ~6 MB gzip entry');
console.log(JSON.stringify(result, null, 2));
console.log('PASS: lightweight boot shell and title do not eagerly download question banks or mini-games.');
