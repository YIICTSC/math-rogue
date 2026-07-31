import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const appSource = await readFile(path.join(root, 'src', 'App.tsx'), 'utf8');
const audioServiceSource = await readFile(path.join(root, 'src', 'services', 'audioService.ts'), 'utf8');

const requiredSourceFragments = [
  'const NON_FINISH_BATTLE_VOICE_RATE = 0.3;',
  'playMagicRuleVoice();',
  'didPlayCardVoice = true;',
  'didPlayCardVoice = playDelayedBattleVoice(playHighSchoolCardVoice);',
  'didPlayCardVoice = playDelayedBattleVoice(playMagicAttackVoice);',
  "audioService.playHighSchoolVoice(stateRef.current.player.id, 'finish');",
  "audioService.playHighSchoolVoice(stateRef.current.player.id, 'defeat');",
  "stateRef.current.visualTheme === 'magic'",
  '&& !finisherVoiceAlreadyPlayed',
];

for (const fragment of requiredSourceFragments) {
  if (!appSource.includes(fragment)) {
    throw new Error(`Battle voice frequency/finisher branch is missing: ${fragment}`);
  }
}

if (audioServiceSource.includes('magic-transform-voice') || audioServiceSource.includes('attachHtmlSfxEffect')) {
  throw new Error('Transformed Magic voices must use the original voice without delay/filter effects.');
}

if (!audioServiceSource.includes('audio.volume = htmlVolume;')) {
  throw new Error('Magic voices are not routed through the normal voice-volume path.');
}

const verifyVoiceFamily = async (family, requiredNames) => {
  const familyPath = path.join(root, 'public', 'sfx', family);
  const entries = await readdir(familyPath, { withFileTypes: true });
  const heroDirectories = entries.filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
  if (heroDirectories.length === 0) throw new Error(`No voice heroes found in ${family}`);

  for (const heroId of heroDirectories) {
    for (const voiceName of requiredNames) {
      await access(path.join(familyPath, heroId, `${voiceName}.ogg`));
    }
  }
  return heroDirectories.length;
};

const highSchoolCount = await verifyVoiceFamily(
  'high-school-voices',
  [
    ...Array.from({ length: 5 }, (_, index) => `attack-${index + 1}`),
    ...Array.from({ length: 5 }, (_, index) => `finish-${index + 1}`),
  ],
);
const magicCount = await verifyVoiceFamily(
  'magic-voices',
  [
    ...Array.from({ length: 3 }, (_, index) => `attack-${index + 1}`),
    ...Array.from({ length: 3 }, (_, index) => `spell-${index + 1}`),
  ],
);

process.stdout.write(
  `Required battle voice verification passed (${highSchoolCount} high-school heroes, ${magicCount} magic heroes).\n`,
);
