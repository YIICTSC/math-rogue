"""Japanese transcript rules: preserve canonical name readings and equivalent kanji spellings."""
from pathlib import Path
import json,re,hashlib
from pykakasi import kakasi
root=Path(__file__).resolve().parents[2];kana=kakasi();dictionary_raw=(root/'assets/lantern-war/pronunciations.json').read_bytes();dictionary_sha=hashlib.sha256(dictionary_raw).hexdigest();dictionary=json.loads(dictionary_raw);names=dictionary['names'];readings={**names,**dictionary.get('skills',{}),**dictionary.get('locations',{}),**dictionary.get('transcript_aliases',{})}
def normalize(text):
 for name,reading in sorted(readings.items(),key=lambda pair:-len(pair[0])):text=text.replace(name,reading).replace(name.replace(' ',''),reading)
 text=text.replace('花咲き','はなさき')
 text=text.replace('灯火','ともしび').replace('この灯を','このともしびを')
 return re.sub('[^ぁ-ゖー]','',''.join(x['hira']for x in kana.convert(text)))
def distance(x,y):
 row=list(range(len(y)+1))
 for i,v in enumerate(x,1):
  n=[i]
  for j,w in enumerate(y,1):n.append(min(n[-1]+1,row[j]+1,row[j-1]+(v!=w)))
  row=n
 return row[-1]
def assess(clip,heard):
 expected=clip.get('spoken_text',clip['text']);x,y=normalize(expected),normalize(heard);cer=round(distance(x,y)/max(1,len(x)),4);name=clip['text'].split('、')[0]if clip.get('kind')=='support-name'else None;verified=normalize(name).replace('ー','')in y.replace('ー','') if name else True
 return {'expected':expected,'cer':cer,'needs_review':not heard or cer>(.4 if len(x)<8 else .3)or not verified,'required_name':name,'name_verified':verified,'review_rules':2,'dictionary_sha256':dictionary_sha}
if __name__=='__main__':
 import fcntl
 path=root/'assets/lantern-war/voice-review.json';build=json.loads((root/'assets/lantern-war/voice-build.json').read_text())
 with path.with_suffix('.lock').open('w')as lock:
  fcntl.flock(lock,fcntl.LOCK_EX);review=json.loads(path.read_text())
  for ident,v in review['clips'].items():
   clip=build['clips'].get(ident)
   if clip and clip['sha256']==v['sha256']:v.update(assess(clip,v['heard']))
  tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n');tmp.replace(path)
 print('Renormalized',len(review['clips']),'flagged',sum(v['needs_review']for v in review['clips'].values()))
