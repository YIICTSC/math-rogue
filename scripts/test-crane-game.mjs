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
  assert.equal(CRANE_CHUTE_X, 19, 'the carriage target should sit over the left-side internal chute opening');
  assert(CRANE_CARRY_DURATION_MS >= 1000, 'carriage travel should be visible, not instantaneous');
  assert(CRANE_CHUTE_DROP_DURATION_MS >= 600, 'the release over the chute should be visible');
  assert(CRANE_FALL_DURATION_MS >= 500, 'a slipped prize should have a visible fall');
  assert.equal(shouldTriggerCraneEvent(0.249, 2, undefined), true, 'rolls below 25% should trigger');
  assert.equal(shouldTriggerCraneEvent(0.25, 2, undefined), false, 'the 25% boundary should not trigger');
  assert.equal(shouldTriggerCraneEvent(0.01, 2, 2), false, 'the event should run at most once per act');

  const raccoon = CRANE_PRIZES.find((prize) => prize.id === 'raccoon');
  assert(raccoon, 'raccoon prize must exist as a floor object');
  const cat = CRANE_PRIZES.find((prize) => prize.id === 'cat');
  assert(cat && cat.baseX - cat.drift > CRANE_CHUTE_X + cat.catchRadius, 'the prize outlet area must remain clear of floor prizes');
  assert.deepEqual(
    CRANE_PRIZES.map((prize) => prize.heldSpriteIndex).sort((left, right) => left - right),
    [0, 1, 2, 3, 4, 5],
    'every prize must have a dedicated ImageGen held-claw frame',
  );
  const pose = getPrizePose(raccoon, 1380);
  assert.deepEqual(getPrizePose(raccoon, 1380), getPrizePose(raccoon, 2480), 'floor prizes should stay still until the claw catches one');
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
  assert(componentSource.includes('crane-game-cabinet-v2.png'), 'the cabinet should contain the connected internal prize chute');
  assert(componentSource.includes('crane-game-held-prizes-3x2-alpha-v1.png'), 'the ImageGen held-claw sheet must be used while carrying');
  assert(componentSource.includes('HeldPrizeSprite'), 'a caught prize should render as its dedicated held-claw sprite');
  assert(componentSource.includes("index={phase === 'AIM' || phase === 'DROPPING' ? 1 : 2}"), 'the claw should use its own open/closed sprite');
  assert(!componentSource.includes('clawSpriteIndex'), 'the claw sprite must not switch to a precomposed prize-grip cell');
  assert(!componentSource.includes('crane-game-catch-tether'), 'the old hand-built tether should not replace the held-claw sheet');
  assert(!componentSource.includes('crane-game-carry-stack'), 'the old hand-built carry stack should not replace the held-claw sheet');
  assert(!componentSource.includes('CHUTE_FENCE_OVERLAY'), 'the cabinet chute should not depend on an overlay sprite');
  assert(!componentSource.includes('crane-game-chute-fence-v1.png'), 'the old chute/fence overlay must not be rendered');
  assert(componentSource.includes("phase === 'CARRYING'"), 'the carriage-to-chute phase must be present');
  assert(componentSource.includes("phase === 'FALLING'"), 'the visible mid-route slip phase must be present');
  const manifestSource = fs.readFileSync('public/sprites/mini-games/crane-game/crane-game-sprites-4x4-v1.json', 'utf8');
  assert(manifestSource.includes('crane-game-cabinet-v2.png'), 'the sprite manifest should point at the rebuilt cabinet');
  assert(manifestSource.includes('crane-game-held-prizes-3x2-alpha-v1.png'), 'the sprite manifest should include the held-claw production sheet');
  assert(!manifestSource.includes('chuteFenceImage'), 'the sprite manifest should not advertise an overlay chute');

  console.log('Crane game trigger, collision, angle preservation, and sprite-use checks passed.');
} finally {
  await server.close();
}
