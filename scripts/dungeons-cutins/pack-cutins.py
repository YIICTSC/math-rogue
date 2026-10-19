"""Extract ImageGen's independent panels; preserve source art, alpha and identity."""
import argparse,json,hashlib
from pathlib import Path
from PIL import Image,ImageDraw
p=argparse.ArgumentParser();p.add_argument('--work',default='/workspace/dungeons-cutin-work');p.add_argument('--partial',action='store_true');args=p.parse_args();work=Path(args.work);root=Path(__file__).resolve().parents[2];jobs=json.loads((work/'all-jobs.json').read_text());sources=json.loads((work/'first-results.json').read_text())
for f in work.glob('*.path'):sources[f.stem]=f.read_text().strip()
target=root/'public/sprites/ultimate-cutins';target.mkdir(parents=True,exist_ok=True);entries=[];review=Image.new('RGB',(8*150,14*210),'#152134');draw=ImageDraw.Draw(review)
for job in jobs:
 if job['id']not in sources:
  if args.partial:continue
  raise ValueError('Missing generated job: '+job['id'])
 source=Path(sources[job['id']]);im=Image.open(source).convert('RGBA');assert im.width>=im.height and im.width%3==0,(job['id'],im.size);cell=im.width//3
 for i,a in enumerate(job['items']):
  frame=im.crop((i*cell,0,(i+1)*cell,im.height));assert frame.getextrema()[3][0]==0,(job['id'],'Opaque background');bbox=frame.getchannel('A').getbbox();assert bbox
  frame.thumbnail((384,768),Image.Resampling.LANCZOS);name=f"{a['hero']}-skill-{a['slot']+1}{'-transformed' if a['form']=='transformed' else ''}.webp";out=target/name;frame.save(out,quality=85,method=3)
  entry={'hero':a['hero'],'form':a['form'],'slot':a['slot'],'ability':a['en'],'file':'sprites/ultimate-cutins/'+name,'width':frame.width,'height':frame.height,'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'referenceSha256':hashlib.sha256(Path(a['reference']).read_bytes()).hexdigest(),'sourceJob':job['id'],'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest()};entries.append(entry)
  small=frame.copy();small.thumbnail((145,180));n=len(entries)-1;review.paste(small,(n%8*150+(150-small.width)//2,n//8*210),small);draw.text((n%8*150+3,n//8*210+182),a['hero'].replace('dungeons2-','D2-').replace('elementary-','E-').replace('high-school-','H-'),fill='white');draw.text((n%8*150+3,n//8*210+196),('T ' if a['form']=='transformed' else 'N ')+'Skill '+str(a['slot']+1),fill='#8ddfff')
assert len(entries)==106 or args.partial
if not args.partial:(root/'assets-source/dungeons-cutins/manifest.json').write_text(json.dumps({'generator':'ImageGen','count':106,'cutins':entries},ensure_ascii=False,indent=2)+'\n')
review.crop((0,0,1200,((len(entries)+7)//8)*210)).save(work/'cutins-contact.png');print('Packed',len(entries),'unique transparent cut-ins;',sum(e['bytes']for e in entries),'bytes')
