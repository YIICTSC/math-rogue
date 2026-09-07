import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sprites = path.join(root, 'public', 'sprites');
const affectedFemaleOnly = process.argv.includes('--affected-female');
const actions = process.argv.includes('--only-idle')
  ? ['idle']
  : ['idle', 'idle-special', 'attack', 'skill', 'hit', 'low-hp'];
const cellSize = 627;
const sheetSize = cellSize * 2;
const baseSize = Math.round(cellSize * 0.84);

// The vacation portraits are single illustrations. Build four temporal poses
// from each illustration so every generated sheet has visible animation
// instead of four identical quadrants. The values are deliberately subtle for
// idle/hit states and more pronounced for attack/skill states.
const frameSpecs = {
  idle: [
    { scale: 0.98, dx: -4, dy: 3, rotate: -0.8, brightness: 0.99, saturation: 1.00 },
    { scale: 1.00, dx: 0, dy: 0, rotate: 0.4, brightness: 1.01, saturation: 1.02 },
    { scale: 1.02, dx: 4, dy: -3, rotate: 0.9, brightness: 1.03, saturation: 1.04 },
    { scale: 0.99, dx: 0, dy: 2, rotate: -0.4, brightness: 1.00, saturation: 1.01 },
  ],
  'idle-special': [
    { scale: 0.96, dx: -7, dy: 5, rotate: -1.2, brightness: 0.98, saturation: 1.0 },
    { scale: 1.00, dx: 4, dy: 0, rotate: 0.8, brightness: 1.02, saturation: 1.03 },
    { scale: 1.04, dx: 7, dy: -5, rotate: 1.4, brightness: 1.04, saturation: 1.06 },
    { scale: 0.99, dx: -3, dy: 2, rotate: -0.5, brightness: 1.00, saturation: 1.01 },
  ],
  attack: [
    { scale: 0.93, dx: -12, dy: 6, rotate: -4.0, brightness: 0.96, saturation: 1.00 },
    { scale: 1.00, dx: 8, dy: -2, rotate: 1.5, brightness: 1.04, saturation: 1.05 },
    { scale: 1.08, dx: -5, dy: -8, rotate: 4.5, brightness: 1.12, saturation: 1.12 },
    { scale: 0.97, dx: 6, dy: 5, rotate: -1.5, brightness: 1.00, saturation: 1.02 },
  ],
  skill: [
    { scale: 0.91, dx: -10, dy: 7, rotate: -3.5, brightness: 0.94, saturation: 1.02 },
    { scale: 1.00, dx: 5, dy: -3, rotate: 1.0, brightness: 1.08, saturation: 1.10 },
    { scale: 1.10, dx: -4, dy: -10, rotate: 4.0, brightness: 1.18, saturation: 1.18 },
    { scale: 0.98, dx: 7, dy: 3, rotate: -1.0, brightness: 1.02, saturation: 1.05 },
  ],
  hit: [
    { scale: 0.98, dx: 0, dy: 0, rotate: 0.0, brightness: 1.00, saturation: 1.00 },
    { scale: 0.97, dx: -14, dy: 5, rotate: -6.5, brightness: 0.90, saturation: 0.94 },
    { scale: 1.02, dx: 14, dy: 8, rotate: 6.5, brightness: 0.84, saturation: 0.88 },
    { scale: 0.98, dx: -5, dy: 3, rotate: 2.0, brightness: 0.94, saturation: 0.96 },
  ],
  'low-hp': [
    { scale: 0.97, dx: -4, dy: 7, rotate: -2.0, brightness: 0.94, saturation: 0.88 },
    { scale: 0.94, dx: 9, dy: 13, rotate: 3.5, brightness: 0.86, saturation: 0.78 },
    { scale: 0.92, dx: -8, dy: 16, rotate: -4.5, brightness: 0.80, saturation: 0.70 },
    { scale: 0.96, dx: 3, dy: 9, rotate: 1.0, brightness: 0.90, saturation: 0.82 },
  ],
};

const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const baseBufferCache = new Map();

const getBaseBuffer = async (staticPath) => {
  if (!baseBufferCache.has(staticPath)) {
    const baseBufferPromise = fs.readFile(staticPath).then((source) =>
      sharp(source)
        .resize({ width: baseSize, height: baseSize, fit: 'contain', background: transparent })
        .png()
        .toBuffer(),
    );
    baseBufferCache.set(staticPath, baseBufferPromise);
  }
  return baseBufferCache.get(staticPath);
};

const buildFrame = async (baseBuffer, spec) => {
  const size = Math.round(baseSize * spec.scale);
  let image = sharp(baseBuffer)
    .resize({ width: size, height: size, fit: 'contain', background: transparent })
    .modulate({ brightness: spec.brightness, saturation: spec.saturation });

  if (spec.rotate !== 0) {
    image = image.rotate(spec.rotate, { background: transparent });
  }

  const input = await image.png().toBuffer();
  const metadata = await sharp(input).metadata();
  const left = Math.round((cellSize - (metadata.width ?? size)) / 2 + spec.dx);
  const top = Math.round((cellSize - (metadata.height ?? size)) / 2 + spec.dy);
  return { input, left, top };
};

const buildSheet = async (staticPath, outputPath, action) => {
  const baseBuffer = await getBaseBuffer(staticPath);
  const frames = await Promise.all(frameSpecs[action].map((spec) => buildFrame(baseBuffer, spec)));
  const composites = frames.map((frame, index) => ({
    input: frame.input,
    left: frame.left + (index % 2) * cellSize,
    top: frame.top + Math.floor(index / 2) * cellSize,
  }));

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await sharp({
    create: { width: sheetSize, height: sheetSize, channels: 4, background: transparent },
  })
    .composite(composites)
    .webp({ quality: 95, alphaQuality: 100, effort: 4 })
    .toFile(outputPath);
};

const jobs = [];

for (let index = 0; index < 9; index += 1) {
  if (affectedFemaleOnly && ![1, 3, 5, 6].includes(index)) continue;
  const staticPath = path.join(sprites, 'high-school', 'vacation-characters', `${index}.webp`);
  for (const action of actions) {
    jobs.push(() => buildSheet(
      staticPath,
      path.join(sprites, 'high-school', `vacation-characters-${action}-sheets`, `${index}.webp`),
      action,
    ));
  }
}

for (let index = 1; index <= 9; index += 1) {
  if (affectedFemaleOnly && ![3, 5, 6, 8].includes(index)) continue;
  const heroine = `heroine-${String(index).padStart(2, '0')}`;
  for (const form of ['before', 'after']) {
    const staticPath = path.join(sprites, 'magic', 'vacation-characters', `${heroine}-${form}.webp`);
    for (const action of actions) {
      jobs.push(() => buildSheet(
        staticPath,
        path.join(sprites, 'magic', `vacation-characters-${action}-sheets`, `${heroine}-${form}.webp`),
        action,
      ));
    }
  }
}

const magicMaleSubjects = ['ren', 'soma', 'minato', 'riku', 'yamato', 'leon', 'elliot', 'sakuya'];
if (affectedFemaleOnly) magicMaleSubjects.length = 0;
for (const subject of magicMaleSubjects) {
  for (const form of ['before', 'after']) {
    const staticPath = path.join(sprites, 'magic', 'vacation-male-characters', `${subject}-${form}.webp`);
    for (const action of actions) {
      jobs.push(() => buildSheet(
        staticPath,
        path.join(sprites, 'magic', `vacation-male-characters-${action}-sheets`, `${subject}-${form}.webp`),
        action,
      ));
    }
  }
}

for (let offset = 0; offset < jobs.length; offset += 8) {
  await Promise.all(jobs.slice(offset, offset + 8).map((job) => job()));
  console.log(`rebuilt ${Math.min(offset + 8, jobs.length)}/${jobs.length} vacation animation sheets`);
}

console.log('rebuilt vacation animation sheets with four distinct generated frames per sheet');
