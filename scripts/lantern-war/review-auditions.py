"""CPU ASR and waveform/hash review. --follow reviews newly completed clips while generation runs."""
from pathlib import Path
import json,hashlib,re,argparse,fcntl,time
import numpy as np,soundfile as sf
from faster_whisper import WhisperModel
from pykakasi import kakasi
root=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--limit',type=int);p.add_argument('--model',default='small');p.add_argument('--beam-size',type=int,default=1);p.add_argument('--threads',type=int,default=1);p.add_argument('--only');p.add_argument('--recheck',action='store_true');p.add_argument('--follow',action='store_true');p.add_argument('--name-context',action='store_true',help='Provide the proper-name vocabulary, never the expected sentence, to ASR');a=p.parse_args()
path=root/'assets/lantern-war/audition-review.json';model=None;count=0;k=kakasi();checked=set()
from voice_review_rules import assess

try:
 while True:
  build=json.loads((root/'assets/lantern-war/audition-build.json').read_text());review=json.loads(path.read_text())if path.exists()else{'device':'cpu','clips':{}};made=0
  for ident,c in build['clips'].items():
   if a.only and not set(a.only.split(','))&{ident,c['speaker']}:continue
   file=root/'public'/c['path'];digest=hashlib.sha256(file.read_bytes()).hexdigest()
   if digest!=c['sha256']:
    if a.follow:continue
    raise ValueError('Voice file/record hash mismatch: '+ident)
   old=review['clips'].get(ident,{})
   if (ident,digest)in checked or old.get('sha256')==digest and not(a.recheck and old.get('needs_review')):continue
   if a.limit is not None and count>=a.limit:break
   if model is None:model=WhisperModel(a.model,device='cpu',compute_type='int8',cpu_threads=a.threads,num_workers=1,local_files_only=True)
   data,rate=sf.read(file);duration=len(data)/rate;assert .3<duration<15.5 and np.isfinite(data).all()and .002<np.sqrt(np.mean(data**2))<.6
   name_context=('登場人物の名前：'+c['text'].split('、')[0]+'。')if a.name_context and c.get('kind')=='support-name'else None
   segments,_=model.transcribe(str(file),initial_prompt=name_context,language='ja',beam_size=a.beam_size,condition_on_previous_text=False,vad_filter=False);heard=''.join(s.text for s in segments).strip();assessment=assess(c,heard);expected=assessment['expected'];cer=assessment['cer'];issue=assessment['needs_review']
   entry={**assessment,'speaker':c['speaker'],'expected':expected,'heard':heard,'cer':cer,'needs_review':issue,'sha256':digest,'duration':duration,'model':a.model,'name_context':name_context,'previous':old or None}
   with path.with_suffix('.lock').open('w')as lock:
    fcntl.flock(lock,fcntl.LOCK_EX);current=json.loads(path.read_text())if path.exists()else{'device':'cpu','clips':{}};current['clips'][ident]=entry;tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(current,ensure_ascii=False,indent=2)+'\n');tmp.replace(path);fcntl.flock(lock,fcntl.LOCK_UN)
   checked.add((ident,digest));count+=1;made+=1;print('REVIEW'if issue else'OK',ident,expected,'=>',heard,cer,flush=True)
  if not a.follow or a.limit is not None and count>=a.limit:break
  if not made:time.sleep(3)
except KeyboardInterrupt:pass
review=json.loads(path.read_text());print('Reviewed',len(review['clips']),'flagged',sum(x['needs_review']for x in review['clips'].values()),flush=True)
