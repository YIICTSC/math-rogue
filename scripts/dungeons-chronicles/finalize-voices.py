"""Independently decode every delivered clip and finalize reproducible metadata."""
import json,hashlib
from pathlib import Path
import numpy as np,soundfile as sf
root=Path(__file__).resolve().parents[2]
design=json.loads((root/'assets-source/dungeons-chronicles/voice-design.json').read_text());path=root/'assets-source/dungeons-chronicles/voice-generation.json';report=json.loads(path.read_text());planned={c['path']:c for c in design['clips']}
assert len(report['clips'])==len(planned)==968
for clip in report['clips']:
 p=root/'public'/clip['path'];d=p.read_bytes();assert hashlib.sha256(d).hexdigest()==clip['sha256'];a,sr=sf.read(p);assert sr==24000 and a.ndim==1 and len(a)>7200
 rms=float(np.sqrt(np.mean(a*a)));peak=float(np.max(np.abs(a)));duration=len(a)/sr
 assert .005<rms<.5 and peak<1.02 and .3<=duration<=4,(p,rms,peak,duration)
 source=planned[clip['path']];assert clip['text']==source['text'];attempt=(clip['seed']-source['seed'])//10000;assert 0<=attempt<5
 clip.update(requestedSeconds=None if source.get('autoDuration') else round(min(3.4,source['seconds']+attempt*.2),2),numSteps=source.get('numSteps',4),cfgGuidance=source.get('cfgGuidance','joint'),cfgScaleText=source.get('cfgScaleText',3),cfgScaleCaption=source.get('cfgScaleCaption',3),sampleRate=sr,channels=1,rms=round(rms,5),peak=round(peak,5),duration=round(duration,4))
report.update(format='ogg-vorbis',sampleRate=24000,channels=1,validatedClipCount=968)
temporary=path.with_suffix('.tmp');temporary.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');temporary.replace(path)
print('PASS: independently decoded 968 real OGG clips; mono24kHz, measured duration/RMS/peak, SHA and original text/seed settings.')
