"""CPU-only Japanese ASR arbitration after medium; only exact phonemes rescue a clip."""
import json,hashlib,fcntl,sys
from pathlib import Path
from faster_whisper import WhisperModel
from huggingface_hub import snapshot_download
from banter_asr_evidence import REPOSITORY,REVISION,can_rescue,cached_evidence,has_review_model,token_limit_reached
from banter_review_rules import assess,VERSION,content_fingerprint
from voice_review_rules import normalize,names,dictionary_sha

root=Path(__file__).resolve().parents[2];base=root/'assets/lantern-war/banter'
lock=(root/'assets/lantern-war/cpu-audio-heavy.lock').open('a');fcntl.flock(lock,fcntl.LOCK_EX)
load=lambda name:json.loads((base/(name+'.json')).read_text())
plan=load('voice-plan');build=load('voice-build')['clips'];review=load('voice-review');corrections=load('voice-corrections');model=None;rescued=0;checked=0
pilot=load('kotoba-pilot')if(base/'kotoba-pilot.json').exists()else{}
pilot_rows={v['id']:v for v in pilot.get('clips',[])}if pilot.get('model')==REPOSITORY and pilot.get('model_revision')==REVISION and pilot.get('device')=='cpu'and pilot.get('no_expected_text_prompt')is True else{}
fallbacks=load('fallbacks')['clips'] if (base/'fallbacks.json').exists() else {}
for c in plan['clips']:
 i=c['id']
 if i in fallbacks:continue
 b=build.get(i);old=review['clips'].get(i)
 if not b or not old or old.get('sha256')!=b['sha256']or not old.get('needs_review')or not old.get('wave_ok'):continue
 digest=b['sha256']
 if not has_review_model(old,digest,'medium'):continue
 path=root/'public'/c['path'];assert hashlib.sha256(path.read_bytes()).hexdigest()==digest
 prior=cached_evidence(old,digest);requirements=corrections.get(i,{});fingerprint=content_fingerprint(requirements)
 if prior and prior.get('dictionary_sha256')==dictionary_sha and prior.get('banter_review_rules')==VERSION and prior.get('content_requirements_sha256')==fingerprint:continue
 row=pilot_rows.get(i,{})
 if prior:heard=prior['heard'];limited=prior.get('asr_token_limit_hit',False)
 elif row.get('sha256')==digest and row.get('speaker')==c['speaker']and row.get('text')==c['text']:heard=row['heard'];limited=False
 else:
  if model is None:
   folder=snapshot_download(REPOSITORY,revision=REVISION,local_files_only=True,allow_patterns=['model.bin','config.json','preprocessor_config.json','tokenizer.json','vocabulary.json'])
   model=WhisperModel(folder,device='cpu',compute_type='int8',cpu_threads=2,num_workers=1,local_files_only=True)
  limit=64 if c['kind']=='banter-reply' else 160;print('JAPANESE ASR START',i,flush=True);segments,_=model.transcribe(str(path),language='ja',beam_size=5,condition_on_previous_text=False,vad_filter=False,max_new_tokens=limit);segments=list(segments);heard=''.join(s.text for s in segments).strip();limited=token_limit_reached(segments,limit)
 result=assess({**b,'cue':c.get('cue')},heard,requirements);result['asr_token_limit_hit']=limited;result['needs_review']=result['needs_review']or limited
 required=[n for n in [*names,'ミレア','カイ','ヴェスパー','セーブル']if n in c['text']];missing=[n for n in required if normalize(n).replace('ー','')not in normalize(heard).replace('ー','')]
 result.update(required_names=required,missing_names=missing);result['needs_review']=result['needs_review']or bool(missing)
 evidence={**result,'sha256':digest,'heard':heard,'repository':REPOSITORY,'revision':REVISION,'device':'cpu','compute_type':'int8','threads':2,'beam_size':5,'expected_text_prompt':False}
 if can_rescue(result,old['wave_ok'],bool(old.get('manual_review_reason'))):
  review['clips'][i]={**old,**result,'heard':heard,'model':'kotoba-v2','previous':old,'japanese_review':evidence};rescued+=1
  print('RESCUED EXACT',i,c['text'],'=>',heard,flush=True)
 else:
  review['clips'][i]={**old,'japanese_review':evidence}
  print('STILL REVIEW',i,c['text'],'=>',heard,flush=True)
 file=base/'voice-review.json';tmp=file.with_suffix('.tmp');tmp.write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n');tmp.replace(file);checked+=1
print('JAPANESE ASR CHECKED',checked,'EXACT RESCUES',rescued,flush=True)
