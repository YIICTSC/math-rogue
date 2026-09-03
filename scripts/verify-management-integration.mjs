import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [service, modal, inviteModal, app, types, rangeFilters, general, math, kanji, english] = await Promise.all([
  readFile(new URL('../src/services/managementPortalService.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/AssignmentInboxModal.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/LearnerGroupInviteModal.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/types.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/utils/assignmentRangeFilters.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/GeneralChallengeScreen.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/MathChallengeScreen.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/KanjiChallengeScreen.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/EnglishChallengeScreen.tsx', import.meta.url), 'utf8'),
]);

assert.match(service, /learner-devices\/link/);
assert.match(service, /learnerInvite/);
assert.match(service, /group-invitations/);
assert.match(service, /joinLearnerInvitation/);
assert.match(service, /this\.getProfile\(\)\?\.token/);
assert.match(service, /unavailableReason/);
assert.match(service, /alreadyJoined/);
assert.match(service, /learner\/assignments/);
assert.match(service, /fetchAssignmentPayload/);
assert.match(service, /isManagedCurriculumMode/);
assert.match(service, /MATH_G\|KOKUGO_G/);
assert.match(service, /ENGLISH_G\[3-9\]/);
assert.match(service, /SCIENCE_\[3-9\]/);
assert.match(service, /assignment\.units\?\.length/);
assert.match(service, /managedUnits\.map/);
assert.match(service, /getNextRequiredManagedAssignment/);
assert.match(service, /getNextLaunchLockedManagedAssignment/);
assert.match(service, /assignment\.enforcementLevel === 'launch_lock'/);
assert.match(service, /isManagedAssignmentActive/);
assert.match(service, /assignment\.playMode === 'problem_only'/);
assert.match(service, /gameMode: toAssignmentPayload\(assignment\)\.gameMode/);
assert.match(service, /unit\.modes\.includes\(result\.mode\)/);
assert.match(service, /URL\.createObjectURL/);
assert.match(service, /learner\/progress\/batch/);
assert.match(service, /learner\/activity\/batch/);
assert.match(service, /queueLearningActivity/);
assert.match(service, /source: 'assignment' \| 'self_study'/);
assert.match(service, /ACTIVITY_QUEUE_KEY/);
assert.match(service, /slice\(0, 50\)/);
assert.match(service, /eventId: makeEventId\(\)/);
const progressQueueImplementation = service.slice(service.indexOf('queueAnswer('), service.indexOf('async flushProgress'));
assert.doesNotMatch(progressQueueImplementation, /correctAnswer|selectedAnswer|question:/);
assert.match(service, /PROGRESS_QUEUE_KEY/);
assert.match(modal, /課題受信箱/);
assert.match(inviteModal, /attendanceNumber/);
assert.match(inviteModal, /displayName/);
assert.match(inviteModal, /期限切れ・停止済みのURL/);
assert.match(inviteModal, /result\.alreadyJoined/);
assert.match(inviteModal, /managementPortalService\.clearLearnerInvitationToken\(\)/);
assert.doesNotMatch(inviteModal, /gradeLabel|連携コード/);
assert.match(modal, /managementPortalService\.fetchAssignmentPayload/);
assert.match(modal, /assignment\.units\?\.length/);
assert.match(modal, /先に必須課題/);
assert.match(modal, /最優先課題（起動時開始）/);
assert.match(modal, /assignment\.requirementType === 'required'/);
assert.match(app, /assignment\.managementPortal/);
assert.match(app, /requiredAssignmentCheckRef/);
assert.match(app, /pendingManagedAssignmentLetter/);
assert.match(app, /setPendingManagedAssignmentLetter\(assignment\)/);
assert.match(app, /LearnerGroupInviteModal/);
assert.match(app, /setShowAssignmentInbox\(false\)/);
assert.doesNotMatch(app.slice(app.indexOf('<LearnerGroupInviteModal'), app.indexOf('<OnlineNameSetupModal')), /setShowAssignmentInbox\(true\)/);
assert.match(modal, /const latestProfile = managementPortalService\.getProfile\(\)/);
assert.match(app, /getNextRequiredManagedAssignment/);
assert.match(app, /getNextLaunchLockedManagedAssignment/);
assert.match(app, /managedAssignmentsRevision/);
assert.match(app, /setManagedAssignmentsRevision\(version => version \+ 1\)/);
assert.match(app, /CapacitorApp\.addListener\('appStateChange'/);
assert.match(app, /const nextLaunchLocked = getNextLaunchLockedManagedAssignment\(assignments\)/);
assert.match(app, /payload = toAssignmentPayload\(nextRequired\)/);
assert.match(app, /requiredAssignmentCheckRef\.current = false/);
assert.match(app, /A fresher assignment revision may arrive while payload details are being/);
assert.match(app, /storageService\.clearCurrentAssignment/);
assert.match(app, /screen: GameScreen\.PROBLEM_CHALLENGE/);
assert.match(app, /isRequiredTeacherAssignment/);
assert.match(app, /managementPortalService\.queueAnswer/);
assert.match(app, /managementPortalService\.queueLearningActivity/);
assert.match(types, /managementPortal\?:/);
assert.match(types, /requirementType\?: 'optional' \| 'required'/);
assert.match(types, /enforcementLevel\?: 'optional' \| 'required' \| 'launch_lock'/);
assert.match(types, /imageUrl\?: string/);
assert.match(types, /filters\?: AssignmentRangeFilter/);
assert.match(service, /filterSchemaVersion/);
assert.match(service, /x-learning-rogue-assignment-schema': '2'/);
assert.match(service, /最新版に更新してください/);
assert.match(service, /filterLabel/);
for (const kind of ['multiplication_table', 'division', 'addition_subtraction', 'time', 'decimal', 'fraction', 'kanji', 'english_words', 'prefectures', 'history']) assert.match(rangeFilters, new RegExp(kind));
assert.match(rangeFilters, /PREFECTURE_REGIONS/);
assert.match(rangeFilters, /matchesKanjiAssignmentRangeFilter/);
assert.match(general, /matchesAssignmentRangeFilter/);
assert.match(general, /assignmentUnits/);
assert.match(math, /multiplication_table/);
assert.match(math, /divisor_2_5/);
assert.match(kanji, /matchesKanjiAssignmentRangeFilter/);
assert.match(english, /japanese_to_english/);
console.log('management integration verification passed');
