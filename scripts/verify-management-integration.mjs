import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [service, modal, app, types] = await Promise.all([
  readFile(new URL('../src/services/managementPortalService.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/AssignmentInboxModal.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/types.ts', import.meta.url), 'utf8'),
]);

assert.match(service, /learner-devices\/link/);
assert.match(service, /learner\/assignments/);
assert.match(service, /fetchAssignmentPayload/);
assert.match(service, /isManagedCurriculumMode/);
assert.match(service, /MATH_G\|KOKUGO_G/);
assert.match(service, /ENGLISH_G\[3-9\]/);
assert.match(service, /SCIENCE_\[3-9\]/);
assert.match(service, /assignment\.units\?\.length/);
assert.match(service, /managedUnits\.map/);
assert.match(service, /unit\.modes\.includes\(result\.mode\)/);
assert.match(service, /URL\.createObjectURL/);
assert.match(service, /learner\/progress\/batch/);
assert.match(service, /slice\(0, 50\)/);
assert.match(service, /eventId: makeEventId\(\)/);
const progressQueueImplementation = service.slice(service.indexOf('queueAnswer('), service.indexOf('async flushProgress'));
assert.doesNotMatch(progressQueueImplementation, /correctAnswer|selectedAnswer|question:/);
assert.match(service, /PROGRESS_QUEUE_KEY/);
assert.match(modal, /課題受信箱/);
assert.match(modal, /managementPortalService\.fetchAssignmentPayload/);
assert.match(modal, /assignment\.units\?\.length/);
assert.match(app, /assignment\.managementPortal/);
assert.match(app, /managementPortalService\.queueAnswer/);
assert.match(types, /managementPortal\?:/);
assert.match(types, /imageUrl\?: string/);
console.log('management integration verification passed');
