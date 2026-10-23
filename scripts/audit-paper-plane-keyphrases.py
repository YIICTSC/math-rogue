"""Check the requested bridge catchphrases against independent speech recognitions."""
from pathlib import Path
import argparse,hashlib,importlib.util,json
from pykakasi import kakasi
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--strict',action='store_true');a=p.parse_args()
spec=importlib.util.spec_from_file_location('bridge_speech',ROOT/'scripts/verify-paper-plane-voices.py');speech=importlib.util.module_from_spec(spec);spec.loader.exec_module(speech)
plan=json.loads((ROOT/'assets/paper-plane/bridge-voice-plan.json').read_text());qa=json.loads((ROOT/'assets/paper-plane/voice-speech-qa.json').read_text());kks=kakasi();proof={};failed=[]
for c in plan['characters']:
 for event,text in c['lines'].items():
  tokens=[]
  for written,spoken in [('迂闊な','うかつな'),('撃ち方','うちかたはじめ'),('左舷ブラスター','さげんぶらすたーようい'),('回避','かいひ'),('通さん','とうさん')]:
   if written in text:tokens.append(spoken)
  if not tokens:continue
  key=c['id']+'/'+event;item=qa['clips'][key];target=ROOT/'public/sfx/paper-plane-voices'/(key+'.ogg');digest=hashlib.sha256(target.read_bytes()).hexdigest();assert digest==item['sha256'],('Stale speech proof',key)
  # よーい and ようい are the same long-vowel pronunciation.
  recognized=speech.normalize_spoken(item['recognized'],kks).replace('よーい','ようい');missing=[token for token in tokens if token not in recognized]
  proof[key]={'sha256':digest,'required_readings':tokens,'recognized':item['recognized'],'normalized':recognized,'missing':missing,'model':item['model']}
  if missing:failed.append(key)
report={'clips':proof,'failed':failed};(ROOT/'assets/paper-plane/voice-keyphrase-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'keyphraseClips':len(proof),'failed':failed},ensure_ascii=False),flush=True)
if a.strict and failed:raise SystemExit('Requested keyphrases need clearer speech: '+str(failed))
