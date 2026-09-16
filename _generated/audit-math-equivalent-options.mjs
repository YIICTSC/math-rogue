import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
});

const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};

const parseRational = (text) => {
  const value = String(text).trim().replace(/だけ$/, '');
  const ratio = value.match(/^(-?\d+)\s*:\s*(-?\d+)$/);
  if (ratio) {
    const a = Number(ratio[1]);
    const b = Number(ratio[2]);
    if (b === 0) return null;
    const g = gcd(a, b);
    return { kind: 'ratio', key: `${a / g}:${b / g}` };
  }

  if (!/^-?[\d.]+(?:\s*[+\-×÷/]\s*-?[\d.]+)+$/.test(value)) return null;
  const tokens = value.match(/-?[\d.]+|[+\-×÷/]/g);
  if (!tokens?.length) return null;
  let result = Number(tokens[0]);
  if (!Number.isFinite(result)) return null;
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i];
    const rhs = Number(tokens[i + 1]);
    if (!Number.isFinite(rhs)) return null;
    if (op === '+') result += rhs;
    else if (op === '-') result -= rhs;
    else if (op === '×') result *= rhs;
    else if (op === '÷' || op === '/') {
      if (rhs === 0) return null;
      result /= rhs;
    }
  }
  return { kind: 'number', value: result };
};

const equivalent = (left, right) => {
  const a = parseRational(left);
  const b = parseRational(right);
  if (!a || !b || a.kind !== b.kind) return false;
  if (a.kind === 'ratio') return a.key === b.key;
  return Math.abs(a.value - b.value) < 1e-10;
};

try {
  const { SUBJECT_DATA } = await server.ssrLoadModule('/src/data/subjectData.ts');
  const failures = [];
  for (const [mode, problems] of Object.entries(SUBJECT_DATA)) {
    if (!/^MATH_G\d_U\d+$/.test(mode)) continue;
    problems.forEach((problem, index) => {
      const answer = problem.answer;
      const equivalents = (problem.options || []).filter((option) => option !== answer && equivalent(answer, option));
      if (equivalents.length) {
        failures.push({ mode, index, question: problem.question, answer, equivalents, options: problem.options });
      }
    });
  }
  console.log('MATH_EQUIVALENT_OPTION_FAILURES', failures.length);
  console.log(JSON.stringify(failures.slice(0, 100), null, 2));
  if (failures.length) process.exitCode = 1;
} finally {
  await server.close();
}
