import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.LEARNING_ROGUE_URL || 'http://127.0.0.1:5173/';
const saveKey = 'pixel_spire_save_state_v1';
const basePlayer = {
  id: 'WARRIOR', name: '反逆の高校生', maxHp: 100, currentHp: 100, maxEnergy: 3, currentEnergy: 3,
  block: 0, strength: 0, gold: 99, deck: [], hand: [], discardPile: [], drawPile: [], relics: [], potions: [],
  powers: {}, echoes: 0, cardsPlayedThisTurn: 0, attacksPlayedThisTurn: 0, typesPlayedThisTurn: [], relicCounters: {}, turnFlags: {},
  imageData: '', floatingText: null, nextTurnEnergy: 0, nextTurnDraw: 0, codexBuffer: [],
};

const makeSave = (screen, visualTheme = 'high-school', playerOverrides = {}) => ({
  screen, mode: 'MULTIPLICATION', modePool: [], visualTheme, answerMode: 'CHOICE', difficultyLevel: 1,
  shopRemoveCount: 0, act: 1, floor: 0, endlessFloor: 1, turn: 0, map: [], currentMapNodeId: null,
  player: { ...basePlayer, ...playerOverrides }, enemies: [], selectedEnemyId: null, narrativeLog: [], combatLog: [], rewards: [],
  selectionState: { active: false, type: 'DISCARD', amount: 0 }, isEndless: true, endlessTrueMode: false,
  endlessBossId: undefined, endlessBossPhase: undefined, endlessRewardIds: [], endlessRunRewards: [], endlessRewardPending: false,
  endlessRewardRerollUsed: false, endlessGimmickProgress: {}, parryState: { active: false, enemyId: null, success: false },
  activeEffects: [], currentStoryIndex: 0, actStats: { enemiesDefeated: 0, goldGained: 0, mathCorrect: 0 },
});

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error));
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ key, save }) => {
    localStorage.setItem(key, JSON.stringify(save));
    localStorage.setItem('pixel_spire_student_profile_v1', JSON.stringify({ grade: '小学1年', schoolYear: '2026', dailyAssignmentLanguageMode: 'JAPANESE' }));
    localStorage.setItem('learning_rogue_online_ranking_initial_prompt_declined_v1', '1');
  }, { key: saveKey, save: makeSave('ENDLESS_OPENING') });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'つづきから' }).click();
  await page.getByRole('heading', { name: '解放された学園の門' }).waitFor({ state: 'visible' });
  const openingText = await page.locator('.themed-ending-sequence-panel').innerText();
  assert.match(openingText, /ここから先は、誰かに決められた道じゃない/);
  assert.doesNotMatch(openingText, /次もぼくが先頭だ/);

  const trueEndingCases = [
    { theme: 'elementary', title: '海辺の作戦会議', text: '海辺に地図を広げて次の冒険' },
    { theme: 'high-school', title: '海辺の作戦会議', text: '勝利の次に守るもの', },
    { theme: 'magic', title: '海辺の星空観測', text: '海と星がつながって見える', player: { magicProtagonistId: 'AKARI', magicProtagonistGender: 'female' }, },
    { theme: 'magic', title: '海辺のピクニック', text: '今日は結界なしで大丈夫', player: { magicProtagonistId: 'REN', magicProtagonistGender: 'male' }, },
  ];
  for (const endingCase of trueEndingCases) {
    await page.evaluate(({ key, save }) => localStorage.setItem(key, JSON.stringify(save)), {
      key: saveKey,
      save: makeSave('ENDLESS_TRUE_ENDING', endingCase.theme, endingCase.player),
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    const continueButton = page.getByRole('button', { name: 'つづきから' });
    if (await continueButton.count()) await continueButton.click();
    await page.getByRole('heading', { name: endingCase.title }).waitFor({ state: 'visible' });
    const endingPanel = page.locator('.themed-ending-sequence-panel');
    assert.match(await endingPanel.innerText(), new RegExp(endingCase.text));
    const foregroundSrc = await page.locator('.themed-ending-sequence-foreground').getAttribute('src');
    assert.ok(foregroundSrc?.includes(endingCase.theme === 'magic' ? '/sprites/endless-endings/magic/' : endingCase.theme === 'high-school' ? '/sprites/endless-endings/high-school/' : '/sprites/endless-endings/'), `True ending artwork/theme mismatch for ${endingCase.theme}`);
  }

  await page.evaluate(({ key, save }) => localStorage.setItem(key, JSON.stringify(save)), { key: saveKey, save: makeSave('MAP') });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'つづきから' }).click();
  await page.getByText('学習判定', { exact: true }).first().waitFor({ state: 'visible' });
  // The fixture can briefly retain the mode-selection layer while the saved map
  // state hydrates. Invoke the same DOM click handler once the glossary term is
  // visible, so this check does not depend on that transient layer's z-index.
  await page.getByText('学習判定', { exact: true }).first().evaluate(element => element.click());
  await page.getByRole('dialog').getByText('ギミック用語').waitFor({ state: 'visible' });
  assert.match(await page.getByRole('dialog').innerText(), /問題に答え/);
  assert.equal(errors.length, 0, errors.map(error => error.message).join('\n'));
  console.log('Endless UI browser check passed for themed opening/true-ending copy and gimmick glossary.');
} finally {
  await browser.close();
}
