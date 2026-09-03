import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.LEARNING_ROGUE_URL || 'http://127.0.0.1:5173/';
const gameSaveKey = 'pixel_spire_save_state_v1';
const assignmentKey = 'pixel_spire_current_assignment_v1';
const managementProfileKey = 'learning_rogue_management_profile_v1';
const managementAssignmentsKey = 'learning_rogue_management_assignments_v1';

const player = {
  maxHp: 100,
  currentHp: 100,
  maxEnergy: 3,
  currentEnergy: 3,
  block: 0,
  strength: 0,
  gold: 99,
  deck: [],
  hand: [],
  discardPile: [],
  drawPile: [],
  relics: [],
  potions: [],
  powers: {},
  echoes: 0,
  cardsPlayedThisTurn: 0,
  attacksPlayedThisTurn: 0,
  typesPlayedThisTurn: [],
  relicCounters: {},
  turnFlags: {},
  imageData: '',
  floatingText: null,
  nextTurnEnergy: 0,
  nextTurnDraw: 0,
  codexBuffer: [],
};

const savedMainState = {
  screen: 'MAP',
  mode: 'MULTIPLICATION',
  visualTheme: 'elementary',
  answerMode: 'CHOICE',
  difficultyLevel: 1,
  shopRemoveCount: 0,
  act: 1,
  floor: 3,
  turn: 0,
  map: [],
  currentMapNodeId: null,
  player,
  enemies: [],
  selectedEnemyId: null,
  narrativeLog: ['復帰テスト'],
  combatLog: [],
  rewards: [],
  selectionState: { active: false, type: 'DISCARD', amount: 0 },
  isEndless: false,
  parryState: { active: false, enemyId: null, success: false },
  activeEffects: [],
  currentStoryIndex: 0,
  actStats: { enemiesDefeated: 0, goldGained: 0, mathCorrect: 0 },
};

const assignment = {
  id: 'browser-assignment-resume-test',
  version: 1,
  title: 'ブラウザ復帰テスト課題',
  subject: '算数',
  unitId: 'MATH_G1_U01',
  unitLabel: 'たし算',
  targetCorrect: 1,
  units: [{ id: 'MATH_G1_U01', name: 'たし算', label: 'たし算', modes: ['MULTIPLICATION'], targetCorrect: 1 }],
  customProblems: [],
  customTargetCorrect: 1,
  answerMode: 'CHOICE',
  gameMode: 'FREE',
  dueAt: null,
  rewardEnabled: true,
  status: 'unopened',
  correctCount: 0,
  answeredCount: 0,
  retryCorrectCount: 0,
  requirementType: 'required',
  enforcementLevel: 'required',
  managementPortal: { assignmentId: 'browser-assignment-resume-test', sourceGroupName: '復帰テスト' },
};

const managedRequiredAssignment = {
  id: 'browser-required-assignment-resume-test',
  version: 1,
  title: '必須課題の復帰テスト',
  subject: '算数',
  unitId: 'MATH_G1_U01',
  unitLabel: 'たし算',
  targetCorrect: 1,
  answerMode: 'CHOICE',
  gameMode: 'free',
  playMode: 'free',
  dueAt: null,
  rewardEnabled: true,
  status: 'unopened',
  correctCount: 0,
  answeredCount: 0,
  retryCorrectCount: 0,
  requirementType: 'required',
  enforcementLevel: 'required',
  units: [{ unitId: 'MATH_G1_U01', unitLabel: 'たし算', targetCorrect: 1 }],
};

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', (error) => console.log('pageerror:', error.stack || error.message));
  await page.route('https://learning-rogue-management.yishigeict.chatgpt.site/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith('/assignments')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ assignments: [managedRequiredAssignment] }) });
      return;
    }
    if (pathname.includes('/assignments/')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ assignment: managedRequiredAssignment }) });
      return;
    }
    await route.continue();
  });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ gameSaveKey: saveKey, assignmentKey: taskKey, saved, task }) => {
    localStorage.setItem(saveKey, JSON.stringify(saved));
    localStorage.setItem(taskKey, JSON.stringify(task));
    localStorage.setItem('pixel_spire_student_profile_v1', JSON.stringify({
      grade: '小学1年', schoolYear: '2026', dailyAssignmentLanguageMode: 'JAPANESE',
    }));
    localStorage.setItem('learning_rogue_online_ranking_initial_prompt_declined_v1', '1');
  }, { gameSaveKey, assignmentKey, saved: savedMainState, task: assignment });
  await page.reload({ waitUntil: 'domcontentloaded' });

  await page.getByRole('button', { name: '課題レター' }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /課題を始める/ }).first().click();
  await page.waitForFunction((saveKey) => JSON.parse(localStorage.getItem(saveKey) || '{}').screen === 'MAP', gameSaveKey);
  assert.equal(JSON.parse(await page.evaluate((saveKey) => localStorage.getItem(saveKey), gameSaveKey)).screen, 'MAP');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'つづきから' }).click();
  await page.getByRole('button', { name: /課題を始める/ }).first().click();
  await page.waitForFunction((saveKey) => JSON.parse(localStorage.getItem(saveKey) || '{}').screen === 'MAP', gameSaveKey);
  assert.equal(JSON.parse(await page.evaluate((saveKey) => localStorage.getItem(saveKey), gameSaveKey)).screen, 'MAP');

  await page.evaluate(({ saveKey, taskKey, profileKey, assignmentsKey, saved, managed }) => {
    localStorage.setItem(saveKey, JSON.stringify(saved));
    localStorage.removeItem(taskKey);
    localStorage.setItem(profileKey, JSON.stringify({ learnerId: 'browser-learner', token: 'browser-token', linkedAt: '2026-01-01T00:00:00.000Z' }));
    localStorage.setItem(assignmentsKey, JSON.stringify([managed]));
  }, {
    saveKey: gameSaveKey,
    taskKey: assignmentKey,
    profileKey: managementProfileKey,
    assignmentsKey: managementAssignmentsKey,
    saved: savedMainState,
    managed: managedRequiredAssignment,
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /課題を始める/ }).first().click();
  await page.waitForFunction((saveKey) => JSON.parse(localStorage.getItem(saveKey) || '{}').screen === 'MAP', gameSaveKey);
  await page.waitForTimeout(800);
  assert.equal(await page.locator('.assignment-letter-overlay:visible').count(), 0, '必須課題レターが開始後に再表示されている');
  assert.equal(JSON.parse(await page.evaluate((saveKey) => localStorage.getItem(saveKey), gameSaveKey)).screen, 'MAP');

  console.log('Browser assignment resume flow passed for direct task start and Continue.');
} finally {
  await browser.close();
}
