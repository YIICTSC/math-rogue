"""Export editable hero parts + four rigid-skinned sports kits. No original assets overwritten.
blender -b -t 2 --python scripts/blender/build-sports-wardrobe.py
"""
import sys,json
from pathlib import Path
source=Path('scripts/blender/voxel-heroes/build.py')
sys.argv=['blender','--','--out','tmp/sports-wardrobe']
namespace={'__file__':str(source.resolve())}
exec(source.read_text().split('for d in DESIGNS:\n')[0],namespace)
bpy=namespace['bpy'];Model=namespace['Model'];OUT=Path('public/models/sports-wardrobe');OUT.mkdir(parents=True,exist_ok=True)
SKIN='efc3a4';WHITE='f3eee1';DARK='26384e'
# Semantic IDs are exported as per-vertex attributes, retained after joining.
parts={};report=[]
for d in namespace['DESIGNS']:
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.context.scene.render.fps=30;bpy.context.scene.frame_end=73
 m=Model(d).make()
 for sport in ['tennis','basketball','dodgeball','golf']:
  def b(name,bone,pos,size,c,rot=0):m.box(sport+'_'+name,bone,pos,size,c,rot)
  def t(name,bone,pos,bottom,top,height,c):m.taper(sport+'_'+name,bone,pos,bottom,top,height,c)
  color={'tennis':'f3eee1','basketball':d['accent'],'dodgeball':d['coat'],'golf':d['coat']}[sport]
  t('top','spine',(0,1.005,0),(.37,.27),(.47,.29),.40,color)
  b('neck','spine',(0,1.205,0),(.19,.035,.21),d['accent'])
  # Jersey numbers and side stripes distinguish basketball from training wear.
  if sport=='basketball':
   for x in [-.043,.043]:b('number','spine',(x,1.035,.153),(.025,.12,.012),WHITE)
   for s in [-1,1]:b('stripe','spine',(s*.203,.99,.03),(.025,.32,.29),WHITE)
  if sport in ['tennis','golf']:
   for s in [-1,1]:b('collar','spine',(s*.064,1.165,.16),(.09,.07,.025),WHITE,s*25)
   b('placket','spine',(0,1.095,.153),(.025,.095,.012),d['accent'])
   for y in [1.085,1.12]:b('button','spine',(0,y,.165),(.017,.017,.015),WHITE)
  if sport=='dodgeball':
   b('chest_band','spine',(0,1.06,.154),(.39,.07,.016),d['accent'])
   b('chest_patch','spine',(-.12,1.12,.171),(.06,.045,.018),WHITE)
  b('waist','pelvis',(0,.798,0),(.36,.17,.25),DARK)
  for s,side in [(-1,'R'),(1,'L')]:
   for bone,y,h in [('upper_arm',1.065,.235),('forearm',.872,.18)]:
    exposed=sport=='basketball' or bone=='forearm'
    b('skin' if exposed else 'sleeve',bone+'.'+side,(s*.302,y,0),(.16,h,.205),SKIN if exposed else color)
   b('skin','forearm.'+side,(s*.302,.722,.015),(.15,.12,.17),SKIN)
   b('skin','forearm.'+side,(s*.241,.73,.061),(.05,.065,.07),SKIN)
   if sport in ['tennis','dodgeball']:b('wristband','forearm.'+side,(s*.302,.80,0),(.17,.06,.215),d['accent'])
   b('shorts' if sport!='golf' else 'trousers','thigh.'+side,(s*.105,.63,0),(.177,.30,.20),DARK)
   b('skin' if sport!='golf' else 'trousers','shin.'+side,(s*.105,.302,0),(.151,.35,.18),SKIN if sport!='golf' else DARK)
   if sport!='golf':b('sock','shin.'+side,(s*.105,.19,0),(.16,.17,.19),WHITE)
   b('shoe','shin.'+side,(s*.105,.088,.05),(.20,.14,.30),WHITE)
   b('sole','shin.'+side,(s*.105,.026,.05),(.21,.035,.31),d['accent'])
   for y in [.09,.12]:b('lace','shin.'+side,(s*.105,y,.204),(.105,.015,.012),DARK)
 m.instantiate();m.animate()
 for (name,bone),obj in zip(m.parts,m.meshes):
  part=parts.setdefault(name,len(parts)+1)
  attr=obj.data.attributes.new('_PART','FLOAT','POINT')
  for v in attr.data:v.value=part
  tint=obj.data.attributes.new('_TINT','FLOAT','POINT')
  colors=obj.data.color_attributes['Color'];vertex_color={}
  for loop in obj.data.loops:vertex_color.setdefault(loop.vertex_index,colors.data[loop.index].color)
  for i,v in enumerate(tint.data):
   col=vertex_color[i];skin=namespace['color'](SKIN)
   if sum((col[k]-skin[k])**2 for k in range(3))<.0001:v.value=1
   elif name.startswith('hair') or name in ['long_hair','side_locks','top_bun'] or (name=='face' and obj.data.vertices[i].co.z>1.50):v.value=2
   elif name=='eyes':v.value=0
   elif name.endswith(('shorts','trousers','waist')) or name in ['legs','skirt','pleats','hem']:v.value=4
   elif name.endswith(('stripe','number','neck','collar','placket','wristband','chest_band','sole')):v.value=5
   elif name in ['skin','hands','thumb']:v.value=1
   elif name.endswith(('shoe','sock','lace')):v.value=0
   else:v.value=3
 bpy.ops.object.select_all(action='DESELECT')
 for obj in m.meshes:obj.select_set(True)
 bpy.context.view_layer.objects.active=m.meshes[0];bpy.ops.object.join();joined=bpy.context.object;joined.name='WardrobeHero';m.rig.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str((OUT/(d['id']+'.glb')).resolve()),export_format='GLB',use_selection=True,export_attributes=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_nla_strips=True,export_force_sampling=True,export_skins=True,export_yup=True,export_materials='EXPORT')
 report.append({'id':d['id'],'bytes':(OUT/(d['id']+'.glb')).stat().st_size})
 print('WARDROBE',d['id'],flush=True)
Path('src/three/wardrobeParts.json').write_text(json.dumps({v:k for k,v in parts.items()},ensure_ascii=False,indent=2)+'\n')
Path('assets/protagonists/sports-wardrobe.json').write_text(json.dumps({'generator':str(Path(__file__)),'designs':str(source.with_name('designs.json')),'models':report},indent=2)+'\n')
