"""Recheck low-confidence short Japanese calls with an independent larger CPU ASR model.

Proper technique names can confuse small ASR. Preserve both recognitions and
record the actual audio hash; never turn a stale result into a passing review.
"""
import argparse,difflib,hashlib,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def main():
 p=argparse.ArgumentParser();p.add_argument('--threads',type=int,default=2);a=p.parse_args()
 from faster_whisper import WhisperModel
 from pykakasi import kakasi
 primary=json.loads((ROOT/'assets/dungeons1/technique-speech-qa.json').read_text())
 path=ROOT/'assets/dungeons1/technique-speech-review.json'
 report=json.loads(path.read_text())if path.exists()else{'model':'Systran/faster-whisper-medium','device':'cpu','compute_type':'int8','policy':'Independent larger-model recheck of primary phonetic similarity below 0.75; no transcript prompt','clips':{}}
 build=json.loads((ROOT/'assets/dungeons1/technique-voice-build.json').read_text());kks=kakasi();model=None
 report['clips']={ident:c for ident,c in report['clips'].items()if c['sha256']==build['clips'].get(ident,{}).get('sha256')}
 def normalize(text):
  for number,reading in enumerate(['ぜろ','いち','に','さん','よん','ご','ろく','なな','はち','きゅう']):text=text.replace(str(number),reading)
  return re.sub('[^ぁ-んー]','',''.join(c['hira']for c in kks.convert(text)))
 for ident in primary['flagged']:
  clip=build['clips'][ident];audio=ROOT/clip['output'];digest=hashlib.sha256(audio.read_bytes()).hexdigest();assert digest==clip['sha256']
  if report['clips'].get(ident,{}).get('sha256')==digest:continue
  if model is None:model=WhisperModel(report['model'],device='cpu',compute_type='int8',cpu_threads=a.threads,num_workers=1,local_files_only=True)
  segments,_=model.transcribe(str(audio),language='ja',beam_size=5,condition_on_previous_text=False,vad_filter=False)
  text=''.join(s.text for s in segments).strip();expected=primary['clips'][ident]['expected'];similarity=difflib.SequenceMatcher(None,normalize(expected),normalize(text)).ratio()
  report['clips'][ident]={'sha256':digest,'expected':expected,'recognized':text,'similarity':round(similarity,4)}
  path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(f'{ident} {similarity:.3f} {text}',flush=True)
 report['flagged']=[ident for ident in primary['flagged']if report['clips'].get(ident,{}).get('sha256')!=primary['clips'][ident]['sha256']or report['clips'][ident]['similarity']<.75]
 path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(f"COMPLETE: {len(primary['flagged'])} rechecked; {len(report['flagged'])} need retakes/review.",flush=True)
if __name__=='__main__':main()
