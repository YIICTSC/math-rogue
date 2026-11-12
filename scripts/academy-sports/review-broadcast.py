"""Independent CPU Whisper reading/level checks. Never enables rejected audio."""
import argparse,hashlib,json,re,sys,time,unicodedata
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--references',action='store_true');parser.add_argument('--only');args=parser.parse_args()
 from faster_whisper import WhisperModel
 from rapidfuzz.fuzz import ratio
 from pykakasi import kakasi
 import soundfile as sf,numpy as np
 model=WhisperModel('small',device='cpu',compute_type='int8',cpu_threads=2,num_workers=1);converter=kakasi()
 def reading(t):
  t=re.sub(r'\s+','',unicodedata.normalize('NFKC',t)).replace('4ヒット','フォーヒット').replace('4つ','四つ').replace('P.K.','PK').replace('P.K','PK').replace('PK','ピーケー').replace('pk','ピーケー').replace('T','ティー').replace('t','ティー').replace('ファウル','ファール')
  for n,v in enumerate(['ゼロ','いち','に','さん','よん','ご','ろく','なな','はち','きゅう']):t=t.replace(str(n),v)
  return ''.join(c for c in ''.join(x['hira'] for x in converter.convert(t)) if c.isalnum())
 plan=json.loads((ROOT/'assets/academy-sports/broadcast-plan.json').read_text());record=ROOT/'assets/academy-sports/broadcast-review.json';review=json.loads(record.read_text()) if record.exists() else {'clips':{},'references':{}}
 build=json.loads((ROOT/'assets/academy-sports/broadcast-build.json').read_text());entries=build['references' if args.references else 'clips'];dest=review['references' if args.references else 'clips']
 lines=[{'id':role,'text':s['referenceText']} for role,s in plan['speakers'].items()] if args.references else plan['lines']
 failed=[]
 for line in lines:
  key=line['id']
  if args.only and key not in args.only.split(','):continue
  entry=entries.get(key)
  if not entry or entry.get('text')!=line['text']:failed.append(key);print('REVIEW',key,'Missing or stale generation',flush=True);continue
  path=ROOT/entry['path'];digest=sha(path)
  minimum=95 if args.references or line.get('role')=='referee' else 90
  if dest.get(key,{}).get('sha256')==digest and dest[key].get('accepted') and dest[key].get('text')==line['text'] and dest[key].get('kana_similarity',0)>=minimum:continue
  data,rate=sf.read(path);segments,info=model.transcribe(str(path),language='ja',beam_size=5,vad_filter=False,condition_on_previous_text=False)
  transcript=''.join(s.text for s in segments).strip();score=ratio(reading(transcript),reading(line['text']));peak=float(np.max(np.abs(data)));rms=float(np.sqrt(np.mean(np.square(data))));duration=len(data)/rate
  accepted=bool(score>=minimum and np.isfinite(data).all() and .003<peak<=1 and rms>.001 and .35<=duration<=12)
  dest[key]={'sha256':digest,'text':line['text'],'asr':transcript,'kana_similarity':round(score,2),'peak':round(peak,5),'rms':round(rms,5),'seconds':round(duration,3),'accepted':accepted,'reviewer':'faster-whisper-small/cpu-int8','minimum_similarity':minimum,'reading_rules':'ja-phonetic-v2'}
  if not accepted:failed.append(key)
  temp=record.with_suffix('.tmp.json');temp.write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n');temp.replace(record)
  print('PASS' if accepted else 'REVIEW',key,round(score,1),transcript,flush=True)
 print('Unresolved:',failed,flush=True)
 if failed:sys.exit(1)
if __name__=='__main__':main()
