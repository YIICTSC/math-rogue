"""Pack Blender RGBA frames into 6x4 WebP atlases and a contact review image."""
import sys,json
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np
series1='--series1' in sys.argv;expected=35 if series1 else 27;source=Path(sys.argv[1]);target=Path('public/sprites/dungeons/fx' if series1 else 'public/sprites/dungeons2/fx');target.mkdir(parents=True,exist_ok=True);review=Image.new('RGB',(192*6,218*6),(10,17,30));draw=ImageDraw.Draw(review);report=[]
for n,folder in enumerate(sorted(p for p in source.iterdir()if p.is_dir()and '_skill_'in p.name)):
 paths=sorted(folder.glob('frame-*.png'));assert len(paths)==24,(folder,len(paths));atlas=Image.new('RGBA',(1152,768));unique=set();peaks=[]
 for i,path in enumerate(paths):
  frame=Image.open(path).convert('RGBA');pixels=np.array(frame);glow=(pixels[:,:,:3].max(axis=2)*.8).astype('uint8');pixels[:,:,3]=np.maximum(pixels[:,:,3],glow);frame=Image.fromarray(pixels);unique.add(frame.tobytes());peaks.append(int(pixels[:,:,3].sum()));atlas.alpha_composite(frame,((i%6)*192,(i//6)*192))
 assert len(unique)>=20,(folder,'not animated');name=folder.name.replace('_skill_','-skill-')+'.webp';atlas.save(target/name,quality=85,method=4)
 index=max(range(24),key=lambda i:peaks[i]);peak=atlas.crop(((index%6)*192,(index//6)*192,(index%6+1)*192,(index//6+1)*192));review.paste(peak,(n%6*192,n//6*218),peak);draw.text((n%6*192+4,n//6*218+194),folder.name,fill='white');report.append({'file':name,'frames':24,'fps':20,'columns':6,'rows':4,'cell':192,'bytes':(target/name).stat().st_size,'peak':index})
assert len(report)==expected
(source/'packed.json').write_text(json.dumps(report,indent=2));review.save(source/'contact.png');print('Packed',expected,'Blender animations;',expected*24,'frames; total',sum(x['bytes']for x in report),'bytes')
