import json
from pathlib import Path
from pykakasi import kakasi
root=Path(__file__).resolve().parents[1]
p=root/'src/mini-games/kocho/story/scenes.json';scenes=json.loads(p.read_text());k=kakasi()
for s in scenes:
 s['hiraganaTitle']=''.join(x['hira']for x in k.convert(s['title']))
 for l in s['lines']:l['hiragana']=''.join(x['hira']for x in k.convert(l['text']))
p.write_text(json.dumps(scenes,ensure_ascii=False,indent=2)+'\n')

names=root/'src/mini-games/kocho/story/speakers.json'
data=json.loads(names.read_text())
for name in data.values():name[2]=''.join(x['hira']for x in k.convert(name[0]))
names.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
