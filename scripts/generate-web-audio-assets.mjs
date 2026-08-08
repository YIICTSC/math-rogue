import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import ffmpegPath from 'ffmpeg-static';

const root = process.cwd();
const outputRoot = path.join(root, 'public', 'web-audio');
const targets = [
  { inputRoot: path.join(root, 'public', 'bgm'), relativeRoot: 'bgm', bitrate: process.env.WEB_BGM_OPUS_BITRATE || '96k', channels: 2 },
  { inputRoot: path.join(root, 'public', 'bgm-new'), relativeRoot: 'bgm-new', bitrate: process.env.WEB_BGM_OPUS_BITRATE || '96k', channels: 2 },
  { inputRoot: path.join(root, 'public', 'sfx'), relativeRoot: 'sfx', bitrate: process.env.WEB_SFX_OPUS_BITRATE || '64k', channels: 1 },
];

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

async function fileExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function runFfmpeg(input, output, bitrate, channels) {
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
      '-vn',
      '-ac',
      String(channels),
      '-ar',
      '48000',
      '-codec:a',
      'libopus',
      '-application',
      'audio',
      '-vbr',
      'on',
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

let converted = 0;
let beforeTotal = 0;
let afterTotal = 0;
const jobs = [];

for (const target of targets) {
  const files = await walk(target.inputRoot);
  for (const input of files) {
    const relative = path.relative(target.inputRoot, input);
    const output = path.join(outputRoot, target.relativeRoot, relative.replace(/\.mp3$/i, '.ogg'));
    if (await fileExists(output)) continue;
    jobs.push({
      input,
      output,
      bitrate: target.bitrate,
      channels: target.channels,
    });
  }
}

let nextJobIndex = 0;
const worker = async () => {
  while (nextJobIndex < jobs.length) {
    const job = jobs[nextJobIndex++];
    await fs.mkdir(path.dirname(job.output), { recursive: true });
    const temp = job.output.replace(/\.ogg$/i, '.tmp.ogg');
    await runFfmpeg(job.input, temp, job.bitrate, job.channels);
    const [before, after] = await Promise.all([
      fs.stat(job.input),
      fs.stat(temp),
    ]);
    beforeTotal += before.size;
    afterTotal += after.size;
    await fs.rm(job.output, { force: true });
    await fs.rename(temp, job.output);
    converted += 1;
  }
};

const workerCount = Math.min(
  Math.max(1, Number.parseInt(process.env.WEB_AUDIO_CONCURRENCY || '8', 10) || 8),
  jobs.length,
);
await Promise.all(Array.from({ length: workerCount }, worker));

const savedMiB = (beforeTotal - afterTotal) / 1024 / 1024;
console.log(`Generated ${converted} Web Opus assets. Saved ${savedMiB.toFixed(1)} MiB before fallback copies.`);
