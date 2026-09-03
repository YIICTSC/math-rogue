import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appPath = path.join(scriptDir, '..', 'src', 'App.tsx');
const source = fs.readFileSync(appPath, 'utf8');

assert.match(
  source,
  /const \[pendingAssignmentResumeState, setPendingAssignmentResumeState\] = useState<GameState \| null>\(null\);/,
  '送信課題の続き状態を保持するステートが必要'
);
assert.match(
  source,
  /const \[assignmentStartConfirmedId, setAssignmentStartConfirmedId\] = useState<string \| null>\(null\);/,
  '課題レター確定状態を保持するステートが必要'
);

const continueStart = source.indexOf('const continueGame = async () => {');
const continueEnd = source.indexOf('const launchNewAdventure =', continueStart);
assert.ok(continueStart >= 0 && continueEnd > continueStart, '続きから処理を特定できない');
const continueSource = source.slice(continueStart, continueEnd);
assert.match(
  continueSource,
  /const saved = pendingAssignmentResumeState \|\| storageService\.loadGame\(\);/,
  '課題レター確定前に保持した本編セーブを優先していない'
);
assert.match(
  continueSource,
  /const isAssignmentAlreadyStarted = assignmentStartConfirmedId === assignmentForContinue\.id[\s\S]*?shouldHoldAssignmentResumeState = isSentAssignment && !isAssignmentAlreadyStarted;/,
  '課題レター確定後も再表示する状態判定になっている'
);
assert.match(
  continueSource,
  /if \(shouldHoldAssignmentResumeState\) \{[\s\S]*?setPendingAssignmentResumeState\(\{ \.\.\.saved \}\);[\s\S]*?return;/,
  '送信課題の続き状態を課題レター表示中に保持していない'
);

const assignmentStartHandlers = [...source.matchAll(/startAssignmentFromLetter\(assignmentLetter, isTeacherAssignmentActive\)/g)];
assert.equal(assignmentStartHandlers.length, 2, '課題レター両方の開始ハンドラに復帰状態を渡す必要がある');
assert.equal(
  (source.match(/const startAssignmentFromLetter = \(assignment: AssignmentPayload, isTeacherAssignment: boolean\)/g) || []).length,
  1,
  '課題開始処理を共通化できていない'
);
assert.equal(
  (source.match(/setAssignmentStartConfirmedId\(assignment\.id\)/g) || []).length,
  1,
  '課題を始める確定時に課題実施を有効化していない'
);
assert.match(source, /setGameState\(prev => \(\{ \.\.\.prev, screen: GameScreen\.START_MENU \}\)\);/,
  '通常の送信課題をタイトル画面へ戻していない');
assert.match(source, /screen: GameScreen\.MODE_SELECTION,/,
  '課題開始後の冒険で通常のモード選択を開いていない');
assert.match(source, /const shouldSkipAssignmentModeSelection = activeAssignment\?\.gameMode === 'FREE' && isAssignmentWithinDeadline;/,
  '選択済みFREE課題の冒険で問題選択をスキップする判定がない');
assert.match(source, /screen: shouldSkipAssignmentModeSelection\s*\? GameScreen\.DIFFICULTY_SELECTION\s*:\s*GameScreen\.MODE_SELECTION,/,
  '選択済み課題の冒険開始が難易度選択へ進まない');
assert.match(source, /nextLaunchLocked && pendingManagedAssignmentLetter\?\.id === nextLaunchLocked\.id && showAssignmentLetter/,
  '最優先課題レター表示中の自動再処理を抑止していない');
assert.match(source, /if \(nextLaunchLocked\) \{[\s\S]*?openManagedAssignment\(payload\);/,
  '最優先課題をレター表示経由で開始していない');
assert.match(source, /gameState\.screen === GameScreen\.START_MENU && pendingAssignmentResumeState/,
  '保持中の本編セーブをタイトル画面の保存処理で上書きする可能性がある');

console.log('Assignment resume bridge regression test passed.');
