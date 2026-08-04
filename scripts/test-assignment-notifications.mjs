const storage = new Map();
const notifications = [];
const windowMock = new EventTarget();

windowMock.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key),
};
windowMock.focus = () => {};

class MockNotification {
  static permission = 'granted';
  static requestPermission = async () => 'granted';

  constructor(title, options) {
    this.title = title;
    this.options = options;
    this.onclick = null;
    notifications.push(this);
  }

  close() {}
}

Object.assign(globalThis, {
  window: windowMock,
  document: { baseURI: 'http://127.0.0.1/' },
  Notification: MockNotification,
});
windowMock.Notification = MockNotification;

const {
  assignmentNotificationService,
  ASSIGNMENT_NOTIFICATION_OPEN_EVENT,
  getOutstandingAssignmentCount,
} = await import('../src/services/assignmentNotificationService.ts');

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

if (getOutstandingAssignmentCount([baseAssignment, newAssignment]) !== 2) {
  throw new Error('未完了課題のバッジ件数を計算できない');
}
if (getOutstandingAssignmentCount([
  { ...baseAssignment, status: 'completed' },
  { ...newAssignment, correctCount: newAssignment.targetCorrect },
]) !== 0) {
  throw new Error('完了済み課題をバッジ件数から除外できない');
}

const baseline = await assignmentNotificationService.observeAssignments('learner-1', [baseAssignment]);
const delivered = await assignmentNotificationService.observeAssignments('learner-1', [newAssignment, baseAssignment]);
const duplicate = await assignmentNotificationService.observeAssignments('learner-1', [newAssignment, baseAssignment]);
let openedAssignmentId = '';
windowMock.addEventListener(ASSIGNMENT_NOTIFICATION_OPEN_EVENT, event => {
  openedAssignmentId = event.detail?.assignmentId || '';
});
notifications[0]?.onclick?.();

if (baseline.length !== 0) throw new Error('初回同期で既存課題を通知している');
if (delivered.join(',') !== 'assignment-new') throw new Error('新規課題を検出できない');
if (duplicate.length !== 0 || notifications.length !== 1) throw new Error('同じ課題を重複通知している');
if (notifications[0]?.title !== '新しい課題が届きました'
  || !notifications[0]?.options?.body.includes('新しい宿題')) {
  throw new Error('通知文面が正しくない');
}
if (openedAssignmentId !== 'assignment-new') {
  throw new Error('通知タップで課題受信箱イベントを発火できない');
}

console.log('Assignment notification test passed.');
