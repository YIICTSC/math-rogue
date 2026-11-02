"""CPU ASR and waveform review for the isolated endless battle set."""
import json,hashlib,fcntl,argparse
from pathlib import Path
root=Path(__file__).resolve().parents[2];base=root/'assets/lantern-war/endless';p=argparse.ArgumentParser();p.add_argument('--medium',action='store_true');p.add_argument('--glossary',action='store_true');p.add_argument('--only',action='append',default=[]);args=p.parse_args()
lock=(root/'assets/lantern-war/cpu-audio-heavy.lock').open('a');fcntl.flock(lock,fcntl.LOCK_EX)
import numpy as np,soundfile as sf
from faster_whisper import WhisperModel
plan=json.loads((base/'voice-plan.json').read_text());build=json.loads((base/'voice-build.json').read_text());out=base/('voice-review-dictionary.json'if args.glossary else 'voice-review-medium.json'if args.medium else 'voice-review.json');review=json.loads(out.read_text())if out.exists()else{}
hint='日本語のファンタジー戦闘台詞。固有技名：'+ '、'.join(c['text']+'（'+plan['clip_overrides'][c['id']].get('spoken_text',c['text'])+'）'for c in plan['clips']if c['kind']=='ultimate') if args.glossary else None
m=WhisperModel('medium'if args.medium or args.glossary else 'small',device='cpu',compute_type='int8',cpu_threads=2,num_workers=1,local_files_only=True)
clips=[*plan['clips'],*[{'id':'reference-'+k,'speaker':k,'text':v['design_text'],'path':v['reference'],'reference':True}for k,v in plan['speakers'].items()]]
for c in clips:
 if args.only and c['id']not in args.only:continue
 path=root/c['path']if c.get('reference')else root/'public'/c['path'];digest=hashlib.sha256(path.read_bytes()).hexdigest()
 if review.get(c['id'],{}).get('sha256')==digest:continue
 audio,sr=sf.read(path);segments,_=m.transcribe(str(path),language='ja',beam_size=3,condition_on_previous_text=False,max_new_tokens=110,initial_prompt=hint)
 text=''.join(s.text for s in segments);review[c['id']]={'speaker':c['speaker'],'text':c['text'],'asr':text,'sha256':digest,'duration':len(audio)/sr,'peak':float(np.max(np.abs(audio))),'rms':float(np.sqrt(np.mean(audio**2))),'clipped_fraction':float(np.mean(np.abs(audio)>=.999)),'initial_prompt':hint,'model':'Whisper medium'if args.medium or args.glossary else 'Whisper small','device':'cpu'};tmp=out.with_suffix('.tmp');tmp.write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n');tmp.replace(out);print(c['speaker'],c['text'],'=>',text,flush=True)
print('REVIEW COMPLETE',len(review),flush=True)
