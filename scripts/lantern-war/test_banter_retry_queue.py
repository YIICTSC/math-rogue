"""Queue and controller regression tests; model inference is stubbed, not loaded."""
import contextlib,io,json,runpy,shutil,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from banter_retry_queue import progress,due_retries,signature,backoff,model_groups

class QueueTests(unittest.TestCase):
 def test_individual_model_routes_do_not_replace_default_or_duplicate_clips(self):
  plan={'model':'mf','clips':[{'id':i}for i in ['a','b','c','d']],'clip_overrides':{}}
  self.assertEqual(model_groups({'a','b','c'},plan,{'b':{'model':'rf'}}),{'mf':['a','c'],'rf':['b']})
  self.assertEqual(model_groups({'b'},plan,{'b':{'model':'rf'}}),{'rf':['b']})
 def test_failures_do_not_hide_missing_work_or_pass_publication(self):
  b={'bad':{'sha256':'x'},'good':{'sha256':'y'}};r={'bad':{'sha256':'x','needs_review':True},'good':{'sha256':'y','needs_review':False}}
  c=progress({'bad','good','new'},b,r)
  self.assertEqual(c['missing'],{'new'});self.assertEqual(c['flagged'],{'bad'});self.assertEqual(c['passed'],{'good'})
  r['good']['sha256']='outdated';self.assertIn('good',progress({'bad','good'},b,r)['unreviewed'])
  r['bad']['banter_review_rules']=1
  self.assertIn('bad',progress({'bad'},b,r,review_version=2)['unreviewed'])
 def test_persistent_cooldown_manual_correction_and_bounds(self):
  plan={'clip_overrides':{}};b={'bad':{'sha256':'x'}};corrections={};q={'bad':{'sha256':'x','recipe_signature':signature(plan,corrections,'bad'),'attempts':2,'next_retry_at':500}}
  self.assertEqual(due_retries({'bad'},q,b,plan,corrections,100),[])
  q=json.loads(json.dumps(q));self.assertEqual(due_retries({'bad'},q,b,plan,corrections,501),['bad'])
  corrections['bad']={'spoken_text':'ともしび'};self.assertEqual(due_retries({'bad'},q,b,plan,corrections,100),['bad'])
  self.assertEqual(backoff(1),1800);self.assertLessEqual(backoff(100),21600)
 def test_corrected_recipe_does_not_keep_its_obsolete_wait_priority(self):
  plan={'clip_overrides':{}};build={'a-manual':{'sha256':'a'},'z-fresh':{'sha256':'z'}}
  queue={'a-manual':{'sha256':'a','recipe_signature':signature(plan,{},'a-manual'),'attempts':2,'next_retry_at':9999}}
  self.assertEqual(due_retries(set(build),queue,build,plan,{},100,limit=1),['z-fresh'])
  self.assertEqual(due_retries(set(build),queue,build,plan,{'a-manual':{'model':'rf'}},100,limit=1),['a-manual'])
 def test_bad_clip_is_deferred_and_other_clips_are_generated(self):
  source=Path(__file__).with_name('complete-banter-voices.py');old_cwd=Path.cwd()
  class WaitingForRetry(Exception):pass
  with tempfile.TemporaryDirectory()as directory:
   root=Path(directory);base=root/'assets/lantern-war/banter';base.mkdir(parents=True);(root/'scripts/lantern-war').mkdir(parents=True);(root/'docs/lantern-war').mkdir(parents=True)
   (base.parent/'pronunciations.json').write_text('{}')
   script=root/'scripts/lantern-war/complete-banter-voices.py';shutil.copyfile(source,script)
   clips=[{'id':i,'speaker':'actor','text':i,'path':i+'.ogg'}for i in ['bad','good','later']];plan={'clips':clips,'clip_overrides':{}};(base/'voice-plan.json').write_text(json.dumps(plan));generation=[];finalized=[];serial=0
   def write(name,d): (base/(name+'.json')).write_text(json.dumps(d))
   write('voice-corrections',{'bad':{'steps':12}})
   write('retry-queue',{'bad':{'sha256':'1','recipe_signature':signature(plan,{'bad':{'steps':12}},'bad'),'attempts':2,'next_retry_at':0}})
   def read(name):
    f=base/(name+'.json');return json.loads(f.read_text())if f.exists()else{'clips':{}}
   def run(cmd,**kwargs):
    nonlocal serial
    if any('generate-banter-voices.py'in str(v)for v in cmd):
     b=read('voice-build')
     if '--retakes'in cmd: targets=json.loads(Path(cmd[cmd.index('--retakes')+1]).read_text())
     else: targets=[c['id']for c in clips if c['id']not in b['clips']][:1];generation.extend(targets)
     for ident in targets:
      serial+=1;b['clips'][ident]={'sha256':str(serial),'path':ident+'.ogg'};(root/'public').mkdir(exist_ok=True);(root/'public'/(ident+'.ogg')).write_text('stub')
     write('voice-build',b)
    elif any('review-banter-japanese.py'in str(v)for v in cmd):return
    elif any('review-banter-voices.py'in str(v)for v in cmd):
     b=read('voice-build');r=read('voice-review');model='medium'if '--model'in cmd else'small'
     targets=json.loads(Path(cmd[cmd.index('--only')+1]).read_text())if '--only'in cmd else list(b['clips'])
     for ident in targets:
      old=r['clips'].get(ident,{})
      if '--force'not in cmd and old.get('sha256')==b['clips'][ident]['sha256']:continue
      r['clips'][ident]={'sha256':b['clips'][ident]['sha256'],'needs_review':ident=='bad','model':model,'banter_review_rules':6}
     write('voice-review',r)
    else:finalized.append(cmd)
   try:
    with patch.object(sys,'argv',[str(script)]),patch('subprocess.check_output',return_value='baseline\n'),patch('subprocess.run',side_effect=run),patch('time.sleep',side_effect=WaitingForRetry),contextlib.redirect_stdout(io.StringIO()):
     with self.assertRaises(WaitingForRetry):runpy.run_path(str(script),run_name='__main__')
    self.assertEqual(generation,['bad','good','later']);self.assertEqual(finalized,[])
    status=read('status');self.assertEqual(status['generated'],3);self.assertEqual(status['passed'],2);self.assertEqual(status['deferred'],1);self.assertEqual(status['state'],'awaiting_retry')
    self.assertEqual(read('retry-queue')['bad']['state'],'deferred');self.assertEqual(len(read('unresolved')),1)
    self.assertGreaterEqual(read('voice-corrections')['bad']['steps'],12)
    self.assertEqual(read('voice-corrections')['bad']['model'],'Aratako/Irodori-TTS-v4.1-Small')
    self.assertEqual(read('voice-corrections')['bad']['steps'],40)
   finally:
    import os;os.chdir(old_cwd)

if __name__=='__main__':unittest.main()
