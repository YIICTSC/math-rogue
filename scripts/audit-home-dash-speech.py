"""Optional offline speech QA. Requires faster-whisper, scipy, soundfile and pykakasi.

Usage: python scripts/audit-home-dash-speech.py [keys.json] [report.json]
Recognized kana similarity is a review aid, not an automatic quality verdict.
Report hashes bind transcripts to the exact reviewed audio files.
"""
from faster_whisper import WhisperModel
from pathlib import Path
import json,numpy as np,soundfile as sf,re,hashlib,sys
from scipy.signal import resample_poly
from difflib import SequenceMatcher
from pykakasi import kakasi
root=Path(__file__).resolve().parents[1];audio=[];spans=[];cursor=0
keys=set(json.loads(Path(sys.argv[1]).read_text())) if len(sys.argv)>1 and sys.argv[1]!='-' else None
k=kakasi(); norm=lambda s:re.sub('[^ぁ-ゖー]','', ''.join(x['hira'] for x in k.convert(s)))
for h in json.loads((root/'assets/go-home-dash/hero-voice-lines.json').read_text())['heroes']:
 for event,text in h['lines'].items():
  key=h['id']+'/'+event
  if keys is not None and key not in keys:continue
  p=root/'public/sfx/go-home-dash'/f'{key}.ogg'
  x,rate=sf.read(p,dtype='float32');x=resample_poly(x,16000,rate);start=cursor/16000;audio.append(x);cursor+=len(x)
  spans.append({'clip':key,'expected':text,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'start':start,'end':cursor/16000,'text':''})
  audio.append(np.zeros(16000,dtype='float32'));cursor+=16000
m=WhisperModel('small',device='cpu',compute_type='int8',cpu_threads=1,num_workers=1)
segments,_=m.transcribe(np.concatenate(audio),language='ja',beam_size=3,vad_filter=False,word_timestamps=True,condition_on_previous_text=False)
for segment in segments:
 for word in segment.words:
  mid=(word.start+word.end)/2
  nearest=min(spans,key=lambda e:max(e['start']-mid,0,mid-e['end']))
  nearest['text']+=word.word
for e in spans:
 e['reading_similarity']=round(SequenceMatcher(None,norm(e['expected']),norm(e['text'])).ratio(),3)
 e['seconds']=round(e.pop('end')-e.pop('start'),3)
 print(json.dumps(e,ensure_ascii=False),flush=True)
out=Path(sys.argv[2]) if len(sys.argv)>2 else root/'assets/go-home-dash/speech-qa-final.json'
out.write_text(json.dumps({'recognizer':'faster-whisper/small (Japanese), concatenated with 1s gaps','samples':spans},ensure_ascii=False,indent=2)+'\n')
