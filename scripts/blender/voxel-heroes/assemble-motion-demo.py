from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import sys
root=Path(sys.argv[1]);frames=[];font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',17)
labels=['わんぱく小学生 / 待機','星宮あかり / 歩行','バスケ部エース / ジャンプ','神代 レオン / 攻撃']
for f in range(24):
 im=Image.new('RGB',(640,704),'#1c2a34');draw=ImageDraw.Draw(im)
 for i,label in enumerate(labels):
  x=i%2*320;y=i//2*352;im.paste(Image.open(root/'.demo-frames'/f'{i}-{f}.png').resize((320,320)),(x,y));draw.text((x+12,y+323),label,font=font,fill='#f0deb7')
 frames.append(im)
# A single shared palette prevents frame-to-frame color flicker.
palette=frames[0].quantize(colors=128,method=Image.Quantize.MEDIANCUT)
frames=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames]
frames[0].save(root/'animation-demo.gif',save_all=True,append_images=frames[1:],duration=100,loop=0,disposal=2,optimize=False)
print('Saved animation-demo.gif')
