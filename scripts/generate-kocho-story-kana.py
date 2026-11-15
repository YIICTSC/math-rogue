import json
from pathlib import Path
from pykakasi import kakasi
root=Path(__file__).resolve().parents[1]
p=root/'src/mini-games/kocho/story/scenes.json';scenes=json.loads(p.read_text());k=kakasi()
for s in scenes:
 s['hiraganaTitle']=''.join(x['hira']for x in k.convert(s['title']))
 for l in s['lines']:l['hiragana']=''.join(x['hira']for x in k.convert(l['text']))
p.write_text(json.dumps(scenes,ensure_ascii=False,indent=2)+'\n')
