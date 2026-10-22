// Mechanical sprite extraction only: all illustrated pixels originate in ImageGen.
import sharp from 'sharp';
import fs from 'node:fs/promises';
const root = 'public/sprites/mahjong';
await fs.mkdir(`${root}/tiles`, { recursive: true });
const baseKeys = [...Array.from({ length: 9 }, (_, i) => `m${i + 1}`), ...Array.from({ length: 9 }, (_, i) => `p${i + 1}`), ...Array.from({ length: 9 }, (_, i) => `s${i + 1}`), ...Array.from({ length: 7 }, (_, i) => `z${i + 1}`), 'star', 'back'];
const sheets = [
  ['docs/assets/mahjong/tiles-original-review.png', 6, 6, baseKeys, key => key.startsWith('m') || key.startsWith('z') || key === 'back' || key === 'star'],
  [`${root}/tiles-dots-corrected-v2.png`, 3, 3, Array.from({ length: 9 }, (_, i) => `p${i + 1}`), () => true],
  [`${root}/tiles-bamboo-corrected-v2.png`, 3, 3, Array.from({ length: 9 }, (_, i) => `s${i + 1}`), () => true],
  [`${root}/tiles-flowers-v1.png`, 4, 2, Array.from({ length: 8 }, (_, i) => `f${i + 1}`), () => true],
];
const runs = (values, threshold) => {
  const result = []; let start = -1;
  values.forEach((n, i) => { if (n > threshold && start < 0) start = i; if ((n <= threshold || i === values.length - 1) && start >= 0) { const end = n <= threshold ? i : i + 1; if (end - start > 20) result.push([start, end]); start = -1; } });
  return result;
};
const manifest = {};
for (const [file, columns, rows, keys, include] of sheets) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const fg = (x, y) => { const i = (y * width + x) * channels, r = data[i], g = data[i + 1], b = data[i + 2]; return !(r > 155 && b > 110 && r > g * 1.6 && b > g * 1.6); };
  const yBands = runs(Array.from({ length: height }, (_, y) => { let n = 0; for (let x = 0; x < width; x++) n += Number(fg(x, y)); return n; }), width * .15);
  if (yBands.length !== rows) throw Error(`Unexpected row count ${file}: ${yBands.length}`);
  for (let row = 0; row < rows; row++) {
    const [top, bottom] = yBands[row];
    const xBands = runs(Array.from({ length: width }, (_, x) => { let n = 0; for (let y = top; y < bottom; y++) n += Number(fg(x, y)); return n; }), (bottom - top) * .25);
    if (xBands.length !== columns) throw Error(`Unexpected column count ${file}/${row}: ${xBands.length}`);
    for (let col = 0; col < columns; col++) {
      const key = keys[row * columns + col]; if (!include(key)) continue;
      const [left, right] = xBands[col];
      const { data: crop, info: ci } = await sharp(file).extract({ left, top, width: right - left, height: bottom - top }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      // Key only border-connected background. A pink petal inside an ivory tile
      // must never become a transparent hole merely because it resembles magenta.
      const queue = new Int32Array(ci.width * ci.height), visited = new Uint8Array(queue.length); let read = 0, write = 0;
      const enqueue = p => {
        if (visited[p]) return;
        const i = p * 4;
        if (!(crop[i] > 155 && crop[i + 2] > 110 && crop[i] > crop[i + 1] * 1.6 && crop[i + 2] > crop[i + 1] * 1.6)) return;
        visited[p] = 1; queue[write++] = p;
      };
      for (let x = 0; x < ci.width; x++) { enqueue(x); enqueue((ci.height - 1) * ci.width + x); }
      for (let y = 0; y < ci.height; y++) { enqueue(y * ci.width); enqueue(y * ci.width + ci.width - 1); }
      while (read < write) {
        const p = queue[read++], x = p % ci.width, y = Math.floor(p / ci.width); crop[p * 4 + 3] = 0;
        if (x) enqueue(p - 1); if (x + 1 < ci.width) enqueue(p + 1); if (y) enqueue(p - ci.width); if (y + 1 < ci.height) enqueue(p + ci.width);
      }
      await sharp(crop, { raw: ci }).resize(128, 176, { fit: 'contain', background: '#00000000' }).webp({ quality: 94 }).toFile(`${root}/tiles/${key}.webp`);
      manifest[key] = { source: file, left, top, width: right - left, height: bottom - top };
    }
  }
}
await fs.writeFile(`${root}/tile-provenance.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Prepared ${Object.keys(manifest).length} ImageGen tile sprites.`);
