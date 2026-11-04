"""Generate, inspect, retry and integrate the banter pack; unresolved QA blocks publication."""
import argparse,datetime,fcntl,hashlib,json,os,subprocess,time
from banter_retry_queue import progress,signature,due_retries,backoff,model_groups
from pathlib import Path
root=Path(__file__).resolve().parents[2];os.chdir(root);base=root/'assets/lantern-war/banter';python=str(root.parent/'Irodori-TTS/.venv/bin/python')
p=argparse.ArgumentParser();p.add_argument('--publish',action='store_true');p.add_argument('--pilot-only',action='store_true');a=p.parse_args()
def read(name):return json.loads((base/(name+'.json')).read_text())
def write(name,value):
 file=base/(name+'.json');tmp=file.with_suffix('.tmp');tmp.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n');tmp.replace(file)
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def run(*cmd):
 print(datetime.datetime.now(datetime.timezone.utc).isoformat(),'RUN',*cmd,flush=True);subprocess.run(cmd,cwd=root,check=True)
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();guarded={str(f.relative_to(root)):sha(f)for directory in ['src/mini-games/lantern-war','scripts/lantern-war','docs/lantern-war']for f in (root/directory).rglob('*')if f.is_file()and f.suffix in ['.ts','.tsx','.py','.mjs','.json','.md','.css']and f.name!='voiceManifest.json'}
guarded.update({str(f.relative_to(root)):sha(f)for f in(root/'scripts').glob('test-lantern*.mjs')})
guarded['assets/lantern-war/pronunciations.json']=sha(root/'assets/lantern-war/pronunciations.json')
plan=read('voice-plan');clips={c['id']:c for c in plan['clips']};fallbacks=read('fallbacks')['clips'] if (base/'fallbacks.json').exists() else {};assert len(fallbacks) in (0,8);assert all(i in clips and f['target'] in clips and clips[i]['speaker']==clips[f['target']]['speaker'] and f['target'] not in fallbacks for i,f in fallbacks.items());ids=set(clips)-set(fallbacks)
if a.pilot_only:ids=set(read('pilot'))
def current():
 build=read('voice-build')if(base/'voice-build.json').exists()else{'clips':{}}
 review=read('voice-review')if(base/'voice-review.json').exists()else{'clips':{}}
 present={i:v for i,v in build['clips'].items()if(root/'public'/v['path']).is_file()}
 return build,review,progress(ids,present,review['clips'],review_version=6)
def report(state,queue):
 build,review,counts=current()
 write('unresolved',[{'id':i,'speaker':clips[i]['speaker'],'text':clips[i]['text'],'review':review['clips'].get(i),'retry':queue.get(i)}for i in sorted(counts['flagged']|counts['unreviewed'])])
 write('status',{'updated_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'planned':len(ids)+len(fallbacks),'substituted':len(fallbacks),'generated':len(counts['generated']),'reviewed':len(counts['passed']|counts['flagged']),'passed':len(counts['passed']),'unresolved':len(counts['flagged']),'unreviewed':len(counts['unreviewed']),'remaining':len(counts['missing']),'deferred':len(counts['flagged']),'state':state})
 print('PROGRESS',len(counts['generated']),'/',len(ids),'PASSED',len(counts['passed']),'DEFERRED',len(counts['flagged']),flush=True)
 return counts
with (root/'assets/lantern-war/banter-completion.lock').open('a')as lock:
 fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
 with (root/'assets/lantern-war/generation.lock').open('a')as waiting:fcntl.flock(waiting,fcntl.LOCK_EX)
 queue=read('retry-queue')if(base/'retry-queue.json').exists()else{}
 _,_,initial=current()
 if fallbacks and (initial['missing'] or initial['flagged'] or initial['unreviewed']):raise RuntimeError('Unresolved non-substituted recordings; generation is disabled under the substitution policy')
 while True:
  build,review,counts=current()
  if counts['missing'] and not counts['unreviewed']:
   report('generating',queue)
   overrides=read('voice-corrections')if(base/'voice-corrections.json').exists()else{}
   targets=set(read('pilot'))if a.pilot_only else counts['missing']
   for model,members in model_groups(targets,plan,overrides).items():
    if a.pilot_only:
     write('retakes',members);run(python,'scripts/lantern-war/generate-banter-voices.py','--model',model,'--retakes',str(base/'retakes.json'),'--batch-size','2')
    else:run(python,'scripts/lantern-war/generate-banter-voices.py','--model',model,'--batch-size','2','--limit','16')
  run(python,'scripts/lantern-war/review-banter-voices.py')
  build,review,counts=current()
  check=[i for i in counts['flagged']if review['clips'][i].get('model')!='medium']
  if check:
   write('retakes',sorted(check));run(python,'scripts/lantern-war/review-banter-voices.py','--model','medium','--only',str(base/'retakes.json'),'--force')
  run(python,'scripts/lantern-war/review-banter-japanese.py')
  build,review,counts=current();corrections=read('voice-corrections')if(base/'voice-corrections.json').exists()else{}
  if fallbacks and (counts['missing'] or counts['flagged'] or counts['unreviewed']):raise RuntimeError('A required recording failed validation; generation remains disabled')
  for i in list(queue):
   if i in counts['passed']:del queue[i]
  now=time.time();selected=due_retries(counts['flagged'],queue,build['clips'],plan,corrections,now)
  for i in selected:
   prior=queue.get(i,{})
   changed=prior.get('recipe_signature')!=signature(plan,corrections,i)or prior.get('sha256')!=build['clips'][i]['sha256']
   attempt=(0 if changed else prior.get('attempts',0))+1
   old=corrections.get(i,{})
   corrections[i]={**old,'seed_offset':old.get('seed_offset',0)+17,'steps':max(old.get('steps',4),min(16,8+4*(attempt-1)))}
   # Escalate repeated ambiguities to an explicit reading while preserving punctuation.
   if attempt>=3 and not old.get('spoken_text'):
    from voice_review_rules import readings
    text=clips[i]['text']
    for word,reading in sorted(readings.items(),key=lambda v:-len(v[0])):text=text.replace(word,reading)
    corrections[i]['spoken_text']=text # Preserve contextual kanji readings; only verified dictionary terms are expanded.
   if attempt>=3 and old.get('model',plan.get('model','Aratako/Irodori-TTS-v4.1-Small-MF')).endswith('-MF'):
    corrections[i].update(model='Aratako/Irodori-TTS-v4.1-Small',steps=40,cfg_scale_text=3.5,cfg_scale_caption=3.0,cfg_scale_speaker=5.0)
    if clips[i].get('kind')=='banter-reply':corrections[i]['seconds']=max(1.1,min(3.5,old.get('seconds',build['clips'][i].get('seconds_requested',1.5))))
    attempt=1 # A new official RF recipe starts its own bounded retry interval.
   queue[i]={'attempts':attempt,'sha256':build['clips'][i]['sha256'],'recipe_signature':signature(plan,corrections,i),'last_attempt_at':now,'next_retry_at':now+backoff(attempt),'state':'retrying'}
  if selected:
   write('voice-corrections',corrections);write('retry-queue',queue);write('retakes',selected)
   for model,members in model_groups(set(selected),plan,corrections).items():
    write('retakes',members);run(python,'scripts/lantern-war/generate-banter-voices.py','--model',model,'--retakes',str(base/'retakes.json'),'--batch-size','2')
   run(python,'scripts/lantern-war/review-banter-voices.py')
   build,review,counts=current()
   check=[i for i in selected if i in counts['flagged']]
   if check:
    write('retakes',check);run(python,'scripts/lantern-war/review-banter-voices.py','--model','medium','--only',str(base/'retakes.json'),'--force')
  run(python,'scripts/lantern-war/review-banter-japanese.py')
  build,review,counts=current()
  for i in list(queue):
   if i in counts['passed']:del queue[i]
   elif i in counts['generated']:
    queue[i]['sha256']=build['clips'][i]['sha256'];queue[i]['state']='deferred'
  write('retry-queue',queue)
  counts=report('generating'if counts['missing']else'awaiting_retry'if counts['flagged']else'pilot-verified'if a.pilot_only else'verified',queue)
  if a.pilot_only or counts['passed']==ids:break
  # Keep producing other voices; only the affected recordings wait for their next attempt.
  if counts['missing']:continue
  print('WAIT: outstanding clips remain quarantined; publication is blocked until all pass.',flush=True)
  time.sleep(30)
 if a.pilot_only:print('PILOT INSPECTED:',len(counts['generated']),'short replies,',len(counts['passed']),'passed,',len(counts['flagged']),'queued for full production; publication remains blocked.',flush=True);raise SystemExit(0)
 write('unresolved',[])
 run(python,'scripts/lantern-war/test_banter_asr_evidence.py')
 run(python,'scripts/lantern-war/test_banter_retry_queue.py')
 run(python,'scripts/lantern-war/test_banter_pronunciations.py')
 run(python,'scripts/lantern-war/test_banter_review_rules.py')
 run('node','scripts/test-lantern-banter-semantic-review.mjs')
 run('node','scripts/lantern-war/finalize-banter-voices.mjs')
 for test in ['test-lantern-war-browser.mjs','test-lantern-war-audio-browser.mjs','test-lantern-war-voice-controls.mjs','test-lantern-war-polish.mjs','test-lantern-banter.mjs','test-lantern-banter-routing.mjs','test-lantern-banter-voices.mjs','test-lantern-banter-browser.mjs','test-lantern-banter-audio-browser.mjs','test-lantern-endless-voices.mjs']:
  run('node','scripts/'+test)
 run('node','scripts/generate-minigame-media-index.mjs');run('node','scripts/generate-web-asset-manifest.mjs');run('node','scripts/generate-android-asset-manifest.mjs','--update-prefix','sfx/lantern-war/banter/');run('node','scripts/verify-android-asset-manifest.mjs')
 run('pnpm','run','audit:english:gate');run('pnpm','run','build');run('pnpm','run','server:build')
 run('node','scripts/lantern-war/finalize-banter-voices.mjs','--verify')
 if a.publish:
  assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==head,'HEAD changed; review latest main before publishing'
  for name,digest in guarded.items():assert sha(root/name)==digest,'Concurrent source edit: '+name
  run('git','fetch','origin','main');assert subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()==head,'Main changed during generation; merge and revalidate before publishing'
  assert not subprocess.check_output(['git','diff','--cached','--name-only'],text=True).strip(),'Existing staged changes require review; do not include parallel user work in this commit'
  run('git','add','scripts/lantern-war/banter_asr_evidence.py','scripts/lantern-war/test_banter_asr_evidence.py','scripts/lantern-war/review-banter-japanese.py','scripts/lantern-war/banter-semantic-review.mjs','scripts/test-lantern-banter-semantic-review.mjs','scripts/lantern-war/banter_review_rules.py','scripts/lantern-war/test_banter_review_rules.py','assets/lantern-war/pronunciations.json','scripts/lantern-war/test_banter_pronunciations.py','assets/lantern-war/banter','public/sfx/lantern-war/banter','src/mini-games/lantern-war/LanternWar.tsx','src/mini-games/lantern-war/voiceManifest.json','src/mini-games/lantern-war/banterVoicePolicy.json','scripts/lantern-war/prepare-banter-voices.mjs','scripts/lantern-war/generate-banter-voices.py','scripts/lantern-war/review-banter-voices.py','scripts/lantern-war/finalize-banter-voices.mjs','scripts/lantern-war/complete-banter-voices.py','scripts/lantern-war/banter_retry_queue.py','scripts/lantern-war/test_banter_retry_queue.py','scripts/test-lantern-banter-voices.mjs','scripts/test-lantern-banter-routing.mjs','scripts/test-lantern-banter-audio-browser.mjs','scripts/test-lantern-endless-voices.mjs','docs/lantern-war/banter-voices.md','docs/lantern-war/banter-voice-selection.md','src/generated/miniGameMediaIndex.json','src/generated/androidAssetPackVersions.ts','public/android-asset-pack-manifest.json')
  run('git','diff','--cached','--check');run('git','commit','-m','Add curated full dialogue and character reply voices for pre-battle banter');run('git','push','origin','main')
 write('status',{'updated_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'planned':len(ids)+len(fallbacks),'substituted':len(fallbacks),'generated':len(ids),'reviewed':len(ids),'unresolved':0,'remaining':0,'state':'published'if a.publish else'complete'})
 print('COMPLETE: verified recordings and explicit same-speaker substitutions integrated, playback-tested and built.',flush=True)
