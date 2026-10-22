"""Verify every enemy/action's CPU provenance, decoded OGG and current speech QA."""
from pathlib import Path
import json,hashlib,re,sys
import numpy as np
import soundfile as sf
ROOT=Path(__file__).resolve().parents[1]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
catalog=json.loads((ROOT/'assets/kocho/enemy-voice-lines.json').read_text())
build=json.loads((ROOT/'assets/kocho/enemy-voice-build.json').read_text())
qa=json.loads((ROOT/'assets/kocho/enemy-speech-qa.json').read_text())['samples']
assert build['model_device']==build['codec_device']=='cpu'
assert build['silentcipher_watermark'] is True
source=(ROOT/'src/components/KochoShowdown.tsx').read_text().split('const ENEMY_TYPES: EnemyTemplate[] = [')[1].split('];')[0]
names=set(re.findall(r"name: '([^']+)'",source))
assert names=={h['name']for h in catalog['heroes']}
special_names=set(re.findall(r"\{ name: '([^']+)'[^\n]*special:",source))|{'真・校長'}
assert special_names=={h['name']for h in catalog['heroes']if 'skill' in h['lines']}
expected=set();hashes=set();seconds=0
for enemy in catalog['heroes']:
 assert {'spawn','attack','damage','defeat'}<=enemy['lines'].keys()
 for event,text in enemy['lines'].items():
  key=enemy['id']+'/'+event;expected.add(key);path=ROOT/'public/sfx/kocho-enemy-voices'/f'{key}.ogg';record=build['clips'][key]
  assert record['text']==text and record['spoken_text']==enemy.get('synthesis_text',{}).get(event,text),key
  assert record['compute'].startswith('cpu'),key
  assert sha(path)==record['sha256']==qa[key]['sha256'],key
  assert record['sha256'] not in hashes,key
  hashes.add(record['sha256'])
  info=sf.info(path);assert info.format=='OGG' and info.subtype=='VORBIS',key
  audio,rate=sf.read(path,dtype='float32');duration=len(audio)/rate;seconds+=duration
  assert rate==44100 and audio.ndim==1 and .35<duration<=8.1,key
  assert np.isfinite(audio).all() and np.max(np.abs(audio))>.003,key
  assert abs(duration-record['seconds'])<.08,key
  for reference in record['references']:assert sha(ROOT/reference['path'])==reference['sha256'],key
review_path=ROOT/'assets/kocho/enemy-speech-review.json'
if review_path.exists():
 for key,sample in json.loads(review_path.read_text())['samples'].items():
  assert key in expected and sample['sha256']==build['clips'][key]['sha256'],(key,'stale secondary speech QA')
assert expected==set(build['clips'])=={str(p.relative_to(ROOT/'public/sfx/kocho-enemy-voices')).removesuffix('.ogg')for p in (ROOT/'public/sfx/kocho-enemy-voices').rglob('*.ogg')}
print(f'Kocho enemies: {len(names)} types, {len(expected)} unique CPU-generated voices, {seconds:.1f}s; decoded audio/provenance/speech QA verified')

if '--distribution' in sys.argv:
 manifest=json.loads((ROOT/'public/android-asset-pack-manifest.json').read_text())
 files={f['path']:f for pack in manifest['packs'].values() for f in pack['files']}
 web=json.loads((ROOT/'public/web-asset-manifest.json').read_text())
 web_files={f['path']:f for pack in web['packs'].values() for f in pack['files']}
 assert json.loads((ROOT/'dist/web-asset-manifest.json').read_text())['contentVersion']==web['contentVersion']
 for key in expected:
  path=f'sfx/kocho-enemy-voices/{key}.ogg';digest=build['clips'][key]['sha256']
  assert files[path]['sha256']==digest,(path,'Android manifest')
  assert web_files[path]['size']==(ROOT/'public'/path).stat().st_size,(path,'Web manifest')
  assert sha(ROOT/'dist'/path)==digest,(path,'production copy')
 print('All enemy voices present in Web/Android delivery manifests and production output')
