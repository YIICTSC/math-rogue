import { rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { build } from 'vite';

process.env.VITE_APP_PLATFORM = 'steam';
process.env.VITE_PAID_EDITION = 'true';
delete process.env.VITE_OFFLINE_DISTRIBUTABLE;

const distDir = path.resolve('dist');
await rm(distDir, { recursive: true, force: true });
await build();
await writeFile(path.join(distDir, 'steam-build.json'), `${JSON.stringify({
  platform: 'steam',
  paidEdition: true,
  offlineDistributable: false,
  generatedAt: new Date().toISOString(),
}, null, 2)}\n`);

await new Promise((resolve, reject) => {
  const child = spawn(process.execPath, ['scripts/cleanup-dist-assets.mjs'], { stdio: 'inherit' });
  child.on('error', reject);
  child.on('close', code => {
    if (code === 0) resolve();
    else reject(new Error(`cleanup-dist-assets exited with code ${code}`));
  });
});
