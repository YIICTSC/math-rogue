import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();

const cardSheets = [
  { file: 'male-card-sheet-01.png', startIndex: 27, count: 9 },
  { file: 'male-card-sheet-02.png', startIndex: 36, count: 9 },
  { file: 'male-card-sheet-03.png', startIndex: 45, count: 6 },
];

const friendshipRoutes = [
  ['REN', 'YAMATO'],
  ['REN', 'MINATO'],
  ['SOMA', 'RIKU'],
  ['SOMA', 'ELLIOT'],
  ['MINATO', 'REN'],
  ['MINATO', 'ELLIOT'],
  ['RIKU', 'SOMA'],
  ['RIKU', 'LEON'],
  ['YAMATO', 'REN'],
  ['YAMATO', 'SAKUYA'],
  ['LEON', 'RIKU'],
  ['LEON', 'ELLIOT'],
  ['ELLIOT', 'SOMA'],
  ['ELLIOT', 'LEON'],
  ['SAKUYA', 'YAMATO'],
  ['SAKUYA', 'REN'],
];

const cropGrid = async (input, count, writeCell) => {
  const metadata = await sharp(input).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (!width || !height) throw new Error(`Invalid sheet: ${input}`);

  for (let index = 0; index < count; index += 1) {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const left = Math.round((column * width) / 3);
    const top = Math.round((row * height) / 3);
    const right = Math.round(((column + 1) * width) / 3);
    const bottom = Math.round(((row + 1) * height) / 3);
    await writeCell(
      sharp(input).extract({
        left,
        top,
        width: right - left,
        height: bottom - top,
      }).resize(512, 512, { fit: 'cover' }),
      index,
    );
  }
};

for (const sheet of cardSheets) {
  const input = path.join(root, 'public', 'sprites', 'magic', 'cards', 'male-sheets', sheet.file);
  await cropGrid(input, sheet.count, async (image, index) => {
    const output = path.join(root, 'public', 'sprites', 'magic', 'cards', `${sheet.startIndex + index}.webp`);
    await image.webp({ quality: 88 }).toFile(output);
  });
}

for (let sheetIndex = 0; sheetIndex < 2; sheetIndex += 1) {
  const input = path.join(
    root,
    'public',
    'sprites',
    'magic',
    'events',
    'friendship-male-sheets',
    `male-friendship-sheet-0${sheetIndex + 1}.png`,
  );
  const routeOffset = sheetIndex * 9;
  const count = Math.min(9, friendshipRoutes.length - routeOffset);
  await cropGrid(input, count, async (image, index) => {
    const [heroId, friendId] = friendshipRoutes[routeOffset + index];
    const directory = path.join(root, 'public', 'sprites', 'magic', 'events', 'friendship', heroId, friendId);
    await fs.mkdir(directory, { recursive: true });
    await image.webp({ quality: 88 }).toFile(path.join(directory, 'event.webp'));
  });
}

console.log('Processed 24 male magic cards and 16 male friendship event images.');
