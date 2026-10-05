"""Band attack / harmonic concentration analysis; estimates accompaniment, not instrument source separation."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json,subprocess,numpy as np
root=Path(__file__).resolve().parents[1];source=(root/'src/rpg/rhythm/catalog.generated.ts').read_text();songs=json.loads(source.split(' = ',1)[1].split('.map(source=>',1)[0]);sr=11025;hop=256

def analyze(s):
 x=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(root/'public'/s['path']),'-f','f32le','-ac','1','-ar',str(sr),'pipe:1']),dtype='<f4')
 if len(x)<1024:x=np.pad(x,(0,1024-len(x)))
 frames=np.lib.stride_tricks.sliding_window_view(x,1024)[::hop];spec=np.abs(np.fft.rfft(frames*np.hanning(1024),axis=1));freq=np.fft.rfftfreq(1024,1/sr)
 flux=np.maximum(0,np.diff(spec,axis=0,prepend=spec[:1]));bands=[flux[:,(freq>=lo)&(freq<hi)].sum(axis=1) for lo,hi in [(35,230),(230,2200),(2200,5500)]]
 rms=np.sqrt(np.mean(frames**2,axis=1));top=np.partition(spec**2,-16,axis=1)[:,-16:].sum(axis=1)/np.maximum((spec**2).sum(axis=1),1e-10)
 loud85=max(float(np.quantile(rms,.85)),1e-9)
 ms=0;events=[]
 for b in s['beats'].split(','):
  if not b:continue
  delta,level=b.split(':');ms+=int(delta,36);idx=max(1,min(len(spec)-1,round((ms/1000*sr-512)/hop)));v=[float(a[idx]) for a in bands];total=max(sum(v),1e-9)
  events.append(dict(ms=ms,power=int(level,36),bands=[round(a/total,4) for a in v],tonal=round(float(top[idx]),4),loud=round(float(rms[idx]/loud85),3)))
 noisy=sum(e['tonal']<.72 for e in events)/max(len(events),1);high=sum(e['bands'][2]>.2 for e in events)/max(len(events),1)
 print(s['id'],round(noisy,2),round(high,2),flush=True)
 return dict(id=s['id'],bpm=s['bpm'],noisy=round(noisy,3),high=round(high,3),events=events)
with ThreadPoolExecutor(max_workers=3) as pool:all=list(pool.map(analyze,songs))
alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
profiles={}
for song in all:
 scratch=song['noisy']>.45 and song['bpm']>=115 and any(song['id'].endswith(':'+t) for t in ['battle','boss','mid_boss','final_boss','kocho_battle','kocho_boss','dungeon_boss'])
 percussion=min(1,song['noisy']/.45);codes=[];lastScratch=-999
 for e in song['events']:
  bands=[v/(width**.5) for v,width in zip(e['bands'],[195,1970,3300])];total=max(sum(bands),1e-9);low,body,high=[v/total for v in bands]
  lane=0 if low>.36 and low>high else 1 if body>.42 and e['tonal']<.82 else 2
  if scratch and e['tonal']<.6 and high>.35 and e['power']>60 and e['ms']/1000-lastScratch>60/song['bpm']*8:
   lane=3;lastScratch=e['ms']/1000
  velocity=.12+.35*percussion*min(1,e['power']/70)+.08*min(1,e['loud'])
  if lane==3:velocity=min(velocity,.38)
  level=max(0,min(7,round((velocity-.12)/.07)))
  layer=lane in [0,1] and high>.23 and e['power']>65 and percussion>.5
  codes.append(alphabet[lane+4*level+(32 if layer else 0)])
 profiles[song['id']]={'scratch':scratch,'percussion':round(percussion,3),'accents':''.join(codes)}
target=root/'src/rpg/rhythm/accents.generated.ts'
target.write_text('// Generated from all original MP3 files by scripts/generate-rhythm-accents.py.\nexport const RHYTHM_PERFORMANCE: Record<string,{scratch:boolean;percussion:number;accents:string}> = '+json.dumps(profiles,separators=(',',':'))+';\n')
print('Generated spectral accents for',len(profiles),'songs; scratch eligible',sum(p['scratch'] for p in profiles.values()))
