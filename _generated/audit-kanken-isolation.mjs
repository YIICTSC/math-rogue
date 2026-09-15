import { createServer } from 'vite';
const server = await createServer({ server:{middlewareMode:true}, appType:'custom', logLevel:'error' });
try {
  const mod = await server.ssrLoadModule('/src/data/kanjiData.ts');
  const { KANKEN_DATA } = mod;
  const owners = new Map();
  const failures = [];
  for (const [level, problems] of Object.entries(KANKEN_DATA)) {
    console.log(level, problems.length);
    for (const p of problems) {
      if (p.kankenLevel !== level) failures.push(`${level}: bad tag ${p.kankenLevel} ${p.question}`);
      if (!p.options?.includes(p.answer)) failures.push(`${level}: answer missing ${p.question}`);
      if (new Set(p.options || []).size !== (p.options || []).length) failures.push(`${level}: duplicate option ${p.question}`);
      const key = `${p.question}::${p.answer}`;
      const prev = owners.get(key);
      if (prev && prev !== level) failures.push(`cross-level duplicate: ${prev} / ${level} :: ${key}`);
      else owners.set(key, level);
    }
  }
  console.log('TOTAL', [...Object.values(KANKEN_DATA)].flat().length);
  console.log('FAILURES', failures.length);
  console.log(failures.slice(0,100).join('\n'));
  process.exitCode = failures.length ? 1 : 0;
} finally { await server.close(); }
