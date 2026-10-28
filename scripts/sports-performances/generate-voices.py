"""Resumable official Irodori sports voices. Model, codec and watermark run on CPU."""
from __future__ import annotations
import argparse,hashlib,json,subprocess,sys,time,gc,ctypes,re
from pathlib import Path
from contextlib import nullcontext
ROOT=Path(__file__).resolve().parents[2]
def sha(p):
 h=hashlib.sha256()
 with Path(p).open('rb')as stream:
  for chunk in iter(lambda:stream.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()
def main():
 p=argparse.ArgumentParser();p.add_argument('--device',choices=['cpu'],default='cpu');p.add_argument('--threads',type=int,default=2);p.add_argument('--limit',type=int);p.add_argument('--only');p.add_argument('--model');p.add_argument('--regenerate',action='store_true');p.add_argument('--retakes',type=Path);p.add_argument('--design-reference');p.add_argument('--design-reference-only',action='store_true');p.add_argument('--seconds',type=float);p.add_argument('--extra-seconds',type=float,default=0);p.add_argument('--seed-offset',type=int,default=0);p.add_argument('--steps',type=int,choices=[4,8,16,32]);a=p.parse_args();selected=set(json.loads(a.retakes.read_text()))if a.retakes else None
 plan=json.loads((ROOT/'assets/sports-performances/voice-plan.json').read_text())
 groups={v.get('model',plan['model'])for v in [*plan['voices'],plan['referee'],*plan.get('voice_profiles',[])]if not a.only or v['id']==a.only}
 if not a.model and len(groups)>1:
  for group in sorted(groups):subprocess.run([sys.executable,__file__,*sys.argv[1:],'--model',group],check=True)
  return
 model_repo=a.model or next(iter(groups))
 irodori=ROOT.parent/'Irodori-TTS';sys.path.insert(0,str(irodori))
 import torch,numpy as np,soundfile as sf
 from pykakasi import kakasi
 kana=kakasi()
 from irodori_tts.inference_runtime import InferenceRuntime,RuntimeKey,SamplingRequest,download_hf_checkpoint,save_wav
 from huggingface_hub import hf_hub_download
 torch.set_num_threads(a.threads);torch.set_num_interop_threads(1)
 plan=json.loads((ROOT/'assets/sports-performances/voice-plan.json').read_text());checkpoint=download_hf_checkpoint(model_repo)
 runtime=InferenceRuntime.from_key(RuntimeKey(checkpoint=checkpoint,model_device='cpu',codec_device='cpu'));assert runtime.watermarker.ready
 runtime.model.to(dtype=torch.bfloat16);runtime._model_dtype=torch.bfloat16;runtime.codec.model.to(dtype=torch.bfloat16);runtime.codec.dtype=torch.bfloat16
 runtime.codec._normalize_loudness=torch.autocast('cpu',enabled=False)(runtime.codec._normalize_loudness)
 watermark=runtime.watermarker.encode_batch
 def fp32_watermark(audios,**kwargs):
  with torch.autocast('cpu',enabled=False):return watermark([x.float()for x in audios],**kwargs)
 runtime.watermarker.encode_batch=fp32_watermark
 ctx=lambda:torch.autocast('cpu',dtype=torch.bfloat16)
 gc.collect();ctypes.CDLL(None).malloc_trim(0)
 revision=subprocess.check_output(['git','-C',str(irodori),'rev-parse','HEAD'],text=True).strip();record=ROOT/'assets/sports-performances/voice-build.json';build=json.loads(record.read_text())if record.exists()else{'clips':{}}
 build.pop('steps',None)
 codec=Path(hf_hub_download(repo_id=runtime.key.codec_repo,filename='weights.pth',local_files_only=True))
 run_metadata=dict(model=model_repo,model_revision=Path(checkpoint).parent.name,checkpoint_sha256=sha(checkpoint),irodori_revision=revision,model_device='cpu',codec_device='cpu',compute='cpu-bf16',torch_version=torch.__version__,cpu_threads=a.threads,steps_policy='per-clip',silentcipher_watermark=True,codec={'model':runtime.key.codec_repo,'revision':codec.parent.name,'sha256':sha(codec)},latest_checked_at=plan['latest_checked_at'],model_selection=plan['model_selection'])
 build.setdefault('models',{})[model_repo]=run_metadata
 for clip in build['clips'].values():clip.setdefault('model',plan['model'])
 if model_repo==plan['model']:build.update(run_metadata)
 scratch=ROOT/'tmp/sports-voices';scratch.mkdir(parents=True,exist_ok=True);output=ROOT/'public/sfx/sports';output.mkdir(parents=True,exist_ok=True)
 gc.collect();ctypes.CDLL(None).malloc_trim(0)
 def save():
  t=record.with_suffix('.tmp');t.write_text(json.dumps(build,ensure_ascii=False,indent=2)+'\n');t.replace(record)
 generated=0
 speakers=[*plan['voices'],plan['referee'],*plan.get('voice_profiles',[])]
 # VoiceDesign establishes one reusable reference for each of the 8 custom voices and the official.
 for speaker in sorted(speakers,key=lambda s:0 if 'preview'in s else 1):
  ident=speaker['id']
  if speaker.get('model',plan['model'])!=model_repo:continue
  if a.only and ident!=a.only:continue
  if selected is not None and not any(k.startswith(speaker.get('output_id',ident)+'/')for k in selected):continue
  if a.design_reference==ident:
   reference=ROOT/speaker['reference'];reference.parent.mkdir(parents=True,exist_ok=True)
   if not reference.exists():
    with ctx():result=runtime.synthesize(SamplingRequest(text=speaker['reference_text'],seconds=None,caption=speaker['caption'],no_ref=True,num_steps=8,seed=744801,max_seconds=12,cfg_guidance_mode='joint',cfg_scale_text=3,cfg_scale_caption=3,cfg_scale_speaker=3),log_fn=lambda _:None)
    wav=scratch/(ident+'-designed-reference.wav');save_wav(wav,result.audio,result.sample_rate)
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-af','loudnorm=I=-18:TP=-1.5:LRA=7,apad=pad_dur=0.12','-ac','1','-ar','44100','-c:a','libvorbis','-q:a','4',str(reference)],check=True)
   speaker['reference_sha256']=sha(reference)
   if build.get('reference_designs',{}).get(ident,{}).get('sha256')!=speaker['reference_sha256']:build.setdefault('reference_designs',{})[ident]={'output':speaker['reference'],'sha256':speaker['reference_sha256'],'text':speaker['reference_text'],'caption':speaker['caption'],'seed':744801,'steps':8,'model_device':'cpu','codec_device':'cpu','silentcipher_watermark':True}
   plan_path=ROOT/'assets/sports-performances/voice-plan.json';temp=plan_path.with_suffix('.tmp');temp.write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n');temp.replace(plan_path);save()
   if a.design_reference_only:return
  is_design='preview'in speaker
  jobs=[('preview',speaker['preview'])]if is_design else []
  for sport,lines in speaker['lines'].items():jobs.extend((sport+'/'+event,text)for event,text in lines.items())
  if not is_design:
   reference=ROOT/speaker['reference'];assert sha(reference)==speaker['reference_sha256'];ref_wav=scratch/(ident+'-'+speaker['reference_sha256'][:12]+'-ref.wav')
   if not ref_wav.exists():subprocess.run(['ffmpeg','-v','error','-y','-i',str(reference),'-ac','1','-ar','44100',str(ref_wav)],check=True)
  else:ref_wav=output/ident/'preview.ogg'
  latent=scratch/(ident+'-ref.pt')
  for event,text in jobs:
   key=speaker.get('output_id',ident)+'/'+event
   if any(profile.get('output_id')==ident and event.split('/')[0] in profile['lines'] for profile in plan.get('voice_profiles',[])):continue
   target_ident=speaker.get('output_id',ident)
   if selected is not None and key not in selected:continue
   target=output/target_ident/(event+'.ogg');target.parent.mkdir(parents=True,exist_ok=True)
   override=plan.get('clip_overrides',{}).get(key,{});steps=a.steps or override.get('steps',4);offset=a.seed_offset or override.get('seed_offset',0)
   caption=speaker['caption'];spoken=speaker.get('readings',{}).get(event.split('/')[0],{}).get(event.split('/')[-1],text);reading=''.join(v['hira']for v in kana.convert(spoken));moras=len(re.sub(r'[^ぁ-ゖー]|[ゃゅょぁぃぅぇぉ]','',reading));seconds=a.seconds or override.get('seconds') or round(max(.8,min(5.5,.15*moras+.45+a.extra_seconds)),2);seed=730000+int(hashlib.sha256(key.encode()).hexdigest()[:7],16)+offset
   reference_sha=sha(ref_wav)if ref_wav.exists()and event!='preview'else None
   if event!='preview':latent=scratch/(ident+'-'+reference_sha[:12]+'-ref.pt')
   if speaker.get('auto_duration') and not a.seconds:seconds=None
   recipe=dict(model=model_repo,text=text,spoken_text=spoken,seconds=seconds,caption=caption,seed=seed,reference_sha256=reference_sha,model_revision=run_metadata['model_revision'],irodori_revision=revision,steps=steps,guidance=[3,3,3],max_seconds=6)
   digest=hashlib.sha256(json.dumps(recipe,sort_keys=True,ensure_ascii=False).encode()).hexdigest();prior=build['clips'].get(key,{})
   if target.exists()and not a.regenerate and prior.get('sha256')==sha(target)and(prior.get('recipe_sha256')==digest or not(a.seconds or a.extra_seconds or a.seed_offset)and all(prior.get(k)==recipe[k]for k in ['text','caption','seed','reference_sha256','model_revision','irodori_revision','steps'])):continue
   if a.limit is not None and generated>=a.limit:return
   start=time.monotonic()
   if event!='preview'and not latent.exists():
    with ctx():encoded=runtime.codec.encode_file(str(ref_wav))
    torch.save(encoded.float().cpu(),latent)
   with ctx():result=runtime.synthesize(SamplingRequest(text=spoken,seconds=seconds,caption=caption,no_ref=event=='preview',ref_latent=str(latent)if event!='preview'else None,num_steps=steps,seed=seed,max_seconds=6,cfg_guidance_mode='joint',cfg_scale_text=3,cfg_scale_caption=3,cfg_scale_speaker=3),log_fn=lambda _:None)
   wav=scratch/(key.replace('/','-')+'.wav');save_wav(wav,result.audio,result.sample_rate);data,rate=sf.read(wav)
   assert .35<len(data)/rate<5.98 and np.isfinite(data).all()and np.max(np.abs(data))>.003,key
   temp=target.with_suffix('.tmp.ogg');subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-af',f'loudnorm=I=-18:TP=-1.5:LRA=7,afade=t=out:st={len(data)/rate-.035:.5f}:d=0.035,apad=pad_dur=0.12','-ac','1','-ar','44100','-c:a','libvorbis','-q:a','4',str(temp)],check=True);temp.replace(target)
   info=sf.info(target);build['clips'][key]={**recipe,'recipe_sha256':digest,'output':str(target.relative_to(ROOT)),'seconds':round(info.duration,4),'sample_rate':info.samplerate,'sha256':sha(target),'model_device':'cpu','codec_device':'cpu','silentcipher_watermark':True,'timings':dict(result.stage_timings)};save();generated+=1
   print(f"{len(build['clips'])}/{sum(1+sum(map(len,v['lines'].values())) if 'preview'in v else sum(map(len,v['lines'].values()))for v in speakers)} {key} {info.duration:.2f}s ({time.monotonic()-start:.1f}s CPU)",flush=True)
if __name__=='__main__':main()
