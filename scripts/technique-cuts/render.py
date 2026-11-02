import json,hashlib,subprocess,concurrent.futures
from pathlib import Path
root=Path(__file__).resolve().parents[2];base=root/'assets/technique-cuts';records=json.loads((base/'analysis.json').read_text())['records'];overrides=json.loads((base/'overrides.json').read_text());manifest={'cues':{},'prefixes':{}};jobs={};audit=[];pools={}
def part(r,kind,span):
 key=hashlib.sha256((r['sha256']+kind+repr(span)).encode()).hexdigest()[:20];path=f'sfx/technique-cuts/{key}.ogg';duration=span[1]-span[0];jobs[key]=(r,span,path);return {'id':key,'path':path,'duration':round(duration,4)}
for r in records:
 o=overrides.get(r['key'],{});a=r.get('prefixRange');b=r.get('nameRange')
 if 'boundary' in o:a=[0,o['boundary']];b=[o['boundary'],r['duration']]
 if o.get('nameUnavailable'):
  # Do not publish a falsely labelled clip. Other clean preludes from this actor remain usable.
  manifest['cues'][r['key']]={'actor':r['actor'],'name':None};audit.append({'key':r['key'],'issue':o['nameUnavailable'],'source_sha256':r['sha256']});continue
 if not b or r['prefix'] and not a:raise RuntimeError('Unresolved cut '+r['key'])
 prefix=part(r,'prefix',a) if a else None
 if prefix:
  pool=pools.setdefault(r['actor'],{});old=pool.get(r['prefix']);candidate=(r.get('confidence',0),prefix)
  if not old or candidate[0]>old[0]:pool[r['prefix']]=candidate
 if r.get('prefixOnly'):continue
 if not r['prefix']:
  name={'id':hashlib.sha256(r['source'].encode()).hexdigest()[:20],'path':r['source'],'duration':r['duration']}
 else:name=part(r,'name',b)
 manifest['cues'][r['key']]={'actor':r['actor'],'name':name}
 audit.append({'key':r['key'],'source':r['source'],'source_sha256':r['sha256'],'prefixRange':a,'nameRange':b,'method':'ASR-reviewed boundary' if 'boundary'in o else 'silence'})
for actor,pool in pools.items():manifest['prefixes'][actor]=[v[1] for v in pool.values()]
# Only ship the selected per-character prelude pool, not every duplicate prefix.
used={p['id'] for pool in manifest['prefixes'].values() for p in pool}|{v['name']['id'] for v in manifest['cues'].values() if v['name']}
jobs={k:v for k,v in jobs.items() if k in used}
def export(item):
 key,(r,span,path)=item;target=root/'public'/path;target.parent.mkdir(parents=True,exist_ok=True)
 if not target.exists():
  duration=span[1]-span[0];filters=f'atrim=start={span[0]:.6f}:end={span[1]:.6f},asetpts=PTS-STARTPTS,afade=t=in:d=0.003,afade=t=out:st={max(0,duration-.003):.6f}:d=0.003'
  subprocess.run(['ffmpeg','-v','error','-nostdin','-y','-i',str(root/'public'/r['source']),'-af',filters,'-ar','44100','-ac','1','-c:a','libvorbis','-q:a','4',str(target)],check=True)
 return key,hashlib.sha256(target.read_bytes()).hexdigest()
hashes={}
with concurrent.futures.ThreadPoolExecutor(max_workers=2)as pool:
 for n,(key,digest)in enumerate(pool.map(export,jobs.items()),1):
  hashes[key]=digest
  if n%100==0:print('CUT',n,'/',len(jobs),flush=True)
(base/'build.json').write_text(json.dumps({'audit':audit,'hashes':hashes,'missingNames':[r for r in audit if r.get('issue')]},ensure_ascii=False,indent=2)+'\n');(root/'src/components/school-dungeon/techniques/voiceCuts.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n');print('COMPLETE',len(jobs),'cut files;',len(manifest['cues']),'cues;',sum(len(p)for p in manifest['prefixes'].values()),'reused character preludes;',len([r for r in audit if r.get('issue')]),'original names unavailable',flush=True)
