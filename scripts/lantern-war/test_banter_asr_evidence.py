import unittest
from banter_asr_evidence import can_rescue,cached_evidence,has_review_model,token_limit_reached,REPOSITORY,REVISION

class EvidenceTests(unittest.TestCase):
 def test_token_limit_detects_truncation_across_segments(self):
  from types import SimpleNamespace
  self.assertFalse(token_limit_reached([SimpleNamespace(tokens=list(range(10)))],64))
  self.assertTrue(token_limit_reached([SimpleNamespace(tokens=list(range(30))),SimpleNamespace(tokens=list(range(28)))],64))
 def test_medium_review_must_belong_to_the_current_audio(self):
  self.assertTrue(has_review_model({'sha256':'current','model':'medium'},'current','medium'))
  self.assertTrue(has_review_model({'sha256':'current','model':'kotoba-v2','previous':{'sha256':'current','model':'medium'}},'current','medium'))
  self.assertFalse(has_review_model({'sha256':'current','previous':{'sha256':'old','model':'medium'}},'current','medium'))
 def test_only_exact_lexical_reading_can_rescue(self):
  good={'cer':0,'needs_review':False,'name_verified':True,'missing_names':[]}
  self.assertTrue(can_rescue(good,True))
  # Losing 不 changes the meaning even though ordinary full-line CER is small.
  self.assertFalse(can_rescue({**good,'cer':.0476},True))
  self.assertFalse(can_rescue({**good,'needs_review':True},True))
 def test_waveform_names_and_manual_rejections_remain_blocking(self):
  good={'cer':0,'needs_review':False,'name_verified':True}
  self.assertFalse(can_rescue(good,False))
  self.assertFalse(can_rescue(good,True,True))
  self.assertFalse(can_rescue({**good,'missing_names':['カイ']},True))
  self.assertFalse(can_rescue({**good,'name_verified':False},True))
 def test_evidence_cannot_cross_audio_or_model_revisions(self):
  e={'sha256':'audio','repository':REPOSITORY,'revision':REVISION,'heard':'年輪'}
  self.assertEqual(cached_evidence({'sha256':'audio','japanese_review':e},'audio'),e)
  self.assertIsNone(cached_evidence({'sha256':'different','japanese_review':e},'audio'))
  self.assertIsNone(cached_evidence({'sha256':'audio','japanese_review':{**e,'revision':'old'}},'audio'))
 def test_reassessment_can_reuse_same_audio_evidence_in_history(self):
  e={'sha256':'audio','repository':REPOSITORY,'revision':REVISION}
  previous={'sha256':'audio','japanese_review':e}
  self.assertEqual(cached_evidence({'sha256':'audio','previous':previous},'audio'),e)
  self.assertIsNone(cached_evidence({'sha256':'new-audio','previous':previous},'new-audio'))

if __name__=='__main__':unittest.main()
