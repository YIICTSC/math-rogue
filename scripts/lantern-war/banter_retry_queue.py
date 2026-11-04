"""Pure queue policy: pronunciation failures never block new recordings or permit publication."""
import hashlib,json

def progress(ids,build,review,review_version=None):
 generated=set(ids)&set(build)
 current={i for i in generated if review.get(i,{}).get('sha256')==build[i]['sha256'] and (review_version is None or review.get(i,{}).get('banter_review_rules')==review_version)}
 passed={i for i in current if not review[i].get('needs_review',True)}
 return {'generated':generated,'missing':set(ids)-generated,'passed':passed,'flagged':current-passed,'unreviewed':generated-current}

def signature(plan,corrections,ident):
 value={**plan.get('clip_overrides',{}).get(ident,{}),**corrections.get(ident,{})}
 return hashlib.sha256(json.dumps(value,sort_keys=True,ensure_ascii=False).encode()).hexdigest()

def due_retries(flagged,queue,build,plan,corrections,now,limit=8):
 def changed(i):
  q=queue.get(i,{})
  return q.get('sha256')!=build[i]['sha256']or q.get('recipe_signature')!=signature(plan,corrections,i)
 ready=[i for i in flagged if changed(i)or queue[i].get('next_retry_at',0)<=now]
 return sorted(ready,key=lambda i:(0 if changed(i)else queue[i].get('attempts',0),0 if changed(i)else queue.get(i,{}).get('next_retry_at',0),i))[:limit]

def backoff(attempt):
 return min(21600,1800*2**min(max(0,attempt-1),4))

def model_groups(ids,plan,corrections):
 groups={}
 for clip in plan['clips']:
  i=clip['id']
  if i not in ids:continue
  override={**plan.get('clip_overrides',{}).get(i,{}),**corrections.get(i,{})}
  model=override.get('model',plan.get('model','Aratako/Irodori-TTS-v4.1-Small-MF'))
  groups.setdefault(model,[]).append(i)
 return groups
