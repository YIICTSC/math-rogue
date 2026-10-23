"""Soften abrupt waveform endpoints only after the complete dialogue passed speech QA.

Never trim the utterance. Finish the last 50ms and retain a 120ms quiet tail;
regenerate from the original watermarked WAV, not a second lossy OGG encode.
"""
from pathlib import Path
import copy,hashlib,json,subprocess
import numpy as np
import soundfile as sf
ROOT=Path(__file__).resolve().parents[1]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
record=ROOT/'assets/ending-expansion/voice-build.json';build=json.loads(record.read_text())
qa=json.loads((ROOT/'assets/ending-expansion/voice-speech-qa.json').read_text())['samples'];review=json.loads((ROOT/'assets/ending-expansion/voice-speech-review.json').read_text())['samples'];polished=[]
for key,c in build['clips'].items():
 target=ROOT/c['output'];audio,rate=sf.read(target)
 if np.sqrt(np.mean(audio[-int(rate*.04):]**2))<.05:continue
 assert sha(target)==c['sha256']==qa[key]['sha256'],key
 assert max(qa[key]['reading_similarity'],review.get(key,{}).get('reading_similarity',0))>=.9,(key,'First repair the spoken words')
 theme,hero,line=key.split('/');source=ROOT/f'tmp/summer-ending-voice-source/{theme}-{hero}-{line}.wav'
 duration=sf.info(source).duration;assert abs(duration-c['seconds'])<.09,key
 filters=f'loudnorm=I=-18:TP=-1.5:LRA=7,afade=t=out:st={duration-.05:.5f}:d=0.05,apad=pad_dur=0.12'
 previous=copy.deepcopy(c);temporary=target.with_suffix('.tmp.ogg')
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(source),'-af',filters,'-ac','1','-ar','44100','-c:a','libvorbis','-q:a','4',str(temporary)],check=True);temporary.replace(target)
 build.setdefault('history',{}).setdefault(key,[]).append(previous)
 c.update(sha256=sha(target),seconds=round(sf.info(target).duration,4),postprocess={'source_wav_sha256':sha(source),'previous_encoded_sha256':previous['sha256'],'filters':filters,'reason':'Full spoken dialogue passed independent ASR; soften a nonzero final waveform boundary without shortening it.'})
 polished.append(key)
record.write_text(json.dumps(build,ensure_ascii=False,indent=2)+'\n')
if polished:(ROOT/'assets/ending-expansion/voice-tail-polish-keys.json').write_text(json.dumps(polished,indent=2)+'\n')
print(f'Polished {len(polished)} complete voice tails; refresh speech QA hashes before enabling.')
