"""CPU-only, resumable official Irodori-TTS broadcast production.
Generate speaker anchors with --references, then the reusable commentary bank.
No output is activated in-game until review/finalization succeeds.
"""
import argparse, hashlib, json, os, subprocess, sys, time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def digest(p):
 h=hashlib.sha256()
 with open(p,'rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def write(p,data):
 p.parent.mkdir(parents=True,exist_ok=True);temp=p.with_suffix('.tmp.json');temp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');temp.replace(p)
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--irodori-root',type=Path,default=ROOT.parent/'Irodori-TTS');parser.add_argument('--references',action='store_true');parser.add_argument('--only');parser.add_argument('--steps',type=int);parser.add_argument('--regenerate',action='store_true');parser.add_argument('--seed-offset',type=int,default=0);parser.add_argument('--model');args=parser.parse_args()
 sys.path.insert(0,str(args.irodori_root));os.environ.setdefault('OMP_NUM_THREADS','2');os.environ.setdefault('MKL_NUM_THREADS','2')
 import torch, numpy as np, soundfile as sf
 from irodori_tts.inference_runtime import InferenceRuntime,RuntimeKey,SamplingRequest,download_hf_checkpoint,save_wav
 torch.set_num_threads(2);torch.set_num_interop_threads(1)
 plan=json.loads((ROOT/'assets/academy-sports/broadcast-plan.json').read_text());model=args.model or (plan['referenceModel'] if args.references else plan['model']);steps=args.steps or (40 if args.references else 4)
 checkpoint=download_hf_checkpoint(model);revision=subprocess.check_output(['git','-C',str(args.irodori_root),'rev-parse','HEAD'],text=True).strip()
 record=ROOT/'assets/academy-sports/broadcast-build.json';state=json.loads(record.read_text()) if record.exists() else {'references':{},'clips':{},'failures':{}}
 state['irodori_revision']=revision;state['base_main']=subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD'],text=True).strip()
 runtime=InferenceRuntime.from_key(RuntimeKey(checkpoint=checkpoint,model_device='cpu',codec_device='cpu',model_precision='fp32',codec_precision='fp32'))
 # Official CLI does not expose CPU BF16; use the existing repository's
 # CPU-autocast recipe on AVX512-BF16 hosts without changing the runtime source.
 runtime.model.to(dtype=torch.bfloat16);runtime._model_dtype=torch.bfloat16
 runtime.codec.encode_waveform=torch.autocast('cpu',enabled=False)(runtime.codec.encode_waveform)
 runtime.codec._normalize_loudness=torch.autocast('cpu',enabled=False)(runtime.codec._normalize_loudness)
 runtime.codec.encode_file=torch.autocast('cpu',enabled=False)(runtime.codec.encode_file)
 runtime.codec.decode_latent=torch.autocast('cpu',enabled=False)(runtime.codec.decode_latent)
 runtime.watermarker.encode_batch=torch.autocast('cpu',enabled=False)(runtime.watermarker.encode_batch)
 print('Loaded',model,'CPU model bf16 autocast / codec fp32',flush=True);checkpoint_hash=digest(checkpoint)
 scratch=ROOT/'tmp/academy-broadcast';scratch.mkdir(parents=True,exist_ok=True)
 work=[{'id':role,'role':role,'text':speaker['referenceText']} for role,speaker in plan['speakers'].items()] if args.references else plan['lines']
 target_count=sum(not args.only or l['id'] in args.only.split(',') or l['role'] in args.only.split(',') for l in work);completed=0
 for line in work:
  key=line['id'];role=line['role'];speaker=plan['speakers'][role]
  if args.only and key not in args.only.split(',') and role not in args.only.split(','):continue
  completed+=1
  target=ROOT/(f'assets/academy-sports/references/{role}.wav' if args.references else f'public/sfx/academy-broadcast/{key}.ogg');target.parent.mkdir(parents=True,exist_ok=True)
  entries=state['references' if args.references else 'clips'];reference=ROOT/f'assets/academy-sports/references/{role}.wav'
  recipe={'text':line['text'],'spoken_text':line.get('spokenText',line['text']),'caption':speaker['caption'],'model':model,'steps':steps,'judge_seconds':line.get('seconds',min(2.6,max(1.15,len(line['text'].strip('！。 '))*.15))) if role=='referee' and not args.references else None,'seed_offset':args.seed_offset,'reference_sha256':None if args.references else digest(reference),'irodori_revision':revision}
  recipe_hash=hashlib.sha256(json.dumps(recipe,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
  existing=entries.get(key,{})
  compatible=all(existing.get(k)==v for k,v in recipe.items() if k not in ('spoken_text','seed_offset')) and existing.get('spoken_text',existing.get('text'))==recipe['spoken_text'] and (args.seed_offset==0 or existing.get('seed_offset')==args.seed_offset)
  if not args.regenerate and target.exists() and compatible and existing.get('sha256')==digest(target):continue
  try:
   start=time.monotonic();seed=speaker['seed']+int(hashlib.sha256(key.encode()).hexdigest()[:6],16)+args.seed_offset
   # Automatic length prediction, with a conservative bound, avoids padding a
   # one-word call with repeated speech. Role anchors never use another actor.
   with torch.autocast('cpu',dtype=torch.bfloat16):
    result=runtime.synthesize(SamplingRequest(text=recipe['spoken_text'],caption=speaker['caption'],no_ref=args.references,ref_wav=None if args.references else str(reference),num_steps=steps,seed=seed,min_seconds=.5,seconds=recipe['judge_seconds'],max_seconds=10),log_fn=lambda msg:print(msg,flush=True))
   wav=scratch/(key.replace('/','-')+'.wav');save_wav(wav,result.audio,result.sample_rate)
   audio,rate=sf.read(wav);peak=float(np.max(np.abs(audio)));duration=len(audio)/rate
   if duration<.35 or not np.isfinite(audio).all() or peak<.003:raise RuntimeError('Silent, non-finite or truncated clip')
   if args.references:target.write_bytes(wav.read_bytes())
   else:
    temp=target.with_suffix('.tmp.ogg');subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-af','loudnorm=I=-18:TP=-1.5:LRA=7','-ac','1','-ar','48000','-c:a','libvorbis','-q:a','4',str(temp)],check=True);temp.replace(target)
   entries[key]={**recipe,'recipe_sha256':recipe_hash,'seed':result.used_seed,'checkpoint_sha256':checkpoint_hash,'sha256':digest(target),'seconds':round(duration,3),'model_device':'cpu','codec_device':'cpu','model_precision':'bf16','codec_precision':'fp32','timings':dict(result.stage_timings),'generation_seconds':round(time.monotonic()-start,2),'path':str(target.relative_to(ROOT))}
   state['failures'].pop(key,None);write(record,state);print('DONE',completed,'/',target_count,key,round(time.monotonic()-start,1),'seconds',flush=True)
  except Exception as error:
   state['failures'][key]=str(error);write(record,state);print('RETRY REQUIRED',key,repr(error),flush=True)
 write(record,state)
 if any((line['id'] in state['failures'] or line['id'] not in state['references' if args.references else 'clips']) for line in work if not args.only or line['id'] in args.only.split(',') or line['role'] in args.only.split(',')):sys.exit(1)
if __name__=='__main__':main()
