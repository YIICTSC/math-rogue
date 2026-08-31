import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });

try {
  const engine = await server.ssrLoadModule('/src/mini-games/crane-game/craneGameEngine.ts');
  const {
    CRANE_EVENT_CHANCE,
    CRANE_CHUTE_X,
    CRANE_CARRY_DURATION_MS,
    CRANE_CHUTE_DROP_DURATION_MS,
    CRANE_FALL_DURATION_MS,
    CRANE_PRIZES,
    getCarryDropPoint,
    interpolateCraneX,
    findCatchCandidate,
    getHangingPrizeRotation,
    getPrizePose,
    shouldTriggerCraneEvent,
  } = engine;

  assert.equal(CRANE_EVENT_CHANCE, 0.25, 'event chance should remain 25%');
  assert.equal(CRANE_CHUTE_X, 50, 'the chute should be centered in the cabinet overlay');
  assert(CRANE_CARRY_DURATION_MS >= 1000, 'carriage travel should be visible, not instantaneous');
  assert(CRANE_CHUTE_DROP_DURATION_MS >= 600, 'the release over the chute should be visible');
  assert(CRANE_FALL_DURATION_MS >= 500, 'a slipped prize should have a visible fall');
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
  assert.equal(getCarryDropPoint(0.9, raccoon), null, 'a roll above the raccoon slip chance should reach the chute');
  assert(getCarryDropPoint(0.1, raccoon) > 0.32, 'a slip should happen after the prize is visibly carried');
  assert.equal(interpolateCraneX(35, CRANE_CHUTE_X, 1), CRANE_CHUTE_X, 'the carriage should finish over the chute');

  assert.equal(CRANE_PRIZES.some((prize) => prize.spriteIndex === 3), false, 'the precomposed claw-gripping-raccoon cell must never be a prize');
  const componentSource = fs.readFileSync('src/mini-games/crane-game/CraneGame.tsx', 'utf8');
  assert(!/index=\{3\}/.test(componentSource), 'the precomposed claw-gripping-raccoon sprite must not be rendered');
  assert(componentSource.includes('crane-game-chute-fence-v1.png'), 'the ImageGen chute/fence overlay must be wired into the game');
  assert(componentSource.includes("phase === 'CARRYING'"), 'the carriage-to-chute phase must be present');
  assert(componentSource.includes("phase === 'FALLING'"), 'the visible mid-route slip phase must be present');

  console.log('Crane game trigger, collision, angle preservation, and sprite-use checks passed.');
} finally {
  await server.close();
}
