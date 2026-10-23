import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const root = process.cwd();
const copyOnly = process.argv.includes('--copy-only');
const server = await createServer({ root, cacheDir: 'node_modules/.vite-summer-ending-test', server: { middlewareMode: true }, logLevel: 'error' });
try {
  const { HIGH_SCHOOL_VACATION_TRUE_ENDINGS } = await server.ssrLoadModule('/src/data/vacationEndlessEndings.ts');
  const { MAGIC_VACATION_TRUE_ENDINGS } = await server.ssrLoadModule('/src/data/magicVacationTrueEndings.ts');
  const { getEndlessEndingSequence } = await server.ssrLoadModule('/src/data/endlessEndingSequences.ts');
  const { ENDLESS_REVISION_COPY } = await server.ssrLoadModule('/src/data/endlessEndingCopyRevision.ts');
  const { MAGIC_FRIENDSHIP_ROUTES } = await server.ssrLoadModule('/src/data/magicFriendshipRoutes.ts');
  const { MAGIC_SUMMER_FRIENDSHIP_ENDINGS } = await server.ssrLoadModule('/src/data/magicSummerFriendshipEndings.ts');
  const { MAGIC_SUMMER_EPILOGUES, getMagicSummerEpilogue } = await server.ssrLoadModule('/src/data/magicSummerEpilogues.ts');
  const { getMagicEndingPages, getMagicEndingGalleryEntries, buildMagicSummerEpilogueGalleryEntry } = await server.ssrLoadModule('/src/services/magicEndingService.ts');
  const { trans, transEventText } = await server.ssrLoadModule('/src/utils/textUtils.ts');
  assert.equal(Object.keys(HIGH_SCHOOL_VACATION_TRUE_ENDINGS).length, 9);
  assert.equal(Object.keys(MAGIC_VACATION_TRUE_ENDINGS).length, 17);
  assert.equal(Object.keys(MAGIC_SUMMER_EPILOGUES).length, 17);
  assert.equal(Object.keys(MAGIC_SUMMER_FRIENDSHIP_ENDINGS).length, 34);
  const japanese = /[ぁ-んァ-ヶ一-龠]/;
  const kanji = /[一-龠]/;
  const texts = new Set();
  let count = 0;
  for (const [theme, stories] of [['high-school', HIGH_SCHOOL_VACATION_TRUE_ENDINGS], ['magic', MAGIC_VACATION_TRUE_ENDINGS]]) {
    for (const [id, story] of Object.entries(stories)) {
      assert.equal(story.length, 3, `${theme}/${id}`);
      const entry = ENDLESS_REVISION_COPY[theme][id];
      assert.ok(entry, `canonical identity ${id}`);
      for (const page of story) {
        for (const field of ['title', 'text', 'dialogue']) {
          assert.equal(page[field].length, 3);
          assert.ok(page[field].every(value => value.trim().length > 0));
          assert.ok(!japanese.test(page[field][2]), `English ${id}/${field}`);
          assert.ok(!kanji.test(page[field][1]), `hiragana ${id}/${field}`);
        }
        assert.ok(!texts.has(page.text[0]), `repeated scene ${id}`);
        texts.add(page.text[0]);
      }
      const args = ['TRUE', entry.baseCharacterId, id, theme, theme === 'magic' ? id : undefined];
      const summer = getEndlessEndingSequence(...args, 'VACATION');
      const normal = getEndlessEndingSequence(...args, 'STANDARD');
      assert.match(summer.id, /^vacation-true-/);
      assert.equal(normal.pages[0].text, entry.true[0].text, `normal ending preserved ${id}`);
      assert.notEqual(summer.pages[0].text, normal.pages[0].text);
      const openingSummer = getEndlessEndingSequence('OPENING', ...args.slice(1), 'VACATION');
      const openingNormal = getEndlessEndingSequence('OPENING', ...args.slice(1), 'STANDARD');
      assert.deepEqual(openingSummer, openingNormal, `opening unchanged ${id}`);
      for (const page of summer.pages) {
        assert.match(page.imagePath, /summer-expansion/);
        if (!copyOnly) assert.ok(fs.existsSync(path.join(root, 'public', page.imagePath)), page.imagePath);
        count++;
      }
    }
  }
  const elementary = getEndlessEndingSequence('TRUE', 'WARRIOR', 'WARRIOR', 'elementary', undefined, 'VACATION');
  assert.ok(!elementary.id.startsWith('vacation-'), 'no unsupported elementary vacation branch');
  const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
  assert.match(app, /const isFinalChapter = !prev\.endlessTrueMode && endlessChapter === 50/);
  assert.match(app, /const nextChapter = 51/);
  assert.match(app, /kind="TRUE"\s+theme=\{activeRunVisualTheme\}\s+appearanceMode=\{gameState\.player\.appearanceMode/);
  const galleryIds = new Set();
  for (const route of MAGIC_FRIENDSHIP_ROUTES) {
    const player = (affection, stages, appearanceMode = 'VACATION') => ({ appearanceMode, magicRomance: {
      affection: { [route.id]: affection }, stages: { [route.id]: stages }, selectedCounts: {}, completedEventIds: [],
    } });
    assert.equal(getMagicEndingPages(player(99, 2), route.heroId).length, 0, `bond threshold ${route.id}`);
    assert.equal(getMagicEndingPages(player(100, 1), route.heroId).length, 0, `stage threshold ${route.id}`);
    const [summer] = getMagicEndingPages(player(100, 2), route.heroId);
    const [normal] = getMagicEndingPages(player(100, 2, 'STANDARD'), route.heroId);
    const copy = MAGIC_SUMMER_FRIENDSHIP_ENDINGS[route.id];
    assert.equal(summer.title, copy.title[0]);
    assert.equal(summer.description, copy.description[0]);
    assert.deepEqual(summer.lines, copy.lines.map(line => line[0]));
    assert.equal(normal.title, route.endingTitle, `normal friendship preserved ${route.id}`);
    assert.notEqual(summer.imagePath, normal.imagePath);
    assert.equal(summer.voiceLines.length, 2, 'retain future voice IDs in saved gallery entries');
    assert.deepEqual(summer.voiceLines.map(line => line.heroId), [route.heroId, route.friendHeroId]);
    assert.ok(summer.voiceLines.every(line => line.lineId.startsWith('vacation-friendship-')));
    for (const row of [copy.title, copy.description, ...copy.lines]) {
      assert.ok(!japanese.test(row[2]), `English friendship ${route.id}`);
      assert.ok(!kanji.test(row[1]), `hiragana friendship ${route.id}`);
      assert.equal(transEventText(row[0], 'ENGLISH'), row[2], `event English ${route.id}`);
      assert.equal(trans(row[0], 'ENGLISH'), row[2], `gallery English ${route.id}`);
      assert.equal(transEventText(row[0], 'HIRAGANA'), row[1], `hiragana translation ${route.id}`);
    }
    const summerEntry = getMagicEndingGalleryEntries(player(100, 2), route.heroId, 1)[0];
    const normalEntry = getMagicEndingGalleryEntries(player(100, 2, 'STANDARD'), route.heroId, 1)[0];
    assert.notEqual(summerEntry.id, normalEntry.id, 'gallery identities must not collide');
    assert.equal(getMagicEndingGalleryEntries(player(100, 2), route.heroId, 2)[0].id, summerEntry.id, 'stable on resave');
    assert.ok(!galleryIds.has(summerEntry.id)); galleryIds.add(summerEntry.id);
    if (!copyOnly) assert.ok(fs.existsSync(path.join(root, 'public', summer.imagePath)), summer.imagePath);
  }
  const epilogueTexts = new Set();
  for (const [heroId, story] of Object.entries(MAGIC_SUMMER_EPILOGUES)) {
    const pages = getMagicSummerEpilogue(heroId);
    assert.equal(pages.length, 3);
    const gallery = buildMagicSummerEpilogueGalleryEntry(heroId, 42);
    assert.equal(gallery.kind, 'epilogue'); assert.equal(gallery.unlockedAt, 42);
    assert.deepEqual(gallery.storyPages, pages);
    for (const beat of story) {
      assert.ok(!epilogueTexts.has(beat.text[0])); epilogueTexts.add(beat.text[0]);
      assert.ok(!texts.has(beat.text[0]), `epilogue cannot reuse true ending ${heroId}`);
      for (const row of [beat.title, beat.text, beat.dialogue]) {
        assert.ok(row.every(value => value.trim()));
        assert.ok(!japanese.test(row[2])); assert.ok(!kanji.test(row[1]));
        assert.equal(trans(row[0], 'ENGLISH'), row[2]);
        assert.equal(trans(row[0], 'HIRAGANA'), row[1]);
      }
    }
    for (const page of pages) if (!copyOnly) assert.ok(fs.existsSync(path.join(root, 'public', page.imagePath)), page.imagePath);
  }
  assert.equal(epilogueTexts.size, 51);
  assert.deepEqual(getMagicSummerEpilogue('invalid-legacy-id'), getMagicSummerEpilogue('AKARI'));
  assert.deepEqual(getMagicSummerEpilogue(' sakuya '), getMagicSummerEpilogue('SAKUYA'));
  assert.equal(buildMagicSummerEpilogueGalleryEntry('unknown').heroId, 'AKARI');
  const cache = new Map();
  const originalStorage = globalThis.localStorage;
  globalThis.localStorage = { getItem: key => cache.get(key) ?? null, setItem: (key, value) => cache.set(key, value) };
  try {
    const { storageService } = await server.ssrLoadModule('/src/services/storageService.ts');
    storageService.saveMagicEndingGalleryEntries([buildMagicSummerEpilogueGalleryEntry('AKARI', 42)]);
    storageService.saveMagicEndingGalleryEntries([buildMagicSummerEpilogueGalleryEntry('AKARI', 99)]);
    assert.equal(storageService.getMagicEndingGallery().length, 1);
    assert.equal(storageService.getMagicEndingGallery()[0].unlockedAt, 42, 'retain first unlock time');
    storageService.saveMagicEndingGalleryEntries([buildMagicSummerEpilogueGalleryEntry('SAKUYA', 101)]);
    assert.equal(storageService.getMagicEndingGallery().length, 2);
  } finally { globalThis.localStorage = originalStorage; }
  console.log('PASS: all 34 summer friendship branches/conditions/translations/IDs, all 17 three-page epilogues, deduplicating gallery storage.');
  console.log(`PASS: 26 heroes, ${count} unique localized summer true-ending pages, standard/opening/elementary preservation, Chapter 50/51 routing${copyOnly ? ' (copy-only; assets not checked)' : ', all image files'}.`);
} finally {
  server.httpServer?.closeAllConnections();
  await server.close();
}
