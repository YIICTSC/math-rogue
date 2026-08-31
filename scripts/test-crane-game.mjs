import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });

try {
  const engine = await server.ssrLoadModule('/src/mini-games/crane-game/craneGameEngine.ts');
  const {
    CRANE_EVENT_CHANCE,
    CRANE_PRIZES,
    findCatchCandidate,
    getHangingPrizeRotation,
    getPrizePose,
    shouldTriggerCraneEvent,
  } = engine;

  assert.equal(CRANE_EVENT_CHANCE, 0.25, 'event chance should remain 25%');
  assert.equal(shouldTriggerCraneEvent(0.249, 2, undefined), true, 'rolls below 25% should trigger');
  assert.equal(shouldTriggerCraneEvent(0.25, 2, undefined), false, 'the 25% boundary should not trigger');
  assert.equal(shouldTriggerCraneEvent(0.01, 2, 2), false, 'the event should run at most once per act');

  const raccoon = CRANE_PRIZES.find((prize) => prize.id === 'raccoon');
  assert(raccoon, 'raccoon prize must exist as a floor object');
  const pose = getPrizePose(raccoon, 1380);
  const caught = findCatchCandidate(pose.x, 1380);
  assert.equal(caught?.prize.id, 'raccoon', 'collision should catch the actual rolling raccoon object');
  assert.equal(caught?.pose.rotation, pose.rotation, 'catch should preserve the floor sprite angle');
  assert.notEqual(getHangingPrizeRotation(pose.rotation, 320, 1), pose.rotation, 'a lifted prize should keep moving with a physical-looking swing');

  assert.equal(CRANE_PRIZES.some((prize) => prize.spriteIndex === 3), false, 'the precomposed claw-gripping-raccoon cell must never be a prize');
  const componentSource = fs.readFileSync('src/mini-games/crane-game/CraneGame.tsx', 'utf8');
  assert(!/index=\{3\}/.test(componentSource), 'the precomposed claw-gripping-raccoon sprite must not be rendered');

  console.log('Crane game trigger, collision, angle preservation, and sprite-use checks passed.');
} finally {
  await server.close();
}
