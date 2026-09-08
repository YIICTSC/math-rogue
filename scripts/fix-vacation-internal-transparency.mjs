import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const DEFAULT_HISTORY_DIR = 'C:/Users/myfav/.codex/generated_images/01a078a5-0e8f-7f21-800a-6f63f3c47e47';
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const historyIndex = args.indexOf('--history-dir');
const historyDir = historyIndex >= 0 ? args[historyIndex + 1] : DEFAULT_HISTORY_DIR;
const previewIndex = args.indexOf('--preview-dir');
const previewDir = previewIndex >= 0 ? args[previewIndex + 1] : null;
const onlyIndex = args.indexOf('--only');
const only = onlyIndex >= 0 ? args[onlyIndex + 1] : null;

const SHEET_ROOTS = [
  path.join(ROOT, 'public/sprites/high-school'),
  path.join(ROOT, 'public/sprites/magic'),
];

const luminance = (image, index) => {
  const offset = index * 4;
  return (image.data[offset] + image.data[offset + 1] + image.data[offset + 2]) / 3;
};

// ImageGen's accidental background is a light, neutral checker pattern. The
// luminance threshold intentionally excludes the shaded/coloured character
// and effect pixels, including white costume details with coloured outlines.
const isLightNeutral = (image, index) => {
  const offset = index * 4;
  const red = image.data[offset];
  const green = image.data[offset + 1];
  const blue = image.data[offset + 2];
  return Math.max(red, green, blue) - Math.min(red, green, blue) <= 16
    && luminance(image, index) >= 232;
};

async function listSheetFiles() {
  const files = [];
  for (const root of SHEET_ROOTS) {
    for (const entry of await fs.readdir(root, { withFileTypes: true })) {
      if (!entry.isDirectory() || !entry.name.includes('vacation-') || !entry.name.endsWith('-sheets')) continue;
      const directory = path.join(root, entry.name);
      for (const name of await fs.readdir(directory)) {
        if (name.endsWith('.webp')) files.push(path.join(directory, name));
      }
    }
  }
  return files.sort().filter((file) => !only || file.replaceAll('\\', '/').includes(only.replaceAll('\\', '/')));
}

async function thumbnail(file) {
  return (await sharp(await fs.readFile(file))
    .resize(20, 20, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer()).subarray(0, 20 * 20 * 3);
}

function thumbnailDistance(first, second) {
  let distance = 0;
  for (let index = 0; index < first.length; index += 1) {
    const delta = first[index] - second[index];
    distance += delta * delta;
  }
  return distance / first.length;
}

async function buildHistoryMatches(targets) {
  let sourceNames;
  try {
    sourceNames = (await fs.readdir(historyDir))
      .filter((name) => name.endsWith('.png'))
      .map((name) => path.join(historyDir, name));
  } catch {
    return new Map();
  }
  if (sourceNames.length === 0) return new Map();

  const [targetThumbs, sourceThumbs] = await Promise.all([
    Promise.all(targets.map(thumbnail)),
    Promise.all(sourceNames.map(thumbnail)),
  ]);
  const matches = new Map();
  for (let targetIndex = 0; targetIndex < targets.length; targetIndex += 1) {
    let best = { distance: Number.POSITIVE_INFINITY, source: null };
    for (let sourceIndex = 0; sourceIndex < sourceNames.length; sourceIndex += 1) {
      const distance = thumbnailDistance(targetThumbs[targetIndex], sourceThumbs[sourceIndex]);
      if (distance < best.distance) best = { distance, source: sourceNames[sourceIndex] };
    }
    // A large distance means this sheet was not present in the supplied
    // ImageGen history; such a file uses the current image as its own pattern
    // reference instead of borrowing an unrelated character.
    if (best.distance <= 300) matches.set(targets[targetIndex], best);
  }
  return matches;
}

function correlation(image, step, axis) {
  const width = image.info.width;
  const limit = Math.min(120, image.info.width, image.info.height);
  let count = 0;
  let firstSum = 0;
  let secondSum = 0;
  let firstSquareSum = 0;
  let secondSquareSum = 0;
  let productSum = 0;
  for (let y = 0; y < limit; y += 1) {
    for (let x = 0; x < limit; x += 1) {
      const first = y * width + x;
      const second = axis === 'x' ? first + step : first + step * width;
      if (!isLightNeutral(image, first) || !isLightNeutral(image, second)) continue;
      const firstValue = luminance(image, first);
      const secondValue = luminance(image, second);
      count += 1;
      firstSum += firstValue;
      secondSum += secondValue;
      firstSquareSum += firstValue * firstValue;
      secondSquareSum += secondValue * secondValue;
      productSum += firstValue * secondValue;
    }
  }
  if (count < 200) return 1;
  const covariance = productSum - (firstSum * secondSum) / count;
  const variance = (firstSquareSum - (firstSum * firstSum) / count)
    * (secondSquareSum - (secondSum * secondSum) / count);
  return covariance / Math.sqrt(Math.max(1, variance));
}

function inferCheckerPeriod(image) {
  let best = { period: 20, score: 1 };
  for (let period = 8; period <= 50; period += 1) {
    const score = (correlation(image, period, 'x') + correlation(image, period, 'y')) / 2;
    if (score < best.score) best = { period, score };
  }
  return best;
}

function findCheckerComponents(target, pattern, period) {
  const width = target.info.width;
  const height = target.info.height;
  const pixelCount = width * height;
  const candidate = new Uint8Array(pixelCount);
  const seed = new Uint8Array(pixelCount);

  for (let index = 0; index < pixelCount; index += 1) {
    if (target.data[index * 4 + 3] > 0 && isLightNeutral(target, index) && isLightNeutral(pattern, index)) {
      candidate[index] = 1;
    }
  }

  // A checker tile flips brightness at its own period in all four directions.
  // Seeds are only used to identify a component; the whole neutral component
  // is cleared below so that enclosed checker tiles disappear without leaving
  // isolated white squares behind.
  for (let y = period; y < height - period; y += 1) {
    for (let x = period; x < width - period; x += 1) {
      const index = y * width + x;
      if (!candidate[index]) continue;
      const neighbours = [index - period, index + period, index - period * width, index + period * width];
      if (!neighbours.every((neighbour) => isLightNeutral(pattern, neighbour))) continue;
      const value = luminance(pattern, index);
      const neighbourMean = neighbours.reduce((sum, neighbour) => sum + luminance(pattern, neighbour), 0) / 4;
      const higher = neighbours.filter((neighbour) => luminance(pattern, neighbour) > value + 2).length;
      const lower = neighbours.filter((neighbour) => luminance(pattern, neighbour) < value - 2).length;
      if (Math.abs(value - neighbourMean) >= 2 && (higher >= 3 || lower >= 3)) seed[index] = 1;
    }
  }

  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  const components = [];
  for (let start = 0; start < pixelCount; start += 1) {
    if (!candidate[start] || visited[start]) continue;
    let head = 0;
    let tail = 0;
    const pixels = [];
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    visited[start] = 1;
    queue[tail] = start;
    tail += 1;
    while (head < tail) {
      const index = queue[head];
      head += 1;
      const x = index % width;
      const y = Math.floor(index / width);
      pixels.push(index);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      if (x > 0 && candidate[index - 1] && !visited[index - 1]) {
        visited[index - 1] = 1;
        queue[tail] = index - 1;
        tail += 1;
      }
      if (x + 1 < width && candidate[index + 1] && !visited[index + 1]) {
        visited[index + 1] = 1;
        queue[tail] = index + 1;
        tail += 1;
      }
      if (index >= width && candidate[index - width] && !visited[index - width]) {
        visited[index - width] = 1;
        queue[tail] = index - width;
        tail += 1;
      }
      if (index + width < pixelCount && candidate[index + width] && !visited[index + width]) {
        visited[index + width] = 1;
        queue[tail] = index + width;
        tail += 1;
      }
    }
    let seeds = 0;
    for (const index of pixels) seeds += seed[index];
    const fillRatio = pixels.length / ((maxX - minX + 1) * (maxY - minY + 1));
    if (seeds >= 50 || (pixels.length >= 1500 && fillRatio <= 0.55)) {
      components.push({ pixels, seeds });
    }
  }
  return components;
}

async function cleanSheet(targetPath, historyMatch) {
  // Read the file into memory before handing it to sharp. On Windows this
  // prevents libvips from retaining a source-file handle while the WebP is
  // being replaced below.
  const target = await sharp(await fs.readFile(targetPath)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pattern = historyMatch
    ? await sharp(await fs.readFile(historyMatch.source)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    : target;
  const inferred = inferCheckerPeriod(pattern);
  const fallback = !historyMatch || inferred.score > -0.15;
  const effectivePattern = fallback ? target : pattern;
  const effectivePeriod = fallback ? inferCheckerPeriod(target) : inferred;
  const components = findCheckerComponents(target, effectivePattern, effectivePeriod.period);
  const output = Buffer.from(target.data);
  let cleared = 0;
  for (const component of components) {
    for (const index of component.pixels) {
      const offset = index * 4;
      if (output[offset + 3] === 0) continue;
      output[offset] = 0;
      output[offset + 1] = 0;
      output[offset + 2] = 0;
      output[offset + 3] = 0;
      cleared += 1;
    }
  }
  // Avoid hidden checker RGB values bleeding through texture filtering at the
  // newly transparent pixels and normalize pre-existing transparent pixels.
  for (let index = 0; index < target.info.width * target.info.height; index += 1) {
    if (output[index * 4 + 3] !== 0) continue;
    output[index * 4] = 0;
    output[index * 4 + 1] = 0;
    output[index * 4 + 2] = 0;
  }
  if (!dryRun) {
    const encoded = await sharp(output, {
      raw: { width: target.info.width, height: target.info.height, channels: 4 },
    }).webp({ quality: 95, alphaQuality: 100, effort: 6 }).toBuffer();
    const temporaryPath = `${targetPath}.transparency-${process.pid}.tmp`;
    await fs.writeFile(temporaryPath, encoded);
    // Writing the already encoded buffer avoids Windows file-sharing errors
    // that can occur when a dev server is watching the source WebP.
    await fs.writeFile(targetPath, encoded);
    await fs.unlink(temporaryPath);
  }
  if (previewDir) {
    await fs.mkdir(previewDir, { recursive: true });
    await sharp(output, {
      raw: { width: target.info.width, height: target.info.height, channels: 4 },
    }).flatten({ background: '#07111d' }).png().toFile(path.join(
      previewDir,
      `${path.relative(ROOT, targetPath).replaceAll('\\', '__').replaceAll('/', '__')}.png`,
    ));
  }
  return {
    cleared,
    components: components.length,
    period: effectivePeriod.period,
    pattern: fallback ? 'current' : path.basename(historyMatch.source),
  };
}

const targets = await listSheetFiles();
const historyMatches = await buildHistoryMatches(targets);
let totalCleared = 0;
for (const target of targets) {
  const result = await cleanSheet(target, historyMatches.get(target));
  totalCleared += result.cleared;
  console.log(`${path.relative(ROOT, target)}: cleared=${result.cleared}, components=${result.components}, period=${result.period}, pattern=${result.pattern}`);
}
console.log(`Processed ${targets.length} vacation sheets; cleared ${totalCleared} internal checker pixels${dryRun ? ' (dry run)' : ''}.`);
