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
  assert.deepEqual(l.QUIZ_GATES, [100, 250, 400]); assert.equal(l.QUIZ_END, 450); assert.equal(l.QUIZ_APPROACH_SPEED, 20);
  const adjustable = e.createRace(); assert.equal(adjustable.laps, e.DEFAULT_LAPS); assert.equal(e.setRaceLaps(adjustable, 1), true); assert.equal(adjustable.laps, 1); assert.equal(e.setRaceLaps(adjustable, 5), true); assert.equal(adjustable.laps, 5); assert.equal(e.setRaceLaps(adjustable, 6), false); assert.equal(e.setRaceLaps(adjustable, 2.5), false); adjustable.phase = 'race'; assert.equal(e.setRaceLaps(adjustable, 2), false);
  for (let course = 0; course < t.COURSES.length; course++) for (let distance = 0; distance <= l.QUIZ_END; distance += 5) { const p = t.sampleTrack(distance, course); assert(Math.abs(p.curve) < .00001, `Course ${course}, distance ${distance} not straight`); assert(Math.abs(p.y) < .001); }
  assert.deepEqual([9, 3, -3, -9].map(l.answerLane), [0, 1, 2, 3]); assert.equal(l.answerLane(13), -1);

  // A question appears at the start or 2.5s after the previous feedback. Its
  // gate stays 5s of travel beyond that point at the quiz's 20m/s pace.
  const timing = e.createRace(); timing.lesson = lesson; e.addRacer(timing, 'timer', 'Timer'); timing.phase = 'race';
  const timed = timing.players.timer; timed.distance = 0; timed.speed = 20; timed.x = l.laneCenter(lesson.questions[0].correct);
  const answerAt = [];
  for (let i = 0; i < 3; i++) {
    const target = l.QUIZ_GATES[i];
    while (timed.distance < target) e.tick(timing, 1 / 60);
    answerAt.push(timed.quizFeedbackAt);
  }
  assert(Math.abs(answerAt[0] - 5) < .06, `Question 1 approach ${answerAt[0]}s`);
  assert(Math.abs((answerAt[1] - answerAt[0]) - 7.5) < .08, `Question 2 should include 2.5s feedback + 5s approach, got ${answerAt[1] - answerAt[0]}s`);
  assert(Math.abs((answerAt[2] - answerAt[1]) - 7.5) < .08, `Question 3 should include 2.5s feedback + 5s approach, got ${answerAt[2] - answerAt[1]}s`);

  for (let score = 0; score <= 3; score++) {
    const w = e.createRace(); w.lesson = lesson; e.addRacer(w, 'p', 'Player'); w.phase = 'race'; const p = w.players.p;
    p.distance = 0; p.speed = 20; p.quizFeedbackAt = 0;
    for (let i = 0; i < 3; i++) {
      const gate = l.QUIZ_GATES[i]; p.distance = gate - .2; p.speed = 20;
      p.x = l.laneCenter(i < score ? lesson.questions[i].correct : (lesson.questions[i].correct + 1) % 4); p.slide = 0;
      e.tick(w, .05); assert.notEqual(p.quizAnswers[i], -2); const oldScore = p.quizCorrect; e.tick(w, .05); assert.equal(p.quizCorrect, oldScore, 'one grade per gate');
    }
    assert.equal(p.quizCorrect, score); p.distance = l.QUIZ_END - .2; p.speed = 20; e.tick(w, .05); assert(p.quizApplied);
    assert.equal(p.boost > 0, score === 3); assert.equal(p.slow > 0, score < 2); assert.equal(p.crash > 0, score === 0);
    const roster = n.acceptRoster(n.roster(w), null), decoded = n.decodeSnapshot(n.encodeSnapshot(w, 1), roster, 0).world.players.p;
    assert.equal(decoded.quizCorrect, score); assert.equal(decoded.quizCorrectTotal, score); assert.equal(decoded.quizLap, 0); assert.deepEqual(decoded.quizAnswers, p.quizAnswers); assert.equal(decoded.quizApplied, true); assert.equal(decoded.crash, p.crash);
    if (score === 0) { assert.equal(p.speed, 0); for (let i = 0; i < 180; i++) e.tick(w, 1 / 60); assert(p.speed > 0); assert.equal(p.crash, 0); }
  }

  // Legacy three-question room data remains playable on lap two; current-lap
  // answers clear while the nine-question race total persists and syncs.
  const perLap = e.createRace(); perLap.lesson = lesson; e.addRacer(perLap, 'p', 'Player'); perLap.phase = 'race'; const p = perLap.players.p;
  p.quizAnswers = [0, 1, 2]; p.quizTimes = [5, 5, 5]; p.quizCorrect = 2; p.quizCorrectTotal = 2; p.quizApplied = true;
  p.distance = t.getTrack(0).length + l.QUIZ_GATES[0] - .2; p.speed = 20; p.x = l.laneCenter(lesson.questions[0].correct); p.slide = 0;
  e.tick(perLap, .05); assert.equal(p.quizLap, 1); assert.deepEqual(p.quizAnswers, [lesson.questions[0].correct, -2, -2]); assert.equal(p.quizCorrect, 1); assert.equal(p.quizCorrectTotal, 3); assert.equal(p.quizApplied, false);
  const rosterLap = n.acceptRoster(n.roster(perLap), null), decodedLap = n.decodeSnapshot(n.encodeSnapshot(perLap, 1), rosterLap, 0).world.players.p;
  assert.equal(decodedLap.quizLap, 1); assert.equal(decodedLap.quizCorrectTotal, 3); assert.deepEqual(decodedLap.quizAnswers, p.quizAnswers);

  for (const laps of [1, 5]) {
    const dynamic = e.createRace(2, 991, laps); dynamic.lesson = lesson; e.addRacer(dynamic, 'dynamic', 'Dynamic'); dynamic.phase = 'race';
    const racer = dynamic.players.dynamic, length = t.getTrack(dynamic.course).length;
    racer.distance = length * laps - .1; racer.speed = 20; racer.quizLap = laps - 1; racer.quizCorrectTotal = 3 * laps;
    e.tick(dynamic, .05); assert.equal(racer.finish > 0, true); assert.equal(dynamic.phase, 'result');
    const dynamicRoster = n.roster(dynamic), synced = n.acceptRoster(dynamicRoster, null);
    assert.equal(synced.laps, laps);
    const packet = n.encodeSnapshot(dynamic, 1), roundtrip = n.decodeSnapshot(packet, synced, 0);
    assert.equal(roundtrip.world.laps, laps); assert.equal(roundtrip.world.players.dynamic.quizCorrectTotal, 3 * laps);
    const badRoster = { ...dynamicRoster, laps: laps === 1 ? 0 : 6 }; assert.equal(n.acceptRoster(badRoster, null), null);
    const mismatch = n.encodeSnapshot(dynamic, 2), bytes = new DataView(mismatch); bytes.setUint8(28, laps === 1 ? 2 : 1); assert.equal(n.decodeSnapshot(mismatch, synced, 1), null);
  }

  const w = e.createRace(); w.lesson = lesson; for (let i = 0; i < 40; i++) e.addRacer(w, `p${i}`, `Player ${i}`, i % 3, true); e.startRace(w);
  for (let i = 0; i < 30000 && w.phase !== 'result'; i++) e.tick(w, 1 / 60);
  assert.equal(w.phase, 'result'); assert(Object.values(w.players).every(p => p.quizLap === 2 && p.quizApplied && p.quizAnswers.every(a => a >= 0) && p.quizCorrectTotal >= 0 && p.quizCorrectTotal <= 9));
  const roster = n.acceptRoster(n.roster(w), null); const pack = n.encodeSnapshot(w, 12); assert.equal(pack.byteLength, 2272); assert(n.decodeSnapshot(pack, roster, 11));
  const invalid = n.roster(w); invalid.lesson.questions[0].options = ['same', 'same', 'same', 'same']; assert.equal(n.acceptRoster(invalid, null), null);
  console.log('Four-choice sources/assignments, 3 five-second approaches per lap, all score effects, legacy three-question lap compatibility, configurable 1–5 lap finishes/protocol sync and 40-racer three-lap quiz race passed.');
} finally { await server.close(); }
