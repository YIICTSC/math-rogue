"""Canonical context readings must agree without accepting extra dialogue."""
import unittest
from voice_review_rules import normalize, assess


class ContextReadings(unittest.TestCase):
 def test_mark_context_matches_explicit_reading(self):
  self.assertEqual(normalize('あの印、踏んでも大丈夫か？'),normalize('あのしるし、ふんでもだいじょうぶか？'))
  self.assertNotEqual(normalize('印鑑'),normalize('しるしかん'))

 def test_shield_fastener_reading_survives_missing_punctuation(self):
  self.assertEqual(normalize('盾の留め金、出撃前に見てもらえますか。'),normalize('盾の留め金出撃前に見てもらえますか'))
  self.assertEqual(normalize('盾の留め金'),normalize('縦の止め金'))
  self.assertNotEqual(normalize('盾の留め金'),normalize('盾の留め具'))

 def test_contextual_number_forms_preserve_number_and_meaning(self):
  self.assertEqual(normalize('二人でつなごう'),normalize('2人でつなごう'))
  self.assertNotEqual(normalize('二人でつなごう'),normalize('3人でつなごう'))
  self.assertEqual(normalize('故郷の一日が長い'),normalize('故郷の1日が長い'))
  self.assertNotEqual(normalize('故郷の一日が長い'),normalize('故郷の2日が長い'))

 def test_appended_reply_remains_distinct(self):
  clip={'text':'あの印、踏んでも大丈夫か？','spoken_text':'あのしるし、ふんでもだいじょうぶか？'}
  self.assertEqual(assess(clip,'あの印、踏んでも大丈夫か？')['cer'],0)
  self.assertGreater(assess(clip,'あの印、踏んでも大丈夫か？ はい！')['cer'],0)
  self.assertGreater(assess(clip,'あの印、踏んでも大丈夫か？ ご視聴ありがとうございました')['cer'],.18)


if __name__=='__main__':unittest.main()
