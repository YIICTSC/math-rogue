"""Normalize complete ImageGen 4x2 direction sheets with one shared scale per hero."""
import argparse,json,hashlib
from pathlib import Path
from PIL import Image
P=argparse.ArgumentParser();P.add_argument('--manifest',required=True);P.add_argument('--out',required=True);a=P.parse_args();entries=json.loads(Path(a.manifest).read_text());out=Path(a.out);out.mkdir(parents=True,exist_ok=True);reports=[]
for entry in entries:
 if entry.get('error'):raise ValueError(entry)
 image=Image.open(entry['path']).convert('RGBA');w,h=image.size;assert 1.7<w/h<2.3,(entry['id'],image.size)
 cells=[];bounds=[]
 for i in range(8):
  x=i%4;y=i//4;cell=image.crop((round(w*x/4),round(h*y/2),round(w*(x+1)/4),round(h*(y+1)/2)))
  alpha=cell.getchannel('A').point(lambda v:255 if v>=30 else 0);box=alpha.getbbox();assert box,(entry['id'],i,'empty');cell.putalpha(cell.getchannel('A').point(lambda v:0 if v<30 else v));cells.append(cell.crop(box));bounds.append(box)
 overrides=[]
 for direction,patch in entry.get('directionOverrides',{}).items():
  # A reviewed, full-grid ImageGen correction. Keep the seven approved frames
  # and match the replacement to the original frame's height before scaling.
  source=Image.open(patch['path']).convert('RGBA');box=patch['box'];part=source.crop(box)
  part.putalpha(part.getchannel('A').point(lambda v:0 if v<30 else v));bounds_patch=part.getchannel('A').getbbox();assert bounds_patch
  part=part.crop(bounds_patch);index=['S','N','E','W','SE','SW','NE','NW'].index(direction);factor=cells[index].height/part.height
  cells[index]=part.resize((max(1,round(part.width*factor)),cells[index].height),Image.Resampling.NEAREST)
  overrides.append(dict(direction=direction,source=patch['path'],sourceSha256=hashlib.sha256(Path(patch['path']).read_bytes()).hexdigest(),box=box))
 scale=min(112/max(c.width for c in cells),112/max(c.height for c in cells));sheet=Image.new('RGBA',(512,256));hashes=[]
 for i,c in enumerate(cells):
  c=c.resize((max(1,round(c.width*scale)),max(1,round(c.height*scale))),Image.Resampling.NEAREST);sheet.alpha_composite(c,(i%4*128+(128-c.width)//2,i//4*128+124-c.height));hashes.append(hashlib.sha256(c.tobytes()).hexdigest())
 assert len(set(hashes))==8,(entry['id'],'duplicate directions')
 path=out/(entry['id']+'.webp');sheet.save(path,lossless=True,method=6);report=dict(id=entry['id'],generator='ImageGen',source=entry['path'],sourceSha256=hashlib.sha256(Path(entry['path']).read_bytes()).hexdigest(),sourceSize=[w,h],grid=[4,2],cell=[128,128],directions=['S','N','E','W','SE','SW','NE','NW'],baseline=124,scale=scale,bounds=bounds,directionOverrides=overrides,bytes=path.stat().st_size);reports.append(report);print('NORMALIZED',entry['id'],flush=True)
(out/'provenance.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2))
