"""Merge disjoint CPU voice jobs without losing existing metadata or accepting conflicting clips."""
import argparse,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def main():
 p=argparse.ArgumentParser();p.add_argument('records',nargs='+',type=Path);p.add_argument('--output',type=Path,default=ROOT/'assets/dungeons1/technique-voice-build.json');a=p.parse_args();target=a.output
 prior=json.loads(target.read_text())if target.exists()else{'clips':{}};merged=dict(prior.get('clips',{}));models=dict(prior.get('models',{}));build=prior
 for record in a.records:
  part=json.loads(record.read_text())
  assert part['model_device']==part['codec_device']=='cpu'
  for key,clip in part['clips'].items():
   assert clip.get('model_device')==clip.get('codec_device')=='cpu',f'Non-CPU clip {key}'
   if key in merged:assert merged[key]['sha256']==clip['sha256'],f'Conflicting audio for {key}'
   merged[key]=clip
  for name,model in part.get('models',{}).items():models[name]={**models.get(name,{}),**model}
  build={**build,**part}
 plan=json.loads((ROOT/'assets/dungeons1/technique-voice-plan.json').read_text());expected={h['id']+'/'+key for h in plan['heroes']for key in h['lines']};assert set(merged)<=expected
 build={**build,'clips':merged,'models':models,'cpu_workers':len(a.records),'worker_partition':'Disjoint protagonist IDs; one CPU thread per worker; individual clip metadata records actual thread counts.'}
 temp=target.with_suffix('.tmp');temp.write_text(json.dumps(build,ensure_ascii=False,indent=2)+'\n');temp.replace(target)
 print(json.dumps({'count':len(merged),'expected':len(expected),'last':list(merged)[-1]if merged else'', 'complete':set(merged)==expected}))
if __name__=='__main__':main()
