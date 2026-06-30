import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import ffmpegPath from 'ffmpeg-static';

const bgmRoot = path.resolve('public', 'bgm');
const bitrate = process.env.BGM_BITRATE || '128k';

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
    } else if (entry.name.toLowerCase().endsWith('.mp3')) {
      files.push(fullPath);
    }
  }
  return files;
}

function runFfmpeg(input, output) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, [
      '-y',
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      input,
      '-map_metadata',
      '-1',
      '-codec:a',
      'libmp3lame',
      '-b:a',
      bitrate,
      output,
    ], { stdio: ['ignore', 'ignore', 'pipe'] });

    let stderr = '';
    child.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `ffmpeg exited with code ${code}`));
    });
  });
}

const files = await walk(bgmRoot);
let beforeTotal = 0;
let afterTotal = 0;
let changed = 0;
let kept = 0;

for (const file of files) {
  const before = (await fs.stat(file)).size;
  beforeTotal += before;

  const temp = file.replace(/\.mp3$/i, '.tmp.mp3');
  await runFfmpeg(file, temp);
  const after = (await fs.stat(temp)).size;

  if (after < before) {
    await fs.rm(file, { force: true });
    await fs.rename(temp, file);
    afterTotal += after;
    changed += 1;
  } else {
    await fs.rm(temp, { force: true });
    afterTotal += before;
    kept += 1;
  }
}

const savedMiB = (beforeTotal - afterTotal) / 1024 / 1024;
console.log(`Compressed ${changed} BGM files at ${bitrate}; kept ${kept}. Saved ${savedMiB.toFixed(1)} MiB.`);
