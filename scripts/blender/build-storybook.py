"""Reproducible original storybook assets. Blender 4.3+, Z-up authoring, glTF Y-up export."""
import bpy, math, random, pathlib, json
from mathutils import Vector
random.seed(431)
ROOT=pathlib.Path(__file__).resolve().parents[2]
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
palette={'wood':'79513e','cream':'f2dbad','roof':'bb665b','leaf':'70996a','leaflight':'a2b879','pink':'dfa0ac','snow':'e7ece4','stone':'939b92','gold':'e4b766','teal':'63aaa1','soil':'977056','white':'faf0d6','blue':'90c3d3','dark':'473d41'}
M={}
for name,h in palette.items():
 m=bpy.data.materials.new(name);m.diffuse_color=tuple(int(h[i:i+2],16)/255 for i in (0,2,4))+(1,);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=m.diffuse_color;p.inputs['Roughness'].default_value=.84
 if name=='gold':p.inputs['Emission Color'].default_value=m.diffuse_color;p.inputs['Emission Strength'].default_value=.15
 M[name]=m
assets=[];parent=None

def asset(name):
 global parent
 parent=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(parent);assets.append(parent);return parent

def finish(o,name,mat,pos,scale):
 o.name=name;o.parent=parent;o.location=pos;o.scale=scale;o.data.materials.append(M[mat]);return o

def box(name,mat,pos,scale,bevel=.08):
 bpy.ops.mesh.primitive_cube_add(size=1);o=finish(bpy.context.object,name,mat,pos,scale)
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  mod=o.modifiers.new('Soft carved edges','BEVEL');mod.width=bevel;mod.segments=2;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 return o

def sphere(name,mat,pos,scale):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=1);o=finish(bpy.context.object,name,mat,pos,scale)
 for p in o.data.polygons:p.use_smooth=True
 return o

def cone(name,mat,pos,radius,depth,vertices=12,top=0):
 bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=radius,radius2=top,depth=depth);return finish(bpy.context.object,name,mat,pos,(1,1,1))

def timber(a,b,r=.06):
 a,b=Vector(a),Vector(b);o=cone('Timber','wood',(a+b)/2,r,(b-a).length,8,top=r*.8);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o

def cottage(name,roof='roof'):
 asset(name);box('Plaster','cream',(0,0,.8),(1.65,1.35,1.6),.07)
 for side in [-1,1]:
  panel=box('Roof',roof,(side*.48,0,1.85),(1.3,1.65,.16));panel.rotation_euler.y=side*math.radians(36)
 for x in [-.79,.79]:timber((x,-.68,.02),(x,-.68,1.6));timber((x,.68,.02),(x,.68,1.6))
 timber((-.8,-.7,1.5),(.8,-.7,1.5));timber((-.8,-.7,.1),(.8,-.7,.1));timber((0,-.7,1.5),(0,-.7,2.3))
 box('Door','wood',(0,-.697,.46),(.38,.08,.88));sphere('Door handle','gold',(.13,-.76,.45),(.04,.035,.04))
 for x in [-.5,.5]:
  box('Window frame','wood',(x,-.714,1.02),(.36,.08,.42));box('Warm glass','gold',(x,-.766,1.03),(.26,.018,.32));timber((x-.14,-.78,1.03),(x+.14,-.78,1.03),.017);timber((x,-.78,.87),(x,-.78,1.18),.017)
 box('Chimney','stone',(.5,.35,2.15),(.23,.26,.85));box('Chimney cap','cream',(.5,.35,2.59),(.33,.35,.11));box('Front step','stone',(0,-.9,.06),(.64,.4,.12))
 return parent

for name,color in [('oak','leaf'),('cherry','pink'),('autumn','gold')]:
 asset(name);cone('Trunk','wood',(0,0,.8),.14,1.6,10,top=.09)
 for i in range(5):
  a=i*2.4;z=1.5+(i%3)*.27;sphere('Leaf cushion',color,(math.cos(a)*.38,math.sin(a)*.38,z),(.55,.55,.52))
 for a in [0,2.1,4.2]:timber((0,0,.8),(math.cos(a)*.5,math.sin(a)*.5,1.7),.06)
for name,snow in [('pine',False),('snowpine',True)]:
 asset(name);cone('Trunk','wood',(0,0,.55),.11,1.1,10,top=.08)
 for i in range(3):
  cone('Needles','leaf',(0,0,1.0+i*.48),.64-i*.13,.95)
  if snow:cone('Snow cap','snow',(0,0,1.14+i*.48),.55-i*.12,.7)
asset('rock')
for pos,scale in [((0,0,.3),(.55,.42,.4)),((.36,.07,.16),(.3,.22,.24)),((-.32,-.16,.12),(.26,.22,.18))]:sphere('Weathered stone','stone',pos,scale)
asset('flowers')
for i in range(6):
 x,y=random.uniform(-.35,.35),random.uniform(-.25,.25);h=random.uniform(.18,.4);timber((x,y,0),(x,y,h),.014)
 for a in range(5):sphere('Petal','pink' if i%2 else 'white',(x+math.cos(a*1.257)*.055,y+math.sin(a*1.257)*.055,h),(.06,.04,.025))
 sphere('Pollen','gold',(x,y,h+.02),(.036,.036,.025))
asset('mushrooms')
for i in range(3):
 x,y=(i-1)*.2,i%2*.12;cone('Stem','cream',(x,y,.12),.04,.24,8,top=.03);sphere('Cap','roof',(x,y,.25),(.16,.16,.085));sphere('Dot','white',(x+.04,y,.32),(.026,.026,.012))
cottage('cottage');cottage('clubhouse','teal');cottage('snowcottage','blue')
asset('tower');cone('Tower','cream',(0,0,1.2),.7,2.4,12,top=.58);cone('Turret','roof',(0,0,2.8),.85,.95);cone('Finial','gold',(0,0,3.4),.05,.35)
for z in [.8,1.6]:box('Window','gold',(0,-.62,z),(.22,.04,.36))
asset('arch')
for x in [-.75,.75]:box('Carved column','stone',(x,0,.7),(.35,.38,1.4));box('Column cap','cream',(x,0,1.41),(.46,.48,.16))
box('Lintel','cream',(0,0,1.63),(1.95,.48,.25));sphere('Crest','gold',(0,-.26,1.6),(.18,.04,.16))
asset('lantern');cone('Post','wood',(0,0,.65),.045,1.3,8,top=.04);box('Glowing lamp','gold',(0,0,1.4),(.22,.22,.3));cone('Lamp roof','teal',(0,0,1.62),.19,.18,4);box('Lamp base','wood',(0,0,1.24),(.28,.28,.06))
asset('bridge')
for i in range(9):box('Deck plank','wood',(0,(i-4)*.2,.12),(1.2,.185,.14),.018)
for x in [-.65,.65]:
 for y in [-.85,0,.85]:timber((x,y,0),(x,y,.7),.05)
 timber((x,-.9,.6),(x,.9,.6),.04)
asset('bench');box('Seat','wood',(0,0,.4),(1.15,.4,.09));box('Backrest','teal',(0,.17,.66),(1.15,.09,.38))
for x in [-.42,.42]:
 for y in [-.12,.12]:box('Leg','wood',(x,y,.2),(.08,.08,.4))
asset('cactus');sphere('Stem','leaf',(0,0,.65),(.16,.16,.65))
for x in [-.3,.3]:timber((0,0,.55),(x,0,.55),.075);sphere('Arm','leaf',(x,0,.8),(.09,.09,.28))
asset('windmill');cone('Mill body','cream',(0,0,1),.65,2,12,top=.45);cone('Mill roof','teal',(0,0,2.3),.75,.7)
rotor=bpy.data.objects.new('WindmillRotor',None);bpy.context.collection.objects.link(rotor);rotor.parent=parent;rotor.location=(0,-.64,1.6)
for a in range(4):
 angle=a*math.pi/2;o=box('Windmill blade','wood',(math.cos(angle)*.52,-.7,1.6+math.sin(angle)*.52),(1.03,.06,.13),.018);o.parent=rotor;o.location=(math.cos(angle)*.52,-.06,math.sin(angle)*.52);o.rotation_euler.y=-angle
sphere('Rotor hub','gold',(0,-.76,1.6),(.13,.1,.13))
rotor.rotation_euler=(0,0,0);rotor.keyframe_insert('rotation_euler',frame=1);rotor.rotation_euler.y=2*math.pi;rotor.keyframe_insert('rotation_euler',frame=121)
for fc in rotor.animation_data.action.fcurves:
 for k in fc.keyframe_points:k.interpolation='LINEAR'
rotor.animation_data.action.name='WindmillTurn'
asset('butterfly');sphere('Body','wood',(0,0,0),(.025,.1,.025))
for side in [-1,1]:
 wing=bpy.data.objects.new('ButterflyWing'+str(side),None);bpy.context.collection.objects.link(wing);wing.parent=parent
 o=sphere('Painted wing','gold',(side*.11,0,0),(.13,.12,.015));o.parent=wing
 wing.rotation_euler.y=-side*.65;wing.keyframe_insert('rotation_euler',frame=1);wing.rotation_euler.y=side*.65;wing.keyframe_insert('rotation_euler',frame=11);wing.rotation_euler.y=-side*.65;wing.keyframe_insert('rotation_euler',frame=21);wing.animation_data.action.name='ButterflyFlutter'+str(side)
# Join stationary meshes by material per asset: a handful of instanced draw calls rather than one per petal.
for root in assets:
 if root.name in ['windmill','butterfly']:continue
 groups={}
 for o in list(root.children):
  if o.type=='MESH':groups.setdefault(o.active_material.name,[]).append(o)
 for mat,objects in groups.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object;o.name=root.name+'_'+mat
# Curate a clean authoring scene, exported origins remain world origin for placement.
bpy.context.scene.frame_set(1);bpy.context.scene.render.fps=30
out=ROOT/'public/models/storybook';out.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(out/'storybook-v1.glb'),export_format='GLB',export_animations=True,export_animation_mode='ACTIONS',export_extras=True)
for i,root in enumerate(assets):root.location=((i%6)*4,(i//6)*4,0)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/storybook/storybook.blend'))
(out/'catalog.json').write_text(json.dumps({'version':1,'style':'storybook-fantasy','creator':'Original Blender models for Learning Rogue','models':[r.name for r in assets],'animations':['WindmillTurn','ButterflyFlutter-1','ButterflyFlutter1']},indent=2)+'\n')
print('STORYBOOK_ASSETS_READY',len(assets))
