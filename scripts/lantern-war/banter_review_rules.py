"""Banter-specific phonetic equivalences; short lexical mistakes remain blocked."""
import re,json,hashlib
from voice_review_rules import assess as base_assess, normalize, distance

VERSION=6
LAUGH=r'^(?:あははっ?|えへへっ?|うふふっ?|ははっ?|ふふっ?|へへっ?|ふっ|はっ)[、，,！!]\s*'
LAUGH_FORMS=sorted({prefix+syllable*count+stop for prefix,syllable in [('', 'ふ'),('', 'は'),('', 'へ'),('あ','は'),('え','へ'),('う','ふ')]for count in range(2,5)for stop in ['', 'っ']}|{'ふっ','はっ'},key=len,reverse=True)

def phonetics(value,expected,interjection=None,agree_prefix=None,gratitude=False,hee=False,negation=False):
 value=normalize(value)
 # A short chuckle's closing consonant is inconsistently transcribed by ASR.
 value=re.sub(r'(ふふ|はは|へへ)っ',r'\1',value)
 if expected.endswith('もう') and value.endswith('もー'):value=value[:-2]+'もう'
 # Only a final particle may be stretched; never remove internal vowel lengths.
 if interjection and value.startswith(interjection+'っ'):value=value[:1]+value[2:]
 if agree_prefix and value==agree_prefix[1:]:value=agree_prefix
 if gratitude and value.startswith('ありがとう'):value='ありがと'+value[5:]
 if hee:value=re.sub(r'^へ(?:え|ぇ|ー)ー*','へえ',value)
 if negation:value=re.sub(r'ね(?:え|ぇ|ー)ー*(?=[かよなぜぞ])','ねえ',value)
 if expected.endswith(tuple('よねなぞさかわぜ')) and value.rstrip('ー')==expected:value=expected
 acknowledgements={'おう':'おー','おお':'おー','おぉ':'おー','ああ':'あー','あぁ':'あー','ええ':'えー'}
 return acknowledgements.get(value,value)

def content_fingerprint(requirements):
 fields={k:requirements[k]for k in ['required_phrases','required_prefix','require_lexical_exact']if k in requirements}
 return hashlib.sha256(json.dumps(fields,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()

def phrase_matches(spec,heard,prefix=False):
 if isinstance(spec,str):literal=spec;alternatives=[spec]
 elif isinstance(spec,dict):
  literal=spec.get('text','')
  readings=spec.get('readings',[])
  if isinstance(readings,str):readings=[readings]
  alternatives=readings if isinstance(readings,list)and readings else[literal]
 else:return False
 if isinstance(literal,str)and literal and(heard.startswith(literal)if prefix else literal in heard):return True
 normalized=normalize(heard)
 return any((heard.startswith(value)or normalized.startswith(normalize(value)))if prefix else(value in heard or normalize(value)in normalized)for value in alternatives if isinstance(value,str)and value.strip()and normalize(value))

def assess(clip,heard,requirements=None):
 requirements=requirements or{}
 result=base_assess(clip,heard)
 expected_text=clip.get('spoken_text',clip['text'])
 sword_address=clip['text'].startswith('君の剣')
 if sword_address:expected_text=re.sub(r'^君の剣','きみのけん',expected_text)
 nonverbal=clip.get('kind')=='banter-reply' and clip.get('cue')=='tease' and re.match(LAUGH,clip['text'])
 if nonverbal:
  lexical=re.sub(LAUGH,'',expected_text,count=1)
  nonverbal=bool(normalize(lexical))
  if nonverbal:expected_text=lexical
 expected=normalize(expected_text)
 interjection=clip['text'][0] if re.match(r'^[おえあ]っ[、，,！!？?]',clip['text'])else None
 agree_prefix=expected if clip.get('cue')=='agree' and expected.startswith('ええ') and len(expected)>2 else None
 gratitude=clip.get('cue')=='thanks' and expected.startswith('ありがと')
 hee=bool(re.match(r'^へ[えぇー](?:[、，,。！!？?]|$)',clip['text']))
 negation=bool(re.search(r'ねえ[かよなぜぞ]',expected))
 # Normalize the script first so optional chuckle consonants are symmetric.
 target=phonetics(expected,expected,interjection,agree_prefix,gratitude,hee,negation)
 candidates=[heard]
 if sword_address:candidates=[re.sub(r'^君の剣','きみのけん',value)for value in candidates]
 if nonverbal:
  y=normalize(heard)
  candidates.extend(y[len(prefix):]for prefix in LAUGH_FORMS if y.startswith(prefix))
 actual=min((phonetics(y,target,interjection,agree_prefix,gratitude,hee,negation)for y in candidates),key=lambda y:distance(target,y))
 cer=round(distance(target,actual)/max(1,len(target)),4)
 result.update(raw_cer=result['cer'],cer=cer,banter_review_rules=VERSION,
               phonetic_equivalence=cer!=result['cer'],cer_limit=.18)
 if nonverbal:result['asr_nonverbal_prefix_excluded']=True
 # In a brief response, even one wrong mora can change the meaning (意外/痛い).
 # Full dialogue retains its existing ASR tolerance and required-name checks.
 result['needs_review']=not heard or not result['name_verified'] or cer>.18 or (clip.get('kind')=='banter-reply' and cer>0)
 missing=[spec for spec in requirements.get('required_phrases',[])if not phrase_matches(spec,heard)]
 prefix_ok='required_prefix'not in requirements or phrase_matches(requirements['required_prefix'],heard,prefix=True)
 exact_ok=not requirements.get('require_lexical_exact')or cer==0
 result.update(content_requirements_sha256=content_fingerprint(requirements),missing_required_phrases=missing,required_prefix_ok=prefix_ok,lexical_exact_ok=exact_ok)
 result['needs_review']=result['needs_review']or bool(missing)or not prefix_ok or not exact_ok
 return result
