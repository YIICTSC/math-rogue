"""Serial CPU speech QA and targeted reading repairs; never enables unverified audio."""
from pathlib import Path
import argparse,hashlib,json,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--python',default=str(ROOT.parent/'irodori-kocho/.venv/bin/python'));p.add_argument('--repair-passes',type=int,default=3);a=p.parse_args()
def run(script,*args):
 print('RUN',script,*args,flush=True);subprocess.run([a.python,str(ROOT/'scripts'/script),*args],cwd=ROOT,check=True)
def flags():
 q=json.loads((ROOT/'assets/paper-plane/voice-speech-qa.json').read_text());keys={k for k,v in q['clips'].items()if v['similarity']<.85}
 report=ROOT/'assets/paper-plane/voice-keyphrase-qa.json'
 if report.exists():
  phrases=json.loads(report.read_text())
  keys.update(k for k in phrases['failed']if phrases['clips'][k]['sha256']==q['clips'][k]['sha256'])
 return sorted(keys)
# The senior admiral uses an existing mature fictional antagonist voice,
# rather than a teenage protagonist reference. Apply after the active MF batch.
plan_path=ROOT/'assets/paper-plane/bridge-voice-plan.json';plan=json.loads(plan_path.read_text())
admiral=next(c for c in plan['characters']if c['id']=='rival-3')
admiral_ref='public/sfx/kocho-enemy-voices/enemy-09/spawn.ogg'
record=json.loads((ROOT/'assets/paper-plane/bridge-voice-build.json').read_text())
if admiral['reference']!=admiral_ref or any(record['clips'][admiral['id']+'/'+key]['reference']!=admiral_ref for key in admiral['lines']):
 admiral['reference']=admiral_ref;admiral['reference_sha256']=hashlib.sha256((ROOT/admiral_ref).read_bytes()).hexdigest();plan_path.write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
 keys=ROOT/'tmp/paper-plane/admiral-keys.json';keys.write_text(json.dumps([admiral['id']+'/'+key for key in admiral['lines']]))
 run('generate-paper-plane-voices-irodori.py','--device','cpu','--cpu-autocast','--reading','--keys',str(keys))
run('verify-paper-plane-voices.py','--speech','--resume')
if flags():run('verify-paper-plane-voices.py','--speech','--model','turbo','--only-flagged')
run('audit-paper-plane-keyphrases.py')
for attempt in range(a.repair_passes):
 remaining=flags()
 if not remaining:break
 keys=ROOT/'tmp/paper-plane'/f'voice-repair-pass-{attempt+1}.json';keys.parent.mkdir(parents=True,exist_ok=True);keys.write_text(json.dumps(remaining,indent=2)+'\n')
 print('Repairing',len(remaining),'flagged utterances on CPU:',remaining,flush=True)
 run('generate-paper-plane-voices-irodori.py','--device','cpu','--cpu-autocast','--model','Aratako/Irodori-TTS-v4.1-Small','--steps','16','--reading','--extra-seconds',str(.55+.15*attempt),'--seed-offset',str(2201+attempt*211),'--keys',str(keys))
 run('verify-paper-plane-voices.py','--speech','--resume')
 if flags():run('verify-paper-plane-voices.py','--speech','--model','turbo','--only-flagged')
 run('audit-paper-plane-keyphrases.py')
if flags():raise RuntimeError('Speech flags remain; inspect before enabling: '+str(flags()))
run('audit-paper-plane-keyphrases.py','--strict')
run('verify-paper-plane-voices.py','--enable')
subprocess.run(['node','scripts/measure-paper-plane-voice-playback.mjs'],cwd=ROOT,check=True)
subprocess.run(['node','scripts/test-paper-plane-voices.mjs'],cwd=ROOT,check=True)
print(f"All {plan['total_clips']} CPU-generated bridge voices verified and enabled.",flush=True)
