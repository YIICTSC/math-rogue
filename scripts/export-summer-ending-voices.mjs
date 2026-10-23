import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';

const root = process.cwd();
const server = await createServer({ cacheDir: 'node_modules/.vite-summer-voice-plan', server: { middlewareMode: true }, logLevel: 'error' });
try {
  const { HIGH_SCHOOL_VACATION_TRUE_ENDINGS } = await server.ssrLoadModule('/src/data/vacationEndlessEndings.ts');
  const { MAGIC_VACATION_TRUE_ENDINGS } = await server.ssrLoadModule('/src/data/magicVacationTrueEndings.ts');
  const { MAGIC_SUMMER_EPILOGUES } = await server.ssrLoadModule('/src/data/magicSummerEpilogues.ts');
  const { MAGIC_SUMMER_FRIENDSHIP_ENDINGS } = await server.ssrLoadModule('/src/data/magicSummerFriendshipEndings.ts');
  const { MAGIC_FRIENDSHIP_ROUTES } = await server.ssrLoadModule('/src/data/magicFriendshipRoutes.ts');
  const { summerTrueVoiceId, summerEpilogueVoiceId, summerFriendshipVoiceId } = await server.ssrLoadModule('/src/data/summerEndingVoices.ts');
  const jobs = [];
  const add = async (theme, heroId, lineId, text, context) => {
    const unquote = value => value.replace(/^[^「]+「(.+)」$/, '$1');
    const voiceRoot = theme === 'high-school' ? 'sfx/high-school-voices' : 'sfx/magic-event-voices';
    const reference = `public/${voiceRoot}/${heroId}/endless-true-1.ogg`;
    const referenceBytes = await fs.readFile(path.join(root, reference));
    jobs.push({ theme, heroId, lineId, context,
      text: unquote(text[0]), reading: unquote(text[1]), english: text[2],
      output: `public/${voiceRoot}/${heroId}/${lineId}.ogg`, reference,
      referenceSha256: createHash('sha256').update(referenceBytes).digest('hex'),
    });
  };
  for (const [theme, stories] of [['high-school', HIGH_SCHOOL_VACATION_TRUE_ENDINGS], ['magic', MAGIC_VACATION_TRUE_ENDINGS]]) {
    for (const [id, story] of Object.entries(stories)) {
      for (let i = 0; i < 3; i++) await add(theme, id, summerTrueVoiceId(i), story[i].dialogue, 'summer-true');
    }
  }
  for (const route of MAGIC_FRIENDSHIP_ROUTES) {
    const story = MAGIC_SUMMER_FRIENDSHIP_ENDINGS[route.id];
    for (const [i, heroId] of [route.heroId, route.friendHeroId].entries()) {
      await add('magic', heroId, summerFriendshipVoiceId(route.id, i), story.lines[i], route.id);
    }
  }
  for (const [id, story] of Object.entries(MAGIC_SUMMER_EPILOGUES)) {
    for (let i = 0; i < 3; i++) await add('magic', id, summerEpilogueVoiceId(i), story[i].dialogue, 'summer-epilogue');
  }
  if (jobs.length !== 197 || new Set(jobs.map(j => j.output)).size !== 197) throw new Error('Incomplete/duplicate voice jobs');
  const target = path.join(root, 'assets/ending-expansion/voice-plan.json');
  await fs.writeFile(target, JSON.stringify({ status: 'deferred-by-user', requirements: 'Latest official Irodori-TTS, model and codec on CPU; recheck released revision/model at generation time per AGENTS.md. Enable SUMMER_ENDING_VOICES_READY only after all 197 files pass QA.', jobs }, null, 2) + '\n');
  console.log(`Exported ${jobs.length} voice jobs to ${target}. No audio generated.`);
} finally { server.httpServer?.closeAllConnections(); await server.close(); }
