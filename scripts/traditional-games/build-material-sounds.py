"""Build short material foley from the CC0 Kenney Impact Sounds/Casino Audio packs.
Usage: python3 scripts/traditional-games/build-material-sounds.py --sources DIR
DIR contains extracted impact-sounds/ and casino-audio/ folders plus their zip files.
"""
import argparse, pathlib, hashlib, json, subprocess, tempfile, shutil
import numpy as np
p=argparse.ArgumentParser();p.add_argument('--sources',required=True);args=p.parse_args()
source=pathlib.Path(args.sources);root=pathlib.Path(__file__).resolve().parents[2]
out=root/'public/sfx/traditional-table';out.mkdir(parents=True,exist_ok=True)
meta={'license':'CC0 1.0','author':'Kenney','sources':{},'format':'MP3 mono, 44100 Hz, 96 kbit/s','clips':{}}
for pack in ['impact-sounds','casino-audio']:
 license=(source/pack/'License.txt').read_text(encoding='utf-8-sig')
 assert 'CC0' in license
 (root/'assets/traditional-games'/('LICENSE-'+pack+'.txt')).write_text('\n'.join(line.rstrip() for line in license.replace('\r','').splitlines()).strip()+'\n')
 meta['sources'][pack]={'url':'https://kenney.nl/assets/'+pack,'archive_sha256':hashlib.sha256((source/(pack+'.zip')).read_bytes()).hexdigest()}
# Each family has three distinct takes. Short tails leave room for speech and the next move.
recipes={
 'ivory':('casino-audio','chip-lay-{}.ogg',[1,2,3],1.0,180,8200,.19),
 'resin':('casino-audio','chips-stack-{}.ogg',[1,2,3],1.05,240,7400,.22),
 'bamboo':('impact-sounds','impactWood_light_{:03}.ogg',[0,1,2],1.18,230,7500,.18),
 'wood':('impact-sounds','impactWood_light_{:03}.ogg',[2,3,4],1.0,160,6100,.17),
 'peg':('impact-sounds','impactWood_light_{:03}.ogg',[0,2,4],1.24,330,7900,.12),
 'flick':('impact-sounds','impactWood_light_{:03}.ogg',[1,3,4],.9,190,3800,.12),
 'drop':('impact-sounds','impactWood_medium_{:03}.ogg',[0,1,2],1.0,130,5500,.24),
 'pocket':('impact-sounds','impactWood_medium_{:03}.ogg',[2,3,4],.85,140,4500,.26),
}
with tempfile.TemporaryDirectory(dir='/tmp') as scratch:
 for kind,(pack,pattern,variants,pitch,lo,hi,limit) in recipes.items():
  for take,index in enumerate(variants):
   src=source/pack/'Audio'/pattern.format(index)
   # Trim only the leading/trailing floor. Preserve the impact's actual texture.
   audio=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(src),'-ar','44100','-ac','1','-f','f32le','-']),dtype=np.float32)
   live=np.flatnonzero(np.abs(audio)>.004)
   assert live.size,src
   start=max(0,live[0]/44100-.003)
   duration=min(limit,(live[-1]+1)/44100-start+.025)
   stage=pathlib.Path(scratch)/'take.wav'
   filters=f'atrim=start={start:.6f}:duration={duration:.6f},asetpts=PTS-STARTPTS,asetrate={round(44100*pitch)},aresample=44100,highpass=f={lo},lowpass=f={hi}'
   if kind=='bamboo':filters+=',equalizer=f=1900:t=q:w=1.2:g=3'
   subprocess.run(['ffmpeg','-v','error','-y','-i',str(src),'-af',filters,'-ac','1',str(stage)],check=True)
   pcm=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(stage),'-f','f32le','-ac','1','-']),dtype=np.float32)
   gain=.68/max(.001,float(np.max(np.abs(pcm))))
   seconds=len(pcm)/44100
   target=out/(f'{kind}-{take}.mp3')
   finish=f'volume={gain:.6f},afade=t=in:d=0.0006,afade=t=out:st={max(0,seconds-.023):.6f}:d=0.023,apad=pad_dur=0.035'
   # Write through /tmp so an interrupted encode cannot replace a shipped sample.
   tmp=pathlib.Path(scratch)/'final.mp3'
   subprocess.run(['ffmpeg','-v','error','-y','-i',str(stage),'-af',finish,'-ac','1','-ar','44100','-b:a','96k',str(tmp)],check=True)
   target.write_bytes(tmp.read_bytes())
   info=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(target)]))
   meta['clips'][f'{kind}-{take}']={'source':pack+'/Audio/'+src.name,'source_sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'filters':[filters,finish],'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'seconds':round(info,5),'bytes':target.stat().st_size}
(root/'assets/traditional-games/sound-build.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
print('Built',len(meta['clips']),'material sounds,',sum(v['bytes'] for v in meta['clips'].values()),'bytes')
