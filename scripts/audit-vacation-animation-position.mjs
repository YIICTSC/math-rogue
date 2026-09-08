import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sprites = path.join(root, 'public', 'sprites');
const cellSize = 627;
const actions = ['idle-special', 'attack', 'skill', 'hit', 'low-hp'];
const subjects = [];

for (let index = 0; index < 9; index += 1) {
  subjects.push({
    label: `high-school/${index}`,
    idle: path.join(sprites, 'high-school', 'vacation-characters-idle-sheets', `${index}.webp`),
    files: actions.map(action => path.join(sprites, 'high-school', `vacation-characters-${action}-sheets`, `${index}.webp`)),
  });
}
for (let index = 1; index <= 9; index += 1) {
  const heroine = `heroine-${String(index).padStart(2, '0')}`;
  for (const form of ['before', 'after']) {
    subjects.push({
      label: `magic/${heroine}-${form}`,
      idle: path.join(sprites, 'magic', 'vacation-characters-idle-sheets', `${heroine}-${form}.webp`),
      files: actions.map(action => path.join(sprites, 'magic', `vacation-characters-${action}-sheets`, `${heroine}-${form}.webp`)),
    });
  }
}
for (const subject of ['ren', 'soma', 'minato', 'riku', 'yamato', 'leon', 'elliot', 'sakuya']) {
  for (const form of ['before', 'after']) {
    subjects.push({
      label: `magic/${subject}-${form}`,
      idle: path.join(sprites, 'magic', 'vacation-male-characters-idle-sheets', `${subject}-${form}.webp`),
      files: actions.map(action => path.join(sprites, 'magic', `vacation-male-characters-${action}-sheets`, `${subject}-${form}.webp`)),
    });
  }
}

const raw = async file => sharp(await fs.readFile(file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const anchor = (data, info, frame) => {
  const xOffset = (frame % 2) * cellSize;
  const yOffset = Math.floor(frame / 2) * cellSize;
  const minXLimit = 0;
  const maxXLimit = cellSize - 1;
  let minX = cellSize;
  let maxX = -1;
  let maxY = 0;
  let visible = false;
  for (let y = 0; y < cellSize; y += 1) {
    for (let x = minXLimit; x <= maxXLimit; x += 1) {
      const alpha = data[((yOffset + y) * info.width + xOffset + x) * 4 + 3];
      if (alpha <= 8) continue;
      visible = true;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (!visible) return null;
  return { centerX: Math.round((minX + maxX) / 2), bottomY: maxY };
};

const failures = [];
let checkedFrames = 0;
let maxDrift = { x: 0, y: 0 };
for (const subject of subjects) {
  const idle = await raw(subject.idle);
  const idleTargets = Array.from({ length: 4 }, (_, frame) => anchor(idle.data, idle.info, frame));
  if (idleTargets.some(target => !target)) {
    failures.push({ subject: subject.label, reason: 'idle anchor missing' });
    continue;
  }
  for (const file of subject.files) {
    const source = await raw(file);
    for (let frame = 0; frame < 4; frame += 1) {
      const target = idleTargets[frame];
      const current = anchor(source.data, source.info, frame);
      checkedFrames += 1;
      if (!target || !current) {
        failures.push({ file: path.relative(root, file), frame, reason: 'frame anchor missing' });
        continue;
      }
      const drift = {
        x: Math.round(current.centerX - target.centerX),
        y: Math.round(current.bottomY - target.bottomY),
      };
      maxDrift = { x: Math.max(maxDrift.x, Math.abs(drift.x)), y: Math.max(maxDrift.y, Math.abs(drift.y)) };
      if (Math.abs(drift.x) > 2 || Math.abs(drift.y) > 2) {
        failures.push({ file: path.relative(root, file), frame, against: 'matching idle frame', drift });
      }
    }
  }
}

console.log(JSON.stringify({
  subjects: subjects.length,
  checkedFrames,
  basis: 'matching idle frame per frame (not idle frame 0)',
  maxDrift,
  failures: failures.length,
  details: failures,
}, null, 2));
if (failures.length > 0) process.exitCode = 1;
