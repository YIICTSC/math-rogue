"""Incremental CPU ASR and waveform checks; does not alter generated clips."""
import json,time,hashlib
from pathlib import Path
import numpy as np,soundfile as sf
from faster_whisper import WhisperModel
root=Path(__file__).resolve().parents[2];base=root/'assets/technique-cuts';out=base/'d2-intro-review.json';reviews=json.loads(out.read_text())if out.exists()else{}
m=WhisperModel('small',device='cpu',compute_type='int8',cpu_threads=1,num_workers=1,local_files_only=True)
while True:
 data=json.loads((base/'d2-intro-build.json').read_text())
 for key,r in data['clips'].items():
  path=root/'public'/r['path'];digest=hashlib.sha256(path.read_bytes()).hexdigest()
  if reviews.get(key,{}).get('sha256')==digest:continue
  audio,sr=sf.read(path);segments,_=m.transcribe(str(path),language='ja',beam_size=3,condition_on_previous_text=False,max_new_tokens=60)
  text=''.join(s.text for s in segments);reviews[key]={'expected':r['text'],'asr':text,'sha256':digest,'duration':len(audio)/sr,'peak':float(np.max(np.abs(audio))),'clipped_fraction':float(np.mean(np.abs(audio)>=.999)),'reference':r['reference'],'reference_sha256':r['reference_sha256']};out.write_text(json.dumps(reviews,ensure_ascii=False,indent=2)+'\n');print(key,r['text'],'=>',text,round(reviews[key]['peak'],3),flush=True)
 if len(data['clips'])==27:break
 time.sleep(20)
print('REVIEW COMPLETE',len(reviews),flush=True)
