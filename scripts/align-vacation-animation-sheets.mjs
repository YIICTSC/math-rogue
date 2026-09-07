import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sprites = path.join(root, 'public', 'sprites');
const cellSize = 627;
const actions = ['idle', 'idle-special', 'attack', 'skill', 'hit', 'low-hp'];
const subjects = [];

for (let index = 0; index < 9; index += 1) {
  subjects.push({
    idle: path.join(sprites, 'high-school', 'vacation-characters-idle-sheets', `${index}.webp`),
    files: actions.map(action => path.join(sprites, 'high-school', `vacation-characters-${action}-sheets`, `${index}.webp`)),
  });
}

for (let index = 1; index <= 9; index += 1) {
  const heroine = `heroine-${String(index).padStart(2, '0')}`;
  for (const form of ['before', 'after']) {
    subjects.push({
      idle: path.join(sprites, 'magic', 'vacation-characters-idle-sheets', `${heroine}-${form}.webp`),
      files: actions.map(action => path.join(sprites, 'magic', `vacation-characters-${action}-sheets`, `${heroine}-${form}.webp`)),
    });
  }
}

for (const subject of ['ren', 'soma', 'minato', 'riku', 'yamato', 'leon', 'elliot', 'sakuya']) {
  for (const form of ['before', 'after']) {
    subjects.push({
      idle: path.join(sprites, 'magic', 'vacation-male-characters-idle-sheets', `${subject}-${form}.webp`),
      files: actions.map(action => path.join(sprites, 'magic', `vacation-male-characters-${action}-sheets`, `${subject}-${form}.webp`)),
    });
  }
}

const readRaw = async filePath => sharp(await fs.readFile(filePath)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

const findAnchor = (data, info, frame = 0) => {
  const xOffset = (frame % 2) * cellSize;
  const yOffset = Math.floor(frame / 2) * cellSize;
  const minXLimit = 0;
  const maxXLimit = cellSize - 1;
  const xHistogram = new Uint32Array(cellSize);
  let opaquePixelCount = 0;
  let maxY = 0;
  let visible = false;

  for (let y = 0; y < cellSize; y += 1) {
    for (let x = minXLimit; x <= maxXLimit; x += 1) {
      const sourceX = xOffset + x;
      const sourceY = yOffset + y;
      const alpha = data[(sourceY * info.width + sourceX) * 4 + 3];
      if (alpha <= 8) continue;
      visible = true;
      xHistogram[x] += 1;
      opaquePixelCount += 1;
      maxY = Math.max(maxY, y);
    }
  }

  if (!visible) return null;
  const bandStart = Math.max(0, maxY - Math.max(32, Math.round(cellSize * 0.1)));
  const bandHistogram = new Uint32Array(cellSize);
  let bandOpaquePixelCount = 0;
  for (let y = bandStart; y <= maxY; y += 1) {
    for (let x = minXLimit; x <= maxXLimit; x += 1) {
      const sourceX = xOffset + x;
      const sourceY = yOffset + y;
      const alpha = data[(sourceY * info.width + sourceX) * 4 + 3];
      if (alpha <= 8) continue;
      bandHistogram[x] += 1;
      bandOpaquePixelCount += 1;
    }
  }
  const histogram = bandOpaquePixelCount > 0 ? bandHistogram : xHistogram;
  const histogramTotal = bandOpaquePixelCount > 0 ? bandOpaquePixelCount : opaquePixelCount;
  let cumulative = 0;
  let centerX = Math.floor(cellSize / 2);
  for (let x = minXLimit; x <= maxXLimit; x += 1) {
    cumulative += histogram[x];
    if (cumulative * 2 >= histogramTotal) {
      centerX = x;
      break;
    }
  }
  return { centerX, bottomY: maxY };
};

const shiftSheet = (data, info, target, shifts) => {
  const shifted = Buffer.alloc(data.length, 0);
  for (let frame = 0; frame < 4; frame += 1) {
    const xOffset = (frame % 2) * cellSize;
    const yOffset = Math.floor(frame / 2) * cellSize;
    const dx = shifts[frame]?.dx ?? 0;
    const dy = shifts[frame]?.dy ?? 0;
    for (let y = 0; y < cellSize; y += 1) {
      for (let x = 0; x < cellSize; x += 1) {
        const targetX = x + dx;
        const targetY = y + dy;
        if (targetX < 0 || targetX >= cellSize || targetY < 0 || targetY >= cellSize) continue;
        const sourceOffset = ((yOffset + y) * info.width + xOffset + x) * 4;
        const targetOffset = ((yOffset + targetY) * info.width + xOffset + targetX) * 4;
        shifted[targetOffset] = data[sourceOffset];
        shifted[targetOffset + 1] = data[sourceOffset + 1];
        shifted[targetOffset + 2] = data[sourceOffset + 2];
        shifted[targetOffset + 3] = data[sourceOffset + 3];
      }
    }
  }
  return shifted;
};

const alignOne = async ({ idle, files }) => {
  const idleRaw = await readRaw(idle);
  const idleAnchor = findAnchor(idleRaw.data, idleRaw.info, 0);
  if (!idleAnchor) throw new Error(`idle anchor missing: ${idle}`);

  for (const file of files) {
    const source = await readRaw(file);
    const shifts = [];
    for (let frame = 0; frame < 4; frame += 1) {
      const current = findAnchor(source.data, source.info, frame);
      shifts.push(current
        ? {
            dx: Math.round(idleAnchor.centerX - current.centerX),
            dy: Math.round(idleAnchor.bottomY - current.bottomY),
          }
        : { dx: 0, dy: 0 });
    }
    const shifted = shiftSheet(source.data, source.info, null, shifts);
    const encoded = await sharp(shifted, { raw: { width: source.info.width, height: source.info.height, channels: 4 } })
      .webp({ quality: 95, alphaQuality: 100, effort: 5 })
      .toBuffer();
    const temporaryPath = `${file}.align-${process.pid}-${Math.random().toString(36).slice(2)}.tmp`;
    await fs.writeFile(temporaryPath, encoded);
    await fs.copyFile(temporaryPath, file);
    await fs.unlink(temporaryPath);
  }
  return { idle, sheets: files.length };
};

for (let offset = 0; offset < subjects.length; offset += 2) {
  const batch = subjects.slice(offset, offset + 2);
  await Promise.all(batch.map(alignOne));
  console.log(`aligned ${Math.min(offset + batch.length, subjects.length)}/${subjects.length} vacation subjects`);
}
