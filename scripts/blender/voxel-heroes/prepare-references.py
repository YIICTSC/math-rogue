from pathlib import Path
import re, subprocess, urllib.request,urllib.parse,concurrent.futures,hashlib,json
from PIL import Image,ImageDraw
import argparse
parser=argparse.ArgumentParser();parser.add_argument('--out',required=True);args=parser.parse_args()
root=Path(__file__).resolve().parents[3];out=Path(args.out)/'references';out.mkdir(parents=True,exist_ok=True)
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
paths={p.split('\t')[1]:p.split('\t')[0].split()[2] for p in subprocess.check_output(['git','ls-tree','-rz','HEAD'],cwd=root,text=True).split('\0') if p}
refs=[]
src=(root/'src/constants.ts').read_text(); block=src.split('export const CHARACTERS:')[1].split('// --- POKER')[0]
for id,name in re.findall(r"id: '([^']+)',\s*name: '([^']+)'",block):
 svg=re.search(r'const '+id+r'_SVG = `([^`]+)`',src).group(1)
 (out/f'elementary-{id.lower()}.svg').write_text(svg)
 import cairosvg
 cairosvg.svg2png(bytestring=svg.encode(),write_to=str(out/f'elementary-{id.lower()}.png'),output_width=384,output_height=384)
 refs.append(dict(id=f'elementary-{id.lower()}',name=name,source=f'src/constants.ts:{id}_SVG',image=f'elementary-{id.lower()}.png'))
hs=['反逆の高校生','生物部の先輩','謎めく転入生','化学研究会長','バスケ部エース','放送部ディレクター','文芸部書記','学食の料理長','園芸部部長']
ids=['warrior','caretaker','assassin','mage','dodgeball','bard','librarian','chef','gardener']
for i,(id,name) in enumerate(zip(ids,hs)):refs.append(dict(id='high-school-'+id,name=name,source=f'public/sprites/high-school/characters/{i}.webp',image='high-school-'+id+'.webp'))
magic=(root/'src/data/magicHeroes.ts').read_text()
for id,num,name in re.findall(r"id: '([^']+)', index: (\d+), name: '([^']+)'",magic):refs.append(dict(id='magic-'+id.lower(),name=name,source=f'public/sprites/magic/characters/heroine-{int(num):02}-before.webp',image='magic-'+id.lower()+'.webp'))
for id,name,asset in re.findall(r"id: '([^']+)', name: '([^']+)'[^\n]+assetId: '([^']+)'",magic):refs.append(dict(id='magic-'+id.lower(),name=name,source=f'public/sprites/magic/male-characters/{asset}-before.webp',image='magic-'+id.lower()+'.webp'))
def fetch(r):
 if r['source'].startswith('src/'):return
 p=root/r['source']
 if p.exists():data=p.read_bytes()
 else:data=urllib.request.urlopen('https://raw.githubusercontent.com/YIICTSC/math-rogue/'+head+'/'+urllib.parse.quote(r['source']),timeout=60).read()
 assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==paths[r['source']]
 (out/r['image']).write_bytes(data)
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:list(pool.map(fetch,refs))
(out/'catalog.json').write_text(json.dumps(refs,ensure_ascii=False,indent=2))
for name,subset in [('elementary',refs[:9]),('high-school',refs[9:18]),('magic-female',refs[18:27]),('magic-male',refs[27:])]:
 sheet=Image.new('RGB',(1000,((len(subset)+3)//4)*350),'#dee4e7');d=ImageDraw.Draw(sheet)
 for i,r in enumerate(subset):
  im=Image.open(out/r['image']).convert('RGBA');a=im.getchannel('A').getbbox();im=im.crop(a);im.thumbnail((240,310));x=(i%4)*250+(250-im.width)//2;y=(i//4)*350+20;sheet.paste(im,(x,y),im);d.text(((i%4)*250+6,(i//4)*350+330),r['id'],fill='black')
 sheet.save(out/(name+'-sheet.jpg'))
print('Prepared',len(refs),'references at',out)
