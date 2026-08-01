import fs from 'node:fs/promises';
import { isSourceAsset } from './source-asset-exclusions.mjs';

const manifest = JSON.parse(await fs.readFile('public/android-asset-pack-manifest.json', 'utf8'));
const files = Object.values(manifest.packs).flatMap(pack => pack.files);
const sourceAssets = files.filter(file => isSourceAsset(file.path));
const nonNormalizedPaths = files.filter(file => file.path !== file.path.normalize('NFC'));

if (sourceAssets.length > 0) {
  throw new Error(`Manifest contains ${sourceAssets.length} source-only assets: ${sourceAssets[0].path}`);
}
if (nonNormalizedPaths.length > 0) {
  throw new Error(`Manifest contains ${nonNormalizedPaths.length} non-NFC paths: ${nonNormalizedPaths[0].path}`);
}

console.log(`Android asset manifest verification passed (${files.length} hosted files).`);
