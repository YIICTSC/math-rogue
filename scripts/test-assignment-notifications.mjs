import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 4176;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const vite = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(PORT)],
  { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] },
);

try {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(BASE_URL);
      if (response.ok) break;
    } catch {
      await delay(200);
    }
  }

  const browser = await chromium.launch({ headless: true, executablePath: CHROME_PATH });
  const page = await browser.newPage();
  await page.addInitScript(() => {
    window.__assignmentNotifications = [];
    class MockNotification {
      static permission = 'granted';
      static requestPermission = async () => 'granted';
      constructor(title, options) {
        this.title = title;
        this.options = options;
        this.onclick = null;
        window.__assignmentNotifications.push(this);
      }
      close() {}
    }
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: MockNotification,
    });
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(async () => {
    localStorage.removeItem('learning_rogue_assignment_notification_state_v1');
    const { assignmentNotificationService, ASSIGNMENT_NOTIFICATION_OPEN_EVENT } = await import('/src/services/assignmentNotificationService.ts');
    const baseAssignment = {
      id: 'assignment-old',
      version: 1,
      title: '既存課題',
      subject: '算数',
      unitId: 'MATH_G1_U01',
      unitLabel: 'たし算',
      targetCorrect: 10,
      answerMode: 'CHOICE',
      gameMode: 'FREE',
      dueAt: null,
      rewardEnabled: true,
      status: 'unopened',
      correctCount: 0,
      answeredCount: 0,
      retryCorrectCount: 0,
    };
    const newAssignment = {
      ...baseAssignment,
      id: 'assignment-new',
      title: '新しい宿題',
      unitLabel: 'ひき算',
      sourceGroupName: '1年A組',
    };

    const baseline = await assignmentNotificationService.observeAssignments('learner-1', [baseAssignment]);
    const delivered = await assignmentNotificationService.observeAssignments('learner-1', [newAssignment, baseAssignment]);
    const duplicate = await assignmentNotificationService.observeAssignments('learner-1', [newAssignment, baseAssignment]);
    let openedAssignmentId = '';
    window.addEventListener(ASSIGNMENT_NOTIFICATION_OPEN_EVENT, event => {
      openedAssignmentId = event.detail?.assignmentId || '';
    });
    window.__assignmentNotifications[0]?.onclick?.();

    return {
      baseline,
      delivered,
      duplicate,
      notificationCount: window.__assignmentNotifications.length,
      title: window.__assignmentNotifications[0]?.title,
      body: window.__assignmentNotifications[0]?.options?.body,
      openedAssignmentId,
    };
  });

  if (result.baseline.length !== 0) throw new Error('初回同期で既存課題を通知している');
  if (result.delivered.join(',') !== 'assignment-new') throw new Error('新規課題を検出できない');
  if (result.duplicate.length !== 0 || result.notificationCount !== 1) throw new Error('同じ課題を重複通知している');
  if (result.title !== '新しい課題が届きました' || !result.body.includes('新しい宿題')) throw new Error('通知文面が正しくない');
  if (result.openedAssignmentId !== 'assignment-new') throw new Error('通知タップで課題受信箱イベントを発火できない');

  console.log('Assignment notification test passed.');
  await browser.close();
} finally {
  vite.kill('SIGTERM');
}
