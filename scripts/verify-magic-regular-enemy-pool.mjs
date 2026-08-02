import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const catalogs = fs.readFileSync(path.join(root, 'src/data/enemyCatalogs.ts'), 'utf8');
const generator = fs.readFileSync(path.join(root, 'src/services/geminiService.ts'), 'utf8');

const failures = [];

if (!catalogs.includes('MAGIC_TRUE_BOSS_NAMES')) {
  failures.push('Magic true-boss exclusion set is missing.');
}
if (!catalogs.includes('MAGIC_HUMANOID_ENEMY_VARIANTS[20].name')) {
  failures.push('Grand Witch Principal is not marked as true-boss-only.');
}
if (!catalogs.includes('MAGIC_HUMANOID_ENEMY_VARIANTS[21].name')) {
  failures.push('Queen of Star Calamity is not marked as true-boss-only.');
}
if (!catalogs.includes('enemy.tier === tier && !isTrueBossOnlyEnemy(theme, enemy.name)')) {
  failures.push('Act-based regular enemy pool does not exclude true bosses.');
}
if (!generator.includes('getRegularEnemyNamesByTheme(visualTheme)')) {
  failures.push('Regular enemy fallback can still use the full boss-inclusive catalog.');
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Magic regular enemy pools exclude both Act 4 true-boss variants.');
