// Metadata only: never duplicate or preload the large sprite/voice assets.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
function scan(dir) {
  return fs.readdirSync(path.join(root, 'public', dir), { withFileTypes: true })
    .sort((a,b) => a.name.localeCompare(b.name, 'en'))
    .flatMap(entry => entry.isDirectory() ? scan(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`]);
}
const images = scan('sprites').filter(p => /\.(webp|png)$/.test(p) && /(?:wandering-student\/|dungeons[12]\/|go-home-dash\/(?:heroes|slides)\/|after-school-poker\/portraits\/|kocho\/(?:original|rebel|akari|super-)|kocho-hero-actions-|star-tide\/(?:atlas|hero-)|paper-plane\/pilots|gakuro-vr\/|gakurogear\/|school-trpg\/|lantern-war\/|stone-glow\/)/.test(p));
const audio = scan('sfx').filter(p => /\.(ogg|mp3|wav)$/.test(p) && /\/((?:dungeons[12]-|dungeons-chronicles|dungeons1-techniques|kocho-|card-club-|high-school-|magic-|paper-plane-|poker-rivals|go-home-dash|gakuro-vr|lantern-war|golf))/.test(p));
const output = `${JSON.stringify({images, audio}, null, 2)}\n`;
const file = path.join(root, 'src/generated/miniGameMediaIndex.json');
if (process.argv.includes('--check')) {
  if (fs.readFileSync(file, 'utf8') !== output) throw new Error('Run node scripts/generate-minigame-media-index.mjs');
} else fs.writeFileSync(file, output);
console.log(`Mini-game media index: ${images.length} images, ${audio.length} voice files`);
