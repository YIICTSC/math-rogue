"""CPU speech QA with 1s-separated batches; similarity flags are review aids."""
from pathlib import Path
import json,hashlib,re,time,argparse
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
from difflib import SequenceMatcher
from pykakasi import kakasi
from faster_whisper import WhisperModel
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--enemies',action='store_true');p.add_argument('--follow',action='store_true');p.add_argument('--keys',type=Path);p.add_argument('--model',default='small');p.add_argument('--threads',type=int,default=1);p.add_argument('--rescore-only',action='store_true');p.add_argument('--report',type=Path);p.add_argument('--batch-size',type=int,default=10);a=p.parse_args()
catalog=json.loads((ROOT/('assets/kocho/enemy-voice-lines.json' if a.enemies else 'assets/kocho/voice-lines.json')).read_text());record=a.report or ROOT/('assets/kocho/enemy-speech-qa.json' if a.enemies else 'assets/kocho/speech-qa.json')
review=json.loads(record.read_text()) if record.exists() else {'samples':{}}
review['recognizer']=f'faster-whisper/{a.model}, Japanese, int8 CPU, 1s-separated batches, no text prompt'
k=kakasi()
def norm(text):
 # Correct dictionary segmentation for the game's conventional martial-arts names.
 for written,reading in {'後ろ蹴り':'うしろげり','回し蹴り':'まわしげり','旋風脚':'せんぷうきゃく','扇風脚':'せんぷうきゃく','隙':'すき','熱血拳':'ねっけつけん','熱血剣':'ねっけつけん','貸出記録':'かしだしきろく'}.items():
  text=text.replace(written,reading)
 return re.sub('[^ぁ-ゖー]','',''.join(x['hira']for x in k.convert(text))).replace('づ','ず').replace('ぢ','じ')
def score(span):
 readings=[span['reading']]
 if '雷' in span['expected']:
  readings += [span['reading'].replace('かみなり','いかずち'),span['reading'].replace('いかずち','かみなり')]
 if 'バケツ返し' in span['expected']:readings += [span['reading'].replace('かえし','がえし')]
 if '校旗突き' in span['expected']:readings += [span['reading'].replace('こうきつき','こうきずき')]
 span['accepted_readings']=list(dict.fromkeys(readings))
 return round(max(SequenceMatcher(None,norm(reading),norm(span['recognized'])).ratio()for reading in readings),3)
for span in review['samples'].values():
 if 'reading' in span:span['reading_similarity']=score(span)
if a.rescore_only:
 record.write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n');raise SystemExit(0)
model=WhisperModel(a.model,device='cpu',compute_type='int8',cpu_threads=a.threads,num_workers=1)
selected=set(json.loads(a.keys.read_text())) if a.keys else None
expected={h['id']+'/'+event:(text,h.get('readings',{}).get(event,text)) for h in catalog['heroes'] for event,text in h['lines'].items() if selected is None or h['id']+'/'+event in selected}
while True:
 pending=[]
 for key,(text,reading) in expected.items():
  path=ROOT/('public/sfx/kocho-enemy-voices' if a.enemies else 'public/sfx/kocho-voices')/f'{key}.ogg'
  if not path.exists() or time.time()-path.stat().st_mtime<1:continue
  sha=hashlib.sha256(path.read_bytes()).hexdigest()
  if review['samples'].get(key,{}).get('sha256')==sha and review['samples'][key].get('reading')==reading:continue
  try:audio,rate=sf.read(path,dtype='float32')
  except Exception:continue
  pending.append((key,text,reading,sha,resample_poly(audio,16000,rate)))
 if a.follow and len(pending)<a.batch_size and any(not (ROOT/('public/sfx/kocho-enemy-voices' if a.enemies else 'public/sfx/kocho-voices')/f'{key}.ogg').exists() for key in expected):
  time.sleep(4);continue
 for offset in range(0,len(pending),a.batch_size):
  spans=[];wave=[];cursor=0
  for key,text,reading,sha,audio in pending[offset:offset+a.batch_size]:
   spans.append(dict(key=key,expected=text,reading=reading,sha256=sha,start=cursor/16000,end=(cursor+len(audio))/16000,recognized=''))
   wave.extend([audio,np.zeros(16000,dtype='float32')]);cursor+=len(audio)+16000
  segments,_=model.transcribe(np.concatenate(wave),language='ja',beam_size=3,vad_filter=False,word_timestamps=True,condition_on_previous_text=False)
  for segment in segments:
   for word in segment.words:
    mid=(word.start+word.end)/2
    nearest=min(spans,key=lambda s:max(s['start']-mid,0,mid-s['end']))
    nearest['recognized']+=word.word
  for span in spans:
   key=span.pop('key');span['seconds']=round(span.pop('end')-span.pop('start'),3)
   span['reading_similarity']=score(span)
   review['samples'][key]=span
   print(f"{sum(key in review['samples'] for key in expected)}/{len(expected)} {key} {span['reading_similarity']:.2f} {span['recognized']}",flush=True)
  temp=record.with_suffix('.tmp');temp.write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n');temp.replace(record)
 if not a.follow:break
 if all(key in review['samples'] for key in expected) and not pending:break
 time.sleep(4)
