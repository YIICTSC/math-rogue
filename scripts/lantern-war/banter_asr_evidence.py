"""An independent recognizer may rescue an exact reading, never a semantic near miss."""
REPOSITORY='kotoba-tech/kotoba-whisper-v2.0-faster'
REVISION='f44edd35eaeb2274e85ac7b31fb2c6f59ff1c4bc'

def token_limit_reached(segments,limit):
 # Clips are shorter than one Whisper window; leave room for special tokens.
 return sum(len(segment.tokens)for segment in segments)>=limit-6

def has_review_model(review,digest,model):
 while isinstance(review,dict)and review.get('sha256')==digest:
  if review.get('model')==model:return True
  review=review.get('previous')
 return False

def can_rescue(assessment,wave_ok,manual_rejection=False):
 return bool(wave_ok and not manual_rejection and not assessment.get('needs_review',True)
             and assessment.get('cer')==0 and assessment.get('name_verified',False)
             and not assessment.get('missing_names',[]))

def cached_evidence(review,digest):
 while isinstance(review,dict)and review.get('sha256')==digest:
  evidence=review.get('japanese_review')
  if isinstance(evidence,dict)and evidence.get('sha256')==digest and evidence.get('repository')==REPOSITORY and evidence.get('revision')==REVISION:
   return evidence
  review=review.get('previous')
 return None
