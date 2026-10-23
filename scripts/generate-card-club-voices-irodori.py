"""Generate the authored card-club lines using inspected official Irodori on CPU.

Run in the official Irodori environment. Model and codec stay on CPU, and the
SilentCipher watermark remains enabled. Each output has a resumable recipe/hash.
"""
from __future__ import annotations
import argparse, hashlib, json, subprocess, sys, time
from contextlib import nullcontext
from datetime import datetime, timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def main():
 p=argparse.ArgumentParser();p.add_argument('--irodori-root',type=Path,default=ROOT.parent/'irodori-kocho');p.add_argument('--device',choices=['cpu'],default='cpu');p.add_argument('--threads',type=int,default=2);p.add_argument('--cpu-autocast',action='store_true');p.add_argument('--only');p.add_argument('--keys',type=Path);p.add_argument('--model');p.add_argument('--steps',type=int);p.add_argument('--seconds',type=float);p.add_argument('--extra-seconds',type=float,default=0);p.add_argument('--seed-offset',type=int,default=0);p.add_argument('--reading',action='store_true');p.add_argument('--regenerate',action='store_true');a=p.parse_args()
 sys.path.insert(0,str(a.irodori_root))
 import torch, numpy as np, soundfile as sf
 from irodori_tts.inference_runtime import InferenceRuntime,RuntimeKey,SamplingRequest,download_hf_checkpoint,save_wav
 plan=json.loads((ROOT/'assets/card-club/hero-voice-plan.json').read_text());torch.set_num_threads(a.threads)
 model_id=a.model or plan['model'];steps=a.steps or(4 if model_id.endswith('-MF')else 16);selected=set(json.loads(a.keys.read_text()))if a.keys else None
 checkpoint=download_hf_checkpoint(model_id);runtime=InferenceRuntime.from_key(RuntimeKey(checkpoint=checkpoint,model_device='cpu',codec_device='cpu'));assert runtime.watermarker.ready
 if a.cpu_autocast:
  runtime.model.to(dtype=torch.bfloat16);runtime._model_dtype=torch.bfloat16;runtime.codec.model.to(dtype=torch.bfloat16);runtime.codec.dtype=torch.bfloat16
  runtime.codec._normalize_loudness=torch.autocast('cpu',enabled=False)(runtime.codec._normalize_loudness)
  watermark=runtime.watermarker.encode_batch
  def fp32_watermark(audios,**kwargs):
   with torch.autocast('cpu',enabled=False):return watermark([x.float()for x in audios],**kwargs)
  runtime.watermarker.encode_batch=fp32_watermark
 ctx=lambda:torch.autocast('cpu',dtype=torch.bfloat16)if a.cpu_autocast else nullcontext()
 revision=subprocess.check_output(['git','-C',str(a.irodori_root),'rev-parse','HEAD'],text=True).strip();checkpoint_sha=sha(checkpoint)
 record=ROOT/'assets/card-club/hero-voice-build.json';build=json.loads(record.read_text())if record.exists()else{'clips':{}}
 build.update(upstream=plan['upstream'],irodori_revision=revision,latest_checked_at=datetime.now(timezone.utc).isoformat(),primary_model=plan['model'],model_device='cpu',codec_device='cpu',compute='cpu-bf16'if a.cpu_autocast else'cpu-fp32',torch_version=torch.__version__,cpu_threads=a.threads,silentcipher_watermark=True,model_selection=plan['model_selection'])
 build.pop('model',None);build.pop('checkpoint_sha256',None)
 build.setdefault('models',{})[model_id]={'checkpoint_sha256':checkpoint_sha,'sampler':runtime.model_cfg.flow_parameterization}
 scratch=ROOT/'tmp/card-club-voices';scratch.mkdir(parents=True,exist_ok=True)
 for hero in plan['heroes']:
  if a.only and hero['id']!=a.only:continue
  reference=ROOT/hero['reference'];assert sha(reference)==hero['reference_sha256']
  ref=scratch/(hero['id']+'-'+hero['reference_sha256'][:12]);wavref=ref.with_suffix('.wav');latent=ref.with_suffix('.pt')
  if not wavref.exists():subprocess.run(['ffmpeg','-v','error','-y','-i',str(reference),'-ac','1','-ar','44100',str(wavref)],check=True)
  if not latent.exists():
   with ctx():encoded=runtime.codec.encode_file(str(wavref))
   torch.save(encoded.float().cpu(),latent)
  for event,text in hero['lines'].items():
   ident=hero['id']+'/'+event;target=ROOT/'public/sfx/card-club-voices'/hero['id']/(event+'.ogg');target.parent.mkdir(parents=True,exist_ok=True)
   if selected is not None and ident not in selected:continue
   seed=940000+int(hashlib.sha256(ident.encode()).hexdigest()[:7],16)+a.seed_offset
   prior=build['clips'].get(ident,{})
   seconds=a.seconds or hero.get('seconds',{}).get(event)or(prior.get('seconds',0)+a.extra_seconds if a.extra_seconds else None)
   spoken=hero.get('readings',{}).get(event,text)if a.reading else text
   mode='joint'if model_id.endswith('-MF')else'independent'
   guidance=[3,3,3]if mode=='joint'else[4,2,3]
   recipe=dict(text=text,spoken_text=spoken,seconds=seconds,model=model_id,caption=hero['caption'],reference=hero['reference'],reference_sha256=hero['reference_sha256'],seed=seed,steps=steps,cfg_guidance_mode=mode,guidance=guidance,max_seconds=10)
   recipe_sha=hashlib.sha256(json.dumps(recipe,sort_keys=True,ensure_ascii=False).encode()).hexdigest();prior=build['clips'].get(ident,{})
   if not a.regenerate and target.exists()and prior.get('recipe_sha256')==recipe_sha and prior.get('irodori_revision')==revision and prior.get('sha256')==sha(target):continue
   start=time.monotonic()
   with ctx():result=runtime.synthesize(SamplingRequest(text=spoken,seconds=seconds,caption=hero['caption'],no_ref=False,ref_latent=str(latent),num_steps=steps,seed=seed,max_seconds=10,cfg_guidance_mode=mode,cfg_scale_text=guidance[0],cfg_scale_caption=guidance[1],cfg_scale_speaker=guidance[2]),log_fn=lambda _:None)
   wav=scratch/(hero['id']+'-'+event+'.wav');save_wav(wav,result.audio,result.sample_rate);data,rate=sf.read(wav)
   assert .35<len(data)/rate<9.95 and np.isfinite(data).all()and np.max(np.abs(data))>.003,ident
   temp=target.with_suffix('.tmp.ogg');subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-af','loudnorm=I=-18:TP=-1.5:LRA=7','-ac','1','-ar','44100','-c:a','libvorbis','-q:a','4',str(temp)],check=True);temp.replace(target)
   if prior:build.setdefault('history',{}).setdefault(ident,[]).append(prior)
   info=sf.info(target);build['clips'][ident]={**recipe,'recipe_sha256':recipe_sha,'checkpoint_sha256':checkpoint_sha,'output':str(target.relative_to(ROOT)),'seconds':round(info.duration,4),'sample_rate':info.samplerate,'sha256':sha(target),'model_device':'cpu','codec_device':'cpu','compute':build['compute'],'irodori_revision':revision,'silentcipher_watermark':True,'timings':dict(result.stage_timings)}
   temp_record=record.with_suffix('.tmp');temp_record.write_text(json.dumps(build,ensure_ascii=False,indent=2)+'\n');temp_record.replace(record)
   print(f"{len(build['clips'])}/104 {ident} {info.duration:.2f}s ({time.monotonic()-start:.1f}s CPU)",flush=True)
if __name__=='__main__':main()
