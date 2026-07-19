import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [service, modal, inviteModal, app, types] = await Promise.all([
  readFile(new URL('../src/services/managementPortalService.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/AssignmentInboxModal.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/LearnerGroupInviteModal.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/types.ts', import.meta.url), 'utf8'),
]);

assert.match(service, /learner-devices\/link/);
assert.match(service, /learnerInvite/);
assert.match(service, /group-invitations/);
assert.match(service, /joinLearnerInvitation/);
assert.match(service, /learner\/assignments/);
assert.match(service, /fetchAssignmentPayload/);
assert.match(service, /isManagedCurriculumMode/);
assert.match(service, /MATH_G\|KOKUGO_G/);
assert.match(service, /ENGLISH_G\[3-9\]/);
assert.match(service, /SCIENCE_\[3-9\]/);
assert.match(service, /assignment\.units\?\.length/);
assert.match(service, /managedUnits\.map/);
assert.match(service, /getNextRequiredManagedAssignment/);
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
assert.doesNotMatch(inviteModal, /gradeLabel|連携コード/);
assert.match(modal, /managementPortalService\.fetchAssignmentPayload/);
assert.match(modal, /assignment\.units\?\.length/);
assert.match(modal, /先に必須課題/);
assert.match(modal, /assignment\.requirementType === 'required'/);
assert.match(app, /assignment\.managementPortal/);
assert.match(app, /requiredAssignmentCheckRef/);
assert.match(app, /LearnerGroupInviteModal/);
assert.match(app, /getNextRequiredManagedAssignment/);
assert.match(app, /isRequiredTeacherAssignment/);
assert.match(app, /managementPortalService\.queueAnswer/);
assert.match(app, /managementPortalService\.queueLearningActivity/);
assert.match(types, /managementPortal\?:/);
assert.match(types, /requirementType\?: 'optional' \| 'required'/);
assert.match(types, /imageUrl\?: string/);
console.log('management integration verification passed');
