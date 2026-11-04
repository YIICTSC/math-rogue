"""Resumable CPU ASR + waveform verification; no synthesis runs while ASR holds the lock."""
import argparse,fcntl,hashlib,json,sys
from pathlib import Path
import numpy as np,soundfile as sf
from faster_whisper import WhisperModel
from voice_review_rules import normalize,names,dictionary_sha
from banter_review_rules import assess,VERSION,content_fingerprint
from banter_asr_evidence import token_limit_reached
root=Path(__file__).resolve().parents[2];base=root/'assets/lantern-war/banter'
p=argparse.ArgumentParser();p.add_argument('--model',choices=['small','medium'],default='small');p.add_argument('--only',type=Path);p.add_argument('--force',action='store_true');p.add_argument('--limit',type=int);a=p.parse_args()
lock=(root/'assets/lantern-war/cpu-audio-heavy.lock').open('a');fcntl.flock(lock,fcntl.LOCK_EX)
plan=json.loads((base/'voice-plan.json').read_text());build=json.loads((base/'voice-build.json').read_text());file=base/'voice-review.json';review=json.loads(file.read_text())if file.exists()else{'device':'cpu','clips':{}};selected=set(json.loads(a.only.read_text()))if a.only else None
requirements=json.loads((base/'voice-corrections.json').read_text())if(base/'voice-corrections.json').exists()else{}
model=None;count=0
for c in plan['clips']:
 if selected is not None and c['id']not in selected:continue
 record=build['clips'].get(c['id']);path=root/'public'/c['path']
 if not record or not path.exists():continue
 digest=hashlib.sha256(path.read_bytes()).hexdigest();assert digest==record['sha256'];old=review['clips'].get(c['id'])
 reusable=not a.force and old and old['sha256']==digest and old.get('banter_review_rules') in (1,2,3,4,5,VERSION)
 if reusable and old.get('dictionary_sha256')==dictionary_sha and old.get('banter_review_rules')==VERSION and old.get('content_requirements_sha256')==content_fingerprint(requirements.get(c['id'],{})):continue
 if a.limit is not None and count>=a.limit:break
 if not reusable and model is None:model=WhisperModel(a.model,device='cpu',compute_type='int8',cpu_threads=2,num_workers=1,local_files_only=True)
 data,rate=sf.read(path);duration=len(data)/rate;peak=float(np.max(np.abs(data)));rms=float(np.sqrt(np.mean(data**2)));clipped=float(np.mean(np.abs(data)>=.999));wave_ok=bool(np.isfinite(data).all()and .3<duration<24.9 and .005<rms<.45 and peak<1 and clipped<.001)
 if reusable:heard=old['heard'];limited=old.get('asr_token_limit_hit',False)
 else:
  limit=64 if c['kind']=='banter-reply' else 160;print('ASR START',c['id'],flush=True);segments,_=model.transcribe(str(path),language='ja',beam_size=3,condition_on_previous_text=False,vad_filter=False,max_new_tokens=limit);segments=list(segments);heard=''.join(s.text for s in segments).strip();limited=token_limit_reached(segments,limit)
 assessment=assess({**record,'cue':c.get('cue')},heard,requirements.get(c['id'],{}));assessment['asr_token_limit_hit']=limited;assessment['needs_review']=assessment['needs_review']or limited;required=[n for n in [*names,'ミレア','カイ','ヴェスパー','セーブル']if n in c['text']];missing=[n for n in required if normalize(n).replace('ー','')not in normalize(heard).replace('ー','')];assessment.update(required_names=required,missing_names=missing);assessment['needs_review']=assessment['needs_review']or assessment['cer']>.18 or bool(missing)
 if reusable and old.get('manual_review_reason'):assessment.update(needs_review=True,manual_review_reason=old['manual_review_reason'])
 if reusable and old.get('model')=='kotoba-v2' and old.get('japanese_review'):
  evidence={**old['japanese_review'],**assessment,'heard':heard};assessment['japanese_review']=evidence
 review['clips'][c['id']]={**assessment,'speaker':c['speaker'],'text':c['text'],'heard':heard,'sha256':digest,'duration':round(duration,4),'peak':peak,'rms':rms,'clipped_fraction':clipped,'wave_ok':wave_ok,'needs_review':assessment['needs_review']or not wave_ok,'model':old['model'] if reusable else a.model,'previous':old if a.force or reusable else None};tmp=file.with_suffix('.tmp');tmp.write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n');tmp.replace(file);count+=1
 print('REVIEW'if review['clips'][c['id']]['needs_review']else'OK',c['id'],c['text'],'=>',heard,flush=True)
print('REVIEWED',len(review['clips']),'FLAGGED',sum(v['needs_review']for v in review['clips'].values()),flush=True)
