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
assert.match(service, /learner\/progress\/batch/);
assert.match(service, /slice\(0, 100\)/);
assert.match(service, /eventId: crypto\.randomUUID\(\)/);
assert.doesNotMatch(service, /correctAnswer|selectedAnswer|question:/);
assert.match(service, /QUEUE_KEY/);
assert.match(modal, /学校・家庭からの課題/);
assert.match(modal, /claimReward/);
assert.match(app, /assignment\.source !== 'MANAGEMENT'/);
assert.match(app, /learningManagementService\.queueProgress/);
assert.match(types, /source\?: 'URL' \| 'MANAGEMENT'/);
console.log('management integration verification passed');
