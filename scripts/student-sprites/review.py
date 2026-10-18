"""Build a portable visual review using the shipped atlases, without rescaling axes."""
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import argparse,json,shutil,html
p=argparse.ArgumentParser();p.add_argument('--out',required=True);a=p.parse_args();out=Path(a.out);(out/'sprites').mkdir(parents=True,exist_ok=True)
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',16);designs=json.loads(Path('scripts/blender/voxel-heroes/designs.json').read_text())
parts=['<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>風来の学生・方向確認</title><style>body{background:#203640;color:#f4e6bf;font:16px system-ui;margin:24px}article{display:inline-block;vertical-align:top;margin:8px;padding:12px;background:#30464d}img{width:512px;max-width:100%;image-rendering:pixelated}p{line-height:1.7}</style><h1>風来の学生・35人の8方向</h1><p>上段：正面↓／背面↑／右→／左←<br>下段：右下↘／左下↙／右上↗／左上↖</p>']
for form in [False,True]:
 ds=[d for d in designs if not form or d['id'].startswith('magic-')];sheet=Image.new('RGB',(1000,((len(ds)+4)//5)*170),'#273f46');draw=ImageDraw.Draw(sheet)
 if form:parts.append('<h1>魔法編・変身後17人</h1><p>与えるダメージ×2／受けるダメージ×2。階移動で自動解除。</p>')
 for i,d in enumerate(ds):
  id=d['id']+('-transformed' if form else '');src=Path('public/sprites/wandering-student')/(id+'.webp');shutil.copy2(src,out/'sprites'/src.name);im=Image.open(src).convert('RGBA');x=i%5*200;y=i//5*170
  draw.text((x+6,y+4),d['name'],font=font,fill='#f3e2bc');pose=im.crop((0,128,128,256));sheet.paste(pose,(x+36,y+30),pose)
  parts.append(f'<article><h3>{html.escape(d["name"])}'+('・変身' if form else '')+f'</h3><img src="sprites/{id}.webp" alt="8方向のゲーム用シート"></article>')
 sheet.save(out/('transformed-SE-final.jpg' if form else 'normal-SE-final.jpg'),quality=95)
parts.append('</html>');(out/'index.html').write_text('\n'.join(parts))
modelroot=out/'transformed-models';ds=[d for d in designs if d['id'].startswith('magic-')]
if all((modelroot/(d['id']+'-transformed')/'three-quarter.png').exists() for d in ds):
 sheet=Image.new('RGB',(1250,4*290),'#273f46');draw=ImageDraw.Draw(sheet)
 for i,d in enumerate(ds):
  im=Image.open(modelroot/(d['id']+'-transformed')/'three-quarter.png').convert('RGB');im.thumbnail((250,250));x=i%5*250;y=i//5*290;sheet.paste(im,(x,y+30));draw.text((x+8,y+4),d['name'],font=font,fill='#f3e2bc')
 sheet.save(out/'transformed-3d-final.jpg',quality=95)
print('Visual review:',out/'index.html')
