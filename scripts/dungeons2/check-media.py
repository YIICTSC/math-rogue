"""Verify deployed media bytes against Blender/Irodori production reports."""
import hashlib,json
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[2]
for folder,count in [('dungeons',35),('dungeons2',27)]:
 fx=json.loads((root/'assets-source'/folder/'ultimate-fx.json').read_text())
 assert hashlib.sha256((root/'assets-source'/folder/'ultimate-fx.blend').read_bytes()).hexdigest()==fx['sourceSha256']
 assert len(fx['animations'])==count
 for a in fx['animations']:
  p=root/'public/sprites'/folder/'fx'/a['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==a['sha256']
  im=Image.open(p).convert('RGBA');assert im.size==(1152,768);assert im.getextrema()[3][0]==0
  frames={im.crop(((n%6)*192,(n//6)*192,(n%6+1)*192,(n//6+1)*192)).tobytes()for n in range(24)};assert len(frames)>=20
voice=json.loads((root/'assets-source/dungeons2/voice-generation.json').read_text());assert len(voice['clips'])==270
for a in voice['clips']:
 p=root/'public/sfx/dungeons2-voices'/a['hero']/(a['action']+'.ogg');assert hashlib.sha256(p.read_bytes()).hexdigest()==a['sha256'];assert .3<=a['duration']<=3.2;assert .005<a['rms']<.5;assert a['peak']<1.05
assert len(list((root/'public/sfx/dungeons2-voices').rglob('*.ogg')))==270
assert not list((root/'public/sfx/dungeons2-voices').rglob('*.mp3'))
print('PASS: 62 transparent animated Blender atlases, editable master checksum, 270 matching audible Irodori OGGs, no duplicate formats.')
