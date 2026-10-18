"""Assemble a static, locally openable gallery from real exported-model screenshots."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,html,hashlib,shutil,sys,zipfile
root=Path(sys.argv[1]);ds=json.loads((root/'catalog.json').read_text());font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',18);big=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',28)
groups=[('elementary','小学生編',0,9),('high-school','高校生編',9,18),('magic-female','魔法編・女子',18,27),('magic-male','魔法編・男子',27,35)]
viewnames=[('front','正面'),('back','背面'),('side','側面'),('three-quarter','斜め'),('gameplay','三人称・後方俯瞰')]
for group,title,start,end in groups:
 subset=ds[start:end];im=Image.new('RGB',(1050,70+((len(subset)+2)//3)*390),'#1c2a34');draw=ImageDraw.Draw(im);draw.text((22,17),title+' / '+str(len(subset))+'人',font=big,fill='#eadcbf')
 for i,d in enumerate(subset):
  src=Image.open(root/d['id']/'three-quarter.png').resize((350,350));x=i%3*350;y=70+i//3*390;im.paste(src,(x,y));draw.text((x+12,y+355),d['name'],font=font,fill='#f1e6ce')
 im.save(root/(group+'-overview.jpg'),quality=94)
# All 35 in a compact visual overview.
im=Image.new('RGB',(1540,70+5*280),'#1c2a34');draw=ImageDraw.Draw(im);draw.text((20,17),'学習ローグ / 35人の通常主人公 • ボクセル3Dモデル',font=big,fill='#eadcbf')
for i,d in enumerate(ds):
 src=Image.open(root/d['id']/'three-quarter.png').resize((220,220));x=i%7*220;y=70+i//7*280;im.paste(src,(x,y));draw.text((x+7,y+227),d['name'],font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',14),fill='#f1e6ce')
im.save(root/'all-35.jpg',quality=94)
for d in ds:
 folder=root/d['id'];im=Image.new('RGB',(1440,340),'#1c2a34');draw=ImageDraw.Draw(im)
 ref=Image.open(root/'references'/d['image']).convert('RGBA');ref=ref.crop(ref.getbbox());ref.thumbnail((226,280));im.paste(ref,((240-ref.width)//2,35+(280-ref.height)//2),ref);draw.text((12,8),d['name'],font=font,fill='#f1e6ce');draw.text((12,313),'参照イラスト',font=font,fill='#becdd1')
 for i,(v,n) in enumerate(viewnames,1):
  image=Image.open(folder/(v+'.png')).resize((240,240));im.paste(image,(i*240,48));draw.text((i*240+12,313),n,font=font,fill='#becdd1')
 im.save(folder/'review.jpg',quality=94)
 im=Image.new('RGB',(1280,362),'#1c2a34');draw=ImageDraw.Draw(im)
 for i,(v,n) in enumerate([('Idle','待機'),('Walk','歩行'),('Jump','ジャンプ'),('Attack','攻撃')]):
  im.paste(Image.open(folder/('motion-'+v+'.png')).resize((320,320)),(i*320,0));draw.text((i*320+16,328),n+' / '+v,font=font,fill='#f1e6ce')
 im.save(folder/'motions.jpg',quality=94)
validation=json.loads((root/'validation.json').read_text());valid={v['id']:v for v in validation};stats=[json.loads((root/d['id']/'stats.json').read_text()) for d in ds]
styles='''*{box-sizing:border-box}body{margin:0;background:#14232d;color:#e5e9e5;font:16px/1.7 system-ui,sans-serif}main{max-width:1260px;margin:auto;padding:32px 20px}h1{font-size:clamp(26px,4vw,42px);line-height:1.3;color:#f0deb7}h2{margin-top:48px;color:#f0deb7}a{color:#b8dbce}nav{display:flex;gap:16px;flex-wrap:wrap;padding:16px 0}article{margin:26px 0;background:#20313c;padding:20px;border:1px solid #3f5861;border-radius:14px}img{max-width:100%;height:auto;border-radius:7px}article>img{display:block;width:100%}.row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.row img{width:100%}.small{font-size:13px;color:#bacacf}summary{cursor:pointer;color:#d9c9a4;padding:12px 0}.badge{display:inline-block;padding:4px 12px;background:#314943;border-radius:20px;margin-right:8px}input{background:#20313c;border:1px solid #607981;color:white;font:inherit;padding:12px;width:min(100%,440px);border-radius:8px}@media(max-width:640px){main{padding:20px 10px}article{padding:10px}.row{grid-template-columns:1fr}}'''
parts=['<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>学習ローグ・35人のボクセル主人公</title><style>'+styles+'</style><main><p class="small">LEARNING ROGUE / CHARACTER MODEL REVIEW</p><h1>35人の主人公を、<br>ブロックの世界へ。</h1><p>既存の通常イラストを参照した、約3頭身のオリジナル3Dモデル。画像はすべて実際のGLBをThree.jsで描画したものです。背景は確認用スタジオです。</p><p><span class="badge">35 Blenderファイル</span><span class="badge">35 GLB</span><span class="badge">各4アニメーション</span></p><nav><a href="README.md">仕様・検証結果</a><a href="viewer.html">動かせる3Dビューア</a><a href="all-35.jpg">全員の一覧画像</a><a href="animation-demo.gif">動作見本GIF</a></nav><p class="small">この画像一覧はHTMLを直接開いて閲覧できます。3DビューアのみHTTPサーバーが必要です。ゲーム本編への組み込み・commit・pushは行っていません。</p><input id="search" placeholder="主人公名で絞り込む" aria-label="主人公名で絞り込む"><nav>'+''.join(f'<a href="#{g}">{title}</a>' for g,title,_,_ in groups)+'</nav>']
for group,title,start,end in groups:
 parts.append(f'<h2 id="{group}">{title}</h2><a href="{group}-overview.jpg"><img loading="lazy" src="{group}-overview.jpg" alt="{title}のモデル一覧"></a>')
 for d in ds[start:end]:
  id=d['id'];v=valid[id];s=next(x for x in stats if x['id']==id)
  parts.append(f'<article data-name="{html.escape(d["name"]+id)}"><h3>{html.escape(d["name"])}</h3><p>{html.escape(d["feature"])}</p><a href="{id}/review.jpg"><img loading="lazy" src="{id}/review.jpg" alt="参照画像・正面・背面・側面・斜め・三人称視点"></a><p class="small">{s["triangles"]:,}三角形 · {v["bytes"]/1024:.0f} KiB · 12骨 · 描画メッシュ1個／マテリアル1個</p><nav><a href="{id}/{id}.blend">.blend</a><a href="{id}/{id}.glb">.glb</a><a href="viewer.html?id={id}">3D・動作確認</a></nav><details><summary>各方向を大きく表示</summary><div class="row">'+''.join(f'<figure><a href="{id}/{view}.png"><img loading="lazy" src="{id}/{view}.png" alt="{label}"></a><figcaption>{label}</figcaption></figure>' for view,label in viewnames)+f'</div></details><details><summary>待機・歩行・ジャンプ・攻撃の実動作</summary><a href="{id}/motions.jpg"><img loading="lazy" src="{id}/motions.jpg" alt="4動作の実際のポーズ"></a></details></article>')
parts.append('''<script>document.getElementById('search').oninput=e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('article').forEach(a=>a.hidden=!a.dataset.name.toLowerCase().includes(q))}</script></main></html>''');(root/'index.html').write_text('\n'.join(parts))
manifest={d['id']:{'source':d['source'],'sha256':hashlib.sha256((root/'references'/d['image']).read_bytes()).hexdigest()} for d in ds};(root/'reference-hashes.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print('Gallery and contact sheets written')
