"""CPU speech/audio QA; save recognitions, hashes and measurements for every line."""
from pathlib import Path
import argparse,difflib,hashlib,json,re,sys,time
ROOT=Path(__file__).resolve().parents[1]
def normalize_spoken(text,kks):
 text=text.replace('今日は','きょうは').replace('札','ふだ').replace('1本','いっぽん').replace('1手','いって')
 text=re.sub('[0-9]',lambda m:['ぜろ','いち','に','さん','よん','ご','ろく','なな','はち','きゅう'][int(m[0])],text)
 return re.sub('[^ぁ-んーa-z]','',''.join(x['hira']for x in kks.convert(text)).lower())
def main():
 p=argparse.ArgumentParser();p.add_argument('--resume',action='store_true');p.add_argument('--report',type=Path);p.add_argument('--keys',type=Path);p.add_argument('--speech',action='store_true');p.add_argument('--model',choices=['small','turbo'],default='small');p.add_argument('--wait',action='store_true');p.add_argument('--only-flagged',action='store_true');p.add_argument('--enable',action='store_true');a=p.parse_args()
 import numpy as np,soundfile as sf
 sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
 plan=json.loads((ROOT/'assets/card-club/hero-voice-plan.json').read_text());selected=set(json.loads(a.keys.read_text()))if a.keys else None;qa_path=a.report or ROOT/'assets/card-club/voice-speech-qa.json';qa=json.loads(qa_path.read_text())if qa_path.exists()else{'clips':{}}
 model=None
 if a.speech:
  from faster_whisper import WhisperModel
  from pykakasi import kakasi
  kks=kakasi();normalize=lambda text:normalize_spoken(text,kks)
  model_id='Systran/faster-whisper-small'if a.model=='small'else'mobiuslabsgmbh/faster-whisper-large-v3-turbo'
  model=WhisperModel(model_id,device='cpu',compute_type='int8',cpu_threads=1,num_workers=1,local_files_only=True)
 durations={};hashes=set();tail_flags=[]
 for hero in plan['heroes']:
  assert sha(ROOT/hero['reference'])==hero['reference_sha256']
  for event,text in hero['lines'].items():
   key=hero['id']+'/'+event;target=ROOT/'public/sfx/card-club-voices'/hero['id']/(event+'.ogg')
   if selected is not None and key not in selected:continue
   deadline=time.monotonic()+3600
   while not target.exists()and a.wait:
    if time.monotonic()>deadline:raise RuntimeError('Timed out '+key)
    time.sleep(3)
   if not target.exists():raise RuntimeError('Missing '+key)
   build=json.loads((ROOT/'assets/card-club/hero-voice-build.json').read_text());clip=build['clips'].get(key)
   # Generator replaces the audio before atomically publishing its metadata.
   while clip is None and a.wait:
    time.sleep(1);build=json.loads((ROOT/'assets/card-club/hero-voice-build.json').read_text());clip=build['clips'].get(key)
   digest=sha(target);assert clip['sha256']==digest and digest not in hashes,key;hashes.add(digest)
   assert clip['model_device']==clip['codec_device']=='cpu'and clip['silentcipher_watermark']and clip['irodori_revision']==build['irodori_revision'],key
   assert clip['text']==text and clip['reference_sha256']==hero['reference_sha256'],key
   data,rate=sf.read(target);assert rate==44100 and data.ndim==1 and .35<len(data)/rate<9.95 and np.isfinite(data).all()and np.max(np.abs(data))>.003,key
   tail_rms=float(np.sqrt(np.mean(data[-int(rate*.04):]**2)))
   if tail_rms>=.05:tail_flags.append(key)
   assert abs(clip['seconds']-len(data)/rate)<.09,key
   durations[key]=int(np.ceil(len(data)/rate*1000))
   prior=qa['clips'].get(key,{})
   if model and(not a.resume or prior.get('sha256')!=digest)and(prior.get('sha256')!=digest or not a.only_flagged or prior.get('similarity',0)<.85):
    if a.only_flagged and prior.get('sha256')==digest and prior.get('similarity',0)>=.85:continue
    segments,info=model.transcribe(str(target),language='ja',beam_size=4,condition_on_previous_text=False,vad_filter=False)
    recognized=''.join(seg.text for seg in segments).strip();similarity=difflib.SequenceMatcher(None,normalize(text),normalize(recognized)).ratio()
    result={'sha256':digest,'expected':text,'recognized':recognized,'similarity':round(similarity,4),'model':model_id,'compute':'cpu-int8','normalization':'card-reading-v3','tail_rms':round(tail_rms,5)}
    if prior.get('sha256')==digest:
     result['prior']={k:v for k,v in prior.items()if k!='prior'}
     if prior.get('similarity',0)>similarity:result={**prior,'secondary':result}
    qa['clips'][key]=result;qa_path.write_text(json.dumps(qa,ensure_ascii=False,indent=2)+'\n');print(f"{len(qa['clips'])}/104 {key} {similarity:.2f} {recognized}",flush=True)
 assert len(durations)==(len(selected)if selected is not None else 104) and len(hashes)==len(durations)
 flagged=[(key,item['recognized'],item['similarity'])for key,item in qa['clips'].items()if item['similarity']<.85]
 print(json.dumps({'audioClips':len(durations),'speechClips':len(qa['clips']),'flagged':flagged,'tail_flags':tail_flags},ensure_ascii=False),flush=True)
 if a.enable:
  assert len(qa['clips'])==104 and not flagged and not tail_flags,'Unresolved speech/tail flags'
  for key in durations:assert qa['clips'][key]['sha256']==sha(ROOT/'public/sfx/card-club-voices'/(key+'.ogg'))
  path=ROOT/'src/data/cardClubVoices.ts';s=path.read_text();s=re.sub(r'export const CARD_CLUB_VOICE_MS:Record<string,number>=\{[\s\S]*?\};', 'export const CARD_CLUB_VOICE_MS:Record<string,number>='+json.dumps(durations,indent=2)+';',s);path.write_text(s)
if __name__=='__main__':main()
