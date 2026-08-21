import assert from 'node:assert/strict';
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
  for (const chapter of data.SCHOOL_TRPG_CHAPTERS) {
    const endings = data.getTrpgChapterEndings(chapter.chapter);
    assert.ok(endings.length >= 4, `${chapter.chapter} should expose at least four endings`);
    assert.ok(endings.every(ending => ending.artAsset), `${chapter.chapter} endings should all have artwork`);
  }

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

  let chapterOne = engine.startNextSchoolTrpgChapter(persuasion);
  assert.equal(chapterOne.chapter, 1, 'ending the prologue should unlock chapter 1');
  assert.equal(chapterOne.phase, 'MAP');
  assert.equal(chapterOne.currentLocationId, 'music-room');
  chapterOne = resolveLocation(chapterOne, 'music-room');
  assert.ok(chapterOne.unlockedLocationIds.includes('rooftop'));
  assert.ok(chapterOne.unlockedLocationIds.includes('science-lab'));
  chapterOne = resolveLocation(chapterOne, 'rooftop');
  chapterOne = resolveLocation(chapterOne, 'science-lab');
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
