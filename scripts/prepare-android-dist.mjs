import { mkdir, readdir, readFile, writeFile, stat, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { isSourceAsset } from './source-asset-exclusions.mjs';
const dist = path.resolve('dist');
const androidRoot = path.resolve('android');
const mediaDirs = new Set(['banners','bgm','bgm-new','card-illustrations','enemy-illustrations','event-illustrations','map-symbols-commons','sfx','sprites','ui','models','web-audio']);
const packs = Array.from({length:3}, (_,i) => ({name:`bundled_media_${i+1}`,bytes:0,files:0}));
for (const pack of packs) {
  const root = path.join(androidRoot,pack.name);
  const assets = path.join(root,'src/main/assets');
  if (!assets.startsWith(androidRoot + path.sep)) throw new Error('Invalid output path');
  await rm(assets,{recursive:true,force:true});
  await mkdir(assets,{recursive:true});
  await writeFile(path.join(root,'build.gradle'),`plugins { id 'com.android.asset-pack' }\nassetPack {\n    packName = '${pack.name}'\n    dynamicDelivery { deliveryType = 'install-time' }\n}\n`);
}
const walk = async dir => {
  const entries = await readdir(dir,{withFileTypes:true});
  const all = await Promise.all(entries.map(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]));
  return all.flat();
};
const files = (await walk(dist)).sort();
const installedPaths = new Map();
for (const file of files) {
  const relative = path.relative(dist,file).split(path.sep).join('/');
  if (isSourceAsset(relative) || /(?:-source\.(?:png|webp)|\.md|\.psd)$/i.test(relative)) {
    await rm(file); continue;
  }
  if (!mediaDirs.has(relative.split('/')[0])) continue;
  const normalized = relative.normalize('NFC');
  if (installedPaths.has(normalized)) {
    if (!(await readFile(file)).equals(await readFile(installedPaths.get(normalized)))) {
      throw new Error(`Conflicting Unicode asset paths: ${normalized}`);
    }
    await rm(file);
    continue;
  }
  const size = (await stat(file)).size;
  const pack = [...packs].sort((a,b) => a.bytes-b.bytes)[0];
  const target = path.join(androidRoot,pack.name,'src/main/assets/public',relative.normalize('NFC'));
  await mkdir(path.dirname(target),{recursive:true});
  await rename(file,target);
  installedPaths.set(normalized, target);
  pack.bytes += size; pack.files++;
}
const manifest = JSON.parse(await readFile(path.join(dist,'android-asset-pack-manifest.json'),'utf8'));
for (const pack of Object.values(manifest.packs)) {
  for (const file of pack.files) {
    if (!installedPaths.has(file.path.normalize('NFC'))) {
      const local = await stat(path.join(dist,file.path)).catch(() => null);
      if (!local?.isFile()) throw new Error(`Missing bundled asset: ${file.path}`);
    }
  }
}
for (const pack of packs) {
  if (pack.bytes > 1400*1024*1024) throw new Error(`Asset pack too large: ${pack.name}`);
  console.log(`${pack.name}: ${pack.files} files, ${(pack.bytes/1024/1024).toFixed(1)} MiB (install-time)`);
}
await writeFile(path.join(dist,'android-bundled-assets.json'),JSON.stringify({delivery:'install-time',packs},null,2));
console.log('All runtime media bundled for installation; no hosted-media download required.');
