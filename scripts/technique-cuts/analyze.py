from pathlib import Path
import json,hashlib
import numpy as np,soundfile as sf
from pykakasi import kakasi
root=Path(__file__).resolve().parents[2];base=root/'assets/technique-cuts';plan=json.loads((base/'plan.json').read_text());k=kakasi();records=[]
def moras(t):return max(1,len(''.join(v['hira'] for v in k.convert(t)).replace('！','').replace('、','').replace(' ','')))
for r in plan['rows']:
 source=root/'public'/r['source'];y,sr=sf.read(source,dtype='float32');y=y.mean(axis=1) if y.ndim>1 else y
 step=max(1,int(sr*.005));count=len(y)//step;x=y[:count*step].reshape(count,step);energy=np.sqrt(np.mean(x*x,axis=1));quiet=energy<.01;active=np.where(~quiet)[0];duration=len(y)/sr
 rr={**r,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'duration':duration}
 if not r['prefix']:rr.update(nameRange=[0,duration],confidence=1);records.append(rr);continue
 starts=np.where(np.diff(np.r_[False,quiet,False].astype(int))==1)[0];ends=np.where(np.diff(np.r_[False,quiet,False].astype(int))==-1)[0]
 ratio=moras(r['prefix'])/(moras(r['prefix'])+moras(r['skill']));candidates=[]
 for a,b in zip(starts,ends):
  if (b-a)*step/sr<.09 or a*step/sr<.16 or b*step/sr>duration-.23:continue
  position=np.count_nonzero(~quiet[:a])/max(1,np.count_nonzero(~quiet));score=abs(position-ratio)-min(.6,(b-a)*step/sr)*.07;candidates.append((score,a*step/sr,b*step/sr,position))
 if candidates:
  score,a,b,pos=min(candidates);rr.update(prefixRange=[0,a+.045],nameRange=[max(0,b-.065),duration],silence=[a,b],confidence=round(1-abs(pos-ratio),3))
 else:rr.update(confidence=0,issue='No safe internal silence')
 records.append(rr)
(base/'analysis.json').write_text(json.dumps({'records':records},ensure_ascii=False,indent=2)+'\n');bad=[r for r in records if r['confidence']<.76];print('Analyzed',len(records),'no silence',sum(r['confidence']==0 for r in records),'review',len(bad));print([(r['key'],r.get('silence'),r['confidence']) for r in bad][:25])
