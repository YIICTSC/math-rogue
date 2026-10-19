"""Run with the cloud TTS venv; checks reuse, invalidation, isolation and bounds."""
import importlib.util,tempfile
from pathlib import Path
from types import SimpleNamespace
import torch
spec=importlib.util.spec_from_file_location('d2_cloud',Path(__file__).with_name('run-cloud.py'));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
calls=[]
def encode(self,*,req,batch_size,messages):calls.append(req.ref_wav);return torch.ones((batch_size,2,3)),torch.ones((batch_size,2),dtype=torch.bool)
module._original=encode
class Model:
 def parameters(self):return iter([torch.zeros(1)])
runtime=SimpleNamespace(model=Model())
with tempfile.TemporaryDirectory()as root:
 p=Path(root)/'voice.wav';p.write_bytes(b'first')
 req=SimpleNamespace(ref_wav=str(p),ref_wavs=None,ref_latent=None,ref_latents=None,no_ref=False,max_ref_seconds=None,ref_normalize_db=-16,ref_ensure_max=False)
 first=module.cached_reference(runtime,req=req,batch_size=1,messages=[]);first[0].fill_(9)
 second=module.cached_reference(runtime,req=req,batch_size=1,messages=[]);assert len(calls)==1;assert torch.all(second[0]==1)
 second[0].zero_();third=module.cached_reference(runtime,req=req,batch_size=1,messages=[]);assert torch.all(third[0]==1)
 p.write_bytes(b'changed-size');module.cached_reference(runtime,req=req,batch_size=1,messages=[]);assert len(calls)==2
 req.max_ref_seconds=3;module.cached_reference(runtime,req=req,batch_size=1,messages=[]);assert len(calls)==3
 for i in range(20):
  path=Path(root)/(str(i)+'.wav');path.write_bytes(b'data');req.ref_wav=str(path);module.cached_reference(runtime,req=req,batch_size=1,messages=[])
 assert len(runtime._dungeons_reference_cache)==16
 req.no_ref=True;before=len(calls);module.cached_reference(runtime,req=req,batch_size=1,messages=[]);module.cached_reference(runtime,req=req,batch_size=1,messages=[]);assert len(calls)==before+2
print('PASS: deterministic reference cache, cloned results, file/settings invalidation, no-ref bypass and 16-entry limit.')
