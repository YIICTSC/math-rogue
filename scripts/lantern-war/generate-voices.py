"""Resumable, seeded, CPU-only official Irodori generation with per-actor reference latents."""
import sys,json,hashlib,subprocess,time,gc,ctypes,datetime,argparse,fcntl
from pathlib import Path
r=Path(__file__).resolve().parents[2];sys.path.insert(0,str(r.parent/'Irodori-TTS'))
generation_lock=(r/'assets/lantern-war/generation.lock').open('w');fcntl.flock(generation_lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
p=argparse.ArgumentParser();p.add_argument('--batch-size',type=int,default=2);p.add_argument('--only');p.add_argument('--limit',type=int);p.add_argument('--retakes',type=Path);p.add_argument('--seed-offset',type=int);args=p.parse_args()
import torch,numpy as np,soundfile as sf
from pykakasi import kakasi
from huggingface_hub import HfApi
from irodori_tts.inference_runtime import InferenceRuntime,RuntimeKey,SamplingRequest,download_hf_checkpoint,save_wav
plan=json.loads((r/'assets/lantern-war/voice-plan.json').read_text());model=plan['model'];revision=HfApi().model_info(model).sha;code=subprocess.check_output(['git','-C',str(r.parent/'Irodori-TTS'),'rev-parse','HEAD'],text=True).strip();torch.set_num_threads(2);torch.set_num_interop_threads(1)
rt=InferenceRuntime.from_key(RuntimeKey(checkpoint=download_hf_checkpoint(model),model_device='cpu',codec_device='cpu'));rt.model.to(dtype=torch.bfloat16);rt._model_dtype=torch.bfloat16;rt.codec.model.to(dtype=torch.bfloat16);rt.codec.dtype=torch.bfloat16
rt.codec._normalize_loudness=torch.autocast('cpu',enabled=False)(rt.codec._normalize_loudness);watermark=rt.watermarker.encode_batch
def mark(audios,**kw):
 with torch.autocast('cpu',enabled=False):return watermark([x.float()for x in audios],**kw)
rt.watermarker.encode_batch=mark;assert rt.watermarker.ready
scratch=r/'tmp/lantern-voices';scratch.mkdir(parents=True,exist_ok=True);record=r/'assets/lantern-war/voice-build.json';b=json.loads(record.read_text())if record.exists()else {'clips':{},'references':{}};b.update(model=model,model_revision=revision,irodori_revision=code,model_device='cpu',codec_device='cpu',compute='bf16',threads=2,steps=4,silentcipher_watermark=True,latest_checked_at=datetime.datetime.now(datetime.timezone.utc).isoformat());kana=kakasi();selected=set(json.loads(args.retakes.read_text()))if args.retakes else None;made=0
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
def save():
 t=record.with_suffix('.tmp');t.write_text(json.dumps(b,ensure_ascii=False,indent=2)+'\n');t.replace(record)
def deliver(result,target):
 wav=scratch/'output.wav';save_wav(wav,result.audio,result.sample_rate);data,rate=sf.read(wav);assert .3<len(data)/rate<14.9 and np.isfinite(data).all()and np.max(np.abs(data))>.003
 target.parent.mkdir(parents=True,exist_ok=True);tmp=target.with_suffix('.tmp.ogg');subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-af',f'loudnorm=I=-18:TP=-1.5:LRA=7,afade=t=out:st={max(0,len(data)/rate-.04):.4f}:d=0.04,apad=pad_dur=0.12','-ac','1','-ar','44100','-c:a','libvorbis','-q:a','4',str(tmp)],check=True);tmp.replace(target);return sf.info(target).duration
for speaker,v in plan['speakers'].items():
 if args.only and args.only!=speaker:continue
 jobs=[c for c in plan['clips']if c['speaker']==speaker and(selected is None or c['id']in selected)]
 if not jobs:continue
 reference=r/v['reference']
 if not reference.exists():
  print('DESIGN',speaker,flush=True)
  with torch.autocast('cpu',dtype=torch.bfloat16):result=rt.synthesize(SamplingRequest(text=v['design_text'],caption=v['caption'],no_ref=True,seconds=None,num_steps=8,seed=911007+list(plan['speakers']).index(speaker),max_seconds=14),log_fn=lambda _:None)
  deliver(result,reference);v['reference_sha256']=sha(reference);t=r/'assets/lantern-war/voice-plan.json';t.write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
 digest=sha(reference);assert digest==v['reference_sha256'];b['references'][speaker]={'path':v['reference'],'sha256':digest,'caption':v['caption'],'designed':bool(v.get('design_text'))};save();latent=scratch/(speaker+'-'+digest[:12]+'.pt')
 if not latent.exists():
  with torch.autocast('cpu',dtype=torch.bfloat16):encoded=rt.codec.encode_file(str(reference))
  torch.save(encoded.float().cpu(),latent);del encoded
 pending=[]
 def flush():
  global made
  if not pending:return
  start=time.monotonic();requests=[]
  for c,recipe,recipe_sha,target in pending:
   print('START',speaker,c['id'],c['text'],flush=True)
   requests.append(SamplingRequest(text=recipe['spoken_text'],caption=recipe['caption'],ref_latent=str(latent),num_steps=recipe['steps'],seed=recipe['seed'],seconds=recipe['seconds_requested'],max_seconds=14))
  with torch.autocast('cpu',dtype=torch.bfloat16):results=rt.synthesize_batch(requests,log_fn=lambda _:None)
  members=[job[0]['id']for job in pending]
  for(c,recipe,recipe_sha,target),result in zip(pending,results):
   duration=deliver(result,target);b['clips'][c['id']]={**recipe,'path':c['path'],'kind':c['kind'],'recipe_sha256':recipe_sha,'sha256':sha(target),'duration':round(duration,4),'model_device':'cpu','codec_device':'cpu','batch_members':members};save();made+=1;print('DONE',len(b['clips']),'/',len(plan['clips']),c['id'],round(time.monotonic()-start,1),'s CPU batch',len(pending),flush=True)
  pending.clear();del results;gc.collect();ctypes.CDLL(None).malloc_trim(0)
 for c in jobs:
  corrections=r/'assets/lantern-war/voice-corrections.json'
  try:live=json.loads(corrections.read_text())if corrections.exists()else{}
  except json.JSONDecodeError:live={}
  override={**plan.get('clip_overrides',{}).get(c['id'],{}),**live.get(c['id'],{})};steps=override.get('steps',4);spoken=override.get('spoken_text',c['text']);seed=910000+int(c['id'][:7],16)+(args.seed_offset if args.seed_offset is not None else override.get('seed_offset',0));target=r/'public'/c['path'];text=c['text'];reading=''.join(x['hira']for x in kana.convert(text));seconds=override.get('seconds',round(max(1.4,min(12.5,len(reading)*.125+.5)),2))
  recipe={'text':text,'speaker':speaker,'caption':override.get('caption',v['caption']),'seed':seed,'reference_sha256':digest,'seconds_requested':seconds,'model_revision':revision,'steps':steps,'spoken_text':spoken};recipe_sha=hashlib.sha256(json.dumps(recipe,sort_keys=True,ensure_ascii=False).encode()).hexdigest();prior=b['clips'].get(c['id'],{})
  if target.exists()and prior.get('sha256')==sha(target) and (prior.get('recipe_sha256')==recipe_sha or all(prior.get(k)==recipe[k]for k in ['text','speaker','caption','seed','reference_sha256','seconds_requested','model_revision','steps']) and prior.get('spoken_text',prior.get('text'))==spoken):continue
  if pending and pending[0][1]['steps']!=steps:flush()
  if args.limit is not None and made+len(pending)>=args.limit:flush();sys.exit(0)
  pending.append((c,recipe,recipe_sha,target))
  if len(pending)>=max(1,min(2,args.batch_size)):flush()
 flush()
print('COMPLETE',len(b['clips']),flush=True)
