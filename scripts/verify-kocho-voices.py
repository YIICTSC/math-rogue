"""Verify full per-hero coverage, decoded audio, provenance and source integrity."""
from pathlib import Path
import json,hashlib
import numpy as np
import soundfile as sf
ROOT=Path(__file__).resolve().parents[1]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
catalog=json.loads((ROOT/'assets/kocho/voice-lines.json').read_text())
build=json.loads((ROOT/'assets/kocho/voice-build.json').read_text())
assert build['model_device']=='cpu' and build['codec_device']=='cpu'
assert build['silentcipher_watermark'] is True
primary=json.loads((ROOT/'assets/kocho/speech-qa.json').read_text())['samples']
expected=set();hashes=set();seconds=0
for hero in catalog['heroes']:
 ident=hero['id'];skills=catalog['cardKeys'][ident]
 assert len(skills)==(77 if ident=='original' else 157)
 assert len(set(skills.values()))==len(skills)
 assert set(hero['lines'])==set(skills.values())|{'action-'+a for a in catalog['actions']}
 for key,text in hero['lines'].items():
  full=ident+'/'+key;expected.add(full);path=ROOT/'public/sfx/kocho-voices'/f'{full}.ogg'
  record=build['clips'][full]
  assert record['text']==text,(full,'stale line')
  assert record['spoken_text']==hero.get('synthesis_text',{}).get(key,text),(full,'stale pronunciation recipe')
  assert record['compute'].startswith('cpu'),full
  assert sha(path)==record['sha256'],(full,'hash')
  assert primary[full]['sha256']==record['sha256'],(full,'speech QA is stale')
  assert record['sha256'] not in hashes,(full,'reused clip');hashes.add(record['sha256'])
  info=sf.info(path);assert info.format=='OGG' and info.subtype=='VORBIS',(full,'codec')
  data,rate=sf.read(path,dtype='float32');duration=len(data)/rate;seconds+=duration
  assert rate==44100 and data.ndim==1 and .35<duration<=8.1,(full,'format/duration')
  assert np.isfinite(data).all() and np.max(np.abs(data))>.003,(full,'silence')
  assert abs(duration-record['seconds'])<.08,(full,'duration metadata')
  for ref in record['references']: assert sha(ROOT/ref['path'])==ref['sha256'],(full,'reference')
assert set(build['clips'])==expected
assert {str(p.relative_to(ROOT/'public/sfx/kocho-voices')).removesuffix('.ogg')for p in (ROOT/'public/sfx/kocho-voices').rglob('*.ogg')}==expected
print(f'Kocho voice assets: {len(expected)} unique CPU-generated clips, {seconds:.1f}s, decoded and verified; all speech QA hashes current')
