"""Trim an unwanted lead-in using independent CPU ASR word timestamps.
Keeps the original outside public/ and records the exact edit; release still
requires review-broadcast.py. Does not synthesize or change the speaker.
"""
import argparse,hashlib,json,subprocess,unicodedata
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 p=argparse.ArgumentParser();p.add_argument('--id',required=True);p.add_argument('--word',required=True);a=p.parse_args()
 from faster_whisper import WhisperModel
 import soundfile as sf
 record=ROOT/'assets/academy-sports/broadcast-build.json';build=json.loads(record.read_text());entry=build['clips'][a.id]
 plan=json.loads((ROOT/'assets/academy-sports/broadcast-plan.json').read_text());assert any(l['id']==a.id and l['text']==entry['text'] for l in plan['lines'])
 path=ROOT/entry['path'];assert sha(path)==entry['sha256']
 if entry.get('trim'):print('Already trimmed:',a.id);return
 model=WhisperModel('small',device='cpu',compute_type='int8',cpu_threads=2,num_workers=1)
 segments,_=model.transcribe(str(path),language='ja',beam_size=5,word_timestamps=True,condition_on_previous_text=False,vad_filter=False)
 words=[w for s in segments for w in (s.words or [])]
 print('Aligned words:',[(w.word,w.start,w.end) for w in words],flush=True)
 aliases=[a.word]+(['P','ピー','ぴー'] if a.word.upper()=='PK' else [])
 index=next(i for i,w in enumerate(words) if any(v.casefold() in unicodedata.normalize('NFKC',w.word).casefold() for v in aliases))
 start=max(0,words[index].start-.02);duration=sf.info(path).duration;end=min(duration,words[-1].end+.09)
 assert start>.05 and end-start>.35, 'No safe lead-in to trim'
 source_hash=sha(path);source=ROOT/f'assets/academy-sports/review-sources/{a.id.replace("/","-")}-{source_hash[:12]}.ogg';source.parent.mkdir(parents=True,exist_ok=True);source.write_bytes(path.read_bytes())
 output=path.with_suffix('.trim.ogg')
 subprocess.run(['ffmpeg','-v','error','-y','-ss',str(start),'-i',str(source),'-t',str(end-start),'-af','loudnorm=I=-18:TP=-1.5:LRA=7','-ac','1','-ar','48000','-c:a','libvorbis','-q:a','6',str(output)],check=True);output.replace(path)
 entry['trim']={'source':str(source.relative_to(ROOT)),'source_sha256':source_hash,'start_seconds':start,'end_seconds':end,'word':a.word,'asr_before':''.join(w.word for w in words),'method':'CPU Whisper Small word timestamps + ffmpeg'}
 entry['sha256']=sha(path);entry['seconds']=round(sf.info(path).duration,3)
 temp=record.with_suffix('.tmp.json');temp.write_text(json.dumps(build,ensure_ascii=False,indent=2)+'\n');temp.replace(record)
 print('Trimmed',a.id,start,end,entry['seconds'],flush=True)
if __name__=='__main__':main()
