"""Finish the reference-matched story/technique pack; fail closed on unresolved QA."""
import argparse,datetime,fcntl,hashlib,json,os,subprocess,sys
from pathlib import Path
root=Path(__file__).resolve().parents[2];os.chdir(root)
p=argparse.ArgumentParser();p.add_argument('--publish',action='store_true');args=p.parse_args()
python=str(root.parent/'Irodori-TTS/.venv/bin/python');base=root/'assets/lantern-war'
def run(*cmd):
 print(datetime.datetime.now(datetime.timezone.utc).isoformat(),'RUN',*cmd,flush=True)
 subprocess.run(cmd,check=True,cwd=root)
def read(name):return json.loads((base/(name+'.json')).read_text())
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
# Do not commit edits made by another session during this long generation job.
source_paths=[*root.glob('scripts/lantern-war/*.*'),*root.glob('scripts/test-lantern-war*'),*root.glob('src/mini-games/lantern-war/*'),*root.glob('docs/lantern-war/*')]
guarded={str(path.relative_to(root)):sha(path)for path in source_paths if path.is_file()and path.name!='voiceManifest.json'}
with (base/'completion.lock').open('w')as lock:
 fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
 # An already active generator keeps its current batch; then fill the latest plan.
 with (base/'generation.lock').open('a')as pending:fcntl.flock(pending,fcntl.LOCK_EX)
 # A changed speaker must not leave a wrong-speaker recording in the shipped pack.
 plan=read('voice-plan');build=read('voice-build');review=read('voice-review');valid={c['id']for c in plan['clips']};stale=[i for i in build['clips']if i not in valid]
 if stale:
  archive=root/'tmp/lantern-voices/pruned-stories';archive.mkdir(parents=True,exist_ok=True);removed={}
  for ident in stale:
   clip=build['clips'][ident];assert clip['kind']=='story','Unexpected stale battle recording: '+ident
   file=root/'public'/clip['path'];assert sha(file)==clip['sha256'],'Do not overwrite externally edited audio'
   file.replace(archive/(ident+'.ogg'));removed[ident]={'build':build['clips'].pop(ident),'review':review['clips'].pop(ident,None)}
  (archive/'records.json').write_text(json.dumps(removed,ensure_ascii=False,indent=2)+'\n')
  for name,value in [('voice-build',build),('voice-review',review)]:
   target=base/(name+'.json');tmp=target.with_suffix('.tmp');tmp.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n');tmp.replace(target)
  print('Archived',len(stale),'superseded story-speaker recordings',flush=True)
 run(python,'scripts/lantern-war/generate-voices.py','--batch-size','2')
 run(python,'scripts/lantern-war/review-voices.py')
 for attempt in range(3):
  plan=read('voice-plan');review=read('voice-review');build=read('voice-build')
  flagged=[c['id']for c in plan['clips']if review['clips'].get(c['id'],{}).get('needs_review',True)]
  if not flagged:break
  run(python,'scripts/lantern-war/review-voices.py','--model','medium','--beam-size','3','--only',','.join(flagged),'--force')
  review=read('voice-review');flagged=[i for i in flagged if review['clips'][i]['needs_review']]
  if not flagged:break
  if attempt==2:raise RuntimeError('Pronunciation needs individual inspection: '+','.join(flagged))
  corrections=read('voice-corrections')
  for ident in flagged:
   old={**plan.get('clip_overrides',{}).get(ident,{}),**corrections.get(ident,{})}
   corrections[ident]={**old,'seed_offset':old.get('seed_offset',0)+17,'steps':max(20,old.get('steps',12))}
  (base/'voice-corrections.json').write_text(json.dumps(corrections,ensure_ascii=False,indent=2)+'\n')
  retakes=root/'tmp/lantern-story-retakes.json';retakes.parent.mkdir(exist_ok=True);retakes.write_text(json.dumps(flagged))
  # Keep the plan in sync with live corrections for recipe verification.
  for ident in flagged:plan.setdefault('clip_overrides',{})[ident]=corrections[ident]
  (base/'voice-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
  run(python,'scripts/lantern-war/generate-voices.py','--retakes',str(retakes),'--batch-size','2')
  run(python,'scripts/lantern-war/review-voices.py')
 run('node','scripts/lantern-war/finalize-voices.mjs')
 for test in ['battle-voice-catalog','voice-controls','techniques','audio-browser']:
  run('node','scripts/test-lantern-war-'+test+'.mjs')
 run('node','scripts/generate-android-asset-manifest.mjs','--update-prefix','sfx/lantern-war/');run('node','scripts/verify-android-asset-manifest.mjs')
 run('pnpm','run','audit:english:gate');run('pnpm','run','build');run('pnpm','run','server:build')
 run('git','diff','--check')
 if args.publish:
  assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==head,'HEAD changed; review before publishing'
  for name,digest in guarded.items():assert sha(root/name)==digest,'Concurrent source edit; review before publishing: '+name
  # Only this task's sources, records and generated audio; exclude unrelated build output.
  paths=['src/generated/androidAssetPackVersions.ts','src/generated/miniGameMediaIndex.json','assets/lantern-war/voice-catalog.json','assets/lantern-war/voice-plan.json','assets/lantern-war/voice-policy.json','assets/lantern-war/voice-build.json','assets/lantern-war/voice-review.json','assets/lantern-war/voice-corrections.json','assets/lantern-war/restored-narration.json','scripts/lantern-war/restore-narration.mjs','scripts/lantern-war/catalog.mjs','scripts/lantern-war/generate-voices.py','scripts/lantern-war/review-voices.py','scripts/lantern-war/prepare-voices.py','scripts/lantern-war/finalize-voices.mjs','scripts/lantern-war/prepare-story-techniques.mjs','scripts/lantern-war/complete-story-voices.py','scripts/test-lantern-war-battle-voice-catalog.mjs','scripts/test-lantern-war-voice-controls.mjs','scripts/test-lantern-war-audio-browser.mjs','src/mini-games/lantern-war/story.ts','src/mini-games/lantern-war/techniques.ts','src/mini-games/lantern-war/techniqueCopy.json','src/mini-games/lantern-war/voiceManifest.json','docs/lantern-war/story-technique-voices.md','docs/lantern-war/adult-battle-voices.md','docs/lantern-war/voice-reset.md','public/sfx/lantern-war']
  # Asset indexes are generated by the required production build.
  indexed=subprocess.check_output(['git','diff','--name-only'],text=True).splitlines()
  paths += [name for name in indexed if 'asset' in name.lower()and ('manifest' in name.lower()or 'pack' in name.lower())and name.startswith(('public/','android/'))]
  run('git','add','--',*paths);run('git','diff','--cached','--check')
  run('git','commit','-m','Add reference-matched story and shouted personal-technique voices')
  run('git','push','origin','HEAD:main')
 print('COMPLETE: all planned voices reviewed, packaged, playback-tested and built'+('; main push succeeded'if args.publish else''),flush=True)
