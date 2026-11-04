import assert from 'node:assert/strict';

// ASR character distance alone cannot distinguish a near-sounding change of meaning.
// Keep approvals tied to the delivered bytes so a retake cannot inherit one.
export function requireSemanticReview(clip, recording, review, audit) {
  if (clip.kind !== 'banter' || review.cer === 0) return;
  assert(audit.accepted?.some(row => row.id === clip.id && row.sha256 === recording.sha256 && typeof row.decision === 'string' && row.decision.trim()),
    'Full dialogue needs semantic transcript review for current audio: ' + clip.id);
}
