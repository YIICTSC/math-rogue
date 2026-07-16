import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [service, modal, app, types] = await Promise.all([
  readFile(new URL('../src/services/learningManagementService.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/AssignmentInboxModal.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/types.ts', import.meta.url), 'utf8'),
]);

assert.match(service, /learner-devices\/link/);
assert.match(service, /learner\/assignments/);
assert.match(service, /fetchAssignment:/);
assert.match(service, /URL\.createObjectURL/);
assert.match(service, /learner\/progress\/batch/);
assert.match(service, /slice\(0, 100\)/);
assert.match(service, /eventId: crypto\.randomUUID\(\)/);
const progressQueueImplementation = service.slice(service.indexOf('queueProgress:'), service.indexOf('flushProgress:'));
assert.doesNotMatch(progressQueueImplementation, /correctAnswer|selectedAnswer|question:/);
assert.match(service, /QUEUE_KEY/);
assert.match(modal, /学校・家庭からの課題/);
assert.match(modal, /claimReward/);
assert.match(modal, /learningManagementService\.fetchAssignment/);
assert.match(app, /assignment\.source !== 'MANAGEMENT'/);
assert.match(app, /learningManagementService\.queueProgress/);
assert.match(types, /source\?: 'URL' \| 'MANAGEMENT'/);
assert.match(types, /imageUrl\?: string/);
console.log('management integration verification passed');
