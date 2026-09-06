import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const spritesRoot = path.join(projectRoot, 'public', 'sprites');
const directories = [
  'high-school/vacation-characters',
  'high-school/vacation-characters-idle-special-sheets',
  'high-school/vacation-characters-attack-sheets',
  'high-school/vacation-characters-skill-sheets',
  'high-school/vacation-characters-hit-sheets',
  'high-school/vacation-characters-low-hp-sheets',
  'magic/vacation-characters',
  'magic/vacation-characters-idle-special-sheets',
  'magic/vacation-characters-attack-sheets',
  'magic/vacation-characters-skill-sheets',
  'magic/vacation-characters-hit-sheets',
  'magic/vacation-characters-low-hp-sheets',
  'magic/vacation-male-characters',
  'magic/vacation-male-characters-idle-special-sheets',
  'magic/vacation-male-characters-attack-sheets',
  'magic/vacation-male-characters-skill-sheets',
  'magic/vacation-male-characters-hit-sheets',
  'magic/vacation-male-characters-low-hp-sheets',
];

let converted = 0;

for (const relativeDirectory of directories) {
  const directory = path.join(spritesRoot, relativeDirectory);
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.png')) continue;
    const inputPath = path.join(directory, entry.name);
    const outputPath = path.join(directory, `${path.basename(entry.name, path.extname(entry.name))}.webp`);
    await sharp(inputPath)
      .webp({ quality: 95, alphaQuality: 100, effort: 6 })
      .toFile(outputPath);
    converted += 1;
  }
}

console.log(`converted=${converted}`);
