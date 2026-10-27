"""Read-only CPU ASR + waveform QA. Reports mismatches; never alters generated speech."""
import argparse,hashlib,json,re,time
from pathlib import Path
import numpy as np,soundfile as sf
from faster_whisper import WhisperModel
from pykakasi import kakasi
ROOT=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--limit',type=int);p.add_argument('--model',default='small');p.add_argument('--beam-size',type=int,default=1);p.add_argument('--threads',type=int,default=2);p.add_argument('--recheck-flagged',action='store_true');p.add_argument('--output',type=Path);p.add_argument('--refresh-only',action='store_true');args=p.parse_args();kana=kakasi()
plan=json.loads((ROOT/'assets/sports-performances/voice-plan.json').read_text());technique_readings={}
for speaker in plan['voices']:
 for sport,lines in speaker['lines'].items():
  reading=speaker.get('readings',{}).get(sport,{}).get('special')
  if reading:technique_readings[lines['special'].split('、')[0]]=reading.split('、')[0]
def norm(text):
 for word,reading in sorted(technique_readings.items(),key=lambda item:-len(item[0])):text=text.replace(word,reading)
 for word,reading in {'star':'すたー','drive':'どらいぶ','burst':'ばーすと','break':'ぶれいく','smash':'すまっしゅ'}.items():text=re.sub(r'\b'+word+r'\b',reading,text,flags=re.I)
 text=re.sub(r'([0-9])日',lambda m:'零一二三四五六七八九'[int(m[1])]+'日',text)
 text=text.replace('1本','一本').replace('2','ツー').replace('3','スリー');text=''.join(x['hira']for x in kana.convert(text));return re.sub('[^ぁ-ゖー]','',text)
def distance(a,b):
 prev=list(range(len(b)+1))
 for i,x in enumerate(a,1):
  curr=[i]
  for j,y in enumerate(b,1):curr.append(min(curr[-1]+1,prev[j]+1,prev[j-1]+(x!=y)))
  prev=curr
 return prev[-1]
record=args.output or ROOT/'assets/sports-performances/voice-asr-review.json';review=json.loads(record.read_text())if record.exists()else{'model':args.model,'device':'cpu','compute':'int8','clips':{}}
review['normalization']='Kana via pykakasi, canonical technique readings from the plan, standard English sports loanwords and Japanese counters; original ASR transcripts are retained.'
build=json.loads((ROOT/'assets/sports-performances/voice-build.json').read_text());model=None;count=0
for ident,clip in build['clips'].items():
 path=ROOT/clip['output'];digest=hashlib.sha256(path.read_bytes()).hexdigest();prior=review['clips'].get(ident,{})
 if prior.get('sha256')==digest:
  a,b=norm(prior['spoken_text']),norm(prior['heard']);cer=round(distance(a,b)/max(1,len(a)),4);prior.update(kana_expected=a,kana_heard=b,cer=cer,needs_review=not prior['heard'] or cer>(.4 if len(a)<7 else .32))
  if not(args.recheck_flagged and prior.get('needs_review')):continue
 if args.refresh_only:continue
 if args.recheck_flagged and not prior.get('needs_review'):continue
 if args.limit is not None and count>=args.limit:break
 if model is None:model=WhisperModel(args.model,device='cpu',compute_type='int8',cpu_threads=args.threads,num_workers=1,local_files_only=True)
 data,rate=sf.read(path);rms=float(np.sqrt(np.mean(data**2)));peak=float(np.max(np.abs(data)));assert .35<len(data)/rate<6.3 and .002<rms<.6 and np.isfinite(data).all(),ident
 segments,info=model.transcribe(str(path),language='ja',beam_size=args.beam_size,max_new_tokens=64,condition_on_previous_text=False,vad_filter=False,initial_prompt='スポーツの日本語の掛け声。ゴルフ、テニス、バスケットボール、ドッジボール。')
 segs=list(segments);actual=''.join(s.text for s in segs).strip();expected=clip.get('spoken_text',clip['text']);a,b=norm(expected),norm(actual);cer=round(distance(a,b)/max(1,len(a)),4)
 issue=not actual or cer>(.4 if len(a)<7 else .32)
 review['clips'][ident]={'asr_model':args.model,'beam_size':args.beam_size,'previous':({k:v for k,v in prior.items()if k!='previous'} if prior else None),'text':clip['text'],'spoken_text':expected,'heard':actual,'kana_expected':a,'kana_heard':b,'cer':cer,'needs_review':issue,'seconds':round(len(data)/rate,3),'rms':round(rms,5),'peak':round(peak,5),'sha256':digest};temp=record.with_suffix('.tmp');temp.write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n');temp.replace(record);count+=1;print(('REVIEW'if issue else'OK'),ident,expected,'=>',actual,cer,flush=True)
temp=record.with_suffix('.tmp');temp.write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n');temp.replace(record)
print('Reviewed',len(review['clips']),'flagged',sum(x['needs_review']for x in review['clips'].values()),flush=True)
