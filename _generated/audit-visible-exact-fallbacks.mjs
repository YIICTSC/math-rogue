import { createServer } from 'vite';
import fs from 'node:fs';

const FALLBACKS = [
  'どれでもない',
  '別の答え',
  'あてはまらない',
  'none of these',
  'another answer',
  'not applicable',
];

const normalize = (value) => value ?? null;
const visibleSignature = (p) => JSON.stringify({
  question: normalize(p.question),
  answer: normalize(p.answer),
  options: normalize(p.options),
  visual: normalize(p.visual),
  passage: normalize(p.passage),
  passageTitle: normalize(p.passageTitle),
  audioPrompt: normalize(p.audioPrompt),
  speechPrompt: normalize(p.speechPrompt),
});

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

try {
  const { SUBJECT_DATA } = await server.ssrLoadModule('/src/data/subjectData.ts');
  const screen = fs.readFileSync('src/components/ModeSelectionScreen.tsx', 'utf8');
  const nameMap = {};
  for (const m of screen.matchAll(/name:\s*'([^']+)'[^\n]*?mode:\s*'((?:MATH_G\d|KOKUGO_G\d)_[^']+)'/g)) {
    nameMap[m[2]] = m[1];
  }
  for (const cfgPath of ['/src/englishUnitConfig.ts', '/src/scienceUnitConfig.ts', '/src/socialUnitConfig.ts']) {
    const mod = await server.ssrLoadModule(cfgPath);
    const cfg = mod.ENGLISH_GRADE_UNITS || mod.SCIENCE_GRADE_UNITS || mod.SOCIAL_GRADE_UNITS;
    for (const units of Object.values(cfg)) {
      for (const unit of units) nameMap[unit.mode] = unit.name;
    }
  }

  const unitEntries = Object.entries(SUBJECT_DATA)
    .filter(([mode]) => /^(?:MATH_G\d|KOKUGO_G\d|ENGLISH_G\d|LIFE_\d|SCIENCE_\d|SOCIAL_\d)_U\d+$/.test(mode));

  const duplicateGroups = [];
  const globalBySignature = new Map();
  const fallbackLocations = [];

  for (const [mode, problems] of unitEntries) {
    const within = new Map();
    problems.forEach((problem, index) => {
      const sig = visibleSignature(problem);
      const loc = {
        mode,
        unit: nameMap[mode] || '',
        index,
        question: problem.question,
        answer: problem.answer,
        options: problem.options,
        visual: problem.visual ?? null,
        passage: problem.passage ?? null,
        passageTitle: problem.passageTitle ?? null,
        audioPrompt: problem.audioPrompt ?? null,
        speechPrompt: problem.speechPrompt ?? null,
      };
      if (!within.has(sig)) within.set(sig, []);
      within.get(sig).push(loc);
      if (!globalBySignature.has(sig)) globalBySignature.set(sig, []);
      globalBySignature.get(sig).push(loc);

      for (const [optionIndex, option] of (problem.options || []).entries()) {
        if (typeof option !== 'string') continue;
        const normalizedOption = option.trim().toLowerCase();
        const fallback = FALLBACKS.find((candidate) => candidate.toLowerCase() === normalizedOption);
        if (fallback) {
          fallbackLocations.push({
            fallback,
            mode,
            unit: nameMap[mode] || '',
            index,
            optionIndex,
            question: problem.question,
            answer: problem.answer,
            options: problem.options,
          });
        }
      }
    });
    for (const locations of within.values()) {
      if (locations.length > 1) duplicateGroups.push({ mode, unit: nameMap[mode] || '', locations });
    }
  }

  const crossUnitGroups = [...globalBySignature.values()]
    .filter((locations) => new Set(locations.map((x) => x.mode)).size > 1)
    .map((locations) => ({
      modes: [...new Set(locations.map((x) => x.mode))],
      locations,
    }));

  const fallbackCounts = Object.fromEntries(FALLBACKS.map((fallback) => [fallback, {
    occurrences: fallbackLocations.filter((x) => x.fallback === fallback).length,
    problems: new Set(fallbackLocations.filter((x) => x.fallback === fallback).map((x) => `${x.mode}:${x.index}`)).size,
    units: [...new Set(fallbackLocations.filter((x) => x.fallback === fallback).map((x) => x.mode))],
  }]));

  const report = {
    units: unitEntries.length,
    problems: unitEntries.reduce((sum, [, problems]) => sum + problems.length, 0),
    signatureFields: ['question', 'answer', 'options', 'visual', 'passage', 'passageTitle', 'audioPrompt', 'speechPrompt'],
    duplicateGroupCount: duplicateGroups.length,
    duplicateExtraProblemCount: duplicateGroups.reduce((sum, group) => sum + group.locations.length - 1, 0),
    duplicateGroups,
    crossUnitGroupCount: crossUnitGroups.length,
    crossUnitGroups,
    fallbackCounts,
    fallbackLocations,
  };

  fs.writeFileSync('_generated/visible-exact-fallback-audit.json', JSON.stringify(report, null, 2));
  console.log('UNITS', report.units, 'PROBLEMS', report.problems);
  console.log('EXACT_DUP_GROUPS', report.duplicateGroupCount, 'EXTRA_PROBLEMS', report.duplicateExtraProblemCount);
  console.log('CROSS_UNIT_EXACT_GROUPS', report.crossUnitGroupCount);
  for (const group of duplicateGroups) {
    console.log('DUP', group.mode, JSON.stringify(group.locations.map((x) => x.index)), JSON.stringify(group.locations[0].question), JSON.stringify(group.locations[0].answer));
  }
  for (const fallback of FALLBACKS) {
    const count = fallbackCounts[fallback];
    console.log('FALLBACK', JSON.stringify(fallback), 'occurrences', count.occurrences, 'problems', count.problems, 'units', count.units.length);
  }
} finally {
  await server.close();
}
