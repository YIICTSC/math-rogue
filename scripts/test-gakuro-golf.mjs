import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true, watch: null, hmr: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' });
try {
  const { createGolf, addPlayer, startGolf, command, tick, viewFor, benefits, disconnectPlayer, setHoleCount } = await server.ssrLoadModule('/src/mini-games/gakuro-golf/engine.ts');
  const { HOLES } = await server.ssrLoadModule('/src/mini-games/gakuro-golf/course.ts');
  const { BallMotion, BALL_RENDER_DELAY, predictShot } = await server.ssrLoadModule('/src/mini-games/gakuro-golf/motion.ts');
  const { defaultAvatar } = await server.ssrLoadModule('/src/mini-games/gakuro-kart/avatar.ts');
  const { validView } = await server.ssrLoadModule('/src/mini-games/gakuro-golf/protocol.ts');
  const lobby = createGolf(); addPlayer(lobby, 'styled', 'Styled');
  const avatar = { ...defaultAvatar(), species: 3, expression: 6, hairStyle: 4 };
  assert(command(lobby, 'styled', { type: 'avatar', avatar }));
  assert.equal(command(lobby, 'styled', { type: 'avatar', avatar: { ...avatar, species: 999 } }), false);
  const styled = viewFor(lobby, 'styled'); assert(validView(styled)); assert.deepEqual(styled.players[0].avatar, avatar);
  styled.players[0].avatar.species = 0; assert.equal(lobby.players.styled.avatar.species, 3, 'public avatar is a copy');
  const oldView = viewFor(lobby, 'styled'); for (const k of ['avatar','vx','vy','vz','origin','flightTime','shotClub','shotAngle']) delete oldView.players[0][k];
  assert(validView(oldView), 'optional motion/appearance fields remain compatible');
  startGolf(lobby, 'Test'); assert.equal(command(lobby, 'styled', { type: 'avatar', avatar }), false);
  const player = { ...viewFor(lobby,'styled').players[0], correct: 3 };
  const flight = predictShot(player,'driver',0,1), putt = predictShot(player,'putter',0,.7);
  assert(Math.max(...flight.map(p=>p.y)) > 20, 'driver preview has a high arc');
  assert(putt.every(p=>p.y === .55), 'putter preview stays on the ground');
  assert(predictShot(player,'iron',0,.3).at(-1).z < predictShot(player,'iron',0,1).at(-1).z, 'power changes predicted range');
  const motion = new BallMotion();
  for (const at of [0,200,400]) { const s = at/1000; motion.push({...player,x:4*s,y:10*s-4.9*s*s,z:20*s,vx:4,vy:10-9.8*s,vz:20,phase:'moving'},at); }
  for (let at=205;at<395;at+=1000/60) {
    const rendered=motion.sample(at+BALL_RENDER_DELAY), s=at/1000;
    assert(Math.abs(rendered.x-4*s)<.00001 && Math.abs(rendered.y-(10*s-4.9*s*s))<.00001, '60 Hz frames follow the curve between 5 Hz snapshots');
  }
  motion.push({...player,x:0,y:0,z:0,phase:'ready',penalty:true},600);
  assert.equal(motion.sample(600+BALL_RENDER_DELAY).y,0,'penalty return clears stale flight');
  const lesson = () => ({ title: 'Test', questions: Array.from({ length: 3 }, (_, i) => ({ id: `q${i}`, mode: 'ADDITION', question: '1 + 1 = ?', options: ['2', '3', '4', '5'], correct: 0 })) });
  const setup = (count = 1) => { const w = createGolf(12345); for (let i = 0; i < count; i++) assert(addPlayer(w, `p${i}`, `Player ${i}`)); assert(startGolf(w, 'Test')); return w; };
  const solve = (w, id = 'p0', correct = 3) => {
    const p = w.players[id]; if (p.phase === 'aim') return p;
    assert(command(w, id, { type: 'quiz' }, lesson));
    assert.equal(command(w, id, { type: 'quiz' }, lesson), false, 'cannot reroll the quiz');
    assert.equal(command(w, id, { type: 'shot', shotId: p.shotId, club: 'driver', angle: 0, power: 1 }), false, 'three questions required');
    for (let i = 0; i < 3; i++) {
      const c = { type: 'answer', shotId: p.shotId, index: i, option: i < correct ? 0 : 1 };
      assert.equal(viewFor(w, id).quiz.answer, null);
      assert(!Object.hasOwn(viewFor(w, id).quiz.question, 'correct'));
      assert(command(w, id, c)); assert.equal(command(w, id, c), false, 'duplicate answers rejected');
      assert.equal(viewFor(w, id).quiz.answer, 0, 'correct answer revealed after answering');
      const next = { type: 'continue', shotId: p.shotId, index: i };
      assert(command(w, id, next)); assert.equal(command(w, id, next), false, 'duplicate continue rejected');
    }
    assert.equal(p.phase, 'aim'); assert.equal(p.correct, correct); return p;
  };
  const settle = w => { for (let i = 0; i < 1000 && Object.values(w.players).some(p => p.phase === 'moving'); i++) tick(w, 1 / 30); };
  const full = createGolf(); for (let i = 0; i < 40; i++) assert(addPlayer(full, `p${i}`, 'Player'));
  assert.equal(addPlayer(full, 'overflow', 'Overflow'), false); assert.equal(addPlayer(full, '__proto__', 'Bad'), false);
  disconnectPlayer(full, 'p7'); assert(addPlayer(full, 'replacement', 'Replacement')); assert.equal(full.players.replacement.slot, 7);
  assert(startGolf(full, 'Test')); assert.equal(addPlayer(full, 'late', 'Late'), false);
  for (const p of Object.values(full.players)) solve(full, p.id);
  for (const p of Object.values(full.players)) assert(command(full, p.id, { type: 'shot', shotId: p.shotId, club: 'iron', angle: 0, power: .7 }));
  settle(full); assert(Object.values(full.players).every(p => p.strokes === 1 && p.phase === 'aim' && p.shotsLeft === 2));
  assert.equal(viewFor(full, 'p0').players.length, 40);
  const distances = [];
  for (let correct = 0; correct <= 3; correct++) {
    const w = setup(), p = solve(w, 'p0', correct);
    assert.equal(benefits(correct).power, [.55, .7, .85, 1][correct]);
    assert.equal(benefits(correct).spread, [9, 6, 3, .7][correct]);
    assert.equal(command(w, 'p0', { type: 'shot', shotId: p.shotId - 1, club: 'iron', angle: 0, power: 1 }), false);
    for (const invalid of [NaN, Infinity, -1, 2]) assert.equal(command(w, 'p0', { type: 'shot', shotId: p.shotId, club: 'iron', angle: 0, power: invalid }), false);
    assert.equal(command(w, 'p0', { type: 'shot', shotId: p.shotId, club: 'constructor', angle: 0, power: 1 }), false);
    const shot = { type: 'shot', shotId: p.shotId, club: 'iron', angle: 0, power: 1 };
    assert(command(w, 'p0', shot)); assert.equal(command(w, 'p0', shot), false); settle(w); distances.push(p.z);
    assert.equal(command(w, 'p0', shot), false, 'an old shot token cannot replay after settling');
  }
  assert(distances.every((d, i) => i === 0 || d > distances[i - 1]), 'correct answers increase actual distance');
  const water = setup(), wp = solve(water); wp.x = -32; wp.z = 65; wp.phase = 'moving'; wp.y = .01; wp.vy = -1; wp.strokes = 1;
  tick(water, 1 / 30); assert.equal(wp.strokes, 2); assert.equal(wp.penalty, true); assert.equal(wp.x, 0); assert.equal(wp.z, 0);
  const ob = setup(), op = solve(ob); op.x = 80; op.phase = 'moving'; op.strokes = 1; tick(ob, 1 / 30); assert.equal(op.penalty, true);
  const cap = setup(), cp = solve(cap); cp.strokes = 12; cp.phase = 'moving'; tick(cap, 1 / 30); assert.equal(cp.phase, 'holed'); assert.equal(cp.capped, true);
  const round = setup(2), p = round.players.p0;
  for (let h = 0; h < HOLES.length; h++) {
    p.x = HOLES[h].cup.x; p.z = HOLES[h].cup.z - 1.8;
    solve(round); assert(command(round, p.id, { type: 'shot', shotId: p.shotId, club: 'putter', angle: 0, power: .05 })); settle(round);
    assert.equal(p.phase, 'holed'); assert.equal(p.strokes, 1); assert(command(round, p.id, { type: 'next' }));
  }
  assert.equal(p.phase, 'finished'); assert.deepEqual(p.scores, Array(18).fill(1)); assert.equal(round.phase, 'playing');
  disconnectPlayer(round, 'p1'); assert.equal(round.phase, 'result', 'disconnect cannot block completion');
  const paused = setup(); paused.paused = true; assert.equal(command(paused, 'p0', { type: 'quiz' }, lesson), false);
  const privacy = setup(2); command(privacy, 'p0', { type: 'quiz' }, lesson);
  assert.equal(viewFor(privacy, 'p1').quiz, null); assert(!JSON.stringify(viewFor(privacy, 'p1')).includes('1 + 1'));

  assert.equal(HOLES.length, 18); assert.equal(HOLES.reduce((n,h)=>n+h.par,0),72);
  const cadence = setup(), cg = solve(cadence); const bonusCorrect=cg.correct;
  for (let shot=0;shot<3;shot++) {
    const token=cg.shotId;
    assert(command(cadence,cg.id,{type:'shot',shotId:token,club:'putter',angle:Math.PI,power:.05}));
    settle(cadence);
    assert.equal(cg.shotsLeft,2-shot); assert.equal(cg.correct,bonusCorrect);
    assert.equal(cg.phase,shot===2?'ready':'aim');
    assert.equal(command(cadence,cg.id,{type:'shot',shotId:token,club:'putter',angle:0,power:.05}),false,'replayed shot rejected even when aiming again');
    if(shot<2) assert.equal(command(cadence,cg.id,{type:'quiz'},lesson),false,'cannot refresh questions before three shots');
  }
  solve(cadence); assert.equal(cg.shotsLeft,3);
  const short=createGolf();addPlayer(short,'p0','Short');assert(setHoleCount(short,1));assert(!setHoleCount(short,0));assert(!setHoleCount(short,19));assert(!setHoleCount(short,1.5));startGolf(short,'Test');assert(!setHoleCount(short,18));
  const sp=solve(short);sp.x=HOLES[0].cup.x;sp.z=HOLES[0].cup.z-1.8;command(short,sp.id,{type:'shot',shotId:sp.shotId,club:'putter',angle:0,power:.05});settle(short);assert(command(short,sp.id,{type:'next'}));assert.equal(short.phase,'result');assert.equal(sp.scores.length,1);
  assert.equal(wp.shotsLeft,3,'penalty does not consume another actual shot');assert.equal(wp.penaltyKind,'water');assert.equal(op.penaltyKind,'ob');
  const corrupt=viewFor(short,sp.id);corrupt.holeCount=19;assert(!validView(corrupt));
  console.log('Golf: all reward tiers, 40-player simulation, privacy, replay protection, hazards, putting, score cap, 18-hole completion and disconnect passed.');
} finally { await server.close(); }
