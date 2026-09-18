import { createServer } from 'vite';

const strict = process.argv.includes('--strict');
const failures = [];

const server = await createServer({
  configFile: './vite.config.ts',
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
});

const semanticSignature = (program) => [
  program.kind,
  program.trigger,
  program.resetRule,
  ...program.steps.map(step => `${step.action}:${step.target}:${step.condition}`),
].join('|');

try {
  const cardsModule = await server.ssrLoadModule('/src/mini-games/placement-tcg/placementTcgCards.ts');
  const uniqueModule = await server.ssrLoadModule('/src/mini-games/placement-tcg/placementTcgUniqueEffects.ts');
  const { PLACEMENT_TCG_CARDS, PLACEMENT_TCG_CARD_MAP } = cardsModule;
  const { PLACEMENT_TCG_UNIQUE_EFFECT_PROGRAMS } = uniqueModule;
  const explicitEntries = Object.entries(PLACEMENT_TCG_UNIQUE_EFFECT_PROGRAMS);

  if (PLACEMENT_TCG_CARDS.length !== 541) failures.push(`catalog size: expected 541, got ${PLACEMENT_TCG_CARDS.length}`);
  if (PLACEMENT_TCG_CARD_MAP.size !== 541) failures.push(`card map size: expected 541, got ${PLACEMENT_TCG_CARD_MAP.size}`);

  const cardIds = PLACEMENT_TCG_CARDS.map(card => card.id);
  if (new Set(cardIds).size !== cardIds.length) failures.push('duplicate Card ID exists');

  const normalizedSignatures = PLACEMENT_TCG_CARDS.map(card => card.effectProgram.normalizedSignature);
  if (new Set(normalizedSignatures).size !== normalizedSignatures.length) {
    failures.push('duplicate normalizedSignature exists in the full catalog');
  }

  const semanticOwners = new Map();
  for (const [cardId, program] of explicitEntries) {
    const card = PLACEMENT_TCG_CARD_MAP.get(cardId);
    if (!card) {
      failures.push(`${cardId}: explicit effect has no matching card`);
      continue;
    }
    if (card.effectProgram.normalizedSignature !== program.normalizedSignature) {
      failures.push(`${cardId}: explicit effect is not the active card program`);
    }
    if (program.legacyEffect !== card.effect) failures.push(`${cardId}: legacyEffect mismatch (${program.legacyEffect} / ${card.effect})`);
    if (program.kind !== card.kind) failures.push(`${cardId}: kind mismatch (${program.kind} / ${card.kind})`);
    if (program.edition !== card.edition) failures.push(`${cardId}: edition mismatch (${program.edition} / ${card.edition})`);
    if (!program.steps.length) failures.push(`${cardId}: effect program has no steps`);
    if (program.trigger === 'FINISH') failures.push(`${cardId}: explicit unique effect must not use FINISH as its main trigger`);
    if (card.kind === 'EVENT' && program.trigger !== 'EVENT_PLAY') {
      failures.push(`${cardId}: EVENT cards must use EVENT_PLAY, got ${program.trigger}`);
    }
    if (
      card.kind === 'SUPPORT'
      && !['DEPLOY', 'TURN_START', 'TURN_END', 'ALLY_DEFEATED'].includes(program.trigger)
    ) {
      failures.push(`${cardId}: SUPPORT uses unsupported trigger ${program.trigger}`);
    }

    const semantic = semanticSignature(program);
    const existing = semanticOwners.get(semantic);
    if (existing) failures.push(`${cardId}: semantic effect duplicates ${existing}`);
    else semanticOwners.set(semantic, cardId);
  }

  const supportDefeatCards = PLACEMENT_TCG_CARDS.filter(card => card.kind === 'SUPPORT' && card.effectProgram.trigger === 'DEFEAT');
  if (supportDefeatCards.length) {
    failures.push(`Support cards still using UNIT-only DEFEAT trigger: ${supportDefeatCards.map(card => card.id).join(', ')}`);
  }

  const finishCards = PLACEMENT_TCG_CARDS.filter(card => card.effectProgram.trigger === 'FINISH');
  if (finishCards.length) {
    failures.push(`Playable cards must not use post-victory FINISH as their main effect trigger: ${finishCards.map(card => card.id).join(', ')}`);
  }

  for (const card of PLACEMENT_TCG_CARDS) {
    card.effectProgram.steps.forEach((step, index) => {
      const durationMatters = step.action === 'BUFF_ATTACK' || step.action === 'BUFF_HEALTH';
      if (!durationMatters && step.duration !== 0) {
        failures.push(`${card.id}: step ${index + 1} uses duration on ${step.action}, where duration has no runtime meaning`);
      }
      if (step.action === 'MARK') {
        const consumedLater = card.effectProgram.steps.slice(index + 1).some(later => later.condition === 'AFTER_MARK');
        if (!consumedLater) failures.push(`${card.id}: MARK at step ${index + 1} has no later AFTER_MARK consumer`);
      }
      if (
        card.effectProgram.trigger === 'ALLY_DEFEATED'
        && ['HEAL', 'BUFF_ATTACK', 'BUFF_HEALTH', 'SHIELD', 'MOVE'].includes(step.action)
        && ['SELF', 'OWN_SAME_LANE'].includes(step.target)
      ) {
        failures.push(`${card.id}: ALLY_DEFEATED step ${index + 1} targets the unit slot after that unit has already left play`);
      }
      if (
        card.kind === 'SUPPORT'
        && ['HEAL', 'BUFF_ATTACK', 'BUFF_HEALTH', 'SHIELD', 'MOVE'].includes(step.action)
        && step.target === 'SELF'
      ) {
        failures.push(`${card.id}: Support unit-mutating step ${index + 1} must use OWN_SAME_LANE instead of SELF`);
      }
    });
  }

  const fallbackCount = PLACEMENT_TCG_CARDS.length - explicitEntries.length;
  if (strict && fallbackCount > 0) failures.push(`strict mode: ${fallbackCount} card(s) still use generated fallback effects`);

  if (failures.length) {
    console.error(failures.join('\n'));
    console.error(`Placement TCG unique-effect audit failed: ${failures.length} issue(s).`);
    process.exitCode = 1;
  } else {
    console.log(`Placement TCG unique-effect audit passed: ${explicitEntries.length}/541 explicit unique effects, ${fallbackCount} fallback card(s).`);
    if (!strict && fallbackCount > 0) console.log('Run with --strict after all 541 cards have explicit unique effects.');
  }
} finally {
  await server.close();
}
