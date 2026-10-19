"""Normalize source WAVs, bound speech without pitch shifting, ship OGG Vorbis."""
import json,subprocess,hashlib,argparse
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[2];p=argparse.ArgumentParser();p.add_argument('--work',default='/workspace/dungeons2-voice-work');args=p.parse_args();work=Path(args.work);design=json.loads((ROOT/'assets-source/dungeons2/voice-design.json').read_text());report=[]
previous_path=ROOT/'assets-source/dungeons2/voice-generation.json'
cached_clips={(c['hero'],c['action']):c for c in json.loads(previous_path.read_text())['clips']}if previous_path.exists()else {}
probe=lambda f:json.loads(subprocess.check_output(['ffprobe','-v','quiet','-show_format','-of','json',str(f)]))
for hero in design['heroes']:
 for action,text in hero['lines'].items():
  cached=cached_clips.get((hero['id'],action));existing=ROOT/'public/sfx/dungeons2-voices'/hero['id']/(action+'.ogg')
  if cached and existing.exists() and cached['text']==text and hashlib.sha256(existing.read_bytes()).hexdigest()==cached['sha256']:
   report.append(cached);continue
  raw=work/(hero['id']+'-'+action+'.wav');assert raw.is_file(),raw
  cleaned=work/'cleaned.wav';subprocess.run(['ffmpeg','-v','error','-y','-i',str(raw),'-af','silenceremove=start_periods=1:start_duration=0.03:start_threshold=-48dB,areverse,silenceremove=start_periods=1:start_duration=0.03:start_threshold=-48dB,areverse,loudnorm=I=-18:TP=-2:LRA=9','-ac','1','-ar','24000',str(cleaned)],check=True)
  duration=float(probe(cleaned)['format']['duration']);tempo=max(1,duration/3.0);output=ROOT/'public/sfx/dungeons2-voices'/hero['id']/(action+'.ogg')
  subprocess.run(['ffmpeg','-v','error','-y','-i',str(cleaned),'-af',f'atempo={tempo:.6f},alimiter=limit=0.84:level=false','-c:a','libvorbis','-q:a','4','-ar','24000','-ac','1',str(output)],check=True);duration=float(probe(output)['format']['duration'])
  data=subprocess.check_output(['ffmpeg','-v','error','-i',str(output),'-f','f32le','-ac','1','-ar','24000','-']);samples=np.frombuffer(data,dtype='<f4');rms=float(np.sqrt(np.mean(samples*samples)));peak=float(np.max(np.abs(samples)))
  assert .3<=duration<=3.2,(output,duration);assert .005<rms<.5,(output,rms);assert peak<1.05,(output,peak);assert len(samples)>6000
  report.append({'hero':hero['id'],'action':action,'text':text,'duration':round(duration,4),'rms':round(rms,5),'peak':round(peak,5),'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest()})
  previous=output.with_suffix('.mp3')
  if previous.exists():
   archive=work/'mp3-archive';archive.mkdir(exist_ok=True);previous.replace(archive/(hero['id']+'-'+action+'.mp3'))
expected=sum(len(h['lines'])for h in design['heroes']);assert len(report)==expected
(ROOT/'assets-source/dungeons2/voice-generation.json').write_text(json.dumps({'model':design['model'],'revision':design['modelRevision'],'format':'ogg','sampleRate':24000,'channels':1,'clips':report},ensure_ascii=False,indent=2)+'\n')
print('PASS:',len(report),'real Irodori clips, OGG Vorbis, 24kHz mono, duration <=3.2s, audible RMS and peak limits; total',sum(x['bytes']for x in report),'bytes.')
