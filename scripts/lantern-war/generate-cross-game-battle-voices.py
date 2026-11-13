"""Generate only missing cross-game battle lines using pinned official Irodori, CPU only."""
import argparse,json,sys,hashlib,subprocess,time,gc,ctypes,tempfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--irodori-root',required=True);p.add_argument('--checkpoint',required=True);p.add_argument('--only',help='actor:kind to regenerate after changing its plan');args=p.parse_args()
r=Path(__file__).resolve().parents[2];plan=json.loads((r/'assets/lantern-war/cross-game-battle/voice-plan.json').read_text())
revision=subprocess.check_output(['git','-C',args.irodori_root,'rev-parse','HEAD'],text=True).strip();assert revision==plan['code_revision'];sys.path.insert(0,args.irodori_root)
import torch,soundfile as sf,numpy as np
torch.set_num_threads(2);torch.set_num_interop_threads(1);torch.set_default_dtype(torch.bfloat16)
import irodori_tts.inference_runtime as runtime
from irodori_tts.inference_runtime import InferenceRuntime,RuntimeKey,SamplingRequest,save_wav
# Official CLI restricts bf16 to GPU/XPU; PyTorch supports CPU bf16 too.
# Keep model and codec on CPU while avoiding a transient fp32 copy at load time.
resolve_dtype=runtime.resolve_runtime_dtype
def cpu_dtype(*,precision,device):
 if device.type=='cpu' and precision=='bf16':return torch.bfloat16
 return resolve_dtype(precision=precision,device=device)
runtime.resolve_runtime_dtype=cpu_dtype
# Watermark's DSP uses fp32 on CPU even when the speech model uses bf16.
watermarker=runtime.SilentCipherWatermarker
def cpu_watermarker(**kwargs):
 torch.set_default_dtype(torch.float32)
 try:return watermarker(**kwargs)
 finally:torch.set_default_dtype(torch.bfloat16)
runtime.SilentCipherWatermarker=cpu_watermarker
from huggingface_hub import hf_hub_download
codec_path=hf_hub_download(plan['codec'],filename='weights.pth',revision=plan['codec_revision'])
print('Loading CPU model/codec',flush=True)
rt=InferenceRuntime.from_key(RuntimeKey(checkpoint=args.checkpoint,model_device='cpu',codec_device='cpu',model_precision='bf16',codec_precision='bf16',codec_repo=codec_path))
rt.codec._normalize_loudness=torch.autocast('cpu',enabled=False)(rt.codec._normalize_loudness)
watermark=rt.watermarker.encode_batch
def mark(audios,**kw):
 with torch.autocast('cpu',enabled=False):return watermark([x.float() for x in audios],**kw)
rt.watermarker.encode_batch=mark
assert rt.watermarker.ready,'SilentCipher watermark must be available'
assert str(rt.model_device)=='cpu' and str(rt.codec_device)=='cpu'
torch.set_default_dtype(torch.float32)
record=r/'assets/lantern-war/cross-game-battle/voice-build.json';build=json.loads(record.read_text())if record.exists()else{'clips':{}}
build.update({k:v for k,v in plan.items()if k!='clips'});build.update(torch_version=torch.__version__,threads=2,silentcipher_watermark=True,normalization='loudnorm I=-18 TP=-1.5 LRA=7',sample_rate=44100,channels=1);bankfile=r/'src/mini-games/lantern-war/battleVoiceBank.json';bank=json.loads(bankfile.read_text())
for i,job in enumerate(plan['clips']):
 if args.only and args.only!=job['actor']+':'+job['kind']:continue
 target=r/'public'/job['path'];prior=build['clips'].get(job['actor']+':'+job['kind'])
 if not args.only and target.exists()and prior and hashlib.sha256(target.read_bytes()).hexdigest()==prior['sha256']:continue
 start=time.monotonic();print('START',job['actor'],job['kind'],job['text'],flush=True)
 with torch.autocast('cpu',dtype=torch.bfloat16):result=rt.synthesize(SamplingRequest(text=job.get('spoken_text',job['text']),caption=job['caption'],ref_wav=str(r/job['reference']),seconds=job['seconds'],num_steps=job.get('steps',4),seed=job.get('seed',20261113+i),max_seconds=6),log_fn=lambda _:None)
 wav=Path(tempfile.gettempdir())/'cross-game-battle.wav';save_wav(wav,result.audio,result.sample_rate);data,rate=sf.read(wav);assert np.isfinite(data).all()and np.max(np.abs(data))>.003
 target.parent.mkdir(parents=True,exist_ok=True);subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-af','loudnorm=I=-18:TP=-1.5:LRA=7','-ac','1','-ar','44100','-c:a','libvorbis','-q:a','4',str(target)],check=True)
 duration=sf.info(target).duration;bank[job['actor']][job['kind']]['duration']=duration
 build['clips'][job['actor']+':'+job['kind']]={**job,'duration':duration,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'reference_sha256':hashlib.sha256((r/job['reference']).read_bytes()).hexdigest(),'seed':job.get('seed',20261113+i),'steps':job.get('steps',4),'model_device':'cpu','codec_device':'cpu'}
 record.write_text(json.dumps(build,ensure_ascii=False,indent=2)+'\n');bankfile.write_text(json.dumps(bank,ensure_ascii=False,indent=2)+'\n');print('DONE',i+1,'/',len(plan['clips']),round(time.monotonic()-start,1),'s',flush=True)

 gc.collect();ctypes.CDLL(None).malloc_trim(0)
