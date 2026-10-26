"""Independent local ASR spot-check/full review; never runs alongside TTS on an 8GB machine.
Optional dev dependencies in the Irodori CPU venv: faster-whisper, pykakasi.
Similarity flags aid human review; homophones/ASR spelling are not automatic rejections.
"""
import json,os,unicodedata,difflib,hashlib
from pathlib import Path
from faster_whisper import WhisperModel
from pykakasi import kakasi
root=Path(os.environ.get('STAR_TIDE_REPO',Path(__file__).resolve().parents[2]));build=json.loads((root/'assets/star-tide/voice-build.json').read_text());out=root/'assets/star-tide/voice-review.json'
old=json.loads(out.read_text()) if out.exists() else {'clips':[]};prior={c['id']:c for c in old['clips']};kana=kakasi()
def normalize(text):
 text=unicodedata.normalize('NFKC',text);text=''.join(c['hira'] for c in kana.convert(text));return ''.join(c for c in text if c.isalnum())
model=WhisperModel('small',device='cpu',compute_type='int8',cpu_threads=2)
for c in build['clips']:
 if os.environ.get('STAR_TIDE_REVIEW_IDS') and c['id'] not in os.environ['STAR_TIDE_REVIEW_IDS'].split(','):continue
 if c['id'] in prior and prior[c['id']]['sha256']==c['sha256']:continue
 segments,_=model.transcribe(str(root/'public'/c['path']),language='ja',beam_size=5,vad_filter=False,condition_on_previous_text=False,temperature=0)
 heard=''.join(s.text for s in segments).strip();expected=c.get('spokenText',c['text']);ratio=difflib.SequenceMatcher(None,normalize(expected),normalize(heard),autojunk=False).ratio()
 prior[c['id']]={'id':c['id'],'sha256':c['sha256'],'expected':c['text'],'heard':heard,'phoneticSimilarity':round(ratio,3),'needsReview':ratio<.85}
 out.write_text(json.dumps({'recognizer':'faster-whisper small / CPU int8 / Japanese / beam5','clips':list(prior.values())},ensure_ascii=False,indent=2)+'\n')
 print(len(prior),c['id'],round(ratio,3),heard,flush=True)
print('REVIEW',[(c['id'],c['phoneticSimilarity']) for c in prior.values() if c['needsReview']],flush=True)
