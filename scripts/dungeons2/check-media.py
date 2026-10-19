"""Verify deployed media bytes against Blender/Irodori production reports."""
import hashlib,json
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[2]
fx=json.loads((root/'assets-source/dungeons2/ultimate-fx.json').read_text())
assert hashlib.sha256((root/'assets-source/dungeons2/ultimate-fx.blend').read_bytes()).hexdigest()==fx['sourceSha256']
assert len(fx['animations'])==27
for a in fx['animations']:
 p=root/'public/sprites/dungeons2/fx'/a['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==a['sha256']
 im=Image.open(p).convert('RGBA');assert im.size==(1152,768);assert im.getextrema()[3][0]==0
 frames={im.crop(((n%6)*192,(n//6)*192,(n%6+1)*192,(n//6+1)*192)).tobytes()for n in range(24)};assert len(frames)>=20
voice=json.loads((root/'assets-source/dungeons2/voice-generation.json').read_text());assert len(voice['clips'])==90
for a in voice['clips']:
 p=root/'public/sfx/dungeons2-voices'/a['hero']/(a['action']+'.mp3');assert hashlib.sha256(p.read_bytes()).hexdigest()==a['sha256'];assert .3<=a['duration']<=3.2;assert .005<a['rms']<.5;assert a['peak']<1.05
assert len(list((root/'public/sfx/dungeons2-voices').rglob('*.mp3')))==90
assert not list((root/'public/sfx/dungeons2-voices').rglob('*.ogg'))
print('PASS: 27 transparent animated Blender atlases, editable master checksum, 90 matching audible Irodori MP3s, no duplicate formats.')
