"""Small original synthesized SFX, encoded for the existing shared audio service."""
import math, random, wave, struct, tempfile, subprocess, json, hashlib
from pathlib import Path
rate=24000;files=[]
for sport in ['baseball','soccer','volleyball','festival']:
 for kind in ['hit','catch','whistle','cheer','special','bounce','score','hurt']:
  rng=random.Random(sport+kind);duration=.85 if kind in ['cheer','score','special'] else .28 if kind=='whistle' else .22
  values=[];low=0
  for i in range(int(duration*rate)):
   t=i/rate;noise=rng.random()*2-1;low=low*.8+noise*.2
   if kind in ['cheer','score']:v=(noise*.12+low*.5)*math.sin(math.pi*t/duration)**.7+sum(math.sin(2*math.pi*f*t)*.055 for f in[220,277,330])*math.exp(-t*2)
   elif kind=='whistle':v=(math.sin(2*math.pi*(1900+100*math.sin(t*30))*t)+math.sin(2*math.pi*2380*t)*.2)*.23*math.sin(math.pi*t/duration)**.5
   elif kind=='special':v=(math.sin(2*math.pi*(220*t+700*t*t))+noise*.12)*.23*math.sin(math.pi*t/duration)
   else:
    frequency={'baseball':1800,'soccer':125,'volleyball':480,'festival':240}[sport];decay=35 if sport=='baseball' else 22
    v=(math.sin(2*math.pi*(frequency*t-80*t*t))*.35+noise*(.6 if sport in ['baseball','volleyball'] else .2))*math.exp(-t*decay)
    if sport=='volleyball' and t>.07:v+=low*.08*math.exp(-(t-.07)*14)
   values.append(int(max(-.8,min(.8,v))*32767))
  with tempfile.NamedTemporaryFile(suffix='.wav') as f:
   with wave.open(f.name,'wb')as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(struct.pack('<'+'h'*len(values),*values))
   for folder,ext,codec in [('sfx','mp3','libmp3lame'),('web-audio/sfx','ogg','libopus')]:
    path=Path('public')/folder/'academy-sports'/sport/(kind+'.'+ext);path.parent.mkdir(parents=True,exist_ok=True);subprocess.run(['ffmpeg','-v','error','-y','-i',f.name,'-c:a',codec,'-b:a','48k',str(path)],check=True);data=path.read_bytes();files.append({'path':str(path),'duration':duration,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
Path('assets/academy-sports/sound-build.json').write_text(json.dumps({'generator':'scripts/academy-sports/build-sounds.py','recordings':'Original procedural synthesis; no voices or third-party recordings','files':files},indent=2)+'\n')
