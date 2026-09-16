import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });

const normalize = (value) => String(value ?? '').replace(/\s+/g, '').toLowerCase();

const makeContext = (texts) => {
  const gradient = { addColorStop() {} };
  const state = {
    canvas: { width: 260, height: 180 },
    fillText(value) { texts.push(String(value)); },
    measureText(value) { return { width: String(value).length * 8 }; },
    createLinearGradient() { return gradient; },
    createRadialGradient() { return gradient; },
    createPattern() { return {}; },
    getImageData() { return { data: new Uint8ClampedArray(4) }; },
  };
  return new Proxy(state, {
    get(target, key) {
      if (key in target) return target[key];
      return () => {};
    },
    set(target, key, value) {
      target[key] = value;
      return true;
    },
  });
};

try {
  const { SUBJECT_DATA } = await server.ssrLoadModule('/src/data/subjectData.ts');
  const { drawScienceLifeProblemVisual } = await server.ssrLoadModule('/src/utils/scienceLifeVisualRenderer.ts');
  const { drawSciencePhysicsProblemVisual } = await server.ssrLoadModule('/src/utils/sciencePhysicsVisualRenderer.ts');
  const { drawScienceMatterProblemVisual } = await server.ssrLoadModule('/src/utils/scienceMatterVisualRenderer.ts');
  const { drawScienceEarthProblemVisual } = await server.ssrLoadModule('/src/utils/scienceEarthVisualRenderer.ts');
  const { drawScienceBiologyProblemVisual } = await server.ssrLoadModule('/src/utils/scienceBiologyVisualRenderer.ts');
  const renderers = [
    drawScienceLifeProblemVisual,
    drawSciencePhysicsProblemVisual,
    drawScienceMatterProblemVisual,
    drawScienceEarthProblemVisual,
    drawScienceBiologyProblemVisual,
  ];

  let visualProblems = 0;
  let hits = 0;
  let unsupported = 0;

  for (const [mode, problems] of Object.entries(SUBJECT_DATA).filter(([mode]) => mode.startsWith('SCIENCE_'))) {
    for (const problem of problems) {
      if (!problem.visual) continue;
      visualProblems += 1;
      const texts = [];
      const ctx = makeContext(texts);
      let rendered = false;
      for (const renderer of renderers) {
        if (renderer(ctx, problem.visual, 260, 180)) {
          rendered = true;
          break;
        }
      }
      if (!rendered) {
        unsupported += 1;
        console.log(`UNSUPPORTED\t${mode}\t${problem.visual.kind}\t${problem.question}`);
        continue;
      }

      const answer = normalize(problem.answer);
      const direct = [...new Set(texts.map(normalize))]
        .filter((value) => value.length >= 2 && answer.length >= 2 && value.includes(answer));
      if (direct.length) {
        hits += 1;
        console.log(`${mode}\t${problem.visual.kind}\t${problem.question}\tANSWER=${problem.answer}\tDRAWN=${direct.join('|')}`);
      }
    }
  }

  console.log(`SCIENCE_RENDERED_VISUAL_PROBLEMS ${visualProblems}`);
  console.log(`SCIENCE_RENDERED_TEXT_HITS ${hits}`);
  console.log(`SCIENCE_RENDERED_UNSUPPORTED ${unsupported}`);
} finally {
  await server.close();
}
