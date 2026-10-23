"""Finish nonzero waveform boundaries after full spoken-line QA, without trimming.

Uses the watermarked source WAV, a 50ms endpoint fade and 120ms quiet post-roll.
The output is encoded once; refresh speech hashes after this audible-tail repair.
"""
from pathlib import Path
import copy,hashlib,json,subprocess
import numpy as np,soundfile as sf
ROOT=Path(__file__).resolve().parents[1]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
record=ROOT/'assets/card-club/hero-voice-build.json';build=json.loads(record.read_text());qa=json.loads((ROOT/'assets/card-club/voice-speech-qa.json').read_text())['clips'];polished=[]
for key,clip in build['clips'].items():
 target=ROOT/clip['output'];data,rate=sf.read(target)
 if np.sqrt(np.mean(data[-int(rate*.04):]**2))<.05:continue
 assert sha(target)==clip['sha256']==qa[key]['sha256'],key
 assert qa[key]['similarity']>=.9,(key,'First verify the spoken words')
 hero,event=key.split('/');source=ROOT/'tmp/card-club-voices'/f'{hero}-{event}.wav';seconds=sf.info(source).duration;assert abs(seconds-clip['seconds'])<.09,key
 filters=f'loudnorm=I=-18:TP=-1.5:LRA=7,afade=t=out:st={seconds-.05:.5f}:d=0.05,apad=pad_dur=0.12'
 previous=copy.deepcopy(clip);temporary=target.with_suffix('.tmp.ogg')
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(source),'-af',filters,'-ac','1','-ar','44100','-c:a','libvorbis','-q:a','4',str(temporary)],check=True);temporary.replace(target)
 build.setdefault('history',{}).setdefault(key,[]).append(previous)
 clip.update(sha256=sha(target),seconds=round(sf.info(target).duration,4),postprocess={'source_wav_sha256':sha(source),'previous_encoded_sha256':previous['sha256'],'filters':filters,'reason':'Complete speech passed recognition; soften the final waveform boundary without shortening dialogue.'});polished.append(key)
record.write_text(json.dumps(build,ensure_ascii=False,indent=2)+'\n')
(ROOT/'assets/card-club/voice-tail-polish-keys.json').write_text(json.dumps(polished,indent=2)+'\n')
print(f'Polished {len(polished)} complete voice tails; refresh speech QA before enabling.')
