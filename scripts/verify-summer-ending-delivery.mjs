import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const delivery = JSON.parse(await fs.readFile('assets/ending-expansion/delivery-manifest.json', 'utf8'));
const android = JSON.parse(await fs.readFile('public/android-asset-pack-manifest.json', 'utf8'));
const web = JSON.parse(await fs.readFile('public/web-asset-manifest.json', 'utf8'));
let count = 0;
for (const record of delivery.records) {
  const androidFiles = android.packs[`visual-${record.theme}`].files;
  const webFiles = web.packs[record.theme].files;
  for (const file of record.files) {
    const name = file.path.replace(/^public\//, '');
    const androidEntry = androidFiles.find(row => row.path === name);
    const webEntry = webFiles.find(row => row.path === name);
    assert.ok(androidEntry, `Android theme pack missing ${name}`);
    assert.ok(webEntry, `Web theme pack missing ${name}`);
    assert.equal(androidEntry.sha256, file.sha256, `Android stale hash: ${name}`);
    assert.equal(androidEntry.size, file.bytes);
    assert.equal(webEntry.size, file.bytes);
    count++;
  }
}
assert.equal(count, 163);
console.log('PASS: all 163 summer ending images in correct Web/Android theme packs, Android SHA-256 and both sizes match the reviewed delivery manifest.');
