from pathlib import Path
import json,hashlib
import numpy as np
import soundfile as sf
root=Path(__file__).resolve().parents[1];build=json.loads((root/'assets/kocho/story/voice-build.json').read_text());report={};errors=[]
for key,entry in build['clips'].items():
 p=root/'public/sfx/kocho-story'/f'{key}.ogg'
 try:
  audio,rate=sf.read(p,dtype='float32');duration=len(audio)/rate;peak=float(np.abs(audio).max());rms=float(np.sqrt(np.mean(audio**2)));clipped=float(np.mean(np.abs(audio)>=.999));digest=hashlib.sha256(p.read_bytes()).hexdigest()
  if audio.ndim!=1 or rate!=44100 or duration<.8 or duration>17 or rms<.006 or clipped>.005 or digest!=entry['sha256']:errors.append(key)
  report[key]={'sha256':digest,'seconds':round(duration,3),'sample_rate':rate,'peak':round(peak,5),'rms':round(rms,5),'clipped_ratio':round(clipped,6)}
 except Exception as e:errors.append(key+': '+str(e))
(root/'assets/kocho/story/wave-qa.json').write_text(json.dumps({'clips':report,'errors':errors},indent=2)+'\n');print(f'Wave verification: {len(report)} clips, {len(errors)} errors');print('\n'.join(errors));raise SystemExit(bool(errors))
