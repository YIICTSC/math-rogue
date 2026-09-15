import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });

try {
  const { KANKEN_DATA } = await server.ssrLoadModule('/src/data/kanjiData.ts');
  const master = await server.ssrLoadModule('/src/data/kankenLevelKanji.ts');
  const failures = [];
  const problemOwners = new Map();
  const targetOwners = new Map();
  const officialOwners = new Map();

  for (const level of master.KANKEN_OFFICIAL_LEVEL_ORDER) {
    const chars = [...master.KANKEN_OFFICIAL_LEVEL_KANJI[level]];
    const expected = master.KANKEN_OFFICIAL_LEVEL_KANJI_COUNTS[level];
    if (chars.length !== expected) failures.push(`${level}: official count ${chars.length} != ${expected}`);
    if (new Set(chars).size !== chars.length) failures.push(`${level}: duplicate official target kanji`);
    for (const char of chars) {
      const previous = officialOwners.get(char);
      if (previous && previous !== level) failures.push(`official kanji crosses levels: ${char} ${previous} / ${level}`);
      else officialOwners.set(char, level);
    }
  }
  if (officialOwners.size !== 2136) failures.push(`official union count ${officialOwners.size} != 2136`);

  for (const [level, problems] of Object.entries(KANKEN_DATA)) {
    if (!problems.length) failures.push(`${level}: empty level`);
    for (const problem of problems) {
      if (problem.kankenLevel !== level) failures.push(`${level}: bad level tag ${problem.question}`);
      if (!problem.targetKanji) failures.push(`${level}: targetKanji missing ${problem.question}`);
      if (problem.options?.[0] !== problem.answer) failures.push(`${level}: options[0] is not answer ${problem.question}`);
      if (!problem.options?.includes(problem.answer)) failures.push(`${level}: answer missing ${problem.question}`);
      if (new Set(problem.options || []).size !== (problem.options || []).length) failures.push(`${level}: duplicate option ${problem.question}`);

      for (const char of [...(problem.targetKanji || '')]) {
        const officialSet = master.KANKEN_OFFICIAL_LEVEL_KANJI_SETS[level];
        if (officialSet && !officialSet.has(char)) failures.push(`${level}: invalid official target ${char} ${problem.question}`);
        if (!officialSet && master.KANKEN_JOYO_KANJI_SET.has(char)) failures.push(`${level}: upper target is Joyo ${char} ${problem.question}`);
        const previous = targetOwners.get(char);
        if (previous && previous !== level) failures.push(`target kanji crosses levels: ${char} ${previous} / ${level}`);
        else targetOwners.set(char, level);
      }

      const key = `${problem.question}::${problem.answer}`;
      const previousOwner = problemOwners.get(key);
      if (previousOwner && previousOwner !== level) failures.push(`problem crosses levels: ${previousOwner} / ${level} :: ${key}`);
      else problemOwners.set(key, level);
    }
  }

  console.log('OFFICIAL_COUNTS', master.KANKEN_OFFICIAL_LEVEL_ORDER.map((level) => `${level}:${master.KANKEN_OFFICIAL_LEVEL_KANJI[level].length}`).join(' '));
  console.log('PROBLEM_COUNTS', Object.entries(KANKEN_DATA).map(([level, problems]) => `${level}:${problems.length}`).join(' '));
  console.log('TOTAL', Object.values(KANKEN_DATA).flat().length);
  console.log('FAILURES', failures.length);
  console.log(failures.slice(0, 100).join('\n'));
  process.exitCode = failures.length ? 1 : 0;
} finally {
  await server.close();
}
