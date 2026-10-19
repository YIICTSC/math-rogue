"""Generate original voice designs and ten battle clips per hero using the official API.
No real-person reference audio is used. The model's watermarking stays enabled.
"""
import argparse,json,hashlib,time,subprocess,urllib.request,wave
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--url',default='http://127.0.0.1:8088');p.add_argument('--work',default='/workspace/dungeons2-voice-work');p.add_argument('--voices-dir',default='/workspace/tools/irodori-server/voices');p.add_argument('--hero');args=p.parse_args()
work=Path(args.work);work.mkdir(parents=True,exist_ok=True);voices=Path(args.voices_dir);voices.mkdir(parents=True,exist_ok=True)
design=json.loads((ROOT/'assets-source/dungeons2/voice-design.json').read_text());report=[]
def synth(text,hero,seed,voice,path):
 if path.exists() and path.stat().st_size>1000:return
 payload={'model':'irodori-tts','input':text,'voice':voice,'response_format':'wav','irodori':{'caption':hero['caption']+' 戦闘中の台詞として感情を込める。','seed':seed,'num_steps':4,'chunking_enabled':False}}
 req=urllib.request.Request(args.url+'/v1/audio/speech',json.dumps(payload).encode(),{'Content-Type':'application/json'});start=time.time()
 for attempt in range(3):
  try:
   data=urllib.request.urlopen(req,timeout=900).read();path.write_bytes(data)
   with wave.open(str(path)) as wav:duration=wav.getnframes()/wav.getframerate()
   if not .25<duration<35:raise RuntimeError('Invalid duration '+str(duration))
   print(hero['id'],path.stem,round(duration,2),'sec;',round(time.time()-start,1),'s inference',flush=True);return
  except Exception:
   if attempt==2:raise
   time.sleep(2)
for index,hero in enumerate(design['heroes']):
 if args.hero and args.hero!=hero['id']:continue
 reference=voices/(hero['id']+'.wav');synth(hero['reference'],hero,81000+index,'none',reference)
 folder=ROOT/'public/sfx/dungeons2-voices'/hero['id'];folder.mkdir(parents=True,exist_ok=True)
 for n,(action,text)in enumerate(hero['lines'].items()):
  raw=work/(hero['id']+'-'+action+'.wav');synth(text,hero,91000+index*100+n,hero['id'],raw)
  output=folder/(action+'.ogg')
  if not output.exists():subprocess.run(['ffmpeg','-v','error','-y','-i',str(raw),'-af','silenceremove=start_periods=1:start_duration=0.03:start_threshold=-48dB,loudnorm=I=-18:TP=-2:LRA=9','-ac','1','-ar','24000','-c:a','libvorbis','-q:a','4',str(output)],check=True)
  info=json.loads(subprocess.check_output(['ffprobe','-v','quiet','-show_format','-of','json',str(output)]));duration=float(info['format']['duration']);report.append({'hero':hero['id'],'action':action,'text':text,'duration':duration,'sha256':hashlib.sha256(output.read_bytes()).hexdigest()})
 (work/'generation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('Generated',len(report),'clips.',flush=True)
