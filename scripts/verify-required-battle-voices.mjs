import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const appSource = await readFile(path.join(root, 'src', 'App.tsx'), 'utf8');

const requiredSourceFragments = [
  "const isOffensiveCard = card.type === CardType.ATTACK",
  "if (isOffensiveCard) playMagicRuleVoice();",
  "if (isOffensiveCard) playHighSchoolCardVoice();",
  "if (isOffensiveCard) playMagicAttackVoice();",
];

for (const fragment of requiredSourceFragments) {
  if (!appSource.includes(fragment)) {
    throw new Error(`Mandatory battle voice branch is missing: ${fragment}`);
  }
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
