"""Normalize generated character atlases without repainting or synthesizing directions.
Usage: python scripts/prepare-dungeons2-sprites.py /path/to/generated_images
Source PNGs remain untouched. Portraits are 384x576; gameplay cells are 128x128.
The reviewed source cell ordering is explicit; missing profiles were regenerated.
"""
from PIL import Image
from pathlib import Path
import sys,json
import numpy as np
from scipy import ndimage
source=Path(sys.argv[1]);out=Path('public/sprites/dungeons2');out.mkdir(parents=True,exist_ok=True)
def read(key):return Image.open(source/('exec-'+key+'.png')).convert('RGBA')
def cell(im,index,cols,rows):
 x=index%cols;y=index//cols
 return im.crop((round(x*im.width/cols),round(y*im.height/rows),round((x+1)*im.width/cols),round((y+1)*im.height/rows)))
female=read('079d7128-8916-49bb-98bd-ce666e8fc2e4');female_after=read('4aa1dd55-b3e1-40eb-9b77-c162552640ce');male=read('3cbb9ff0-764a-4c47-8f1b-900b934f7502');male_after=read('f17a4a45-f025-4430-a665-43f78dfe4f8a')
keys=['lyria','celis','flora','noctia','aurene','ignis','leon','orion','leif']
sources=['55a538cd-14da-4a9f-8f2a-9088cec701ba','53cf4f01-7e98-4f09-9b58-7dd263ef0f2f','c786def1-1323-4136-ac24-40d16bff3149','58ae51ef-f2f7-4cd7-a20d-0756fd8df98a','a93e6f68-348c-46a1-aa18-6fcfe5f0ec32','c3fdab30-ec7a-4fe7-bfc9-a8ad2717b6ab','c30fb94c-78f8-48d1-aaf6-d9fb3317e6df','df962172-b350-46f6-968a-5c55a2e57800','69033b89-d99b-4383-80a4-7320dd476505']
# Runtime order: down, up, right, left, down-right, down-left, up-right, up-left.
orders={'lyria':[[0,1,2,3,5,4,6,7],[0,1,2,3,5,4,6,7]],'celis':[[0,1,3,2,5,4,6,7]]*2,'flora':[[0,1,3,2,5,4,6,7]]*2,'noctia':[[0,1,2,3,4,5,6,7]]*2,'aurene':[[0,1,3,2,4,5,6,7],[0,1,2,3,4,5,6,7]],'ignis':[[0,1,2,3,5,4,6,7]]*2,'leon':[[0,1,2,3,5,4,6,7]]*2,'orion':[[0,1,2,3,5,4,6,7]]*2,'leif':[[0,1,2,3,4,5,6,7]]*2}
profiles=read('988c3299-c873-4e60-9cfe-b25d3b3b3b18');leon_profiles=read('0fc011a8-b6e4-45cf-851b-7ba03fcbc33a')
review=Image.new('RGBA',(128*8,128*18),(20,28,44,255))
for n,(key,src) in enumerate(zip(keys,sources)):
 for form in range(2):
  sheet=read(src);frames=[cell(sheet,i+form*8,4,4) for i in orders[key][form]]
  if key in ['lyria','ignis']:
   offset=(0 if key=='lyria' else 4)+form*2
   frames[2]=cell(profiles,offset,4,2);frames[3]=cell(profiles,offset+1,4,2)
  if key=='leon':frames[2]=cell(leon_profiles,form*2,4,1);frames[3]=cell(leon_profiles,form*2+1,4,1)
  # Alpha bounding boxes and common height anchor avoid per-direction character size jumps.
  crops=[]
  for f in frames:
   pixels=np.array(f);labels,count=ndimage.label(pixels[:,:,3]>32);areas=np.bincount(labels.ravel());areas[0]=0
   keep=areas>=max(1,areas.max()*.025);keep[0]=False
   pixels[:,:,3]=np.where(keep[labels],pixels[:,:,3],0);f=Image.fromarray(pixels)
   bbox=f.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox()
   assert bbox,(key,form)
   crops.append(f.crop(bbox))
  # Normalize feet-to-head height, allowing weapons/capes their own width within the cell.
  atlas=Image.new('RGBA',(512,256))
  for i,c in enumerate(crops):
   ratio=min(112/c.width,116/c.height);c=c.resize((round(c.width*ratio),round(c.height*ratio)),Image.Resampling.LANCZOS)
   frame=Image.new('RGBA',(128,128));frame.alpha_composite(c,((128-c.width)//2,122-c.height));atlas.alpha_composite(frame,((i%4)*128,(i//4)*128));review.alpha_composite(frame,(i*128,(n*2+form)*128))
  atlas.save(out/(key+('-transformed' if form else '')+'-directions.webp'),lossless=True,method=6)
  portrait=cell((female_after if form else female) if n<5 else (male_after if form else male),n if n<5 else n-5,3 if n<5 else 2,3 if n<5 else 2)
  pixels=np.array(portrait);labels,count=ndimage.label(pixels[:,:,3]>32);areas=np.bincount(labels.ravel());areas[0]=0;main=int(areas.argmax());distance=ndimage.distance_transform_edt(labels!=main);keep=np.zeros(count+1,dtype=bool);keep[main]=True
  # Retain nearby detached accessories, excluding fragments of adjacent portrait cells.
  for component in range(1,count+1):
   if component==main:continue
   mask=labels==component
   if areas[component]>=max(32,areas[main]*.001) and distance[mask].min()<=max(3,portrait.width*.012):keep[component]=True
  pixels[:,:,3]=np.where(keep[labels],pixels[:,:,3],0);portrait=Image.fromarray(pixels)
  canvas=Image.new('RGBA',(384,576));portrait.thumbnail((368,560),Image.Resampling.LANCZOS);canvas.alpha_composite(portrait,((384-portrait.width)//2,568-portrait.height));canvas.save(out/(key+('-after' if form else '-before')+'.webp'),quality=88,method=6)
review.save('/workspace/d2-reference/all-directions.png')
print('Prepared 18 portraits and 18 eight-direction atlases; reviewed profile repairs included.')
