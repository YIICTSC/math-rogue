from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[2]
out=root/'public/sprites/kocho-field';out.mkdir(exist_ok=True)
src=Path('/workspace/generated_images')
files={'buildings':'exec-a24c4b05-03e5-423e-bbaf-1a34c93cb601.png','dream-sprites':'exec-ffec1ade-09f1-4ff3-8d4e-7f1e80842d72.png','school-room':'exec-d96be6ee-92f0-4e86-9aff-29e7d082255d.png','shop-room':'exec-4c278e5f-8b63-4525-8935-57f9c7168f6b.png','arcade-room':'exec-7669bf83-3426-4953-bfdf-56105acde256.png','street':'exec-ec4a5b80-4f75-44cf-9e3e-c10fde5b1d23.png','dream-sky':'exec-7ba722bf-0981-425b-9c1b-9d1f48136422.png'}
for name,file in files.items():
 im=Image.open(src/file).convert('RGBA');im.thumbnail((1800,1000));im.save(out/(name+'.webp'),'WEBP',quality=89,method=6)
 if name=='buildings':
  # The generated buildings have unequal widths; crop through transparent gutters.
  boxes=[(0,0,775,725),(775,0,1441,725),(1441,0,2175,725)]
  original=Image.open(src/file).convert('RGBA')
  for key,box in zip(['school','shop','arcade'],boxes):
   obj=original.crop(box);a=obj.getchannel('A');bb=a.point(lambda x:255 if x>30 else 0).getbbox();obj=obj.crop(bb);obj.thumbnail((512,512));obj.save(out/(key+'-building.webp'),'WEBP',quality=92,method=6)
 if name=='dream-sprites':
  original=Image.open(src/file).convert('RGBA');w,h=original.size
  for i,key in enumerate(['ball','star','bumper','portal','spring','fan','pond','crystal']):
   x=i%4;y=i//4;obj=original.crop((round(x*w/4),round(y*h/2),round((x+1)*w/4),round((y+1)*h/2)));obj.thumbnail((320,320));obj.save(out/(key+'.webp'),'WEBP',quality=92,method=6)
(root/'docs/kocho-field/art-sources.json').write_text(json.dumps({'generator':'ImageGen','sources':files,'note':'Original after-school buildings and interiors, original mint cloud mascot and dream kingdom; reference ROM assets are not shipped.'},ensure_ascii=False,indent=2)+'\n')
print('Installed',len(list(out.glob('*.webp'))),'original illustrated assets')
