import { rm } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const webAudioPaths = [
  path.join(root, 'dist', 'web-audio'),
  path.join(root, 'ios', 'App', 'App', 'public', 'web-audio'),
];

await Promise.all(webAudioPaths.map((target) => rm(target, { recursive: true, force: true })));
console.log('iOS build cleanup removed Web-only public/web-audio assets.');
