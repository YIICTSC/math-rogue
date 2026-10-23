"""Recognize generated summer dialogue on CPU; cache by audio hash and authored reading.

No text prompts: the recognizer must independently recover the spoken dialogue.
A second recognizer/targeted regeneration can resolve flagged readings.
"""
from pathlib import Path
import argparse,hashlib,json,re,time
from difflib import SequenceMatcher
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
from pykakasi import kakasi
from faster_whisper import WhisperModel
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--rescore-only',action='store_true');p.add_argument('--follow',action='store_true');p.add_argument('--model',default='small');p.add_argument('--threads',type=int,default=2);p.add_argument('--keys',type=Path);p.add_argument('--report',type=Path,default=ROOT/'assets/ending-expansion/voice-speech-qa.json');p.add_argument('--batch-size',type=int,default=8);a=p.parse_args()
plan=json.loads((ROOT/'assets/ending-expansion/voice-plan.json').read_text())['jobs']
selected=set(json.loads(a.keys.read_text()))if a.keys else None
review=json.loads(a.report.read_text())if a.report.exists()else{'samples':{}}
review['recognizer']=f'faster-whisper/{a.model}, Japanese, int8 CPU, no prompt, 1s-separated batches'
k=kakasi()
def norm(s):
 # Contextual readings: the dictionary otherwise mistakes 今日は for a greeting
 # and parses 見失う as ケンウシナウ. These are score corrections, never audio edits.
 for written,reading in {'今日は':'きょうは','今日も':'きょうも','今日の':'きょうの','その後':'そのあと','見失わ':'みうしなわ','見張ら':'みはら','見張り':'みはり'}.items():s=s.replace(written,reading)
 return re.sub('[^ぁ-ゖー]','',''.join(x['hira']for x in k.convert(s))).replace('づ','ず').replace('ぢ','じ')
for sample in review['samples'].values():sample['reading_similarity']=round(SequenceMatcher(None,norm(sample['reading']),norm(sample['recognized'])).ratio(),3)
if a.rescore_only:
 a.report.write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n');raise SystemExit(0)
model=None
while True:
 pending=[]
 for j in plan:
  key=f"{j['theme']}/{j['heroId']}/{j['lineId']}"
  if selected is not None and key not in selected:continue
  path=ROOT/j['output']
  if not path.exists():continue
  sha=hashlib.sha256(path.read_bytes()).hexdigest()
  if review['samples'].get(key,{}).get('sha256')==sha:continue
  audio,rate=sf.read(path,dtype='float32');pending.append((key,j,sha,resample_poly(audio,16000,rate)))
 if a.follow and len(pending)<a.batch_size and any(not (ROOT/j['output']).exists()for j in plan):
  time.sleep(5);continue
 if pending:
  if model is None:model=WhisperModel(a.model,device='cpu',compute_type='int8',cpu_threads=a.threads,num_workers=1)
  for offset in range(0,len(pending),a.batch_size):
   spans=[];wave=[];cursor=0
   for key,j,sha,audio in pending[offset:offset+a.batch_size]:
    spans.append(dict(key=key,expected=j['text'],reading=j['reading'],sha256=sha,start=cursor/16000,end=(cursor+len(audio))/16000,recognized=''))
    wave.extend([audio,np.zeros(16000,dtype='float32')]);cursor+=len(audio)+16000
   segments,_=model.transcribe(np.concatenate(wave),language='ja',beam_size=3,vad_filter=False,word_timestamps=True,condition_on_previous_text=False)
   for segment in segments:
    for word in segment.words:
     mid=(word.start+word.end)/2;nearest=min(spans,key=lambda s:max(s['start']-mid,0,mid-s['end']));nearest['recognized']+=word.word
   for span in spans:
    key=span.pop('key');span['seconds']=round(span.pop('end')-span.pop('start'),4);span['reading_similarity']=round(SequenceMatcher(None,norm(span['reading']),norm(span['recognized'])).ratio(),3);review['samples'][key]=span
    print(f"{len(review['samples'])}/197 {key} {span['reading_similarity']:.2f} {span['recognized']}",flush=True)
   tmp=a.report.with_suffix('.tmp');tmp.write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n');tmp.replace(a.report)
 if not a.follow or (len(review['samples'])==197 and not pending):break
 time.sleep(5)
print(f"Recognized {len(review['samples'])} current/cached clips",flush=True)
