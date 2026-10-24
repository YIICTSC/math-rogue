"""Run with the pinned official Irodori environment; CPU for model and codec."""
import os,sys,json,time,hashlib,subprocess
from pathlib import Path
import torch,numpy as np,soundfile as sf
from irodori_tts.inference_runtime import InferenceRuntime,RuntimeKey,SamplingRequest,download_hf_checkpoint
root=Path(os.environ['DUNGEONS_REPO']);work=Path(os.environ.get('DUNGEONS_VOICE_WORK','/workspace/chronicle-voice-work'));work.mkdir(parents=True,exist_ok=True)
design=json.loads((root/'assets-source/dungeons-chronicles/voice-design.json').read_text());reportFile=root/'assets-source/dungeons-chronicles/voice-generation.json'
report=json.loads(reportFile.read_text())['clips'] if reportFile.exists() else [];prior={x['path']:x for x in report}
torch.set_num_threads(3);runtime=InferenceRuntime.from_key(RuntimeKey(checkpoint=download_hf_checkpoint(design['model']),model_device='cpu',codec_device='cpu',model_precision='fp32',codec_precision='fp32'))
started=time.time()
for n,clip in enumerate(design['clips']):
 output=root/'public'/clip['path'];cached=prior.get(clip['path'])
 if cached and output.exists() and hashlib.sha256(output.read_bytes()).hexdigest()==cached['sha256']:continue
 output.parent.mkdir(parents=True,exist_ok=True);t=time.time()
 for attempt in range(5):
  with torch.autocast('cpu',dtype=torch.bfloat16):
   result=runtime.synthesize(SamplingRequest(text=clip['text'],caption=clip['caption'],no_ref=True,seconds=None if clip.get('autoDuration') else min(3.4,clip['seconds']+attempt*.2),num_steps=clip.get('numSteps',4),seed=clip['seed']+attempt*10000,cfg_guidance_mode=clip.get('cfgGuidance','joint'),cfg_scale_text=clip.get('cfgScaleText',3),cfg_scale_caption=clip.get('cfgScaleCaption',3),cfg_scale_speaker=3))
  raw=work/(clip['actor']+'-'+clip['action']+'.wav');waveform=result.audio.squeeze().float().cpu().numpy();sf.write(raw,waveform,result.sample_rate)
  tempo=max(1,len(waveform)/result.sample_rate/3.4)
  subprocess.run(['ffmpeg','-v','error','-y','-i',str(raw),'-af',f'atempo={tempo:.6f},silenceremove=start_periods=1:start_duration=0.02:start_threshold=-50dB,loudnorm=I=-18:TP=-2:LRA=9,alimiter=limit=0.89:level=false','-ar','24000','-ac','1','-c:a','libvorbis','-q:a','4',str(output)],check=True)
  samples,sr=sf.read(output)
  if len(samples)==0:
   print('Retrying silent synthesis:',clip['actor'],clip['action'],attempt,flush=True);continue
  duration=len(samples)/sr;rms=float(np.sqrt(np.mean(samples*samples)));peak=float(np.max(np.abs(samples)))
  if .3<=duration<=4 and .005<rms<.5 and peak<1.02:break
 else:raise RuntimeError('Invalid generated clip '+clip['path'])
 record={**{k:clip[k] for k in ['actor','action','text','path']},'duration':round(duration,4),'rms':round(rms,5),'peak':round(peak,5),'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'seed':clip['seed']+attempt*10000}
 prior[clip['path']]=record
 temporary=reportFile.with_suffix('.tmp')
 temporary.write_text(json.dumps({**{k:v for k,v in design.items() if k!='clips'},'clips':list(prior.values())},ensure_ascii=False,indent=2)+'\n');temporary.replace(reportFile)
 print(f'{n+1}/{len(design["clips"])} {clip["actor"]} {clip["action"]} {duration:.2f}s RMS={rms:.3f} inference={time.time()-t:.1f}s elapsed={time.time()-started:.0f}s',flush=True)
print('COMPLETE',len(prior),'validated original CPU Irodori clips',flush=True)
