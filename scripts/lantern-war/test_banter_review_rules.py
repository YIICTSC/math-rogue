import unittest,json
from pathlib import Path
from banter_review_rules import assess,content_fingerprint

def reply(text,heard,cue=None):return assess({'text':text,'kind':'banter-reply','cue':cue},heard)

class BanterPronunciationTests(unittest.TestCase):
 def test_natural_final_particle_is_not_a_lexical_error(self):
  v=reply('助かるよ。','助かるよー')
  self.assertEqual(v['cer'],0);self.assertGreater(v['raw_cer'],.18);self.assertFalse(v['needs_review'])
 def test_chuckle_and_interjection_spelling(self):
  self.assertFalse(reply('ふふっ、もう。','フフ、もー')['needs_review'])
  self.assertFalse(reply('おう。','おぉ！')['needs_review'])
  self.assertFalse(reply('ああ。','あー')['needs_review'])
  self.assertFalse(reply('ふふっ、そうだよ。','ふふ、そうだよー')['needs_review'])
  self.assertFalse(reply('そうでしたか。','そうでしたかー')['needs_review'])
  self.assertFalse(reply('おっ、そうなのか！','お？そうなのか！')['needs_review'])
  self.assertFalse(reply('ええ、その通り。','え、その通り。',cue='agree')['needs_review'])
  self.assertFalse(reply('ありがと、助かった！','ありがとう、助かった！',cue='thanks')['needs_review'])
  self.assertFalse(reply('へえ、そうか。','へぇ、そうか。')['needs_review'])
  self.assertFalse(reply('へえ、そうか。','へー、そうか。')['needs_review'])
  self.assertFalse(reply('はっ、やるじゃねえか。','はっ、やるじゃねーか。')['needs_review'])
 def test_real_plan_uses_thanks_intent(self):
  plan=json.loads((Path(__file__).resolve().parents[2]/'assets/lantern-war/banter/voice-plan.json').read_text())
  clip=next(c for c in plan['clips']if c['text']=='ありがと、助かった！' and c['kind']=='banter-reply')
  self.assertEqual(clip['cue'],'thanks');self.assertFalse(assess(clip,'ありがとう、助かった！')['needs_review'])
 def test_nonverbal_laugh_does_not_hide_wrong_words(self):
  self.assertFalse(reply('ふっ、面白いね。','面白いね。',cue='tease')['needs_review'])
  self.assertFalse(reply('えへへっ、もう。','へへへ、もー。',cue='tease')['needs_review'])
  self.assertTrue(reply('ふっ、面白いね。','面白くないね。',cue='tease')['needs_review'])
  self.assertTrue(reply('行くぞ、面白いね。','面白いね。',cue='tease')['needs_review'])
  self.assertTrue(reply('えへへっ、もう。','うふふ、おぉ。',cue='tease')['needs_review'])
  self.assertTrue(reply('ありがと、助かった！','ありがとう、さすが！',cue='thanks')['needs_review'])
 def test_meaning_changes_and_extra_words_are_blocked(self):
  for expected,heard in [('それは意外ね。','それは痛いね'),('一緒に確かめましょう。','一緒に助かれましょう'),('助かるよ。','助かるよ、ありがとう'),('うん。','ん'),('ふっ、面白いね。','面白いね'),('おう。','おー、よもいにり'),('へえ、そうか。','へぇ、そうだ。'),('はっ、やるじゃねえか。','はっ、であるじゃねーか。')]:
   with self.subTest(expected=expected,heard=heard):self.assertTrue(reply(expected,heard)['needs_review'])
 def test_internal_lengths_remain_significant(self):
  self.assertTrue(reply('コートだよ。','ことだよ')['needs_review'])
  self.assertTrue(reply('ええ。','え')['needs_review'])
  self.assertTrue(reply('おっと、危ない。','音、危ない。')['needs_review'])
 def test_full_dialogue_key_words_block_semantic_near_passes(self):
  clip={'text':'君の剣は王座ではなく、帰り道を指すんだね。','kind':'banter'}
  self.assertFalse(assess(clip,'君の剣は大沢ではなく、帰り道を指すんだね')['needs_review'])
  self.assertTrue(assess(clip,'君の剣は大沢ではなく、帰り道を指すんだね',{'required_phrases':['王座']})['needs_review'])
  self.assertFalse(assess(clip,clip['text'],{'required_phrases':['王座']})['needs_review'])
 def test_prefix_reading_does_not_match_an_extra_initial_word(self):
  clip={'text':'樹の成長を、少し早められたら。','kind':'banter'}
  requirement={'required_prefix':{'text':'樹の成長','readings':['きのせいちょう']}}
  self.assertTrue(assess(clip,'一気の成長を少し早められたら',requirement)['needs_review'])
  self.assertTrue(assess(clip,'木の成長を少し早められたら',requirement)['required_prefix_ok'])
  self.assertFalse(assess({'text':'君の剣は王座を指す。','spoken_text':'きみのけんはおうざをさす。','kind':'banter'},'君の剣は王座を指す。')['needs_review'])
  correct_reading={'required_prefix':{'text':'君の剣','readings':['きみのけん']}}
  self.assertFalse(assess({'text':'君の剣。','kind':'banter'},'くんのけん',correct_reading)['required_prefix_ok'])
 def test_exact_line_guard_and_requirement_cache_identity(self):
  clip={'text':'俺が言ってくる。','kind':'banter'}
  self.assertTrue(assess(clip,'俺が言ってくるいい',{'require_lexical_exact':True})['needs_review'])
  self.assertEqual(content_fingerprint({'seed_offset':1}),content_fingerprint({'seed_offset':2,'model':'rf'}))
  self.assertNotEqual(content_fingerprint({}),content_fingerprint({'required_phrases':['王座']}))

if __name__=='__main__':unittest.main()
