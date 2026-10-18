"""Original, reference-led 35-hero voxel set. Blender 4.3+.
blender -b -t 3 --python scripts/blender/voxel-heroes/build.py -- --out /path [--only id] [--render]
Source models: separate semantic meshes, rigid bone weights, shared vertex-color material.
Game export: one skinned mesh and one material, four in-place clips, +Z front / Y up.
"""
import bpy,bmesh,math,json,sys,argparse,os
from pathlib import Path
from mathutils import Vector,Matrix
P=argparse.ArgumentParser();P.add_argument('--out',required=True);P.add_argument('--only',default='');P.add_argument('--designs',default='');P.add_argument('--render',action='store_true');P.add_argument('--size',type=int,default=512);P.add_argument('--samples',type=int,default=16)
args=P.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
OUT=Path(args.out);OUT.mkdir(parents=True,exist_ok=True);DESIGNS=json.loads((Path(args.designs) if args.designs else Path(__file__).with_name('designs.json')).read_text())
def xyz(v):return (v[0],-v[2],v[1])
def linear(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
def color(h):return tuple(linear(int(h[i:i+2],16)/255) for i in (0,2,4))+(1,)
def tint(h,k):return ''.join(f'{min(255,max(0,int(int(h[i:i+2],16)*k))):02x}' for i in (0,2,4))
# One chamfer segment retains block planes while catching a narrow edge highlight.
bm=bmesh.new();bmesh.ops.create_cube(bm,size=1);bmesh.ops.bevel(bm,geom=list(bm.edges),offset=.025,segments=1,affect='EDGES');bm.verts.ensure_lookup_table();bm.verts.index_update();CUBE_V=[tuple(v.co) for v in bm.verts];CUBE_F=[[v.index for v in f.verts] for f in bm.faces];bm.free()
class Model:
 def __init__(self,d):self.d=d;self.parts={};self.meshes=[]
 def poly(self,name,bone,verts,faces,c):
  k=(name,bone);p=self.parts.setdefault(k,[[],[],[]]);n=len(p[0]);p[0].extend(xyz(v) for v in verts);p[1].extend([n+i for i in f] for f in faces);p[2].extend([color(c)]*len(faces))
 def box(self,name,bone,pos,size,c,rot=0):
  a=math.radians(rot);ca=math.cos(a);sa=math.sin(a);vs=[]
  for v in CUBE_V:
   x,y,z=[v[i]*size[i] for i in range(3)];vs.append((pos[0]+x*ca-y*sa,pos[1]+x*sa+y*ca,pos[2]+z))
  self.poly(name,bone,vs,CUBE_F,c)
 def taper(self,name,bone,pos,bottom,top,height,c):
  x,y,z=pos;vs=[]
  for yy,(w,d) in [(y-height/2,bottom),(y+height/2,top)]:vs += [(x-w/2,yy,z-d/2),(x+w/2,yy,z-d/2),(x+w/2,yy,z+d/2),(x-w/2,yy,z+d/2)]
  self.poly(name,bone,vs,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],c)
 def ring(self,name,bone,pos,size,c,th=.016):
  x,y,z=pos;w,h=size
  self.box(name,bone,(x,y+h/2,z),(w,th,.022),c);self.box(name,bone,(x,y-h/2,z),(w,th,.022),c)
  self.box(name,bone,(x-w/2,y,z),(th,h,.022),c);self.box(name,bone,(x+w/2,y,z),(th,h,.022),c)
 def make(self):
  d=self.d;b=self.box;t=self.taper;hair=d['hair'];coat=d['coat'];accent=d['accent'];bottom=d['bottom'];skin='efc3a4';dark='28303b';white='f3eee1';gold=d.get('trim','bea267')
  # Body is 3.15 heads including hair: sturdy feet, generous face, readable hands.
  b('skin','head',(0,1.45,0),(.54,.50,.43),skin)
  for s in [-1,1]:
   b('skin','head',(s*.285,1.43,0),(.065,.115,.095),skin)
   b('eyes','head',(s*.115,1.46,.219),(.065,.091,.023),'34303a')
   b('eyes','head',(s*.111,1.477,.234),(.025,.031,.012),d.get('eye',tint(accent,.7)))
   b('eyes','head',(s*.125,1.494,.24),(.017,.022,.009),'fff5df')
   b('face','head',(s*.115,1.535,.22),(.081,.018,.025),tint(hair,.7),rot=-s*4)
   b('face','head',(s*.185,1.385,.218),(.05,.022,.01),'df9f91')
  b('face','head',(0,1.403,.23),(.034,.038,.028),skin)
  b('face','head',(0,1.355,.22),(.057,.013,.014),'a16e63')
  b('skin','spine',(0,1.201,0),(.155,.12,.16),skin)
  t('shirt','spine',(0,1.005,0),(.36,.26),(.47,.28),.40,coat)
  b('waist','pelvis',(0,.798,0),(.36,.17,.25),bottom)
  # articulated 2-segment arms and legs; skin is covered by outfit sleeves.
  for s,side in [(-1,'R'),(1,'L')]:
   for bone,y,sy in [(f'upper_arm.{side}',1.065,.235),(f'forearm.{side}',.872,.18)]:
    c=skin if d.get('sleeves')=='short' and 'forearm' in bone else coat
    b('sleeves',bone,(s*.302,y,0),(.16,sy,.205),c)
   b('cuffs',f'forearm.{side}',(s*.302,.785,.005),(.171,.045,.213),accent if d.get('sport') else tint(coat,1.16))
   b('hands',f'forearm.{side}',(s*.302,.722,.015),(.15,.12,.17),accent if d['id']=='high-school-gardener' else skin)
   b('thumb',f'forearm.{side}',(s*.241,.73,.061),(.05,.065,.07),accent if d['id']=='high-school-gardener' else skin)
   legskin=skin if d.get('shorts') or d.get('skirt') else bottom
   if d.get('tights'):legskin='37343e'
   b('legs',f'thigh.{side}',(s*.105,.63,0),(.165,.30,.19),bottom if d.get('shorts') else legskin)
   b('legs',f'shin.{side}',(s*.105,.302,0),(.151,.35,.18),d.get('socks',legskin))
   if d.get('skirt') and not d.get('tights') and not d.get('socks'):b('socks',f'shin.{side}',(s*.105,.18,.002),(.157,.10,.186),'e5e0d4')
   b('shoes',f'shin.{side}',(s*.105,.088,.05),(.192,.14,.295),d.get('shoes','3d3535'))
   b('soles',f'shin.{side}',(s*.105,.026,.05),(.2,.035,.305),tint(d.get('shoes','3d3535'),.67))
   if d.get('sport') or d.get('shoes','') in ['eadbd3','e27d3f','bc403b']:
    for yy in [.09,.12]:b('laces',f'shin.{side}',(s*.105,yy,.201),(.105,.015,.012),white)
   if d.get('sport') and not d.get('skirt'):
    for bone,y,h in [(f'thigh.{side}',.64,.26),(f'shin.{side}',.3,.32)]:b('side_stripe',bone,(s*.189,y,0),(.018,h,.055),accent)
  # Small lapels, large color areas, limited plaid bands. No micro-noise textures.
  is_uniform=not d.get('transformed') and (not d['id'].startswith('elementary') or d.get('longcoat'))
  if is_uniform:
   inner=d.get('vestcolor',accent if d.get('hood') else 'e9e7df') if d.get('vest') or d.get('hood') else 'e9e7df'
   b('shirt_front','spine',(0,1.035,.151),(.17,.30,.018),inner)
   for s in [-1,1]:
    b('lapels','spine',(s*.109,1.128,.172),(.055,.155,.022),tint(coat,1.19),rot=s*25)
    b('lapel_trim','spine',(s*.139,1.128,.187),(.011,.152,.012),gold,rot=s*25)
   b('badge','spine',(-.172,1.092,.16),(.047,.061,.025),gold)
   b('badge','spine',(-.172,1.098,.177),(.025,.033,.011),accent)
  elif not d.get('transformed'):b('front_pocket','spine',(0,1.04,.15),(.20,.11,.018),tint(coat,1.13))
  if d.get('transformed'):
   # Authored magical costume: mantles, metallic pauldrons, jewels and boots.
   b('magic_belt','pelvis',(0,.838,0),(.40,.055,.29),gold)
   b('magic_buckle','pelvis',(0,.838,.163),(.09,.08,.025),accent,rot=45)
   b('magic_bodice','spine',(0,1.025,.158),(.16,.29,.025),d.get('inner','f0eee3'))
   for side,sign in [('R',-1),('L',1)]:
    b('magic_pauldrons','upper_arm.'+side,(sign*.303,1.168,0),(.21,.105,.24),gold)
    b('magic_pauldrons','upper_arm.'+side,(sign*.303,1.193,.015),(.15,.055,.19),coat)
    b('magic_bracers','forearm.'+side,(sign*.302,.837,0),(.174,.11,.22),gold)
    b('magic_boots','shin.'+side,(sign*.105,.285,.102),(.16,.24,.035),accent)
    b('magic_boot_trim','shin.'+side,(sign*.105,.40,.102),(.17,.035,.04),gold)
    b('magic_front_trim','spine',(sign*.13,1.02,.172),(.018,.30,.019),gold)
   b('magic_jewel','spine',(0,1.153,.193),(.075,.088,.04),accent,rot=45)
   b('magic_jewel_glint','spine',(-.012,1.168,.218),(.022,.027,.01),'fff6db')
   t('magic_mantle','spine',(0,.84,-.224),(.62,.045),(.36,.045),.69,coat)
   t('magic_mantle_lining','spine',(0,.84,-.194),(.56,.015),(.30,.015),.63,accent)
   for sign in [-1,1]:b('magic_mantle_trim','spine',(sign*.226,.84,-.255),(.022,.65,.018),gold,rot=sign*10)
   if d.get('crown'):
    b('magic_circlet','head',(0,1.70,.10),(.43,.035,.32),gold)
    for xx,yy in [(-.15,1.75),(0,1.79),(.15,1.75)]:b('magic_crown','head',(xx,yy,.24),(.075,.11,.045),gold)
    b('magic_crown_gem','head',(0,1.77,.268),(.04,.055,.022),accent)
  if d.get('tie'):
   b('tie','spine',(0,1.143,.181),(.049,.04,.025),accent)
   t('tie','spine',(0,1.036,.184),(.048,.023),(.031,.023),.17,accent)
   for y in [1.005,1.07]:b('tie_stripe','spine',(0,y,.2),(.039,.011,.008),tint(accent,1.35),rot=15)
  if d.get('bow'):
   for s in [-1,1]:b('bow','spine',(s*.065,1.143,.184),(.115,.078,.044),accent,rot=-s*15)
   b('bow','spine',(0,1.144,.208),(.045,.048,.04),tint(accent,.8))
  if d.get('buttons'):
   for y in [.91,1.,1.09]:b('buttons','spine',(.022,y,.171),(.021,.021,.02),gold)
  if d.get('skirt'):
   h=.42 if d.get('longskirt') else .24;y=.61 if d.get('longskirt') else .706
   t('skirt','pelvis',(0,y,.0),(.54,.35),(.36,.27),h,bottom)
   for s in [-1,1]:
    for x in [.075,.18]:b('pleats','pelvis',(s*x,y,.172),(.023,h*.88,.018),tint(bottom,.78),rot=s*6)
    # Back pleats remain visible beneath long hair; no open back faces.
    for x in [.075,.18]:b('pleats','pelvis',(s*x,y,-.172),(.023,h*.88,.018),tint(bottom,.78),rot=s*6)
   if not d.get('longskirt'):
    for z in [-.181,.181]:
     for yy in [y-.07,y-.095]:b('hem','pelvis',(0,yy,z),(.50,.009,.011),tint(accent,1.12))
  if d.get('longcoat') or d.get('coatTail'):
   h=.46 if d.get('longcoat') else .26
   for s in [-1,1]:
    t('coat_tails','pelvis',(s*.181,.82-h/2,-.058),(.18,.30),(.12,.25),h,coat)
    b('coat_lining','pelvis',(s*.181,.82-h/2,-.228),(.168,h*.92,.018),accent)
    b('coat_edges','pelvis',(s*.264,.82-h/2,.105),(.012,h,.018),gold)
  if d.get('apron'):
   c=accent if 'gardener' in d['id'] else '353735'
   b('apron_bib','spine',(0,1.02,.162),(.29,.26,.035),c)
   t('apron_skirt','pelvis',(0,.644,.17),(.43,.03),(.33,.03),.40,c)
   for s in [-1,1]:b('apron_straps','spine',(s*.13,1.12,-.13),(.043,.25,.022),c)
   b('apron_tie','pelvis',(0,.82,-.15),(.38,.035,.022),c)
   b('apron_pocket','pelvis',(.065,.66,.197),(.18,.12,.026),tint(c,1.16))
  if d.get('hood'):
   b('hood','spine',(0,1.165,-.15),(.36,.16,.16),accent if d.get('sport') else tint(coat,.8))
   for s in [-1,1]:b('hood_string','spine',(s*.07,1.10,.19),(.013,.11,.014),'d1cfb5')
  if d.get('scarf'):
   b('scarf','spine',(0,1.205,.0),(.30,.075,.32),accent)
   if d['id']=='elementary-assassin':b('face_cover','head',(0,1.355,.23),(.53,.11,.04),accent)
   for i in range(3):b('scarf_tail','pelvis',(.14+i*.018,1.11-i*.14,-.195-i*.02),(.10,.18,.045),accent,rot=-8)
   for yy in [.73,.78,.83]:b('scarf_pattern','pelvis',(.176,yy,-.263),(.095,.015,.012),tint(accent,1.4))
  if d.get('cape'):
   # Back silhouette: stepped cloth panels with a center split and contrasting lining.
   for s in [-1,1]:
    t('cape','spine',(s*.115,.88,-.255),(.26,.06),(.20,.045),.64,accent)
    b('cape_border','spine',(s*.23,.88,-.29),(.018,.62,.015),gold)
    b('cape_motif','spine',(s*.115,.89,-.292),(.035,.20,.015),tint(accent,1.4),rot=s*25)
  if d.get('crossbelt'):
   b('crossbelt','spine',(0,1.04,.194),(.041,.43,.025),'9c9ba6',rot=45)
  if d.get('armband'):b('armband','upper_arm.L',(.30,1.08,.0),(.174,.075,.218),accent)
  if d.get('chain'):
   for i in range(7):b('chain','pelvis',(.11+i*.021,.81-math.sin(i/6*math.pi)*.07,.16),(.025,.022,.016),gold)
  # Hair: sculpted in broad stepped locks instead of identical recolored helmets.
  b('hair_cap','head',(0,1.64,-.025),(.58,.17,.47),hair)
  b('hair_crown','head',(-.025,1.738,-.045),(.44,.075,.39),tint(hair,1.035))
  if d['hairStyle'] in ['swept','spiky','ponytail','wavy','sidepony']:
   b('hair_crown','head',(-.07,1.785,-.065),(.24,.04,.27),tint(hair,1.065))
  b('hair_back','head',(0,1.49,-.20),(.54,.29,.10),tint(hair,.88))
  hs=d['hairStyle']
  fringe_count=5 if hs in ['spiky','swept','short'] else 4
  for i in range(fringe_count):
   x=(i-(fringe_count-1)/2)*(.104 if fringe_count==5 else .132);drop=[.12,.17,.10,.15,.09][i]
   if hs=='swept':drop=.08+i*.026
   for j in range(3):
    w=(.13 if fringe_count==5 else .16)-j*.025;y=1.64-j*drop/3;xx=x+(j*.018 if hs=='swept' else ((i%2)*2-1)*j*.008)
    b('hair_fringe','head',(xx,y,.209+j*.012),(w,drop/3+.025,.091-j*.012),d.get('streak') if d.get('streak') and i==0 else tint(hair,1.04+i%2*.06))
  for s in [-1,1]:
   b('hair_sides','head',(s*.267,1.49,-.04),(.095,.29,.36),tint(hair,.94))
   if hs in ['bob','wavybob']:b('hair_sides','head',(s*.277,1.30,-.075),(.12,.18,.30),hair)
  if hs=='spiky':
   for i in range(5):
    x=(i-2)*.102
    for j in range(3):b('hair_spikes','head',(x+(i-2)*j*.015,1.758+j*.031,-.05),(max(.04,.12-j*.032),.055,.16-j*.035),tint(hair,1.1),rot=-(i-2)*8)
  if hs in ['long','wavy']:
   for i in range(5):
    x=(i-2)*.112
    for j in range(4):
     wave=math.sin(j*2+i)*.035 if hs=='wavy' else 0
     b('long_hair','head',(x+wave,1.44-j*.13,-.245-j*.014),(.135-j*.01,.18,.095),tint(hair,.88+(i%2)*.1),rot=wave*110)
   for s in [-1,1]:
    for j in range(3):b('side_locks','head',(s*(.29+(j%2)*.025),1.36-j*.12,.01),(.095,.16,.12),hair,rot=s*(j%2)*10)
  if hs in ['ponytail','sidepony','twintails']:
   sides=[-1,1] if hs=='twintails' else [1] if hs=='sidepony' else [0]
   for s in sides:
    x=s*.30;z=-.23 if s==0 else -.08
    b('hair_tie','head',(x,1.67,z),(.15,.075,.15),accent)
    for j in range(5):
     b('ponytail','head',(x+s*j*.026,1.61-j*.13,z-.045-j*.018),(.16-j*.014,.19,.155-j*.012),tint(hair,1+(j%2)*.08),rot=s*8)
    if hs=='twintails':b('top_bun','head',(s*.23,1.79,-.01),(.16,.13,.14),hair)
  if hs=='wavybob':
   for s in [-1,1]:
    for j in range(3):b('hair_wave','head',(s*(.285+j%2*.018),1.51-j*.105,-.10),(.11,.135,.26),tint(hair,1.05))
  if d.get('glasses'):
   for s in [-1,1]:self.ring('glasses','head',(s*.123,1.457,.258),(.18,.13),'575962',.014)
   b('glasses','head',(0,1.468,.261),(.067,.016,.018),'72767f')
   for s in [-1,1]:b('glasses','head',(s*.24,1.48,.14),(.016,.018,.22),'575962')
  if d.get('star'):
   for a in [0,45]:b('hair_star','head',(-.239,1.64,.266),(.075,.026,.028),gold,rot=a)
   b('hair_star','head',(-.239,1.64,.266),(.026,.075,.028),gold)
  if d.get('ribbon'):
   for s in [-1,1]:b('hair_ribbon','head',(.30+s*.06,1.74,.02),(.105,.075,.05),accent,rot=s*20)
  if d.get('headphones'):
   b('headphones','head',(0,1.792,0),(.62,.045,.09),'b3b4ba')
   for s in [-1,1]:
    b('headphones','head',(s*.315,1.61,0),(.045,.32,.10),'424353')
    b('headphones','head',(s*.34,1.47,0),(.095,.16,.145),'b3b4ba')
    b('headphones','head',(s*.394,1.47,0),(.018,.105,.09),accent)
  hat=d.get('hat')
  if hat:
   hc=accent if hat in ['cap','band','straw'] else 'f3f2e9'
   if hat=='band':
    b('headband','head',(0,1.65,.0),(.595,.075,.49),hc)
    for s in [-1,1]:b('headband_ties','head',(s*.065,1.56,-.255),(.06,.18,.04),hc,rot=s*16)
   else:
    b('hat','head',(0,1.775,-.015),(.57,.18,.46),hc)
    b('hat_brim','head',(0,1.70,.10 if hat=='cap' else 0),(.67 if hat=='cap' else .76,.055,.48 if hat=='cap' else .65),tint(hc,.92))
    if hat=='chef':b('hat','head',(0,1.88,0),(.61,.14,.49),hc)
  if d.get('bag'):
   for z in [-.16,.18]:b('bag_strap','spine',(0,1.02,z),(.035,.46,.024),'a88157',rot=40)
   b('satchel','pelvis',(.29,.73,-.07),(.24,.24,.12),'bb9567')
   b('satchel_flap','pelvis',(.29,.80,.0),(.25,.11,.025),'d1b38a')
   b('paw','pelvis',(.29,.738,.001),(.065,.06,.012),'795638')
   for xx in [-.055,0,.055]:b('paw','pelvis',(.29+xx,.793,.018),(.026,.027,.012),'795638')
  prop=d.get('prop')
  if prop:
   bone='forearm.L';px=.35;py=.73;pz=.19
   if prop in ['book','books','case']:
    for i in range(3 if prop=='books' else 1):
     c=['9b5142','c6ac72','526675'][i] if prop!='case' else '292f36'
     b('held_'+prop,bone,(px,py+i*.08,pz),(.25,.065 if prop=='books' else .24,.16),c)
     if prop!='case':b('pages',bone,(px,py+i*.08,pz+.085),(.21,.04 if prop=='books' else .19,.016),'e6dcc2')
    if prop=='case':self.ring('case_handle',bone,(px,py+.16,pz),(.12,.07),'7d6949')
   elif prop=='ball':
    b('ball',bone,(px,py+.035,pz),(.24,.24,.23),'c56a2f' if not d['id'].startswith('elementary') else 'e5e4df')
    for off in [-.06,.06]:b('ball_seams',bone,(px+off,py+.035,pz+.119),(.014,.22,.014),'725037')
    b('ball_seams',bone,(px,py+.035,pz+.12),(.22,.014,.014),'725037')
   elif prop=='rabbit':
    b('rabbit_body',bone,(px,py+.04,pz),(.18,.21,.15),'d5b28c' if 'high' in d['id'] else 'f1eee5')
    b('rabbit_head',bone,(px,py+.18,pz+.025),(.16,.13,.14),'e1c09e' if 'high' in d['id'] else 'f8f4ec')
    for s in [-1,1]:
     b('rabbit_ears',bone,(px+s*.045,py+.30,pz),(.04,.16,.05),'e4c9ac',rot=-s*12)
     b('rabbit_eyes',bone,(px+s*.043,py+.185,pz+.099),(.018,.018,.014),'373137')
   elif prop=='mic':
    b('microphone',bone,(px,py+.06,pz),(.045,.24,.045),'42444d');b('microphone_head',bone,(px,py+.21,pz),(.095,.09,.09),'a5a6a6')
   elif prop=='ladle':
    b('ladle',bone,(px,py+.12,pz),(.025,.40,.035),'adbabd');b('ladle_bowl',bone,(px,py+.35,pz),(.13,.09,.09),'a2b2b7')
   elif prop=='flask':
    b('flask',bone,(px,py+.05,pz),(.12,.15,.11),accent);b('flask_liquid',bone,(px,py+.02,pz+.06),(.095,.075,.012),'59ab49' if d['id']=='elementary-mage' else '62b8aa');b('flask_neck',bone,(px,py+.16,pz),(.048,.075,.05),'b5d4dc')
   elif prop=='plant':
    t('plant_pot',bone,(px,py+.035,pz),(.115,.11),(.16,.14),.14,'aa7453');b('plant_stem',bone,(px,py+.17,pz),(.022,.19,.022),'486d35')
    for s in [-1,1]:b('plant_leaf',bone,(px+s*.05,py+.19,pz),(.10,.045,.065),'6e9a45',rot=s*30)
  return self
 def instantiate(self):
  mat=bpy.data.materials.new('HeroPalette_VertexColor');mat.use_nodes=True;p=mat.node_tree.nodes.get('Principled BSDF');p.inputs['Roughness'].default_value=.70
  node=mat.node_tree.nodes.new('ShaderNodeVertexColor');node.layer_name='Color';mat.node_tree.links.new(node.outputs['Color'],p.inputs['Base Color'])
  coll=bpy.data.collections.new('CHARACTER • '+self.d['name']);bpy.context.scene.collection.children.link(coll)
  for (name,bone),(vs,fs,cs) in self.parts.items():
   me=bpy.data.meshes.new(name);me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new(name+'__'+bone,me);coll.objects.link(o);me.materials.append(mat)
   colors=me.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
   for poly,c in zip(me.polygons,cs):
    for i in poly.loop_indices:colors.data[i].color=c
   vg=o.vertex_groups.new(name=bone);vg.add(list(range(len(vs))),1,'REPLACE');self.meshes.append(o)
  ar=bpy.data.armatures.new('HeroSkeleton');rig=bpy.data.objects.new('HeroRig',ar);coll.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
  bones={'root':((0,0,0),(0,.2,0),None),'pelvis':((0,.80,0),(0,.93,0),'root'),'spine':((0,.93,0),(0,1.22,0),'pelvis'),'head':((0,1.22,0),(0,1.68,0),'spine')}
  for s,side in [(-1,'R'),(1,'L')]:
   bones.update({f'upper_arm.{side}':((s*.302,1.18,0),(s*.302,.96,0),'spine'),f'forearm.{side}':((s*.302,.96,0),(s*.302,.72,0),f'upper_arm.{side}'),f'thigh.{side}':((s*.105,.79,0),(s*.105,.46,0),'pelvis'),f'shin.{side}':((s*.105,.46,0),(s*.105,.10,0),f'thigh.{side}')})
  for name,(head,tail,parent) in bones.items():
   bo=ar.edit_bones.new(name);bo.head=xyz(head);bo.tail=xyz(tail)
   if parent:bo.parent=ar.edit_bones[parent]
  bpy.ops.object.mode_set(mode='OBJECT');rig.show_in_front=True;ar.display_type='STICK'
  for o in self.meshes:o.parent=rig;mod=o.modifiers.new('Rigid voxel skinning','ARMATURE');mod.object=rig
  rig['hero_id']=self.d['id'];rig['reference']=self.d['source'];rig['design_notes']=self.d['feature'];rig['front_axis']='-Y Blender, +Z glTF';rig['scale']='1 unit = 1 meter';rig['actions']='Idle, Walk, Jump, Attack'
  self.rig=rig;return self
 def animate(self):
  rig=self.rig
  for pb in rig.pose.bones:pb.rotation_mode='XYZ'
  durations={'Idle':72,'Walk':30,'Jump':36,'Attack':24}
  for name,duration in durations.items():
   action=bpy.data.actions.new(name);rig.animation_data_create();rig.animation_data.action=action
   for f in range(1,duration+2,3):
    self.pose(name,min(f,duration+1),duration)
    for pb in rig.pose.bones:
     pb.keyframe_insert('rotation_euler',frame=min(f,duration+1),group=pb.name);pb.keyframe_insert('location',frame=min(f,duration+1),group=pb.name)
   self.pose(name,duration+1,duration)
   for pb in rig.pose.bones:
    pb.keyframe_insert('rotation_euler',frame=duration+1,group=pb.name);pb.keyframe_insert('location',frame=duration+1,group=pb.name)
   for fc in action.fcurves:
    for k in fc.keyframe_points:k.interpolation='LINEAR'
   track=rig.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,1,action);track.mute=True
  rig.animation_data.action=None
  for pb in rig.pose.bones:pb.location=(0,0,0);pb.rotation_euler=(0,0,0)
  self.actions=durations
 def pose(self,name,f,dur):
  p=(f-1)/dur;sn=math.sin(p*2*math.pi);rig=self.rig
  for pb in rig.pose.bones:pb.location=(0,0,0);pb.rotation_euler=(0,0,0)
  def rx(n,a):rig.pose.bones[n].rotation_euler.x=a
  # Bone local Y follows its length. Root local Y is world vertical.
  if name=='Idle':
   rig.pose.bones['pelvis'].location.y=.009*(1-math.cos(p*2*math.pi));rx('head',sn*.025)
   for side in ['L','R']:rx('upper_arm.'+side,sn*.025)
  elif name=='Walk':
   rig.pose.bones['pelvis'].location.y=.019*(1-math.cos(p*4*math.pi))
   for s,side in [(-1,'L'),(1,'R')]:
    rx('thigh.'+side,s*sn*(.13 if self.d.get('longskirt') else .30 if self.d.get('skirt') else .48));rx('shin.'+side,max(0,-s*sn)*(.15 if self.d.get('longskirt') else .32 if self.d.get('skirt') else .42));rx('upper_arm.'+side,-s*sn*.36);rx('forearm.'+side,-.10-max(0,s*sn)*.15)
   rig.pose.bones['spine'].rotation_euler.y=sn*.04
  elif name=='Jump':
   # Anticipation, airborne arc, landing compress, then exact rest.
   lift=max(0,math.sin((p-.18)/.64*math.pi)) if .18<=p<=.82 else 0
   crouch=.10*math.sin(p/.18*math.pi) if p<.18 else .08*math.sin((p-.82)/.18*math.pi) if p>.82 else 0
   rig.pose.bones['root'].location.y=lift*.30-crouch
   for side in ['L','R']:rx('thigh.'+side,(-crouch*3-lift*.22)*(.4 if self.d.get('longskirt') else 1));rx('shin.'+side,crouch*5+lift*.45);rx('upper_arm.'+side,-lift*.9)
  else:
   wind=math.sin(min(1,p/.38)*math.pi/2) if p<.38 else max(0,1-(p-.38)/.62)
   strike=max(0,math.sin((p-.28)/.55*math.pi)) if .28<p<.83 else 0
   rx('upper_arm.R',-.55*wind-1.10*strike);rx('forearm.R',-.60*wind+.4*strike)
   rig.pose.bones['spine'].rotation_euler.y=-.26*wind+.5*strike
   rig.pose.bones['head'].rotation_euler.y=.12*wind-.22*strike
   rx('upper_arm.L',-.18*wind);rx('thigh.L',-.14*strike);rx('shin.R',.17*strike)
 def export(self,path):
  bpy.ops.object.select_all(action='DESELECT')
  # Export a joined COPY; keep semantic source meshes editable in .blend.
  copies=[]
  for o in self.meshes:
   c=o.copy();c.data=o.data.copy();bpy.context.collection.objects.link(c);c.select_set(True);copies.append(c)
  bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();joined=bpy.context.object;joined.name='HeroMesh';self.rig.select_set(True)
  bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_nla_strips=True,export_force_sampling=True,export_frame_range=False,export_skins=True,export_yup=True,export_extras=True,export_materials='EXPORT')
  bpy.data.objects.remove(joined,do_unlink=True)

def studio(size):
 sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=args.samples;sc.cycles.use_denoising=False;sc.render.threads_mode='FIXED';sc.render.threads=3
 sc.render.resolution_x=size;sc.render.resolution_y=size;sc.render.resolution_percentage=100;sc.render.image_settings.file_format='PNG';sc.render.film_transparent=False
 sc.world=bpy.data.worlds.new('Studio world');sc.world.color=(.35,.35,.35);sc.world.use_nodes=True;sc.world.node_tree.nodes['Background'].inputs[0].default_value=(.32,.38,.44,1);sc.world.node_tree.nodes['Background'].inputs[1].default_value=.6
 sc.view_settings.view_transform='AgX';sc.view_settings.look='AgX - Medium High Contrast';sc.view_settings.exposure=.2
 stage=bpy.data.collections.new('STUDIO • excluded from GLB');sc.collection.children.link(stage)
 def link(o):stage.objects.link(o);return o
 def area(name,pos,power,size,c):
  data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=c;o=link(bpy.data.objects.new(name,data));o.location=xyz(pos);o.rotation_euler=(Vector(xyz((0,1,0)))-o.location).to_track_quat('-Z','Y').to_euler()
 area('Warm key',(-3,5,4),400,4,(1,.89,.77));area('Cool fill',(3,3,1),180,3,(.75,.86,1));area('Rim',(1,4,-3),350,3,(1,.96,.85))
 mat=bpy.data.materials.new('Studio floor');mat.diffuse_color=(.14,.19,.23,1);mat.use_nodes=True;mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.14,.19,.23,1);mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.9
 me=bpy.data.meshes.new('floor');me.from_pydata([(-200,-200,-.005),(200,-200,-.005),(200,200,-.005),(-200,200,-.005)],[],[(0,1,2,3)]);o=link(bpy.data.objects.new('Studio floor',me));me.materials.append(mat)
 cam=link(bpy.data.objects.new('Review camera',bpy.data.cameras.new('Review camera')));sc.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=2.30
 return cam

def aim(cam,angle=0,elevation=.12):
 a=math.radians(angle);cam.location=xyz((math.sin(a)*5,.96+elevation*5,math.cos(a)*5));cam.rotation_euler=(Vector(xyz((0,.96,0)))-cam.location).to_track_quat('-Z','Y').to_euler()
def main(d):
 bpy.ops.wm.read_factory_settings(use_empty=True);sc=bpy.context.scene;sc.render.fps=30;sc.frame_end=73
 model=Model(d).make().instantiate();model.animate();cam=studio(args.size);aim(cam,35,.12)
 folder=OUT/d['id'];folder.mkdir(parents=True,exist_ok=True)
 text=bpy.data.texts.new('README • '+d['name']);text.write(d['name']+'\n'+d['feature']+'\nReference: '+d['source']+'\nOriginal interpretation of unseen rear surfaces.\nMeters; feet at Z=0; front is -Y. glTF Y-up / +Z front.\nMeshes are separated by semantic part and bone. COLOR attribute drives one shared material.\nArmature: 12 bones; rigid weights preserve voxel faces.\nActions Idle / Walk / Jump / Attack: unmute ONE named NLA track to play.\nAll strips muted for a neutral saved inspection pose.\nSTUDIO collection is not in GLB. No textures required.\n')
 # Pack the exact source portrait as an editable image reference when supplied.
 ref=OUT/'references'/d['image']
 if ref.exists():
  im=bpy.data.images.load(str(ref));im.pack();im.name='REFERENCE • '+d['name']
  empty=bpy.data.objects.new('REFERENCE • '+d['name'],None);bpy.context.collection.objects.link(empty);empty.empty_display_type='IMAGE';empty.data=im;empty.empty_display_size=1.7;empty.location=(-1.4,0,.95);empty.rotation_euler=(math.pi/2,0,0);empty.hide_render=True
 bpy.ops.object.select_all(action='DESELECT');model.rig.select_set(True);bpy.context.view_layer.objects.active=model.rig
 bpy.context.preferences.filepaths.save_version=0
 bpy.ops.wm.save_as_mainfile(filepath=str(folder/(d['id']+'.blend')))
 model.export(folder/(d['id']+'.glb'))
 tris=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in model.meshes)
 report=dict(id=d['id'],name=d['name'],triangles=tris,sourceMeshes=len(model.meshes),bones=len(model.rig.data.bones),clips=model.actions,glbBytes=(folder/(d['id']+'.glb')).stat().st_size,reference=d['source'])
 (folder/'stats.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 if args.render:
  for view,angle,el in [('front',0,.02),('back',180,.02),('side',90,.02),('three-quarter',35,.15),('gameplay',155,.42)]:
   aim(cam,angle,el);sc.render.filepath=str(folder/(view+'.png'));bpy.ops.render.render(write_still=True)
 print('HERO_DONE '+json.dumps(report,ensure_ascii=False),flush=True)
for d in DESIGNS:
 if not args.only or d['id'] in args.only.split(','):main(d)
