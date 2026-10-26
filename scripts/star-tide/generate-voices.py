"""Latest official Irodori; CPU inference AND CPU codec. Resumable original voices."""
import os,json,time,hashlib,subprocess,gc,ctypes,tempfile
from pathlib import Path
import torch,numpy as np,soundfile as sf
from huggingface_hub import HfApi
from irodori_tts.inference_runtime import InferenceRuntime,RuntimeKey,SamplingRequest,download_hf_checkpoint
root=Path(os.environ.get('STAR_TIDE_REPO',Path(__file__).resolve().parents[2]));scratch=tempfile.TemporaryDirectory(prefix='star-tide-voices-');irodori=os.environ.get('IRODORI_ROOT','/workspace/irodori-star-tide');plan=json.loads((root/'assets/star-tide/voice-plan.json').read_text());out=root/'assets/star-tide/voice-build.json';anchors=root/'assets-source/star-tide/voice-anchors';anchors.mkdir(parents=True,exist_ok=True)
if os.environ.get('STAR_TIDE_VOICE_IDS'):plan['clips']=[c for c in plan['clips'] if c['id'] in os.environ['STAR_TIDE_VOICE_IDS'].split(',')]
report=json.loads(out.read_text()) if out.exists() else {'clips':[]};prior={x['id']:x for x in report['clips']};hash=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
revision=HfApi().model_info(plan['model']).sha;code=subprocess.check_output(['git','-C',irodori,'rev-parse','HEAD'],text=True).strip()
torch.set_num_threads(2);runtime=InferenceRuntime.from_key(RuntimeKey(checkpoint=download_hf_checkpoint(plan['model']),model_device='cpu',codec_device='cpu',model_precision='fp32',codec_precision='fp32'))
cpu_bf16=os.environ.get('STAR_TIDE_CPU_BF16')=='1'
if cpu_bf16:runtime.model.to(dtype=torch.bfloat16);runtime._model_dtype=torch.bfloat16
precision='CPU bfloat16 model; fp32 codec with CPU bfloat16 autocast' if cpu_bf16 else 'fp32 with CPU bfloat16 autocast'
meta={'model':plan['model'],'modelRevision':revision,'sourceRevision':code,'device':'cpu','codecDevice':'cpu','numSteps':8,'codecModel':'Aratako/Semantic-DACVAE-Japanese-32dim','codecRevision':HfApi().model_info('Aratako/Semantic-DACVAE-Japanese-32dim').sha,'precision':precision,'guidance':{'mode':'joint','scale':3},'speakerReferences':'original generated actor anchors','clips':[]}
def save():
 meta['actorReferences']={p.stem:{'path':str(p.relative_to(root)),'sha256':hash(p)} for p in anchors.glob('*.wav')};meta['clips']=list(prior.values());tmp=out.with_suffix('.tmp');tmp.write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n');tmp.replace(out)
def request(c,ref=None):return SamplingRequest(text=c.get('spokenText',c['text']),caption=c['caption'],ref_wav=str(ref) if ref else None,no_ref=not bool(ref),ref_normalize_db=None,seconds=None,num_steps=8,seed=c['seed'],cfg_guidance_mode='joint',cfg_scale_text=3,cfg_scale_caption=3,cfg_scale_speaker=3)
def deliver(c,result,anchor=None):
 waveform=result.audio.squeeze().float().cpu().numpy();raw=Path(scratch.name)/'current.wav';sf.write(raw,waveform,result.sample_rate)
 target=root/'public'/c['path'];target.parent.mkdir(parents=True,exist_ok=True)
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(raw),'-af','silenceremove=start_periods=1:start_duration=0.02:start_threshold=-50dB,loudnorm=I=-18:TP=-2:LRA=9,alimiter=limit=0.89:level=false','-ar','24000','-ac','1','-c:a','libvorbis','-q:a','4',str(target)],check=True)
 if anchor:sf.write(anchors/(c['speaker']+'.wav'),waveform[:int(result.sample_rate*8)],result.sample_rate)
 a,sr=sf.read(target);duration=len(a)/sr;rms=float(np.sqrt(np.mean(a*a)));peak=float(np.max(np.abs(a)))
 if not(.15<duration<60 and .003<rms<.5 and peak<=1):raise RuntimeError('Invalid waveform '+c['id'])
 prior[c['id']]={'id':c['id'],'speaker':c['speaker'],'caption':c['caption'],'precision':precision,'seed':c['seed'],'text':c['text'],'spokenText':c.get('spokenText',c['text']),'path':c['path'],'duration':round(duration,3),'rms':round(rms,6),'peak':round(peak,6),'sha256':hash(target),'bytes':target.stat().st_size,'reference':None if anchor else str((anchors/(c['speaker']+'.wav')).relative_to(root))};save();print(len(prior),'/',len(plan['clips']),c['id'],round(duration,2),flush=True)
for speaker in dict.fromkeys(c['speaker'] for c in plan['clips']):
 clips=[c for c in plan['clips'] if c['speaker']==speaker];anchor=anchors/(speaker+'.wav')
 if not anchor.exists():
  first=clips[0];print('ANCHOR',speaker,flush=True)
  with torch.autocast('cpu',dtype=torch.bfloat16,cache_enabled=cpu_bf16):r=runtime.synthesize(request(first))
  deliver(first,r,True)
 todo=[c for c in clips if not(c['id'] in prior and prior[c['id']].get('spokenText')==c.get('spokenText',c['text']) and (root/'public'/c['path']).exists() and hash(root/'public'/c['path'])==prior[c['id']]['sha256'])];todo.sort(key=lambda c:len(c['text']))
 while todo:
  size=2 if len(todo[0]['text'])<45 and len(todo)>1 and len(todo[1]['text'])<45 else 1
  batch=todo[:size];todo=todo[size:];t=time.time();print('START',','.join(c['id'] for c in batch),flush=True)
  with torch.autocast('cpu',dtype=torch.bfloat16,cache_enabled=cpu_bf16):results=runtime.synthesize_batch([request(c,anchor) for c in batch])
  for c,r in zip(batch,results):deliver(c,r)
  print('BATCH SECONDS',round(time.time()-t,1),flush=True)
  del results,r;gc.collect()
  if os.name=='posix':
   libc=ctypes.CDLL(None)
   if hasattr(libc,'malloc_trim'):libc.malloc_trim(0)
print('COMPLETE',len(prior),flush=True)
