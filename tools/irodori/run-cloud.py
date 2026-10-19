"""Official Irodori server with a bounded, invalidated reference-encoding cache.
Weights, sampler, duration prediction and watermarking are unchanged.
Run with the Python interpreter installed by setup-cloud.sh.
"""
import os,threading
from collections import OrderedDict
from pathlib import Path
import torch
from irodori_tts.inference_runtime import InferenceRuntime
from irodori_openai_tts.__main__ import main

torch.set_num_threads(int(os.environ.get('OMP_NUM_THREADS','2')))
torch.set_num_interop_threads(1)
_original=InferenceRuntime._load_reference_latent
_lock=threading.RLock()
def cached_reference(self,*,req,batch_size,messages):
 paths=tuple(x for x in [req.ref_wav,*(req.ref_wavs or []),req.ref_latent,*(req.ref_latents or [])]if x)
 if not paths or req.no_ref or os.environ.get('IRODORI_REFERENCE_CACHE','1')=='0':return _original(self,req=req,batch_size=batch_size,messages=messages)
 try:files=tuple((str(Path(p).resolve()),Path(p).stat().st_mtime_ns,Path(p).stat().st_size)for p in paths)
 except OSError:return _original(self,req=req,batch_size=batch_size,messages=messages)
 key=(files,req.max_ref_seconds,req.ref_normalize_db,req.ref_ensure_max,batch_size,str(next(self.model.parameters()).dtype))
 with _lock:
  cache=getattr(self,'_dungeons_reference_cache',None)
  if cache is None:cache=OrderedDict();self._dungeons_reference_cache=cache
  if key in cache:
   cache.move_to_end(key);messages.append('info: unchanged reference latent reused from bounded CPU cache')
   return tuple(x.clone()if x is not None else None for x in cache[key])
 result=_original(self,req=req,batch_size=batch_size,messages=messages)
 with _lock:
  cache[key]=tuple(x.detach().clone()if x is not None else None for x in result)
  while len(cache)>16:cache.popitem(last=False)
 return result
InferenceRuntime._load_reference_latent=cached_reference
if __name__=='__main__':main()
