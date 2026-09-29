import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const e = await server.ssrLoadModule('/src/mini-games/gakuro-kart/engine.ts');
  const l = await server.ssrLoadModule('/src/mini-games/gakuro-kart/learning.ts');
  const t = await server.ssrLoadModule('/src/mini-games/gakuro-kart/track.ts');
  const n = await server.ssrLoadModule('/src/mini-games/gakuro-kart/protocol.ts');
  const { buildLesson, fourOptions } = await server.ssrLoadModule('/src/mini-games/gakuro-kart/questions.ts');
  const lesson = buildLesson({ mode: 'ADDITION' }); assert(l.validLesson(lesson));
  assert.equal(new Set(fourOptions('1', ['1', '2', '2'])).size, 4);
  for (const mode of ['KANJI_1', 'ENGLISH_ES', 'MATH_G1_1', 'UPPER_MATH_QUADRATIC']) assert(l.validLesson(buildLesson({ mode })));
  const assignment = { id: 'a', title: 'Assignment', units: [], customProblems: [{ id: 'custom', question: '2 + 3 = ?', answer: '5', options: [] }], answerMode: 'INPUT', gameMode: 'CHALLENGE_ONLY' };
  const custom = buildLesson({ mode: 'ADDITION', assignment }); assert(custom.questions.every(q => q.problemId === 'custom' && q.options.length === 4 && q.options[q.correct] === '5')); assert.equal(assignment.answerMode, 'INPUT');
  assert.throws(() => buildLesson({ mode: 'NO_SUCH_MODE' }));
  for (let course = 0; course < 3; course++) for (let distance = 0; distance <= l.QUIZ_END; distance += 5) { const p = t.sampleTrack(distance, course); assert(Math.abs(p.curve) < .00001, `Course ${course}, distance ${distance} not straight`); assert(Math.abs(p.y) < .001); }
  assert.deepEqual([9, 3, -3, -9].map(l.answerLane), [0, 1, 2, 3]); assert.equal(l.answerLane(13), -1);
  for (let score = 0; score <= 3; score++) {
    const w = e.createRace(); w.lesson = lesson; e.addRacer(w, 'p', 'Player'); w.phase = 'race'; const p = w.players.p;
    for (let i = 0; i < 3; i++) {
      p.distance = l.QUIZ_GATES[i] - .2; p.speed = 18; p.x = l.laneCenter(i < score ? lesson.questions[i].correct : (lesson.questions[i].correct + 1) % 4); p.slide = 0;
      e.tick(w, .05); assert.notEqual(p.quizAnswers[i], -2); const oldScore = p.quizCorrect; e.tick(w, .05); assert.equal(p.quizCorrect, oldScore, 'one grade per gate');
    }
    assert.equal(p.quizCorrect, score); p.distance = l.QUIZ_END - .2; p.speed = 18; e.tick(w, .05); assert(p.quizApplied);
    assert.equal(p.boost > 0, score === 3); assert.equal(p.slow > 0, score < 2); assert.equal(p.crash > 0, score === 0);
    const roster = n.acceptRoster(n.roster(w), null), decoded = n.decodeSnapshot(n.encodeSnapshot(w, 1), roster, 0).world.players.p;
    assert.equal(decoded.quizCorrect, score); assert.deepEqual(decoded.quizAnswers, p.quizAnswers); assert.equal(decoded.quizApplied, true); assert.equal(decoded.crash, p.crash);
    if (score === 0) { assert.equal(p.speed, 0); for (let i = 0; i < 180; i++) e.tick(w, 1 / 60); assert(p.speed > 0); assert.equal(p.crash, 0); }
  }
  const w = e.createRace(); w.lesson = lesson; for (let i = 0; i < 40; i++) e.addRacer(w, `p${i}`, `Player ${i}`, i % 3, true); e.startRace(w);
  for (let i = 0; i < 22000 && w.phase !== 'result'; i++) e.tick(w, 1 / 60);
  assert.equal(w.phase, 'result'); assert(Object.values(w.players).every(p => p.quizApplied && p.quizAnswers.every(a => a >= 0)));
  const roster = n.acceptRoster(n.roster(w), null); const pack = n.encodeSnapshot(w, 12); assert.equal(pack.byteLength, 2272); assert(n.decodeSnapshot(pack, roster, 11));
  const invalid = n.roster(w); invalid.lesson.questions[0].options = ['same', 'same', 'same', 'same']; assert.equal(n.acceptRoster(invalid, null), null);
  console.log('Four-choice sources/assignments, 3 flat straights, lane order, all 4 score effects, single grading, crash recovery, 40-racer quiz race and protocol passed.');
} finally { await server.close(); }
