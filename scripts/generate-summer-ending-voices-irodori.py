"""Resumable CPU generation of the 197 authored summer-ending dialogue lines.

Use the official Irodori environment; keep codec/model on CPU and retain watermarks.
References and output names come only from the reviewed, exported voice plan.
"""
from __future__ import annotations
import argparse, hashlib, importlib.util, json, subprocess, sys, time
from contextlib import nullcontext
from datetime import datetime, timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def sha(path):
 digest=hashlib.sha256()
 with Path(path).open('rb')as source:
  for chunk in iter(lambda:source.read(1024*1024),b''):digest.update(chunk)
 return digest.hexdigest()
def key(job): return f"{job['theme']}/{job['heroId']}/{job['lineId']}"
def main():
 p=argparse.ArgumentParser()
 p.add_argument('--irodori-root',type=Path,default=ROOT.parent/'irodori-kocho')
 p.add_argument('--model',default='Aratako/Irodori-TTS-v4.1-Small-MF')
 p.add_argument('--device',default='cpu',choices=['cpu'])
 p.add_argument('--threads',type=int,default=2)
 p.add_argument('--steps',type=int,default=4)
 p.add_argument('--cpu-autocast',action='store_true')
 p.add_argument('--keys',type=Path)
 p.add_argument('--reading',action='store_true',help='Use the manually authored phonetic reading for repair')
 p.add_argument('--extend-seconds',type=float,default=0,help='Add time to an existing clip for intact ending repairs')
 p.add_argument('--seed-offset',type=int,default=0)
 p.add_argument('--regenerate',action='store_true')
 a=p.parse_args()
 sys.path.insert(0,str(a.irodori_root))
 import torch,numpy as np,soundfile as sf
 from irodori_tts.inference_runtime import InferenceRuntime,RuntimeKey,SamplingRequest,download_hf_checkpoint,save_wav
 spec=importlib.util.spec_from_file_location('ending_captions',ROOT/'scripts/generate-protagonist-ending-voices-v4.py');captions=importlib.util.module_from_spec(spec);spec.loader.exec_module(captions)
 jobs=json.loads((ROOT/'assets/ending-expansion/voice-plan.json').read_text())['jobs']
 selected=set(json.loads(a.keys.read_text()))if a.keys else None
 assert len(jobs)==197 and len({key(j)for j in jobs})==197
 for j in jobs:
  assert sha(ROOT/j['reference'])==j['referenceSha256'],key(j)
  assert j['lineId'].startswith('vacation-') and (ROOT/j['output']).resolve().is_relative_to(ROOT/'public/sfx')
 torch.set_num_threads(a.threads)
 checkpoint=download_hf_checkpoint(a.model)
 runtime=InferenceRuntime.from_key(RuntimeKey(checkpoint=checkpoint,model_device='cpu',codec_device='cpu'))
 assert runtime.watermarker.ready,'Watermark unavailable'
 if a.cpu_autocast:
  runtime.model.to(dtype=torch.bfloat16);runtime._model_dtype=torch.bfloat16
  runtime.codec.model.to(dtype=torch.bfloat16);runtime.codec.dtype=torch.bfloat16
  runtime.codec._normalize_loudness=torch.autocast('cpu',enabled=False)(runtime.codec._normalize_loudness)
  watermark=runtime.watermarker.encode_batch
  def fp32_watermark(audios,**kwargs):
   with torch.autocast('cpu',enabled=False):return watermark([x.float()for x in audios],**kwargs)
  runtime.watermarker.encode_batch=fp32_watermark
 ctx=lambda:torch.autocast('cpu',dtype=torch.bfloat16)if a.cpu_autocast else nullcontext()
 scratch=ROOT/'tmp/summer-ending-voice-source';scratch.mkdir(parents=True,exist_ok=True)
 record=ROOT/'assets/ending-expansion/voice-build.json'
 build=json.loads(record.read_text())if record.exists()else{'clips':{}}
 revision=subprocess.check_output(['git','-C',str(a.irodori_root),'rev-parse','HEAD'],text=True).strip()
 checkpoint_sha=sha(checkpoint)
 build.update(upstream_url='https://github.com/Aratako/Irodori-TTS',irodori_revision=revision,latest_checked_at=datetime.now(timezone.utc).isoformat(),model_device='cpu',codec_device='cpu',compute='cpu-bf16'if a.cpu_autocast else'cpu-fp32',torch_version=torch.__version__,cpu_threads=a.threads,silentcipher_watermark=True,voice_jobs_sha256=hashlib.sha256(json.dumps(jobs,ensure_ascii=False,sort_keys=True).encode()).hexdigest())
 build.setdefault('models',{})[a.model]={'checkpoint_sha256':checkpoint_sha,'snapshot':str(checkpoint).split('/snapshots/')[-1].split('/')[0],'sampler':runtime.model_cfg.flow_parameterization}
 for job in jobs:
  ident=key(job)
  if selected is not None and ident not in selected:continue
  target=ROOT/job['output'];target.parent.mkdir(parents=True,exist_ok=True)
  caption=(captions.HIGH_SCHOOL_CAPTIONS if job['theme']=='high-school'else captions.MAGIC_CAPTIONS)[job['heroId']]
  caption+=' 夏の冒険を終えた本人の会話。自然な日本語で、一語ずつ明瞭に、温かな余韻を込める。ナレーションではなく相手に話しかける。'
  text=job['reading']if a.reading else job['text']
  seed=620000+int(hashlib.sha256(ident.encode()).hexdigest()[:7],16)+a.seed_offset
  prior=build['clips'].get(ident,{})
  seconds=prior.get('seconds',0)+a.extend_seconds if a.extend_seconds else None
  recipe=dict(text=job['text'],spoken_text=text,reading=job['reading'],caption=caption,reference=job['reference'],reference_sha256=job['referenceSha256'],seed=seed,model=a.model,steps=a.steps,seconds=seconds,max_seconds=16,cfg_mode='independent'if a.steps>4 else'joint',guidance=[4,2,3]if a.steps>4 else[3,3,3])
  recipe_sha=hashlib.sha256(json.dumps(recipe,ensure_ascii=False,sort_keys=True).encode()).hexdigest()
  prior=build['clips'].get(ident,{})
  if not a.regenerate and target.exists() and prior.get('text')==job['text'] and prior.get('reading')==job['reading'] and prior.get('reference_sha256')==job['referenceSha256'] and prior.get('irodori_revision')==revision and prior.get('sha256')==sha(target):continue
  start=time.monotonic();ref=scratch/f"{job['theme']}-{job['heroId']}-{job['referenceSha256'][:12]}";wavref=ref.with_suffix('.wav');latent=ref.with_suffix('.pt')
  if not wavref.exists():subprocess.run(['ffmpeg','-v','error','-y','-i',str(ROOT/job['reference']),'-ac','1','-ar','44100',str(wavref)],check=True)
  if not latent.exists():
   with ctx():encoded=runtime.codec.encode_file(str(wavref))
   torch.save(encoded.float().cpu(),latent)
  with ctx():result=runtime.synthesize(SamplingRequest(text=text,caption=caption,no_ref=False,ref_latent=str(latent),num_steps=a.steps,seed=seed,seconds=seconds,max_seconds=16,cfg_guidance_mode=recipe['cfg_mode'],cfg_scale_text=recipe['guidance'][0],cfg_scale_caption=recipe['guidance'][1],cfg_scale_speaker=recipe['guidance'][2]),log_fn=lambda _:None)
  wav=scratch/f"{job['theme']}-{job['heroId']}-{job['lineId']}.wav";save_wav(wav,result.audio,result.sample_rate)
  audio,rate=sf.read(wav)
  assert .35<len(audio)/rate<15.95 and np.isfinite(audio).all()and np.max(np.abs(audio))>.003,ident
  # Never truncate dialogue to a game action's length. The generated ending stays intact.
  temp=target.with_suffix('.tmp.ogg')
  subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-af','loudnorm=I=-18:TP=-1.5:LRA=7','-ac','1','-ar','44100','-c:a','libvorbis','-q:a','4',str(temp)],check=True);temp.replace(target)
  info=sf.info(target)
  if prior:build.setdefault('history',{}).setdefault(ident,[]).append(prior)
  build['clips'][ident]={**recipe,'recipe_sha256':recipe_sha,'output':job['output'],'seconds':round(info.duration,4),'sample_rate':info.samplerate,'sha256':sha(target),'compute':build['compute'],'model_device':'cpu','codec_device':'cpu','checkpoint_sha256':checkpoint_sha,'irodori_revision':revision,'silentcipher_watermark':True,'timings':dict(result.stage_timings)}
  tmp=record.with_suffix('.tmp');tmp.write_text(json.dumps(build,ensure_ascii=False,indent=2)+'\n');tmp.replace(record)
  print(f"{len(build['clips'])}/197 {ident} {info.duration:.2f}s ({time.monotonic()-start:.1f}s CPU)",flush=True)
if __name__=='__main__':main()
