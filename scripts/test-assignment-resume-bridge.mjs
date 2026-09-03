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

const continueStart = source.indexOf('const continueGame = async () => {');
const continueEnd = source.indexOf('const launchNewAdventure =', continueStart);
assert.ok(continueStart >= 0 && continueEnd > continueStart, '続きから処理を特定できない');
const continueSource = source.slice(continueStart, continueEnd);
assert.match(
  continueSource,
  /if \(assignmentForContinue\?\.managementPortal\) \{[\s\S]*?setPendingAssignmentResumeState\(\{ \.\.\.saved \}\);[\s\S]*?return;/,
  '送信課題の続き状態を課題レター表示中に保持していない'
);

const assignmentStartHandlers = [...source.matchAll(/const assignmentResumeState = pendingAssignmentResumeState\s*\|\|/g)];
assert.equal(assignmentStartHandlers.length, 2, '課題レター両方の開始ハンドラに復帰状態を渡す必要がある');
assert.equal(
  (source.match(/\.\.\.\(assignmentResumeState \|\| prev\)/g) || []).length,
  2,
  '課題開始時に保存済み本編状態をベースにしていない'
);
assert.equal(
  (source.match(/: assignmentResumeState\s+\? assignmentResumeState\.screen/g) || []).length,
  2,
  '課題開始時に保存済み本編の画面へ戻していない'
);
assert.equal(
  (source.match(/isTeacherAssignmentActive\s+\? assignmentLetter\.gameMode === 'FREE'\s+\? GameScreen\.DIFFICULTY_SELECTION\s+\: GameScreen\.PROBLEM_CHALLENGE/g) || []).length,
  2,
  '保存状態がない送信課題をタイトル画面へ戻している'
);

console.log('Assignment resume bridge regression test passed.');
