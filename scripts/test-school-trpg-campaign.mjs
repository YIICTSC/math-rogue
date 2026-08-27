import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

try {
  const data = await server.ssrLoadModule('/src/mini-games/school-trpg/schoolTrpgData.ts');
  const engine = await server.ssrLoadModule('/src/mini-games/school-trpg/schoolTrpgEngine.ts');
  const localStorageData = new Map();
  globalThis.window = {
    localStorage: {
      getItem: key => localStorageData.get(key) ?? null,
      setItem: (key, value) => localStorageData.set(key, String(value)),
      removeItem: key => localStorageData.delete(key),
    },
  };
  const save = await server.ssrLoadModule('/src/mini-games/school-trpg/schoolTrpgSave.ts');

  assert.deepEqual(data.validateSchoolTrpgData(), [], 'TRPG content data must be internally consistent');
  assert.deepEqual(engine.getSchoolTrpgDataErrors(), [], 'TRPG engine references must resolve');
  const guardianFamilies = new Set();
  for (const chapter of data.SCHOOL_TRPG_CHAPTERS) {
    const endings = data.getTrpgChapterEndings(chapter.chapter);
    assert.ok(endings.length >= 4, `${chapter.chapter} should expose at least four endings`);
    assert.ok(endings.every(ending => ending.artAsset), `${chapter.chapter} endings should all have artwork`);
    const locations = data.getTrpgChapterLocations(chapter.chapter);
    const events = data.getTrpgChapterEvents(chapter.chapter);
    const rewards = data.getTrpgChapterRewards(chapter.chapter);
    assert.match(chapter.guardianAsset, /^sprites\/(high-school|magic)\/enemies\/\d+\.webp$/, `${chapter.chapter} should use a Learning Rogue enemy illustration`);
    assert.match(chapter.battleBackgroundAsset, /^sprites\/backgrounds\/learning-rogue\/.+\.webp$/, `${chapter.chapter} should use a Learning Rogue battle background`);
    guardianFamilies.add(chapter.guardianAsset.split('/')[1]);
    assert.ok(events.every(event => event.archetype), `${chapter.chapter} events should expose an archetype`);
    assert.ok(events.every(event => event.revisit && event.revisit.choices.length >= 2), `${chapter.chapter} events should expose a revisit beat`);
    assert.ok(events.every(event => event.illustrationAsset), `${chapter.chapter} events should own original artwork`);
    assert.equal(new Set(events.map(event => event.illustrationAsset)).size, events.length, `${chapter.chapter} event artwork should not repeat`);
    assert.ok(events.every(event => existsSync(resolve('public', event.illustrationAsset))), `${chapter.chapter} event WebPs should exist`);
    assert.equal(new Set(rewards.map(reward => reward.artAsset)).size, rewards.length, `${chapter.chapter} discovery artwork should not repeat`);
    assert.ok(rewards.every(reward => reward.artAsset && existsSync(resolve('public', reward.artAsset))), `${chapter.chapter} discovery WebPs should exist`);
    assert.ok(rewards.every(reward => reward.useCopy.ja && reward.useCopy.hira && reward.useCopy.en && reward.effect.amount > 0), `${chapter.chapter} discoveries should explain and implement their use`);
    assert.ok(new Set(events.map(event => event.archetype)).size >= 4, `${chapter.chapter} should mix at least four event archetypes`);
    const missingSceneArt = locations.filter(location => data.getSchoolTrpgSceneArt(location.id, location.backgroundAsset) === 'event-illustrations/default.webp').map(location => location.id);
    assert.deepEqual(missingSceneArt, [], `${chapter.chapter} locations should resolve scene art: ${missingSceneArt.join(', ')}`);
  }
  assert.deepEqual([...guardianFamilies].sort(), ['high-school', 'magic'], 'guardians should draw from the high-school and magic chapters');
  assert.equal(Object.keys(data.SCHOOL_TRPG_ENDING_ART).length, data.SCHOOL_TRPG_ENDINGS.length, 'every ending should have one art registry entry');
  assert.ok(data.SCHOOL_TRPG_ENDINGS.every(ending => {
    const art = data.getTrpgEndingArt(ending.id);
    return art && art.asset === ending.artAsset && art.focalPoint.x >= 0 && art.focalPoint.x <= 100 && art.focalPoint.y >= 0 && art.focalPoint.y <= 100;
  }), 'ending art registry should include focal points for every ending');

  const resolveLocation = (state, locationId, choiceIndex = 0) => {
    const eventState = engine.beginSchoolTrpgEvent(state, locationId);
    assert.equal(eventState.phase, 'EVENT', `${locationId} should open an event`);
    const event = data.getTrpgEvent(eventState.currentEventId);
    const resolved = engine.resolveSchoolTrpgChoice(eventState, event.choices[choiceIndex].id, false);
    assert.equal(resolved.phase, 'RESULT', `${event.id} should produce a visible check result`);
    return engine.continueSchoolTrpgResult(resolved);
  };

  const completeExpansionChapter = (initialState, chapter) => {
    let state = initialState;
    const locations = data.getTrpgChapterLocations(chapter);
    const meta = data.getTrpgChapterMeta(chapter);
    assert.equal(locations.length, 6, `chapter ${chapter} should expose six locations`);
    state = resolveLocation(state, locations[0].id);
    state = resolveLocation(state, locations[1].id);
    state = resolveLocation(state, locations[2].id);
    state = resolveLocation(state, locations[3].id);
    assert.equal(state.phase, 'QUESTION', `chapter ${chapter} should open its research quiz gate`);
    state = engine.completeSchoolTrpgQuestion(state, 3);
    assert.ok(state.completedQuestionGates.includes(meta.researchGate));
    state = resolveLocation(state, locations[4].id);
    state = resolveLocation(state, locations[5].id);
    assert.equal(state.phase, 'COMBAT', `chapter ${chapter} should open its guardian encounter`);
    state = { ...state, combat: { ...state.combat, enemyHp: 1 }, stress: 0 };
    state = engine.performSchoolTrpgCombatAction(state, 'STRIKE');
    assert.equal(state.pendingQuestionGate, meta.clearGate, `chapter ${chapter} should open its clear quiz gate`);
    state = engine.completeSchoolTrpgQuestion(state, 2);
    assert.equal(state.phase, 'REWARD');
    const reward = data.getTrpgChapterRewards(chapter)[0];
    state = engine.chooseSchoolTrpgReward(state, reward.id);
    assert.equal(state.phase, 'ENDING', `chapter ${chapter} should resolve to an ending`);
    assert.ok(data.getTrpgChapterEndings(chapter).some(ending => ending.id === state.endingId));
    return state;
  };

  const reachCombat = seed => {
    let state = engine.createSchoolTrpgCampaign(seed);
    state = resolveLocation(state, 'classroom');
    state = resolveLocation(state, 'hallway');
    state = resolveLocation(state, 'courtyard');
    state = resolveLocation(state, 'library');
    assert.equal(state.phase, 'QUESTION', 'the library must open the research quiz gate');
    state = engine.completeSchoolTrpgQuestion(state, 3);
    assert.ok(state.completedQuestionGates.includes('LIBRARY'));
    assert.ok(state.unlockedLocationIds.includes('tcg-club'));
    state = resolveLocation(state, 'tcg-club');
    assert.ok(state.unlockedLocationIds.includes('old-school'));
    state = resolveLocation(state, 'old-school');
    assert.equal(state.phase, 'COMBAT', 'the old wing must open the guardian encounter');
    return state;
  };

  const deterministicA = resolveLocation(engine.createSchoolTrpgCampaign(7419), 'classroom');
  const deterministicB = resolveLocation(engine.createSchoolTrpgCampaign(7419), 'classroom');
  assert.deepEqual(deterministicA, deterministicB, 'same seed and choice must be deterministic');
  const fatigued = { ...engine.createSchoolTrpgCampaign(7419), stress: 5 };
  const rested = engine.recoverSchoolTrpgStress(fatigued);
  assert.equal(rested.phase, 'MAP', 'TRPG rest should only resolve on the route map');
  assert.equal(rested.stress, 3, 'TRPG rest should recover up to two stress');
  assert.equal(rested.time, fatigued.time + 1, 'TRPG rest should advance the expedition clock');
  assert.notDeepEqual(rested.discoveryLog, fatigued.discoveryLog, 'TRPG rest should leave a localized discovery log entry');
  const revisitBase = engine.continueSchoolTrpgResult(deterministicA);
  const revisitState = engine.beginSchoolTrpgEvent(revisitBase, 'classroom');
  assert.equal(revisitState.currentEventVariant, 'REVISIT', 'completed locations should open a stateful revisit scene');
  assert.equal(revisitState.locationStates.classroom, 'ALTERED', 'revisit should persist an altered location state');
  assert.ok(data.getTrpgEvent(revisitState.currentEventId).revisit, 'revisit scene should be authored');
  const revisitResolved = engine.resolveSchoolTrpgChoice(revisitState, data.getTrpgEvent(revisitState.currentEventId).revisit.choices[0].id, false);
  assert.equal(revisitResolved.locationStates.classroom, 'COMPANION_REACTION', 'revisit outcome should persist a companion reaction state');
  assert.equal(engine.continueSchoolTrpgResult(revisitResolved).phase, 'MAP', 'revisit scene should return to the map');
  const eventState = { ...rested, phase: 'EVENT' };
  assert.deepEqual(engine.recoverSchoolTrpgStress(eventState), eventState, 'TRPG rest must not interrupt an event');
  assert.equal(save.saveSchoolTrpgCampaign(deterministicA), true, 'campaign save should commit');
  assert.deepEqual(save.loadSchoolTrpgCampaign(), deterministicA, 'campaign save should round-trip');
  localStorageData.set(save.SCHOOL_TRPG_SAVE_KEY, '{"broken":true}');
  assert.equal(save.loadSchoolTrpgCampaign(), null, 'invalid save data must fail closed');
  assert.equal(save.saveSchoolTrpgCampaign(deterministicA), true, 'campaign should recover after invalid save data');
  const legacyCampaign = { ...deterministicA };
  delete legacyCampaign.chapter;
  const legacySerialized = JSON.stringify(legacyCampaign);
  let legacyHash = 2166136261;
  for (const character of legacySerialized) {
    legacyHash ^= character.charCodeAt(0);
    legacyHash = Math.imul(legacyHash, 16777619);
  }
  localStorageData.set(save.SCHOOL_TRPG_SAVE_KEY, JSON.stringify({
    schema: 'school-trpg-campaign',
    version: 1,
    updatedAt: new Date().toISOString(),
    checksum: (legacyHash >>> 0).toString(16).padStart(8, '0'),
    campaign: legacyCampaign,
  }));
  assert.equal(save.loadSchoolTrpgCampaign().chapter, 0, 'legacy saves without a chapter should migrate to the prologue');
  save.clearSchoolTrpgCampaign();
  assert.equal(save.loadSchoolTrpgCampaign(), null, 'campaign clear should remove stable and pending data');

  let persuasion = reachCombat(20260821);
  persuasion = {
    ...persuasion,
    stress: 0,
    stats: { ...persuasion.stats, energy: 6, friendship: 6, study: 6 },
    flags: { ...persuasion.flags, knowsPassphrase: true },
    combat: { ...persuasion.combat, insight: 3, resolve: 0, enemyIntent: 2 },
  };
  for (let guard = 0; guard < 4 && persuasion.phase === 'COMBAT'; guard += 1) {
    persuasion = engine.performSchoolTrpgCombatAction(persuasion, 'PERSUADE');
  }
  assert.equal(persuasion.phase, 'QUESTION');
  assert.equal(persuasion.combat.resolution, 'PERSUADE');
  assert.equal(persuasion.pendingQuestionGate, 'MISSION_CLEAR');
  persuasion = engine.completeSchoolTrpgQuestion(persuasion, 2);
  assert.equal(persuasion.phase, 'REWARD');
  persuasion = engine.chooseSchoolTrpgReward(persuasion, 'emblem-shard');
  assert.equal(persuasion.phase, 'ENDING');
  assert.equal(persuasion.endingId, 'memory-returned');
  assert.ok(engine.isSchoolTrpgCampaignComplete(persuasion));

  assert.ok(persuasion.combat.actionHistory?.length, 'combat should retain an action history');
  assert.ok(persuasion.combat.encounterId && persuasion.combat.enemyId, 'combat should retain encounter and enemy metadata');
  const extendedBase = reachCombat(20260822);
  const extendedCombat = {
    ...extendedBase,
    inventory: ['emblem-shard'],
    combat: {
      ...extendedBase.combat,
      allyStates: [
        { id: 'scribe', label: { ja: '記録係', hira: 'きろくがかり', en: 'SCRIBE' }, integrity: 2, status: 'THREATENED' },
      ],
      hazard: { id: 'memory-gate', label: { ja: '記憶の門', hira: 'きおくのもん', en: 'MEMORY GATE' }, progress: 0, target: 2 },
    },
  };
  const itemTurn = engine.performSchoolTrpgCombatAction(extendedCombat, 'USE_ITEM');
  assert.ok(itemTurn.combat.actionHistory.includes('USE_ITEM'), 'USE_ITEM should be recorded');
  const allyTurn = engine.performSchoolTrpgCombatAction(itemTurn, 'ALLY_SKILL');
  assert.ok(allyTurn.combat.actionHistory.includes('ALLY_SKILL'), 'ALLY_SKILL should be recorded');
  const protectTurn = engine.performSchoolTrpgCombatAction(allyTurn, 'PROTECT');
  assert.ok(protectTurn.combat.actionHistory.includes('PROTECT'), 'PROTECT should be recorded');

  let chapterOne = engine.startNextSchoolTrpgChapter(persuasion);
  assert.equal(chapterOne.chapter, 1, 'ending the prologue should unlock chapter 1');
  assert.equal(chapterOne.phase, 'MAP');
  assert.equal(chapterOne.currentLocationId, 'music-room');
  chapterOne = resolveLocation(chapterOne, 'music-room');
  assert.ok(chapterOne.unlockedLocationIds.includes('rooftop'));
  chapterOne = resolveLocation(chapterOne, 'rooftop');
  // Chapter 1 intentionally forks: a clean signal shortcuts the alternate
  // lab route, while a setback opens it for recovery. Both routes must lead
  // to the archive without exposing two identical map buttons at once.
  if (chapterOne.unlockedLocationIds.includes('science-lab')) {
    chapterOne = resolveLocation(chapterOne, 'science-lab');
  } else {
    assert.equal(chapterOne.flags.chapter1SkippedEvent, 'P1-03');
  }
  assert.ok(chapterOne.unlockedLocationIds.includes('archive'));
  chapterOne = resolveLocation(chapterOne, 'archive');
  assert.equal(chapterOne.phase, 'QUESTION', 'the archive must open the chapter 1 research quiz gate');
  chapterOne = engine.completeSchoolTrpgQuestion(chapterOne, 3);
  assert.ok(chapterOne.completedQuestionGates.includes('CHAPTER1_RESEARCH'));
  assert.ok(chapterOne.unlockedLocationIds.includes('night-bridge'));
  chapterOne = resolveLocation(chapterOne, 'night-bridge');
  assert.ok(chapterOne.unlockedLocationIds.includes('clock-tower'));
  chapterOne = resolveLocation(chapterOne, 'clock-tower');
  assert.equal(chapterOne.phase, 'COMBAT', 'the clock tower must open the chapter 1 encounter');
  chapterOne = { ...chapterOne, combat: { ...chapterOne.combat, enemyHp: 1 }, stress: 0 };
  chapterOne = engine.performSchoolTrpgCombatAction(chapterOne, 'STRIKE');
  assert.equal(chapterOne.pendingQuestionGate, 'CHAPTER1_CLEAR');
  chapterOne = engine.completeSchoolTrpgQuestion(chapterOne, 2);
  chapterOne = engine.chooseSchoolTrpgReward(chapterOne, 'clockwork-chime');
  assert.equal(chapterOne.phase, 'ENDING');
  assert.equal(chapterOne.endingId, 'clockwork-dawn');

  let chapterTwo = engine.startNextSchoolTrpgChapter(chapterOne);
  chapterTwo = completeExpansionChapter(chapterTwo, 2);
  let chapterThree = engine.startNextSchoolTrpgChapter(chapterTwo);
  chapterThree = completeExpansionChapter(chapterThree, 3);
  let chapterFour = engine.startNextSchoolTrpgChapter(chapterThree);
  chapterFour = completeExpansionChapter(chapterFour, 4);
  assert.ok(engine.isHiddenSchoolTrpgChapterUnlocked(chapterFour), 'chapter 4 research should reveal the hidden route');
  let hiddenChapter = engine.startNextSchoolTrpgChapter(chapterFour);
  assert.equal(hiddenChapter.chapter, 5, 'chapter 5 should unlock only after the origin research gate');
  hiddenChapter = completeExpansionChapter(hiddenChapter, 5);
  assert.equal(hiddenChapter.endingId?.startsWith('chapter5-'), true, 'hidden chapter should use its dedicated endings');
  assert.equal(data.getTrpgChapterEndings(5).length, 5, 'hidden chapter should expose its timeline ending');
  assert.ok(data.getTrpgChapterEndings(5).every(ending => ending.artAsset), 'every hidden ending should have artwork');

  const hiddenTimelineReward = data.getTrpgChapterRewards(5).find(reward => reward.effect.kind === 'ENDING_KEY' && reward.effect.amount === 2);
  assert.ok(hiddenTimelineReward, 'hidden chapter should have the timeline key discovery');
  const hiddenTimelineBase = {
    ...engine.createSchoolTrpgCampaign(4805),
    chapter: 5,
    phase: 'REWARD',
    flags: { combatResolution: 'PERSUADE', companionTrusted: true, 'question.HIDDEN_CLEAR': 3 },
  };
  const hiddenTimeline = engine.chooseSchoolTrpgReward(hiddenTimelineBase, hiddenTimelineReward.id);
  assert.equal(data.getTrpgEnding(hiddenTimeline.endingId).route, 'TIMELINE', 'perfect answers, trust, persuasion, and the constellation thread should reach the timeline ending');
  const hiddenNonPerfect = engine.chooseSchoolTrpgReward({ ...hiddenTimelineBase, flags: { ...hiddenTimelineBase.flags, 'question.HIDDEN_CLEAR': 2 } }, hiddenTimelineReward.id);
  assert.equal(data.getTrpgEnding(hiddenNonPerfect.endingId).route, 'PERSUADE', 'missing a hidden answer should keep the normal persuasion ending');

  let escape = reachCombat(8501);
  escape = { ...escape, combat: { ...escape.combat, turn: 3 }, stress: 0 };
  escape = engine.performSchoolTrpgCombatAction(escape, 'ESCAPE');
  assert.equal(escape.combat.resolution, 'ESCAPE');
  escape = engine.completeSchoolTrpgQuestion(escape, 3);
  escape = engine.chooseSchoolTrpgReward(escape, 'handmade-map');
  assert.equal(escape.endingId, 'quiet-return');

  let sealed = reachCombat(1287);
  sealed = { ...sealed, combat: { ...sealed.combat, enemyHp: 1 }, stress: 0 };
  sealed = engine.performSchoolTrpgCombatAction(sealed, 'STRIKE');
  assert.equal(sealed.combat.resolution, 'DEFEAT');
  assert.equal(sealed.pendingQuestionGate, 'MISSION_CLEAR');

  console.log('School TRPG campaign tests passed: data, deterministic checks, quiz gates, combat routes, rewards, and endings.');
} finally {
  await server.close();
}
