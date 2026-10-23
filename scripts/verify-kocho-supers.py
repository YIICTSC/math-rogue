"""Verify super recipes, dedicated generated artwork, CPU voice provenance and delivery."""
from pathlib import Path
import json,hashlib,sys,itertools
import numpy as np
import soundfile as sf
ROOT=Path(__file__).resolve().parents[1]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
moves=json.loads((ROOT/'assets/kocho/super-moves.json').read_text())
lines=json.loads((ROOT/'assets/kocho/super-voice-lines.json').read_text())
build=json.loads((ROOT/'assets/kocho/super-voice-build.json').read_text())
art=json.loads((ROOT/'assets/kocho/super-art-build.json').read_text())
qa=json.loads((ROOT/'assets/kocho/super-speech-qa.json').read_text())['samples']
card_names=json.loads((ROOT/'assets/kocho/voice-lines.json').read_text())['cardKeys']
assert len(moves)==36 and build['model_device']==build['codec_device']=='cpu' and build['silentcipher_watermark']
recipes=set();cells=set();expected=set();hashes=set();files=set()
for hero in ['original','rebel','akari']:
 group=[m for m in moves if m['hero']==hero];assert len(group)==12 and {m['index']for m in group}==set(range(12))
 image=art['atlases'][hero];assert sha(ROOT/image['path'])==image['sha256'];assert image['panels']==[m['name']for m in group];files.add(image['path'])
 catalog=next(h for h in lines['heroes']if h['id']==hero)
 for m in group:
  key=hero+'/'+m['id'];expected.add(key);record=build['clips'][key]
  assert (hero,m['index'])not in cells;cells.add((hero,m['index']))
  assert len(m['steps'])==3 and all(m['steps']) and m['damage']>0
  for step in m['steps']:assert all(name in card_names[hero]for name in step),(key,step)
  for recipe in itertools.product(*m['steps']):
   assert (hero,recipe)not in recipes,(key,'ambiguous recipe');recipes.add((hero,recipe))
  assert record['text']==catalog['lines'][m['id']],key
  assert record['spoken_text']==catalog.get('synthesis_text',{}).get(m['id'],record['text']),key
  assert record['compute'].startswith('cpu') and record['sha256']not in hashes,key
  hashes.add(record['sha256']);path=f'public/sfx/kocho-super-voices/{key}.ogg';files.add(path.removeprefix('public/'))
  assert sha(ROOT/path)==record['sha256']==qa[key]['sha256'],key
  info=sf.info(ROOT/path);assert info.format=='OGG' and info.subtype=='VORBIS',key
  data,rate=sf.read(ROOT/path);assert rate==44100 and data.ndim==1 and np.isfinite(data).all() and np.max(np.abs(data))>.003,key
  assert .35<len(data)/rate<=8.1 and abs(len(data)/rate-record['seconds'])<.08,key
  for reference in record['references']:assert sha(ROOT/reference['path'])==reference['sha256'],key
assert len(recipes)==1422 and set(build['clips'])==expected
assert {str(p.relative_to(ROOT/'public/sfx/kocho-super-voices')).removesuffix('.ogg')for p in (ROOT/'public/sfx/kocho-super-voices').rglob('*.ogg')}==expected
review=ROOT/'assets/kocho/super-speech-review.json'
if review.exists():
 for key,v in json.loads(review.read_text())['samples'].items():assert key in expected and v['sha256']==build['clips'][key]['sha256'],key
if '--distribution'in sys.argv:
 web=json.loads((ROOT/'public/web-asset-manifest.json').read_text());android=json.loads((ROOT/'public/android-asset-pack-manifest.json').read_text())
 wf={f['path']:f for p in web['packs'].values()for f in p['files']};af={f['path']:f for p in android['packs'].values()for f in p['files']}
 for path in files:
  path=path.removeprefix('public/');src=ROOT/'public'/path;assert wf[path]['size']==src.stat().st_size and af[path]['sha256']==sha(src)==sha(ROOT/'dist'/path),path
print(f'Kocho supers: 36 unique finishers, {len(recipes)} ordered recipes, 36 unique CPU voices, 36 ImageGen panels; verified'+(' including Web/Android/production delivery'if '--distribution'in sys.argv else ''))
