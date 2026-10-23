import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = await createServer({ root, cacheDir: 'node_modules/.vite-summer-ending-plan', server: { middlewareMode: true } });
try {
  const hs = await server.ssrLoadModule('/src/data/vacationEndlessEndings.ts');
  const mg = await server.ssrLoadModule('/src/data/magicVacationTrueEndings.ts');
  const { MAGIC_HEROES, MAGIC_MALE_PROTAGONISTS } = await server.ssrLoadModule('/src/data/magicHeroes.ts');
  const hsIds = ['WARRIOR', 'CARETAKER', 'ASSASSIN', 'MAGE', 'DODGEBALL', 'BARD', 'LIBRARIAN', 'CHEF', 'GARDENER'];
  const plan = [];
  for (const [theme, stories] of [['high-school', hs.HIGH_SCHOOL_VACATION_TRUE_ENDINGS], ['magic', mg.MAGIC_VACATION_TRUE_ENDINGS]]) {
    for (const [heroId, story] of Object.entries(stories)) {
      const female = MAGIC_HEROES.find(h => h.id === heroId);
      const reference = theme === 'high-school'
        ? `public/sprites/high-school/vacation-characters/${hsIds.indexOf(heroId)}.webp`
        : female
          ? `public/sprites/magic/vacation-characters/heroine-${String(female.index).padStart(2, '0')}-before.webp`
          : `public/sprites/magic/vacation-male-characters/${heroId.toLowerCase()}-before.webp`;
      if (theme === 'magic' && !female && !MAGIC_MALE_PROTAGONISTS.some(h => h.id === heroId)) throw new Error(heroId);
      await fs.access(path.join(root, reference));
      const prompt = `Use case: illustration-story. Asset type: three-scene ending storyboard atlas for the Japanese RPG Learning Rogue; ${theme} protagonist ${heroId}, summer true ending after Chapter 50. Image 1 is an identity and summer-costume reference ONLY: preserve the SAME face, gender, hair, proportions, accessories and costume in every scene. Never include its checkerboard background. One tall atlas of THREE EXACTLY EQUAL SQUARE FULL-BLEED SCENES stacked top to bottom, target 1024x3072. No frames, no gutters, no overlapping subjects across scene boundaries. Each square is an independent emotionally acted CG, not a repeated pose. Top scene: ${story[0].text[2]} Middle scene: ${story[1].text[2]} Bottom scene: ${story[2].text[2]} All three scenes are on or near a picturesque summer seashore. Polished hand-painted anime RPG CG matching the character reference, detailed environments, readable storytelling, wholesome nonsexual vacation adventure. NO text, captions, letters, symbols resembling writing, numbers, UI or watermarks. Any notebooks have blank pages. Avoid added identifiable protagonists; background companions may be soft silhouettes only.`;
      plan.push({ theme, heroId, kind: 'true', reference, prompt, tool: 'image_gen.imagegen' });
    }
  }
  if (process.argv.includes('--friendship')) {
    const { MAGIC_FRIENDSHIP_ROUTES } = await server.ssrLoadModule('/src/data/magicFriendshipRoutes.ts');
    const { getMagicSummerFriendshipEnding } = await server.ssrLoadModule('/src/data/magicSummerFriendshipEndings.ts');
    const referenceFor = id => {
      const female = MAGIC_HEROES.find(h => h.id === id);
      return female ? `public/sprites/magic/vacation-characters/heroine-${String(female.index).padStart(2, '0')}-before.webp`
        : `public/sprites/magic/vacation-male-characters/${id.toLowerCase()}-before.webp`;
    };
    plan.length = 0;
    for (const route of MAGIC_FRIENDSHIP_ROUTES) {
      const copy = getMagicSummerFriendshipEnding(route.id);
      const references = [referenceFor(route.heroId), referenceFor(route.friendHeroId)];
      const prompt = `Use case: illustration-story. Asset type: dedicated summer friendship ending CG for Learning Rogue. Landscape 1536x1024. Image 1: identity/costume reference for ${route.heroId}, the viewpoint protagonist. Image 2: identity/costume reference for friend ${route.friendHeroId}. Preserve BOTH original character identities, faces, hair, gender, accessories and vacation outfits accurately. Story moment: ${copy.description[2]} Emotional direction: ${copy.lines.map(line => line[2]).join(' ')} Show concrete action and warm platonic friendship, no romance, no flirting. Polished painted anime RPG CG, rich picturesque summer seashore setting, beautiful natural lighting, distinct composition appropriate to this specific moment. Both people must be visible, with natural hands and recognizable faces; not a collage of the references. Only these two identifiable characters. Text is handled in the game UI: NO writing, speech balloons, captions, letters, numbers, UI, watermarks, frames or checkerboard. Any notebook pages are blank.`;
      plan.push({ theme: 'magic', heroId: route.id, kind: 'friendship', references, prompt, tool: 'image_gen.imagegen' });
    }
  }
  if (process.argv.includes('--epilogue')) {
    const { MAGIC_SUMMER_EPILOGUES } = await server.ssrLoadModule('/src/data/magicSummerEpilogues.ts');
    plan.length = 0;
    for (const [heroId, story] of Object.entries(MAGIC_SUMMER_EPILOGUES)) {
      const female = MAGIC_HEROES.find(h => h.id === heroId);
      const reference = female ? `public/sprites/magic/vacation-characters/heroine-${String(female.index).padStart(2, '0')}-before.webp`
        : `public/sprites/magic/vacation-male-characters/${heroId.toLowerCase()}-before.webp`;
      const prompt = `Use case: illustration-story. Asset type: protagonist-specific three-scene summer epilogue atlas for Learning Rogue; protagonist ${heroId}. This is ordinary vacation aftermath after Act 4, NOT the later endless battle. Image 1: identity and vacation outfit reference ONLY. Preserve the SAME character, gender, face, hair, costume and accessories in ALL three scenes. Produce THREE EXACTLY EQUAL SQUARE SCENES stacked top-to-bottom, full bleed, NO gaps, borders, lettering or scene overlap; target 1024x3072. Top scene: ${story[0].text[2]} Middle scene: ${story[1].text[2]} Bottom scene: ${story[2].text[2]} Every scene must show the protagonist acting in a distinct scene, not just posed. When companions are implied use soft background silhouettes only, not invented detailed cast. Polished anime RPG painted CG; beautiful detailed summer shore, beach house or pier; warm reflective wholesome nonsexual mood. No battle or giant magic explosion. NO writing, numbers, UI, labels, logos or watermarks. All notebook pages, maps and postcards are blank or abstract colors, since the game displays text separately. Do not include the reference checkerboard.`;
      plan.push({ theme: 'magic', heroId, kind: 'epilogue', reference, prompt, tool: 'image_gen.imagegen' });
    }
  }
  if (process.argv.includes('--covered')) {
    for (const job of plan) {
      if (job.kind === 'true') throw new Error('The original true-ending art is already complete.');
      const originalPrompt = job.prompt;
      const convert = reference => reference.replace('/vacation-characters/', '/characters/').replace('/vacation-male-characters/', '/male-characters/');
      if (job.reference) job.reference = convert(job.reference);
      if (job.references) job.references = job.references.map(convert);
      // A genuinely different, fully clothed scene treatment following the output safety rejection.
      // References supply faces only. Never request recreation of the swimsuit costume.
      const sceneStart = originalPrompt.indexOf(job.kind === 'friendship' ? 'Story moment:' : 'Top scene:');
      const story = originalPrompt.slice(sceneStart).split(job.kind === 'friendship' ? 'All three scenes' : 'Every scene must')[0];
      job.prompt = `Use case: illustration-story. Asset type: ${job.kind === 'friendship' ? 'one landscape friendship CG, 1536x1024' : 'three square story CGs stacked vertically in one 1024x3072 atlas, exactly equal full-bleed scenes, no gutters'}. Original wholesome school-adventure RPG Learning Rogue, summer ${job.kind} for ${job.heroId}. The supplied school-uniform reference image(s) are FACE, HAIR, GENDER and PERSONALITY references only. Dress every character in fully covered loose summer casual clothing: opaque short-sleeved collared shirt, long loose trousers or knee-length skirt, flat shoes; use the character’s signature color as trim. All torsos, shoulders, waist, hips and upper legs covered. No swimsuits, no beachwear, no revealing or tight clothing. Story action: ${story} Emphasize friendly expressive faces and concrete everyday activity in a tasteful summer seaside town, beach-house terrace, park, pier or shaded promenade. Use medium or wide narrative shots, never body-focused framing. Platonic wholesome all-ages mood, respectful character acting, detailed painted anime RPG environments. Preserve identifiable faces and hair, never copy checkerboard. NO writing, speech balloons, captions, text, UI, labels, numbers, logos or watermarks. Blank notebook pages only.`;
    }
  }
  if (process.argv.includes('--output')) {
    const destination = path.join(root, 'build/summer-ending-art-plan.json');
    await fs.writeFile(destination, JSON.stringify(plan, null, 2));
    console.log(`${plan.length} generation jobs exported to ${destination}`);
  } else {
    const offset = Number(process.argv.find(value => /^\d+$/.test(value)) || 0);
    console.log(JSON.stringify(plan.slice(offset, offset + 4)));
  }
} finally {
  server.httpServer?.closeAllConnections();
  await server.close();
}
