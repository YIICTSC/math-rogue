import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const spritesRoot = path.join(projectRoot, 'public', 'sprites');
const actions = ['idle-special', 'attack', 'skill', 'hit', 'low-hp'];
const expectedFiles = [];

for (let index = 0; index < 9; index += 1) {
  for (const action of actions) {
    expectedFiles.push(path.join(
      spritesRoot,
      'high-school',
      `vacation-characters-${action}-sheets`,
      `${index}.png`,
    ));
  }
}

for (let index = 1; index <= 9; index += 1) {
  const subject = `heroine-${String(index).padStart(2, '0')}`;
  for (const form of ['before', 'after']) {
    for (const action of actions) {
      expectedFiles.push(path.join(
        spritesRoot,
        'magic',
        `vacation-characters-${action}-sheets`,
        `${subject}-${form}.png`,
      ));
    }
  }
}

for (const subject of ['ren', 'soma', 'minato', 'riku', 'yamato', 'leon', 'elliot', 'sakuya']) {
  for (const form of ['before', 'after']) {
    for (const action of actions) {
      expectedFiles.push(path.join(
        spritesRoot,
        'magic',
        `vacation-male-characters-${action}-sheets`,
        `${subject}-${form}.png`,
      ));
    }
  }
}

const failures = [];
let checked = 0;

for (const filePath of expectedFiles) {
  const label = path.relative(projectRoot, filePath);
  if (!fs.existsSync(filePath)) {
    failures.push({ file: label, reason: 'missing' });
    continue;
  }

  const metadata = await sharp(filePath).metadata();
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const quadrantOpaquePixels = [0, 0, 0, 0];
  let opaquePixels = 0;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * 4 + 3];
      if (alpha <= 8) continue;
      opaquePixels += 1;
      const quadrant = (y >= info.height / 2 ? 2 : 0) + (x >= info.width / 2 ? 1 : 0);
      quadrantOpaquePixels[quadrant] += 1;
    }
  }

  const corners = [
    [0, 0],
    [info.width - 1, 0],
    [0, info.height - 1],
    [info.width - 1, info.height - 1],
  ].map(([x, y]) => data[(y * info.width + x) * 4 + 3]);

  if (
    metadata.width !== 1254
    || metadata.height !== 1254
    || metadata.channels !== 4
    || corners.some(alpha => alpha > 8)
    || quadrantOpaquePixels.some(count => count < 50)
    || opaquePixels < 200
  ) {
    failures.push({
      file: label,
      reason: {
        size: `${metadata.width}x${metadata.height}`,
        channels: metadata.channels,
        corners,
        quadrantOpaquePixels,
        opaquePixels,
      },
    });
  }
  checked += 1;
}

console.log(JSON.stringify({
  expected: expectedFiles.length,
  checked,
  failures: failures.length,
  details: failures,
}, null, 2));

if (failures.length > 0) process.exitCode = 1;
