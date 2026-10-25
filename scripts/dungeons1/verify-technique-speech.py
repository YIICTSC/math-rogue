"""Independent CPU speech sampling for every protagonist: one basic technique and all four ultimates."""
import argparse,difflib,hashlib,json,re,time,gc,ctypes,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def main():
 p=argparse.ArgumentParser();p.add_argument('--wait',action='store_true');args=p.parse_args()
 from faster_whisper import WhisperModel
 from pykakasi import kakasi
 plan=json.loads((ROOT/'assets/dungeons1/technique-voice-plan.json').read_text());report_path=ROOT/'assets/dungeons1/technique-speech-qa.json'
 report=json.loads(report_path.read_text())if report_path.exists()else{'model':'Systran/faster-whisper-small','device':'cpu','compute_type':'int8','sample_policy':'Each protagonist: sword-1 plus all four cross-weapon ultimates','expected_samples':175,'clips':{}}
 expected={h['id']+'/'+key:(h,key)for h in plan['heroes']for key in ['sword-1','ultimate-dawn','ultimate-earth','ultimate-sky','ultimate-heart']}
 kks=kakasi();model=None
 def normalize(text):
  for number,reading in enumerate(['ぜろ','いち','に','さん','よん','ご','ろく','なな','はち','きゅう']):text=text.replace(str(number),reading)
  return re.sub('[^ぁ-んー]','',''.join(c['hira']for c in kks.convert(text)))
 while True:
  build=json.loads((ROOT/'assets/dungeons1/technique-voice-build.json').read_text());pending=0
  for ident,(hero,key)in expected.items():
   clip=build['clips'].get(ident)
   if not clip:pending+=1;continue
   path=ROOT/clip['output'];digest=hashlib.sha256(path.read_bytes()).hexdigest()
   if digest!=clip['sha256']:pending+=1;continue
   if report['clips'].get(ident,{}).get('sha256')==digest:continue
   if model is None:model=WhisperModel(report['model'],device='cpu',compute_type='int8',cpu_threads=2,num_workers=1,local_files_only=True)
   segments,_=model.transcribe(str(path),language='ja',beam_size=4,condition_on_previous_text=False,vad_filter=False)
   recognized=''.join(s.text for s in segments).strip();spoken=hero['readings'][key]
   similarity=difflib.SequenceMatcher(None,normalize(spoken),normalize(recognized)).ratio()
   report['clips'][ident]={'sha256':digest,'expected':spoken,'recognized':recognized,'similarity':round(similarity,4)}
   report['flagged']=[k for k,c in report['clips'].items()if c['similarity']<.75];report['complete']=len(report['clips'])==175
   temp=report_path.with_suffix('.tmp');temp.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');temp.replace(report_path)
   print(f"{len(report['clips'])}/175 {ident} {similarity:.3f} {recognized}",flush=True)
  if pending==0:break
  if not args.wait:print(f'Waiting for {pending} sample recordings.',flush=True);return
  model=None;gc.collect()
  if sys.platform.startswith('linux'):
   trim=getattr(ctypes.CDLL(None),'malloc_trim',None)
   if trim:trim(0)
  time.sleep(5)
 print(f"COMPLETE: {len(report['clips'])}/175 speech samples; {len(report.get('flagged',[]))} require review.",flush=True)
if __name__=='__main__':main()
